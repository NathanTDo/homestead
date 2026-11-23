import { Pressable, StyleSheet } from 'react-native';
import { Text, View } from '@/components/Themed';
import { palette } from '@/constants/Colors';
import { HARVEST_BAR_COLOR } from '@/constants/taskTypes';
import type { CellIndicator, DayCell, HarvestSegment } from '@/features/calendar';
import { formatDate } from '@/utils/dates';

interface DateCellProps {
  /** null renders a blank cell outside the month. */
  cell: DayCell | null;
  indicator: CellIndicator;
  /** How many tasks are on this day. */
  taskCount: number;
  isToday: boolean;
  /** Set when the day is inside a harvest window, to draw the bar under the dots. */
  harvest: HarvestSegment | null;
  onPress: (date: string) => void;
}

/** One day of the month with its activity dots or count badge. */
export function DateCell({ cell, indicator, taskCount, isToday, harvest, onPress }: DateCellProps) {
  if (!cell) return <View style={styles.cell} />;

  // A day with only the harvest bar still opens the day's list, which explains the bar.
  const hasTasks = taskCount > 0 || harvest !== null;
  const tasksText =
    taskCount === 0 ? 'no tasks' : taskCount === 1 ? '1 task' : `${taskCount} tasks`;
  const label = `${formatDate(cell.date)}${isToday ? ', today' : ''}, ${tasksText}${harvest ? ', harvest window' : ''}`;

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
      <View
        style={[styles.indicator, indicator.kind !== 'none' && indicator.allDone && styles.done]}
      >
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
      <View style={styles.barSlot}>
        {harvest ? (
          <View
            testID="harvest-bar"
            style={
              harvest.startsHere && harvest.endsHere
                ? styles.barDot
                : [
                    styles.bar,
                    // Start and end at the middle of the cell, with rounded ends. Where the bar
                    // continues into a neighboring cell, it runs to that cell's edge.
                    harvest.startsHere ? styles.barStart : styles.barOpenLeft,
                    harvest.endsHere ? styles.barEnd : styles.barOpenRight,
                  ]
            }
          />
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cell: { flex: 1, minHeight: 66, alignItems: 'center', paddingTop: 4 },
  day: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  today: { backgroundColor: palette.surface },
  dayText: { fontSize: 15, color: palette.cardText },
  todayText: { color: palette.text, fontWeight: 'bold' },
  indicator: { flexDirection: 'row', gap: 3, height: 16, alignItems: 'center', marginTop: 2 },
  done: { opacity: 0.4 },
  // The slot is always there so days line up whether or not they have a bar. The bar runs
  // through the middle of the cell and joins the bars of neighboring days into one strip.
  barSlot: { alignSelf: 'stretch', height: 7, marginTop: 3, alignItems: 'center' },
  bar: { position: 'absolute', top: 0, bottom: 0, backgroundColor: HARVEST_BAR_COLOR },
  barStart: { left: '50%', borderTopLeftRadius: 4, borderBottomLeftRadius: 4 },
  barOpenLeft: { left: 0 },
  barEnd: { right: '50%', borderTopRightRadius: 4, borderBottomRightRadius: 4 },
  barOpenRight: { right: 0 },
  barDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: HARVEST_BAR_COLOR },
  dot: { width: 7, height: 7, borderRadius: 4 },
  badge: {
    minWidth: 18,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    backgroundColor: palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: palette.text, fontSize: 11, fontWeight: 'bold' },
});
