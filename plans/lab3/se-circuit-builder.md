# Circuit builder: flippable components, real polarity, a real palette grid, new heading

## Scope

Four asks, in the order they were raised:

1. Components can be flipped (reversed), and the sim should decide whether it's
   more logical to animate **current** or **voltage** moving through the
   circuit.
2. It should behave like a real circuit: closing a loop that's missing a
   specific required component (or has one wired backwards) tells you what's
   missing/wrong, not just "not done yet".
3. A better grid for the component library (`Palette.tsx`).
4. Replace the page heading "Sara bygger en krets" with something else.

## 1. Flippable components

**Decision: animate current, not voltage.** Voltage is a potential
*difference between two points* — it doesn't travel down a wire, so there's
nothing to animate along an edge. Current is a flow, which is exactly what
the existing dashed `circuit-flow` animation in `Board.tsx` already depicts.
The only change needed is that flow direction currently isn't derived from
anything (it's just a static dash animation on every energized edge) — once
components can be flipped, direction has to come from the battery's
orientation, so the animation should visibly reverse when a battery is
flipped.

**Which components actually have polarity:**

- `battery` — yes, current leaves `+` and returns to `−`.
- `led` — yes, real LEDs are diodes: current only flows anode → cathode. This
  is the one place "flipped" isn't just cosmetic — a backwards LED in an
  otherwise-complete loop should *not* light, same as a real one.
- `resistor`, `wire`, `capacitor`, `switch`, `ground` — symmetric. Flipping
  them is visual/layout freedom only (handy since a piece placed against the
  natural grid direction can look backwards), with no effect on
  `evaluateCircuit`.

**Data model** (`graph.ts`): add `flipped?: boolean` to `PlacedPiece`. Rather
than swapping `from`/`to` on toggle (which would perturb `edgeId` bookkeeping
elsewhere), `flipped` just reinterprets which end is `+`/anode for direction
purposes — `from` is treated as the "natural" terminal, `to` as its reverse,
and `flipped` swaps which is which.

**Interaction** (`Board.tsx`): pieces are already clickable (switches toggle,
others remove). Flipping needs its own gesture so it doesn't collide with
those. Simplest: a small flip affordance on hover/focus — a tiny rotate icon
rendered at the piece's midpoint — click removes ambiguity with the existing
remove/toggle click. Keyboard: same control is a real button (not a bare
`onClick` on the SVG), so it's reachable without drag/drop, consistent with
the "no game-gated links" accessibility spirit already in this file.

**Direction + animation:** once a winning loop is found, walk its pieces from
the battery's `+` terminal (starting node determined by `flipped`) around the
loop via the adjacency already built in `buildComponents`, assigning a
consistent traversal direction to every edge in that loop. `Board.tsx` uses
that per-edge direction to decide which way the dashed line's endpoints run
(swap `x1`/`x2` accordingly) instead of always drawing left-to-right /
top-to-bottom.

**Scope call-out:** if a loop contains two batteries in opposing orientation,
real circuit theory would net their EMFs; this toy will not model that —
direction is simply taken from the first battery encountered in the loop
walk. Worth one line in the PR description, not worth building.

## 2. Real behavior when the loop is missing something (or wired backwards)

`evaluateCircuit` (`graph.ts`) already special-cases "closed loop, no LED" and
"closed loop, no battery" with tailored hints — that part is done and stays.
What's missing is the polarity case this task introduces:

- A loop that has a cycle, a battery, and an LED, but the LED is flipped
  backwards relative to the battery's current direction, should **not**
  count as won, and should say so specifically: something like *"Lysdioden
  sitter åt fel håll — vänd den så strömmen kan passera."* (naming the
  consultant if the LED has one, matching the existing "who" phrasing used
  for open switches).
- Direction-checking the LED requires knowing current direction through that
  edge, which only exists once part 1's loop-walk is in place — these two
  land together, the polarity check is what the loop-walk is *for*.

No change to the battery-missing / LED-missing / switch-open hint text or
priority order; the backwards-LED check slots in alongside them (checked
after "closed + battery + LED are all present", before declaring a win).

## 3. A real grid for the component library

`Palette.tsx` today is a `Stack` of `Group`s that wrap ad hoc — not a grid.
Replace with:

- Each `ComponentKind` becomes a `Card` (schematic-colored top border or
  small `Symbol`-style swatch, label, description) laid out in a responsive
  `SimpleGrid` (e.g. `cols={{ base: 1, sm: 2, lg: 3 }}`) instead of a full-
  width stack — this is the actual "library" read the ask wants.
- Inside each kind's card, the consultant avatars move from a wrapping
  `Group` to a small `SimpleGrid` (`cols={{ base: 4, xs: 5 }}` or similar) so
  they align instead of ragged-wrapping.
- Keep existing behavior unchanged: drag source on the kind badge, drag
  source on each unused avatar, used/unlocked opacity and link states, hover
  titles.
- Brand tokens only, per `CLAUDE.md` — cards use `chamonix`/`cloud` surfaces,
  not new colors.

## 4. New heading

Drop "Sara bygger en krets" — per `CLAUDE.md` this page is Sara's *view of
Gruppera*, not a task description. Proposing (will confirm final wording with
Sara before implementing):

- **"Gruppera är en sluten krets"** (favored — states the metaphor as a claim
  about the company, not the page)
- "Kretsen som är Gruppera"
- "Alla behövs för att sluta kretsen"

Whichever is chosen, it's still fixed-point-4 territory (the consultant-page
contract's rule 4: somewhere it must be clear whose view this is) — the
byline/signature elsewhere on the page already covers that, so the heading
itself is free to be the metaphor line rather than "Sara …".

## Implementation order

1. `grid.ts`/`graph.ts`: add `flipped`, loop-direction walk, LED polarity
   check + hint text.
2. `Board.tsx`: flip control, direction-aware dash animation, symbol mirroring
   for a flipped piece.
3. `Palette.tsx`: `SimpleGrid` rework.
4. `page.tsx`: heading swap.

## Verification

```bash
npm run lint
npm run build
```

Then in-browser: place a battery + LED backwards → get the new "flipped"
hint; flip the LED → circuit lights and the flow animation runs the right
direction; flip a wire/resistor/etc. → no behavior change, just orientation;
palette reads as a grid at desktop and mobile widths; reduced-motion still
stops the flow animation; no console errors.

`npm test` still doesn't exist in this repo — will say so, not claim tests
passed.
