import { Modal, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Text, View } from '@/components/Themed';
import { TASK_TYPE_LABELS, getTaskColor } from '@/constants/taskTypes';
import type { CalendarTask } from '@/types';
import { formatDate } from '@/utils/dates';

interface TaskListSheetProps {
  /** The day being shown, or null when the sheet is closed. */
  date: string | null;
  tasks: readonly CalendarTask[];
  onClose: () => void;
  onSelectTask: (task: CalendarTask) => void;
}

/** A bottom sheet listing every task on one day. */
export function TaskListSheet({ date, tasks, onClose, onSelectTask }: TaskListSheetProps) {
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
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    maxHeight: '60%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
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
  close: { fontSize: 16, color: '#2f7d32', fontWeight: '600' },
  item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  swatch: { width: 6, alignSelf: 'stretch', borderRadius: 3 },
  itemText: { flex: 1 },
  itemTitle: { fontSize: 16, fontWeight: '500' },
  done: { textDecorationLine: 'line-through', opacity: 0.5 },
  itemMeta: { fontSize: 13, opacity: 0.6, marginTop: 2 },
  check: { fontSize: 18, color: '#16A34A', fontWeight: 'bold' },
});
