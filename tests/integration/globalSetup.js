// Finds the local Supabase URL and keys before the tests run, and refuses to continue unless
// the database is on this machine. Values can be overridden with IT_SUPABASE_URL,
// IT_ANON_KEY and IT_SERVICE_KEY.
const { execFileSync } = require('node:child_process');

function readSupabaseStatus() {
  let output;
  try {
    output = execFileSync('supabase', ['status', '-o', 'env'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch {
    throw new Error(
      'Could not read the local Supabase status. Make sure Docker is running and start it with `supabase start`.',
    );
  }
  const values = {};
  for (const line of output.split('\n')) {
    const match = /^([A-Z_]+)="?(.*?)"?$/.exec(line.trim());
    if (match) values[match[1]] = match[2];
  }
  return values;
}

module.exports = async function globalSetup() {
  const status =
    process.env.IT_SUPABASE_URL && process.env.IT_ANON_KEY && process.env.IT_SERVICE_KEY
      ? {}
      : readSupabaseStatus();

  const url = process.env.IT_SUPABASE_URL || status.API_URL;
  const anonKey = process.env.IT_ANON_KEY || status.ANON_KEY || status.PUBLISHABLE_KEY;
  const serviceKey = process.env.IT_SERVICE_KEY || status.SERVICE_ROLE_KEY || status.SECRET_KEY;
  if (!url || !anonKey || !serviceKey) {
    throw new Error('Could not find the local Supabase URL and keys. Is `supabase start` running?');
  }

  const host = new URL(url).hostname;
  if (host !== '127.0.0.1' && host !== 'localhost') {
    throw new Error(
      `Refusing to run database tests against ${host}. They create and delete data and only run against a local database.`,
    );
  }

  process.env.IT_SUPABASE_URL = url;
  process.env.IT_ANON_KEY = anonKey;
  process.env.IT_SERVICE_KEY = serviceKey;
};
