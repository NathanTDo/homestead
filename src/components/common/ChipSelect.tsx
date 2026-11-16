import { Pressable, StyleSheet } from 'react-native';
import { Text, View } from '@/components/Themed';

export interface ChipOption<T extends string> {
  value: T;
  label: string;
}

interface ChipSelectProps<T extends string> {
  label: string;
  options: readonly ChipOption<T>[];
  selected: readonly T[];
  onChange: (next: T[]) => void;
  /** Allow several chips to be selected. Default is a single choice. */
  multiple?: boolean;
}

export function ChipSelect<T extends string>({
  label,
  options,
  selected,
  onChange,
  multiple = false,
}: ChipSelectProps<T>) {
  function toggle(value: T) {
    const isSelected = selected.includes(value);
    if (multiple) {
      onChange(isSelected ? selected.filter((v) => v !== value) : [...selected, value]);
    } else {
      onChange(isSelected ? [] : [value]);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.chips}>
        {options.map((option) => {
          const isSelected = selected.includes(option.value);
          return (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              onPress={() => toggle(option.value)}
              style={[styles.chip, isSelected && styles.chipSelected]}
            >
              <Text style={isSelected ? styles.chipTextSelected : styles.chipText}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipSelected: { backgroundColor: '#2f7d32', borderColor: '#2f7d32' },
  chipText: { fontSize: 14 },
  chipTextSelected: { fontSize: 14, color: '#fff', fontWeight: '600' },
});
