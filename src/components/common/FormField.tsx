import { StyleSheet, TextInput, type TextInputProps } from 'react-native';
import { Text, useThemeColor, View } from '@/components/Themed';
import { palette } from '@/constants/Colors';

interface FormFieldProps extends TextInputProps {
  label: string;
}

export function FormField({ label, style, ...inputProps }: FormFieldProps) {
  const color = useThemeColor({}, 'text');
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={palette.textMuted}
        {...inputProps}
        style={[styles.input, { color }, style]}
        accessibilityLabel={label}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 12,
    backgroundColor: palette.surface,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
});
