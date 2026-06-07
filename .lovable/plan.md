# Alex Moreno — Personal Trainer Site

Single-page, mobile-first, performance-focused. Booking is always one click away (every CTA scrolls to `#book` for now; you'll swap in a real booking URL later).

## Design system

Set tokens in `src/styles.css` (oklch) and wire via `@theme inline`.

- Background: near-black `#0b0b0c`
- Surface / card: `#161618`
- Muted text: `#a1a1aa`
- Foreground: near-white
- Accent (primary): orange `#ff6a1a` — used **only** for CTAs, availability dots, the active hover state, and one or two headline highlights
- Border: subtle white at ~8%
- Type: display sans for headings (tight tracking, large weights), neutral sans for body. Strong hierarchy, generous spacing.
- Radius: small (6–8px) to feel like a system, not marketing
- No gradients, no glow, no motion-heavy hero. Restrained.

## Page sections (in order, single route `/`)

1. **Sticky top bar** — wordmark "Alex Moreno · S&C Coach · Barcelona" left, single orange `Book` button right. Always visible.
2. **Hero** — Outcome headline ("Build real strength. Train consistently. In the studio or outside."), one-line subhead mentioning indoor + outdoor Barcelona, one supporting line, primary CTA `Book Your Session` → `#book`. Right side: portrait placeholder block.
3. **Schedule** — *Visually dominant.* Desktop: 6-column grid Mon–Sat with time-row rails; each slot is a card showing class name, focus chip (Strength / Conditioning / Mobility), location chip (Studio / Outdoor), duration, availability dot (orange = spots open, muted = full), and a small `Book` button. Mobile: collapses to a day-by-day vertical list with the same card. Feels like a functional timetable, not marketing.
4. **Trust** — Coach portrait placeholder + name/role, 3 short credibility bullets (experience, approach, consistency). Two-up image strip: clean studio shot + outdoor Barcelona shot (placeholders).
5. **Social proof** — 3 short testimonial cards (1–2 lines, first name + age + profession). Below: 4-up community photo strip (mix studio/outdoor placeholders).
6. **Logistics** — Compact 2-column key/value list: Base location, Outdoor session areas (Ciutadella, Barceloneta, Montjuïc), Session length, What to bring, Who it's for / not for. Practical, dense, no fluff.
7. **Booking CTA (`#book`)** — Full-width dark band, big headline, single orange `Book Your Session` button. (Placeholder anchor for now.)
8. **Footer** — Minimal: location, contact placeholder, copyright.

## Image handling

Every image is a neutral placeholder block (dark surface, subtle border, centered label like "Studio · 4:5") sized correctly so layout is final. You'll drop real photos in later without reflow.

## Content rules

- No pricing, no lead form, no email capture, no blog, no motivational/emotional copy.
- Copy tone: calm authority, practical, confident. Short lines.
- Every CTA button across the page links to `#book`.

## Technical notes

- TanStack Start: build entirely in `src/routes/index.tsx`, split into small components under `src/components/site/` (Hero, Schedule, Trust, SocialProof, Logistics, BookingCTA, TopBar, Footer).
- Update `head()` in `src/routes/index.tsx`: title "Alex Moreno — Personal Trainer in Barcelona", focused meta description, og tags.
- Tailwind v4 tokens added in `src/styles.css` (`@theme inline` mapping `--color-accent`, etc.). No `tailwind.config.js`.
- Use lucide-react for the few small icons (location pin, clock, dot). No new dependencies.
- Smooth scroll via CSS `scroll-behavior: smooth` on `html`.
- Schedule data lives as a typed const array in `src/components/site/schedule-data.ts` so swapping classes later is one file.

## Out of scope (per your brief)

Pricing, forms, email capture, blog, long explanations, hype copy.

Ready to build on approval.
