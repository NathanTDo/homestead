# Tasks: Phase 8 — Calendar Colors and Harvest Bar

## 1. Colors

- [x] 1.1 Make watering blue and every milestone and harvest task green
- [x] 1.2 Use `getTaskColor` for the calendar dots so equal colors share one dot

## 2. Harvest Window Data

- [x] 2.1 Add `taskRepository.getHarvestTasks`
- [x] 2.2 Add `buildHarvestWindows`, `isHarvestDay` and `harvestSegments`
- [x] 2.3 Add `useHarvestWindows` and refresh it when the calendar regains focus

## 3. Calendar UI

- [x] 3.1 Add the bar slot and the bar to `DateCell`
- [x] 3.2 Pass the windows through `CalendarGrid` and load them in the calendar screen
- [x] 3.3 Add ", harvest window" to the day's accessibility label
- [x] 3.4 Start and end the bar at the middle of the first and last day, with rounded ends
- [x] 3.5 End the bar at Saturday and start it again at Sunday when a window wraps
- [x] 3.6 Draw a one-day run as a dot
- [x] 3.7 Leave out the dot for harvest window begins and ends
- [x] 3.8 Leave out the dot for maturity and cover the maturity date with the bar
- [x] 3.9 Make bar days tappable and add "Harvest window" rows to the day list
- [x] 3.10 Add the harvest window screen (`calendar/harvest/[cropId]`)

## 4. Tests

- [x] 4.1 Unit tests for colors, windows and bands
- [x] 4.2 Screen tests for the bar and for a failed window request
- [x] 4.3 Integration tests for `getHarvestTasks`
- [x] 4.5 Screen tests for the harvest window row and screen
- [ ] 4.4 Check the bar and dots by hand on a phone, including week wraps and count badges

## 5. Documentation

- [x] 5.1 Write this spec
- [x] 5.2 Update the README and `docs/TESTING.md`

## 6. Possible Follow-ups

- [ ] 6.1 Add a legend for the colors and the bar
