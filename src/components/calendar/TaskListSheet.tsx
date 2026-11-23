import { Modal, Pressable, ScrollView, StyleSheet } from 'react-native';
import { EmptyState } from '@/components/common';
import { Text, View } from '@/components/Themed';
import { HARVEST_BAR_COLOR, TASK_TYPE_LABELS, getTaskColor } from '@/constants/taskTypes';
import type { HarvestWindow } from '@/features/calendar';
import { palette } from '@/constants/Colors';
import type { CalendarTask } from '@/types';
import { formatDate } from '@/utils/dates';

interface TaskListSheetProps {
  /** The day being shown, or null when the sheet is closed. */
  date: string | null;
  tasks: readonly CalendarTask[];
  /** Harvest windows whose green bar covers this day. */
  harvestWindows?: readonly HarvestWindow[];
  onClose: () => void;
  onSelectTask: (task: CalendarTask) => void;
  onSelectHarvestWindow?: (window: HarvestWindow) => void;
}

/** A bottom sheet listing every task on one day. */
export function TaskListSheet({
  date,
  tasks,
  harvestWindows = [],
  onClose,
  onSelectTask,
  onSelectHarvestWindow,
}: TaskListSheetProps) {
  return (
    <Modal visible={date !== null} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        accessibilityLabel="Close"
        accessibilityRole="button"
        style={styles.backdrop}
        onPress={onClose}
      />
      <View style={styles.sheet}>
        <View style={styles.titleRow}>
          <Text accessibilityRole="header" style={styles.title}>
            {date ? formatDate(date) : ''}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            hitSlop={12}
            onPress={onClose}
          >
            <Text style={styles.close}>Close</Text>
          </Pressable>
        </View>
        <ScrollView>
          {tasks.length === 0 && harvestWindows.length === 0 ? (
            <EmptyState message="No activities on this date" icon="calendar-outline" />
          ) : null}
          {harvestWindows.map((window) => (
            <Pressable
              key={window.farm_crop_id}
              accessibilityRole="button"
              accessibilityLabel={`Harvest window, ${window.plant_name}`}
              onPress={() => onSelectHarvestWindow?.(window)}
              style={styles.item}
            >
              <View style={[styles.swatch, { backgroundColor: HARVEST_BAR_COLOR }]} />
              <View style={styles.itemText}>
                <Text style={styles.itemTitle}>Harvest window</Text>
                <Text style={styles.itemMeta}>
                  {window.plant_name} · {formatDate(window.start)} to {formatDate(window.end)}
                </Text>
              </View>
            </Pressable>
          ))}
          {tasks.map((task) => {
            const done = task.completed_at !== null;
            return (
              <Pressable
                key={task.id}
                accessibilityRole="button"
                accessibilityLabel={`${task.title}, ${task.plant_name}${done ? ', completed' : ''}`}
                onPress={() => onSelectTask(task)}
                style={styles.item}
              >
                <View style={[styles.swatch, { backgroundColor: getTaskColor(task.task_type) }]} />
                <View style={styles.itemText}>
                  <Text style={[styles.itemTitle, done && styles.done]}>{task.title}</Text>
                  <Text style={styles.itemMeta}>
                    {task.plant_name} · {TASK_TYPE_LABELS[task.task_type]}
                  </Text>
                </View>
                {done ? <Text style={styles.check}>✓</Text> : null}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: palette.overlay },
  sheet: {
    maxHeight: '60%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: palette.surface,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: { fontSize: 18, fontWeight: '600' },
  close: { fontSize: 16, color: palette.accent, fontWeight: '600' },
  item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  swatch: { width: 6, alignSelf: 'stretch', borderRadius: 3 },
  itemText: { flex: 1 },
  itemTitle: { fontSize: 16, fontWeight: '500' },
  done: { textDecorationLine: 'line-through', opacity: 0.5 },
  itemMeta: { fontSize: 13, opacity: 0.6, marginTop: 2 },
  check: { fontSize: 18, color: palette.accent, fontWeight: 'bold' },
});
