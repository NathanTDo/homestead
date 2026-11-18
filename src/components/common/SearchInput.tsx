import { StyleSheet, TextInput } from 'react-native';
import { useThemeColor } from '@/components/Themed';
import { palette } from '@/constants/Colors';

interface SearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export function SearchInput({ value, onChangeText, placeholder = 'Search' }: SearchInputProps) {
  const color = useThemeColor({}, 'text');
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={palette.textMuted}
      accessibilityLabel={placeholder}
      autoCapitalize="none"
      autoCorrect={false}
      clearButtonMode="while-editing"
      returnKeyType="search"
      style={[styles.input, { color }]}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 12,
    backgroundColor: palette.surface,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
  },
});
