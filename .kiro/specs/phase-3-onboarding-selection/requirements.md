# Requirements: Phase 3 — Onboarding and Plant Selection

## 1. Authentication UI

### REQ-001: Sign-In Screen
The system shall provide a sign-in screen with email and password fields and a submit button.

### REQ-002: Sign-Up Screen
The system shall provide a sign-up screen with email, password, and display name fields and a submit button.

### REQ-003: Auth State Routing
The root layout shall route unauthenticated users to `(auth)`, authenticated but un-onboarded users to `(onboarding)`, and fully onboarded users to `(tabs)`.

### REQ-004: Sign-Out
The system shall provide a sign-out action accessible from the profile tab.

## 2. Onboarding

### REQ-005: Welcome Screen
The system shall display a welcome screen as the first step of onboarding for new users.

### REQ-006: Onboarding Survey
The system shall collect the following survey fields from the user:
1. Farming location (text input, optional)
2. Type of farming (text input or select)
3. Preferred growing seasons (multi-select: spring, summer, fall, winter)
4. Types of produce interested in growing (multi-select from plant catalog names)
5. Farming experience level (select: beginner, intermediate, advanced)

### REQ-007: Survey Data Storage
The system shall store survey responses in `profiles.onboarding_data` as a JSONB object. The data shall not influence app behavior in the MVP.

### REQ-008: Farm Naming
The system shall prompt the user to name their farm during onboarding. The farm shall be created with the provided name, the user as `created_by`, and default farming method 'outdoor'.

### REQ-009: Farm Member Creation
When a farm is created, the system shall add the creating user to `farm_members` with role 'owner'.

### REQ-010: Onboarding Completion
After farm creation, the system shall mark onboarding as complete and route the user to the plant selection screen. The onboarding completion state shall be persisted (e.g., a flag in profiles or onboarding_data).

## 3. Plant Catalog

### REQ-011: Plant Catalog Screen
The system shall display a plant catalog screen listing all 15 plants as cards with plant name and image.

### REQ-012: Plant Search
The system shall provide a text search input that filters the plant catalog by plant name. Search is case-insensitive and matches partial input.

### REQ-013: Plant Details Screen
When a user taps a plant card, the system shall navigate to a plant details screen showing: plant name, description, image, recommended growing seasons, and a placeholder noting that growing information will be available when templates are configured.

### REQ-014: Bundled Images
The system shall load plant images from bundled local assets in `assets/images/`. The image_url field from the database maps to the bundled asset filename.

## 4. Plant Selection

### REQ-015: Plant Selection
From the plant details screen, the user shall be able to add a plant to their farm. Adding a plant creates a `farm_crop` with status 'planned', the user's farm_id, the plant_id, and null template_id and planting_date.

### REQ-016: Five Crop Limit — Client
The system shall prevent the user from adding more than five plants with status 'planned' or 'active'. The add button shall be disabled or hidden when five crops already exist.

### REQ-017: Five Crop Limit — Server
The database trigger (from Phase 2) shall reject any attempt to exceed five planned or active crops. The client shall display an error message if the server rejects the insertion.

### REQ-018: Deselection
The user shall be able to remove a planned crop from their farm. Removal sets the crop status to 'archived', not a hard delete. Archived crops free up a slot for new selections.

### REQ-019: Selected Plants View
The system shall display the user's currently selected (planned or active) crops, indicating which plants have been added and how many slots remain out of five.

### REQ-020: Selection Persistence
Plant selections shall persist across app restarts by reading from the database via the crop repository.

## 5. Profile Tab

### REQ-021: Profile Screen Content
The profile tab shall display the user's display name and farm name, and provide a sign-out button.
