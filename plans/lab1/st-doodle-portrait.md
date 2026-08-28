# Doodle portrait — hover-drawn doodles on Sandra's photo

Scoped to `app/vilka-ar-vi/sandra/` only, per Sandra: not building this as a
reusable cross-portrait system right now — she's testing it on her own page.
No shared files touched.

## New dependency

`@mediapipe/tasks-vision` — client-side face landmark detection (WASM, runs
in the browser). The photo itself never leaves the browser; only the model
file + WASM binary are fetched from Google's CDN on first use (same trust
boundary as loading a web font). Confirmed with Sandra before installing.

## Files

- `app/vilka-ar-vi/sandra/DoodlePortrait.tsx` — client component
  (`"use client"`), keeps `sandra/page.tsx` a server component so `metadata`
  still works.
- `app/vilka-ar-vi/sandra/page.tsx` — uses `<DoodlePortrait />` in place of a
  plain photo.

## How it works (shipped, PR #25/#30)

1. Photo renders untouched (Mantine `Card` + `AspectRatio` + `Image
   fit="cover"`, 358×460 crop).
2. An absolutely-positioned `<svg overflow="visible">` overlay sits on top,
   `pointer-events: none`, sized with headroom so doodles can bleed past the
   photo's edges without affecting page layout/scroll.
3. On first hover (desktop) or tap (touch), lazy-loads `FaceLandmarker`,
   runs it once against the `<img>`, caches landmarks in state. Later hovers
   reuse the cached result but re-run the draw sequence from scratch.
4. A handful of landmark indices (eyes, nose, mouth, forehead, chin, face
   edges) become anchor points; every doodle piece is authored in
   "eye-distance units" around a piece-specific origin, rotated to the
   face's tilt via `place()`.
5. Pieces draw one at a time — a single pen, never two strokes moving at
   once — via `stroke-dasharray`/`dashoffset` + `getPointAtLength` for the
   pen-follows-line effect. Small deterministic wobble (`seededWobble`) plus
   an `feTurbulence`/`feDisplacementMap` filter on the whole group gives the
   hand-sketched, slightly-3D look (dark subtle outline + drop-shadow).
6. Ink is fixed white (`#fdfdfd`) with a dark outline underneath — chosen
   because it reads reliably against the photo regardless of what's behind
   it, replacing an earlier luminance-sampled approach.
7. `doodle="random"` re-rolls the theme (excluding the immediately previous
   one) on every fresh hover, so repeated hovers actually show variety.
8. `prefers-reduced-motion`: doodle appears instantly, no draw animation.
9. If face detection fails/times out, falls back to fixed relative
   positions instead of throwing.

## Themes — replacing the current set (old/cool/devil/angel → these 3)

The old placeholder themes (gamling/rynkor, cool/solglasögon, djävul/horn,
ängel/gloria) are removed entirely, along with their now-unused pieces
(`horns`, `crown`, `wrinkles`, `halo`, `grumpy`). `mustache`, `goatee`, and
the sunglasses lens shape survive, reused by the new themes below.
`doodle="random"` on Sandra's page now rotates only between these 3.

### 🏴‍☠️ PIRAT
- **Pieces**: `eyepatch` (new — covers one eye, strap line across to the
  other side of the head), `mustache` (existing), `goatee`/pipskägg
  (existing).
- **Word**: "AARGH!" hand-drawn beside the face, drawn as the last piece.

### 💰 BOSS
- **Pieces**: `bossGlasses` (new — the existing sunglasses lens shape,
  scaled up), `goldChain` (new — necklace arc below the chin with a few
  bead dots + a small pendant), `cigarSmoke` (new — a short cigar at the
  mouth corner with two curling smoke strokes above it), `stars` (new — a
  few small decorative star shapes scattered near the temples/shoulders,
  positioned clear of the word).
- **Word**: "BOSS" hand-drawn beside the face, drawn as the last piece.

### 🤓 UTVECKLAREN
- **Pieces**: `nerdGlasses` (new — big round outlined frames, bigger and
  rounder than the sunglasses lens), `headphones` (new — a band arcing over
  the top of the head into two ear-cup circles near the face edges),
  `techNoise` (new — a handful of small hand-drawn `{ }`, `< >`, `/`, `0`,
  `1` marks scattered around the face as background "digital noise").
- **Word**: "404" hand-drawn beside the face, drawn as the last piece.

## Hand-drawn word rendering (new)

Words are drawn with the exact same pen/pieces mechanism as everything
else — each letter is one more `Stroke`, so it's just more entries in the
existing sequential pen animation, no new animation logic needed.

A small hand-sketched glyph set is hardcoded (monoline, straight-line/simple-
curve polylines in a 0–1 unit box per glyph — the wobble + turbulence filter
already applied to every stroke gives it the sketchy feel, so the glyphs
themselves can stay simple). Only the glyphs actually needed are built:
`A B G H O R S ! 4 0` for the three words, plus `{ } < > / 1` for the
UTVECKLAREN background noise.

A `wordStrokes(word, lm, eyeDist, angle)` helper lays letters left-to-right
at a fixed size (~0.4× eye-distance per letter) anchored beside the head
(upper-right, in the SVG's existing bleed area — same region horns/crown
used to bleed into), through the same `place()` rotation as every other
piece.

## New anchor points

No new MediaPipe landmarks needed — `goldChain`, `cigarSmoke`, `eyepatch`,
and `headphones` derive their origins from the existing `chin`, `mouthLeft/
mouthRight`, `faceLeft/faceRight`, and `forehead` points already in
`Landmarks`, the same way `goatee` and `wrinkles` already do.

## Verify

- Playwright against `npm run dev`: hover repeatedly, confirm all 3 themes
  render, each piece is anchored correctly on the face (glasses centered on
  eyes, chain below chin, patch over one eye, headphones over the head,
  word legible and clear of the face/other pieces), reduced-motion still
  works, no console errors.
- `npm run lint`, `npm run build`. `npm test` doesn't exist yet.
