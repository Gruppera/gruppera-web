# Henrik's consultant page

Branch: `lab3/hs-henrik`

Builds `/vilka-ar-vi/henrik` on top of the shared scaffolding (`ConsultantPeers`,
`slug` field), already merged to `main`. Touches only `app/vilka-ar-vi/henrik/`,
plus new sprite image assets under `public/photos/corridor/` (see "Shared files
touched" below).

Superseded two earlier concepts in this same plan file: a project-status
dashboard, then a Pong variant. Final concept, after realizing the actual
assignment is "introduce yourself to the team": a first-person maze you walk
through, where you meet colleagues as sprites and can shoot them to jump to
their page.

## Concept — "Korridorerna"

A from-scratch Wolfenstein/Doom-style raycasting engine (canvas 2D, no
libraries) rendering a small hand-built maze. Henrik (the player) walks the
corridors; each of the other 10 consultants stands somewhere in the maze as a
billboard sprite built from their existing `public/photos/<slug>.png` portrait.
Walking up to one shows their name/focus; shooting them triggers a jump to
`/vilka-ar-vi/<slug>`.

This is intentionally the biggest, most code-heavy build so far in this repo's
lab-3 pages (bigger than Mattias's StarField, comparable to or larger than
Olle's AsteroidsGame) — confirmed direction after the "keep it playful, more
code not less" feedback.

## Files

```
app/vilka-ar-vi/henrik/page.tsx        server component, shell + metadata
app/vilka-ar-vi/henrik/CorridorGame.tsx "use client" — engine, input, render loop, HUD
app/vilka-ar-vi/henrik/map.ts          maze grid + sprite spawn table (plain data)
app/vilka-ar-vi/henrik/raycast.ts      pure DDA raycasting math, unit-testable shape
                                        even though no test runner exists yet
public/photos/corridor/<slug>.png      10 resized sprite portraits (new, see below)
```

## 1. `app/vilka-ar-vi/henrik/page.tsx`

Server component.

- `metadata`: title `"Henrik — Gruppera"`, description `"Henriks bild av
  Gruppera"`.
- Minimal shell: a short heading ("Gruppera-korridorerna" or similar) plus one
  line of instructions (movement keys, shoot key) rendered as plain text/Mantine
  `Text` above the canvas — not a full `Container > Stack` treatment, since the
  game wants to own most of the vertical space.
- `<CorridorGame />` — the engine + canvas + HUD.
- `<ConsultantPeers currentSlug="henrik" />` directly below, always rendered
  (not behind a modal, not conditional on playing) — this is what satisfies
  the fixed requirement that every colleague is reachable independent of the
  game. Real `<Link>`s, already crawlable in the static export.
- Server component itself takes no `"use client"` — only `CorridorGame` does.

## 2. `app/vilka-ar-vi/henrik/map.ts`

Plain data, no React.

- A hand-authored 2D grid (array of strings or number arrays), roughly 15×11
  tiles: `1` = wall, `0` = floor. Corridors at least 1 tile wide, a handful of
  short side-branches/alcoves off a main loop so there's real navigation, not
  one straight hallway. Exact tile layout is an implementation detail I'll
  iterate on while building until it plays well (verified in-browser, not
  pre-committed to an exact ASCII grid here).
- Player start position + starting facing angle.
- Sprite spawn table: `{ slug, x, y }` for the 10 non-Henrik consultants from
  `app/mockdata.json` (Daniel, Gunnar, Jonathan, Mattias, Olle, Shane, Anton,
  Christopher, Sara, James) — one per alcove/room, spread around the maze so
  they aren't clustered at the start. `map.ts` only stores `slug`+position;
  name/focus/photo are looked up from `mockdata.json` at render time via
  `consultantListSchema`, same pattern `ConsultantPeers` already uses, so this
  page never duplicates or hand-copies anyone else's data.

## 3. `app/vilka-ar-vi/henrik/raycast.ts`

Pure functions, no DOM/canvas references, so the math is isolated and readable:

- DDA (digital differential analysis) grid raycasting: given player x/y/angle,
  FOV, and screen column count, returns per-column wall distance + which axis
  was hit (for N/S vs. E/W shading) + which map cell.
- A helper to project a world-space sprite (x, y) into screen space (angle
  relative to player heading, distance, on-screen column + width in pixels),
  for the sprite-rendering pass in `CorridorGame`.

## 4. `app/vilka-ar-vi/henrik/CorridorGame.tsx` — the engine

`"use client"`. The large piece.

### Rendering (per frame, `requestAnimationFrame`)
- Casts one ray per screen column via `raycast.ts`, draws each column as a
  vertical wall strip, height inversely proportional to distance (perspective),
  shaded darker with distance and darker again on one axis pair (classic
  Wolfenstein N/S vs. E/W contrast) — brand tokens only (`grafite` shades),
  no hardcoded hex.
- Builds a z-buffer (wall distance per column) while casting.
- Projects all 10 sprites to screen space, sorts far-to-near (painter's
  algorithm), draws each as a scaled vertical-strip billboard from its
  `public/photos/corridor/<slug>.png` texture, skipping/clipping any column
  where the sprite is farther than the z-buffer's wall distance at that column
  (occlusion by walls).
- Crosshair drawn fixed at canvas center.
- HUD: small "SPELARE: HENRIK" label (the page's identity signature, fixed
  point 4) plus, when near/aiming at a consultant, their name + focus as an
  overlay label — this is flavor, not the reachability mechanism.

### Movement / input
- Desktop: `W`/`↑` forward, `S`/`↓` back, `A`/`D` or `←`/`→` turn in place
  (no strafing — keeps controls to 4 keys, classic-Wolfenstein feel).
  `Space` or click on canvas = shoot.
- Touch/mobile: three-to-four large Mantine `ActionIcon` buttons overlaid at
  the bottom of the canvas — turn-left, forward, turn-right, shoot — so the
  page holds up at mobile width per the CLAUDE.md checklist. Shown always
  (harmless on desktop as a redundant on-screen control, avoids feature-
  detecting touch).
- Collision: before applying a forward/back move, check the target grid cell
  isn't a wall; simple axis-separated check so you can still slide along walls.

### Shooting / hit detection
- On shoot: among this frame's projected, unoccluded sprites, find the one
  closest to the crosshair (smallest angular offset from player heading)
  within a small tolerance and a max range; if found, that's a hit.
- On hit: brief flash/impact feedback + HUD text ("Träff: <Name> — <focus>"),
  then `router.push('/vilka-ar-vi/<slug>')` (`next/navigation`) after a short
  delay (~500–600ms) so the feedback is visible. This is a *bonus* shortcut,
  not the page's reachability guarantee — see `ConsultantPeers` above for that.
- Missing (no sprite under the crosshair) just does nothing beyond a small
  "miss" cue.

### Cleanup
- Cancels the animation frame and removes all keyboard/pointer listeners on
  unmount, same hygiene as `StarField.tsx` — this is baseline lifecycle
  correctness, not the `prefers-reduced-motion` rule (see below).

### `prefers-reduced-motion` — deliberately not applied to gameplay
- Checked the existing precedent: Olle's `AsteroidsGame.tsx` (already merged,
  a real-time canvas game) has no `prefers-reduced-motion` handling at all —
  only `StarField.tsx` (ambient decoration) respects it. Following that
  precedent: motion is the interaction itself in a first-person game, not
  decoration, so no reduced-motion branch is planned here either. Flagging
  this explicitly in the PR body rather than silently skipping it, per
  CLAUDE.md's "skipping a step is allowed, but say which one and why."

### Colors
- Brand tokens only for walls/floor/HUD chrome (`grafite`, `chamonix`,
  `sprout` for the crosshair/hit-flash, `cognac`/`patch` for accents). Sprite
  textures are photos, not token-colored, same as `ConsultantPhoto` elsewhere.

## New image assets — `public/photos/corridor/`

The existing `public/photos/<slug>.png` portraits are 500KB–1.6MB each
(`henrik.png` alone is 1.6MB); loading all 10 at full size just for small
in-game billboards would ship several MB for a canvas game, which AGENTS.md
explicitly warns against ("resize before you use one or you will ship it at
full size"). Plan: generate resized copies once, up front, using macOS's
built-in `sips` (no new npm dependency) — square crop, ~128–256px — saved as
new files at `public/photos/corridor/<slug>.png` for the 10 non-Henrik
consultants. These are new files, not edits to anyone's existing portrait.

`public/` is listed as shared in `.claude/CLAUDE.md`'s ownership table, so
this will be called out explicitly in the PR: only *adding* new, clearly
scoped files under a new `corridor/` subfolder, not touching any existing
photo or any other consultant's directory.

## Not in scope

- No changes to `app/mockdata.json`, `features/consultants/components/`
  (other than *importing* `ConsultantPeers`, unchanged), `components/SiteHeader.tsx`,
  or any other consultant's directory.
- No minimap, no multiple maze levels, no enemy AI beyond standing still —
  keeping scope to one playable maze with 10 sprites plus shooting.
- No mouse-look/pointer-lock — keyboard/touch turning only.

## Verification before PR

```bash
npm run lint
npm run build
ls out/vilka-ar-vi/henrik.html
```

`npm test` does not exist yet — will say so rather than claim tests passed.
Manual browser checklist per `.claude/CLAUDE.md`, plus game-specific checks:

- [ ] Renders at `/vilka-ar-vi/henrik`.
- [ ] Peer list (`ConsultantPeers`) reaches every other consultant and the
      back link works — independent of playing the game at all.
- [ ] Walking, turning, and shooting all work via keyboard.
- [ ] The same three actions work via the on-screen touch controls; playable
      at mobile width.
- [ ] Walls occlude sprites correctly (no billboard visible through a wall).
- [ ] Shooting a consultant navigates to their page after the hit feedback.
- [ ] Animation frame and all input listeners are cleaned up on unmount (no
      leaks navigating away mid-game).
- [ ] No console errors.

## PR

- Conventional commit, e.g. `feat: add Henrik's consultant page`.
- PR body: explains the `"use client"` component (canvas engine + input),
  explicitly notes the `prefers-reduced-motion` precedent decision (follows
  `AsteroidsGame`, not `StarField`), confirms new files are scoped to
  `app/vilka-ar-vi/henrik/` plus the new `public/photos/corridor/` assets, and
  confirms no other consultant's files were touched.

Shipped as [Gruppera/gruppera-web#20](https://github.com/Gruppera/gruppera-web/pull/20),
still open. The addendum below is a second commit on the same branch/PR
rather than a new branch — same page, same lab-3 task, PR not yet merged.

---

## Addendum — Tinder-style peer cards

Replaces this page's use of `<ConsultantPeers>` with a swipeable card deck.
Per fixed point 3 in `.claude/CLAUDE.md`, `ConsultantPeers` is "a convenience,
not a mandate" — it can be replaced by anything that keeps (a) real links in
the HTML and (b) a way to reach everyone that doesn't require playing along.
This only touches `app/vilka-ar-vi/henrik/`; `ConsultantPeers.tsx` itself is
untouched and keeps working as-is on everyone else's page.

### New file: `app/vilka-ar-vi/henrik/TinderPeers.tsx`

`"use client"`.

- Data: `consultantListSchema.parse(mockData)` filtered to exclude `henrik`,
  sorted the same way `ConsultantPeers` does (`localeCompare(…, "sv")`) —
  deterministic order, so there's no server/client hydration mismatch from
  randomizing on render.
- **Every peer's card is rendered in the DOM at all times** — absolutely
  stacked (top card full opacity/scale, next one or two peeking behind at a
  slight scale/offset for the classic depth effect, the rest stacked
  underneath at 0 offset). This isn't just a visual choice: it's what makes
  the "real links in the HTML" requirement hold — a card that's third in the
  deck still has its `<Link href="/vilka-ar-vi/<slug>">` in the static export,
  crawlable, regardless of swipe state.
- Each card: `ConsultantPhoto`-style portrait (existing `/photos/<slug>.png`,
  `Image` from Mantine, not `next/image`), name (`Title order={3}`), focus
  (`Badge color="sprout"`), and their `about` text from `mockdata.json` as the
  "vilka är vi" summary the request asked for — same copy already on the
  `/vilka-ar-vi` grid card, just presented one at a time instead of in a grid.
- The whole card is wrapped in a real `<Link>` to `/vilka-ar-vi/<slug>` — a
  plain tap/click with no drag navigates directly, no gesture required.

### Interaction

- Pointer events (`onPointerDown/Move/Up` — covers touch and mouse in one
  code path, unlike the corridor game's separate touch buttons) on the top
  card only: drag horizontally, card follows the pointer with a slight
  rotation proportional to drag distance, matching the familiar Tinder feel.
- Release past a distance threshold (~80px): card animates off in that
  direction. **Right = besök** (`router.push` to their page after the
  animation). **Left = nästa** (just advances to the next card, no
  navigation). Release under the threshold: card springs back to center.
- Below the card: explicit ✗ (Nästa) and ❤ (Besök) buttons doing the same two
  actions without any drag — covers mouse users who don't want to drag and is
  the accessible fallback fixed point 3 asks for ("someone who will not or
  cannot play still needs a way").
- End of deck: a "Det var alla — börja om?" state with a restart button
  (resets to the first card). The always-rendered links underneath are
  unaffected by this state either way.
- **Extra safety net, cheap to add:** a small row of plain text links under
  the deck ("Hoppa direkt till: Anton, Christopher, …") — effectively a
  compact `ConsultantPeers`-equivalent, so fixed point 3 is satisfied by two
  independent mechanisms, not just an interpretation of how obviously
  "gated" a swipe deck is.

### `prefers-reduced-motion` — applied here, unlike the corridor game

Different case from `CorridorGame`: here the drag/fly-off/spring-back motion
is decorative flourish on top of an interaction that works identically
without it (a plain click always navigates or advances, animated or not).
That matches `StarField.tsx`'s situation, not `AsteroidsGame.tsx`'s. Plan:
check `prefers-reduced-motion` once on mount, and when set, skip the CSS
transition durations (state changes apply instantly — card just disappears
and the next one is already there) rather than skipping the feature.

### Not in scope

- No changes to `app/mockdata.json`, `ConsultantPeers.tsx`, or any other
  consultant's directory.
- No new image assets — reuses the existing full-size `/photos/<slug>.png`
  portraits the same way `ConsultantPhoto` already does elsewhere on the site.

### Verification before pushing

```bash
npm run lint
npm run build
ls out/vilka-ar-vi/henrik.html
```

Manual checklist, in addition to the original page's checklist:

- [ ] Every peer's `<Link>` is present in `out/vilka-ar-vi/henrik.html`
      regardless of deck position (`grep` the export for each slug).
- [ ] Swipe left/right, the two buttons, and a plain click/tap on the card
      all work; holds up at mobile width.
- [ ] Reaching every colleague works using only the ✗/❤ buttons — no drag.
- [ ] `prefers-reduced-motion` removes the animation, not the functionality.
- [ ] No console errors.

### PR

- Additional commit on the existing branch (`lab3/hs-henrik`), updating the
  already-open PR #20 rather than opening a new one.
- Conventional commit, e.g. `feat: replace ConsultantPeers with a swipeable card deck`.
- PR comment/description update explains the `prefers-reduced-motion`
  decision (this time following `StarField`, not `AsteroidsGame` — the
  opposite of the first commit's reasoning, for the opposite reason) and
  reconfirms `ConsultantPeers.tsx` itself was not modified.
