# Homestead — Farm Planning App

A mobile application that helps farmers plan, manage, and track their produce-growing schedules. Users select produce they want to grow and receive a personalized growing calendar with planting milestones, estimated harvest windows, and recurring maintenance activities.

## Tech Stack

- **Framework:** React Native + Expo (SDK 58, React Native 0.88)
- **Language:** TypeScript (strict mode)
- **Navigation:** Expo Router (file-based routing with tab navigation)
- **Backend:** Supabase (PostgreSQL, Auth, Edge Functions, Row Level Security)
- **Testing:** Jest + React Native Testing Library

## Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Supabase CLI (`npm install -g supabase`)

## Setup

1. **Clone the repository:**
   ```bash
   git clone <repo-url>
   cd homestead
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your Supabase project URL and anon key:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

4. **Start the development server:**
   ```bash
   npx expo start
   ```

5. **Run on a device or emulator:**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan the QR code with Expo Go (limited — dev build recommended for full functionality)

## Development

### Scripts

| Command | Description |
|---|---|
| `npm start` | Start the Expo dev server |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |
| `npm test` | Run Jest tests |

### Environment Variables

Variables prefixed with `EXPO_PUBLIC_*` are exposed to the client via `process.env`. The Supabase anon key is safe to expose because Row Level Security policies enforce authorization at the database level.

## Supabase Setup

1. **Install the Supabase CLI:**
   ```bash
   npm install -g supabase
   ```

2. **Start local Supabase:**
   ```bash
   supabase start
   ```

3. **Run migrations:**
   ```bash
   supabase db reset
   ```

4. **Seed the database:**
   ```bash
   supabase db reset
   ```
   This runs all migrations and the seed file.

## Project Structure

```
homestead/
├── app/                        # Expo Router (file-based routing)
│   ├── _layout.tsx             # Root layout
│   ├── (auth)/                 # Authentication screens (Phase 2)
│   ├── (onboarding)/           # Onboarding survey + farm creation (Phase 3)
│   └── (tabs)/                 # Main app navigation
│       ├── _layout.tsx         # Tab navigation config
│       ├── index.tsx           # Home tab
│       ├── calendar.tsx        # Calendar tab (Phase 5)
│       ├── plants.tsx          # Plants tab (Phase 3)
│       └── profile.tsx         # Profile tab (Phase 2)
│
├── src/                        # Application source code
│   ├── components/              # Reusable UI components
│   ├── features/                # Domain-specific feature modules
│   ├── repositories/            # Data access layer (repository pattern)
│   ├── services/               # External service clients
│   │   └── supabase/            # Supabase client singleton
│   ├── hooks/                   # Custom React hooks
│   ├── types/                   # TypeScript type definitions
│   ├── utils/                   # Utility functions
│   └── constants/               # App constants (colors, config)
│
├── supabase/                    # Supabase project
│   ├── migrations/              # SQL migration files
│   ├── functions/               # Edge Functions
│   └── seed.sql                 # Seed data
│
├── assets/                     # Static assets (images, fonts)
├── tests/                      # Test files
├── .env.example                # Environment variable template
└── jest.config.js              # Jest configuration
```

## Architecture

### Data Flow

```
UI Components → Hooks → Repositories → Supabase Client → PostgreSQL (RLS)
```

UI components never contain direct Supabase queries. All data access goes through repository classes, which use the Supabase client singleton. Row Level Security on PostgreSQL enforces authorization independently of the application.

### Growing Template System

The app uses predefined growing templates to generate personalized schedules. A template represents the agricultural requirements of a plant for a specific season. Templates are versioned — existing schedules retain the version used when generated, and template updates do not silently alter existing calendar events.

### Schedule Generation

An Edge Function (`generate-schedule`) calculates growing milestones and maintenance tasks relative to a planting date. Generation is transactional and idempotent — a unique `generation_key` prevents duplicate tasks.

## Testing

- **Unit tests:** Pure function tests (date calculations, utilities)
- **Component tests:** React Native Testing Library for UI components
- **Integration tests:** Supabase local database for database operations
- **Security tests:** RLS policy verification

Run all tests:
```bash
npm test
```
