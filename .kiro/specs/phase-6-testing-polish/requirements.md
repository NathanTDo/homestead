# Requirements: Phase 6 — Testing and Polish

## 1. Integration Tests

### REQ-001: Farm Creation Integration Test
The system shall include an integration test verifying that a user can create a farm via the `create_farm_with_member` function and that the farm, farm_members, and profile onboarding_data are correctly created.

### REQ-002: Plant Selection Integration Test
The system shall include an integration test verifying that a user can select plants (create planned crops) and that the five-crop limit is enforced at the database level.

### REQ-003: Schedule Generation Integration Test
The system shall include an integration test verifying that schedule generation creates the correct number of milestone and maintenance tasks with correct dates relative to the planting date.

### REQ-004: Duplicate Prevention Integration Test
The system shall include an integration test verifying that running schedule generation twice for the same crop does not create duplicate tasks (idempotency via generation_key).

### REQ-005: Task Completion Integration Test
The system shall include an integration test verifying that completing a task persists the completion and that the task remains completed on re-query.

### REQ-006: Calendar Retrieval Integration Test
The system shall include an integration test verifying that calendar queries return the correct tasks for a given month, with plant names joined correctly.

## 2. Security Tests

### REQ-007: Farm Isolation Test
The system shall include a security test verifying that a user cannot read farms, crops, or tasks belonging to another user's farm.

### REQ-008: Unauthorized Crop Creation Test
The system shall include a security test verifying that a user cannot create crops for a farm they do not belong to.

### REQ-009: Five-Crop Bypass Test
The system shall include a security test verifying that the five-crop limit cannot be bypassed through direct database insertion (the trigger enforces it regardless of RLS).

### REQ-010: Unauthenticated Access Test
The system shall include a security test verifying that unauthenticated requests cannot read any user-owned table.

## 3. Error and Empty States

### REQ-011: Loading States
All screens that fetch data shall display a loading indicator while data is being retrieved.

### REQ-012: Error States
All screens that fetch data shall display a user-friendly error message with a retry option when data loading fails.

### REQ-013: Empty States
The system shall display contextual empty states:
- Calendar with no tasks: "No activities scheduled this month"
- Plants tab with no selections: "Add plants to get started"
- Search with no results: "No plants match your search"

### REQ-014: Network Error Handling
The system shall handle network errors gracefully, displaying an offline indicator and retry option rather than crashing.

## 4. UI Polish

### REQ-015: Mobile Responsiveness
The system shall render correctly on different screen sizes (iPhone SE to iPhone Pro Max, common Android sizes) without layout issues.

### REQ-016: Safe Area Handling
The system shall respect safe area insets (notches, home indicators) on all screens using `react-native-safe-area-context`.

### REQ-017: Tab Bar Icons
Tab bar icons shall be clearly visible and sized appropriately for both iOS and Android.

## 5. Documentation

### REQ-018: Setup Documentation
The README shall include complete setup instructions: cloning, installing dependencies, configuring environment variables, setting up Supabase locally, running migrations and seeds, and starting the dev server.

### REQ-019: Deployment Documentation
The README shall include instructions for deploying the Supabase backend (migrations, edge functions, seed data) and building the Expo app for iOS and Android.

### REQ-020: Architecture Documentation
The README shall include an architecture overview describing the tech stack, project structure, data flow (app → repository → Supabase), and the growing template system.

## 6. Final Verification

### REQ-021: End-to-End Onboarding Test
The system shall pass a manual end-to-end test: new user signs up → completes survey → names farm → browses plants → selects a plant → chooses template → picks planting date → schedule generates → calendar shows tasks → user marks task complete → task stays complete on reopen.

### REQ-022: All Tests Pass
All unit, integration, and security tests shall pass with no failures.
