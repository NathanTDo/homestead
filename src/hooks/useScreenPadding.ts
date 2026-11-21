import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Padding for a screen that has no navigation header or tab bar of its own (sign-in,
 * onboarding), so content stays clear of the notch, status bar and home indicator.
 */
export function useScreenPadding(base = 24) {
  const insets = useSafeAreaInsets();
  return {
    paddingTop: insets.top + base,
    paddingBottom: insets.bottom + base,
    paddingLeft: insets.left + base,
    paddingRight: insets.right + base,
  };
}
