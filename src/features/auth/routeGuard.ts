import type { Profile } from '@/types';

export type AuthRoute = 'loading' | 'error' | 'auth' | 'onboarding' | 'app';

export interface AuthRouteInput {
  /** True until the stored session and (if signed in) the profile have been loaded. */
  loading: boolean;
  hasSession: boolean;
  /** True if loading the profile failed. We can't tell whether the user is onboarded. */
  profileError: boolean;
  profile: Profile | null;
}

export function isOnboarded(profile: Profile | null): boolean {
  return profile?.onboarding_data?.completed === true;
}

/** Decides which route group the user belongs in. */
export function resolveAuthRoute({
  loading,
  hasSession,
  profileError,
  profile,
}: AuthRouteInput): AuthRoute {
  if (loading) return 'loading';
  if (!hasSession) return 'auth';
  if (profileError) return 'error';
  return isOnboarded(profile) ? 'app' : 'onboarding';
}
