import type { Session } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as authRepository from '@/repositories/authRepository';
import * as profileRepository from '@/repositories/profileRepository';
import type { Profile } from '@/types';
import { resolveAuthRoute, type AuthRoute } from './routeGuard';

interface AuthContextValue {
  session: Session | null;
  profile: Profile | null;
  route: AuthRoute;
  /** Reloads the profile, e.g. after onboarding completes or on retry after an error. */
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

interface ProfileState {
  userId: string;
  profile: Profile | null;
  error: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [profileState, setProfileState] = useState<ProfileState | null>(null);

  // Load the stored session, then follow auth changes. The listener only stores the
  // session. Supabase calls inside it can deadlock, so the profile loads in another effect.
  useEffect(() => {
    let active = true;
    authRepository
      .getSession()
      .then((s) => active && setSession(s))
      .catch(() => active && setSession(null))
      .finally(() => active && setSessionLoading(false));
    const unsubscribe = authRepository.onAuthStateChange((_event, s) => {
      setSession(s);
      setSessionLoading(false);
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const userId = session?.user.id ?? null;

  const loadProfile = useCallback(async (id: string) => {
    try {
      const loaded = await profileRepository.getProfile(id);
      setProfileState({ userId: id, profile: loaded, error: false });
    } catch {
      setProfileState({ userId: id, profile: null, error: true });
    }
  }, []);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    profileRepository
      .getProfile(userId)
      .then((loaded) => active && setProfileState({ userId, profile: loaded, error: false }))
      .catch(() => active && setProfileState({ userId, profile: null, error: true }));
    return () => {
      active = false;
    };
  }, [userId]);

  const refreshProfile = useCallback(async () => {
    if (userId) await loadProfile(userId);
  }, [userId, loadProfile]);

  // The stored profile only counts if it belongs to the current user. This also means a
  // signed-in user is "loading" until their profile arrives, so the guard never sees
  // "signed in with no profile yet".
  const current = userId !== null && profileState?.userId === userId ? profileState : null;
  const profile = current?.profile ?? null;
  const profileError = current?.error ?? false;
  const profileLoading = userId !== null && current === null;

  const route = resolveAuthRoute({
    loading: sessionLoading || profileLoading,
    hasSession: session !== null,
    profileError,
    profile,
  });

  const value = useMemo<AuthContextValue>(
    () => ({ session, profile, route, refreshProfile, signOut: authRepository.signOut }),
    [session, profile, route, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside <AuthProvider>.');
  return value;
}
