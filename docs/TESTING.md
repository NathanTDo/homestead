# Testing

How the project is tested, what each phase covers, and what is still checked by hand.

## Running the tests

| Command                        | What it runs                                                           |
| ------------------------------ | ---------------------------------------------------------------------- |
| `npm test`                     | Unit tests. No database needed.                                        |
| `TZ=Pacific/Auckland npm test` | Same, in another time zone. Date code must pass in every zone.         |
| `npm run test:db`              | Integration and security tests against the local database (see below). |
| `npm run test:integration`     | Only the integration tests.                                            |
| `npm run test:security`        | Only the security tests.                                               |
| `npx tsc --noEmit`             | Type check.                                                            |
| `npm run lint`                 | Lint.                                                                  |

## Database tests

The integration and security tests run the app's real repository code against your local Supabase
database, as real signed-in users. They need:

1. Docker running and `supabase start`.
2. `supabase functions serve` in another terminal. The schedule tests call the real Edge Function.

How they stay safe:

- They refuse to run unless the database is on this machine (`localhost` or `127.0.0.1`).
- They never reset the database. Each test file creates its own users (emails starting with
  `it-`) and removes only those users and what they own. Your own account and data are untouched.
- If a run is interrupted, leftover test users can be removed by hand. They are the ones with
  `it-` emails in Studio's Authentication tab.

How they work: `jest.integration.config.js` swaps `src/services/supabase/client` for a client
belonging to the test user (`as(user)` in `tests/integration/helpers/testData.ts`). It uses plain
Node, not the Expo Jest preset, because that preset replaces `fetch` with a React Native version
that does not use the real network.

## Coverage by phase

**Automated** means a command above runs it. **Manual** means it was checked by hand.

### Phase 1: Foundation

- Automated: `tests/smoke.test.tsx` (Jest and React Native Testing Library run).

### Phase 2: Database

- Automated (`tests/integration`, `tests/security`): see the Phase 6 section. Row level security,
  the five-crop limit, farm creation and the catalog rules are all covered there.
- Manual: migrations apply with `supabase db reset`, and the seed loads 15 plants.

### Phase 3: Onboarding and selection

- Unit (`tests/`): `features/routeGuard`, `features/validation`, `features/survey`,
  `features/plants`, `features/crops`, and `routeGroups` (every route group needs an `index`
  screen, or `/` shows "not found").
- Integration: `farm-creation` and `plant-selection`.
- Manual: the screens on a device.

### Phase 4: Templates and scheduling

- Unit: `schedule/dates`, `schedule/schedule`, `schedule/clientDates`, `features/templates`.
  Month, year and leap-day boundaries, daylight saving dates, recurring and one-time rules, keys.
- Integration: `schedule-generation` (correct dates and counts from the template's own numbers,
  repeat runs, wrong or inactive templates, removed crops, other users, bad requests, template
  versions).
- Manual: the template and date screens on a device.

### Phase 5: Calendar and tasks

- Unit: `calendar/logic` (grid, month navigation and ranges, indicators, task types) and
  `hooks/useAsyncData` (including that `refresh` keeps the same identity between renders, which
  stopped the calendar's focus effect from looping).
- Integration: `calendar` and `task-completion`.
- Manual: the calendar, task sheet and task detail on a device.

### Phase 6: Integration and security (`tests/integration`, `tests/security`)

| Spec item                                | Test file                                                    |
| ---------------------------------------- | ------------------------------------------------------------ |
| REQ-001 farm creation                    | `integration/farm-creation`                                  |
| REQ-002 plant selection and limit        | `integration/plant-selection`                                |
| REQ-003 schedule generation              | `integration/schedule-generation`                            |
| REQ-004 duplicate prevention             | `integration/schedule-generation`                            |
| REQ-005 task completion                  | `integration/task-completion`                                |
| REQ-006 calendar retrieval               | `integration/calendar`                                       |
| REQ-007 farm isolation                   | `security/farm-isolation`                                    |
| REQ-008 unauthorized crop creation       | `security/unauthorized-crop-creation`                        |
| REQ-009 five-crop bypass                 | `security/five-crop-bypass` (includes simultaneous requests) |
| REQ-010 unauthenticated access           | `security/unauthenticated-access`                            |
| Catalog tables and server-only functions | `security/catalog-and-functions`                             |

The security tests were checked by breaking each protection on purpose (row level security off,
the limit trigger dropped, anonymous read access added) and confirming the tests fail.

## Known gaps

- There are no component tests for the screens. Problems that only appear when a screen renders
  (such as the calendar render loop) are caught by hand.
- Screen sizes (iPhone SE to Pro Max) are checked by hand on a device.
