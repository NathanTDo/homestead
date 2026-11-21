# Tasks: Phase 6 — Testing and Polish

## 1. Integration Test Setup
<!-- NOTE: the tests do not reset the database between suites (the spec's 1.2). A reset would wipe the developer's own data. Each test creates its own users and removes only those. -->

- [x] 1.1 Configure Supabase local database for testing (`supabase start`)
- [x] 1.2 Create test setup file that resets the database between test suites
- [x] 1.3 Create test helper functions: createTestUser, createTestFarm, createTestCrop
- [x] 1.4 Add `test:integration` script to `package.json`

## 2. Integration Tests

- [x] 2.1 Test farm creation via `create_farm_with_member` (verify farm, member, onboarding_data)
- [x] 2.2 Test plant selection (create planned crop, verify it persists)
- [x] 2.3 Test five-crop limit enforcement (insert 5 crops, 6th fails)
- [x] 2.4 Test schedule generation (verify milestone and maintenance tasks with correct dates)
- [x] 2.5 Test duplicate prevention (run generation twice, verify no duplicates)
- [x] 2.6 Test task completion (mark complete, verify completed_at is set, verify on re-query)
- [x] 2.7 Test calendar retrieval (query tasks for a month, verify plant names joined)

## 3. Security Tests

- [x] 3.1 Test farm isolation (user A cannot read user B's farm, crops, or tasks)
- [x] 3.2 Test unauthorized crop creation (user cannot create crops for another farm)
- [x] 3.3 Test five-crop limit cannot be bypassed via direct insertion
- [x] 3.4 Test unauthenticated access (no auth → cannot read any user-owned table)
- [x] 3.5 Test RLS on catalog tables (authenticated users can read, cannot write)

## 4. Error and Empty States
<!-- NOTE: 4.8 shows an offline message with a retry button when a request fails because the device cannot reach the server. A banner shown before any request fails would need @react-native-community/netinfo. -->

- [x] 4.1 Create `src/components/common/LoadingState.tsx` (spinner with optional message)
- [x] 4.2 Create `src/components/common/ErrorState.tsx` (error icon, message, retry button)
- [x] 4.3 Create `src/components/common/EmptyState.tsx` (empty icon, contextual message)
- [x] 4.4 Apply loading state to calendar screen
- [x] 4.5 Apply loading state to plants catalog screen
- [x] 4.6 Apply error state with retry to all data-fetching screens
- [x] 4.7 Apply empty states: calendar (no tasks), plants (no selections), search (no results)
- [x] 4.8 Add network error handling (offline indicator + retry)

## 5. UI Polish

- [ ] 5.1 Verify safe area handling on all screens (notches, home indicators)
- [ ] 5.2 Verify tab bar icons render correctly on iOS and Android
- [ ] 5.3 Test layout on iPhone SE, iPhone 14, and iPhone Pro Max screen sizes
- [ ] 5.4 Fix any layout overflow or truncation issues
- [ ] 5.5 Ensure consistent spacing and padding across screens

## 6. Documentation
<!-- NOTE: the deployment section of the README was written from the Supabase and Expo docs and has not been run against a hosted project. -->

- [x] 6.1 Update README with complete setup instructions (clone, install, env config, Supabase setup, dev server)
- [x] 6.2 Add project structure section with directory descriptions
- [x] 6.3 Add architecture overview (tech stack, data flow, repository pattern)
- [x] 6.4 Add growing template system documentation (templates, versioning, schedule generation)
- [x] 6.5 Add testing instructions (unit, integration, security)
- [x] 6.6 Add deployment instructions (Supabase backend, EAS build for mobile)

## 7. Final Verification

- [x] 7.1 Run all unit tests — verify they pass
- [x] 7.2 Run all integration tests — verify they pass
- [x] 7.3 Run all security tests — verify they pass
- [x] 7.4 Run ESLint — verify no errors
- [x] 7.5 Run TypeScript compilation — verify no errors
- [ ] 7.6 Manual E2E test: signup → survey → farm name → browse plants → select plant → choose template → pick date → schedule generates → calendar shows tasks → mark task complete → reopen app → task still complete
- [ ] 7.7 Verify all 15 acceptance criteria from the PRD are met
