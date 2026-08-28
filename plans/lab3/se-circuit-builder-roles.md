# Re-evaluating the role → component mapping

## The ask

Evaluate `SLUG_TO_KIND` in `componentKinds.ts`. Specifically: `wire` feels
like an empty, personality-less mapping for the fullstack generalists. Sara
should map to whoever represents "the grounded person in the office keeping
things from turning into chaos, not a battery." Given that, who else should
be battery — and should battery get its own section in the palette rather
than sitting in the grid like every other kind?

## Current mapping, and what's actually wrong with it

| Kind | People | Description |
|---|---|---|
| battery | sara | "Kretsens strömkälla." |
| resistor | daniel, shane, christopher | "Stabiliserar flödet." |
| wire | gunnar, mattias, anton | "Arbetar i hela kedjan och får allt att fungera." |
| capacitor | jonathan, james | "Lagrar och buffrar." |
| switch | olle, henrik | "Styr och grindar flödet." |
| led | sandra | "Det synliga resultatet." |
| ground | *(nobody)* | "En neutral punkt att koppla kretsen mot." |

`resistor` (architecture/senior stabilizing the design), `capacitor`
(backend persisting state), `switch` (coaching/project leadership gating
work), and `led` (UX as the visible output) all hold up — real correspondence
between what a resistor/capacitor/switch/LED *does* and what that role does
on a team. `wire` doesn't: a wire has no behavior of its own, it just
conducts — which is exactly why it reads as "empty" once you sit with it.
Mapping the fullstack generalists there under-sells them; "gets everything to
function" (the wire description) is actually a description of *drive*, not
of passive conduction.

## The reframe: `sara` → ground, fullstack → battery, `wire` → nobody

**`ground` fits Sara exactly**, and better than `battery` did — the existing
ground description, written before this conversation, already says "a
neutral point to tie the circuit to." That's the CEO keeping the office
stable and un-chaotic, not the CEO powering it. It's also a clean pun in
Swedish (`jord` = both electrical ground and "grounded, down-to-earth")
that's currently sitting unused since no one is mapped to `ground` today.

**The fullstack generalists (`gunnar`, `mattias`, `anton`) fit `battery`
better than anyone else fits it.** The wire description already says it —
"works across the whole chain and gets everything to function" is a battery
description that's been mislabeled. They're the ones who touch every part of
a delivery and keep it moving; that's motive force, not passive wiring. The
simulator already supports multiple batteries anywhere on the board (see the
comment in `graph.ts`), so three people sharing `battery` isn't a stretch —
it's the same design multi-battery support was built for.

**`wire` keeps no one.** This is the fix for "wire feels empty" — instead of
propping it up with a person it doesn't suit, let it be what a wire actually
is: the plain, un-authored connection you drag between the roles that do
have identity. `ground` already worked with zero people mapped to it (still
draggable as a bare kind); `wire` moves into that same category. Every kind
keeps at least one *real* behavior in the metaphor; only the ones with no
behavior of their own go unstaffed.

Net effect: **`daniel`/`shane`/`christopher` (resistor), `jonathan`/`james`
(capacitor), `olle`/`henrik` (switch), `sandra` (led) are unchanged.**

## Updated descriptions

```
battery: "Får igång kretsen och håller allt i rörelse."
ground:  "En neutral punkt att koppla kretsen mot — håller allt stabilt, inga kaos."
wire:    "Den rena kopplingen — ingen egen roll, bara det som binder ihop kretsen."
```

(Resistor/capacitor/switch/led descriptions stay as they are.)

## "Should battery be its own section?"

Yes — worth doing regardless of the reassignment above, on its own merits.
Battery is the one kind every winning loop *requires* (per `evaluateCircuit`,
alongside an indicator); visually flattening it into the same `SimpleGrid` as
six other equally-weighted cards buries that. Concretely: pull the Battery
card out of the `KIND_ORDER` grid loop in `Palette.tsx` and render it above
the grid, full-width, visually marked as the starting point (e.g. a `sprout`
top border or a small "börja här" cue) — the other six kinds keep their
current grid treatment unchanged.

## Files touched (once accepted)

- `componentKinds.ts`: `SLUG_TO_KIND` (`sara`→`ground`, `gunnar`/`mattias`/
  `anton`→`battery`), the three updated `KIND_DESCRIPTIONS` entries above,
  and `KIND_ORDER` reordered so `battery` is first (it's about to be pulled
  out of the loop, but keeping the list's own ordering honest costs nothing).
- `Palette.tsx`: split rendering — one dedicated battery card above a
  `SimpleGrid` of the remaining six kinds.

No changes needed in `graph.ts`/`Board.tsx` — `ground` and multi-`battery`
support already exist; this is purely a re-labeling plus one layout change.

## Verification

```bash
npm run lint
npm run build
```
Then in-browser: Sara now appears under Ground in the palette (and the
existing polarity/flip logic is unaffected — ground has no polarity);
Gunnar/Mattias/Anton appear under a standalone Battery section above the
grid; Wire's badge is still draggable with no avatars under it; a circuit
built with Sara-as-ground instead of Sara-as-battery still needs a real
battery + LED to win, same rule as before.
