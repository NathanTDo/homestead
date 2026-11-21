import { StyleSheet } from 'react-native';
import { Text, View } from '@/components/Themed';
import { WEEKDAY_LABELS, cellIndicator, type GridWeek } from '@/features/calendar';
import { palette } from '@/constants/Colors';
import type { CalendarTask } from '@/types';
import { DateCell } from './DateCell';

interface CalendarGridProps {
  weeks: GridWeek[];
  tasksByDate: ReadonlyMap<string, CalendarTask[]>;
  /** "YYYY-MM-DD" of today, to highlight. */
  today: string;
  onSelectDate: (date: string) => void;
}

export function CalendarGrid({ weeks, tasksByDate, today, onSelectDate }: CalendarGridProps) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {WEEKDAY_LABELS.map((label, index) => (
          <Text key={index} style={styles.weekday}>
            {label}
          </Text>
        ))}
      </View>
      {weeks.map((week, weekIndex) => (
        <View key={weekIndex} style={styles.row}>
          {week.map((cell, index) => (
            <DateCell
              key={cell?.date ?? `blank-${weekIndex}-${index}`}
              cell={cell}
              indicator={cellIndicator(cell ? (tasksByDate.get(cell.date) ?? []) : [])}
              taskCount={cell ? (tasksByDate.get(cell.date)?.length ?? 0) : 0}
              isToday={cell?.date === today}
              onPress={onSelectDate}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: palette.card,
  },
  row: { flexDirection: 'row' },
  weekday: {
    flex: 1,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
    color: palette.cardText,
    paddingVertical: 6,
  },
});
