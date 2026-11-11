# Tasks: Phase 4 — Growing Templates and Schedule Generation

## 1. Seed Growing Templates

- [ ] 1.1 Create seed data for at least one growing template per plant (15 plants)
- [ ] 1.2 Include season, germination_days, maturity_days, harvest_start_days, harvest_end_days
- [ ] 1.3 Set source_reference to "Illustrative data — pending verification" for all templates
- [ ] 1.4 Seed care rules for each template (at minimum: watering with interval, fertilizing with interval)
- [ ] 1.5 Run seed against local database and verify templates and care rules exist

## 2. Template Selection UI

- [ ] 2.1 Create template selection screen showing available templates for a plant
- [ ] 2.2 Display season, germination duration, maturity duration, and harvest window for each template
- [ ] 2.3 Create `useTemplates(plantId)` hook fetching active templates with care rules
- [ ] 2.4 Implement template selection (tap to select a season)
- [ ] 2.5 If only one template exists, auto-select it

## 3. Planting Date Selection

- [ ] 3.1 Add date picker for planting date selection
- [ ] 3.2 Allow any date (not restricted to current season)
- [ ] 3.3 Validate that a date is selected before proceeding

## 4. Crop Update

- [ ] 4.1 Update `farm_crops` with template_id, planting_date, and selected_template_version via `cropRepository.updateCropSchedule()`
- [ ] 4.2 Handle update errors gracefully

## 5. Edge Function — generate-schedule

- [ ] 5.1 Create `supabase/functions/generate-schedule/index.ts`
- [ ] 5.2 Implement JWT authentication and user extraction
- [ ] 5.3 Implement farm membership validation (user belongs to crop's farm)
- [ ] 5.4 Validate crop has template_id and planting_date
- [ ] 5.5 Fetch growing template and care rules
- [ ] 5.6 Implement growing milestone calculation (planting, germination, maturity, harvest_start, harvest_end)
- [ ] 5.7 Implement recurring maintenance task generation from care rules
- [ ] 5.8 Implement one-time maintenance task generation (null interval_days)
- [ ] 5.9 Build generation_key for each task: `{farm_crop_id}:{task_type}:{scheduled_date}`
- [ ] 5.10 Create `generate_tasks` Postgres function for transactional insert with ON CONFLICT DO NOTHING
- [ ] 5.11 Call the RPC from the Edge Function
- [ ] 5.12 Update farm_crop status to 'active' and set selected_template_version
- [ ] 5.13 Return generated schedule (task list) in the response

## 6. Client-Side Integration

- [ ] 6.1 Create service to call the `generate-schedule` Edge Function from the app
- [ ] 6.2 After crop update (template + date), call generate-schedule
- [ ] 6.3 Show loading state during generation
- [ ] 6.4 Show success message and navigate back to plants tab
- [ ] 6.5 Handle generation errors (display message, keep crop in 'planned' status)

## 7. Date Utility Functions

- [ ] 7.1 Create `src/utils/dates.ts` with `addDays(date, days)` function
- [ ] 7.2 Create `formatDate(date)` helper for display
- [ ] 7.3 Add TypeScript types for schedule generation input/output

## 8. Unit Tests

- [ ] 8.1 Test `addDays` with various inputs including null and zero
- [ ] 8.2 Test milestone calculations (germination, maturity, harvest start/end)
- [ ] 8.3 Test recurring task generation (correct number of tasks, correct intervals)
- [ ] 8.4 Test one-time task generation
- [ ] 8.5 Test date boundary cases (month boundary, leap day, year boundary)
- [ ] 8.6 Test idempotency: running generation twice produces no new tasks
- [ ] 8.7 Test generation_key format

## 9. Verification

- [ ] 9.1 User can select a template/season for a planned crop
- [ ] 9.2 User can select a planting date (any date)
- [ ] 9.3 Edge Function generates milestone tasks with correct dates
- [ ] 9.4 Edge Function generates recurring maintenance tasks with correct intervals
- [ ] 9.5 Tasks are persisted to growing_tasks table
- [ ] 9.6 Crop status transitions from 'planned' to 'active'
- [ ] 9.7 Re-running generation does not create duplicate tasks
- [ ] 9.8 Unauthorized user cannot generate schedule for another farm's crop
- [ ] 9.9 Generation fails gracefully if template or planting date is missing
- [ ] 9.10 Template version is locked at generation time
