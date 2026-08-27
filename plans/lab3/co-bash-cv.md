# Plan: lab3/co-bash-cv — Christopher's page as an interactive bash-shell CV

## Goal
`/vilka-ar-vi/christopher` mimics a bash terminal. Visitors "explore" the CV by
typing shell-like commands (`ls`, `cat experience.txt`, `whoami`, `help`, …)
instead of scrolling a normal page.

## Constraints from `.claude/CLAUDE.md` (consultant page contract)
- Page shell (`Box > Container size="lg" py={{ base: "lg", sm: "xl" }} > Stack gap="lg"`),
  the identity block (`Title order={1}` name + `sprout` `Badge` focus, nothing above
  the name), and `<ConsultantPeers currentSlug="christopher" />` last are **fixed** —
  the terminal only replaces the "yours to design" middle section.
- `<ConsultantPhoto slug="christopher" />` stays in place, same as the skeleton.
- Mantine only, brand tokens only, no new dependencies, server component by
  default — the terminal itself needs `"use client"` for input state/keystroke
  handling, which is the one place this page needs it.
- `app/vilka-ar-vi/christopher/` is mine alone; no edits to
  `features/consultants/components/` or other shared files.

## Approach
- `app/vilka-ar-vi/christopher/page.tsx` — server component following the
  skeleton exactly (shell, identity block, photo, terminal, peers).
- `app/vilka-ar-vi/christopher/Terminal.tsx` — new client component, local to
  this page's own folder (not shared), so it needs no room agreement.
- No new deps. Terminal is plain React state (`useState`/`useRef`) + Mantine
  (`Box`, `ScrollArea`, `Text`, a hidden/focused `<input>`) styled as a
  terminal window: `grafite` background, `chamonix` text, `sprout` prompt
  (`christopher@gruppera:~$`), red/yellow/green traffic-light dots in the
  title bar (CSS circles, no icons needed).
- A small virtual filesystem represents the CV as files, e.g.:
  - `whoami` → one-line focus/title
  - `cat about.txt` → the bio
  - `cat skills.txt` → skills list
  - `cat experience.txt` → work history
  - `cat projects.txt` → notable projects
  - `cat contact.txt` → how to reach you
  - `ls` lists the above, `help` lists commands, `clear` clears the screen,
    unknown commands get a `command not found` style message.
- Command history via ↑/↓ (array + index in state), same as a real shell.
- **Accessibility / no-JS fallback:** since a typed-command UI isn't
  crawlable or usable without JS, the terminal pre-renders its `help` output
  on first load (visible in the static HTML before hydration), and includes
  a plain "Visa som vanlig text" toggle that expands the same CV content as
  normal readable text/headings — so the information itself is never
  JS-only.
- **Flagged deviation:** terminal output uses a monospace font stack for the
  command/output text (standard for a terminal), while everything else on
  the page stays Poppins per the type scale. Will call this out explicitly
  in the PR description as required when deviating from `AGENTS.md`.

## Content needed from you before I fill in the "files"
`app/mockdata.json` currently only has the one bio paragraph and "arkitektur
& senior fullstack" as focus. To avoid inventing facts about you, I need:
1. Real experience entries — employer, role, period, 1–2 line description
   (as many as you want listed).
2. Skills you want highlighted (list is fine).
3. Notable projects, if any, beyond what's in the bio (name + short blurb).
4. Contact info you want exposed on this page (email/LinkedIn/GitHub/etc.),
   if anything beyond the general company contact.

Until supplied, `experience.txt` / `projects.txt` / `contact.txt` will
contain clearly marked placeholder text rather than fabricated specifics.

## Steps
1. Build `Terminal.tsx` (input handling, history, virtual FS, commands).
2. Build `page.tsx` per the skeleton, terminal slotted into the "yours to
   design" section.
3. Wire content once supplied (or leave marked placeholders).
4. Add the plain-text accessibility fallback.
5. Verify: `npm run lint`, `npm run build`, confirm
   `out/vilka-ar-vi/christopher/` exists.
6. Manual browser check — desktop + mobile width, peer grid/back link work,
   no console errors.
7. Open PR against my fork: link this plan, paste real lint/build output,
   note the monospace-font deviation.

## Out of scope
- `app/mockdata.json` — left as-is unless you want the bio/focus text changed.
- `features/consultants/components/*` — shared, not touched.
- Other consultants' pages/branches.

## Status (2026-08-27)
- `page.tsx` and `Terminal.tsx` implemented per the plan above.
- `npm run lint` — passes clean (Node 22.23.2; this repo's toolchain needs
  Node ≥20, the machine defaulted to Node 16 until upgraded).
- `npm run build` — **fails**, not because of this page's own code, but
  because of a pre-existing bug in the shared
  `features/consultants/components/ConsultantPeers.tsx`: it's a Server
  Component that renders `Text component={Link} .../>`, which Next.js
  can't prerender (a function/component can't be passed as a prop across
  the server→client boundary). `ConsultantGrid.tsx` has the same
  `component={Link}` pattern but works because it already has `"use client"`
  at the top — `ConsultantPeers.tsx` is missing that.
- This was latent because no individual `/vilka-ar-vi/<slug>` page existed
  yet to exercise it. It will block **every** consultant page, not just this
  one, until fixed.
- Got room agreement to fix it directly rather than block on a separate PR.
  Added `"use client"` to `ConsultantPeers.tsx`.
- Rebuilding then surfaced a second, related bug: `ConsultantPhoto.tsx`
  (also a Server Component) renders `<Card.Section>` — a compound/static-
  property subcomponent — which resolves to `undefined` under this
  Turbopack/Next 16 RSC setup unless the file is a Client Component.
  Confirmed by bisection (bare `Card`/`AspectRatio`/`Image` render fine
  server-side; adding `Card.Section` breaks; adding `"use client"` fixes
  it). Same fix applied, with agreement: `"use client"` added to
  `ConsultantPhoto.tsx`.
- `page.tsx` itself can't take `"use client"` (it exports `metadata`), and
  originally used `List`/`List.Item` for the plain-text fallback — the same
  compound-component pattern. Rewrote that section to plain `Stack`/`Text`
  bullets instead of `List.Item`, sidestepping the bug rather than hitting
  it a third time.
- `npm run lint` — passes clean (Node 22.23.2).
- `npm run build` — **passes**. `/vilka-ar-vi/christopher` prerenders
  statically; `out/vilka-ar-vi/christopher.html` exists.
- SSR/HTML-level verification done via curl against the dev server and the
  build output: correct title, full content present (identity block,
  photo, terminal shell with pre-rendered welcome/help text, plain-text
  fallback content, peer grid) — no errors.
- **Not verified:** actual in-browser interactivity (typing `help`, `ls`,
  `cat <file>`, arrow-key history, the `<details>` toggle click). No
  headless-browser tooling (Playwright/Chromium/chromium-cli) is available
  in this environment and installing one wasn't warranted here. Left for
  Christopher to check manually at
  `http://localhost:3000/vilka-ar-vi/christopher` before/after the PR.
