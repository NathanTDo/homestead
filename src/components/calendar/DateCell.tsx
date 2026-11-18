import { Pressable, StyleSheet } from 'react-native';
import { Text, View } from '@/components/Themed';
import type { CellIndicator, DayCell } from '@/features/calendar';

interface DateCellProps {
  /** null renders a blank cell outside the month. */
  cell: DayCell | null;
  indicator: CellIndicator;
  isToday: boolean;
  onPress: (date: string) => void;
}

const TODAY_COLOR = '#2f7d32';

/** One day of the month with its activity dots or count badge. */
export function DateCell({ cell, indicator, isToday, onPress }: DateCellProps) {
  if (!cell) return <View style={styles.cell} />;

  const hasTasks = indicator.kind !== 'none';
  const label = `${cell.date}${isToday ? ', today' : ''}${hasTasks ? ', has tasks' : ', no tasks'}`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={!hasTasks}
      onPress={() => onPress(cell.date)}
      style={styles.cell}
    >
      <View style={[styles.day, isToday && styles.today]}>
        <Text style={[styles.dayText, isToday && styles.todayText]}>{cell.day}</Text>
      </View>
      <View style={[styles.indicator, hasTasks && indicator.allDone && styles.done]}>
        {indicator.kind === 'dots'
          ? indicator.colors.map((color) => (
              <View key={color} style={[styles.dot, { backgroundColor: color }]} />
            ))
          : null}
        {indicator.kind === 'count' ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{indicator.count}</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cell: { flex: 1, minHeight: 56, alignItems: 'center', paddingTop: 4 },
  day: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  today: { backgroundColor: TODAY_COLOR },
  dayText: { fontSize: 15 },
  todayText: { color: '#fff', fontWeight: 'bold' },
  indicator: { flexDirection: 'row', gap: 3, height: 16, alignItems: 'center', marginTop: 2 },
  done: { opacity: 0.4 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  badge: {
    minWidth: 18,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    backgroundColor: '#6B7280',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
});
