# Requirements: Phase 1 — Project Foundation

## 1. Project Initialization

### REQ-001: Expo + TypeScript Initialization
The system shall be initialized as an Expo application with TypeScript using the latest stable Expo SDK (SDK 58 at time of writing, React Native 0.88).

### REQ-002: Development Build Configuration
The system shall use an Expo development build configuration, not Expo Go exclusively.

### REQ-003: TypeScript Strict Mode
The system shall enable strict TypeScript configuration in `tsconfig.json` with no implicit `any`, strict null checks, and strict function types.

### REQ-004: Path Aliases
The system shall configure TypeScript path aliases mapping `@/*` to `src/*` and `@app/*` to `app/*`.

## 2. Navigation

### REQ-005: Expo Router
The system shall use Expo Router for file-based navigation.

### REQ-006: Tab Navigation
The system shall include a tab-based navigation with four tabs:
- Home (`index`)
- Calendar (`calendar`)
- Plants (`plants`)
- Profile (`profile`)

### REQ-007: Route Groups
The system shall include route groups for `(auth)` and `(onboarding)` with placeholder layouts for future phases.

## 3. Project Structure

### REQ-008: Feature-Oriented Directory Structure
The system shall follow the feature-oriented directory structure defined in the product specification, organizing source code into `components/`, `features/`, `repositories/`, `services/`, `hooks/`, `types/`, `utils/`, and `constants/` directories under `src/`.

### REQ-009: Supabase Directory
The system shall include a `supabase/` directory containing `migrations/`, `functions/`, and `seed.sql` subdirectories for database management.

### REQ-010: Assets Directory
The system shall include an `assets/images/` directory for bundled plant images and an `assets/fonts/` directory for custom fonts.

### REQ-011: Tests Directory
The system shall include a `tests/` directory with a setup file for test configuration.

## 4. Configuration

### REQ-012: Environment Variables
The system shall use environment variables with the `EXPO_PUBLIC_*` prefix for Supabase configuration (`EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`).

### REQ-013: No Secrets in Version Control
The system shall exclude environment files containing secrets from version control via `.gitignore`.

### REQ-014: Environment Example File
The system shall include a `.env.example` file documenting all required environment variables with placeholder values.

### REQ-015: Supabase Client Library
The system shall include and configure the Supabase JavaScript client library (`@supabase/supabase-js`) as a singleton in `src/services/supabase/client.ts`.

## 5. Code Quality

### REQ-016: ESLint Configuration
The system shall include ESLint configuration with TypeScript support using `eslint-config-expo` as the base configuration.

### REQ-017: Prettier Configuration
The system shall include Prettier configuration for consistent code formatting with lint and format scripts in `package.json`.

### REQ-018: Git Ignore
The system shall include a `.gitignore` file excluding `node_modules/`, environment files, `.expo/`, build artifacts, and Supabase local configuration.

## 6. Testing Infrastructure

### REQ-019: Jest Configuration
The system shall include Jest configuration using the `jest-expo` preset for unit and component testing.

### REQ-020: React Native Testing Library
The system shall include React Native Testing Library (`@testing-library/react-native`) for component testing.

### REQ-021: Smoke Test
The system shall include at least one smoke test verifying that the testing infrastructure runs correctly.

## 7. Documentation

### REQ-022: README
The system shall include a README with:
- Project overview
- Setup instructions (install dependencies, configure environment variables)
- Development instructions (start dev server, run tests, lint)
- Project structure overview

## 8. Verification

### REQ-023: Build Verification
The system shall start without errors using `npx expo start`.

### REQ-024: Navigation Verification
The system shall allow navigation between all four tabs.

### REQ-025: Compilation Verification
The system shall pass TypeScript compilation with no errors.

### REQ-026: Lint Verification
The system shall pass ESLint with no errors.

### REQ-027: Test Verification
The system shall pass all Jest tests with no failures.
