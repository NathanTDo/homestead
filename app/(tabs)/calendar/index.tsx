import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CalendarGrid,
  CalendarHeader,
  PlantFilter,
  TaskListSheet,
  type PlantFilterOption,
} from '@/components/calendar';
import { EmptyState, ErrorState, LoadingState } from '@/components/common';
import { Text, View } from '@/components/Themed';
import {
  buildMonthGrid,
  currentMonth,
  monthLabel,
  shiftMonth,
  useCalendarTasks,
  type MonthRef,
} from '@/features/calendar';
import { useFarm } from '@/features/farm';
import { usePlants } from '@/features/plants';
import { palette } from '@/constants/Colors';
import type { CalendarTask } from '@/types';
import { todayIso } from '@/utils/dates';

export default function CalendarScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { crops } = useFarm();
  const { allPlants } = usePlants('');

  const [month, setMonth] = useState<MonthRef>(() => currentMonth());
  const [plantId, setPlantId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Only active crops have tasks, so they are the filter choices.
  const filterOptions = useMemo<PlantFilterOption[]>(
    () =>
      crops
        .filter((crop) => crop.status === 'active')
        .map((crop) => ({
          plantId: crop.plant_id,
          name: allPlants.find((plant) => plant.id === crop.plant_id)?.name ?? '',
        }))
        .filter((option) => option.name !== ''),
    [crops, allPlants],
  );
  // If the chosen plant is no longer an active crop, fall back to all plants.
  const activePlantId = filterOptions.some((o) => o.plantId === plantId) ? plantId : null;

  const { tasksByDate, loading, error, offline, reload, refresh } = useCalendarTasks(
    month,
    activePlantId,
  );

  // Coming back from a task screen: pick up changes such as a completed task, without a spinner.
  const hasFocusedOnce = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (hasFocusedOnce.current) refresh();
      hasFocusedOnce.current = true;
    }, [refresh]),
  );

  const weeks = useMemo(() => buildMonthGrid(month), [month]);
  const selectedTasks = selectedDate ? (tasksByDate.get(selectedDate) ?? []) : [];

  function openTask(task: CalendarTask) {
    setSelectedDate(null);
    router.push(`/calendar/task/${task.id}`);
  }

  return (
    <ScrollView style={{ paddingTop: insets.top }} contentContainerStyle={styles.content}>
      <Text accessibilityRole="header" style={styles.title}>
        Calendar
      </Text>

      {filterOptions.length > 0 ? (
        <View style={styles.filter}>
          <PlantFilter
            plants={filterOptions}
            selectedPlantId={activePlantId}
            onChange={setPlantId}
          />
        </View>
      ) : null}

      <View style={styles.panel}>
        <CalendarHeader
          label={monthLabel(month)}
          onPrevious={() => setMonth((m) => shiftMonth(m, -1))}
          onNext={() => setMonth((m) => shiftMonth(m, 1))}
        />
        <CalendarGrid
          weeks={weeks}
          tasksByDate={tasksByDate}
          today={todayIso()}
          onSelectDate={setSelectedDate}
        />
      </View>

      {loading ? (
        <LoadingState fullScreen={false} message="Loading your tasks" />
      ) : error ? (
        <ErrorState
          fullScreen={false}
          message="Could not load your tasks."
          offline={offline}
          onRetry={reload}
        />
      ) : tasksByDate.size === 0 ? (
        <EmptyState
          icon="calendar-outline"
          message="No activities scheduled this month"
          hint={
            filterOptions.length === 0
              ? 'Set up a schedule for one of your crops to see its tasks here.'
              : undefined
          }
        />
      ) : null}

      <TaskListSheet
        date={selectedDate}
        tasks={selectedTasks}
        onClose={() => setSelectedDate(null)}
        onSelectTask={openTask}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 32 },
  title: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginVertical: 12 },
  panel: {
    marginHorizontal: 16,
    padding: 8,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: palette.border,
  },
  filter: { paddingHorizontal: 16, paddingTop: 4 },
  status: { marginTop: 16, paddingHorizontal: 24, gap: 12 },
  message: { textAlign: 'center', opacity: 0.7 },
});
