import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Stands in for `src/services/supabase/client` during these tests. The repositories import
 * `supabase` from there, and this forwards every call to whichever client a test chose with
 * `as(user)`. That way the tests run the app's real repository code as a given user.
 */
let active: SupabaseClient | null = null;

export function setActiveClient(client: SupabaseClient | null) {
  active = client;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, property) {
    if (!active) {
      throw new Error('No test client is active. Call as(user) or as(anonymous) first.');
    }
    const value = (active as unknown as Record<string | symbol, unknown>)[property];
    return typeof value === 'function' ? value.bind(active) : value;
  },
});
