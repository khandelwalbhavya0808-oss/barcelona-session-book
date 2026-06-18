# Implementation Plan: Capacity for Session Types & Description for Sessions

## Proposed Changes

### 1. Database Adjustments
- Add a new column `capacity` to the `session_types` table. (Nullable integer, or default 1 depending on confirmation, assuming empty/null by default).

### 2. Session Types Management (Frontend)
- **Session Types Template List:** Add a new `Capacity` column to the UI table displaying session types (likely in `settings.tsx`).
- **Create Session Type Modal:** Add a new `capacity` input field (defaults to empty).
- **Edit Session Type Modal:** Add the `capacity` input field to allow updating existing capacities.

### 3. Schedule Sessions (Frontend)
- **Create/Edit Schedule Session Modal:** 
  - Ensure a `capacity` field is present.
  - When a user selects a session type, automatically fill the `capacity` field with the value from the selected session type.
  - Ensure the `description` field is shown when creating or editing a session.
- **Active Sessions Table:** Add a new column for `Description` placed immediately after the session name.

## Checklist
- [ ] Create Supabase migration to add `capacity` to `public.session_types`.
- [ ] Run migration locally (`supabase db reset` or `supabase migration up`).
- [ ] Update frontend types for `session_types` to include `capacity`.
- [ ] Add `capacity` column to the templates list table.
- [ ] Add `capacity` field to the Create Session Type modal.
- [ ] Add `capacity` field to the Edit Session Type modal.
- [ ] Update Schedule Session modal(s) to auto-fill `capacity` when a session type is selected.
- [ ] Update Schedule Session modal(s) to show the `description` field.
- [ ] Update the Active Sessions table to show the `description` column after the session name.
