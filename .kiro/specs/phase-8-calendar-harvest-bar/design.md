# Design: Phase 8 — Calendar Colors and Harvest Bar

## Overview

Watering becomes blue, every important milestone becomes green, and a green rounded bar runs across the days of each harvest window, below the dots. No database change.

## Cell Layout

```
   Fri      Sat        Sun      Mon
 ┌───────┬───────┐  ┌───────┬───────┐
 │  10   │  11   │  │  12   │  13   │   day number
 │  ●    │       │  │       │   ●   │   dots (none for maturity or harvest begins and ends)
 │  ╭━━━━━━━━━╮  │  │  ╭━━━━━━━━━╮  │   bar: starts and ends at the middle of a cell
 └───────┴───────┘  └───────┴───────┘   rounded ends, and a new run after the week wraps
```

`DateCell` renders, in order: the day number, the indicator row (16 px high), and a bar slot (7 px high, full width of the cell). The slot is always present, so rows keep their height. The cell's minimum height grew from 56 to 66 px.

### Bar geometry

Each cell draws one segment, absolutely positioned inside its slot:

- Starts here: `left: 50%` with rounded left corners. Otherwise `left: 0`.
- Ends here: `right: 50%` with rounded right corners. Otherwise `right: 0`.
- Starts and ends here: a 7 px round dot, centered.
  The segments of neighboring cells meet at the cell border, so a run looks like one strip that begins and ends at the middle of its first and last day.

## Colors (`src/constants/taskTypes.ts`)

- `CATEGORY_COLORS.milestone` and `.harvest` are both `#22C55E`. `maintenance` stays orange, `other` gray.
- `TASK_TYPE_COLORS` overrides the category color per task type. It holds only `watering: #3B82F6`.
- `getTaskColor(type)` returns the override, else the category color. `cellIndicator` now uses it, so the calendar dots, the task list swatch and the task detail agree. The color list for a cell is a set, so equal colors collapse to one dot.
- `HARVEST_BAR_COLOR` is the harvest category color.

## Harvest Windows

### Data

The month query only returns tasks scheduled in the displayed month, so it cannot draw a window that crosses months. A second query supplies the windows:
`taskRepository.getHarvestTasks(plantId?)` returns the `maturity`, `harvest_start` and `harvest_end` tasks of every crop that is not archived, in any month, with the same columns and plant filter as the month query. Row level security limits it to the user's farm. A farm has at most 5 active crops, so this is at most 15 rows.
`useHarvestWindows(plantId)` wraps it in `useAsyncData` (key `harvest:<plant or all>`), turns the rows into windows, and returns them with `refresh`. It ignores errors on purpose (REQ-014). The calendar screen calls `refresh` on focus, next to the tasks' refresh.

### Logic (`src/features/calendar/logic.ts`)

- `buildHarvestWindows(tasks)` builds one `HarvestWindow` per crop: `{ farm_crop_id, plant_id, plant_name, maturity, harvestStart, harvestEnd, start, end }`. `start` and `end` are the first and last day of the bar. They equal the harvest dates, widened to cover the maturity date when it falls outside them. A crop missing a harvest task, or whose harvest end is before its start, has no window.
- `harvestWindowsOn(date, windows)` returns the windows whose bar covers a day. The day list uses it.
- `isHarvestDay(date, windows)` is true when any window's bar covers the date, both ends included. It and `harvestSegments` only need `start` and `end` (`BarRange`).
- `harvestSegments(week, windows)` returns, for each cell of one calendar row, `null` or `{ startsHere, endsHere }`. `startsHere` is true when the cell before it in the row is not a harvest day, and `endsHere` when the cell after it is not. The first and last cell of a row have no neighbor outside the row, so a window that wraps ends at Saturday and starts again at Sunday, each with rounded ends. The same happens at blank cells outside the month. Because it looks at the union of all windows, overlapping or touching windows form one run.
- `cellIndicator(tasks, { hideHarvestMarkers })` leaves out the `maturity`, `harvest_start` and `harvest_end` tasks when `hideHarvestMarkers` is true, so they add no dot and no count. `CalendarGrid` sets it for every cell that has a bar.

### Components

- `CalendarGrid` takes `harvestWindows`, computes `harvestSegments` for each row, and passes each cell its `harvest` segment.
- `DateCell` draws the bar (`testID="harvest-bar"`) as described above and adds ", harvest window" to its accessibility label. A cell is tappable when it has any task or a bar, even if its indicator is empty.

## Tapping the Bar

- `DateCell` is tappable on any day with a task or a bar.
- `TaskListSheet` takes `harvestWindows` (the windows covering the selected day) and `onSelectHarvestWindow`. For each window it shows a row above the tasks with a green swatch, the title "Harvest window", and "<plant> · <start> to <end>". The empty message only shows when there are neither tasks nor windows.
- The calendar screen finds the windows with `harvestWindowsOn` and, on a tap, closes the sheet and goes to `/calendar/harvest/<farm crop id>`.
- `app/(tabs)/calendar/harvest/[cropId].tsx` finds the crop's window among `useHarvestWindows(null)` and shows the plant, expected maturity, harvest window begins and ends, and an explanation. It uses the shared loading, error and empty states. The calendar stack titles it "Harvest window", then the plant name once loaded.

## Files

| File                                                               | Change                                                                                                            |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| `src/constants/taskTypes.ts`                                       | New colors, `TASK_TYPE_COLORS`, `HARVEST_BAR_COLOR`                                                               |
| `src/features/calendar/logic.ts`                                   | `buildHarvestWindows`, `harvestWindowsOn`, `isHarvestDay`, `harvestSegments`, `cellIndicator` uses `getTaskColor` |
| `src/features/calendar/hooks.ts`                                   | `useHarvestWindows`                                                                                               |
| `src/repositories/taskRepository.ts`                               | `getHarvestTasks`                                                                                                 |
| `src/components/calendar/DateCell.tsx`, `CalendarGrid.tsx`         | The bar                                                                                                           |
| `app/(tabs)/calendar/index.tsx`                                    | Loads the windows, refreshes them on focus, opens the harvest window screen                                       |
| `src/components/calendar/TaskListSheet.tsx`                        | \"Harvest window\" rows                                                                                           |
| `app/(tabs)/calendar/harvest/[cropId].tsx`, `calendar/_layout.tsx` | The harvest window screen and its route                                                                           |

## Testing

- `tests/calendar/logic.test.ts`: colors, one dot per color, window pairing, `isHarvestDay`, `harvestSegments` (runs inside a week, one-day runs, wrapping at Saturday and Sunday, a Saturday start, overlapping windows, blank cells, month and year ends), and `cellIndicator` with `hideHarvestMarkers`.
- `tests/ui/calendarScreen.test.tsx`: the bar on the right days, the first day starting at the middle and the last ending at the middle, a one-day dot, the Saturday and Sunday wrap, no dot for harvest begins and ends while the day stays tappable, and the calendar still showing tasks when the windows fail.
- `tests/ui/harvestWindowScreen.test.tsx`: the screen's details, loading, not found, and retry.
- `tests/integration/calendar.test.ts`: `getHarvestTasks` returns only maturity and harvest tasks from any month, filters by plant, skips archived crops, and shows nothing from another farm.
- Manual: how the bar and dots look on a phone, including a window that wraps from one week to the next and a day with a count badge.
