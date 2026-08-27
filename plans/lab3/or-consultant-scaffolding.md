# Shared consultant-page scaffolding

Branch: `lab3/or-consultant-scaffolding`

Builds the shared foundation that CLAUDE.md's "consultant page" contract requires
before any individual `/vilka-ar-vi/<slug>` page can be built. No personal page
(e.g. Olle's) is part of this branch — that comes after this lands and merges.

## 1. `slug` on every consultant

- Add `slug: z.string()` to `consultantSchema` in `features/consultants/schemas.ts`.
- Add a uniqueness check on `consultantListSchema` via `.refine(...)` (no two
  entries share a slug).
- Add a `slug` field to every entry in `app/mockdata.json`, derived from first
  name, lowercased, ASCII-only (å→a, ä→a, ö→o). All current names are already
  ASCII, so slugs are: `daniel`, `gunnar`, `jonathan`, `mattias`, `olle`, `shane`,
  `anton`, `christopher`, `sara`, `henrik`, `james`.

## 2. `ConsultantPhoto`

New file `features/consultants/components/ConsultantPhoto.tsx`:

- Props: `{ slug: string }`.
- Looks up the consultant's `photo` filename by reading `mockdata.json` +
  `consultantListSchema` directly (same pattern the grid page already uses), so
  each page only has to pass its own slug.
- Renders the same `AspectRatio` (`320 / 260`) + Mantine `Image fit="cover"`
  treatment as `ConsultantGrid`'s card, sourced from `/photos/<file>`.

## 3. `ConsultantPeers`

New file `features/consultants/components/ConsultantPeers.tsx`:

- Props: `{ currentSlug: string }`.
- Reads `mockdata.json`, filters out `currentSlug`, sorts the rest with
  `localeCompare(..., "sv")`.
- Renders: a divider, a "Fler konsulter" heading, a link grid (name → `/vilka-ar-vi/<slug>`)
  for everyone else, and a back link to `/vilka-ar-vi`.
- Server component (no `"use client"` needed — no state/effects).

## 4. `ConsultantGrid` links to individual pages

- Wrap each card's content (or the card itself) in a `Link` to `/vilka-ar-vi/<slug>`,
  using the new `slug` field. `ConsultantCard` currently isn't a link at all.

## 5. `SiteHeader` active-state on sub-routes

- `components/SiteHeader.tsx` currently computes `isActive = pathname === link.href`,
  which won't match `/vilka-ar-vi/<slug>`.
- Change the "Vilka är vi" link's active check to also match when
  `pathname.startsWith("/vilka-ar-vi/")`, in both the desktop nav and the drawer.

## Not in scope

- No individual consultant page directories (`app/vilka-ar-vi/<slug>/page.tsx`).
- No changes to other shared files beyond the four touched above.

## Verification before PR

```bash
npm run lint
npm run build
```

`npm test` does not exist yet — will say so rather than claiming tests passed.
Will manually check in a browser: grid cards link to a slug URL (which 404s until
personal pages exist — expected at this stage), and the header still highlights
"Vilka är vi" on `/vilka-ar-vi`.

## PR

- Conventional commit, e.g. `feat: add shared consultant-page scaffolding`.
- PR body notes this touches shared files (`mockdata.json`, `features/consultants/components/`,
  `components/SiteHeader.tsx`) per the ownership table in CLAUDE.md, and that
  individual pages are intentionally out of scope.
