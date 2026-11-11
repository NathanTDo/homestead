# Design: Phase 6 — Testing and Polish

## Overview

Phase 6 adds integration and security tests using the Supabase local database, polishes error/empty/loading states across all screens, ensures mobile responsiveness, and completes documentation. This phase validates the end-to-end workflow before the MVP is considered complete.

## Test Strategy

### Test Layers

| Layer | Framework | Purpose |
|---|---|---|
| Unit | Jest + `jest-expo` | Pure function tests (date math, utilities) |
| Component | Jest + `@testing-library/react-native` | Component rendering and interaction |
| Integration | Jest + Supabase local DB | Database operations with real PostgreSQL |
| Security | Jest + Supabase local DB | RLS policy verification |

### Supabase Local Testing Setup

Integration and security tests use the Supabase CLI's local database (`supabase start`). Tests connect to the local PostgreSQL instance and run against the real schema with RLS enabled.

```typescript
// tests/setup-supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'test-anon-key';

export function createTestClient(userId?: string) {
  const client = createClient(supabaseUrl, supabaseKey);
  if (userId) {
    // Inject auth context for RLS testing
    // This requires a custom auth setup or service-role bypass
  }
  return client;
}
```

### Integration Test Pattern

```typescript
// tests/integration/schedule-generation.test.ts
describe('Schedule generation', () => {
  beforeAll(async () => {
    // Reset database to known state
    // Seed test data: user, farm, plant, template
  });

  it('generates milestone tasks with correct dates', async () => {
    // Create a crop with template and planting date
    // Call generate-schedule Edge Function (or generate_tasks RPC)
    // Query growing_tasks
    // Assert correct number of tasks with correct dates
  });

  it('does not create duplicates on re-run', async () => {
    // Run generation twice
    // Assert task count is the same
  });
});
```

### Security Test Pattern

```typescript
// tests/security/farm-isolation.test.ts
describe('Farm isolation', () => {
  it('user A cannot read user B farm', async () => {
    // Create user A's farm
    // Create user B's farm
    // Query as user A → should only see user A's farm
    // Query user B's farm as user A → should be denied/empty
  });

  it('unauthenticated user cannot read farms', async () => {
    // Query without auth → should be denied/empty
  });
});
```

## Error and Empty States

### Pattern

Each screen uses a shared data-fetching hook that returns `{ data, loading, error }`. The screen renders based on state:

```tsx
function Screen() {
  const { data, loading, error, refetch } = useData();

  if (loading) return <LoadingState />;
  if (error) return <ErrorState onRetry={refetch} message={error.message} />;
  if (!data || data.length === 0) return <EmptyState message="No data" />;
  return <Content data={data} />;
}
```

### Shared Components

- `src/components/common/LoadingState.tsx` — spinner with optional message
- `src/components/common/ErrorState.tsx` — error icon, message, retry button
- `src/components/common/EmptyState.tsx` — empty icon, contextual message

### Empty State Messages

| Screen | Message |
|---|---|
| Calendar (no tasks) | "No activities scheduled this month" |
| Plants (no selections) | "Add plants to get started" |
| Plants search (no results) | "No plants match your search" |
| Task list (no tasks for date) | "No activities on this date" |

## Mobile Responsiveness

- Use `react-native-safe-area-context` on all screens for notch/home indicator handling
- Use flexbox for layout — avoid hardcoded widths
- Test on iPhone SE (375pt), iPhone 14 (390pt), iPhone Pro Max (430pt), and common Android widths
- Tab bar icons from `@expo/vector-icons` (Ionicons) with consistent sizing

## Documentation

### README Structure

```markdown
# Farm Planning App

## Overview
[Brief description of the app]

## Tech Stack
- React Native + Expo (SDK 58)
- TypeScript
- Supabase (PostgreSQL, Auth, Edge Functions)
- Expo Router

## Prerequisites
- Node.js 18+
- Supabase CLI
- Expo CLI

## Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and fill in Supabase keys
4. Start Supabase locally: `supabase start`
5. Run migrations: `supabase db reset`
6. Start the dev server: `npx expo start`

## Project Structure
[Directory tree with descriptions]

## Architecture
[Data flow diagram: App → Repository → Supabase → PostgreSQL]

## Growing Template System
[Description of templates, schedule generation, versioning]

## Testing
- Run tests: `npm test`
- Run linter: `npm run lint`

## Deployment
- Supabase: `supabase db push`, deploy edge functions
- Mobile: `eas build` for iOS/Android
```

## Out of Scope for Phase 6

- Push notifications (v1.1)
- Weather integration (v1.1)
- Multiple farms per user (v1.2)
- AI recommendations (v2.0)
- Subscription and monetization (v2.0)
