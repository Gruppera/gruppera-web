"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { FaceLandmarker as FaceLandmarkerType } from "@mediapipe/tasks-vision";
import { AspectRatio, Box, Card, CardSection, Image } from "@mantine/core";

type BasePiece =
  | "mustache"
  | "goatee"
  | "eyepatch"
  | "bossGlasses"
  | "goldChain"
  | "cigarSmoke"
  | "stars"
  | "nerdGlasses"
  | "headphones"
  | "techNoise"
  | "wordBoss"
  | "wordPirate"
  | "wordDev";
type ThemeKind = "pirate" | "boss" | "developer";
type DoodleKind = BasePiece | ThemeKind | "random";

type DoodlePortraitProps = {
  src: string;
  alt: string;
  doodle?: DoodleKind;
  /** ratio width/height, e.g. 358/460 */
  ratio?: number;
  /** override the auto-detected stroke colour */
  color?: string;
};

type Point = { x: number; y: number };

type Landmarks = {
  leftEye: Point;
  rightEye: Point;
  noseTip: Point;
  mouthLeft: Point;
  mouthRight: Point;
  mouthTop: Point;
  forehead: Point;
  chin: Point;
  faceLeft: Point;
  faceRight: Point;
};

// Standard MediaPipe FaceLandmarker mesh indices (468/478-point model).
const LANDMARK_INDEX = {
  leftEyeOuter: 33,
  leftEyeInner: 133,
  rightEyeOuter: 263,
  rightEyeInner: 362,
  noseTip: 1,
  mouthLeft: 61,
  mouthRight: 291,
  mouthTop: 13,
  forehead: 10,
  chin: 152,
  faceLeft: 234,
  faceRight: 454,
} as const;

const CDN_VERSION = "1.0.1";
const WASM_BASE = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${CDN_VERSION}/wasm`;
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

let landmarkerPromise: Promise<FaceLandmarkerType> | null = null;

function getLandmarker(): Promise<FaceLandmarkerType> {
  if (!landmarkerPromise) {
    landmarkerPromise = import("@mediapipe/tasks-vision").then(
      async ({ FaceLandmarker, FilesetResolver }) => {
        const fileset = await FilesetResolver.forVisionTasks(WASM_BASE);
        return FaceLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
          runningMode: "IMAGE",
          numFaces: 1,
        });
      },
    );
  }
  return landmarkerPromise;
}

// Maps a normalised (0–1) point from the photo's *natural* pixel space into
// the rendered box's pixel space, accounting for object-fit: cover cropping
// (center crop — the default) so doodles track the face even when the
// photo's aspect ratio doesn't match the crop.
function mapCoverPoint(
  nx: number,
  ny: number,
  naturalW: number,
  naturalH: number,
  boxW: number,
  boxH: number,
): Point {
  const boxAspect = boxW / boxH;
  const naturalAspect = naturalW / naturalH;
  const scale =
    naturalAspect > boxAspect ? boxH / naturalH : boxW / naturalW;
  const renderedW = naturalW * scale;
  const renderedH = naturalH * scale;
  const offsetX = (renderedW - boxW) / 2;
  const offsetY = (renderedH - boxH) / 2;
  return { x: nx * renderedW - offsetX, y: ny * renderedH - offsetY };
}

// Deterministic small jitter so the same doodle wobbles the same way every
// time it's drawn, instead of looking hand-shaky-random on every hover.
function seededWobble(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1; // -1..1
}

function place(local: [number, number], origin: Point, scale: number, angle: number): Point {
  const [lx, ly] = local;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const rx = lx * cos - ly * sin;
  const ry = lx * sin + ly * cos;
  return { x: origin.x + rx * scale, y: origin.y + ry * scale };
}

function fmt(p: Point): string {
  return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
}

type Stroke = {
  d: string;
  extraDots?: Point[];
  fast?: boolean;
  /** Solid fill (e.g. sunglasses lenses, an eyepatch) instead of outline-only. */
  fillColor?: string;
  /** Overrides the doodle's ink colour for just this stroke (e.g. gold chain links). */
  inkColor?: string;
};

// A small circle path, used for chain links and other round filled bits —
// centered on `origin`, radius in eye-distance units.
function circlePath(origin: Point, r: number, eyeDist: number, angle: number): string {
  const p = (local: [number, number]) => fmt(place(local, origin, eyeDist * r, angle));
  return [
    `M ${p([1, 0])}`,
    `C ${p([1, 0.55])} ${p([0.55, 1])} ${p([0, 1])}`,
    `C ${p([-0.55, 1])} ${p([-1, 0.55])} ${p([-1, 0])}`,
    `C ${p([-1, -0.55])} ${p([-0.55, -1])} ${p([0, -1])}`,
    `C ${p([0.55, -1])} ${p([1, -0.55])} ${p([1, 0])}`,
    "Z",
  ].join(" ");
}

// A tiny hand-sketched monoline font — only the glyphs the three theme
// words actually need. Each glyph is one or more strokes, authored as
// straight-line polylines in a 0–1 (left-right, top-bottom) unit box; the
// per-point wobble + the shared feTurbulence filter are what make them read
// as hand-drawn, so the underlying shapes stay simple on purpose.
const GLYPHS: Record<string, [number, number][][]> = {
  A: [
    [[0, 1], [0.5, 0]],
    [[0.5, 0], [1, 1]],
    [[0.22, 0.62], [0.78, 0.62]],
  ],
  B: [
    [[0, 1], [0, 0], [0.55, 0], [0.7, 0.12], [0.7, 0.38], [0.55, 0.5], [0, 0.5]],
    [[0, 0.5], [0.6, 0.5], [0.78, 0.65], [0.78, 0.88], [0.6, 1], [0, 1]],
  ],
  G: [
    [[0.85, 0.22], [0.6, 0.02], [0.3, 0.02], [0.08, 0.25], [0.08, 0.75], [0.3, 0.98], [0.65, 0.98], [0.85, 0.8], [0.85, 0.55], [0.5, 0.55]],
  ],
  H: [
    [[0, 0], [0, 1]],
    [[1, 0], [1, 1]],
    [[0, 0.52], [1, 0.52]],
  ],
  O: [
    [[0.5, 0], [0.82, 0.15], [1, 0.5], [0.82, 0.85], [0.5, 1], [0.18, 0.85], [0, 0.5], [0.18, 0.15], [0.5, 0]],
  ],
  R: [
    [[0, 1], [0, 0], [0.55, 0], [0.72, 0.14], [0.72, 0.4], [0.55, 0.52], [0, 0.52]],
    [[0.32, 0.52], [0.85, 1]],
  ],
  S: [
    [[0.88, 0.18], [0.55, 0], [0.2, 0.05], [0.06, 0.25], [0.15, 0.42], [0.55, 0.5], [0.9, 0.62], [0.95, 0.82], [0.75, 0.98], [0.35, 0.98], [0.08, 0.82]],
  ],
  "!": [
    [[0.5, 0], [0.46, 0.68]],
    [[0.44, 0.85], [0.56, 0.85], [0.56, 0.97], [0.44, 0.97], [0.44, 0.85]],
  ],
  "4": [
    [[0.68, 0], [0.02, 0.65], [1, 0.65]],
    [[0.7, 0], [0.7, 1]],
  ],
  "0": [
    [[0.5, 0], [0.82, 0.15], [1, 0.5], [0.82, 0.85], [0.5, 1], [0.18, 0.85], [0, 0.5], [0.18, 0.15], [0.5, 0]],
    [[0.32, 0.78], [0.68, 0.2]],
  ],
  "1": [
    [[0.25, 0.18], [0.5, 0], [0.5, 1]],
    [[0.25, 1], [0.75, 1]],
  ],
  "{": [
    [[0.7, 0], [0.4, 0.14], [0.4, 0.4], [0.15, 0.5], [0.4, 0.6], [0.4, 0.86], [0.7, 1]],
  ],
  "}": [
    [[0.3, 0], [0.6, 0.14], [0.6, 0.4], [0.85, 0.5], [0.6, 0.6], [0.6, 0.86], [0.3, 1]],
  ],
  "<": [
    [[0.75, 0.1], [0.2, 0.5], [0.75, 0.9]],
  ],
  ">": [
    [[0.25, 0.1], [0.8, 0.5], [0.25, 0.9]],
  ],
  "/": [
    [[0.15, 1], [0.85, 0]],
  ],
};

// Lays a word out left-to-right, centered under `origin`, in eye-distance
// units — same `place()` rotation every other piece uses, so it tilts with
// the head. Each glyph stroke becomes its own `fast` pen-stroke: a word is
// "drawn" the same way as everything else, just quickly, like handwriting
// rather than a careful sketch.
function wordStrokes(
  word: string,
  lm: Landmarks,
  eyeDist: number,
  angle: number,
  // How far below the chin the word starts, in eye-distance units — tuned
  // per theme so it clears whatever else that theme already draws down
  // there (a gold chain, a goatee) while staying inside the small gap
  // before the "Fler konsulter" section below the photo.
  baseYOffset = 0.5,
): Stroke[] {
  const origin: Point = { x: (lm.faceLeft.x + lm.faceRight.x) / 2, y: lm.chin.y };
  const letterW = 0.13;
  const gap = 0.035;
  const letterH = 0.18;
  const baseY = baseYOffset;
  const totalW = word.length * letterW + (word.length - 1) * gap;
  const w = (n: number, seed: number) => n + seededWobble(seed) * 0.025;
  const p = (local: [number, number]) => fmt(place(local, origin, eyeDist, angle));

  const strokes: Stroke[] = [];
  let cursor = -totalW / 2;
  for (let ci = 0; ci < word.length; ci++) {
    const glyph = GLYPHS[word[ci]];
    if (glyph) {
      for (let si = 0; si < glyph.length; si++) {
        const pts = glyph[si];
        const d = pts
          .map((pt, pi) => {
            const lx = cursor + w(pt[0] * letterW, ci * 30 + si * 6 + pi);
            const ly = baseY + w(pt[1] * letterH, ci * 30 + si * 6 + pi + 3);
            return `${pi === 0 ? "M" : "L"} ${p([lx, ly])}`;
          })
          .join(" ");
        strokes.push({ d, fast: true });
      }
    }
    cursor += letterW + gap;
  }
  return strokes;
}

// Small decorative marks scattered around the face — background texture,
// not anchored to a specific feature, positioned as fixed offsets from
// stable landmarks so they stay clear of the face and of each theme's word.
function scatterGlyphs(
  marks: { ch: string; origin: Point; scale: number; seed: number }[],
  eyeDist: number,
  angle: number,
): Stroke[] {
  const w = (n: number, seed: number) => n + seededWobble(seed) * 0.04;
  return marks.flatMap(({ ch, origin, scale, seed }) => {
    const glyph = GLYPHS[ch];
    if (!glyph) return [];
    return glyph.map((pts, si) => ({
      d: pts
        .map((pt, pi) => {
          const local: [number, number] = [
            w((pt[0] - 0.5) * scale * 2, seed + si * 10 + pi),
            w((pt[1] - 0.5) * scale * 2, seed + si * 10 + pi + 5),
          ];
          return `${pi === 0 ? "M" : "L"} ${fmt(place(local, origin, eyeDist, angle))}`;
        })
        .join(" "),
      fast: true,
    }));
  });
}

/**
 * Each builder returns one or more *strokes* — separate pieces drawn one
 * after another by a single pen, never simultaneously (two horns starting
 * at once read as two pens, which isn't how anyone actually draws).
 * Coordinates are authored in "eye-distance units" around a piece-specific
 * origin, then rotated/scaled into place. Every point goes through `w()`,
 * a small deterministic wobble, so the underlying geometry is already
 * slightly uneven before the feTurbulence filter (applied in the component)
 * roughens the rendered line further.
 */
const PIECE_BUILDERS: Record<BasePiece, (lm: Landmarks, eyeDist: number, angle: number) => Stroke[]> = {
  mustache: (lm, eyeDist, angle) => {
    // MediaPipe's `mouthTop` landmark sits at the inner lip line (close to
    // mouth center), not the outer edge of the upper lip, so the origin is
    // pulled up toward the nose to actually land above the lip. Scaled to
    // roughly mouth width, not a caricature.
    const origin: Point = {
      x: lm.mouthTop.x * 0.35 + lm.noseTip.x * 0.65,
      y: lm.mouthTop.y * 0.35 + lm.noseTip.y * 0.65,
    };
    const w = (n: number, seed: number) => n + seededWobble(seed) * 0.05;
    const p = (local: [number, number]) => fmt(place(local, origin, eyeDist, angle));
    return [
      {
        d: [
          `M ${p([w(-0.26, 1), w(0.02, 2)])}`,
          `C ${p([w(-0.19, 3), w(-0.1, 4)])} ${p([w(-0.08, 5), w(-0.09, 6)])} ${p([0, w(-0.01, 7)])}`,
          `C ${p([w(0.08, 8), w(-0.09, 9)])} ${p([w(0.19, 10), w(-0.1, 11)])} ${p([w(0.26, 12), w(0.02, 13)])}`,
          `C ${p([w(0.2, 14), w(0.08, 15)])} ${p([w(0.1, 16), w(0.04, 17)])} ${p([0, w(0.05, 18)])}`,
          `C ${p([w(-0.1, 19), w(0.04, 20)])} ${p([w(-0.2, 21), w(0.08, 22)])} ${p([w(-0.26, 23), w(0.02, 24)])}`,
          "Z",
        ].join(" "),
      },
    ];
  },

  goatee: (lm, eyeDist, angle) => {
    // Spans from just below the mouth down to the chin — a small pointed
    // tuft, not a full beard.
    const origin: Point = {
      x: (lm.mouthTop.x + lm.chin.x) / 2,
      y: (lm.mouthTop.y + lm.chin.y) / 2,
    };
    const w = (n: number, seed: number) => n + seededWobble(seed) * 0.06;
    const p = (local: [number, number]) => fmt(place(local, origin, eyeDist, angle));
    return [
      {
        d: [
          `M ${p([w(-0.19, 1), w(-0.4, 2)])}`,
          `C ${p([w(-0.22, 3), w(-0.05, 4)])} ${p([w(-0.13, 5), w(0.28, 6)])} ${p([w(0, 7), w(0.48, 8)])}`,
          `C ${p([w(0.13, 9), w(0.28, 10)])} ${p([w(0.22, 11), w(-0.05, 12)])} ${p([w(0.19, 13), w(-0.4, 14)])}`,
        ].join(" "),
      },
    ];
  },

  eyepatch: (lm, eyeDist, angle) => {
    // A real eyepatch just about covers the eye socket — sized to the eye
    // itself, filled solid black, strap running up and across toward the
    // opposite temple.
    const origin: Point = lm.leftEye;
    const w = (n: number, seed: number) => n + seededWobble(seed) * 0.04;
    const p = (local: [number, number]) => fmt(place(local, origin, eyeDist, angle));
    const patch: Stroke = {
      fillColor: DARK_FILL,
      d: [
        `M ${p([w(-0.2, 1), w(-0.16, 2)])}`,
        `C ${p([w(-0.22, 3), w(-0.26, 4)])} ${p([w(0.22, 5), w(-0.26, 6)])} ${p([w(0.2, 7), w(-0.16, 8)])}`,
        `C ${p([w(0.26, 9), w(0, 10)])} ${p([w(0.23, 11), w(0.2, 12)])} ${p([w(0.17, 13), w(0.22, 14)])}`,
        `C ${p([w(0, 15), w(0.26, 16)])} ${p([w(-0.17, 17), w(0.22, 18)])} ${p([w(-0.17, 19), w(0.2, 20)])}`,
        `C ${p([w(-0.26, 21), w(0.17, 22)])} ${p([w(-0.26, 23), w(-0.02, 24)])} ${p([w(-0.2, 25), w(-0.16, 26)])}`,
        "Z",
      ].join(" "),
    };
    const strap: Stroke = {
      d: [
        `M ${p([w(0.2, 30), w(-0.08, 31)])}`,
        `Q ${fmt(place([0.75, -0.35], origin, eyeDist, angle))} ${fmt({ x: lm.faceRight.x, y: lm.faceRight.y - eyeDist * 0.2 })}`,
      ].join(" "),
    };
    return [patch, strap];
  },

  bossGlasses: (lm, eyeDist, angle) => {
    // A teardrop "aviator" silhouette — clearly a different shape from the
    // round nerd-glasses frame — filled solid dark like a real tinted lens.
    const rad = eyeDist * 0.3;
    const lens = (origin: Point, side: 1 | -1, seedBase: number): Stroke => {
      const w = (n: number, seed: number) => n + seededWobble(seed) * 0.04;
      const p = (local: [number, number]) => fmt(place([local[0] * side, local[1]], origin, eyeDist, angle));
      return {
        fillColor: DARK_FILL,
        d: [
          `M ${p([w(-0.3, seedBase), w(-0.05, seedBase + 1)])}`,
          `C ${p([w(-0.32, seedBase + 2), -0.25])} ${p([w(-0.1, seedBase + 3), -0.34])} ${p([w(0.05, seedBase + 4), -0.32])}`,
          `C ${p([w(0.24, seedBase + 5), -0.3])} ${p([w(0.34, seedBase + 6), -0.15])} ${p([w(0.32, seedBase + 7), 0.05])}`,
          `C ${p([w(0.3, seedBase + 8), 0.24])} ${p([w(0.15, seedBase + 9), 0.4])} ${p([w(-0.02, seedBase + 10), 0.38])}`,
          `C ${p([w(-0.2, seedBase + 11), 0.36])} ${p([w(-0.32, seedBase + 12), 0.18])} ${p([w(-0.3, seedBase + 13), -0.05])}`,
          "Z",
        ].join(" "),
      };
    };
    const bridge: Stroke = {
      d: `M ${fmt({ x: lm.leftEye.x + rad * 0.85, y: lm.leftEye.y - rad * 0.15 })} L ${fmt({ x: lm.rightEye.x - rad * 0.85, y: lm.rightEye.y - rad * 0.15 })}`,
    };
    return [lens(lm.leftEye, 1, 1), lens(lm.rightEye, -1, 20), bridge];
  },

  goldChain: (lm, eyeDist, angle) => {
    // A row of small filled links along the collar, rather than a single
    // wavy line — reads as an actual chain instead of a squiggle.
    const origin: Point = { x: lm.chin.x, y: lm.chin.y };
    const w = (n: number, seed: number) => n + seededWobble(seed) * 0.03;
    const linkCount = 9;
    const links: Stroke[] = [];
    for (let i = 0; i < linkCount; i++) {
      const t = i / (linkCount - 1);
      const x = w(-0.55 + t * 1.1, i * 3);
      const y = w(0.16 + Math.sin(t * Math.PI) * 0.42, i * 3 + 1);
      const linkOrigin = place([x, y], origin, eyeDist, angle);
      links.push({
        d: circlePath(linkOrigin, 0.06, eyeDist, angle),
        fillColor: GOLD_FILL,
        inkColor: GOLD_INK,
        fast: true,
      });
    }
    // A slightly bigger pendant at the lowest point of the curve.
    const pendantOrigin = place([w(0, 40), w(0.58, 41)], origin, eyeDist, angle);
    links.push({
      d: circlePath(pendantOrigin, 0.1, eyeDist, angle),
      fillColor: GOLD_FILL,
      inkColor: GOLD_INK,
      fast: true,
    });
    return links;
  },

  cigarSmoke: (lm, eyeDist, angle) => {
    const origin: Point = lm.mouthRight;
    const w = (n: number, seed: number) => n + seededWobble(seed) * 0.03;
    const p = (local: [number, number]) => fmt(place(local, origin, eyeDist, angle));
    // Kept short — mouthRight already sits close to the photo's right edge,
    // so a wide/tall reach here bleeds past the card into the text column
    // next to it.
    const cigar: Stroke = {
      d: [
        `M ${p([w(0.02, 1), w(0.03, 2)])}`,
        `L ${p([w(0.26, 3), w(0, 4)])}`,
        `L ${p([w(0.32, 5), w(0.06, 6)])}`,
        `L ${p([w(0.26, 7), w(0.12, 8)])}`,
        `L ${p([w(0.02, 9), w(0.09, 10)])}`,
        "Z",
      ].join(" "),
    };
    const smokeLine = (seedBase: number, dir: 1 | -1): Stroke => ({
      d: [
        `M ${p([w(0.32, seedBase), w(0.03, seedBase + 1)])}`,
        `Q ${p([w(0.4, seedBase + 2), w(-0.1 * dir, seedBase + 3)])} ${p([w(0.32, seedBase + 4), w(-0.24, seedBase + 5)])}`,
        `Q ${p([w(0.25, seedBase + 6), w(-0.34 * dir, seedBase + 7)])} ${p([w(0.34, seedBase + 8), w(-0.44, seedBase + 9)])}`,
      ].join(" "),
      fast: true,
    });
    return [cigar, smokeLine(20, 1), smokeLine(30, -1)];
  },

  stars: (lm, eyeDist, angle) => {
    // Pushed out past the photo's edge on purpose — background texture
    // that bleeds beyond the frame, the way horns/crown used to.
    const w = (n: number, seed: number) => n + seededWobble(seed) * 0.04;
    const star = (origin: Point, scale: number, seedBase: number): Stroke => {
      const p = (local: [number, number]) => fmt(place(local, origin, eyeDist * scale, angle));
      const pts: [number, number][] = [
        [0, -0.5], [0.12, -0.12], [0.5, -0.1], [0.18, 0.12],
        [0.3, 0.5], [0, 0.25], [-0.3, 0.5], [-0.18, 0.12],
        [-0.5, -0.1], [-0.12, -0.12],
      ];
      const d =
        pts
          .map((pt, i) => `${i === 0 ? "M" : "L"} ${p([w(pt[0], seedBase + i), w(pt[1], seedBase + i + 20)])}`)
          .join(" ") + " Z";
      return { d, fast: true };
    };
    const p1: Point = { x: lm.faceLeft.x - eyeDist * 0.85, y: lm.faceLeft.y - eyeDist * 0.5 };
    const p2: Point = { x: lm.faceLeft.x - eyeDist * 1.1, y: lm.faceLeft.y + eyeDist * 0.5 };
    return [star(p1, 0.22, 1), star(p2, 0.16, 40)];
  },

  nerdGlasses: (lm, eyeDist, angle) => {
    // Round frames, sized to the eye itself rather than dominating the
    // face — thick unfilled rim (double stroke already gives it weight).
    const rad = eyeDist * 0.3;
    const lens = (origin: Point, side: 1 | -1, seedBase: number): Stroke => {
      const w = (n: number, seed: number) => n + seededWobble(seed) * 0.035;
      const p = (local: [number, number]) => fmt(place([local[0] * side, local[1]], origin, eyeDist, angle));
      return {
        d: [
          `M ${p([w(0.5, seedBase), 0])}`,
          `C ${p([0.5, w(0.4, seedBase + 1)])} ${p([w(0.2, seedBase + 2), 0.5])} ${p([0, w(0.5, seedBase + 3)])}`,
          `C ${p([w(-0.2, seedBase + 4), 0.5])} ${p([-0.5, w(0.4, seedBase + 5)])} ${p([-0.5, w(0, seedBase + 6)])}`,
          `C ${p([-0.5, w(-0.4, seedBase + 7)])} ${p([w(-0.2, seedBase + 8), -0.5])} ${p([0, w(-0.5, seedBase + 9)])}`,
          `C ${p([w(0.2, seedBase + 10), -0.5])} ${p([0.5, w(-0.4, seedBase + 11)])} ${p([w(0.5, seedBase + 12), 0])}`,
          "Z",
        ].join(" "),
      };
    };
    const bridge: Stroke = {
      d: `M ${fmt({ x: lm.leftEye.x + rad * 0.95, y: lm.leftEye.y })} L ${fmt({ x: lm.rightEye.x - rad * 0.95, y: lm.rightEye.y })}`,
    };
    return [lens(lm.leftEye, 1, 1), lens(lm.rightEye, -1, 20), bridge];
  },

  headphones: (lm, eyeDist, angle) => {
    // Ear cups anchored at actual ear height — between eye and nose-tip
    // level, pulled slightly past the face's outer edge so they clear the
    // glasses lenses instead of sitting on top of them — with the band's
    // ends landing exactly on the cups so the two read as one object
    // instead of two disconnected shapes.
    const w = (n: number, seed: number) => n + seededWobble(seed) * 0.03;
    const earY = (lm.leftEye.y + lm.noseTip.y) / 2;
    const leftEar: Point = { x: lm.faceLeft.x - eyeDist * 0.06, y: earY };
    const rightEar: Point = { x: lm.faceRight.x + eyeDist * 0.06, y: earY };
    const peak: Point = { x: lm.forehead.x, y: lm.forehead.y - eyeDist * 0.6 };
    const ctrlL: Point = { x: lm.forehead.x - eyeDist * 0.55, y: lm.forehead.y - eyeDist * 0.5 };
    const ctrlR: Point = { x: lm.forehead.x + eyeDist * 0.55, y: lm.forehead.y - eyeDist * 0.5 };
    const band: Stroke = {
      d: [
        `M ${fmt({ x: leftEar.x + w(0, 1), y: leftEar.y + w(0, 2) })}`,
        `Q ${fmt(ctrlL)} ${fmt({ x: peak.x + w(0, 3), y: peak.y + w(0, 4) })}`,
        `Q ${fmt(ctrlR)} ${fmt({ x: rightEar.x + w(0, 5), y: rightEar.y + w(0, 6) })}`,
      ].join(" "),
    };
    const earCup = (cupOrigin: Point, seedBase: number): Stroke[] => {
      const pp = (local: [number, number]) => fmt(place(local, cupOrigin, eyeDist, angle));
      const outer: Stroke = {
        fillColor: DARK_FILL,
        d: [
          `M ${pp([w(0, seedBase), w(-0.22, seedBase + 1)])}`,
          `C ${pp([w(0.2, seedBase + 2), -0.22])} ${pp([0.22, w(0.2, seedBase + 3)])} ${pp([w(0, seedBase + 4), 0.24])}`,
          `C ${pp([-0.22, w(0.2, seedBase + 5)])} ${pp([-0.2, w(-0.22, seedBase + 6)])} ${pp([w(0, seedBase + 7), -0.22])}`,
          "Z",
        ].join(" "),
      };
      const inner: Stroke = {
        d: circlePath(cupOrigin, 0.09, eyeDist, angle),
        fast: true,
      };
      return [outer, inner];
    };
    return [band, ...earCup(leftEar, 20), ...earCup(rightEar, 40)];
  },

  techNoise: (lm, eyeDist, angle) =>
    scatterGlyphs(
      [
        { ch: "{", origin: { x: lm.faceLeft.x - eyeDist * 0.85, y: lm.faceLeft.y + eyeDist * 0.1 }, scale: 0.2, seed: 1 },
        { ch: "}", origin: { x: lm.faceRight.x + eyeDist * 0.75, y: lm.faceRight.y - eyeDist * 0.4 }, scale: 0.19, seed: 20 },
        { ch: "<", origin: { x: lm.faceLeft.x - eyeDist * 0.6, y: lm.faceLeft.y - eyeDist * 0.55 }, scale: 0.17, seed: 40 },
        { ch: "1", origin: { x: lm.chin.x - eyeDist * 0.8, y: lm.chin.y + eyeDist * 0.15 }, scale: 0.19, seed: 60 },
        { ch: "0", origin: { x: lm.chin.x + eyeDist * 0.7, y: lm.chin.y + eyeDist * 0.2 }, scale: 0.17, seed: 80 },
      ],
      eyeDist,
      angle,
    ),

  wordBoss: (lm, eyeDist, angle) => wordStrokes("BOSS", lm, eyeDist, angle, 0.55),
  wordPirate: (lm, eyeDist, angle) => wordStrokes("AARGH!", lm, eyeDist, angle, 0.35),
  wordDev: (lm, eyeDist, angle) => wordStrokes("404", lm, eyeDist, angle, 0.4),
};

const THEME_KINDS: Record<ThemeKind, BasePiece[]> = {
  pirate: ["eyepatch", "mustache", "goatee", "wordPirate"],
  boss: ["bossGlasses", "goldChain", "cigarSmoke", "stars", "wordBoss"],
  developer: ["nerdGlasses", "headphones", "techNoise", "wordDev"],
};
const THEME_NAMES: ThemeKind[] = ["pirate", "boss", "developer"];

function pickRandomTheme(exclude?: ThemeKind): ThemeKind {
  const pool = exclude ? THEME_NAMES.filter((t) => t !== exclude) : THEME_NAMES;
  return pool[Math.floor(Math.random() * pool.length)];
}

function buildPieces(kind: Exclude<DoodleKind, "random">, lm: Landmarks): Stroke[] {
  const eyeDist = Math.hypot(lm.rightEye.x - lm.leftEye.x, lm.rightEye.y - lm.leftEye.y);
  const angle = Math.atan2(lm.rightEye.y - lm.leftEye.y, lm.rightEye.x - lm.leftEye.x);
  const bases = kind in THEME_KINDS ? THEME_KINDS[kind as ThemeKind] : [kind as BasePiece];
  return bases.flatMap((base) => PIECE_BUILDERS[base](lm, eyeDist, angle));
}

const DRAW_MS_PER_PIECE = 1100;
const PIECE_PAUSE_MS = 140;
// Letters and small background marks are short strokes — drawing them at
// full-piece speed would make a word like "AARGH!" take ~15s on its own.
const FAST_DRAW_MS = 260;
const FAST_PAUSE_MS = 40;
const HOLD_MS = 350;

// White "chalk ink" — a dark, subtle outline underneath gives it edge
// definition against any part of the photo, and a soft offset drop-shadow
// on the whole group gives it a little sticker-like 3D lift, instead of
// looking like a flat decal.
const ACCENT_COLOR = "#fdfdfd";
const OUTLINE_COLOR = "rgba(13,13,12,0.45)";
const INK_SHADOW = "drop-shadow(1px 2.5px 1.5px rgba(0,0,0,0.4))";
// A solid dark lens/patch colour — sunglasses and an eyepatch are actually
// opaque in real life, so these fill instead of using the white sketch ink.
const DARK_FILL = "rgba(20,18,16,0.92)";
const GOLD_FILL = "#d9a94a";
const GOLD_INK = "rgba(90,58,10,0.75)";

export function DoodlePortrait({ src, alt, doodle = "random", ratio = 358 / 460, color }: DoodlePortraitProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);
  const rafRef = useRef<number | null>(null);

  const [box, setBox] = useState({ w: 0, h: 0 });
  const [landmarks, setLandmarks] = useState<Landmarks | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "unavailable">("idle");
  const [active, setActive] = useState(false);
  const [pieceIndex, setPieceIndex] = useState(-1);
  const [pieceProgress, setPieceProgress] = useState(0);
  const [pen, setPen] = useState<{ x: number; y: number; angle: number } | null>(null);
  const strokeColor = color ?? ACCENT_COLOR;
  const [reduceMotion, setReduceMotion] = useState(false);
  const [session, setSession] = useState(0);
  const sessionRef = useRef(0);
  const rawId = useId().replace(/:/g, "_");
  const filterId = `doodle-sketch-${rawId}`;

  const [kind, setKind] = useState<Exclude<DoodleKind, "random">>(() =>
    doodle === "random" ? pickRandomTheme() : doodle
  );

  useEffect(() => {
    if (doodle !== "random") setKind(doodle);
  }, [doodle]);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mql.matches);
    const onChange = () => setReduceMotion(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  const runDetection = async () => {
    const imgEl = imgRef.current;
    if (!imgEl || !imgEl.complete || status === "ready" || status === "loading") return;
    setStatus("loading");
    try {
      const landmarker = await Promise.race([
        getLandmarker(),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 4000)),
      ]);
      const result = landmarker.detect(imgEl);
      const points = result.faceLandmarks?.[0];
      if (!points) throw new Error("no face");

      const natW = imgEl.naturalWidth;
      const natH = imgEl.naturalHeight;
      const boxW = imgEl.clientWidth;
      const boxH = imgEl.clientHeight;
      const at = (i: number) => mapCoverPoint(points[i].x, points[i].y, natW, natH, boxW, boxH);

      setLandmarks({
        leftEye: at(LANDMARK_INDEX.leftEyeOuter),
        rightEye: at(LANDMARK_INDEX.rightEyeOuter),
        noseTip: at(LANDMARK_INDEX.noseTip),
        mouthLeft: at(LANDMARK_INDEX.mouthLeft),
        mouthRight: at(LANDMARK_INDEX.mouthRight),
        mouthTop: at(LANDMARK_INDEX.mouthTop),
        forehead: at(LANDMARK_INDEX.forehead),
        chin: at(LANDMARK_INDEX.chin),
        faceLeft: at(LANDMARK_INDEX.faceLeft),
        faceRight: at(LANDMARK_INDEX.faceRight),
      });
      setStatus("ready");
    } catch {
      // No face found, model failed to load, or timed out — fall back to
      // sensible fixed positions rather than breaking the page.
      const boxW = imgEl.clientWidth || 358;
      const boxH = imgEl.clientHeight || 460;
      setLandmarks({
        leftEye: { x: boxW * 0.36, y: boxH * 0.38 },
        rightEye: { x: boxW * 0.64, y: boxH * 0.38 },
        noseTip: { x: boxW * 0.5, y: boxH * 0.5 },
        mouthLeft: { x: boxW * 0.4, y: boxH * 0.6 },
        mouthRight: { x: boxW * 0.6, y: boxH * 0.6 },
        mouthTop: { x: boxW * 0.5, y: boxH * 0.57 },
        forehead: { x: boxW * 0.5, y: boxH * 0.22 },
        chin: { x: boxW * 0.5, y: boxH * 0.72 },
        faceLeft: { x: boxW * 0.28, y: boxH * 0.5 },
        faceRight: { x: boxW * 0.72, y: boxH * 0.5 },
      });
      setStatus("unavailable");
    }
  };

  const pieces = useMemo(() => (landmarks ? buildPieces(kind, landmarks) : null), [landmarks, kind]);

  const stopAnimation = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  };

  // Draws pieces strictly one at a time — a single pen, a single tip moving
  // at any moment. Each piece finishes fully before the next one starts.
  const animateSequence = (mySession: number, strokes: Stroke[]) => {
    if (reduceMotion) {
      setPieceIndex(strokes.length - 1);
      setPieceProgress(1);
      setPen(null);
      return;
    }
    const drawPiece = (i: number) => {
      if (sessionRef.current !== mySession) return;
      if (i >= strokes.length) {
        setTimeout(() => {
          if (sessionRef.current === mySession) setPen(null);
        }, HOLD_MS);
        return;
      }
      setPieceIndex(i);
      setPieceProgress(0);
      // The path for piece `i` was unrendered (revealed === 0 -> null) a
      // moment ago; setPieceIndex above only *schedules* the re-render that
      // mounts it. Reading pathRefs.current[i] synchronously here would
      // almost always see the stale/null ref from before that commit — wait
      // a frame so React has actually painted it first.
      rafRef.current = requestAnimationFrame(() => {
        if (sessionRef.current !== mySession) return;
        const pathEl = pathRefs.current[i];
        if (!pathEl) {
          drawPiece(i + 1);
          return;
        }
        const total = pathEl.getTotalLength();
        const duration = strokes[i].fast ? FAST_DRAW_MS : DRAW_MS_PER_PIECE;
        const pauseMs = strokes[i].fast ? FAST_PAUSE_MS : PIECE_PAUSE_MS;
        const start = performance.now();
        const step = (now: number) => {
          if (sessionRef.current !== mySession) return;
          const t = Math.min(1, (now - start) / duration);
          const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
          setPieceProgress(eased);
          const pt = pathEl.getPointAtLength(eased * total);
          const ahead = pathEl.getPointAtLength(Math.min(total, eased * total + 2));
          const pAngle = Math.atan2(ahead.y - pt.y, ahead.x - pt.x);
          setPen({
            x: pt.x + seededWobble(now * 0.01) * 0.6,
            y: pt.y + seededWobble(now * 0.017) * 0.6,
            angle: pAngle,
          });
          if (t < 1) {
            rafRef.current = requestAnimationFrame(step);
          } else {
            setTimeout(() => {
              if (sessionRef.current === mySession) drawPiece(i + 1);
            }, pauseMs);
          }
        };
        rafRef.current = requestAnimationFrame(step);
      });
    };
    drawPiece(0);
  };

  const handleEnter = () => {
    sessionRef.current += 1;
    setSession(sessionRef.current);
    if (doodle === "random") {
      setKind((prev) => pickRandomTheme(THEME_NAMES.includes(prev as ThemeKind) ? (prev as ThemeKind) : undefined));
    }
    setActive(true);
    void runDetection();
  };

  const handleLeave = () => {
    sessionRef.current += 1;
    setActive(false);
    stopAnimation();
    setPieceIndex(-1);
    setPieceProgress(0);
    setPen(null);
  };

  // Every hover (a fresh `session`) restarts the sequence from piece 0, even
  // if landmarks are already cached from a previous hover on the same photo.
  useEffect(() => {
    if (active && pieces && pieces.length > 0) {
      stopAnimation();
      setPieceIndex(-1);
      setPieceProgress(0);
      setPen(null);
      animateSequence(sessionRef.current, pieces);
    }
    return stopAnimation;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, pieces, reduceMotion, session]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setBox({ w: entry.contentRect.width, h: entry.contentRect.height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const supportsHover =
    typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches;

  return (
    <Box
      ref={wrapRef}
      pos="relative"
      w={{ base: "100%", sm: 358 }}
      style={{ flexShrink: 0, overflow: "visible" }}
      onMouseEnter={supportsHover ? handleEnter : undefined}
      onMouseLeave={supportsHover ? handleLeave : undefined}
      onClick={!supportsHover ? () => (active ? handleLeave() : handleEnter()) : undefined}
    >
      <Card radius="md" p={0} style={{ overflow: "hidden" }}>
        <CardSection bg="sprout.6">
          <AspectRatio ratio={ratio}>
            <Image ref={imgRef} alt={alt} src={src} fit="cover" />
          </AspectRatio>
        </CardSection>
      </Card>

      {box.w > 0 && (
        <svg
          width={box.w}
          height={box.h}
          viewBox={`0 0 ${box.w} ${box.h}`}
          style={{
            position: "absolute",
            inset: 0,
            overflow: "visible",
            pointerEvents: "none",
          }}
          aria-hidden="true"
        >
          <defs>
            {/* Displaces the stroke along a fixed noise field so the line
                wobbles unevenly along its whole length, not just at a
                handful of control points — reads as an actual unsteady
                hand instead of a smooth curve with jittered endpoints. */}
            <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.09"
                numOctaves={2}
                seed={kind.length + 3}
                result="noise"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="noise"
                scale={box.w * 0.007}
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
          </defs>

          {pieces && (
            <g style={{ filter: `url(#${filterId}) ${INK_SHADOW}` }}>
              {pieces.map((piece, i) => {
                const revealed = i < pieceIndex ? 1 : i === pieceIndex ? pieceProgress : 0;
                // Always mounted, even at revealed === 0 — strokeDashoffset
                // alone hides it. The ref has to exist *before* its own
                // piece starts animating (drawPiece needs getTotalLength()
                // on it), so it can't be conditionally unmounted until then.
                return (
                  <g key={i}>
                    {/* Solid fill (sunglasses lenses, an eyepatch, chain
                        links) fades in once the outline has finished
                        drawing — the sketch still "draws" first. */}
                    {piece.fillColor && (
                      <path
                        d={piece.d}
                        fill={piece.fillColor}
                        stroke="none"
                        opacity={revealed > 0.85 ? 1 : 0}
                        style={{ transition: "opacity 220ms ease" }}
                      />
                    )}
                    {/* Dark, subtle outline underneath — edge definition, not
                        a contrast mechanism; white ink already reads fine on
                        most of the photo. */}
                    <path
                      d={piece.d}
                      fill="none"
                      stroke={OUTLINE_COLOR}
                      strokeWidth={box.w * 0.024}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{
                        strokeDasharray: pathRefs.current[i]?.getTotalLength() || 1000,
                        strokeDashoffset: (pathRefs.current[i]?.getTotalLength() || 1000) * (1 - revealed),
                      }}
                    />
                    <path
                      ref={(el) => {
                        pathRefs.current[i] = el;
                      }}
                      d={piece.d}
                      fill="none"
                      stroke={piece.inkColor ?? strokeColor}
                      strokeWidth={box.w * 0.012}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{
                        strokeDasharray: pathRefs.current[i]?.getTotalLength() || 1000,
                        strokeDashoffset: (pathRefs.current[i]?.getTotalLength() || 1000) * (1 - revealed),
                      }}
                    />
                    {piece.extraDots?.map((dot, di) => (
                      <circle
                        key={di}
                        cx={dot.x}
                        cy={dot.y}
                        r={box.w * 0.013}
                        fill={strokeColor}
                        stroke={OUTLINE_COLOR}
                        strokeWidth={box.w * 0.005}
                        opacity={revealed > 0.9 ? 1 : 0}
                        style={{ transition: "opacity 200ms ease" }}
                      />
                    ))}
                  </g>
                );
              })}
            </g>
          )}

          {pen && (
            <g
              transform={`translate(${pen.x} ${pen.y}) rotate(${(pen.angle * 180) / Math.PI})`}
              style={{ filter: INK_SHADOW }}
            >
              <path
                d={`M -2 -${box.w * 0.05} L 2 -${box.w * 0.05} L ${box.w * 0.01} ${box.w * 0.02} L 0 ${box.w * 0.03} L -${box.w * 0.01} ${box.w * 0.02} Z`}
                fill={strokeColor}
                stroke={OUTLINE_COLOR}
                strokeWidth={1}
              />
            </g>
          )}
        </svg>
      )}
    </Box>
  );
}
