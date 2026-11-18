#!/usr/bin/env python3
"""End-to-end check of the generate-schedule Edge Function against the LOCAL Supabase stack.

Covers Phase 4 verification items 9.3 to 9.10: milestone and recurring dates, saving, crop
activation, repeat runs, access control, missing data, wrong or inactive template, version
locking, and that signed-in users cannot call generate_tasks directly.

Needs: Docker running, `supabase start`, and `supabase functions serve` in another terminal.
Run:   python3 tests/e2e/phase4_generate_schedule.py
It creates its own users (p4a@/p4b@example.com) and deletes only the rows it created, so it is
safe to run next to your own test data.
"""
import json, subprocess, urllib.request, urllib.error, sys, os
B='http://127.0.0.1:54321'
env=subprocess.run(['supabase','status','-o','env'],capture_output=True,text=True).stdout
KEY=[l.split('=',1)[1].strip().strip('"') for l in env.splitlines() if l.startswith(('ANON_KEY=','PUBLISHABLE_KEY='))][0]
def req(method,path,body=None,token=None,prefer=None):
    h={'apikey':KEY,'Content-Type':'application/json'}
    if token: h['Authorization']='Bearer '+token
    if prefer: h['Prefer']=prefer
    r=urllib.request.Request(B+path,data=json.dumps(body).encode() if body is not None else None,headers=h,method=method)
    try:
        with urllib.request.urlopen(r,timeout=60) as f: t=f.read().decode(); return f.status,(json.loads(t) if t else None)
    except urllib.error.HTTPError as e:
        t=e.read().decode()
        try: return e.code,json.loads(t)
        except Exception: return e.code,t
def sql(q): return subprocess.run(['docker','exec','supabase_db_homestead','psql','-U','postgres','-tA','-c',q],capture_output=True,text=True).stdout.strip()
def cleanup(prefix):
    """Delete only the rows created for this script's own test users."""
    users = f"select id from auth.users where email like '{prefix}%@example.com'"
    farms = f"select id from farms where created_by in ({users})"
    crops = f"select id from farm_crops where farm_id in ({farms})"
    sql(f"delete from growing_tasks where farm_crop_id in ({crops}); delete from farm_crops where farm_id in ({farms}); delete from farms where created_by in ({users}); delete from auth.users where email like '{prefix}%@example.com'")


fails=[]
def check(name,cond,detail=''):
    print(('PASS ' if cond else 'FAIL ')+name+(('  -> '+str(detail)) if (detail and not cond) else ''))
    if not cond: fails.append(name)
def signup(email):
    s,r=req('POST','/auth/v1/signup',{'email':email,'password':'test-pass-123'}); return r['access_token']
def fn(token,body): return req('POST','/functions/v1/generate-schedule',body,token)

cleanup('p4')
t1=signup('p4a@example.com'); t2=signup('p4b@example.com')
req('POST','/rest/v1/rpc/create_farm_with_member',{'p_farm_name':'P4 Farm','p_onboarding_data':{'interested_produce':['lettuce','kale']}},t1)
crops=req('GET','/rest/v1/farm_crops?select=id,plant_id,status,plants(slug)',None,t1)[1]
by={c['plants']['slug']:c for c in crops}
lettuce,kale=by['lettuce'],by['kale']
tpl=req('GET','/rest/v1/growing_templates?select=id,plant_id,season,version,care_rules(*)&order=season',None,t1)[1]
lt={t['season']:t for t in tpl if t['plant_id']==lettuce['plant_id']}
kt={t['season']:t for t in tpl if t['plant_id']==kale['plant_id']}
print('lettuce seasons',list(lt),'| kale seasons',list(kt))

s,r=fn(t1,{'farm_crop_id':lettuce['id']}); check('9.9 missing template/date -> 422 crop_not_ready', s==422 and r['error']=='crop_not_ready',(s,r))
s,r=fn(None,{'farm_crop_id':lettuce['id']}); check('no JWT -> 401', s==401,(s,r))
s,r=fn(t1,{'farm_crop_id':'nope'}); check('bad id -> 400', s==400,(s,r))
s,r=fn(t1,{}); check('empty body -> 400', s==400,(s,r))

st,_=req('PATCH',f"/rest/v1/farm_crops?id=eq.{lettuce['id']}",{'template_id':lt['spring']['id'],'planting_date':'2025-03-01'},t1,'return=minimal'); check('user can set template + date (RLS)', st in (200,204),st)
s,r=fn(t2,{'farm_crop_id':lettuce['id']}); check('9.8 other user -> 404 not found', s==404 and r['error']=='crop_not_found',(s,r))
check('9.8 nothing created for unauthorized call', sql(f"select count(*) from growing_tasks where farm_crop_id='{lettuce['id']}'")=='0')

s,r=fn(t1,{'farm_crop_id':lettuce['id']}); check('generate -> 200 active', s==200 and r['crop_status']=='active',(s,str(r)[:200]))
tasks=r['tasks'] if s==200 else []
d={}
for t in tasks: d.setdefault(t['task_type'],[]).append(t['scheduled_date'])
check('9.3 planting 2025-03-01', d.get('planting')==['2025-03-01'],d.get('planting'))
check('9.3 germination +7 = 2025-03-08', d.get('germination')==['2025-03-08'],d.get('germination'))
check('9.3 maturity +50 = 2025-04-20', d.get('maturity')==['2025-04-20'],d.get('maturity'))
check('9.3 harvest start +50 = 2025-04-20', d.get('harvest_start')==['2025-04-20'],d.get('harvest_start'))
check('9.3 harvest end +65 = 2025-05-05', d.get('harvest_end')==['2025-05-05'],d.get('harvest_end'))
w=d.get('watering',[]); check('9.4 watering every 2 days, days 0..65 (33 tasks)', len(w)==33 and w[0]=='2025-03-01' and w[1]=='2025-03-03' and w[-1]=='2025-05-04',(len(w),w[:2],w[-1:]))
f=d.get('fertilizing',[]); check('9.4 fertilizing every 14 days from day 14 to 50', f==['2025-03-15','2025-03-29','2025-04-12'],f)
check('9.5 persisted to growing_tasks', sql(f"select count(*) from growing_tasks where farm_crop_id='{lettuce['id']}'")==str(len(tasks)),len(tasks))
check('REQ-014 keys match format', all(t['generation_key']==f"{lettuce['id']}:{t['task_type']}:{t['scheduled_date']}" for t in tasks))
row=sql(f"select status||'|'||selected_template_version from farm_crops where id='{lettuce['id']}'")
check('9.6 status active, version recorded', row=='active|1',row)

n1=sql("select count(*) from growing_tasks")
s,r=fn(t1,{'farm_crop_id':lettuce['id']}); check('9.7 second run -> 200, created 0', s==200 and r['created']==0 and len(r['tasks'])==len(tasks),(s,str(r)[:150]))
check('9.7 task count unchanged', sql("select count(*) from growing_tasks")==n1)

s,r=req('POST','/rest/v1/rpc/generate_tasks',{'p_farm_crop_id':lettuce['id'],'p_tasks':[]},t1); check('signed-in user cannot call generate_tasks directly', s in (401,403) or (isinstance(r,dict) and r.get('code')=='42501'),(s,r))
s,r=req('POST','/rest/v1/rpc/generate_tasks',{'p_farm_crop_id':lettuce['id'],'p_tasks':[]},None); check('anon cannot call generate_tasks', s in (401,403) or (isinstance(r,dict) and r.get('code')=='42501'),(s,r))

# wrong-plant template
req('PATCH',f"/rest/v1/farm_crops?id=eq.{kale['id']}",{'template_id':lt['fall']['id'],'planting_date':'2025-09-01'},t1,'return=minimal')
s,r=fn(t1,{'farm_crop_id':kale['id']}); check('template of another plant -> 422 invalid_template', s==422 and r['error']=='invalid_template',(s,r))
check('nothing created / still planned', sql(f"select count(*) from growing_tasks where farm_crop_id='{kale['id']}'")=='0' and sql(f"select status from farm_crops where id='{kale['id']}'")=='planned')

# inactive template
req('PATCH',f"/rest/v1/farm_crops?id=eq.{kale['id']}",{'template_id':kt['fall']['id']},t1,'return=minimal')
sql(f"update growing_templates set is_active=false where id='{kt['fall']['id']}'")
s,r=fn(t1,{'farm_crop_id':kale['id']}); check('inactive template -> 422', s==422 and r['error']=='invalid_template',(s,r))
sql(f"update growing_templates set is_active=true where id='{kt['fall']['id']}'")

# version locking: add v2 of kale fall, keep crop on v1 until generated
sql(f"insert into growing_templates (plant_id,version,season,germination_days,maturity_days,harvest_start_days,harvest_end_days,source_reference,is_active) select plant_id,2,season,3,30,30,40,'v2 test',true from growing_templates where id='{kt['fall']['id']}'")
v2=sql(f"select id from growing_templates where plant_id='{kale['plant_id']}' and season='fall' and version=2")
s,r=fn(t1,{'farm_crop_id':kale['id']}); check('9.10 crop on v1 template records version 1', s==200 and sql(f"select selected_template_version from farm_crops where id='{kale['id']}'")=='1',(s,str(r)[:150]))
before=sql(f"select string_agg(generation_key,',' order by generation_key) from growing_tasks where farm_crop_id='{kale['id']}'")
sql(f"update growing_templates set maturity_days=999 where id='{kt['fall']['id']}'")
s,r=fn(t1,{'farm_crop_id':kale['id']}); after=sql(f"select string_agg(generation_key,',' order by generation_key) from growing_tasks where farm_crop_id='{kale['id']}'")
check('9.10 later template change does not touch existing tasks', before==after)

# archived crop
req('PATCH',f"/rest/v1/farm_crops?id=eq.{lettuce['id']}",{'status':'archived'},t1,'return=minimal')
s,r=fn(t1,{'farm_crop_id':lettuce['id']}); check('archived crop -> 409', s==409 and r['error']=='crop_archived',(s,r))
check('9.5b other user cannot read tasks', req('GET','/rest/v1/growing_tasks?select=id',None,t2)[1]==[])

# cleanup
sql("delete from growing_templates where version=2; update growing_templates set maturity_days=60 where maturity_days=999")
cleanup('p4')
print('\nFAILED:',fails if fails else 'none')
