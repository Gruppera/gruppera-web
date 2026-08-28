"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { FaceLandmarker as FaceLandmarkerType } from "@mediapipe/tasks-vision";
import { AspectRatio, Box, Card, CardSection, Image } from "@mantine/core";

type BasePiece =
  | "mustache"
  | "horns"
  | "crown"
  | "sunglasses"
  | "goatee"
  | "wrinkles"
  | "halo"
  | "grumpy";
type ThemeKind = "old" | "cool" | "devil" | "angel";
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

type Stroke = { d: string; extraDots?: Point[] };

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
    const origin: Point = { x: (lm.mouthTop.x + lm.noseTip.x) / 2, y: (lm.mouthTop.y + lm.noseTip.y) / 2 };
    const w = (n: number, seed: number) => n + seededWobble(seed) * 0.1;
    const p = (local: [number, number]) => fmt(place(local, origin, eyeDist, angle));
    return [
      {
        d: [
          `M ${p([w(-0.55, 1), w(0.05, 2)])}`,
          `C ${p([w(-0.4, 3), w(-0.22, 4)])} ${p([w(-0.18, 5), w(-0.2, 6)])} ${p([0, w(-0.02, 7)])}`,
          `C ${p([w(0.18, 8), w(-0.2, 9)])} ${p([w(0.4, 10), w(-0.22, 11)])} ${p([w(0.55, 12), w(0.05, 13)])}`,
          `C ${p([w(0.42, 14), w(0.18, 15)])} ${p([w(0.22, 16), w(0.1, 17)])} ${p([0, w(0.12, 18)])}`,
          `C ${p([w(-0.22, 19), w(0.1, 20)])} ${p([w(-0.42, 21), w(0.18, 22)])} ${p([w(-0.55, 23), w(0.05, 24)])}`,
          "Z",
        ].join(" "),
      },
    ];
  },

  sunglasses: (lm, eyeDist, angle) => {
    const rad = eyeDist * 0.34;
    const lens = (origin: Point, side: 1 | -1, seedBase: number): Stroke => {
      const w = (n: number, seed: number) => n + seededWobble(seed) * 0.06;
      const p = (local: [number, number]) => fmt(place([local[0] * side, local[1]], origin, eyeDist, angle));
      return {
        d: [
          `M ${p([w(-0.34, seedBase), 0])}`,
          `C ${p([-0.34, w(-0.22, seedBase + 1)])} ${p([w(0.1, seedBase + 2), -0.3])} ${p([0.34, w(-0.12, seedBase + 3)])}`,
          `C ${p([0.5, w(0.02, seedBase + 4)])} ${p([w(0.4, seedBase + 5), 0.3])} ${p([w(0.1, seedBase + 6), 0.32])}`,
          `C ${p([w(-0.18, seedBase + 7), 0.34])} ${p([-0.36, w(0.2, seedBase + 8)])} ${p([w(-0.34, seedBase + 9), 0])}`,
          "Z",
        ].join(" "),
      };
    };
    const bridge: Stroke = {
      d: `M ${fmt({ x: lm.leftEye.x + rad * 0.9, y: lm.leftEye.y })} L ${fmt({ x: lm.rightEye.x - rad * 0.9, y: lm.rightEye.y })}`,
    };
    return [lens(lm.leftEye, 1, 1), lens(lm.rightEye, -1, 20), bridge];
  },

  horns: (lm, eyeDist, angle) => {
    const origin: Point = { x: lm.forehead.x, y: lm.forehead.y };
    const w = (n: number, seed: number) => n + seededWobble(seed) * 0.1;
    const p = (local: [number, number]) => fmt(place(local, origin, eyeDist, angle));
    const horn = (side: 1 | -1, seedBase: number): Stroke => ({
      d: [
        `M ${p([side * w(0.55, seedBase), w(0.1, seedBase + 1)])}`,
        `C ${p([side * w(0.7, seedBase + 2), w(-0.45, seedBase + 3)])} ${p([side * w(0.62, seedBase + 4), w(-1.0, seedBase + 5)])} ${p([side * w(0.4, seedBase + 6), w(-1.3, seedBase + 7)])}`,
        `C ${p([side * w(0.3, seedBase + 8), w(-1.1, seedBase + 9)])} ${p([side * w(0.32, seedBase + 10), w(-0.8, seedBase + 11)])} ${p([side * w(0.28, seedBase + 12), w(-0.5, seedBase + 13)])}`,
        "Z",
      ].join(" "),
    });
    return [horn(-1, 1), horn(1, 15)];
  },

  crown: (lm, eyeDist, angle) => {
    const origin: Point = { x: lm.forehead.x, y: lm.forehead.y };
    const w = (n: number, seed: number) => n + seededWobble(seed) * 0.1;
    const p = (local: [number, number]) => fmt(place(local, origin, eyeDist, angle));
    const base = -0.15;
    return [
      {
        d: [
          `M ${p([-0.75, w(base, 1)])}`,
          `L ${p([-0.75, w(base - 0.35, 2)])}`,
          `L ${p([-0.45, w(base - 0.05, 3)])}`,
          `L ${p([-0.22, w(base - 0.65, 4)])}`,
          `L ${p([0, w(base - 0.1, 5)])}`,
          `L ${p([0.22, w(base - 0.65, 6)])}`,
          `L ${p([0.45, w(base - 0.05, 7)])}`,
          `L ${p([0.75, w(base - 0.35, 8)])}`,
          `L ${p([0.75, w(base, 9)])}`,
          "Z",
        ].join(" "),
        extraDots: [
          place([-0.22, base - 0.55], origin, eyeDist, angle),
          place([0, base - 0.0], origin, eyeDist, angle),
          place([0.22, base - 0.55], origin, eyeDist, angle),
        ],
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

  wrinkles: (lm, eyeDist, angle) => {
    // Three short wavy lines across the forehead, between the hairline
    // landmark and brow level.
    const origin: Point = {
      x: (lm.forehead.x + (lm.leftEye.x + lm.rightEye.x) / 2) / 2,
      y: (lm.forehead.y + (lm.leftEye.y + lm.rightEye.y) / 2) / 2,
    };
    const w = (n: number, seed: number) => n + seededWobble(seed) * 0.06;
    const line = (yBase: number, seedBase: number): Stroke => {
      const p = (local: [number, number]) => fmt(place(local, origin, eyeDist, angle));
      return {
        d: [
          `M ${p([-0.55, w(yBase, seedBase)])}`,
          `Q ${p([-0.15, w(yBase - 0.08, seedBase + 1)])} ${p([0.1, w(yBase, seedBase + 2)])}`,
          `Q ${p([0.35, w(yBase + 0.06, seedBase + 3)])} ${p([0.55, w(yBase - 0.02, seedBase + 4)])}`,
        ].join(" "),
      };
    };
    return [line(-0.35, 1), line(-0.2, 5), line(-0.05, 9)];
  },

  halo: (lm, eyeDist, angle) => {
    // Floats above the head, but not so far up it risks going above the
    // very top of the page (there's nothing above the header to scroll
    // into, so anything placed too high is simply unreachable, not just
    // clipped).
    const origin: Point = { x: lm.forehead.x, y: lm.forehead.y - eyeDist * 1.0 };
    const w = (n: number, seed: number) => n + seededWobble(seed) * 0.08;
    const p = (local: [number, number]) => fmt(place(local, origin, eyeDist, angle));
    const rx = 0.62;
    const ry = 0.2;
    return [
      {
        d: [
          `M ${p([w(-rx, 1), w(0, 2)])}`,
          `C ${p([w(-rx, 3), w(-ry * 1.8, 4)])} ${p([w(rx, 5), w(-ry * 1.8, 6)])} ${p([w(rx, 7), w(0, 8)])}`,
          `C ${p([w(rx, 9), w(ry * 1.8, 10)])} ${p([w(-rx, 11), w(ry * 1.8, 12)])} ${p([w(-rx, 13), w(0, 14)])}`,
          "Z",
        ].join(" "),
      },
    ];
  },

  grumpy: (lm, eyeDist, angle) => {
    // A short furrowed "V" between the brows.
    const origin: Point = {
      x: (lm.leftEye.x + lm.rightEye.x) / 2,
      y: (lm.leftEye.y + lm.rightEye.y) / 2 - eyeDist * 0.28,
    };
    const w = (n: number, seed: number) => n + seededWobble(seed) * 0.07;
    const p = (local: [number, number]) => fmt(place(local, origin, eyeDist, angle));
    return [
      {
        d: [
          `M ${p([w(-0.2, 1), w(-0.14, 2)])}`,
          `L ${p([w(-0.03, 3), w(0.1, 4)])}`,
          `M ${p([w(0.2, 5), w(-0.14, 6)])}`,
          `L ${p([w(0.03, 7), w(0.1, 8)])}`,
        ].join(" "),
      },
    ];
  },
};

const THEME_KINDS: Record<ThemeKind, BasePiece[]> = {
  devil: ["horns", "goatee"],
  angel: ["halo"],
  cool: ["sunglasses"],
  old: ["wrinkles", "grumpy"],
};
const THEME_NAMES: ThemeKind[] = ["old", "cool", "devil", "angel"];

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
        const start = performance.now();
        const step = (now: number) => {
          if (sessionRef.current !== mySession) return;
          const t = Math.min(1, (now - start) / DRAW_MS_PER_PIECE);
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
            }, PIECE_PAUSE_MS);
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
