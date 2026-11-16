import { resolveAuthRoute, isOnboarded } from '../../src/features/auth/routeGuard';
import type { Profile } from '../../src/types';

const baseProfile: Profile = {
  id: 'u1',
  email: 'a@test.dev',
  display_name: 'A',
  onboarding_data: null,
  created_at: '',
  updated_at: '',
};
const onboardedProfile: Profile = { ...baseProfile, onboarding_data: { completed: true } };

describe('isOnboarded', () => {
  it('is false without a profile or without the completed flag', () => {
    expect(isOnboarded(null)).toBe(false);
    expect(isOnboarded(baseProfile)).toBe(false);
    expect(isOnboarded({ ...baseProfile, onboarding_data: { completed: false } })).toBe(false);
    expect(isOnboarded({ ...baseProfile, onboarding_data: { farming_type: 'outdoor' } })).toBe(
      false,
    );
  });

  it('is true only when completed is true', () => {
    expect(isOnboarded(onboardedProfile)).toBe(true);
  });
});

describe('resolveAuthRoute', () => {
  const signedOut = { loading: false, hasSession: false, profileError: false, profile: null };

  it('waits while loading, even if a session exists', () => {
    expect(resolveAuthRoute({ ...signedOut, loading: true })).toBe('loading');
    expect(resolveAuthRoute({ ...signedOut, loading: true, hasSession: true })).toBe('loading');
  });

  it('sends signed-out users to auth', () => {
    expect(resolveAuthRoute(signedOut)).toBe('auth');
  });

  it('sends signed-in users without a completed onboarding to onboarding', () => {
    const input = { ...signedOut, hasSession: true };
    expect(resolveAuthRoute({ ...input, profile: null })).toBe('onboarding');
    expect(resolveAuthRoute({ ...input, profile: baseProfile })).toBe('onboarding');
  });

  it('sends onboarded users to the app', () => {
    expect(resolveAuthRoute({ ...signedOut, hasSession: true, profile: onboardedProfile })).toBe(
      'app',
    );
  });

  it('shows an error, not onboarding, when the profile failed to load', () => {
    expect(resolveAuthRoute({ ...signedOut, hasSession: true, profileError: true })).toBe('error');
  });
});
