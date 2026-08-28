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

- `app/vilka-ar-vi/sandra/DoodlePortrait.tsx` — new client component
  (`"use client"`), same pattern as `mattias/StarField.tsx`: keeps
  `sandra/page.tsx` a server component so `metadata` still works.
- `app/vilka-ar-vi/sandra/page.tsx` — swap the plain photo `Card` for
  `<DoodlePortrait />`.

## How it works

1. Original photo renders untouched (Mantine `Image`, `fit="cover"`, same
   358×460 crop as now).
2. An absolutely-positioned `<svg>` overlay sits on top, `overflow: visible`,
   `pointer-events: none` on everything except the hover/tap target, sized
   with headroom on all sides so horns/crown can render past the photo's
   edges without affecting page layout/scroll (bleed is a fixed % of the
   photo box, not unbounded).
3. On first hover (desktop) or tap (touch, detected via
   `matchMedia("(hover: hover)")`), lazy-loads `FaceLandmarker` from
   `@mediapipe/tasks-vision`, runs it once against the `<img>`, caches the
   478 landmarks in a ref. Later hovers reuse the cached result.
4. Maps a handful of landmark indices (eyes, nose tip, mouth corners,
   forehead, jaw edges — standard MediaPipe face-mesh indices) to anchor
   points for whichever doodle is selected, converts normalized coordinates
   to the photo's rendered box.
5. Draws the doodle's SVG path with the classic stroke-dasharray /
   dashoffset reveal technique, animated with the Web Animations API. A
   small pen glyph rides along the path via `getPointAtLength` with a
   little jitter so it doesn't look mechanical. Pen + doodle fade out on
   mouse-leave / second tap.
6. Color: samples average luminance off a small offscreen canvas draw of
   the photo → neon-green (`#39FF14`, subtle glow) on dark, black on light.
   Overridable via a `color` prop.
7. If the model fails to load or finds no face (timeout-guarded), falls
   back to fixed relative positions instead of throwing.
8. `prefers-reduced-motion`: doodle appears instantly, no draw animation —
   matches the `StarField.tsx` convention already in the repo.

## Doodles

Curated set for now: `mustache`, `horns`, `crown`, `sunglasses`, plus
`random` (picks one, stable per page load — not re-rolled on every hover).
Hand-wobbled paths, not perfect geometry, per the "handritad" brief.

## Verify

`npm run lint`, `npm run build`. `npm test` doesn't exist yet.
