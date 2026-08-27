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
