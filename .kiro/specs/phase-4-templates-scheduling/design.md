# Design: Phase 4 — Growing Templates and Schedule Generation

## Overview

Phase 4 implements the growing template system, template and planting date selection UI, and the `generate-schedule` Edge Function that calculates growing milestones and maintenance tasks relative to a planting date. After this phase, users can choose a season/template for their selected plants, pick a planting date, and generate a growing schedule that populates the calendar.

## Template Seeding

Templates are seeded via `supabase/seed.sql` (or a dedicated migration). Each plant gets at least one seasonal template. For the MVP, one template per plant is sufficient; multi-season templates can be added later.

### Example Seed

```sql
INSERT INTO growing_templates (plant_id, version, season, germination_days, maturity_days, harvest_start_days, harvest_end_days, source_reference, is_active)
SELECT id, 1, 'fall', 7, 60, 60, 75, 'Illustrative data — pending verification', true
FROM plants WHERE slug = 'garlic';
```

Care rules:

```sql
INSERT INTO care_rules (template_id, activity_type, description, start_day, interval_days, end_day)
VALUES
  (-- template_id, 'watering', 'Water regularly', 0, 2, 75),
  (-- template_id, 'fertilizing', 'Apply fertilizer', 14, 21, 60);
```

All values are illustrative. The `source_reference` field clearly marks them as unverified.

## Template Selection UI

### Flow

1. User taps a planned crop from "Your Crops" section
2. App navigates to template selection screen showing available templates for that plant
3. User selects a season/template
4. User selects a planting date (date picker)
5. App updates `farm_crops` with template_id, planting_date, selected_template_version
6. App calls the `generate-schedule` Edge Function
7. On success, crop status transitions to 'active' and tasks are created

### Screens

- `app/(tabs)/plants/[slug]/select-template.tsx` — shows available templates for the plant, each with season and duration info
- Date picker integrated on same screen or as a step after template selection

### Data Fetching

```typescript
function useTemplates(plantId: string) {
  return useSupabaseQuery(
    () => supabase
      .from('growing_templates')
      .select('*, care_rules(*)')
      .eq('plant_id', plantId)
      .eq('is_active', true)
      .order('season')
  );
}
```

## Edge Function: generate-schedule

### Location

`supabase/functions/generate-schedule/index.ts`

### Input

```json
{
  "farm_crop_id": "uuid"
}
```

The function reads the farm_crop to get template_id and planting_date, then fetches the template and care rules.

### Algorithm

```typescript
// 1. Authenticate user from JWT
const { user } = await getUserFromRequest(req);

// 2. Fetch farm_crop with farm membership check
const { data: crop } = await supabase
  .from('farm_crops')
  .select('*, farms!inner(farm_members!inner(user_id)')
  .eq('id', farm_crop_id)
  .eq('farms.farm_members.user_id', user.id)
  .single();

if (!crop) throw new Error('Unauthorized or crop not found');

// 3. Validate crop has template and planting date
if (!crop.template_id || !crop.planting_date) {
  throw new Error('Crop must have a template and planting date');
}

// 4. Fetch template and care rules
const { data: template } = await supabase
  .from('growing_templates')
  .select('*, care_rules(*)')
  .eq('id', crop.template_id)
  .single();

// 5. Calculate milestone tasks
const plantingDate = new Date(crop.planting_date);
const milestones = [
  { task_type: 'planting', title: 'Planting', date: plantingDate },
  { task_type: 'germination', title: 'Germination', date: addDays(plantingDate, template.germination_days) },
  { task_type: 'maturity', title: 'Expected maturity', date: addDays(plantingDate, template.maturity_days) },
  { task_type: 'harvest_start', title: 'Harvest window begins', date: addDays(plantingDate, template.harvest_start_days) },
  { task_type: 'harvest_end', title: 'Harvest window ends', date: addDays(plantingDate, template.harvest_end_days) },
];

// 6. Calculate maintenance tasks from care rules
const maintenanceTasks = [];
for (const rule of template.care_rules) {
  if (rule.interval_days) {
    // Recurring: from start_day to end_day every interval_days
    for (let day = rule.start_day; day <= rule.end_day; day += rule.interval_days) {
      maintenanceTasks.push({
        task_type: rule.activity_type,
        title: capitalize(rule.activity_type),
        date: addDays(plantingDate, day),
        description: rule.description,
      });
    }
  } else {
    // One-time: at start_day
    maintenanceTasks.push({
      task_type: rule.activity_type,
      title: capitalize(rule.activity_type),
      date: addDays(plantingDate, rule.start_day),
      description: rule.description,
    });
  }
}

// 7. Build task rows with generation keys
const allTasks = [...milestones, ...maintenanceTasks].map(t => ({
  farm_crop_id: farm_crop_id,
  task_type: t.task_type,
  title: t.title,
  description: t.description,
  scheduled_date: t.date.toISOString().split('T')[0],
  generation_key: `${farm_crop_id}:${t.task_type}:${t.date.toISOString().split('T')[0]}`,
}));

// 8. Insert transactionally with idempotency
const { error } = await supabase
  .from('growing_tasks')
  .insert(allTasks)
  .select();

// ON CONFLICT handled by unique constraint on generation_key
// If using service-role client, use .upsert with onConflict

// 9. Update crop status to active
await supabase
  .from('farm_crops')
  .update({ status: 'active', selected_template_version: template.version })
  .eq('id', farm_crop_id);

// 10. Return generated schedule
return { tasks: allTasks, crop_status: 'active' };
```

### Date Calculation Utility

```typescript
function addDays(date: Date, days: number | null): Date {
  if (days === null || days === undefined) return date;
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
```

### Transaction Handling

The Edge Function uses the service-role client for database writes (bypassing RLS) since it has already validated authorization. The insert uses the unique constraint on `generation_key` for idempotency. If using `ON CONFLICT DO NOTHING`, duplicate keys are silently skipped.

For true transactional behavior (all-or-nothing), the insert can be wrapped in a Postgres function that the Edge Function calls via RPC:

```sql
CREATE OR REPLACE FUNCTION generate_tasks(p_tasks JSONB)
RETURNS void AS $$
BEGIN
  INSERT INTO growing_tasks (farm_crop_id, task_type, title, description, scheduled_date, generation_key)
  SELECT
    (t->>'farm_crop_id')::uuid,
    t->>'task_type',
    t->>'title',
    t->>'description',
    (t->>'scheduled_date')::date,
    t->>'generation_key'
  FROM jsonb_array_elements(p_tasks) AS t
  ON CONFLICT (generation_key) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

This ensures all inserts succeed or fail together within a single transaction.

## Template Versioning

When a schedule is generated:
1. The Edge Function reads the template at its current version
2. The version is stored in `farm_crops.selected_template_version`
3. If the template is later updated (new version inserted), existing crops and tasks are unaffected
4. New crops created after the update use the new version

No UPDATE operations are performed on growing_templates — new versions are INSERTed, preserving history.

## Out of Scope for Phase 4

- Calendar UI for viewing generated tasks (Phase 5)
- Task completion UI (Phase 5)
- Schedule regeneration (deferred to v1.1)
- Weather-adjusted schedules (future)
