/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  setupFiles: ['./tests/setup.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg)',
  ],
  // Integration and security tests need the local database and run with `npm run test:db`.
  testPathIgnorePatterns: [
    '/node_modules/',
    '/android/',
    '/ios/',
    '/tests/integration/',
    '/tests/security/',
  ],
};
