# Mattias's consultant page

Branch: `lab3/ms-mattias`

Builds the individual `/vilka-ar-vi/mattias` page on top of the shared scaffolding
(`ConsultantPhoto`, `ConsultantPeers`, `slug` field) already merged to `main` via
`lab3/or-consultant-scaffolding`. Touches only `app/vilka-ar-vi/mattias/`, per the
ownership table in `.claude/CLAUDE.md`.

## 1. `app/vilka-ar-vi/mattias/page.tsx`

Standard skeleton from CLAUDE.md, personalized:

- `metadata`: title `"Mattias — Gruppera"`, description `"Senior Fullstack"`
  (matches `focus` for Mattias in `app/mockdata.json`).
- Identity block: `Title order={1} fz={{ base: 36, md: 52 }}` = "Mattias";
  `Badge color="sprout" variant="light" size="sm"` = "Senior Fullstack".
- `<ConsultantPhoto slug="mattias" />`.
- "Yours to design" section: the star field banner (below) — nothing else.
- `<ConsultantPeers currentSlug="mattias" />` last, unchanged.
- Server component — no `"use client"` on `page.tsx` itself.

## 2. `app/vilka-ar-vi/mattias/StarField.tsx` — the star field banner

A `"use client"` canvas component, local to this page directory (not
`features/consultants/components/`, since it isn't shared with anyone else).

- Renders a `<canvas>` inside a full-bleed wrapper (`width: 100vw; margin-left:
  calc(50% - 50vw)`) so it breaks out of the `Container size="lg"` centering and
  reads as an edge-to-edge banner, roughly 240–320px tall, between the photo and
  the peer list.
- On mount, generates ~120 stars with random x/y/radius/speed. Each animation
  frame moves every star's x left by its speed and wraps it back to the right
  edge (at a new random y) once it scrolls past the left edge — giving the
  impression of continuous forward motion.
- Colors come from resolved brand tokens, not hardcoded hex: reads
  `getComputedStyle(document.documentElement).getPropertyValue(...)` for a
  `grafite` background shade and a `sprout`/`cloud` shade for the star dots, so
  nothing violates the "brand tokens only, no hex codes" rule.
- Respects `prefers-reduced-motion`: if the media query matches, draws the star
  field once, statically, and skips `requestAnimationFrame` entirely.
- Cleans up on unmount: cancels the animation frame and removes the resize
  listener.
- This is the one piece of the page that needs `"use client"` — canvas drawing
  needs a ref, an animation loop, and resize handling, none of which work in a
  server component. Will say so explicitly in the PR body, per CLAUDE.md's
  client-component rule.

## Not in scope

- No changes to `app/mockdata.json`, `features/consultants/components/`,
  `components/SiteHeader.tsx`, or any other consultant's directory.
- No written bio/project/timeline content beyond the fixed identity block — the
  star field is the entire "yours to design" section, by your choice.

## Verification before PR

```bash
npm run lint
npm run build
```

`npm test` does not exist yet — will say so rather than claim tests passed. Will
manually check in the browser per the CLAUDE.md checklist:

- [ ] Renders at `/vilka-ar-vi/mattias`.
- [ ] Peer list reaches every other consultant; back link returns to `/vilka-ar-vi`.
- [ ] Star field animates smoothly, degrades to a static frame under reduced
      motion, and holds up at mobile width.
- [ ] No console errors.
- [ ] `out/vilka-ar-vi/mattias/` exists after `npm run build`.

## PR

- Conventional commit, e.g. `feat: add Mattias's consultant page`.
- PR body explains the one `"use client"` component and why (canvas animation
  needs refs/effects/resize handling).
- Confirms this branch only touches `app/vilka-ar-vi/mattias/` — no shared files.
