import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { Text } from '@/components/Themed';
import { palette } from '@/constants/Colors';

interface ButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'link';
}

export function Button({ title, onPress, loading, disabled, variant = 'primary' }: ButtonProps) {
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      disabled={inactive}
      onPress={onPress}
      style={[
        styles.base,
        variant === 'primary' ? styles.primary : styles.link,
        inactive && styles.inactive,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? palette.onAccent : palette.accent} />
      ) : (
        <Text style={variant === 'primary' ? styles.primaryText : styles.linkText}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: 8, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  primary: { backgroundColor: palette.accent },
  link: { backgroundColor: 'transparent' },
  inactive: { opacity: 0.5 },
  primaryText: { color: palette.onAccent, fontSize: 16, fontWeight: '600' },
  linkText: { fontSize: 14, color: palette.accent, fontWeight: '600' },
});
