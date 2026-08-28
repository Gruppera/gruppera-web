"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { FaceLandmarker as FaceLandmarkerType } from "@mediapipe/tasks-vision";
import { AspectRatio, Box, Card, CardSection, Image } from "@mantine/core";

type DoodleKind = "mustache" | "horns" | "crown" | "sunglasses" | "random";

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

function place(
  local: [number, number],
  origin: Point,
  scale: number,
  angle: number,
): Point {
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

type DoodlePath = { d: string; extraDots?: Point[] };

/**
 * Builds the SVG path for a doodle in "eye-distance units" (scale = distance
 * between the eyes), then rotates/translates/scales it into place. Points
 * get a small deterministic wobble so edges read as hand-drawn, not
 * geometric.
 */
function buildDoodle(kind: Exclude<DoodleKind, "random">, lm: Landmarks): DoodlePath {
  const eyeDist = Math.hypot(lm.rightEye.x - lm.leftEye.x, lm.rightEye.y - lm.leftEye.y);
  const angle = Math.atan2(lm.rightEye.y - lm.leftEye.y, lm.rightEye.x - lm.leftEye.x);
  const w = (n: number, seed: number) => n + seededWobble(seed) * 0.06;

  if (kind === "mustache") {
    const origin: Point = { x: (lm.mouthTop.x + lm.noseTip.x) / 2, y: (lm.mouthTop.y + lm.noseTip.y) / 2 };
    const p = (local: [number, number]) => fmt(place(local, origin, eyeDist, angle));
    return {
      d: [
        `M ${p([w(-0.55, 1), w(0.05, 2)])}`,
        `C ${p([w(-0.4, 3), w(-0.22, 4)])} ${p([w(-0.18, 5), w(-0.2, 6)])} ${p([0, w(-0.02, 7)])}`,
        `C ${p([w(0.18, 8), w(-0.2, 9)])} ${p([w(0.4, 10), w(-0.22, 11)])} ${p([w(0.55, 12), w(0.05, 13)])}`,
        `C ${p([w(0.42, 14), w(0.18, 15)])} ${p([w(0.22, 16), w(0.1, 17)])} ${p([0, w(0.12, 18)])}`,
        `C ${p([w(-0.22, 19), w(0.1, 20)])} ${p([w(-0.42, 21), w(0.18, 22)])} ${p([w(-0.55, 23), w(0.05, 24)])}`,
        "Z",
      ].join(" "),
    };
  }

  if (kind === "sunglasses") {
    const l = lm.leftEye;
    const r = lm.rightEye;
    const rad = eyeDist * 0.34;
    const lp = (local: [number, number]) => fmt(place(local, l, eyeDist, angle));
    const rp = (local: [number, number]) => fmt(place(local, r, eyeDist, angle));
    return {
      d: [
        `M ${lp([-0.34, 0])}`,
        `C ${lp([-0.34, -0.22])} ${lp([0.1, -0.3])} ${lp([0.34, -0.12])}`,
        `C ${lp([0.5, 0.02])} ${lp([0.4, 0.3])} ${lp([0.1, 0.32])}`,
        `C ${lp([-0.18, 0.34])} ${lp([-0.36, 0.2])} ${lp([-0.34, 0])}`,
        "Z",
        `M ${rp([-0.34, -0.1])}`,
        `C ${rp([-0.4, -0.3])} ${rp([0.05, -0.34])} ${rp([0.32, -0.14])}`,
        `C ${rp([0.46, 0])} ${rp([0.38, 0.28])} ${rp([0.08, 0.32])}`,
        `C ${rp([-0.22, 0.36])} ${rp([-0.32, 0.12])} ${rp([-0.34, -0.1])}`,
        "Z",
        `M ${fmt({ x: l.x + rad * 0.9, y: l.y })} L ${fmt({ x: r.x - rad * 0.9, y: r.y })}`,
      ].join(" "),
    };
  }

  if (kind === "horns") {
    const origin: Point = { x: lm.forehead.x, y: lm.forehead.y };
    const p = (local: [number, number]) => fmt(place(local, origin, eyeDist, angle));
    return {
      d: [
        `M ${p([w(-0.55, 1), w(0.1, 2)])}`,
        `C ${p([w(-0.7, 3), w(-0.5, 4)])} ${p([w(-0.62, 5), w(-1.15, 6)])} ${p([w(-0.4, 7), w(-1.5, 8)])}`,
        `C ${p([w(-0.3, 9), w(-1.25, 10)])} ${p([w(-0.32, 11), w(-0.9, 12)])} ${p([w(-0.28, 13), w(-0.55, 14)])}`,
        "Z",
        `M ${p([w(0.55, 15), w(0.1, 16)])}`,
        `C ${p([w(0.7, 17), w(-0.5, 18)])} ${p([w(0.62, 19), w(-1.15, 20)])} ${p([w(0.4, 21), w(-1.5, 22)])}`,
        `C ${p([w(0.3, 23), w(-1.25, 24)])} ${p([w(0.32, 25), w(-0.9, 26)])} ${p([w(0.28, 27), w(-0.55, 28)])}`,
        "Z",
      ].join(" "),
    };
  }

  // crown
  const origin: Point = { x: lm.forehead.x, y: lm.forehead.y };
  const p = (local: [number, number]) => fmt(place(local, origin, eyeDist, angle));
  const base = -0.15;
  return {
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
  };
}

const DOODLE_KINDS: Exclude<DoodleKind, "random">[] = ["mustache", "horns", "crown", "sunglasses"];

const DRAW_MS = 750;
const HOLD_MS = 220;

export function DoodlePortrait({ src, alt, doodle = "random", ratio = 358 / 460, color }: DoodlePortraitProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const rafRef = useRef<number | null>(null);

  const [box, setBox] = useState({ w: 0, h: 0 });
  const [landmarks, setLandmarks] = useState<Landmarks | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "unavailable">("idle");
  const [active, setActive] = useState(false);
  const [progress, setProgress] = useState(0); // 0..1 draw progress
  const [pen, setPen] = useState<{ x: number; y: number; angle: number } | null>(null);
  const [strokeColor, setStrokeColor] = useState(color ?? "#0d0d0c");
  const [reduceMotion, setReduceMotion] = useState(false);

  const kind = useMemo<Exclude<DoodleKind, "random">>(() => {
    if (doodle !== "random") return doodle;
    const idx = Math.abs(Math.floor(seededWobble(src.length * 7.13) * DOODLE_KINDS.length));
    return DOODLE_KINDS[idx % DOODLE_KINDS.length];
  }, [doodle, src]);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mql.matches);
    const onChange = () => setReduceMotion(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  // Sample average luminance (composited over the card's sprout backdrop,
  // since that's what's actually behind the photo's transparent edges) to
  // pick a stroke colour with good contrast, unless one was passed in.
  useEffect(() => {
    if (color) return;
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.src = src;
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.fillStyle = "#86a14c"; // sprout.6 — the card's backdrop colour
        ctx.fillRect(0, 0, 32, 32);
        ctx.drawImage(img, 0, 0, 32, 32);
        const { data } = ctx.getImageData(0, 0, 32, 32);
        let sum = 0;
        let count = 0;
        for (let i = 0; i < data.length; i += 4) {
          sum += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
          count += 1;
        }
        const avg = sum / count / 255;
        setStrokeColor(avg < 0.45 ? "#39ff14" : "#0d0d0c");
      } catch {
        // canvas can throw on cross-origin taint in some browsers — keep default
      }
    };
  }, [src, color]);

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
        faceLeft: { x: boxW * 0.28, y: boxH * 0.5 },
        faceRight: { x: boxW * 0.72, y: boxH * 0.5 },
      });
      setStatus("unavailable");
    }
  };

  const doodlePath = useMemo(() => (landmarks ? buildDoodle(kind, landmarks) : null), [landmarks, kind]);

  const stopAnimation = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  };

  const animateIn = () => {
    const pathEl = pathRef.current;
    if (!pathEl) return;
    if (reduceMotion) {
      setProgress(1);
      setPen(null);
      return;
    }
    const total = pathEl.getTotalLength();
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / DRAW_MS);
      const eased = 1 - Math.pow(1 - t, 2);
      setProgress(eased);
      const pt = pathEl.getPointAtLength(eased * total);
      const ahead = pathEl.getPointAtLength(Math.min(total, eased * total + 2));
      const angle = Math.atan2(ahead.y - pt.y, ahead.x - pt.x);
      const shakeAmt = (1 - eased) * 0 + 0.6;
      setPen({
        x: pt.x + seededWobble(now * 0.01) * shakeAmt,
        y: pt.y + seededWobble(now * 0.017) * shakeAmt,
        angle,
      });
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        setTimeout(() => setPen(null), HOLD_MS);
      }
    };
    rafRef.current = requestAnimationFrame(step);
  };

  const handleEnter = () => {
    setActive(true);
    void runDetection();
  };

  const handleLeave = () => {
    setActive(false);
    stopAnimation();
    setProgress(0);
    setPen(null);
  };

  useEffect(() => {
    if (active && doodlePath) {
      stopAnimation();
      setProgress(0);
      animateIn();
    }
    return stopAnimation;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, doodlePath, reduceMotion]);

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
          {doodlePath && (
            <>
              <path
                ref={pathRef}
                d={doodlePath.d}
                fill="none"
                stroke={strokeColor}
                strokeWidth={box.w * 0.014}
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  filter:
                    strokeColor === "#39ff14"
                      ? "drop-shadow(0 0 3px rgba(57,255,20,0.65))"
                      : undefined,
                  strokeDasharray: pathRef.current?.getTotalLength() || 1000,
                  strokeDashoffset:
                    (pathRef.current?.getTotalLength() || 1000) * (1 - progress),
                  transition: reduceMotion ? undefined : "stroke-dashoffset 16ms linear",
                }}
              />
              {kind === "crown" &&
                doodlePath.extraDots?.map((dot, i) => (
                  <circle
                    key={i}
                    cx={dot.x}
                    cy={dot.y}
                    r={box.w * 0.012}
                    fill={strokeColor}
                    opacity={progress > 0.9 ? 1 : 0}
                    style={{ transition: "opacity 200ms ease" }}
                  />
                ))}
            </>
          )}

          {pen && (
            <g transform={`translate(${pen.x} ${pen.y}) rotate(${(pen.angle * 180) / Math.PI})`}>
              <path
                d={`M -2 -${box.w * 0.05} L 2 -${box.w * 0.05} L ${box.w * 0.01} ${box.w * 0.02} L 0 ${box.w * 0.03} L -${box.w * 0.01} ${box.w * 0.02} Z`}
                fill={strokeColor}
                stroke="#0d0d0c"
                strokeWidth={0.5}
              />
            </g>
          )}
        </svg>
      )}
    </Box>
  );
}
