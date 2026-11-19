// Jest setup file.
// Screens read safe area insets, which need a provider on a real device. In tests they get zeros.
/* eslint-disable @typescript-eslint/no-require-imports */
jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);
