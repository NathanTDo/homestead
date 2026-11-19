/**
 * Integration and security tests. They run the app's real repository code against the LOCAL
 * Supabase database (`supabase start`). Run with `npm run test:db`.
 *
 * This does not use the jest-expo preset. That preset replaces `fetch` with a React Native
 * version, and these tests need the real network. The repositories contain no React Native code.
 */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/integration/**/*.test.ts', '<rootDir>/tests/security/**/*.test.ts'],
  transform: {
    '\\.[jt]sx?$': ['babel-jest', { presets: ['babel-preset-expo'] }],
  },
  globalSetup: '<rootDir>/tests/integration/globalSetup.js',
  setupFilesAfterEnv: ['<rootDir>/tests/integration/setupAfterEnv.ts'],
  moduleNameMapper: {
    // The repositories import this module. Tests give them a client for the test user.
    '^@/services/supabase/client$': '<rootDir>/tests/integration/helpers/activeClient.ts',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testTimeout: 30000,
  maxWorkers: 1,
};
