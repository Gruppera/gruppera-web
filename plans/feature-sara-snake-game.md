# Sara Snake Game — "Vilka är vi" easter egg

## Context
On the "Vilka är vi" page (consultant roster), clicking Sara's card should open a
Snake minigame where the snake eats the faces (portrait photos) of the other 10
consultants. Fun easter egg, no new dependency, reuses existing consultant data
and Mantine components already in the project.

## Data / files already confirmed
- Page: `app/vilka-ar-vi/page.tsx` → renders `ConsultantGrid` from
  `features/consultants/components/ConsultantGrid.tsx` (already `"use client"`).
- `Consultant` type: `{ name, about, focus, photo }` (no id — name/photo are identity).
- `app/mockdata.json` has 11 consultants incl. Sara (`photo: "sara.png"`). Other 10:
  Daniel, Gunnar, Jonathan, Mattias, Olle, Shane, Anton, Christopher, Henrik, James.
  All photos exist at `public/photos/<name>.png`, served as `/photos/<file>`.
- No canvas/game library installed — build with raw `<canvas>` + `requestAnimationFrame`,
  no new dependency (AGENTS.md forbids adding deps without asking).
- No existing Mantine `Modal` usage yet — this introduces the first one (already in
  `@mantine/core`, not a new dep). `useDisclosure` from `@mantine/hooks` for open state.
- Reference pattern for imperative client rendering: `features/location/components/MapboxMap.tsx`
  (`useRef`+`useEffect` mount/cleanup).
- Brand tokens for styling: GRAFITE `#0D0D0C` bg, CHAMONIX `#EEEDEB` text,
  SPROUT `#95B354` snake body/accent, MOSS `#757263` grid lines, CLOUD `#C3CED9` border.

## New feature folder: `features/snake-game/`
```
features/snake-game/
  components/
    SnakeGameModal.tsx   - Mantine Modal wrapper; header w/ score, canvas, win/lose
                            overlay, "Spela igen"/close buttons
    SnakeCanvas.tsx       - "use client"; owns <canvas> ref, wires useSnakeGame, draws
  hooks/
    useSnakeGame.ts       - game engine: state refs, keyboard listeners, rAF loop w/
                            tick-accumulator throttle, collision + food-eating logic,
                            returns { status, score, start, restart }
  constants.ts             - GRID_SIZE, CELL_PX, TICK_MS, color hex constants
  types.ts                 - Position, Direction, GameStatus, FoodItem
  utils.ts                 - getRandomEmptyCell, detectCollision, buildFoodQueue (shuffle)
```

## Engine design
- Logical grid (e.g. 20x20), canvas ~480x480px, fits in Modal on mobile/desktop.
- Snake state in refs (avoid rAF stale-closure issues); score/status mirrored to React
  state only for UI re-renders.
- Direction buffered per tick, reject same-tick 180° reversal.
- rAF loop throttled to `TICK_MS` via timestamp diff (not `setInterval`), draws every
  frame for smoothness, advances logic only on tick.
- Food = one consultant at a time from a shuffled queue of the other 10; on eat,
  score++, spawn next (or `status = 'won'` when queue empty); snake grows (no tail pop).
- Collision (wall or self) → `status = 'lost'`.
- Preload each food consultant's photo via `new Image()` once on mount; draw with
  `ctx.drawImage` per cell.
- Cleanup: `cancelAnimationFrame` + remove `keydown` listener on unmount — rely on
  Mantine Modal's default unmount-on-close (don't use `keepMounted`) so this fires
  automatically when the modal closes. Guard draw calls if canvas ref is null.

## Wiring into `ConsultantGrid.tsx`
- Add `useDisclosure()` once at grid level; render `<SnakeGameModal opened onClose
  foodConsultants={consultants.filter(c => c.name !== "Sara")} />` once (not per-card).
- In `ConsultantCard`, add `const isSara = consultant.name === "Sara"` (string-compare
  fragility noted inline as a comment — no id field exists in the data model) and
  conditionally make the card clickable/keyboard-accessible (`onClick`, `role="button"`,
  `tabIndex`, `onKeyDown`, pointer cursor + hover affordance) only for Sara, calling
  `open()`. Other cards stay inert.

## Styling
- Canvas drawing uses raw hex constants (canvas can't read CSS vars) matching brand
  tokens; Modal/Box chrome uses Mantine theme vars like `MapboxMap.tsx` does.

## Verification
- New branch, e.g. `feature/sara-snake-game`.
- `npm run lint`, `npm run build` (no test runner exists yet — skip tests).
- Manual: open `/vilka-ar-vi`, click Sara's card, play with arrow keys/WASD, eat all
  10 faces (win), separately trigger wall/self collision (loss), confirm restart works,
  confirm closing mid-game and reopening resets cleanly, no console warnings about
  state updates after unmount.
- PR via `gh pr create`; never merge, never push to org repo, only to fork.

## Files to create/modify
- `features/consultants/components/ConsultantGrid.tsx` (modify)
- `features/snake-game/hooks/useSnakeGame.ts` (new)
- `features/snake-game/components/SnakeCanvas.tsx` (new)
- `features/snake-game/components/SnakeGameModal.tsx` (new)
- `features/snake-game/constants.ts`, `types.ts`, `utils.ts` (new)
