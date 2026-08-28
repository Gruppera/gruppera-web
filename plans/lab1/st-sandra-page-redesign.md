# Sandra page redesign

Source: Figma section "Sandra" (node-id=53-368) — desktop + mobile frames.

## What changes

`app/vilka-ar-vi/sandra/page.tsx` only. No shared files touched.

- **Layout**: desktop is a side-by-side row (photo left, text right, gap 56px);
  mobile stacks (photo on top, text below). Implemented with Mantine `Flex`
  responsive `direction`/`gap`, not two separate components.
- **Photo**: taller portrait crop (358×460, ratio ≈ 0.778) instead of the
  landscape 320×260 crop `ConsultantPhoto.tsx` uses elsewhere. Built locally
  in the page (same `Card` + `AspectRatio` + `Image fit="cover"` pattern
  `ConsultantPhoto.tsx` already uses, just a different ratio) rather than
  changing the shared component's ratio for everyone.
- **Copy**: about text gets a paragraph break (matches the two-paragraph
  layout in Figma) — a deliberate edit to her own `mockdata.json` entry, nothing
  else in that file touches.
- **Focus colour**: `sprout.4`, per the Figma text colour — matches her design,
  supersedes the `cognac` I picked earlier before this Figma existed.
- **Peers block**: Figma centers the "Fler konsulter" grid on desktop, left-aligns
  it on mobile. `ConsultantPeers` doesn't support that (no alignment prop), and
  it's a shared file — not touching it without agreement in the room. Building
  a local peers block on Sandra's page instead: same data (all consultants
  minus `sandra`, sorted `sv`), real `<Link>` tags, back link — satisfies the
  CLAUDE.md reachability requirement without a shared-file change.
- **Dark mode**: no separate branch of styling needed. Everything here uses
  Mantine's theme-aware tokens (`c="dimmed"`, `var(--mantine-color-text)`,
  `bg="sprout.6"`, etc.), which already resolve per `data-mantine-color-scheme`
  — the same mechanism the rest of the site relies on. `defaultColorScheme` is
  `"dark"` in `app/layout.tsx`, so dark is what most visitors see first; nothing
  page-specific is hardcoded to a light value.

## Verify

`npm run lint`, `npm run build`. `npm test` doesn't exist yet.
