"use client";

import { useEffect, useRef } from "react";

const FACE_COUNT = 60;
const DURATION_MS = 2200;

type Drop = {
  x: number;
  y: number;
  vy: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
};

/**
 * The losing counterpart to Confetti — a brief rain of sad faces when a
 * game's loss threshold is hit (see LOSE_* constants in each game). Purely
 * decorative and self-dismissing; it doesn't pause or reset anything itself,
 * the game underneath has already reset its own round state by the time
 * this fires.
 */
export const SadRain = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const drops: Drop[] = Array.from({ length: FACE_COUNT }, () => ({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * canvas.height * 0.5,
      vy: 2.5 + Math.random() * 2.5,
      size: 18 + Math.random() * 16,
      rotation: (Math.random() - 0.5) * 0.6,
      rotationSpeed: (Math.random() - 0.5) * 0.02,
    }));

    const start = Date.now();
    let raf = 0;

    const loop = () => {
      const elapsed = Date.now() - start;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      drops.forEach((drop) => {
        drop.y += drop.vy;
        drop.rotation += drop.rotationSpeed;
        ctx.save();
        ctx.translate(drop.x, drop.y);
        ctx.rotate(drop.rotation);
        ctx.font = `${drop.size}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("😢", 0, 0);
        ctx.restore();
      });

      if (elapsed < DURATION_MS) {
        raf = window.requestAnimationFrame(loop);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };
    raf = window.requestAnimationFrame(loop);

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
      }}
    />
  );
};
