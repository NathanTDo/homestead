# Tasks: Phase 6 — Testing and Polish

## 1. Integration Test Setup

- [ ] 1.1 Configure Supabase local database for testing (`supabase start`)
- [ ] 1.2 Create test setup file that resets the database between test suites
- [ ] 1.3 Create test helper functions: createTestUser, createTestFarm, createTestCrop
- [ ] 1.4 Add `test:integration` script to `package.json`

## 2. Integration Tests

- [ ] 2.1 Test farm creation via `create_farm_with_member` (verify farm, member, onboarding_data)
- [ ] 2.2 Test plant selection (create planned crop, verify it persists)
- [ ] 2.3 Test five-crop limit enforcement (insert 5 crops, 6th fails)
- [ ] 2.4 Test schedule generation (verify milestone and maintenance tasks with correct dates)
- [ ] 2.5 Test duplicate prevention (run generation twice, verify no duplicates)
- [ ] 2.6 Test task completion (mark complete, verify completed_at is set, verify on re-query)
- [ ] 2.7 Test calendar retrieval (query tasks for a month, verify plant names joined)

## 3. Security Tests

- [ ] 3.1 Test farm isolation (user A cannot read user B's farm, crops, or tasks)
- [ ] 3.2 Test unauthorized crop creation (user cannot create crops for another farm)
- [ ] 3.3 Test five-crop limit cannot be bypassed via direct insertion
- [ ] 3.4 Test unauthenticated access (no auth → cannot read any user-owned table)
- [ ] 3.5 Test RLS on catalog tables (authenticated users can read, cannot write)

## 4. Error and Empty States

- [ ] 4.1 Create `src/components/common/LoadingState.tsx` (spinner with optional message)
- [ ] 4.2 Create `src/components/common/ErrorState.tsx` (error icon, message, retry button)
- [ ] 4.3 Create `src/components/common/EmptyState.tsx` (empty icon, contextual message)
- [ ] 4.4 Apply loading state to calendar screen
- [ ] 4.5 Apply loading state to plants catalog screen
- [ ] 4.6 Apply error state with retry to all data-fetching screens
- [ ] 4.7 Apply empty states: calendar (no tasks), plants (no selections), search (no results)
- [ ] 4.8 Add network error handling (offline indicator + retry)

## 5. UI Polish

- [ ] 5.1 Verify safe area handling on all screens (notches, home indicators)
- [ ] 5.2 Verify tab bar icons render correctly on iOS and Android
- [ ] 5.3 Test layout on iPhone SE, iPhone 14, and iPhone Pro Max screen sizes
- [ ] 5.4 Fix any layout overflow or truncation issues
- [ ] 5.5 Ensure consistent spacing and padding across screens

## 6. Documentation

- [ ] 6.1 Update README with complete setup instructions (clone, install, env config, Supabase setup, dev server)
- [ ] 6.2 Add project structure section with directory descriptions
- [ ] 6.3 Add architecture overview (tech stack, data flow, repository pattern)
- [ ] 6.4 Add growing template system documentation (templates, versioning, schedule generation)
- [ ] 6.5 Add testing instructions (unit, integration, security)
- [ ] 6.6 Add deployment instructions (Supabase backend, EAS build for mobile)

## 7. Final Verification

- [ ] 7.1 Run all unit tests — verify they pass
- [ ] 7.2 Run all integration tests — verify they pass
- [ ] 7.3 Run all security tests — verify they pass
- [ ] 7.4 Run ESLint — verify no errors
- [ ] 7.5 Run TypeScript compilation — verify no errors
- [ ] 7.6 Manual E2E test: signup → survey → farm name → browse plants → select plant → choose template → pick date → schedule generates → calendar shows tasks → mark task complete → reopen app → task still complete
- [ ] 7.7 Verify all 15 acceptance criteria from the PRD are met
