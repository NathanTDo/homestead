# Design: Phase 1 — Project Foundation

## Overview

Phase 1 establishes the project foundation: Expo + TypeScript initialization, Expo Router navigation with tab structure, the full directory layout, Supabase client configuration, environment variable handling, code quality tooling, testing infrastructure, and documentation. No business logic, database schema, or UI features are implemented in this phase.

## Technology Stack

### Core

| Component | Technology | Notes |
|---|---|---|
| Framework | Expo SDK 58 | React Native 0.88, released Oct 2026 |
| Language | TypeScript | Strict mode enabled |
| Navigation | Expo Router | File-based routing |
| Backend | Supabase | PostgreSQL, Auth, Edge Functions |

### Key Dependencies

| Dependency | Purpose |
|---|---|
| `expo` | Core Expo framework |
| `expo-router` | File-based navigation |
| `@supabase/supabase-js` | Supabase client |
| `expo-status-bar` | Status bar management |
| `expo-constants` | App configuration access |
| `react-native-safe-area-context` | Safe area insets |
| `react-native-screens` | Native screen management |
| `@react-native-async-storage/async-storage` | Supabase session storage adapter |
| `jest-expo` | Jest preset for Expo |
| `@testing-library/react-native` | Component testing |
| `eslint-config-expo` | ESLint config for Expo |
| `prettier` | Code formatter |

Exact versions will be pinned during implementation based on the SDK 58 compatibility matrix.

### Environment Variables

| Variable | Description | Required |
|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |

Expo exposes variables prefixed with `EXPO_PUBLIC_*` to client code via `process.env`. The anon key is safe to expose to the client because RLS policies enforce authorization at the database level.

## Project Structure

```
homestead/
├── app/
│   ├── _layout.tsx                # Root layout
│   ├── (auth)/
│   │   └── _layout.tsx            # Auth group (placeholder)
│   ├── (onboarding)/
│   │   └── _layout.tsx            # Onboarding group (placeholder)
│   └── (tabs)/
│       ├── _layout.tsx            # Tab navigation layout
│       ├── index.tsx              # Home tab
│       ├── calendar.tsx           # Calendar tab
│       ├── plants.tsx             # Plants tab
│       └── profile.tsx            # Profile tab
│
├── src/
│   ├── components/
│   │   ├── calendar/
│   │   ├── plants/
│   │   └── common/
│   ├── features/
│   │   ├── farms/
│   │   ├── plants/
│   │   ├── crops/
│   │   ├── calendar/
│   │   └── tasks/
│   ├── repositories/
│   ├── services/
│   │   └── supabase/
│   │       └── client.ts          # Supabase client singleton
│   ├── hooks/
│   ├── types/
│   ├── utils/
│   └── constants/
│
├── supabase/
│   ├── migrations/
│   ├── functions/
│   └── seed.sql                   # Placeholder (populated in Phase 2)
│
├── assets/
│   ├── images/                    # Bundled plant images
│   └── fonts/
│
├── tests/
│   └── setup.ts                   # Jest setup file
│
├── .env.example
├── .gitignore
├── app.json                       # Expo app config
├── package.json
├── tsconfig.json
├── jest.config.js
├── .eslintrc.js
└── README.md
```

## Navigation Architecture

Expo Router uses file-based routing. Route groups (parenthesized directories) organize screens without affecting the URL path.

### Root Layout (`app/_layout.tsx`)

For Phase 1, the root layout renders the `(tabs)` group directly. In Phase 3, it will conditionally render `(auth)`, `(onboarding)`, or `(tabs)` based on authentication and onboarding state.

### Route Groups

| Group | Purpose | Phase Implemented |
|---|---|---|
| `(auth)` | Login and signup screens | Phase 3 |
| `(onboarding)` | Survey and farm creation | Phase 3 |
| `(tabs)` | Main application navigation | Phase 1 (shell only) |

### Tab Configuration

Tabs are configured in `app/(tabs)/_layout.tsx` using Expo Router's `Tabs` component. Each tab has a name, a tab bar icon, and a title.

| Tab | Route | Icon | Phase Implemented |
|---|---|---|---|
| Home | `index` | home | Phase 1 (placeholder) |
| Calendar | `calendar` | calendar | Phase 5 |
| Plants | `plants` | leaf | Phase 3 |
| Profile | `profile` | user | Phase 3 |

## Supabase Client Setup

The Supabase client is initialized as a singleton in `src/services/supabase/client.ts`. Repository classes use this client; UI components never import it directly.

```typescript
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

Two important notes:
- The env check at module load time fails fast if configuration is missing, which surfaces the problem during development rather than at runtime.
- `AsyncStorage` is required as the session storage adapter in React Native. Without it, auth sessions are not persisted across app restarts. `detectSessionInUrl: false` disables URL-based session detection, which is not applicable in a native app.

## Code Quality Configuration

### TypeScript (`tsconfig.json`)

- `strict: true` — all strict checks enabled
- Path aliases: `@/*` → `src/*`, `@app/*` → `app/*`
- `jsx: "react-jsx"` — automatic JSX runtime
- `moduleResolution: "bundler"` — modern module resolution

### ESLint (`.eslintrc.js`)

- Extends `eslint-config-expo`
- Includes TypeScript parser and rules
- Includes React and React Hooks rules
- Runs via `npm run lint`

### Prettier (`.prettierrc`)

- Single quotes for strings
- 2-space indentation
- Trailing commas (`all`)
- 100 character print width
- Runs via `npm run format`

## Testing Configuration

### Jest (`jest.config.js`)

- Preset: `jest-expo`
- Setup file: `tests/setup.ts`
- Transform: handled by `jest-expo` preset
- Test paths: `tests/**/*.test.ts`, `tests/**/*.test.tsx`, `src/**/__tests__/**`

### Test Setup (`tests/setup.ts`)

Imports `@testing-library/jest-native` matchers (if needed) and provides global test configuration. Kept minimal for Phase 1.

## Git Configuration

### `.gitignore`

Excludes:
- `node_modules/`
- `.env`, `.env.local`, `.env.*.local`
- `.expo/`
- `dist/`, `web-build/`
- `ios/`, `android/` build artifacts (if applicable)
- `supabase/.branches`, `supabase/.temp`
- `*.log`

## Out of Scope for Phase 1

- Authentication UI and logic (Phase 3)
- Database migrations and schema (Phase 2)
- RLS policies (Phase 2)
- Onboarding survey and farm creation (Phase 3)
- Plant catalog UI (Phase 3)
- Growing templates and schedule generation (Phase 4)
- Calendar UI and task management (Phase 5)
- Any business logic, data access, or feature implementation

Phase 1 delivers a running app shell with navigation, configured tooling, project structure, and documentation. All screens are placeholders.
