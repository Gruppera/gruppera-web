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

type Stroke = { d: string; extraDots?: Point[]; fast?: boolean };

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
  const letterW = 0.17;
  const gap = 0.045;
  const letterH = 0.24;
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
    // pulled up toward the nose to actually land above the lip.
    const origin: Point = {
      x: lm.mouthTop.x * 0.4 + lm.noseTip.x * 0.6,
      y: lm.mouthTop.y * 0.4 + lm.noseTip.y * 0.6,
    };
    const w = (n: number, seed: number) => n + seededWobble(seed) * 0.08;
    const p = (local: [number, number]) => fmt(place(local, origin, eyeDist, angle));
    return [
      {
        d: [
          `M ${p([w(-0.38, 1), w(0.03, 2)])}`,
          `C ${p([w(-0.28, 3), w(-0.14, 4)])} ${p([w(-0.12, 5), w(-0.13, 6)])} ${p([0, w(-0.01, 7)])}`,
          `C ${p([w(0.12, 8), w(-0.13, 9)])} ${p([w(0.28, 10), w(-0.14, 11)])} ${p([w(0.38, 12), w(0.03, 13)])}`,
          `C ${p([w(0.29, 14), w(0.12, 15)])} ${p([w(0.15, 16), w(0.06, 17)])} ${p([0, w(0.07, 18)])}`,
          `C ${p([w(-0.15, 19), w(0.06, 20)])} ${p([w(-0.29, 21), w(0.12, 22)])} ${p([w(-0.38, 23), w(0.03, 24)])}`,
          "Z",
        ].join(" "),
      },
    ];
  },

  goatee: (lm, eyeDist, angle) => {
    // Spans from just below the mouth down to the chin — a pointed tuft,
    // not a full beard.
    const origin: Point = {
      x: (lm.mouthTop.x + lm.chin.x) / 2,
      y: (lm.mouthTop.y + lm.chin.y) / 2,
    };
    const w = (n: number, seed: number) => n + seededWobble(seed) * 0.08;
    const p = (local: [number, number]) => fmt(place(local, origin, eyeDist, angle));
    return [
      {
        d: [
          `M ${p([w(-0.28, 1), w(-0.5, 2)])}`,
          `C ${p([w(-0.32, 3), w(-0.1, 4)])} ${p([w(-0.2, 5), w(0.35, 6)])} ${p([w(0, 7), w(0.62, 8)])}`,
          `C ${p([w(0.2, 9), w(0.35, 10)])} ${p([w(0.32, 11), w(-0.1, 12)])} ${p([w(0.28, 13), w(-0.5, 14)])}`,
        ].join(" "),
      },
    ];
  },

  eyepatch: (lm, eyeDist, angle) => {
    // Covers her right eye (screen-left), strap running up and across
    // toward the opposite temple.
    const origin: Point = lm.leftEye;
    const w = (n: number, seed: number) => n + seededWobble(seed) * 0.06;
    const p = (local: [number, number]) => fmt(place(local, origin, eyeDist, angle));
    const patch: Stroke = {
      d: [
        `M ${p([w(-0.3, 1), w(-0.24, 2)])}`,
        `C ${p([w(-0.32, 3), w(-0.38, 4)])} ${p([w(0.32, 5), w(-0.38, 6)])} ${p([w(0.3, 7), w(-0.24, 8)])}`,
        `C ${p([w(0.38, 9), w(0, 10)])} ${p([w(0.34, 11), w(0.3, 12)])} ${p([w(0.26, 13), w(0.32, 14)])}`,
        `C ${p([w(0, 15), w(0.38, 16)])} ${p([w(-0.26, 17), w(0.32, 18)])} ${p([w(-0.26, 19), w(0.3, 20)])}`,
        `C ${p([w(-0.38, 21), w(0.26, 22)])} ${p([w(-0.38, 23), w(-0.04, 24)])} ${p([w(-0.3, 25), w(-0.24, 26)])}`,
        "Z",
      ].join(" "),
    };
    const strap: Stroke = {
      d: [
        `M ${p([w(0.3, 30), w(-0.12, 31)])}`,
        `Q ${fmt(place([1.0, -0.5], origin, eyeDist, angle))} ${fmt({ x: lm.faceRight.x, y: lm.faceRight.y - eyeDist * 0.25 })}`,
      ].join(" "),
    };
    return [patch, strap];
  },

  bossGlasses: (lm, eyeDist, angle) => {
    // Same lens shape as the old sunglasses piece, scaled up for a bigger,
    // flashier frame.
    const rad = eyeDist * 0.42;
    const lens = (origin: Point, side: 1 | -1, seedBase: number): Stroke => {
      const w = (n: number, seed: number) => n + seededWobble(seed) * 0.07;
      const p = (local: [number, number]) => fmt(place([local[0] * side, local[1]], origin, eyeDist, angle));
      return {
        d: [
          `M ${p([w(-0.42, seedBase), 0])}`,
          `C ${p([-0.42, w(-0.28, seedBase + 1)])} ${p([w(0.12, seedBase + 2), -0.38])} ${p([0.42, w(-0.15, seedBase + 3)])}`,
          `C ${p([0.62, w(0.03, seedBase + 4)])} ${p([w(0.5, seedBase + 5), 0.38])} ${p([w(0.12, seedBase + 6), 0.4])}`,
          `C ${p([w(-0.22, seedBase + 7), 0.42])} ${p([-0.44, w(0.25, seedBase + 8)])} ${p([w(-0.42, seedBase + 9), 0])}`,
          "Z",
        ].join(" "),
      };
    };
    const bridge: Stroke = {
      d: `M ${fmt({ x: lm.leftEye.x + rad * 0.9, y: lm.leftEye.y })} L ${fmt({ x: lm.rightEye.x - rad * 0.9, y: lm.rightEye.y })}`,
    };
    return [lens(lm.leftEye, 1, 1), lens(lm.rightEye, -1, 20), bridge];
  },

  goldChain: (lm, eyeDist, angle) => {
    const origin: Point = { x: lm.chin.x, y: lm.chin.y };
    const w = (n: number, seed: number) => n + seededWobble(seed) * 0.05;
    const p = (local: [number, number]) => fmt(place(local, origin, eyeDist, angle));
    const chain: Stroke = {
      d: [
        `M ${p([w(-0.75, 1), w(0.2, 2)])}`,
        `Q ${p([w(-0.35, 3), w(0.75, 4)])} ${p([0, w(0.82, 5)])}`,
        `Q ${p([w(0.35, 6), w(0.75, 7)])} ${p([w(0.75, 8), w(0.2, 9)])}`,
      ].join(" "),
    };
    const beadAt = (t: number, seed: number): Point => {
      const x = -0.75 + t * 1.5;
      const y = 0.2 + Math.sin(t * Math.PI) * 0.62;
      return place([w(x, seed), w(y, seed + 1)], origin, eyeDist, angle);
    };
    return [
      {
        ...chain,
        extraDots: [beadAt(0.15, 10), beadAt(0.35, 12), beadAt(0.5, 14), beadAt(0.65, 16), beadAt(0.85, 18)],
      },
    ];
  },

  cigarSmoke: (lm, eyeDist, angle) => {
    const origin: Point = lm.mouthRight;
    const w = (n: number, seed: number) => n + seededWobble(seed) * 0.05;
    const p = (local: [number, number]) => fmt(place(local, origin, eyeDist, angle));
    // Kept short — mouthRight already sits close to the photo's right edge,
    // so a wide/tall reach here bleeds past the card into the text column
    // next to it.
    const cigar: Stroke = {
      d: [
        `M ${p([w(0.02, 1), w(0.05, 2)])}`,
        `L ${p([w(0.42, 3), w(0, 4)])}`,
        `L ${p([w(0.5, 5), w(0.1, 6)])}`,
        `L ${p([w(0.42, 7), w(0.2, 8)])}`,
        `L ${p([w(0.02, 9), w(0.15, 10)])}`,
        "Z",
      ].join(" "),
    };
    const smokeLine = (seedBase: number, dir: 1 | -1): Stroke => ({
      d: [
        `M ${p([w(0.5, seedBase), w(0.05, seedBase + 1)])}`,
        `Q ${p([w(0.6, seedBase + 2), w(-0.15 * dir, seedBase + 3)])} ${p([w(0.5, seedBase + 4), w(-0.35, seedBase + 5)])}`,
        `Q ${p([w(0.4, seedBase + 6), w(-0.5 * dir, seedBase + 7)])} ${p([w(0.52, seedBase + 8), w(-0.65, seedBase + 9)])}`,
      ].join(" "),
      fast: true,
    });
    return [cigar, smokeLine(20, 1), smokeLine(30, -1)];
  },

  stars: (lm, eyeDist, angle) => {
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
    const p1: Point = { x: lm.faceLeft.x - eyeDist * 0.5, y: lm.faceLeft.y - eyeDist * 0.55 };
    const p2: Point = { x: lm.faceLeft.x - eyeDist * 0.75, y: lm.faceLeft.y + eyeDist * 0.35 };
    return [star(p1, 0.32, 1), star(p2, 0.24, 40)];
  },

  nerdGlasses: (lm, eyeDist, angle) => {
    // Big, round, unfilled frames — bigger and rounder than the sunglasses
    // lens so the two read as clearly different accessories.
    const rad = eyeDist * 0.46;
    const lens = (origin: Point, side: 1 | -1, seedBase: number): Stroke => {
      const w = (n: number, seed: number) => n + seededWobble(seed) * 0.05;
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
    const origin: Point = { x: lm.forehead.x, y: lm.forehead.y };
    const w = (n: number, seed: number) => n + seededWobble(seed) * 0.05;
    const p = (local: [number, number]) => fmt(place(local, origin, eyeDist, angle));
    // Kept shallow — anything higher risks bleeding above the photo card
    // into the site header, which has no room to scroll into (see the
    // halo/horns headroom notes below).
    const band: Stroke = {
      d: [
        `M ${p([w(-0.95, 1), w(0.3, 2)])}`,
        `Q ${p([w(-0.6, 3), w(-0.6, 4)])} ${p([0, w(-0.75, 5)])}`,
        `Q ${p([w(0.6, 6), w(-0.6, 7)])} ${p([w(0.95, 8), w(0.3, 9)])}`,
      ].join(" "),
    };
    const earCup = (cupOrigin: Point, seedBase: number): Stroke => {
      const pp = (local: [number, number]) => fmt(place(local, cupOrigin, eyeDist, angle));
      return {
        d: [
          `M ${pp([w(0, seedBase), w(-0.3, seedBase + 1)])}`,
          `C ${pp([w(0.28, seedBase + 2), -0.3])} ${pp([0.28, w(0.3, seedBase + 3)])} ${pp([w(0, seedBase + 4), 0.3])}`,
          `C ${pp([-0.28, w(0.3, seedBase + 5)])} ${pp([-0.28, w(-0.3, seedBase + 6)])} ${pp([w(0, seedBase + 7), -0.3])}`,
          "Z",
        ].join(" "),
      };
    };
    return [
      band,
      earCup({ x: lm.faceLeft.x, y: lm.faceLeft.y }, 20),
      earCup({ x: lm.faceRight.x, y: lm.faceRight.y }, 40),
    ];
  },

  techNoise: (lm, eyeDist, angle) =>
    scatterGlyphs(
      [
        { ch: "{", origin: { x: lm.faceLeft.x - eyeDist * 0.55, y: lm.faceLeft.y + eyeDist * 0.15 }, scale: 0.3, seed: 1 },
        { ch: "}", origin: { x: lm.faceRight.x + eyeDist * 0.4, y: lm.faceRight.y - eyeDist * 0.5 }, scale: 0.28, seed: 20 },
        { ch: "<", origin: { x: lm.faceLeft.x - eyeDist * 0.35, y: lm.faceLeft.y - eyeDist * 0.7 }, scale: 0.26, seed: 40 },
        { ch: "1", origin: { x: lm.chin.x - eyeDist * 0.55, y: lm.chin.y + eyeDist * 0.3 }, scale: 0.28, seed: 60 },
        { ch: "0", origin: { x: lm.chin.x + eyeDist * 0.15, y: lm.chin.y + eyeDist * 0.45 }, scale: 0.26, seed: 80 },
      ],
      eyeDist,
      angle,
    ),

  wordBoss: (lm, eyeDist, angle) => wordStrokes("BOSS", lm, eyeDist, angle, 0.95),
  wordPirate: (lm, eyeDist, angle) => wordStrokes("AARGH!", lm, eyeDist, angle, 0.6),
  wordDev: (lm, eyeDist, angle) => wordStrokes("404", lm, eyeDist, angle, 0.7),
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
                      stroke={strokeColor}
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
