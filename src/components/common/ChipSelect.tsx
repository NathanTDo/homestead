import { Pressable, StyleSheet } from 'react-native';
import { Text, View } from '@/components/Themed';
import { palette } from '@/constants/Colors';

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
  /** With `multiple`, the most chips that can be selected. The rest are disabled once reached. */
  maxSelected?: number;
}

export function ChipSelect<T extends string>({
  label,
  options,
  selected,
  onChange,
  multiple = false,
  maxSelected,
}: ChipSelectProps<T>) {
  const atLimit = multiple && maxSelected !== undefined && selected.length >= maxSelected;
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
          const disabled = atLimit && !isSelected;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected, disabled }}
              disabled={disabled}
              onPress={() => toggle(option.value)}
              style={[
                styles.chip,
                isSelected && styles.chipSelected,
                disabled && styles.chipDisabled,
              ]}
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
    borderColor: palette.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipSelected: { backgroundColor: palette.accent, borderColor: palette.accent },
  chipDisabled: { opacity: 0.4 },
  chipText: { fontSize: 14 },
  chipTextSelected: { fontSize: 14, color: palette.onAccent, fontWeight: '600' },
});
