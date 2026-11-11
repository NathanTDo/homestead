# Design: Phase 5 — Calendar and Task Management

## Overview

Phase 5 implements the monthly calendar view, plant filtering, event details, and task completion. After this phase, users can see their growing schedule on a calendar, filter by plant, view task details, and mark maintenance tasks as complete.

## Calendar Component

### Structure

The calendar is a custom React Native component (no heavy third-party calendar library needed for a monthly view). It renders:

```
┌──────────────────────────────┐
│  < November 2026 >           │  ← Month header with navigation
├──────────────────────────────┤
│ S  M  T  W  T  F  S          │  ← Day of week headers
├──────────────────────────────┤
│                1  2  3  4  5 │  ← Date cells with activity indicators
│ 6  7  8  9 10 11 12          │
│13 14 15 16 17 18 19          │
│20 21 22 23 24 25 26          │
│27 28 29 30                   │
└──────────────────────────────┘
```

### Components

- `src/components/calendar/CalendarGrid.tsx` — renders the month grid with date cells
- `src/components/calendar/CalendarHeader.tsx` — month/year display with prev/next navigation
- `src/components/calendar/DateCell.tsx` — individual date cell with activity dots/indicators
- `src/components/calendar/PlantFilter.tsx` — dropdown/chip selector for plant filtering
- `src/components/calendar/TaskListSheet.tsx` — bottom sheet or modal showing tasks for a tapped date

### Activity Indicators

Each date cell shows colored dots representing activity types:
- Blue dot: growing milestone (planting, germination, maturity)
- Green dot: harvest window
- Orange dot: maintenance (watering, fertilizing, pruning, pest inspection)

If a date has 3+ activities, show a count badge instead of individual dots to avoid overflow.

## Data Fetching

### Calendar Data Hook

```typescript
// src/hooks/useCalendarTasks.ts
function useCalendarTasks(year: number, month: number, plantFilter?: string) {
  return useSupabaseQuery(() => {
    let query = supabase
      .from('growing_tasks')
      .select(`
        id, task_type, title, description, scheduled_date, completed_at,
        farm_crops!inner(
          id, plant_id,
          plants!inner(name)
        )
      `)
      .gte('scheduled_date', `${year}-${month}-01`)
      .lt('scheduled_date', `${year}-${month + 1}-01`)
      .order('scheduled_date');

    if (plantFilter) {
      query = query.eq('farm_crops.plant_id', plantFilter);
    }

    return query;
  });
}
```

The query joins `growing_tasks` → `farm_crops` → `plants` to get the plant name for each task. RLS ensures the user only sees tasks for their farm's crops.

### Task Grouping

Tasks are grouped by date for calendar rendering and by date + plant for the task list.

```typescript
function groupTasksByDate(tasks: Task[]): Map<string, Task[]> {
  return tasks.reduce((map, task) => {
    const date = task.scheduled_date;
    if (!map.has(date)) map.set(date, []);
    map.get(date)!.push(task);
    return map;
  }, new Map());
}
```

## Task Detail View

### Screen

`app/(tabs)/calendar/task/[id].tsx` — shows full task details:

- Task title and type (with color indicator)
- Description and care instructions
- Scheduled date
- Associated plant name
- Completion toggle button

### Task Completion

```typescript
// src/repositories/taskRepository.ts
async function completeTask(taskId: string) {
  const { error } = await supabase
    .from('growing_tasks')
    .update({ completed_at: new Date().toISOString() })
    .eq('id', taskId);
  return { error };
}

async function uncompleteTask(taskId: string) {
  const { error } = await supabase
    .from('growing_tasks')
    .update({ completed_at: null })
    .eq('id', taskId);
  return { error };
}
```

## Activity Type Colors

```typescript
// src/constants/taskTypes.ts
export const TASK_TYPE_COLORS = {
  planting: '#2563EB',      // blue
  germination: '#2563EB',   // blue
  transplanting: '#2563EB', // blue
  maturity: '#2563EB',      // blue
  harvest_start: '#16A34A', // green
  harvest_end: '#16A34A',   // green
  watering: '#EA580C',      // orange
  fertilizing: '#EA580C',   // orange
  pruning: '#EA580C',       // orange
  pest_inspection: '#EA580C',// orange
  other: '#6B7280',         // gray
};

export const TASK_TYPE_LABELS = {
  planting: 'Planting',
  germination: 'Germination',
  // ...
};
```

## Filter

The plant filter lists the user's active crops (status 'active'). Selecting a plant filters the calendar and task list to show only that plant's tasks. "All Plants" is the default option.

Filter state is stored in local state on the calendar screen (no need for persistence across sessions in the MVP).

## Repositories

| Method | Purpose |
|---|---|
| `taskRepository.getTasksForMonth(year, month, plantId?)` | Fetch tasks for a month, optionally filtered by plant |
| `taskRepository.getTaskById(id)` | Fetch single task with plant name |
| `taskRepository.completeTask(id)` | Mark task as complete |
| `taskRepository.uncompleteTask(id)` | Mark task as incomplete |

## Out of Scope for Phase 5

- Push notifications (v1.1)
- Schedule regeneration (v1.1)
- Weather-adjusted tasks (future)
- Error/empty state polish (Phase 6)
