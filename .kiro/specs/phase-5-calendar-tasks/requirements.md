# Requirements: Phase 5 — Calendar and Task Management

## 1. Monthly Calendar

### REQ-001: Calendar View
The system shall display a monthly calendar as the primary calendar tab, showing a traditional month grid with days of the week headers.

### REQ-002: Month Navigation
The user shall be able to navigate to the previous and next months. The current displayed month and year shall be shown in a header.

### REQ-003: Current Date Highlight
The system shall visually highlight the current date on the calendar.

### REQ-004: Activities on Calendar
The system shall display activity indicators on calendar dates that have one or more scheduled tasks. Dates with tasks shall be visually distinguishable from empty dates.

### REQ-005: Multiple Activities per Date
When multiple activities exist on the same date, the calendar shall indicate that more than one activity is scheduled (e.g., a count badge or stacked indicator).

### REQ-006: Activity Type Colors
The system shall visually distinguish activity types using colors:
- Growing milestones (planting, germination, maturity, harvest): one color family
- Maintenance activities (watering, fertilizing, pruning, pest inspection): another color family
- Harvest window: a distinct highlight color

## 2. Calendar Filtering

### REQ-007: Plant Filter
The system shall provide a filter allowing the user to show tasks for a specific plant or all plants. The filter shall be a dropdown or chip selector listing the user's active crops.

### REQ-008: Filter Persistence
The selected plant filter shall persist during the session. When the user returns to the calendar tab, the last selected filter is retained.

## 3. Event Details

### REQ-009: Date Tap — Event List
When a user taps a date with activities, the system shall show a list of all tasks scheduled on that date, each showing: task title, task type (with color indicator), and associated plant name.

### REQ-010: Task Detail View
When a user taps a task in the list, the system shall show a detail view with: task title, task type, description, scheduled date, associated plant name, and completion status.

### REQ-011: Completed Task Indicator
Completed tasks shall be visually distinguished from pending tasks (e.g., strikethrough, checkmark, or muted styling).

## 4. Task Management

### REQ-012: Task Completion
The user shall be able to mark a maintenance task as completed from the task detail view. Completing a task sets `completed_at` to the current timestamp.

### REQ-013: Task Completion Persistence
Task completion shall persist in the database. When the app is reopened, completed tasks shall remain completed.

### REQ-014: Task Incompletion
The user shall be able to unmark a completed task (set `completed_at` back to null) if they need to correct a mistake.

### REQ-015: Task Description and Instructions
The task detail view shall display the task description and any care instructions from the care rules.

## 5. Data Loading

### REQ-016: Calendar Data Fetching
The system shall fetch tasks for the currently displayed month from the database, filtered by the user's farm crops and the selected plant filter (if any).

### REQ-017: Loading States
The system shall display a loading indicator while calendar data is being fetched.

### REQ-018: Error States
The system shall display an error message if calendar data fails to load, with a retry option.
