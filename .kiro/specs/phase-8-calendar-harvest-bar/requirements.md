# Requirements: Phase 8 — Calendar Colors and Harvest Bar

This phase changes REQ-006 (Activity Type Colors) of Phase 5. The colors below replace the ones in that requirement.

## 1. Colors

### REQ-001: Watering Is Blue

Watering tasks shall be blue (`#3B82F6`) everywhere a task color is shown: the calendar dots, the swatch in a day's task list, and the task detail.

### REQ-002: Milestones Are Green

Every important milestone shall be green (`#22C55E`): planting, germination, transplanting, maturity, harvest window begins and harvest window ends.

### REQ-003: Other Care Tasks Keep Their Color

Fertilizing, pruning and pest inspection shall stay orange, and other tasks gray. No other task type shall be blue or green.

### REQ-004: One Dot per Color

A day with several tasks of the same color shall show one dot of that color. For example a day with maturity and harvest window begins shows one green dot.

## 2. Harvest Window Bar

### REQ-005: Bar Across the Window

The calendar shall draw a bar across every day from a crop's "harvest window begins" date to its "harvest window ends" date, both days included. The bar shall have rounded ends and be green.

### REQ-006: Bar Position

The bar shall sit below the day's dots (or count badge), inside the day's cell. Every cell shall reserve the space for the bar, so days line up whether or not they have one.

### REQ-007: Bar Runs Through the Middle of Each Day

The bar shall run through the horizontal middle of each day cell, the same place the dots are. A run of days shall start at the middle of its first day and end at the middle of its last day, with rounded ends. Bars on neighboring days inside a run shall join with no gap.

### REQ-008: Several Crops

Windows of different crops that overlap or touch shall be drawn as one continuous bar.

### REQ-009: Windows Across Months

A window that starts in one month and ends in another shall be drawn in each month it covers, including across a year end. The bar shall not depend on the harvest tasks being in the displayed month.

### REQ-010: Plant Filter

The bar shall follow the plant filter. With a plant chosen, only that plant's windows are drawn.

### REQ-011: Removed Crops

Windows of archived (removed) crops shall not be drawn.

### REQ-012: Incomplete Windows

A crop with only one of the two tasks, or an end date before its start date, shall have no bar.

### REQ-013: Accessibility

A day inside a window shall add ", harvest window" to its accessibility label.

### REQ-014: Failure Handling

If the harvest windows fail to load, the calendar shall still show its tasks and draw no bar. The calendar's error state shall remain tied to the tasks.

### REQ-015: Refresh

The windows shall reload when the user returns to the calendar tab, like the tasks do, so a new schedule shows its bar.

### REQ-016: Windows That Wrap to the Next Week

When a window continues from Saturday to the next Sunday, the bar shall end at the middle of Saturday and start again at the middle of the next Sunday, with rounded ends both times. The same rule applies where a run meets a blank cell at the edge of the month.

### REQ-017: One-Day Runs

A run of a single day (a one-day window, or a window that starts on a Saturday) shall be drawn as one round dot at the middle of the day.

### REQ-018: No Dot for Maturity or Harvest Window Begins and Ends

Days with a maturity, "harvest window begins" or "harvest window ends" task shall not show a dot for it, and the task shall not be counted in the day's count badge, because the bar already marks the day. The task shall still appear in the day's task list, the day shall still be tappable, and its accessibility label shall still count the task. When the bar cannot be drawn (the windows failed to load), the dot is shown as before.

### REQ-019: Maturity Is Part of the Bar

A crop's expected maturity date shall be covered by its bar. The bar runs from the first of maturity and harvest window begins to the last of maturity and harvest window ends. Normally maturity is the same day as the harvest window begins, so the bar does not change. A crop with no maturity task keeps a bar from harvest window begins to ends.

### REQ-020: The Bar Can Be Tapped

A day inside a bar shall be tappable even when it has no tasks. Tapping it shall open the day's list, which shall show a "Harvest window" row for each crop whose bar covers the day, with the plant name and the dates the bar runs from and to. The row shall sit above the day's tasks.

### REQ-021: Harvest Window Screen

Tapping a "Harvest window" row shall open a screen for that crop with: the plant name, the expected maturity date (when there is one), the dates the harvest window begins and ends, and a short explanation of what the bar means. The screen shall have loading, error with retry, and not-found states, and shall say the window is a time to watch for, not something to tick off.

## 3. Out of Scope

- A legend explaining the colors.
- A bar for other date ranges, such as the germination period.
- Showing which crop a bar belongs to.
