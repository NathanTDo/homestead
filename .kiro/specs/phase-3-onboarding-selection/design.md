# Design: Phase 3 — Onboarding and Plant Selection

## Overview

Phase 3 implements authentication UI, the onboarding flow (survey + farm naming), the plant catalog with search and details, plant selection (creating planned crops), and the profile screen. After this phase, users can sign up, complete onboarding, browse and select up to five plants, and manage their selections.

## Authentication Flow

### Route Guard (`app/_layout.tsx`)

The root layout subscribes to Supabase auth state changes and determines the initial route:

```
auth session = null → (auth)/login
auth session exists + onboarding not complete → (onboarding)/welcome
auth session exists + onboarding complete → (tabs)/index
```

Onboarding completion is tracked via a boolean flag in `profiles.onboarding_data.completed` or a dedicated column. For simplicity, we use `onboarding_data->>'completed' = 'true'`.

### Auth Screens

- `app/(auth)/login.tsx` — email/password sign-in form
- `app/(auth)/signup.tsx` — email, password, and display name sign-up form
- Both screens use `supabase.auth.signInWithPassword()` and `supabase.auth.signUp()`
- Error messages displayed inline for invalid credentials or network errors

## Onboarding Flow

### Screens

1. `app/(onboarding)/welcome.tsx` — intro text, "Get Started" button
2. `app/(onboarding)/survey.tsx` — five-field survey form
3. `app/(onboarding)/farm-name.tsx` — farm name input, "Create Farm" button

### Survey Form

| Field | Input Type | Options |
|---|---|---|
| Farming location | Text input | Free text, optional |
| Type of farming | Select | outdoor, indoor, greenhouse, mixed |
| Preferred growing seasons | Multi-select chips | spring, summer, fall, winter |
| Interested produce | Multi-select chips | 15 plant names from catalog |
| Experience level | Select | beginner, intermediate, advanced |

Survey data is collected in local state and submitted with the farm creation. It does not filter the catalog or affect any other behavior.

### Farm Creation Flow

When the user taps "Create Farm" on the farm-name screen:

1. Insert into `farms` (name, created_by = current user id, farming_method = 'outdoor')
2. Insert into `farm_members` (farm_id, user_id = current user id, role = 'owner')
3. Update `profiles.onboarding_data` with survey responses and `completed: true`
4. Route to `(tabs)/plants`

Steps 1-3 should be atomic. If any step fails, none should persist. This can be handled with a Supabase Edge Function or a transactional RPC.

### Transactional Farm Creation (Edge Function or RPC)

To ensure atomicity, create a Postgres function `create_farm_with_member` that accepts farm name, user id, and onboarding data, and performs all three inserts in a transaction:

```sql
CREATE OR REPLACE FUNCTION create_farm_with_member(
  p_farm_name TEXT,
  p_user_id UUID,
  p_onboarding_data JSONB
) RETURNS UUID AS $$
DECLARE
  farm_id UUID;
BEGIN
  INSERT INTO farms (name, created_by)
  VALUES (p_farm_name, p_user_id)
  RETURNING id INTO farm_id;
  
  INSERT INTO farm_members (farm_id, user_id, role)
  VALUES (farm_id, p_user_id, 'owner');
  
  UPDATE profiles
  SET onboarding_data = p_onboarding_data
  WHERE id = p_user_id;
  
  RETURN farm_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

The mobile app calls this via `supabase.rpc('create_farm_with_member', ...)`.

## Plant Catalog

### Catalog Screen (`app/(tabs)/plants.tsx`)

- Renders a scrollable grid or list of plant cards
- Each card shows plant image (bundled asset) and name
- Search input at the top filters by name (case-insensitive, partial match)
- Tapping a card navigates to plant details

### Data Fetching

```typescript
// src/hooks/usePlants.ts
function usePlants(searchQuery: string) {
  const { data, loading, error } = useSupabaseQuery(
    () => supabase
      .from('plants')
      .select('id, name, slug, description, image_url')
      .ilike('name', `%${searchQuery}%`)
      .order('name')
  );
  return { plants: data, loading, error };
}
```

### Plant Details (`app/(tabs)/plants/[slug].tsx`)

- Shows full plant information
- "Add to Farm" button (creates planned crop)
- If already added, shows "Added" state with option to remove
- Growing season and template info are placeholders until Phase 4

### Image Resolution

```typescript
// src/utils/images.ts
const plantImages: Record<string, ImageSourcePropType> = {
  garlic: require('@/assets/images/garlic.png'),
  peas: require('@/assets/images/peas.png'),
  // ...
};

export function getPlantImage(imageKey: string): ImageSourcePropType {
  return plantImages[imageKey] || require('@/assets/images/placeholder.png');
}
```

A static mapping resolves the `image_url` database field to a bundled asset. A placeholder image is used if the key is missing.

## Plant Selection

### Adding a Plant

```typescript
// src/repositories/cropRepository.ts
async function addCrop(farmId: string, plantId: string) {
  const { data, error } = await supabase
    .from('farm_crops')
    .insert({ farm_id: farmId, plant_id: plantId, status: 'planned' })
    .select()
    .single();
  return { data, error };
}
```

The database trigger enforces the five-crop limit. If the insert fails with the limit error, the UI shows a message: "You can have up to 5 active crops. Remove one to add another."

### Removing a Plant

```typescript
async function archiveCrop(cropId: string) {
  const { error } = await supabase
    .from('farm_crops')
    .update({ status: 'archived' })
    .eq('id', cropId);
  return { error };
}
```

Soft delete — sets status to 'archived'. The crop's tasks (if any) are preserved.

### Selected Plants Display

The plants tab shows two sections:
1. "Your Crops" — selected plants with status planned or active (up to 5)
2. "Browse All" — full catalog for adding more

A badge or counter shows "X / 5 crops selected."

## Profile Screen

`app/(tabs)/profile.tsx` displays:
- User display name (from profiles)
- Farm name (from farms via farm_members)
- Sign out button (calls `supabase.auth.signOut()`)

## Repositories

| Repository | Methods |
|---|---|
| `plantRepository` | `getAll()`, `getBySlug(slug)`, `searchByName(query)` |
| `cropRepository` | `getActiveCrops(farmId)`, `addCrop(farmId, plantId)`, `archiveCrop(cropId)` |
| `farmRepository` | `getFarmForUser(userId)`, `createFarmWithMember(name, userId, data)` |
| `profileRepository` | `getProfile(userId)`, `updateProfile(userId, data)`, `isOnboarded(userId)` |

## Out of Scope for Phase 3

- Growing template selection and schedule generation (Phase 4)
- Calendar UI (Phase 5)
- Task management UI (Phase 5)
- Error state refinement (Phase 6)
