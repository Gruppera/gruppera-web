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

## What the page is for

**Your answer to "vilka är vi" — not your CV.**

The grid card at `/vilka-ar-vi` already carries your name, your focus and your
`about` text. A page that repeats them is a wasted click. This page is *your view
of who Gruppera is*: what this group is like to work with, what we are actually
good at, what you would say to someone who asked. Eleven people, eleven answers
to the same question.

**Make it fun.** A page someone enjoys is a page they finish. Games, toys,
animations, easter eggs are all in scope — as long as they are yours and they say
something. The one thing to avoid is decoration that would look identical on any
other company's site.

## Who owns what

| Path | Who edits it |
|---|---|
| `app/vilka-ar-vi/<your-slug>/` | **You, alone.** Nobody else opens this directory. |
| `app/mockdata.json` | Shared. Edit **only your own entry**. Never reorder or reword someone else's. |
| `features/consultants/components/` | Shared. Changes need agreement in the room first. |
| `components/`, `app/layout.tsx`, `next.config.ts` | Shared. Not part of building your page. |

If your change touches a shared file, say so in the PR and explain why.

## What is actually fixed

Four things. Everything else is yours, including the layout.

1. **The file** — `app/vilka-ar-vi/<your-slug>/page.tsx`. That is what makes the route.
2. **`metadata`** with the title `"<Name> — Gruppera"`, so tabs and shared links read
   properly.
3. **`<ConsultantPeers currentSlug="<your-slug>" />` somewhere on the page.** This is
   what keeps all eleven pages reachable from one another. Do not reimplement it and
   do not leave it out. *Where* it goes is up to you.
4. **Somewhere, it is clear whose view this is.** Your name, in any form you like — a
   heading, a signature, a sticker, a voice, a scoreboard. Someone arriving from a
   search result should not have to guess whose page they are on. It does not have to
   be at the top, and it does not have to be a `Title`.

The minimum that satisfies all four:

```tsx
import { ConsultantPeers } from "@/features/consultants/components/ConsultantPeers";

export const metadata = {
  title: "Daniel — Gruppera",
  description: "Daniels bild av Gruppera",
};

export default function DanielPage() {
  return (
    <>
      {/* everything here is yours */}
      <ConsultantPeers currentSlug="daniel" />
    </>
  );
}
```

### No longer required

The earlier version of this file mandated a `Title order={1}` name plus a `sprout`
focus `Badge` above a portrait, inside a `Box > Container > Stack` shell.
**None of that is required any more.** Use those pieces if they suit your page; drop
them if they get in the way. `<ConsultantPhoto slug="…" />` is available and optional.

If you *do* want a conventional shell, `Container size="lg" py={{ base: "lg", sm: "xl" }}`
matches `/vilka-ar-vi` and `/blogg`, so the pages line up when navigating between them.
`app/vilka-ar-vi/olle/page.tsx` is an example of the conventional treatment;
`app/vilka-ar-vi/mattias/page.tsx` is an example of breaking out of it.

## Rules that keep eleven pages looking like one site

- **Mantine only.** No new UI library, no Tailwind, no hand-rolled CSS frameworks.
- **Brand tokens only** — `sprout`, `grafite`, `chamonix`, `moss`, `cloud`,
  `cognac`, `patch`. No hex codes in your page. `SPROUT` is the signal colour;
  used everywhere it stops signalling anything. Note that `ConsultantPeers` already
  renders every colleague's name in `sprout`, so your page starts with a lot of
  green before you add anything — reach for `moss`, `cloud`, `cognac` and `patch`.
  In JS you can read the tokens off the root as
  `--mantine-color-sprout-4`, `--mantine-color-grafite-7`, and so on.
- **The type scale in `AGENTS.md`** — 52 / 36 / 28 / 22 / 18 / 16 for headings,
  16 / 15 / 14 / 12 for body. Do not invent sizes.
- **Mantine `Image`, never `next/image`.** The site is a static export with image
  optimisation off; `next/image` will not do what you expect.
- **Photos live in `public/photos/`** and are referenced as `/photos/<file>`.
  Some files in there are several megabytes and image optimisation is off, so
  resize before you use one or you will ship it at full size.
- **`"use client"` is fine for anything interactive** — a game, a canvas, a toy all
  need it. Keep it in a child component so `page.tsx` itself stays a server
  component, the way `app/vilka-ar-vi/mattias/StarField.tsx` does. Say in the PR
  what needed it.
- **If it moves, it respects `prefers-reduced-motion`** and cancels its animation
  frame and listeners on unmount. `StarField.tsx` is the reference for both.
- **No new dependencies** without asking first. Everything you need is installed —
  including `@mantine/hooks` and `@mantine/carousel`, which cover most of what a
  toy needs.

## Before you open your PR

```bash
npm run lint
npm run build
```

Both must pass, and the export must contain your page:

```bash
ls out/vilka-ar-vi/<your-slug>.html
```

Mind the shape — Next's static export writes `<your-slug>.html`, not
`<your-slug>/index.html`. A `out/vilka-ar-vi/<your-slug>/` directory does also
appear, but it holds only `__next.*` payload files, so checking for the directory
passes without proving your page built. `wrangler.jsonc` documents the same thing.

`npm test` **does not exist in this repo yet.** If you are asked whether tests
pass, the honest answer is that there is no test runner — not that they passed.

Then look at it in a browser:

- [ ] Your page renders at `/vilka-ar-vi/<your-slug>`
- [ ] The peer list reaches every other consultant, and the back link works
- [ ] Someone landing cold can tell whose page this is
- [ ] It holds up at mobile width, not just on your monitor
- [ ] Anything that moves stops when you turn on reduce-motion
- [ ] No console errors

Paste the real output of `lint` and `build` into the PR body. A summary of a
result is not a result.

## The shared scaffolding — already built

Landed in #3 and #5, so you do not need to build any of it. What you get:

1. **`slug` on every entry in `app/mockdata.json`**, validated in `consultantSchema`
   with a uniqueness check on `consultantListSchema`. Import the JSON and
   `consultantListSchema.parse(...)` if your page wants the team data — a quiz, a
   roster, a scoreboard, whatever.
2. **`ConsultantPhoto.tsx`** — takes `slug`, renders the portrait with the same
   `AspectRatio` + `Image fit="cover"` treatment as the grid cards. Optional.
3. **`ConsultantPeers.tsx`** — takes `currentSlug`, renders a divider, a
   "Fler konsulter" heading, a link grid of everyone else sorted with
   `localeCompare(…, "sv")`, and the back link. **Required.**
4. `ConsultantGrid` cards link to `/vilka-ar-vi/<slug>`.
5. `SiteHeader` keeps "Vilka är vi" marked active on `/vilka-ar-vi/*`.
