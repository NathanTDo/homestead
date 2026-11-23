# Homestead

A mobile app that helps people who grow food plan their season. You pick up to five crops, choose a
season and planting date for each, and Homestead builds a calendar of planting milestones, harvest
windows and recurring care tasks such as watering and fertilizing.

> The growing numbers in the app (days to germinate, mature and harvest, and how often to water
> or feed) are **illustrative placeholders**. They have not been checked against growing guides.
> See [Growing template system](#growing-template-system).

## What the app does

1. **Sign up and sign in** with email and password.
2. **Onboarding:** a short survey about your farm, then you name your farm and optionally pick up to
   5 crops to start with.
3. **Plants tab:** browse and search 15 crops, open one to read about it, add it to your farm (up to
   5 at a time) or remove it.
4. **Set up a schedule:** for a crop on your farm, choose a season and a planting date. The app builds
   the schedule on the server.
5. **Calendar tab:** a month view with dots and counts for days that have tasks (watering is blue,
   milestones are green, other care is orange), a green bar across each harvest window (it takes
   the place of dots for maturity and the window's first and last day), a plant filter, a list of
   each day's tasks, and a task page where you can mark watering, fertilizing and similar tasks
   done. Tap a day on the green bar to see its harvest window and what the bar stands for.
6. **Home tab:** a weather box showing the current temperature, sky and today's
   high and low for your farm's location.
7. **Profile tab:** your name, farm, farm location (zip code or city) and sign out.

## Tech stack

| Area                  | Choice                                                                 |
| --------------------- | ---------------------------------------------------------------------- |
| App                   | React Native 0.88 with Expo SDK 58, TypeScript (strict)                |
| Navigation            | Expo Router (file-based routes, tabs and stacks)                       |
| Backend               | Supabase: PostgreSQL, Auth, Edge Functions, Row Level Security         |
| Edge Function runtime | Deno                                                                   |
| Tests                 | Jest, React Native Testing Library, and a real local Supabase database |

## Prerequisites

- **Node.js 22.13 or newer.** Expo SDK 58 and React Native 0.88 accept 22.13 and up, 24.3 and up, and
  26 and up.
- **Docker.** Supabase runs locally in containers. This project was developed with Docker Desktop. A
  compatible runtime such as OrbStack or Colima should also work.
- **Supabase CLI.** On macOS: `brew install supabase/tap/supabase`. On Windows, use Scoop. See the
  [CLI install guide](https://supabase.com/docs/guides/local-development/cli/getting-started).
  Installing the CLI globally with `npm install -g supabase` is not supported.
- **A way to run the app:** the [Expo Go](https://expo.dev/go) app on your phone, or an iOS
  Simulator or Android emulator.

## Setup

### 1. Get the code

```bash
git clone https://github.com/NathanTDo/homestead.git
cd homestead
npm install
```

### 2. Start the local backend

Make sure Docker is running, then:

```bash
supabase start
```

The first run downloads several images and takes a few minutes. On a fresh start it applies every
migration in `supabase/migrations/` and loads `supabase/seed.sql` (the 15 plants, their growing
templates and care rules).

When it finishes, print the connection details at any time with:

```bash
supabase status -o env
```

To wipe the local database and rebuild it from the migrations and seed, run `supabase db reset`.
**This deletes every account and farm you created locally.**

### 3. Serve the Edge Function

Creating a schedule calls an Edge Function. Run this in its own terminal and leave it running:

```bash
supabase functions serve
```

Without it, "Create schedule" fails with a connection error.

### 4. Configure the app

```bash
cp .env.example .env
```

Fill in `.env` with the values from `supabase status -o env`:

```
EXPO_PUBLIC_SUPABASE_URL=<API_URL>
EXPO_PUBLIC_SUPABASE_ANON_KEY=<ANON_KEY or PUBLISHABLE_KEY>
```

Where the app runs decides the URL:

| App runs on                | `EXPO_PUBLIC_SUPABASE_URL`                                                     |
| -------------------------- | ------------------------------------------------------------------------------ |
| iOS Simulator              | `http://127.0.0.1:54321`                                                       |
| Android emulator           | `http://10.0.2.2:54321`                                                        |
| A physical phone (Expo Go) | `http://<your computer's LAN address>:54321`, with the phone on the same Wi-Fi |

On macOS, find your LAN address with `ipconfig getifaddr en0`. It can change when you switch
networks.

Only variables starting with `EXPO_PUBLIC_` reach the app. Never put the service role key in `.env`:
it bypasses all security rules, and nothing in the app uses it.

### 5. Start the app

```bash
npx expo start --clear
```

Scan the QR code with Expo Go, or press `i` (iOS Simulator) or `a` (Android emulator). Expo reads
`.env` only when it starts, so restart with `--clear` after you change it.

### 6. Try it

Sign up in the app. Email confirmation is off locally, so you are signed in right away. Finish
onboarding, add a crop, tap **Set up schedule**, and check the Calendar tab.

You can also browse the database in Supabase Studio at http://127.0.0.1:54323.

### Stopping

`supabase stop` stops the stack and keeps your data. `supabase start` brings it back.

## Scripts

| Command            | What it does                                              |
| ------------------ | --------------------------------------------------------- |
| `npm start`        | Start the Expo dev server                                 |
| `npm test`         | Unit and screen tests (no database needed)                |
| `npm run test:db`  | Integration and security tests against the local database |
| `npm run lint`     | ESLint                                                    |
| `npm run format`   | Prettier                                                  |
| `npx tsc --noEmit` | Type check                                                |

See [docs/TESTING.md](docs/TESTING.md) for what each test covers and how the database tests stay
safe for your own data.

## Project structure

```
homestead/
├── app/                          Screens. Each file is a route (Expo Router).
│   ├── _layout.tsx               Root: auth state, route guard, theme
│   ├── (auth)/                   login, signup
│   ├── (onboarding)/             welcome, survey, farm-name
│   └── (tabs)/                   The signed-in app
│       ├── index.tsx             Home
│       ├── plants/               Plant list, plant detail, template and date selection
│       ├── calendar/             Month calendar, task detail
│       └── profile.tsx           Profile and sign out
│
├── src/
│   ├── components/
│   │   ├── common/               Button, form fields, chips, date field, loading/error/empty states
│   │   ├── calendar/             Month grid, date cell, header, plant filter, task sheet
│   │   ├── plants/               Plant card and image, "Your Crops" panel
│   │   └── weather/              Weather widget for the home tab
│   ├── features/                 Logic grouped by topic (no direct database calls)
│   │   ├── auth/                 AuthProvider, route guard, validation, error messages
│   │   ├── farm/                 FarmProvider: the user's farm and crops, shared by all tabs
│   │   ├── onboarding/           Survey rules and answers
│   │   ├── plants/               Plant search and hooks
│   │   ├── crops/                The 5-crop limit and its messages
│   │   ├── templates/            Template choices and schedule error messages
│   │   ├── calendar/             Month grid, month math, grouping, calendar hooks
│   │   └── weather/              Weather hook, weather codes, warm/mild/cool logic
│   ├── repositories/             The only code that talks to Supabase (see Architecture)
│   ├── services/supabase/        The Supabase client
│   ├── services/weather/         Open-Meteo location lookup and forecast
│   ├── hooks/                    useAsyncData, useScreenPadding
│   ├── constants/                Colors, task types and their colors
│   ├── types/                    Database types
│   └── utils/                    Dates, error helpers, plant images
│
├── supabase/
│   ├── migrations/               Database schema, as ordered SQL files
│   ├── seed.sql                  The plant catalog, templates and care rules
│   ├── functions/
│   │   ├── generate-schedule/    Edge Function that builds a crop's schedule
│   │   └── _shared/              Date math and schedule building, shared with the app and tests
│   └── config.toml               Local Supabase settings
│
├── tests/                        Unit, screen, integration and security tests
├── docs/TESTING.md              What is tested and how
├── assets/                       Fonts and images
└── .kiro/                        Product decisions and the spec for each phase
```

## Architecture

### Data flow

```
Screen  ->  hook / feature logic  ->  repository  ->  Supabase client  ->  PostgreSQL (row level security)
                                            \->  Edge Function (schedules)
```

- **Screens never query the database.** They call hooks and repository functions. Everything that
  reads or writes data lives in `src/repositories/`, one file per area (farms, crops, plants,
  tasks, templates, profile, auth, schedule). Tests rely on this: they swap the Supabase client and run
  the real repository code.
- **The database enforces the rules**, not the app. Row level security limits every user to their own
  farm. The 5-crop limit is a database trigger. The app also checks these rules so it can show
  friendly messages, but removing those checks would not open a hole.
- **Sign-in state decides which screens exist.** `AuthProvider` loads the session and the user's
  profile and works out one of five states (`loading`, `error`, `auth`, `onboarding`, `app`). The root
  layout shows only the matching route group (`(auth)`, `(onboarding)` or `(tabs)`).
  A farm and its crops are loaded once by `FarmProvider` and shared by every tab.
- **Loading, errors and empty lists** use the shared `LoadingState`, `ErrorState` and `EmptyState`.
  A request that fails because the device is offline shows an offline message with a retry button.

### Database

| Table                             | Purpose                                                                                   |
| --------------------------------- | ----------------------------------------------------------------------------------------- |
| `profiles`                        | One per user. Display name and the onboarding answers.                                    |
| `farms`, `farm_members`           | A farm and who belongs to it. The MVP has one farm per user.                              |
| `plants`                          | The 15-crop catalog. Read-only for users.                                                 |
| `growing_templates`, `care_rules` | How each crop grows in a season, and its recurring care. Read-only.                       |
| `plant_watering_guidelines`       | How often to water each plant in warm, mild and cool weather. Read-only.                  |
| `farm_crops`                      | A plant on a farm: `planned` (chosen), `active` (has a schedule) or `archived` (removed). |
| `growing_tasks`                   | One row per scheduled task. A crop's schedule is simply its tasks.                        |

Rules worth knowing, all in `supabase/migrations/`:

- Signing up creates a profile automatically (`handle_new_user`).
- `create_farm_with_member` creates the farm, the owner membership, any starting crops and marks
  onboarding complete, all in one transaction. It takes the user from the session, never from the
  caller.
- A farm's location is saved from onboarding and owners change it with `update_farm_location`. Users
  cannot update `farms` directly.
- A farm can have at most 5 `planned` or `active` crops (`enforce_crop_limit`). It takes a lock per
  farm, so simultaneous requests cannot exceed the limit.
- Removing a crop **archives** it. Its tasks are kept, and a crop that has tasks cannot be deleted.
- Users can read and update their own tasks but cannot create them. Tasks are created only by the
  server through `generate_tasks`, which only the service role can run.

## Weather

The home tab shows the weather for the farm's location. The app looks the location up (a US zip code
or a place name) and fetches the weather from [Open-Meteo](https://open-meteo.com), which needs no
API key. Its free tier is for non-commercial use only. The text of the location is sent to Open-Meteo.
The weather is fetched each time the home tab loads and is not cached.

`plant_watering_guidelines` holds how often to water each plant in warm (average high of 75°F or more),
mild (60 to 75°F) and cool (below 60°F) weather. Nothing in the app shows these yet. They are for the
planned daily reminders feature. Like the growing templates, they are general guidance and have not
been checked against a local extension service. The seed file is the place to correct them.

## Growing template system

**Templates.** A template describes one plant in one season: days to germinate, to mature, and the
harvest window, all counted from the planting date. Each template has **care rules**, such as
"water every 2 days from day 0 to day 65" or "fertilize every 14 days from day 14 to day 50".
Plants can have a template for several seasons. The user picks one.

**The data is a placeholder.** Every seeded value is marked `Illustrative data - pending
verification` in `source_reference`, and the template screen tells the user so. Replace the numbers
in `supabase/seed.sql` (and add a new template version) before giving the app to real growers.

**Schedule generation.** When the user picks a season and planting date, the app saves them on the
crop and calls the `generate-schedule` Edge Function. The function:

1. Checks who is asking, and that the crop belongs to their farm.
2. Checks that the template is active and belongs to the crop's plant.
3. Works out the dates from the planting date:
   - **Milestones:** planting, germination, maturity, harvest start and harvest end.
   - **Care tasks:** one task per interval for each recurring rule, or a single task for a one-time
     rule.
4. Saves all tasks in one transaction and marks the crop `active`.

**Safe to repeat.** Every task has a key, `{crop id}:{task type}:{date}`, which must be unique. Asking
again for the same crop adds nothing, and a crop that already has a schedule gets its saved schedule
back unchanged. A crop is scheduled once.

**Versions.** Templates are never edited in place. A change is a new version row. A crop keeps the
template (and version) it was scheduled with, and tasks that already exist are never changed. New
crops are offered the latest version.

**Dates.** Dates are plain `YYYY-MM-DD` values, calculated in UTC, so a schedule is identical on any
device and any time zone, including across month ends, year ends and leap days. The date code in
`supabase/functions/_shared/` is used by the Edge Function, the app and the tests.

## Deployment

> **Not yet exercised.** This project has only been run locally. These steps come from the project's
> configuration and the Supabase and Expo documentation, and have not been run against a hosted
> project. Treat them as a checklist and expect to adjust.

### Supabase backend

1. Create a project at [supabase.com](https://supabase.com) and note its **project ref**.
2. Link and push the schema:

   ```bash
   supabase login
   supabase link --project-ref <project-ref>
   supabase db push --dry-run --remote     # preview the migrations
   supabase db push --remote               # apply them
   ```

3. **Load the catalog.** `db push` does not run `seed.sql`, and the app needs the plants, templates
   and care rules. Run the contents of `supabase/seed.sql` in the dashboard's SQL editor. It is safe to
   run more than once (tested). Do not use `db push --include-seed` on production: that flag is meant for
   development and staging projects.
4. **Deploy the function:**

   ```bash
   supabase functions deploy generate-schedule
   ```

   Hosted functions receive `SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY`
   automatically, so you set no secrets. Supabase lists the last two as "legacy" key names. If they are
   ever retired, update `supabase/functions/generate-schedule/index.ts` to use the new key variables.
   JWT checking is on for this function (`verify_jwt = true` in `config.toml`).

5. **Auth settings.** In the dashboard, under Authentication, turn **off** "Confirm email" for now. The
   sign-up screen has no "check your email" step. With confirmation on, a new user would be created
   but never signed in, and the button would keep spinning. Also review the minimum password length.
6. **Point the app at it.** In the build environment, set `EXPO_PUBLIC_SUPABASE_URL` to
   `https://<project-ref>.supabase.co` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` to the project's publishable
   (anon) key from the dashboard's API settings.

### Mobile app (Expo Application Services)

The app is not set up for store builds yet. Before the first build:

1. Create an [Expo account](https://expo.dev/signup) and install the build tool:
   `npm install --global eas-cli`, then `eas login`.
2. Run `eas build:configure`. This creates `eas.json`, which does not exist yet.
3. In `app.json`, set a unique `ios.bundleIdentifier` and `android.package` (neither is set today).
4. Add the two `EXPO_PUBLIC_` variables as
   [EAS environment variables](https://docs.expo.dev/eas/environment-variables) so builds can reach
   your hosted project.
5. Build, then submit:

   ```bash
   eas build --platform ios
   eas build --platform android
   ```

   Publishing to the App Store needs an Apple Developer Program membership, and the Play Store needs a
   Google Play developer account.

For testing on your own device, a [development build](https://docs.expo.dev/develop/development-builds/introduction)
(`npx expo install expo-dev-client`) is easier than a store build.

## Troubleshooting

| Problem                                                                                                        | Fix                                                                                                                                                  |
| -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `supabase start` fails pulling images with `docker-credential-desktop ... not found` (Docker Desktop on macOS) | Add `export PATH="$PATH:/Applications/Docker.app/Contents/Resources/bin"` to `~/.zshrc` and open a new terminal.                                     |
| The app says "Missing Supabase environment variables"                                                          | `.env` is missing, or its names are wrong. They must start with `EXPO_PUBLIC_`. Restart with `npx expo start --clear`.                               |
| "fetch failed" or "could not connect" on a phone                                                               | The URL in `.env` is `127.0.0.1`. Use your computer's LAN address (see Setup, step 4), and keep both on the same Wi-Fi.                              |
| "Create schedule" fails with a connection error                                                                | `supabase functions serve` is not running.                                                                                                           |
| "We could not find a farm for your account"                                                                    | The farm was deleted (for example by a database reset or a script). Tap **Set up my farm** to run onboarding again.                                  |
| "Native module is null" for AsyncStorage                                                                       | `@react-native-async-storage/async-storage` must be the version Expo pins (2.2.0). Run `npx expo install @react-native-async-storage/async-storage`. |
| Database tests refuse to run                                                                                   | They only run against a local database. Check `supabase status` and that Docker is running.                                                          |

## Known limitations

- The growing data is placeholder data (see above).
- Schedules are generated once per crop. There is no regeneration or editing of a schedule.
- Sign-up has no email confirmation step, so email confirmation must be off.
- A signed-in user can edit the fields of their own tasks through the API, not just mark them done. The
  app only changes the completed time. A database rule could restrict this.
- The MVP supports one farm per user and has no push notifications.
- The weather widget needs a farm location and a connection. The weather is in °F and is not cached.
- Only the calendar and plants screens have render tests. The other screens are checked by hand.
- The calendar week starts on Sunday.
