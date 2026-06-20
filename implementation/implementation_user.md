# Implementation Plan: Client Dashboard & Client Booking Portal (Option A)

This document details the planned modifications to implement a Client Booking page `/client/book` using Option A (Switcher Layout: List vs. Calendar View) and update the Client Dashboard.

## Proposed Changes

### 1. Client Booking Page (`/client/book`) - [NEW]

We will create a new route file [book.tsx](file:///e:/barcelona-session-book/src/routes/client/book.tsx) that allows clients to book sessions directly from the portal.

- **Layout Switcher**: A header toggle to switch between:
  - **Calendar View**: A visual month/week-based calendar grid showcasing scheduled session slots.
  - **List View**: A chronological list of upcoming session slots (similar to the homepage timetable).
- **Interactive Details Slide-Over (Drawer/Sheet)**:
  - When clicking any session slot in either the Calendar or List view, a side drawer or detail card will open inline (rather than navigating away).
  - This drawer will list the session title, focus, duration, location, pricing, and slots available.
  - Contains a primary action button to **"Book Session"** or **"Join Waitlist"**.
- **Booking Flow & Alerts**:
  - Integrate Supabase insert mutations for booking and waitlisting.
  - Show warning indicator if there are schedule overlaps.
  - Trigger inline confirmation dialogs ("Pay €35.00 in-person").

### 2. Client Portal Navigation Update

Modify [client.tsx](file:///e:/barcelona-session-book/src/routes/client.tsx) to add:

- A new **"Book a Session"** sidebar button.

### 3. Client Dashboard Update

Modify [dashboard.tsx](file:///e:/barcelona-session-book/src/routes/client/dashboard.tsx) to add:

- A prominent **"Book a Session"** CTA button in the main hero card linking to `/client/book`.

### 4. Client Bookings Page (`/client/bookings`)

Modify [bookings.tsx](file:///e:/barcelona-session-book/src/routes/client/bookings.tsx) to add:

- **View Switcher Layout**: Allow toggling between:
  - **Calendar View**: A visual month-based calendar grid highlighting days with confirmed bookings. Selecting a day lists the bookings for that date.
  - **List View**: The default layout showing "Active Bookings" and "Booking History" lists.

## Checklist

- [ ] Update [client.tsx](file:///e:/barcelona-session-book/src/routes/client.tsx):
  - [ ] Add the "Book a Session" link in the sidebar menu.
- [ ] Update [dashboard.tsx](file:///e:/barcelona-session-book/src/routes/client/dashboard.tsx):
  - [ ] Add the "Book a Session" button in the welcome hero card.
- [ ] Create the new route [book.tsx](file:///e:/barcelona-session-book/src/routes/client/book.tsx):
  - [ ] Fetch all upcoming scheduled active sessions (`status = 'active'` and `start_time >= now`).
  - [ ] Implement layout toggle state (`viewMode: "list" | "calendar"`).
  - [ ] Implement the monthly/weekly calendar grid view using a custom calendar layout that maps session slots to dates.
  - [ ] Implement the list view displaying sessions chronologically.
  - [ ] Build the interactive details side drawer (or sheet) detailing the selected session.
  - [ ] Implement mutations for `bookings` (Insert booking) and `waitlists` (Insert waitlist) matching [sessions.$sessionId.tsx](file:///e:/barcelona-session-book/src/routes/sessions.$sessionId.tsx) logic.
- [ ] Update [bookings.tsx](file:///e:/barcelona-session-book/src/routes/client/bookings.tsx):
  - [ ] Implement layout toggle (`viewMode: "list" | "calendar"`).
  - [ ] Build the monthly calendar grid view mapping client's confirmed bookings to dates.
  - [ ] Render a day-specific bookings panel listing sessions on selected date with direct "Manage Booking" button.
- [ ] Verify that there are no compilation or rendering errors.
