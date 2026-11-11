# Tasks: Phase 1 — Project Foundation

## 1. Initialize Expo Project

- [ ] 1.1 Initialize Expo project with TypeScript using `create-expo-app` (latest stable, SDK 58)
- [ ] 1.2 Verify the project runs with `npx expo start`
- [ ] 1.3 Configure for development build (install `expo-dev-client`, update `app.json`)

## 2. Configure Expo Router

- [ ] 2.1 Install and configure `expo-router`
- [ ] 2.2 Create root `app/_layout.tsx`
- [ ] 2.3 Create `app/(auth)/_layout.tsx` placeholder
- [ ] 2.4 Create `app/(onboarding)/_layout.tsx` placeholder
- [ ] 2.5 Create `app/(tabs)/_layout.tsx` with tab navigation (Home, Calendar, Plants, Profile)
- [ ] 2.6 Create tab screen placeholders: `index.tsx`, `calendar.tsx`, `plants.tsx`, `profile.tsx`
- [ ] 2.7 Add tab bar icons for all four tabs
- [ ] 2.8 Verify navigation works between all tabs

## 3. Set Up Project Structure

- [ ] 3.1 Create `src/` subdirectories: `components/{calendar,plants,common}`, `features/{farms,plants,crops,calendar,tasks}`, `repositories`, `services/supabase`, `hooks`, `types`, `utils`, `constants`
- [ ] 3.2 Create `supabase/` directory with `migrations/`, `functions/`, and `seed.sql` placeholder
- [ ] 3.3 Create `assets/images/` and `assets/fonts/` directories
- [ ] 3.4 Create `tests/` directory with `setup.ts` file

## 4. Configure TypeScript

- [ ] 4.1 Enable strict mode in `tsconfig.json`
- [ ] 4.2 Configure path aliases (`@/*` → `src/*`, `@app/*` → `app/*`)
- [ ] 4.3 Set `moduleResolution` to `bundler` and `jsx` to `react-jsx`
- [ ] 4.4 Verify TypeScript compilation passes (`npx tsc --noEmit`)

## 5. Configure Supabase Client

- [ ] 5.1 Install `@supabase/supabase-js`
- [ ] 5.2 Create `src/services/supabase/client.ts` singleton with env var validation
- [ ] 5.3 Add `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` to `.env.example`
- [ ] 5.4 Add TypeScript types for environment variables

## 6. Set Up Environment Configuration

- [ ] 6.1 Create `.env.example` with placeholder values for both `EXPO_PUBLIC_*` variables
- [ ] 6.2 Add environment files to `.gitignore`
- [ ] 6.3 Verify `EXPO_PUBLIC_*` variables are accessible via `process.env` in the app

## 7. Configure Code Quality Tools

- [ ] 7.1 Install and configure ESLint with `eslint-config-expo`
- [ ] 7.2 Add TypeScript ESLint rules and parser
- [ ] 7.3 Install and configure Prettier (`.prettierrc`)
- [ ] 7.4 Add `lint` and `format` scripts to `package.json`
- [ ] 7.5 Run linter and fix any initial issues

## 8. Set Up Testing Infrastructure

- [ ] 8.1 Install `jest-expo` and create `jest.config.js`
- [ ] 8.2 Install `@testing-library/react-native`
- [ ] 8.3 Create `tests/setup.ts` with minimal configuration
- [ ] 8.4 Write a smoke test in `tests/smoke.test.tsx` verifying Jest + RNTL work
- [ ] 8.5 Add `test` script to `package.json`
- [ ] 8.6 Run tests and verify they pass

## 9. Configure Git

- [ ] 9.1 Create comprehensive `.gitignore` (node_modules, env files, .expo, build artifacts, Supabase local config, logs)
- [ ] 9.2 Verify no secrets or environment files are tracked (`git status`)

## 10. Create README

- [ ] 10.1 Write project overview section
- [ ] 10.2 Add setup instructions (install dependencies, copy `.env.example` to `.env`, configure Supabase keys)
- [ ] 10.3 Add development instructions (start dev server, run tests, lint, format)
- [ ] 10.4 Add project structure overview with directory descriptions
- [ ] 10.5 Add Supabase setup instructions (CLI installation, local dev)

## 11. Final Verification

- [ ] 11.1 `npx expo start` runs without errors
- [ ] 11.2 Tab navigation works between all four tabs
- [ ] 11.3 `npx tsc --noEmit` passes with no errors
- [ ] 11.4 `npm run lint` passes with no errors
- [ ] 11.5 `npm test` passes with no failures
- [ ] 11.6 Environment variables load correctly (Supabase client initializes without throwing)
