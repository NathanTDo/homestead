#!/usr/bin/env python3
"""End-to-end check of the calendar queries and task completion against the LOCAL Supabase stack.

Covers Phase 5: tasks for a month (including month, year and leap-day boundaries), the plant
filter, archived crops being hidden, the task detail query, completing and un-completing a
task (and that it persists), and that other users cannot read or change a farm's tasks.

Needs: Docker running and `supabase start`. Run: python3 tests/e2e/phase5_calendar_tasks.py
It creates its own users (p5a@/p5b@example.com) and WIPES all rows in farms, farm_crops and
growing_tasks afterwards, so use a throwaway local database only.
"""
import json, subprocess, urllib.request, urllib.error, urllib.parse

B = 'http://127.0.0.1:54321'
env = subprocess.run(['supabase', 'status', '-o', 'env'], capture_output=True, text=True).stdout
KEY = [l.split('=', 1)[1].strip().strip('"') for l in env.splitlines() if l.startswith(('ANON_KEY=', 'PUBLISHABLE_KEY='))][0]


def req(method, path, body=None, token=None, prefer=None, single=False):
    h = {'apikey': KEY, 'Content-Type': 'application/json'}
    if token: h['Authorization'] = 'Bearer ' + token
    if prefer: h['Prefer'] = prefer
    if single: h['Accept'] = 'application/vnd.pgrst.object+json'
    r = urllib.request.Request(B + path, data=json.dumps(body).encode() if body is not None else None, headers=h, method=method)
    try:
        with urllib.request.urlopen(r, timeout=60) as f:
            t = f.read().decode(); return f.status, (json.loads(t) if t else None)
    except urllib.error.HTTPError as e:
        t = e.read().decode()
        try: return e.code, json.loads(t)
        except Exception: return e.code, t


def sql(q):
    return subprocess.run(['docker', 'exec', 'supabase_db_homestead', 'psql', '-U', 'postgres', '-tA', '-c', q], capture_output=True, text=True).stdout.strip()


fails = []
def check(name, cond, detail=''):
    print(('PASS ' if cond else 'FAIL ') + name + ((' -> ' + str(detail)) if (detail and not cond) else ''))
    if not cond: fails.append(name)


def signup(email):
    return req('POST', '/auth/v1/signup', {'email': email, 'password': 'test-pass-123'})[1]['access_token']


SELECT = 'id,task_type,title,description,scheduled_date,completed_at,farm_crop_id,farm_crops!inner(id,plant_id,status,plants!inner(name))'
def month(token, frm, to, plant_id=None):
    q = f"/rest/v1/growing_tasks?select={urllib.parse.quote(SELECT, safe='(),!')}&scheduled_date=gte.{frm}&scheduled_date=lt.{to}&farm_crops.status=neq.archived&order=scheduled_date"
    if plant_id: q += f"&farm_crops.plant_id=eq.{plant_id}"
    return req('GET', q, None, token)


t1, t2 = signup('p5a@example.com'), signup('p5b@example.com')
req('POST', '/rest/v1/rpc/create_farm_with_member', {'p_farm_name': 'P5 Farm', 'p_onboarding_data': {'interested_produce': ['kale', 'peas']}}, t1)
crops = {c['plants']['slug']: c for c in req('GET', '/rest/v1/farm_crops?select=id,plant_id,plants(slug)', None, t1)[1]}
for c in crops.values(): sql(f"update farm_crops set status='active' where id='{c['id']}'")
def add(slug, typ, date, key, desc='Water the plants'):
    sql(f"insert into growing_tasks (farm_crop_id,task_type,title,description,scheduled_date,generation_key) values ('{crops[slug]['id']}','{typ}','{typ}','{desc}','{date}','{key}')")
add('kale', 'watering', '2025-12-31', 'k1'); add('kale', 'planting', '2026-01-01', 'k2'); add('kale', 'watering', '2026-01-31', 'k3')
add('kale', 'watering', '2026-02-01', 'k4'); add('kale', 'watering', '2024-02-29', 'k5')
add('peas', 'fertilizing', '2025-12-31', 'p1'); add('peas', 'watering', '2025-12-15', 'p2')

s, r = month(t1, '2025-12-01', '2026-01-01'); check('December has its 3 tasks, ordered', s == 200 and [t['scheduled_date'] for t in r] == ['2025-12-15', '2025-12-31', '2025-12-31'], r)
s, r = month(t1, '2026-01-01', '2026-02-01'); check('Jan 1 and Jan 31 are in January, Feb 1 is not', [t['scheduled_date'] for t in r] == ['2026-01-01', '2026-01-31'], r)
s, r = month(t1, '2024-02-01', '2024-03-01'); check('leap day Feb 29 is in February 2024', [t['scheduled_date'] for t in r] == ['2024-02-29'], r)
s, r = month(t1, '2025-12-01', '2026-01-01'); check('plant names are joined', {t['farm_crops']['plants']['name'] for t in r} == {'Kale', 'Peas'}, r)
s, r = month(t1, '2025-12-01', '2026-01-01', crops['peas']['plant_id']); check('plant filter returns only that plant', [t['farm_crops']['plants']['name'] for t in r] == ['Peas', 'Peas'], r)
s, r = month(t1, '2025-03-01', '2025-04-01'); check('an empty month returns an empty list', s == 200 and r == [], r)
s, r = month(t2, '2025-12-01', '2026-01-01'); check('another user sees no tasks', s == 200 and r == [], r)

# detail query
tid = sql(f"select id from growing_tasks where generation_key='k1'")
s, r = req('GET', f"/rest/v1/growing_tasks?select={urllib.parse.quote(SELECT, safe='(),!')}&id=eq.{tid}", None, t1)
check('task detail has plant name and description', len(r) == 1 and r[0]['farm_crops']['plants']['name'] == 'Kale' and r[0]['description'] == 'Water the plants', r)
check('another user cannot read the task', req('GET', f"/rest/v1/growing_tasks?select=id&id=eq.{tid}", None, t2)[1] == [])

# completion
s, r = req('PATCH', f"/rest/v1/growing_tasks?id=eq.{tid}", {'completed_at': '2025-12-31T09:30:00.000Z'}, t1, 'return=representation', single=True)
check('complete sets completed_at', s == 200 and r['completed_at'].startswith('2025-12-31T09:30:00'), (s, r))
check('completion persists on a fresh read', sql(f"select completed_at is not null from growing_tasks where id='{tid}'") == 't')
check('completing changes nothing else', sql(f"select scheduled_date||title||generation_key from growing_tasks where id='{tid}'") == '2025-12-31watering' + 'k1')
s, r = month(t1, '2025-12-01', '2026-01-01'); check('month query shows it as completed', [t['completed_at'] is not None for t in r if t['id'] == tid] == [True], r)
s, r = req('PATCH', f"/rest/v1/growing_tasks?id=eq.{tid}", {'completed_at': None}, t1, 'return=representation', single=True)
check('un-complete sets completed_at back to null', s == 200 and r['completed_at'] is None, (s, r))
s, r = req('PATCH', f"/rest/v1/growing_tasks?id=eq.{tid}", {'completed_at': '2025-12-31T10:00:00Z'}, t2, 'return=representation')
check('another user cannot complete the task (0 rows changed)', s == 200 and r == [] and sql(f"select completed_at is null from growing_tasks where id='{tid}'") == 't', (s, r))

# archived crops
sql(f"update farm_crops set status='archived' where id='{crops['peas']['id']}'")
s, r = month(t1, '2025-12-01', '2026-01-01'); check('archived crop tasks are hidden from the calendar', {t['farm_crops']['plants']['name'] for t in r} == {'Kale'}, r)
check('archived crop tasks are kept in the database', sql(f"select count(*) from growing_tasks where farm_crop_id='{crops['peas']['id']}'") == '2')

sql("delete from growing_tasks; delete from farm_crops; delete from farms; delete from auth.users where email like 'p5%@example.com'")
print('\nFAILED:', fails if fails else 'none')
