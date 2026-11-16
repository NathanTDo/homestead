# Tasks: Phase 3 — Onboarding and Plant Selection

## 1. Authentication UI

- [x] 1.1 Create `app/(auth)/login.tsx` with email/password sign-in form
- [x] 1.2 Create `app/(auth)/signup.tsx` with email/password/display-name sign-up form
- [x] 1.3 Add inline error messages for auth failures
- [x] 1.4 Implement auth state listener in `app/_layout.tsx` to route based on auth and onboarding state
- [x] 1.5 Create `useAuth` hook wrapping Supabase auth state

## 2. Onboarding — Survey

- [x] 2.1 Create `app/(onboarding)/welcome.tsx` with intro text and "Get Started" button
- [x] 2.2 Create `app/(onboarding)/survey.tsx` with five-field form (location, farming type, seasons, produce interests, experience level)
- [x] 2.3 Collect survey data in local state, validate required fields
- [x] 2.4 Pass survey data to the farm naming screen via params or state

## 3. Onboarding — Farm Creation

- [x] 3.1 Create `app/(onboarding)/farm-name.tsx` with farm name input
- [x] 3.2 Create `create_farm_with_member` Postgres function (migration) for atomic farm + member + onboarding data creation
- [x] 3.3 Call the RPC from `farmRepository.createFarmWithMember()`
- [x] 3.4 On success, set onboarding complete flag and route to `(tabs)/plants`
- [x] 3.5 Handle errors (duplicate farm name, network failure)

## 4. Plant Catalog

- [x] 4.1 Create `app/(tabs)/plants.tsx` with scrollable plant card grid
- [x] 4.2 Implement search input with case-insensitive name filtering
- [x] 4.3 Create `usePlants(searchQuery)` hook fetching from `plantRepository`
- [x] 4.4 Create plant card component showing image and name
- [x] 4.5 Create image utility mapping `image_url` keys to bundled assets in `src/utils/images.ts`
- [x] 4.6 Add placeholder plant images to `assets/images/` for all 15 plants

## 5. Plant Details

- [x] 5.1 Create `app/(tabs)/plants/[slug].tsx` detail screen
- [x] 5.2 Display plant name, description, image, and growing seasons placeholder
- [x] 5.3 Implement "Add to Farm" button that calls `cropRepository.addCrop()`
- [x] 5.4 Show "Added" state if plant is already in user's crops
- [x] 5.5 Add "Remove" option for planned crops (calls `cropRepository.archiveCrop()`)

## 6. Plant Selection Management

- [x] 6.1 Create `useActiveCrops(farmId)` hook fetching planned and active crops
- [x] 6.2 Display crop count badge "X / 5" on plants tab
- [x] 6.3 Disable "Add to Farm" button when 5 crops are selected
- [x] 6.4 Handle five-crop limit error from database trigger (show message)
- [x] 6.5 Display "Your Crops" section showing selected plants

## 7. Profile Screen

- [x] 7.1 Create `app/(tabs)/profile.tsx` displaying display name and farm name
- [x] 7.2 Add sign-out button calling `supabase.auth.signOut()`
- [x] 7.3 Fetch user profile and farm data via repositories

## 8. Repository Layer
<!-- NOTE: implemented as searchPlants/getPlantBySlug, listCrops/createCrop/archiveCrop, getFarmForUser/createFarmWithMember, getProfile/updateProfile (isOnboarded is a pure helper in features/auth). -->

- [x] 8.1 Implement `plantRepository.getAll()`, `getBySlug()`, `searchByName()`
- [x] 8.2 Implement `cropRepository.getActiveCrops()`, `addCrop()`, `archiveCrop()`
- [x] 8.3 Implement `farmRepository.getFarmForUser()`, `createFarmWithMember()`
- [x] 8.4 Implement `profileRepository.getProfile()`, `updateProfile()`, `isOnboarded()`

## 9. Verification

- [x] 9.1 New user can sign up and profile is auto-created
- [x] 9.2 User completes survey and names their farm
- [x] 9.3 Farm and farm_members rows are created correctly
- [x] 9.4 User can browse all 15 plants in the catalog
- [x] 9.5 Search filters plants by name (case-insensitive, partial match)
- [x] 9.6 User can view plant details
- [x] 9.7 User can add a plant (creates planned crop)
- [x] 9.8 User cannot add more than 5 plants (client prevents it, server enforces it)
- [x] 9.9 User can remove a planned plant (archives the crop)
- [x] 9.10 Selections persist across app restarts
- [x] 9.11 Profile tab shows name, farm name, and sign-out works
