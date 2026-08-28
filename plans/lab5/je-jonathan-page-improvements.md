# Jonathan's page — game & discoverability rework

Branch: `lab5/je-jonathan-page-improvements`, off `origin/main` at `71a285c`.

Scope agreed in the room: **meaningful rework**, focused on the two interactive
modes and the game. Content copy and the `page.tsx` editorial design are **out of
scope** this round.

## Files touched

All inside `app/vilka-ar-vi/jonathan/` — owned by Jonathan alone. No shared
files, no `mockdata.json`.

| File | Change |
|---|---|
| `ModeView.tsx` | Visible mode toggle; robust Konami input; reduced-motion wiring; focus handling. |
| `KonsultCrossing.tsx` | Turn-based reduced-motion fallback; scoped keyboard + swipe input; consultant-circle rail beside the board; on-board message overlays; a11y live region; best-level memory. |
| `page.tsx` | Expected untouched — all interactivity stays in the `"use client"` children. Any change gets called out in the PR. |

## Problem statement

- **The game is unreachable on mobile.** The only way into "Fikapaus" is the
  Konami code on a physical keyboard. Phones have none. Also fails the workshop
  checklist line "It holds up at mobile width."
- **The Konami input is fragile.** Progress is a single index that only rewinds
  correctly for the first key; a wrong key mid-sequence, key-repeat from holding
  a key, or arrow presses used for scrolling can leave it stuck so that "try it
  again" does not work.
- **The game ignores `prefers-reduced-motion`.** `KonsultCrossing` runs a
  continuous `requestAnimationFrame` drift with no check. Workshop rule: "If it
  moves, it respects `prefers-reduced-motion`." `StarField.tsx` is the reference.
- **The unlock is invisible by design.** One dimmed hint line after 5s is the
  whole affordance. The room wants both modes first-class, Konami demoted to a
  bonus.
- **In-game messages are easy to miss.** Arrival and game-over text is small and
  sits *below* the board, outside where the player is looking.
- **Keyboard is captured on `window`.** Arrow keys `preventDefault` page-wide
  while the page is mounted, trapping a desktop visitor on the board even in
  "Jobbet" mode.

## Part A — Mode switching (`ModeView.tsx`)

### A1. Visible toggle

A Mantine `SegmentedControl` with two options — `Jobbet` / `Fikapaus` — in the
identity block, directly under the `Senior backend` badge. Works with tap and
click, so mobile gets in.

- Recommendation: `SegmentedControl` over two buttons — reads as "two views of
  one page", matching the concept. Open to two `Button`s if the room prefers.

### A2. Konami code — rewritten as a rolling buffer, kept as a bonus

Replace the single progress index with a **fixed-length key history**:

- Keep the last `KONAMI.length` (10) `keydown` keys in a ref array; on each key,
  push and trim from the front, then compare the whole buffer to `KONAMI`.
- Any noise before or between — wrong keys, scroll presses, a botched first
  attempt — simply scrolls out of the buffer. "Type it again" always works
  because only the last 10 keys matter.
- Ignore auto-repeat (`event.repeat`) and any event with `ctrlKey/altKey/metaKey`.
- Ignore keystrokes whose `event.target` is an editable element
  (`input`, `textarea`, `[contenteditable]`) — future-proofing; there are none
  today.
- On a full match in `Jobbet`: switch to `Fikapaus` (same as clicking the
  toggle) and show a brief "Fuskkod aktiverad" flash. The existing hint line and
  tooltip stay as flavour. Nothing is reachable *only* via the code.
- Open decision: keep the code at all now that the toggle is visible?
  Recommendation: keep — cheap and characterful.

### A3. Reduced-motion source of truth

`ModeView` reads `useReducedMotion()` (`@mantine/hooks`) once and passes it to
`KonsultCrossing` as a prop, so the mode copy and the game agree.

### A4. Focus / scroll

Switching to `Fikapaus` moves focus to the game board container (focusable — see
B2) and scrolls it into view. Switching back returns focus to the toggle. The
internal `corporate`/`personal` naming becomes `jobbet`/`fikapaus` to match the
UI.

## Part B — The game (`KonsultCrossing.tsx`)

### B1. `prefers-reduced-motion` — turn-based fallback (required)

A frozen board is unplayable, so reduced motion switches the game to a discrete
step model rather than disabling it:

- **Motion on** (default): unchanged — obstacles drift smoothly via `rAF`.
- **Motion reduced**: no `rAF` loop, no self-firing timers. Obstacles advance
  exactly **one cell per player move** (turn-based Frogger). Collision is checked
  after each step.

Both paths share the lane / level / collision config. `useReducedMotion` is
reactive, so toggling the OS setting while the page is open swaps models cleanly.
The `rAF` handle is already cancelled on unmount; the reduced-motion path adds
nothing to clean up.

### B2. Input — scoped keyboard + swipe

- Move the `keydown` listener **off `window`** onto the board `Box`, which gets
  `tabIndex={0}` and an `onKeyDown` handler. Arrow keys only `preventDefault`
  when the board is focused, so the rest of the page scrolls normally. The board
  is auto-focused on entering `Fikapaus` (A4).
- Add **swipe** on the board: `touchstart`/`touchend` delta over a threshold maps
  to up/down/left/right — a phone control that is not the cramped D-pad.
- The on-screen D-pad stays for discoverability and as the tap fallback.

### B3. Consultant-circle rail beside the board

A vertical rail of round colleague portraits to the **left** of the board (the 12
non-Jonathan entries from `mockdata.json`, which `KonsultCrossing` already parses
and filters):

- Each circle is a Mantine `Avatar` (photo) wrapped in
  `Anchor component={Link} href={"/vilka-ar-vi/" + slug}` — real crawlable links,
  `aria-label` and a `Tooltip` with the name. Hover / focus shows a `sprout` ring.
- Layout: `Flex` — rail (fixed width ~64px) + board (the existing capped box).
  The rail is a `ScrollArea` with `mah` matching the board so 12 circles never
  push the layout taller than the game.
- Mobile (`base`): the rail moves **above** the board as a horizontal
  `ScrollArea` strip, `wrap="nowrap"`.
- These are an extra, always-available route to every colleague — not gated
  behind play — so they reinforce fixed point 3 alongside `ConsultantPeers`.
- Optional (open decision): as you play, mark colleagues you have "met" (reached
  the machine with / been hit by) with a `sprout` ring. Low-risk; leave out if
  the room wants the rail purely navigational.

### B4. On-board message overlays (replace the small text below)

Messages render **on the board**, absolutely positioned over the `AspectRatio`
box, instead of as dimmed text underneath:

- **Game over** — a centred `Paper` panel over a dimmed board backdrop:
  heading ("Game over"), `Nivå N · Bästa N`, the "Du mötte {name}" line with the
  colleague link, a primary `Spela igen` button (auto-focused), and the existing
  "Ski or Die" cross-link as small print. The board stays visible behind it.
- **Coffee-machine arrival** — a brief centred pill on the board
  ("Du mötte {name} vid kaffemaskinen", name links out) that fades after ~2s.
  Non-blocking: play continues, so this overlays rather than covers.
- **Level-up** — the pill also flashes `Nivå N` on each advance.
- Fades are gated on `useReducedMotion` (instant show/hide when reduced).
- The overlay is a `role="status"` live region (see B5), and never traps the
  board's keyboard focus.

### B5. Accessibility

- The overlay doubles as a visually-considered `role="status"` region announcing
  `Nivå {n}`, `Du mötte {name}`, `Game over — nivå {n}`.
- Board gets an `aria-label` ("Fikapaus — ta dig till kaffemaskinen").
- D-pad `ActionIcon`s keep their `aria-label`s.

### B6. Best-level memory

Persist the best level in `localStorage` under `jonathan:fikapaus:best`, read on
mount, written on game over, shown in the overlay and next to the live level as
`Nivå n · Bästa n`. Every access wrapped in `try/catch` (private mode / disabled
storage just shows no best).

### B7. Out of scope

- No change to `speedFactor` / `countForLevel` — already tuned.
- No new art for the coffee machine or avatars, no sound.

## Follow-up tweaks (added during review)

- **Colleague unlocking.** The rail starts blurred and nameless; meeting a
  colleague in the game (bump into one, or reach the machine) reveals that
  person with a name + link. Persisted to `localStorage`
  (`jonathan:fikapaus:met`). Rail is a non-scrolling two-column grid.
- **Level / best readouts removed** from the UI (and the `best` localStorage
  machinery with them). Difficulty still scales internally per crossing.
- **Obstacle randomisation.** Colleague identity per obstacle is now random,
  not sequential. When one leaves the board it re-enters the far side as a
  *different* random colleague (no same-face wrap-around), with a fresh
  speed jitter. Seamless wrap ghosts and the toroidal collision term are
  gone with it.
- **Win animation.** When the last colleague is unlocked, a one-shot confetti
  burst + banner plays over the board (banner only under reduced motion).
- **Roster rows are always real links.** Locked rows link too (blurred face,
  name hidden until met) — the unlock never gates the link.
- **"Fler konsulter" removed.** `ConsultantPeers` is dropped from `page.tsx`.
  Colleague navigation is the in-game roster; the site header's "Vilka är vi"
  is the ungated way back. This is the same call `daniel/page.tsx` already
  ships — CLAUDE.md fixed point 3 names `ConsultantPeers` as *a* convenience,
  not a mandate, and the room has accepted a page without it.

## Fixed points — unchanged

- `metadata` stays `{ title: "Jonathan — Gruppera", description: "Senior backend" }`.
- `page.tsx` stays a server component; interactivity stays in `"use client"`
  children.
- Mantine + brand tokens only; type scale 52/36/28/22/18/16 · 16/15/14/12.
- No new dependencies — `@mantine/hooks` is already installed.

## Verification

- `npm run lint` — paste real output in the PR.
- `npm run build` — paste real output in the PR.
- `ls out/vilka-ar-vi/jonathan.html` — must exist after build.
- `npm test` — **does not exist in this repo**; reported as such, not as passing.
- Browser / visual checks (mobile width, reduce-motion on, no console errors,
  peers reachable without playing, Konami retry works) are done by Jonathan.

## Open decisions for the room

1. Toggle control: `SegmentedControl` (recommended) vs two `Button`s.
2. Keep the Konami code as a bonus path (recommended) vs remove it now.
3. Reduced-motion: turn-based fallback (recommended) vs disable game with a note.
4. Consultant-circle rail: purely navigational (recommended) vs also track
   "met" colleagues during play.
5. Best-level in `localStorage`: in (recommended) vs out.
6. Game-over "Ski or Die" cross-link: keep (recommended) vs replace.

---

*Plan only. No files edited yet. Waiting for a human to accept before coding.*
