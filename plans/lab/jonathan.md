# Jonathan's consultant page

Branch: `lab/jonathan`, off `main` at `fec38df` (shared scaffolding already merged).

New file: `app/vilka-ar-vi/jonathan/page.tsx` -> `/vilka-ar-vi/jonathan`.
No other files touched. `mockdata.json` already has the `jonathan` entry with
`slug`, `focus: "Senior backend"`, `photo: "jonathan.png"` - not edited.

## Concept

Hybrid: short editorial intro -> one signature visual (a three-node
"teknisk ryggrad" flow) -> a context chip row -> a closing principle callout.
One memorable idea (the flow), executed with restraint, all inside Mantine +
brand tokens, server component only.

## Voice: third person

Third person ("Jonathan ar...", "Han arbetar..."), matching every other bio on
the site and the existing `about` text. For a B2B page aimed at clients deciding
whether to hire, third person reads as the more polished, agency-vetted register
and keeps the eleven pages consistent. First person is defensible (warmer on an
owned page) but we are going third for consistency.

## Content rule

Every line traces back to Jonathan's `mockdata.json` entry. No invented
companies, years, named projects, or specific tech. Jonathan edits in specifics
himself in a later pass.

Source facts (from `about` + `focus`):
senior developer, broad experience - backend-heavy systems - cloud-based
solutions - microservices - integrations - CI/CD - complex organisations -
high demands on security and quality - technical depth - structured way of
working - Scrum Master experience.

## Page structure

Fixed skeleton from `.claude/CLAUDE.md`, unchanged:

- Page shell: `Box > Container size="lg" py={{ base: "lg", sm: "xl" }} > Stack gap="lg"`.
- Identity block: `Title order={1} fz={{ base: 36, md: 52 }}` = "Jonathan";
  `Badge color="sprout" variant="light" size="sm"` = "Senior backend".
- `<ConsultantPhoto slug="jonathan" />`.
- `metadata = { title: "Jonathan - Gruppera", description: "Senior backend" }`.

### Yours-to-design zone

1. **Intro** - `Stack gap="md"`, one `Text fz={{ base: 14, sm: 16 }}` paragraph.
   Rephrases sentence 1 of `about`: senior developer, broad experience of
   backend-heavy systems and cloud-based solutions. 2-3 sentences, no heading
   (sits right under the photo as a lede).

2. **Teknisk ryggrad** - the signature visual. `Title order={3} fz={{ base: 22, md: 28 }}`
   heading, then a three-node flow:

   ```
   Mikrotjanster  ->  Integrationer  ->  CI/CD
   ```

   - Each node: a `Paper` (`bg="grafite.6"`, `radius="md"`, `p="md"`,
     `withBorder`) containing `Text fw={600} fz={16}` (node name) + one
     `Text c="dimmed" size="sm"` line that only re-states mockdata
     (e.g. CI/CD -> "automatiserade leveransfloden").
   - Desktop (`visibleFrom="sm"`): `Group wrap="nowrap" align="stretch"` with
     `IconArrowRight` (`@tabler/icons-react`, `color` via `sprout.4`) between
     nodes.
   - Mobile (`hiddenFrom="sm"`): `Stack` of the same three `Paper` nodes with
     `IconArrowDown` between them.
   - Node content defined once as an array, mapped in both layouts.
   - Sprout appears only on the arrows - signal colour stays a signal.

3. **Sammanhang** - `Title order={3}` heading + `Group gap="xs"` of
   `Badge color="sprout" variant="light" size="sm"` (or `variant="default"` to
   keep sprout for the arrows only - decide during build):
   `Backend-tunga system` - `Molnbaserade losningar` -
   `Komplexa organisationer` - `Sakerhet & kvalitet` - `Scrum Master`.
   These are contexts/attributes, distinct from the three flow nodes, so no
   overlap.

4. **Principle callout** - Mantine `Blockquote` (`color="sprout"`,
   `icon={<IconQuote />}` optional), text:
   "Tekniskt djup kombinerat med ett strukturerat arbetssatt." Closes the
   free zone before the peer list.

- `<ConsultantPeers currentSlug="jonathan" />` last, unmodified.

## Constraints check

- Mantine components only; brand tokens only (`sprout`, `grafite`, `chamonix`,
  `dimmed`); no hex.
- Type scale: 52/36 h1, 28/22 h3, 16 node titles, 16/14 body, per `AGENTS.md`.
- Mantine `Image` is used only inside `ConsultantPhoto` (shared, untouched).
- Server component - no `"use client"`. `visibleFrom`/`hiddenFrom` are static
  responsive props, no JS needed.
- No new dependencies - `@tabler/icons-react` is already installed.

## Verification

```bash
npm run lint
npm run build
```

Both must pass. `out/vilka-ar-vi/jonathan/` must exist after build.
`npm test` does not exist in this repo yet - not run, not claimed.

Manual, in `npm run dev`:

- [ ] `/vilka-ar-vi/jonathan` renders
- [ ] flow reads left-to-right on desktop, top-to-bottom stacked on mobile
- [ ] peer list reaches every other consultant; back link returns to `/vilka-ar-vi`
- [ ] holds up at 360px width
- [ ] no console errors

## PR

`gh pr create` once verified. Body links this plan and pastes real `lint` +
`build` output. Stop at the PR - no merge.

---

# Iteration 2 - layout tweak + mode toggle

Same branch `lab/jonathan`. Iteration 1 is merged-ready at `43318f4`. Still one
owned file plus (new) one client component beside it - no shared files touched.

## Changes requested

1. Smaller photo.
2. "Teknisk ryggrad" moves to the right of the photo, as a vertical stack
   (top -> bottom), instead of its own full-width section below.
3. A toggle that appears next to the name **10 seconds** after load, switching
   between **Corporate mode** (the current page) and **Personal mode**
   (stub now, built in a later iteration).

## 1 + 2 - photo and ryggrad side by side

- Wrap `<ConsultantPhoto slug="jonathan" />` in `<Box maw={260}>`. The shared
  component keeps its own `maw={480}`; the outer `Box` shrinks it further.
  `ConsultantPhoto` is **not** edited.
- Replace "standalone photo" + "separate Teknisk ryggrad section" with one row:
  `<Flex direction={{ base: "column", sm: "row" }} gap="xl"
   align={{ base: "stretch", sm: "flex-start" }}>`
  - Left: the constrained photo `Box`.
  - Right: `<Stack gap="sm" style={{ flex: 1 }}>` = `Title order={3}
    fz={{ base: 22, md: 28 }}` "Teknisk ryggrad" then the three `BackboneNode`
    papers top-to-bottom with `IconArrowDown` between them.
- Delete the desktop horizontal variant (`Group wrap="nowrap"` +
  `IconArrowRight`) and the `visibleFrom`/`hiddenFrom` split. One vertical
  layout now, both breakpoints. `IconArrowRight` import removed.
- `BackboneNode` component and the `backbone` array are unchanged and still
  mapped once.
- Free-zone order becomes: intro lede -> [photo | ryggrad] row -> Sammanhang
  -> Blockquote. (The skeleton's photo-right-after-identity placement is inside
  the yours-to-design zone, so moving it is allowed; noted here and in the PR.)

## 3 - Corporate / Personal toggle

The mode switch has to sit above the free-zone content, so a thin client island
wraps it. Server content stays server-rendered - it is passed through as
`children`.

- **New file** `app/vilka-ar-vi/jonathan/ModeView.tsx`, `"use client"`:
  - State `mode: "corporate" | "personal"`, default `"corporate"`.
  - State `showToggle`, flipped true by
    `useEffect(() => { const t = setTimeout(() => setShowToggle(true), 10000);
     return () => clearTimeout(t); }, [])`.
  - Renders the identity block itself (so the toggle can be adjacent):
    `<Group gap="sm" align="center">` with
    `Title order={1} fz={{ base: 36, md: 52 }}` "Jonathan" +
    `<Transition mounted={showToggle} transition="pop" duration={200}>`
    wrapping `<SegmentedControl size="xs" data={[
      { label: "Corporate", value: "corporate" },
      { label: "Personal", value: "personal" }]} value={mode}
      onChange={(v) => setMode(v as ...)} />`.
    Then the focus `Badge color="sprout" variant="light" size="sm"` below,
    as today.
  - Body: `mode === "corporate" ? children : <personal stub>`.
  - Personal stub: `<Text c="dimmed" fz={{ base: 14, sm: 16 }}>Personligt läge -
    kommer snart.</Text>`. Placeholder copy, not an invented bio fact.
  - `SegmentedControl` gets **no `color` prop** (neutral) - sprout stays the
    signal colour, reserved for the arrows and the badge.
- **`page.tsx`** (stays a server component, keeps `export const metadata`):
  - Shell unchanged: `Box > Container size="lg" py={{ base: "lg", sm: "xl" }} >
    Stack gap="lg"`.
  - Identity block markup moves out of `page.tsx` into `ModeView`.
  - Renders `<ModeView>{/* corporate free zone JSX */}</ModeView>` then
    `<ConsultantPeers currentSlug="jonathan" />` last, unchanged.
  - `BackboneNode`, `backbone`, `contexts` stay in `page.tsx` and are rendered
    inside the `children` passed to `ModeView`.

### Deviations from the shared skeleton (call out in PR)

- The "FIXED - identity block" now renders inside a client component and has a
  control next to the name. Still name-on-top, still `Title order={1}` + sprout
  `Badge`; nothing added above the name. Scoped to this one page.
- `page.tsx` gains a sibling client file in the same owned directory. No shared
  file changes.

## Constraints check (unchanged from iteration 1 plus)

- Mantine only: `Flex`, `SegmentedControl`, `Transition`, `Group` are all
  `@mantine/core`. No new dependency.
- `"use client"` is justified: 10s timer + toggle state + event handler. Stated
  in the PR.
- Brand tokens only; no hex. Type scale unchanged (52/36 h1, 28/22 h3, 16 node
  titles, 16/14 body).
- `ConsultantPeers` stays last and untouched.

## Verification

```bash
npm run lint
npm run build
```

Both must pass; `out/vilka-ar-vi/jonathan/` must still exist. `npm test` still
does not exist - not run, not claimed.

Manual, `npm run dev`:

- [ ] photo is visibly smaller; "Teknisk ryggrad" sits to its right on >= sm,
      stacks under it on mobile
- [ ] ryggrad nodes read top -> bottom with down arrows at every width
- [ ] no toggle for the first 10s; it then pops in next to "Jonathan"
- [ ] Corporate shows the current page; Personal shows the stub line
- [ ] switching back and forth works; peer list + back link unchanged
- [ ] holds at 360px; no console errors

## PR

Update the existing PR for `lab/jonathan` (or open one if none), body links this
plan and pastes real `lint` + `build` output. Stop at the PR - no merge.

---

# Iteration 3 - konami-code unlock for Personal mode

Same branch `lab/jonathan`, on top of PR #10. **Supersedes the mode-switch
mechanism from Iteration 2** (the 10 s `SegmentedControl`). Iteration 2's layout
work - smaller photo, "Teknisk ryggrad" stacked beside it - stays exactly as is.

## Change requested

Drop the visible Corporate / Personal button. Instead:

1. 5 seconds after load, the text **"Kan du konami-koden?"** fades in next to the
   name, where the toggle used to sit.
2. Hovering (or focusing) that text shows a `Tooltip` spelling out the code:
   `↑ ↑ ↓ ↓ ← → ← → B A`.
3. Typing that key sequence anywhere on the page switches to **Personal**
   ("fun") mode. Typing it again switches back.

Personal-mode content stays the Iteration 2 stub line - built out in a later
iteration.

## `ModeView.tsx` changes

- Drop the `SegmentedControl` import + usage and the `showToggle` 10 s timer.
  Add a `showHint` timer at **5000 ms**.
- Konami tracking, all client-side:
  - `const KONAMI = ["arrowup","arrowup","arrowdown","arrowdown","arrowleft",
    "arrowright","arrowleft","arrowright","b","a"] as const`.
  - `useEffect` adds one `window` `keydown` listener; progress index kept in a
    `useRef`. Per key: lower-case `event.key`; if it equals `KONAMI[index]`,
    advance; otherwise reset (to `1` if the key equals `KONAMI[0]`, else `0`).
    On reaching the end: `setMode(m => m === "corporate" ? "personal"
    : "corporate")` and reset the index. Cleanup removes the listener.
  - Ignore repeats while a modifier (ctrl/alt/meta) is held; don't preventDefault
    (the arrows still scroll - fine for an easter egg).
- The hint element:
  ```tsx
  <Transition mounted={showHint} transition="fade" duration={200}>
    {(styles) => (
      <Tooltip label="↑ ↑ ↓ ↓ ← → ← → B A" withArrow>
        <Text style={styles} component="span" tabIndex={0} c="dimmed" size="sm">
          {mode === "corporate"
            ? "Kan du konami-koden?"
            : "Konami igen för att gå tillbaka"}
        </Text>
      </Tooltip>
    )}
  </Transition>
  ```
  `tabIndex={0}` so the tooltip is keyboard-reachable, not hover-only. The hint
  stays mounted in both modes once it has appeared, so there is always a way back
  without a reload.
- Still `"use client"` - justified by the 5 s timer, the keydown listener and the
  mode state. `Tooltip`, `Transition`, `Text`, `Group`, `Badge`, `Title`, `Stack`
  are all `@mantine/core`. No new dependency.
- `page.tsx` unchanged from Iteration 2: server component, keeps `metadata`,
  passes the corporate free zone as `children`, `ConsultantPeers` last.

## Deviations from the shared skeleton (unchanged in spirit from Iteration 2)

Identity block still renders inside a client component; instead of a control it
now carries a dimmed easter-egg hint next to the name. Name still on top,
`Title order={1}` + sprout `Badge`, nothing above the name. One sibling client
file in the owned directory. No shared files touched.

## Verification

```bash
npm run lint
npm run build
```

Both must pass; `out/vilka-ar-vi/jonathan.html` and `out/vilka-ar-vi/jonathan/`
still exist; SSR HTML still contains the corporate content. `npm test` still does
not exist - not run, not claimed.

Manual, `npm run dev`:

- [ ] no hint for the first 5 s; "Kan du konami-koden?" then fades in by the name
- [ ] hovering or focusing it shows the tooltip `↑ ↑ ↓ ↓ ← → ← → B A`
- [ ] entering the sequence flips to Personal (stub line); a wrong key mid-run
      resets cleanly; entering it again returns to Corporate and the hint text
      swaps accordingly
- [ ] peer list + back link unchanged; holds at 360 px; no console errors

## PR

Update PR #10 - body gets an Iteration 3 section with real `lint` + `build`
output. Stop at the PR - no merge.

---

# Iteration 4 - Personal mode content: the consultant-crossing game

Same branch `lab/jonathan`, on top of PR #10. Fills in what Personal ("fun")
mode actually shows. Corporate mode and every other file are untouched.

## Concept

A small Frogger-style game. Jonathan (his portrait) starts at the bottom and
crosses lanes of traffic to reach the top. The traffic is the other Gruppera
consultants - each a round `Avatar` of their photo - sliding across the lanes at
different speeds and directions. Touch one and you lose a life. Reach the top and
the score goes up, everything speeds up a notch, and you go again. Three lives,
then "Spela igen".

"Frogger" is a trademark - it is the shape of the game, never a word in the UI or
the filenames. Component/file: **`KonsultCrossing.tsx`**.

## Files

- **New** `app/vilka-ar-vi/jonathan/KonsultCrossing.tsx`, `"use client"` - the
  whole game. `"use client"` is justified: `requestAnimationFrame` loop, keyboard
  + pointer input, game state.
- **Edit** `app/vilka-ar-vi/jonathan/ModeView.tsx` - the `mode === "personal"`
  branch renders a short heading + one instruction line + `<KonsultCrossing />`
  instead of the current stub `Text`. Nothing else in `ModeView` changes
  (identity block, konami hint, corporate `children` path all stay).
- `page.tsx` - unchanged.
- No shared files. `KonsultCrossing` reads `app/mockdata.json` through the
  existing `consultantListSchema` from `@/features/consultants/schemas`
  (read-only, same pattern as `ConsultantPhoto` / `ConsultantPeers`).

## Board model

- Grid: `COLS = 9`, `ROWS = 9`. Row `8` = start band, row `0` = goal band,
  row `4` = safe band; rows `1-3` and `5-7` are the six traffic lanes.
- Player: `{ col, row }` in grid units, starts `{ 4, 8 }`. Moves one cell per
  input, clamped to the grid.
- Lanes: a static `LANES` array, one entry per traffic row:
  `{ row, dir: 1 | -1, speed /* cols per second, ~1.1-2.4 */, count: 2 }`.
  Direction alternates lane to lane; speeds hand-picked and varied.
- Obstacles: `LANES.flatMap` -> for each lane, `count` consultants spaced
  `COLS / count` apart, cycling through the 11 consultants
  (`consultants[(laneIndex * count + i) % consultants.length]`). Jonathan can
  appear in traffic too - fine.
- Obstacle x at time `t` seconds:
  `x = (((phase + dir * speed * t) % COLS) + COLS) % COLS` - wraps seamlessly.
  A second ghost copy is drawn at `x - COLS` / `x + COLS` so tokens slide in from
  the edge instead of popping.

## Loop & state

- `useState`: `status: "idle" | "playing" | "over"`, `score`, `lives` (start 3),
  `player`, `tick` (latest RAF timestamp - what drives obstacle re-render).
- `useRef`: `rafRef`, `startRef` (perf clock for the current run), `playerRef`
  (kept in sync with `player` so the RAF callback can read it), `speedMultRef`
  (starts 1, `*= 1.15` per crossing), `pausedElapsedRef`.
- `start()`: `status = "playing"`, reset score/lives/player/speedMult, seed
  `startRef`, kick the loop. Shown as a **"Starta"** button - nothing animates
  until the user asks, which also covers `prefers-reduced-motion`.
- `loop(now)`: `t = (now - startRef) / 1000`; `setTick(now)`; compute every
  obstacle x at `t`; if any obstacle on `playerRef.row` has
  `|x - (col + 0.5)| < HIT` (`HIT ~= 0.85`) -> `loseLife()`; else
  `rafRef = requestAnimationFrame(loop)`.
- `move(dx, dy)`: clamp; if new `row === 0` -> `win()`; otherwise set `player`
  (+ `playerRef`).
- `win()`: `score + 1`, `speedMultRef *= 1.15`, player back to start band, run
  continues.
- `loseLife()`: `lives - 1`, player back to start; at `0` -> `status = "over"`,
  cancel RAF. HUD shows **"Spela igen"**.
- Effects:
  - keydown listener on `window`, added only while `status === "playing"`;
    arrows call `move` and `preventDefault()` (stop page scroll). Removed on
    cleanup / status change. (No clash with the konami listener in `ModeView`:
    the konami sequence ends in `b`, `a`, which arrow-only play never sends, so
    gameplay can't flip the mode.)
  - `visibilitychange`: tab hidden -> pause (cancel RAF, stash elapsed);
    visible -> rebase `startRef` and resume.
  - unmount -> `cancelAnimationFrame`.

## Rendering (Mantine + brand tokens only, no hex)

- Wrapper: `Box maw={480} mx="auto"` -> `AspectRatio ratio={1}` -> `Box
  pos="relative"` with `overflow: "hidden"`, `borderRadius:
  var(--mantine-radius-md)`, `border: 1px solid var(--mantine-color-default-border)`.
- Lane bands: absolutely positioned `Box`, `top: row / ROWS * 100%`, `height:
  100% / ROWS`. Goal `bg="sprout.9"`, start `bg="moss.9"`, safe `bg="moss.8"`,
  traffic lanes `bg="grafite.8"` / `bg="grafite.7"` alternating. Goal band
  carries a `Badge color="sprout" variant="filled" size="sm"` reading
  **"Deployad!"** (nods to the CI/CD line in the corporate bio; easy to change).
- Obstacles + player: `Avatar` (`radius="xl"`), `src={`/photos/${photo}`}`,
  `alt={name}`; width/height = one cell via `style`, `left`/`top` from grid ->
  `%`. `Avatar` renders initials automatically if an image is missing, so no
  broken tiles. Player `Avatar` = `/photos/jonathan.png`, `color="sprout"` with
  a sprout ring via `style` outline token.
- HUD (`Group` above the board): `Text size="sm"` "Poäng: {score}"; lives as
  three hearts (`IconHeartFilled` / `IconHeart` from `@tabler/icons-react`,
  already installed); the `Button size="xs"` ("Starta" / "Spela igen", hidden
  while playing).
- D-pad below the board for touch + discoverability: four `ActionIcon
  variant="default"` with `IconArrowUp/Down/Left/Right`, laid out as a plus,
  calling the same `move`. Visible at all widths.
- In `ModeView` personal branch, above the game: `Title order={3}
  fz={{ base: 22, md: 28 }}` "Konami-läge" + `Text c="dimmed"
  fz={{ base: 14, sm: 16 }}` "Hjälp Jonathan förbi kollegorna. Piltangenter
  eller knapparna."

## Constraints check

- Mantine only: `Avatar`, `ActionIcon`, `AspectRatio`, `Badge`, `Button`,
  `Box`, `Group`, `Text`, `Title` are all `@mantine/core`. Icons from the
  already-installed `@tabler/icons-react`. **No new dependency.**
- Brand tokens only (`sprout`, `moss`, `grafite`, `dimmed`, default-border);
  no hex anywhere.
- Type scale: `Title order={3}` 22/28, body 14/16, HUD `size="sm"`. No invented
  sizes.
- `next/image` not used; consultant art goes through Mantine `Avatar`.
- `KonsultCrossing` only ever mounts after the konami toggle, i.e. never during
  static export - no `window`/`document` at module or render scope, only in
  effects.
- Known tradeoff: the source photos are 0.5-1.6 MB PNGs loaded at avatar size
  (image optimisation is off for the static export). Acceptable for an easter
  egg; a future pass could add downscaled copies. Noted in the PR.

## Verification

```bash
npm run lint
npm run build
```

Both must pass. `out/vilka-ar-vi/jonathan.html` and `out/vilka-ar-vi/jonathan/`
still exist; the SSR HTML still contains the corporate content and does **not**
contain game markup (client-only + konami-gated). `npm test` still does not exist
- not run, not claimed.

Per the standing workflow note, browser/gameplay checks are the user's to run.
The PR lists them as unchecked boxes:

- [ ] "Starta" begins a run; arrow keys and the on-screen D-pad both move Jonathan
- [ ] consultant avatars slide across the six lanes, wrap without popping
- [ ] touching one costs a life; losing all three shows "Spela igen"
- [ ] reaching the top raises the score, resets Jonathan, speeds things up
- [ ] arrow keys don't scroll the page while playing; konami still returns to
      Corporate; switching modes mid-game doesn't leave a RAF running
- [ ] holds at 360px width; no console errors

## PR

Update PR #10 - add an Iteration 4 section with real `lint` + `build` output and
the checklist above. Stop at the PR - no merge.

---

# Iteration 5 - level-based difficulty + coffee-machine goal

Same branch, on top of PR #10. Only `KonsultCrossing.tsx` changes plus one line
of copy in `ModeView.tsx`. Corporate mode, `page.tsx` and shared files untouched.

## Changes

1. **"Poäng" -> "Nivå".** The HUD counter is the level, not a score. Starts at
   **1**, +1 each time Jonathan reaches the goal. Drop the separate
   "Nivå {1 + score}" text shown while playing - one number now, always visible.
   Rename `score` / `scoreRef` / `setScore` -> `level` / `levelRef` / `setLevel`
   (initial `1`).

2. **Level = difficulty, gentle start, ramps up.** Two dials, both a function of
   the current level:
   - **Speed factor** `min(BASE_FACTOR + (level - 1) * LEVEL_STEP, MAX_FACTOR)`
     with `BASE_FACTOR = 0.6`, `LEVEL_STEP = 0.16`, `MAX_FACTOR = 2.4`. Applied
     to per-lane base speeds, which drop to `1.3 / 0.9 / 1.7 / 1.1 / 1.5 / 1.9`
     cols per second. Level 1 ~= 0.6x -> clearly easy; the cap is reached around
     level 13. Replaces the old flat `1 + score * 0.15`.
   - **Density** `count = min(2 + floor((level - 1) / 3), 4)` consultants per
     lane: 2 through level 3, 3 at levels 4-6, 4 from level 7 (gap 2.25 cells,
     still crossable).
   - Obstacles are rebuilt from `buildObstacles(level, consultants)` on each
     level-up (the player is already resetting to the start line, so the board
     visibly re-lays-out for the new level). Same builder feeds `start()` for
     level 1 and the idle-state board. `LANES` now carries `baseSpeed` and no
     `count`; the consultant list stays a `useMemo`.

3. **Goal is a coffee machine.** Replace the `Badge` "Deployad!" in the goal band
   with a small machine built from `Box`es + `IconCoffee`
   (`@tabler/icons-react`, already installed): a `grafite` body, a `grafite`
   hopper strip, a `cognac` `IconCoffee` for the cup, a `sprout` power-dot.
   `aria-label="Kaffemaskin"`. Goal band `bg` shifts `sprout.9` -> `cognac.9`
   (still a brand token); the player keeps its sprout outline. `ModeView`'s
   instruction line gains "... till kaffemaskinen."

4. **Game-over cross-promo.** When `status === "over"`, render a line under the
   board: `Text size="sm"` "Game over - nådde nivå {level}. Testa vårt andra
   spel: " + `Anchor` ("Ski or Die", `href="https://skiordie.gruppera.se/"`,
   `target="_blank"`, `rel="noreferrer"`). `Anchor` is `@mantine/core`. Only
   shown in the over state; no styling colour outside brand tokens (default
   `Anchor` colour).

## Constraints

Still Mantine + brand tokens only (`grafite`, `cognac`, `sprout`, `moss`), no
hex, **no new dependency**. Type scale untouched. `KonsultCrossing` stays
client-only and konami-gated.

## Verification

```bash
npm run lint
npm run build
```

Both pass; `out/vilka-ar-vi/jonathan.html` and `out/vilka-ar-vi/jonathan/` still
present; SSR HTML unchanged (corporate content only, no game markup). `npm test`
still absent. Gameplay checks are the user's - PR lists them:

- [ ] HUD reads "Nivå: 1" at start and counts up on each crossing
- [ ] level 1 is slow and easy; both speed and lane density climb with the level
- [ ] the goal renders as a coffee machine; reaching it advances the level
- [ ] the board re-seeds cleanly on level-up; lives and RAF behave as before
- [ ] game over shows the "Ski or Die" line linking to
      https://skiordie.gruppera.se/ (opens in a new tab)
- [ ] 360px width holds; no console errors

## PR

Update PR #10 - Iteration 5 section with real `lint` + `build` output.
Stop at the PR - no merge.

---

# Iteration 6 - autostart + restart button placement

Minor. `KonsultCrossing.tsx` only.

- **Autostart.** Drop the `"idle"` status; `status` initialises to `"playing"`,
  so the RAF loop runs on mount and the game is live immediately. No "Starta"
  button. (`start()` stays, used only for restart.)
- **Restart button.** On game over, the "Spela igen" button moves out of the HUD
  row to its own `Group justify="center"` above the board (above the HUD). The
  HUD row is now just "Nivå" + lives.

`npm run lint` + `npm run build` must pass; SSR output unchanged. Browser checks
are the user's.

---

# Iteration 7 - drop the konami unlock, use a plain button

`ModeView.tsx` only. Reverts the Iteration 3 mechanism.

- Remove the konami keydown listener, the 5 s `showHint` timer, the `Tooltip`
  and `Transition`, the `KONAMI` array, and the `useEffect` / `useRef` imports.
- A plain `Button` (`variant="light"`, `color="sprout"`, `size="xs"`) sits next
  to the name from first render and toggles `mode`. Label: "Personligt läge" in
  corporate, "Tillbaka till jobbet" in personal.
- Personal-mode heading "Konami-läge" -> "Fikapaus" (the konami reference is
  gone; the coffee-machine goal makes "Fikapaus" the fit).
- `mode` state and the corporate `children` path are unchanged.

`npm run lint` + `npm run build` must pass; SSR output unchanged (corporate
content only). Browser checks are the user's.

---

# Iteration 8 - konami to enter, button to go back

`ModeView.tsx` only. Splits the two directions:

- **Enter Personal mode: konami.** Restore the keydown listener and the 5 s
  "Kan du konami-koden?" hint + `Tooltip`. The listener now only ever switches
  `corporate -> personal` (`setMode(c => c === "corporate" ? "personal" : c)`).
- **Go back: button.** In Personal mode the slot next to the name is a `Button`
  ("Tillbaka till jobbet", `variant="light"` / `color="sprout"` / `size="xs"`)
  that sets `mode` back to `corporate`. No konami needed to leave.
- Heading stays "Fikapaus".

`npm run lint` + `npm run build` must pass; SSR output unchanged. Browser checks
are the user's.

---

# Iteration 9 - Jonathan is only the player, never traffic

`KonsultCrossing.tsx` only. The obstacle pool filters out the `jonathan` slug, so
his portrait is only the playable character. The other 10 consultants still cycle
through the lanes.

`npm run lint` + `npm run build` must pass. Browser check is the user's.

---

# Iteration 10 - name the colleague who ended the run

`KonsultCrossing.tsx` only.

- `Obstacle` / `Consultant` carry `slug`; `buildObstacles` copies it through.
- Collision uses `.find` instead of `.some`; on the fatal hit the struck
  consultant `{ name, slug }` is stored in a `culprit` state (cleared in
  `start()`).
- Game-over block gains a line above the "Ski or Die" line: "Du mötte
  &lt;name&gt; på väg till kaffemaskinen.", the name an `Anchor component={Link}`
  to `/vilka-ar-vi/<slug>`. The two lines sit in a centered `Stack`.

`npm run lint` + `npm run build` must pass. Browser check is the user's.
