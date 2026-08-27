"use client";

import { useEffect, useRef } from "react";

const COLORS = ["#95B354", "#EEEDEB", "#C3CED9", "#824529", "#757263"];
const PIECE_COUNT = 140;
const DURATION_MS = 4000;

type Piece = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
};

/**
 * Fire-and-forget confetti burst covering the viewport. Purely decorative —
 * stops updating itself after DURATION_MS and never blocks pointer events
 * (the celebration overlay handles its own click-to-dismiss).
 */
export const Confetti = () => {
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

    const pieces: Piece[] = Array.from({ length: PIECE_COUNT }, () => ({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * canvas.height * 0.5,
      vx: (Math.random() - 0.5) * 3,
      vy: 2 + Math.random() * 3,
      size: 6 + Math.random() * 8,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.2,
    }));

    const start = Date.now();
    let raf = 0;

    const loop = () => {
      const elapsed = Date.now() - start;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      pieces.forEach((piece) => {
        piece.x += piece.vx;
        piece.y += piece.vy;
        piece.rotation += piece.rotationSpeed;
        ctx.save();
        ctx.translate(piece.x, piece.y);
        ctx.rotate(piece.rotation);
        ctx.fillStyle = piece.color;
        ctx.fillRect(-piece.size / 2, -piece.size / 4, piece.size, piece.size / 2);
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
