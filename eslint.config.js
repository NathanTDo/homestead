// ESLint flat config for Expo SDK 58.
// Uses eslint-config-expo as the base with TypeScript support.
const expoConfig = require('eslint-config-expo/flat');

module.exports = [
  ...expoConfig,
  {
    ignores: ['dist/*', '.expo/*', 'node_modules/*'],
  },
];
