import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';
import { Text, useThemeColor, View } from '@/components/Themed';

interface CalendarHeaderProps {
  /** e.g. "March 2025" */
  label: string;
  onPrevious: () => void;
  onNext: () => void;
}

export function CalendarHeader({ label, onPrevious, onNext }: CalendarHeaderProps) {
  const color = useThemeColor({}, 'text');
  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Previous month"
        hitSlop={12}
        onPress={onPrevious}
      >
        <Ionicons name="chevron-back" size={26} color={color} />
      </Pressable>
      <Text accessibilityRole="header" style={styles.label}>
        {label}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Next month"
        hitSlop={12}
        onPress={onNext}
      >
        <Ionicons name="chevron-forward" size={26} color={color} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  label: { fontSize: 20, fontWeight: '600' },
});
