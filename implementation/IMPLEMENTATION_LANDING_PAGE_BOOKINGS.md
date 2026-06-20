# Implementation Plan: Landing Page Weekly Schedule Enhancements

This document outlines the implementation steps to update the weekly schedule section on the landing page, ensuring it displays sessions from Supabase with premium visual design, timezone-aware formatting, and daily grouping.

## Design Decisions

Based on best practices for a premium booking experience, we have finalized the following:

1. **Daily Grouping (Option A)**:
   Instead of a flat chronological list repeating weekdays (e.g. "MON", "MON", "TUE"), sessions will be grouped under clean, sticky daily headers (e.g. "Monday, June 22"). This eliminates redundancy and makes the weekly timetable easy to scan.
2. **Locked Barcelona Timezone**:
   Since the training sessions physically take place in Barcelona, all times will be formatted in the Barcelona timezone (`Europe/Madrid`). We will add a clear notice/footnote indicating: _"All sessions are scheduled in Barcelona time (CET/CEST)."_ This prevents remote clients or travellers from booking incorrect times due to browser timezone differences.

3. **Visual Slot Capacity Indicator**:
   We will render slot availability using small, clean bullet/dot indicators:
   - Filled circles (e.g., `●`) representing booked slots.
   - Empty/outlined circles (e.g., `○`) representing available slots.
   - Example: For a session with a maximum of 4 slots and 2 bookings, it will display `● ● ○ ○ (2 slots left)`.

4. **Dynamic/Universal Header**:
   Refactor the hardcoded header `"Six sessions. Pick yours."` to a clean, universal title: `"Upcoming Timetable. Pick yours."` or dynamically adjust the text. We will use a premium styling approach.

5. **Focus Badges**:
   Session focuses will be color-coded with elegant backgrounds:
   - **Strength**: Warm Orange (`bg-accent/15 text-accent border border-accent/20`)
   - **Conditioning**: Blue/Indigo (`bg-indigo-500/15 text-indigo-400 border border-indigo-500/20`)
   - **Mobility**: Emerald/Teal (`bg-emerald-500/15 text-emerald-400 border border-emerald-500/20`)

---

## Proposed Changes

### Component: Site Schedule

#### [MODIFY] [Schedule.tsx](file:///e:/barcelona-session-book/src/components/site/Schedule.tsx)

- **Timezone-Safe Format Helper**: Implement a helper function utilizing browser `Intl.DateTimeFormat` with `timeZone: "Europe/Madrid"` to ensure all dates are parsed and displayed correctly in Barcelona time.
- **Date Grouping**: Group the fetched sessions by day of the year (in Barcelona time).
- **Header Refactoring**: Change the static "Six sessions" header to a flexible title.
- **Enhanced Card/Row Layout**:
  - Render daily section headers.
  - Apply color-coded badges based on the session focus (`Strength`, `Conditioning`, `Mobility`).
  - Render visual slot capacity dots (`●` and `○`) dynamically based on `max_slots` and `bookings`.
  - Add a footnote explaining the Barcelona timezone constraint.

---

## Verification Plan

### Automated Checks

- Run ESLint to ensure code quality: `npm run lint`
- Run build to check for TS compilation errors: `npm run build`

### Manual Verification

- Check the homepage `/` at the schedule section:
  - Verify that sessions are grouped correctly by day.
  - Verify that the times match the Barcelona timezone (e.g. if the system clock is set to a different timezone, the displayed session time should still show its correct Barcelona time).
  - Verify that the slot capacity dots accurately reflect remaining space.
  - Verify that clicking "Book" redirects users to the correct detail page.
