## Goal

Lift the site from generic dark template to a confident, editorial training brand. Add real imagery, top-nav anchors, reduce schedule noise, and tighten every section.

## 1. Top navigation (replace current TopBar)

Sticky bar with wordmark left, anchor links center, orange `Book` button right.
Links: **About · Schedule · Reviews · Details · Reschedule**

- About → `#about` (Trust section)
- Schedule → `#schedule`
- Reviews → `#reviews` (SocialProof)
- Details → `#details` (Logistics)
- Reschedule → `#book` (same booking anchor, labelled for existing clients)
- Book button → `#book`
  Mobile: collapsible menu (simple disclosure, no heavy drawer).

## 2. Imagery — replace all placeholders with AI-generated photos

Generate via `imagegen` (standard quality, cinematic, muted color grade matching near-black palette). Saved under `src/assets/` and externalized via `lovable-assets`.

- `coach-portrait.jpg` — Hero + Trust (4:5, lean coach, neutral studio, soft directional light)
- `studio-wide.jpg` — Trust strip (16:10, minimalist concrete strength studio, barbells, no people)
- `outdoor-barcelona.jpg` — Trust strip (16:10, athlete training at Barceloneta beach, dawn light)
- `community-1..4.jpg` — Social proof strip (1:1, varied: park sprint, studio lift, mobility, beach kettlebell)
  Replace `Placeholder` usage; keep component for fallback only.

## 3. Schedule — reduce to 6 curated slots

Replace day-grid with a single clean **"This Week" list** of 6 signature sessions (the highlights, not the full timetable). Each row:
`Day + Time · Session name · Focus · Location · Duration · Availability dot · Book`
Rows: Mon 07:00 Strength/Studio · Tue 07:00 Beach Conditioning/Outdoor · Wed 18:30 Upper Body/Studio · Thu 07:00 Beach Strength/Outdoor · Fri 09:30 Montjuïc Hills/Outdoor · Sat 10:00 Open Studio/Studio.
Editorial table feel: thin dividers, tabular-nums time, generous row height. Mobile: same list, stacked metadata.
Update `schedule-data.ts` to a flat `FEATURED_SLOTS` array of 6.

## 4. Hero refinement

- Two-column kept, but add subtle eyebrow rule, larger display type, asymmetric portrait crop (4:5 with thin orange corner accent rule, not a chip).
- Secondary text link "See this week's schedule →" next to primary CTA.
- Replace placeholder with `coach-portrait.jpg`.

## 5. Trust ("About") section

- Section id `about`.
- Larger portrait, name/credentials block with thin orange vertical rule.
- 3 credibility bullets become a typographic numbered list (01 / 02 / 03) with hairline dividers — feels editorial, not card-y.
- Replace strip images with real studio + outdoor shots.

## 6. Reviews section

- Section id `reviews`.
- Testimonials become quote-led editorial cards: oversized opening quote glyph in muted tone, body in serif-adjacent weight via display font for the quote itself, attribution in small caps.
- Community strip uses 4 generated photos with consistent grading.

## 7. Details (Logistics)

- Section id `details`.
- Convert to a refined two-column definition list with hairline rules between rows, label in muted small-caps, value in foreground. Add an "Outdoor areas" chip row (Ciutadella · Barceloneta · Montjuïc · Poblenou).

## 8. Booking CTA

- Tighten copy: "Reserve a session. Or reschedule an existing one."
- Two buttons: primary orange `Book a session`, secondary ghost `Reschedule` (both `#book` for now).
- Add a thin info row: response time · cancellation window · location radius.

## 9. Footer

- Three-column: brand + tagline, quick links (mirror nav), location/contact placeholder. Hairline top border.

## 10. Design system polish (`src/styles.css`)

- Slightly warmer near-black background (already oklch 0.16), add `--color-surface-2` for nested cards.
- Tighten radii to 4px globally for system feel.
- Add subtle `--shadow-elevated` for nav bar only.
- Body font size up to 16/17px with relaxed leading.
- Add `.rule-accent` utility (1px orange left rule used in About + CTA).

## Files touched

- `src/components/site/TopBar.tsx` — nav links + mobile menu
- `src/components/site/Hero.tsx` — real image, refined layout
- `src/components/site/Schedule.tsx` — 6-row featured list
- `src/components/site/schedule-data.ts` — `FEATURED_SLOTS` const
- `src/components/site/Trust.tsx` — id `about`, editorial list, real images
- `src/components/site/SocialProof.tsx` — id `reviews`, editorial quotes, real images
- `src/components/site/Logistics.tsx` — id `details`, refined dl
- `src/components/site/BookingCTA.tsx` — dual CTA + info row
- `src/components/site/Footer.tsx` — 3-column
- `src/styles.css` — tokens, radii, utilities
- `src/assets/*.jpg.asset.json` — 7 generated images via lovable-assets
- `src/routes/index.tsx` — unchanged composition

## Out of scope

Real booking integration, pricing, forms, blog, motion-heavy effects.

Approve to build.
