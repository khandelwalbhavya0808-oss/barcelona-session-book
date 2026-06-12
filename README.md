# Barcelona Session Book

A full-stack booking and scheduling platform for **Alex Moreno — Personal Trainer in Barcelona**. 

This application allows clients to view scheduled slots (indoor studio & outdoor training), book 1:1 sessions, join waitlists, and manage their profiles. It features automated server-side booking validation, database-driven waitlist promotion, and comprehensive administrative history logging.

---

## 🛠️ The Tech Stack

### Frontend & Routing
*   **React 19** — Library for building the user interface.
*   **TanStack Start** — Full-stack React framework with SSR, powered by Vinxi and Nitro.
*   **TanStack Router** — Type-safe routing with built-in search parameter validation and data-loading.
*   **TanStack Query (React Query)** — Type-safe state management, caching, and server-data synchronization.
*   **Tailwind CSS v4** — High-performance, modern utility-first CSS styling.
*   **Shadcn UI & Radix UI** — Unstyled, accessible UI primitives.

### Backend & Database
*   **Supabase** — Backend-as-a-service providing:
    *   **PostgreSQL** — Relational database.
    *   **GoTrue Auth** — Secure user registration and session management.
    *   **Storage** — Public buckets for `avatars` and `session-media`.
    *   **Row Level Security (RLS)** — Fine-grained access control on every table and storage bucket.
*   **PostgreSQL Triggers** — Server-side automated workflows (e.g., auto-promoting users from waitlist).

### Forms & Validation
*   **React Hook Form** — Performance-focused form management.
*   **Zod** — Schema validation for forms, database queries, and server function inputs.

---

## 📁 Repository Structure

```filepath
├── src/
│   ├── assets/               # Images and static assets
│   ├── components/
│   │   ├── site/             # Core features (Hero, Schedule, BookingCTA, etc.)
│   │   └── ui/               # Reusable Shadcn UI primitives
│   ├── hooks/                # Custom React hooks (e.g. use-mobile)
│   ├── lib/
│   │   ├── api/              # Server Functions (createServerFn)
│   │   ├── config.server.ts  # Server-side environment configuration
│   │   ├── supabase.client.ts# Client-side Supabase browser client
│   │   └── supabase.server.ts# Server-side Supabase client (with cookie auth)
│   ├── routes/
│   │   ├── __root.tsx        # App Shell, layout, and HTML boilerplate
│   │   └── index.tsx         # Home page & scheduling interface
│   ├── router.tsx            # Router instantiation & configuration
│   ├── server.ts             # SSR and Nitro server entry point
│   ├── start.ts              # Client-side hydration script
│   └── styles.css            # Tailwind CSS configuration and theme tokens
├── supabase/
│   ├── migrations/           # Database migration files (SQL)
│   └── README.md             # Supabase CLI setup guidelines
├── bun.lock                  # Bun dependency lockfile
├── package.json              # Script runner and dependency manager
└── vite.config.ts            # Vite & TanStack configuration
```

---

## 🗄️ Database Architecture

The backend database contains a robust set of schemas, constraints, and triggers to enforce business logic directly at the database layer.

### Core Tables
1.  **`profiles`**: Extends Supabase auth users. Stores user roles (`user`, `client`, `admin`) and profile metadata.
2.  **`session_types`**: Templates for personal training sessions (e.g. duration, focus, location, and base pricing).
3.  **`scheduled_sessions`**: Specific calendar instances of session types available for booking.
4.  **`bookings`**: Active bookings for scheduled sessions. Tracks statuses (`confirmed`, `cancelled`, `late_cancelled`, `attended`, `no-show`).
5.  **`waitlists`**: Position-based waitlist queue for fully booked sessions.
6.  **`availability_rules`**: Weekly recurring availability configurations.
7.  **`availability_exceptions`**: Override dates where standard rules do not apply (e.g. holiday closures).

### History & Auditing Tables
*   `user_login_history` — Logs authentication times, IP addresses, and user-agents.
*   `booking_history_log` — Tracks updates to booking statuses.
*   `session_history_log` — Stores change history (before/after states) for scheduled sessions.
*   `client_status_history` — Logs changes to client profiles (e.g. role upgrades or account bans).

### ⚡ Automated Postgres Workflows (Triggers)
*   **Profile Auto-Generation (`on_auth_user_created`)**: Triggers upon auth signup to automatically insert a corresponding record in `profiles`.
*   **Client Role Upgrades (`on_booking_created`)**: Automatically elevates a user's role from `'user'` to `'client'` when they create their first booking.
*   **Slot Validation (`before_booking_inserted`)**: Validates that a session is not full and is active before allowing a new booking to be recorded.
*   **Waitlist Promotion (`on_booking_updated`)**: When a booking status is updated to `cancelled` or `late_cancelled`, it automatically queries the waitlist, promotes the top user to `confirmed`, and creates a new booking record.

---

## 🚀 Getting Started

### 1. Prerequisites
Ensure you have the following installed on your machine:
*   [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Required for local Supabase development)
*   [Bun](https://bun.sh/) (Preferred package manager) or [Node.js](https://nodejs.org/)

### 2. Local Supabase Setup
Install the Supabase CLI globally (if not already installed):
```bash
npm install -g supabase
```

Navigate to the project and spin up local Dockerized Supabase containers:
```bash
# Start local containers and apply migrations
supabase start
```
This will spin up Postgres, GoTrue Auth, Storage, and the Supabase Studio dashboard. Once running, copy the local credentials provided in the output.

### 3. Environment Setup
Create a `.env` file at the root of the project (if it doesn't already exist):
```env
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=<your-local-anon-key>
```

### 4. Install Dependencies
Using **Bun** (preferred) or **npm**:
```bash
bun install
# or
npm install
```

### 5. Running the Application
To run the dev server:
```bash
bun dev
# or
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

To inspect the local database tables and logs, open the Supabase Studio dashboard (usually at [http://localhost:54323](http://localhost:54323)).

---

## ✍️ Development Guidelines

### Client vs. Server Boundaries
Since this is a TanStack Start project, files are built with SSR in mind:
*   **Client-Side:** UI components and interactive pages should use the standard Supabase client located in `src/lib/supabase.client.ts`.
*   **Server-Side:** Database mutations, security checks, and privileged tasks should be handled inside Server Functions (`createServerFn`). Use `src/lib/supabase.server.ts` inside these functions to verify session cookies and securely run operations.

### Modifying the Database
If you need to change the database schema, do not edit tables directly in the dashboard. Instead:
1.  Generate a migration file:
    ```bash
    supabase migration new my_migration_name
    ```
2.  Add your SQL changes to the newly created file in `supabase/migrations/`.
3.  Apply them locally:
    ```bash
    supabase db reset
    ```
4.  Once verified, push to the remote environment:
    ```bash
    supabase db push
    ```
