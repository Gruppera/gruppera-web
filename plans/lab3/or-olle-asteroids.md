# Olle's page: Asteroids clone with photo meteors

Branch: `lab3/or-olle-asteroids`, on top of the current tip of
`lab3/or-consultant-scaffolding` (which already contains the merged scaffolding
+ Olle's bio-style page from PR #4).

Replaces the "yours to design" section of `app/vilka-ar-vi/olle/page.tsx`
(currently: "Vad jag gör" / "Roller jag trivs i" text) with a playable
Asteroids clone. The three fixed parts of the page (shell, identity block,
photo, `ConsultantPeers` at the end) stay untouched.

## Scope

A classic Asteroids clone, canvas-based, no game library (avoids the
"no new dependencies without asking" rule):

- **Ship**: triangle, rotates left/right, thrusts forward, wraps at screen
  edges, drifts with momentum (no instant stop).
- **Meteors**: circles textured with `/photos/olle.png` (drawn via
  `ctx.drawImage` clipped to a circle) instead of plain rocks. Large meteors
  drift in random directions; hitting one splits it into two smaller meteors
  (large → medium → small → destroyed), each keeping the photo texture.
- **Shooting**: spacebar fires bullets from the ship's nose; bullets expire
  after a short lifetime.
- **Collisions**: bullet-meteor destroys/splits the meteor and adds score;
  ship-meteor costs a life and respawns the ship after a brief invulnerability
  flash; 0 lives → game over screen with score and a restart button.
- **Controls**: arrow keys / WASD + space on desktop. Simple on-screen touch
  buttons (rotate left/right, thrust, fire) for mobile, so the page still
  holds up at mobile width per the pre-PR checklist — full play is keyboard-
  first, touch is a basic accommodation, not a polished mobile control scheme.
- **HUD**: score and lives, rendered as plain canvas text or an overlay
  `Text`/`Group` — whichever is simpler to keep in sync with game state.

## Implementation

- New client component `features/consultants/components/AsteroidsGame.tsx`
  (`"use client"` — genuine state/effects/event handlers: `requestAnimationFrame`
  loop, keyboard/touch listeners, canvas ref). Reason will be noted in the PR
  per the "say why" rule.
- Game loop driven by `requestAnimationFrame` inside a `useEffect`, cleaned up
  on unmount. All game state (ship position/velocity/angle, meteors, bullets,
  score, lives) lives in refs/local closures inside the effect, not React
  state, to avoid re-render overhead — only score/lives/game-over surface to
  React state for the HUD.
- Canvas sized responsively via `ResizeObserver` or a fixed aspect-ratio box
  (e.g. 4:3) that scales with `Container size="lg"`, consistent with brand
  tokens for surrounding chrome (`Box`/`Card` wrapper, `sprout` for accents).
- `app/vilka-ar-vi/olle/page.tsx`: swap the "Vad jag gör"/"Roller jag trivs i"
  stacks for `<AsteroidsGame />` between the photo and `ConsultantPeers`.
- No new dependencies.

## Verification

```bash
npm run lint
npm run build
```

Then check in the browser: ship control feels right (rotate/thrust/wrap),
shooting splits meteors down to destruction, score/lives update, game over
and restart work, meteors visibly show the photo texture, no console errors,
holds up at mobile width (touch buttons work, canvas doesn't overflow).

`npm test` still doesn't exist — will say so rather than claiming otherwise.

## Push target

Same pattern as the two earlier fixes: push straight to
`lab3/or-consultant-scaffolding` (updates the still-open PR #5 chain) rather
than opening a new PR, since this branch is a direct continuation of Olle's
page and PR #5 already carries that history. Will confirm with the user before
pushing, since PR #5 is mid-review.
