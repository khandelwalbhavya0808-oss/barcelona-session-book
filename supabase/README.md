# Supabase Setup & Local Development

This project uses **Supabase** for database, authentication, and storage (avatars and session media). 

Follow these steps to set up your database schema and start developing locally.

---

## 1. Prerequisites
You need the **Supabase CLI** installed on your machine. If you don't have it, install it using npm or your package manager:

```bash
# Install globally via npm
npm install -g supabase
```

---

## 2. Setting Up Local Supabase
To run Supabase locally inside Docker containers, execute the following commands:

```bash
# Initialize Supabase configuration (if not already initialized)
supabase init

# Start local Supabase containers (requires Docker Desktop running)
supabase start
```

Once started, the CLI will output your local service URLs and keys, including:
*   `API URL`
*   `anon key`
*   `Studio URL` (usually `http://localhost:54323` to view database UI)

Copy the **API URL** and **anon key** and add them to your `.env` file in the root of the project:
```env
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=<your-local-anon-key>
```

---

## 3. Applying Database Migrations

The migrations for the core schemas and storage buckets are stored in `supabase/migrations/`:
1.  `20260611_initial_schema.sql` — Schema definition, profiles, bookings, availability, waitlists, triggers, and Row Level Security (RLS) policies.
2.  `20260611_storage_setup.sql` — Creates `avatars` and `session-media` buckets with public read access and authenticated upload policies.

### Local Database
When you run `supabase start` for the first time, all migrations in the `supabase/migrations` folder are automatically applied.

If you add new migrations later or need to reset the local database, run:
```bash
# Reset database and apply all migrations
supabase db reset
```

### Remote/Production Database
To deploy your migrations to your remote/production Supabase project:

1.  **Link your project:**
    ```bash
    supabase link --project-ref <your-project-ref>
    ```
2.  **Push migrations:**
    ```bash
    supabase db push
    ```

---

## 4. Supabase Client Integration

The application contains two pre-configured Supabase clients under `src/lib/`:
1.  **Client-Side Browser Client:** [supabase.client.ts](file:///e:/barcelona-session-book/src/lib/supabase.client.ts)
    *   Use this client inside your React pages/components that run in the browser.
2.  **Server-Side Client:** [supabase.server.ts](file:///e:/barcelona-session-book/src/lib/supabase.server.ts)
    *   Use this client in server functions (`createServerFn`), server routes, or middleware. It automatically parses and updates user session cookies.
