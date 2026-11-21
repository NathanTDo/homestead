import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View } from '@/components/Themed';

interface StateLayoutProps {
  children: React.ReactNode;
  /** Fill the screen and center the content. Otherwise it sits inline with some spacing. */
  fullScreen?: boolean;
  /** Keep clear of the notch and home indicator. Use for screens without a header. */
  safeArea?: boolean;
}

/** Shared layout for the loading, error and empty states. */
export function StateLayout({ children, fullScreen = true, safeArea = false }: StateLayoutProps) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        fullScreen ? styles.fullScreen : styles.inline,
        safeArea && { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  inline: { alignItems: 'center', paddingVertical: 24, paddingHorizontal: 24, gap: 12 },
});
