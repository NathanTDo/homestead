# Testing

How the project is tested, what each phase covers, and what is still checked by hand.

## Running the tests

| Command                                         | What it runs                                                                                                                                                 |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `npm test`                                      | All Jest unit tests. No database needed.                                                                                                                     |
| `TZ=Pacific/Auckland npm test`                  | Same, in another time zone. Date code must pass in every zone.                                                                                               |
| `npx tsc --noEmit`                              | Type check.                                                                                                                                                  |
| `npx eslint app src tests supabase/functions`   | Lint.                                                                                                                                                        |
| `python3 tests/e2e/phase5_calendar_tasks.py`    | Calendar queries and task completion check. Needs Docker and `supabase start`. It deletes all farms, crops and tasks in the local database.                  |
| `python3 tests/e2e/phase4_generate_schedule.py` | Edge Function end-to-end check. Needs Docker, `supabase start`, and `supabase functions serve`. It deletes all farms, crops and tasks in the local database. |

## Coverage by phase

**Automated** means a command above runs it. **Manual** means it was checked once by hand and is
not repeatable yet.

### Phase 1: Foundation

- Automated: `tests/smoke.test.tsx` (Jest and React Native Testing Library run).

### Phase 2: Database

- Automated: none.
- Manual (SQL in a rolled-back transaction, plus the Auth API): migrations apply; seed loads 15
  plants; signup creates a profile; the 6th planned or active crop is rejected; archiving frees
  a slot; a user cannot read, insert, update or delete another farm's data; the anon role gets no
  rows; a duplicate `generation_key` is rejected; a crop with tasks cannot be deleted.

### Phase 3: Onboarding and selection

- Automated (`tests/`):
  - `features/routeGuard.test.ts`: which route group a user belongs in.
  - `features/validation.test.ts`: sign-in and sign-up validation.
  - `features/survey.test.ts`: survey rules, farm name rules, the 5 starting-crop cap, error messages.
  - `features/plants.test.ts`: catalog search (case, partial match, special characters), image fallback.
  - `features/crops.test.ts`: the 5-crop limit helpers and error messages.
  - `routeGroups.test.ts`: every route group has an `index` screen (without one, `/` shows "not found").
- Manual (SQL and HTTP API): `create_farm_with_member` (bad input, double call, other users, no
  session, anon denied, rollback, starting crops); the crop limit over the API; farm and crop
  isolation between users. Screens were tried on a device.

### Phase 4: Templates and scheduling

- Automated (`tests/schedule/`, `tests/features/templates.test.ts`):
  - `schedule/dates.test.ts`: `addDays` (zero, null, negatives, month, year and leap-day
    boundaries, daylight saving dates, invalid input).
  - `schedule/schedule.test.ts`: milestones, recurring and one-time rules, generation keys,
    idempotency (a simulated `ON CONFLICT DO NOTHING`), ordering, size limits.
  - `schedule/clientDates.test.ts`: display formatting and local-day conversion for the date picker.
  - `features/templates.test.ts`: season ordering, template versions, description text, error messages.
- Automated end-to-end: `tests/e2e/phase4_generate_schedule.py` (see above).
- Manual: the template and date screens on a device (Phase 4 items 9.1 and 9.2).

### Phase 5: Calendar and tasks

- Automated (`tests/calendar/logic.test.ts`): month grid (leap February, six-row months,
  weekday alignment), month navigation across years, month date ranges (including December),
  grouping tasks by date, the dot and count indicators, task type colors and which tasks can be
  completed.
- Automated end-to-end: `tests/e2e/phase5_calendar_tasks.py` (month boundaries, plant filter,
  plant names, archived crops hidden, completing and un-completing a task and that it persists,
  other users blocked).
- Manual: the calendar, task list sheet and task detail screens on a device (Phase 5 section 9).

## Known gaps

- Phases 2 and 3 database and security checks are not saved as repeatable tests. Phase 6
  (REQ-001 to REQ-010) plans them as integration and security tests against the local database.
- There are no component tests for the screens yet.
- The calendar and task screens (Phase 5) have no tests yet.
