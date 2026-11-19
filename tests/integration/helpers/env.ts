export interface TestEnv {
  url: string;
  anonKey: string;
  serviceKey: string;
}

export function getEnv(): TestEnv {
  const url = process.env.IT_SUPABASE_URL;
  const anonKey = process.env.IT_ANON_KEY;
  const serviceKey = process.env.IT_SERVICE_KEY;
  if (!url || !anonKey || !serviceKey) {
    throw new Error(
      'The database test environment is not set up. Run these tests with `npm run test:db`.',
    );
  }
  return { url, anonKey, serviceKey };
}
