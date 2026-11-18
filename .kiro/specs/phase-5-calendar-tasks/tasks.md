# Tasks: Phase 5 — Calendar and Task Management

## 1. Calendar Component

- [x] 1.1 Create `src/components/calendar/CalendarHeader.tsx` with month/year display and prev/next buttons
- [x] 1.2 Create `src/components/calendar/DateCell.tsx` with activity indicator dots
- [x] 1.3 Create `src/components/calendar/CalendarGrid.tsx` rendering the 7-column month grid
- [x] 1.4 Implement current date highlight (circle or background color)
- [x] 1.5 Handle month navigation (track current month/year in state)
- [x] 1.6 Show activity dots per date (color-coded by activity type)
- [x] 1.7 Show count badge for dates with 3+ activities

## 2. Calendar Screen

- [x] 2.1 Update `app/(tabs)/calendar.tsx` to render CalendarHeader + CalendarGrid
- [x] 2.2 Manage current month/year state
- [x] 2.3 Implement date tap handler (show task list for tapped date)

## 3. Task List for Date

- [x] 3.1 Create `src/components/calendar/TaskListSheet.tsx` (bottom sheet or modal)
- [x] 3.2 Display all tasks for the tapped date with title, type color, and plant name
- [x] 3.3 Show completed tasks with strikethrough or checkmark
- [x] 3.4 Handle tapping a task to navigate to task detail

## 4. Task Detail View

- [x] 4.1 Create `app/(tabs)/calendar/task/[id].tsx` detail screen
- [x] 4.2 Display task title, type (with color), description, scheduled date, plant name
- [x] 4.3 Show completion status and toggle button
- [x] 4.4 Implement complete/uncomplete action

## 5. Plant Filter

- [x] 5.1 Create `src/components/calendar/PlantFilter.tsx` dropdown/chip selector
- [x] 5.2 Fetch user's active crops for filter options
- [x] 5.3 Apply filter to calendar data fetching
- [x] 5.4 Default to "All Plants"

## 6. Data Layer
<!-- NOTE: the month query computes its range with real date math (the design's `${year}-${month}-01` is unpadded and breaks in December), and hides tasks of archived crops. Only maintenance tasks can be completed (REQ-012). -->

- [x] 6.1 Create `useCalendarTasks(year, month, plantFilter?)` hook
- [x] 6.2 Implement `taskRepository.getTasksForMonth(year, month, plantId?)` with plant name join
- [x] 6.3 Implement `taskRepository.getTaskById(id)` with plant name join
- [x] 6.4 Implement `taskRepository.completeTask(id)`
- [x] 6.5 Implement `taskRepository.uncompleteTask(id)`
- [x] 6.6 Create task grouping utility (`groupTasksByDate`)
- [x] 6.7 Create task type constants (colors and labels)

## 7. Activity Type Styling

- [x] 7.1 Define color constants for milestone, harvest, and maintenance types
- [x] 7.2 Apply colors to calendar dots and task list indicators
- [x] 7.3 Apply completed task styling (strikethrough or muted)

## 8. Loading and Error States (Basic)

- [x] 8.1 Show loading indicator while fetching calendar data
- [x] 8.2 Show basic error message if data fails to load
- [x] 8.3 Show empty state message if no tasks exist for the month

## 9. Verification

- [ ] 9.1 Calendar displays the current month with correct day layout
- [ ] 9.2 Current date is highlighted
- [ ] 9.3 Month navigation works (prev/next)
- [ ] 9.4 Tasks appear on their scheduled dates with colored indicators
- [ ] 9.5 Tapping a date shows the task list for that date
- [ ] 9.6 Tapping a task shows task details
- [ ] 9.7 User can mark a maintenance task as complete
- [ ] 9.8 Completed tasks remain completed after app restart
- [ ] 9.9 User can unmark a completed task
- [ ] 9.10 Plant filter shows only the selected plant's tasks
- [ ] 9.11 Multiple activities on the same date are all displayed
- [ ] 9.12 Loading indicator shows while data fetches
