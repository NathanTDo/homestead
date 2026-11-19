import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Button, EmptyState, ErrorState, LoadingState } from '@/components/common';
import { Text, View } from '@/components/Themed';
import {
  CATEGORY_LABELS,
  TASK_CATEGORY,
  TASK_TYPE_HELP,
  TASK_TYPE_LABELS,
  canCompleteTask,
  getTaskColor,
} from '@/constants/taskTypes';
import { useTask } from '@/features/calendar';
import { getErrorMessage } from '@/utils/errors';
import * as taskRepository from '@/repositories/taskRepository';
import { formatDate, isoDateFromLocal } from '@/utils/dates';
import { palette } from '@/constants/Colors';

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: task, loading, error, offline, reload, refresh } = useTask(id);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  if (loading) {
    return <LoadingState message="Loading task" />;
  }
  if (error) {
    return <ErrorState message="Could not load this task." offline={offline} onRetry={reload} />;
  }
  if (!task) {
    return (
      <EmptyState fullScreen icon="help-circle-outline" message="That task could not be found" />
    );
  }

  const done = task.completed_at !== null;
  const color = getTaskColor(task.task_type);
  const description = task.description ?? TASK_TYPE_HELP[task.task_type] ?? null;

  async function toggle() {
    if (!task) return;
    setBusy(true);
    setActionError(null);
    try {
      if (done) await taskRepository.uncompleteTask(task.id);
      else await taskRepository.completeTask(task.id);
      refresh();
    } catch (e) {
      setActionError(
        /network|fetch|connect/i.test(getErrorMessage(e))
          ? 'Could not reach the server. Check your connection and try again.'
          : 'Could not update this task. Try again.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: task.plant_name }} />
      <View style={styles.typeRow}>
        <View style={[styles.swatch, { backgroundColor: color }]} />
        <Text style={styles.type}>
          {TASK_TYPE_LABELS[task.task_type]} · {CATEGORY_LABELS[TASK_CATEGORY[task.task_type]]}
        </Text>
      </View>
      <Text style={[styles.title, done && styles.doneTitle]}>{task.title}</Text>

      <Detail label="Plant" value={task.plant_name} />
      <Detail label="Date" value={formatDate(task.scheduled_date)} />
      <Detail
        label="Status"
        value={
          done
            ? `Completed ${formatDate(isoDateFromLocal(new Date(task.completed_at!)))}`
            : 'Not completed'
        }
      />
      {description ? <Detail label="Instructions" value={description} /> : null}

      <View style={styles.actions}>
        {canCompleteTask(task.task_type) ? (
          <Button
            title={done ? 'Mark as not done' : 'Mark as done'}
            onPress={toggle}
            loading={busy}
          />
        ) : (
          <Text style={styles.note}>
            This is a date to watch for. It is not something you tick off.
          </Text>
        )}
        {actionError ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {actionError}
          </Text>
        ) : null}
      </View>
    </ScrollView>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detail}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', padding: 24, gap: 12 },
  message: { textAlign: 'center', opacity: 0.7 },
  content: { padding: 24 },
  typeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  swatch: { width: 12, height: 12, borderRadius: 6 },
  type: { fontSize: 14, opacity: 0.7 },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 20 },
  doneTitle: { textDecorationLine: 'line-through', opacity: 0.6 },
  detail: { marginBottom: 14 },
  detailLabel: { fontSize: 12, fontWeight: '600', opacity: 0.6, textTransform: 'uppercase' },
  detailValue: { fontSize: 16, marginTop: 2, lineHeight: 22 },
  actions: { marginTop: 16, gap: 8 },
  note: { textAlign: 'center', opacity: 0.6 },
  error: { color: palette.danger, textAlign: 'center' },
});
