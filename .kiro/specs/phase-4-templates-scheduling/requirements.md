# Requirements: Phase 4 — Growing Templates and Schedule Generation

## 1. Growing Template Data

### REQ-001: Template Seeding
The system shall seed at least one growing template per plant in the initial catalog (15 plants). Each template shall include: season, germination_days, maturity_days, harvest_start_days, harvest_end_days, and source_reference.

### REQ-002: Care Rule Seeding
The system shall seed care rules for each growing template, including at least watering and fertilizing rules. Care rules shall specify activity_type, start_day, interval_days (for recurring), and end_day.

### REQ-003: Template Data Disclaimer
All seeded growing data shall use clearly identified illustrative values. The source_reference field shall note that values are placeholders pending agricultural verification.

### REQ-004: Template Activation
Only templates with `is_active = true` shall be presented to users for selection.

## 2. Template Selection UI

### REQ-005: Template Selection Screen
When a user adds a plant with multiple available templates (seasons), the system shall present a template selection screen showing the available seasons for that plant. If only one template exists, it shall be selected by default.

### REQ-006: Template Details Display
The template selection screen shall display the season, germination duration, maturity duration, and harvest window for each available template.

### REQ-007: Planting Date Selection
After selecting a template, the system shall prompt the user to select a planting date. The planting date can be any date — not restricted to the current season.

### REQ-008: Crop Update on Selection
When the user confirms a template and planting date, the system shall update the `farm_crop` with the selected `template_id`, `planting_date`, and `selected_template_version`.

## 3. Schedule Generation

### REQ-009: Edge Function — generate-schedule
The system shall implement a Supabase Edge Function (`generate-schedule`) that receives a `farm_crop_id`, authenticates the user, validates farm membership, retrieves the growing template and care rules, calculates growing milestones and maintenance tasks, and persists them to the database.

### REQ-010: Growing Milestone Calculation
The Edge Function shall calculate milestone tasks relative to the planting date:
- Planting: planting_date
- Germination: planting_date + germination_days
- Transplanting: planting_date + transplant_days (if applicable)
- Maturity: planting_date + maturity_days
- Harvest start: planting_date + harvest_start_days
- Harvest end: planting_date + harvest_end_days

### REQ-011: Maintenance Task Generation
The Edge Function shall generate recurring maintenance tasks from care rules. For each care rule with a non-null interval_days, tasks shall be generated from start_day to end_day in increments of interval_days. For one-time care rules (null interval_days), a single task shall be generated at start_day.

### REQ-012: Transactional Persistence
The Edge Function shall insert all generated tasks in a single transaction. If any insert fails, no tasks shall be persisted.

### REQ-013: Idempotent Generation
The Edge Function shall use `ON CONFLICT (generation_key) DO NOTHING` to prevent duplicate task generation. Re-running schedule generation for the same crop shall not create duplicate tasks or overwrite existing tasks.

### REQ-014: Generation Key Format
Each task shall have a generation_key in the format `{farm_crop_id}:{task_type}:{scheduled_date}`.

### REQ-015: Template Version Locking
The Edge Function shall record the template version in `farm_crops.selected_template_version` at generation time. If the template is later updated to a new version, existing tasks shall not be affected.

### REQ-016: Crop Status Transition
After successful schedule generation, the Edge Function shall update the `farm_crops` status from 'planned' to 'active'.

### REQ-017: Server-Side Authorization
The Edge Function shall authenticate the user from the JWT and verify that the user is a member of the farm that owns the crop before generating the schedule.

### REQ-018: Server-Side Validation
The Edge Function shall validate that the farm_crop has a template_id and planting_date before generating. If either is missing, it shall return an error.

## 4. Automated Tests

### REQ-019: Date Calculation Tests
The system shall include unit tests for growing date calculations, including: germination date, maturity date, harvest window start and end, and recurring task date sequences.

### REQ-020: Idempotency Tests
The system shall include tests verifying that running schedule generation twice for the same crop produces no duplicate tasks.

### REQ-021: Date Boundary Tests
The system shall include tests for edge cases: planting on the first or last day of a month, tasks spanning month boundaries, and leap year dates.
