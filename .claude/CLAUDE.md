# CLAUDE.md — workshop workflow & the consultant page

Scaffolding for the *Flip the Bit* workshop. Two jobs:

- **How** work happens here — branch, plan, verify, PR. See *The loop* below.
- **What a consultant page looks like**, so eleven of us build eleven pages that
  belong to the same site. See *The consultant page*.

For how the site is built — brand, Mantine, typography, architecture — read `AGENTS.md`.

> Lab 1 originally put the page contract in a separate `CLAUDE.md` at the repo root.
> The room decided on a single file, so it lives here. There is no root `CLAUDE.md`
> and there should not be one.

## The loop — every piece of work, every time

1. **Branch first.** Never work on `main`. `git switch -c lab<N>/<initials>-<slug>`.
   If a change is requested while on `main`, create the branch before editing anything.
2. **Plan before code** for anything bigger than a one-line change. Write it to
   `plans/<branch>.md`, then stop and wait for a human to accept it. Do not edit files
   while planning.
3. **Test before implementation** once a test runner exists. A bug fix starts with a
   test that fails for the right reason.
4. **Verify before pushing:** `npm run lint`, `npm test`, `npm run build`. All three.
   Paste the real output. A summary of a result is not a result.
5. **Finish with a PR** via `gh pr create`. The body links the plan and lists what was
   verified. Never open a PR through the web UI.
6. **Stop at the PR.** Do not merge, and do not close it.

Skipping a step is allowed, but say which one and why, in the same message.
Silently skipping is the failure this file exists to prevent.

## Never

- Push to `Gruppera/gruppera-online-vibe`. Your fork only.
- Touch `.github/workflows/deploy-production.yml`.
- Commit `.env*`, keys, or tokens. If a secret appears in the transcript, say so out loud.
- Add a dependency without asking first.
- Claim a command passed without running it.

## Always

- Conventional Commits: `feat:`, `fix:`, `chore:`, `refactor:`, `test:`, `docs:`.
- Use the scripts that exist in `package.json`. Other docs in this repo name commands
  that do not exist — check before you trust them.
- `npm test` does not exist until Lab 2 creates it. Until then, say so rather than
  reporting tests as passing.
- `app/mockdata.json` is the source of truth for people. Edit it deliberately, never
  as a side effect.

---

# The consultant page

Every consultant owns one page at `/vilka-ar-vi/<slug>`, written by hand:

```
app/vilka-ar-vi/daniel/page.tsx     ->  /vilka-ar-vi/daniel
app/vilka-ar-vi/sara/page.tsx       ->  /vilka-ar-vi/sara
```

`<slug>` is your first name, lowercased, ASCII only (`å→a`, `ä→a`, `ö→o`).
The grid at `/vilka-ar-vi` stays the index and links to all of them.

These are static routes, not one shared `[slug]` template. That is deliberate:
you get real design freedom inside your own page, and eleven people can work in
parallel without ever touching the same file.

## Who owns what

| Path | Who edits it |
|---|---|
| `app/vilka-ar-vi/<your-slug>/` | **You, alone.** Nobody else opens this directory. |
| `app/mockdata.json` | Shared. Edit **only your own entry**. Never reorder or reword someone else's. |
| `features/consultants/components/` | Shared. Changes need agreement in the room first. |
| `components/`, `app/layout.tsx`, `next.config.ts` | Shared. Not part of building your page. |

If your change touches a shared file, say so in the PR and explain why.

## The skeleton — start from this

Copy it, replace the name, focus and slug, then build inside the marked section.

```tsx
import { Badge, Box, Container, Stack, Title } from "@mantine/core";

import { ConsultantPeers } from "@/features/consultants/components/ConsultantPeers";
import { ConsultantPhoto } from "@/features/consultants/components/ConsultantPhoto";

export const metadata = {
  title: "Daniel — Gruppera",
  description: "Arkitektur & senior utveckling",
};

export default function DanielPage() {
  return (
    <Box>
      <Container size="lg" py={{ base: "lg", sm: "xl" }}>
        <Stack gap="lg">
          {/* FIXED — identity block, same on every page */}
          <Stack gap="sm">
            <Title order={1} fz={{ base: 36, md: 52 }}>
              Daniel
            </Title>
            <Badge color="sprout" variant="light" size="sm">
              Arkitektur &amp; senior utveckling
            </Badge>
          </Stack>

          <ConsultantPhoto slug="daniel" />

          {/* ---------- YOURS TO DESIGN ---------- */}
          {/* Your story, your sections, your rhythm.                */}
          {/* Mantine components and brand tokens only.              */}
          {/* ------------------------------------- */}

          {/* FIXED — every page ends the same way. Renders the link */}
          {/* grid to all other consultants plus the back link.      */}
          <ConsultantPeers currentSlug="daniel" />
        </Stack>
      </Container>
    </Box>
  );
}
```

### The three fixed parts

1. **Page shell** — `Box > Container size="lg" py={{ base: "lg", sm: "xl" }} > Stack gap="lg"`.
   Identical to `/vilka-ar-vi` and `/blogg`, so pages line up when you navigate between them.
2. **Identity block** — name as `Title order={1} fz={{ base: 36, md: 52 }}`,
   focus as `Badge color="sprout" variant="light"`. Nothing above the name.
3. **`<ConsultantPeers currentSlug="…" />` last** — this is what makes every page
   reachable from every other page. Do not replace it with your own version and
   do not leave it out.

Also set `metadata` with the title `"<Name> — Gruppera"`, so shared links read properly.

### What is yours

Everything between the photo and the peer list. Sections, ordering, quotes,
project highlights, a timeline, a list of what you like working on — your call.
Same tokens, same components, your composition.

## Rules that keep eleven pages looking like one site

- **Mantine only.** No new UI library, no Tailwind, no hand-rolled CSS frameworks.
- **Brand tokens only** — `sprout`, `grafite`, `chamonix`, `moss`, `cloud`,
  `cognac`, `patch`. No hex codes in your page. `SPROUT` is the signal colour;
  used everywhere it stops signalling anything.
- **The type scale in `AGENTS.md`** — 52 / 36 / 28 / 22 / 18 / 16 for headings,
  16 / 15 / 14 / 12 for body. Do not invent sizes.
- **Mantine `Image`, never `next/image`.** The site is a static export with image
  optimisation off; `next/image` will not do what you expect.
- **Photos live in `public/photos/`** and are referenced as `/photos/<file>`.
- **Server component by default.** Add `"use client"` only when you genuinely need
  state, effects or event handlers — and say why in the PR.
- **No new dependencies** without asking first. Everything you need is installed.

## Before you open your PR

```bash
npm run lint
npm run build
```

Both must pass, and `out/vilka-ar-vi/<your-slug>/` must exist afterwards.

`npm test` **does not exist in this repo yet.** If you are asked whether tests
pass, the honest answer is that there is no test runner — not that they passed.

Then look at it in a browser:

- [ ] Your page renders at `/vilka-ar-vi/<your-slug>`
- [ ] The peer list at the bottom reaches every other consultant
- [ ] The back link returns to `/vilka-ar-vi`
- [ ] It holds up at mobile width, not just on your monitor
- [ ] No console errors

Paste the real output of `lint` and `build` into the PR body. A summary of a
result is not a result.

## Shared scaffolding — build once, before anyone starts their page

None of the individual pages work until this exists. One person does it, on one
branch, and it lands before the eleven page branches start:

1. `slug` added to every entry in `app/mockdata.json`, plus `slug` in
   `consultantSchema` with a uniqueness check on `consultantListSchema`.
2. `features/consultants/components/ConsultantPhoto.tsx` — takes `slug`, renders
   the portrait with the same `AspectRatio` + `Image fit="cover"` treatment the
   grid cards use.
3. `features/consultants/components/ConsultantPeers.tsx` — takes `currentSlug`,
   reads `mockdata.json`, renders a divider, a "Fler konsulter" heading, a link
   grid of everyone else sorted with `localeCompare(…, "sv")`, and the back link.
4. `ConsultantGrid` cards link to `/vilka-ar-vi/<slug>`.
5. `SiteHeader` keeps "Vilka är vi" marked active on `/vilka-ar-vi/*`.
