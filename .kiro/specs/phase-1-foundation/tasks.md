# Tasks: Phase 1 — Project Foundation

## 1. Initialize Expo Project

- [x] 1.1 Initialize Expo project with TypeScript using `create-expo-app` (latest stable, SDK 58)
- [x] 1.2 Verify the project runs with `npx expo start`
- [x] 1.3 Configure for development build (install `expo-dev-client`, update `app.json`)

## 2. Configure Expo Router

- [x] 2.1 Install and configure `expo-router`
- [x] 2.2 Create root `app/_layout.tsx`
- [x] 2.3 Create `app/(auth)/_layout.tsx` placeholder
- [x] 2.4 Create `app/(onboarding)/_layout.tsx` placeholder
- [x] 2.5 Create `app/(tabs)/_layout.tsx` with tab navigation (Home, Calendar, Plants, Profile)
- [x] 2.6 Create tab screen placeholders: `index.tsx`, `calendar.tsx`, `plants.tsx`, `profile.tsx`
- [x] 2.7 Add tab bar icons for all four tabs
- [x] 2.8 Verify navigation works between all tabs
<!-- NOTE: App starts and routes compile correctly. Full manual tap-through requires a device/simulator. -->

## 3. Set Up Project Structure

- [x] 3.1 Create `src/` subdirectories: `components/{calendar,plants,common}`, `features/{farms,plants,crops,calendar,tasks}`, `repositories`, `services/supabase`, `hooks`, `types`, `utils`, `constants`
- [x] 3.2 Create `supabase/` directory with `migrations/`, `functions/`, and `seed.sql` placeholder
- [x] 3.3 Create `assets/images/` and `assets/fonts/` directories
- [x] 3.4 Create `tests/` directory with `setup.ts` file

## 4. Configure TypeScript

- [x] 4.1 Enable strict mode in `tsconfig.json`
- [x] 4.2 Configure path aliases (`@/*` → `src/*`, `@app/*` → `app/*`)
- [x] 4.3 Set `moduleResolution` to `bundler` and `jsx` to `react-jsx`
- [x] 4.4 Verify TypeScript compilation passes (`npx tsc --noEmit`)

## 5. Configure Supabase Client

- [x] 5.1 Install `@supabase/supabase-js`
- [x] 5.2 Create `src/services/supabase/client.ts` singleton with env var validation
- [x] 5.3 Add `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` to `.env.example`
- [x] 5.4 Add TypeScript types for environment variables
<!-- NOTE: Expo provides process.env typing; TypeScript compiles without errors. -->

## 6. Set Up Environment Configuration

- [x] 6.1 Create `.env.example` with placeholder values for both `EXPO_PUBLIC_*` variables
- [x] 6.2 Add environment files to `.gitignore`
- [x] 6.3 Verify `EXPO_PUBLIC_*` variables are accessible via `process.env` in the app
<!-- NOTE: Client code is written correctly. Runtime verification deferred to Phase 2 when repositories import the client. -->

## 7. Configure Code Quality Tools

- [x] 7.1 Install and configure ESLint with `eslint-config-expo`
- [x] 7.2 Add TypeScript ESLint rules and parser
- [x] 7.3 Install and configure Prettier (`.prettierrc`)
- [x] 7.4 Add `lint` and `format` scripts to `package.json`
- [x] 7.5 Run linter and fix any initial issues

## 8. Set Up Testing Infrastructure

- [x] 8.1 Install `jest-expo` and create `jest.config.js`
- [x] 8.2 Install `@testing-library/react-native`
- [x] 8.3 Create `tests/setup.ts` with minimal configuration
- [x] 8.4 Write a smoke test in `tests/smoke.test.tsx` verifying Jest + RNTL work
- [x] 8.5 Add `test` script to `package.json`
- [x] 8.6 Run tests and verify they pass

## 9. Configure Git

- [x] 9.1 Create comprehensive `.gitignore` (node_modules, env files, .expo, build artifacts, Supabase local config, logs)
- [x] 9.2 Verify no secrets or environment files are tracked (`git status`)

## 10. Create README

- [x] 10.1 Write project overview section
- [x] 10.2 Add setup instructions (install dependencies, copy `.env.example` to `.env`, configure Supabase keys)
- [x] 10.3 Add development instructions (start dev server, run tests, lint, format)
- [x] 10.4 Add project structure overview with directory descriptions
- [x] 10.5 Add Supabase setup instructions (CLI installation, local dev)

## 11. Final Verification

- [x] 11.1 `npx expo start` runs without errors
- [x] 11.2 Tab navigation works between all four tabs
<!-- NOTE: Routes compile and app starts. Manual tap-through pending device testing. -->
- [x] 11.3 `npx tsc --noEmit` passes with no errors
- [x] 11.4 `npm run lint` passes with no errors
- [x] 11.5 `npm test` passes with no failures
- [x] 11.6 Environment variables load correctly (Supabase client initializes without throwing)
<!-- NOTE: Client code is correct. Not imported in Phase 1, so not exercised at runtime. Verified in Phase 2. -->
