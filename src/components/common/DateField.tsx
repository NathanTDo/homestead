import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet } from 'react-native';
import { Text, View } from '@/components/Themed';
import {
  formatDate,
  isoDateFromLocal,
  localDateFromIso,
  todayIso,
  type IsoDate,
} from '@/utils/dates';

interface DateFieldProps {
  label: string;
  /** The chosen day, or null if none yet. */
  value: IsoDate | null;
  onChange: (date: IsoDate) => void;
  placeholder?: string;
}

const MIN_DATE = new Date(2000, 0, 1);
const MAX_DATE = new Date(2100, 11, 31);

/** A tappable date field. Opens the system dialog on Android and an inline calendar on iOS. */
export function DateField({
  label,
  value,
  onChange,
  placeholder = 'Choose a date',
}: DateFieldProps) {
  const [iosOpen, setIosOpen] = useState(false);
  const pickerValue = localDateFromIso(value ?? todayIso());

  function open() {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: pickerValue,
        mode: 'date',
        minimumDate: MIN_DATE,
        maximumDate: MAX_DATE,
        onChange: (event, date) => {
          if (event.type === 'set' && date) onChange(isoDateFromLocal(date));
        },
      });
    } else {
      setIosOpen((current) => !current);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value ? formatDate(value) : placeholder}`}
        onPress={open}
        style={styles.field}
      >
        <Text style={value ? styles.value : styles.placeholder}>
          {value ? formatDate(value) : placeholder}
        </Text>
      </Pressable>
      {Platform.OS === 'ios' && iosOpen ? (
        <DateTimePicker
          value={pickerValue}
          mode="date"
          display="inline"
          minimumDate={MIN_DATE}
          maximumDate={MAX_DATE}
          onChange={(_event, date) => {
            if (date) onChange(isoDateFromLocal(date));
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 6 },
  field: {
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  value: { fontSize: 16 },
  placeholder: { fontSize: 16, opacity: 0.5 },
});
