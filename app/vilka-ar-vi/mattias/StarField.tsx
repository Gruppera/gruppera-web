"use client";

import { useEffect, useRef } from "react";

const STAR_COUNT = 250;

type Star = {
  x: number;
  y: number;
  radius: number;
  speed: number;
};

const createStar = (width: number, height: number): Star => ({
  x: Math.random() * width,
  y: Math.random() * height,
  radius: Math.random() * 1.5 + 0.5,
  speed: Math.random() * 60 + 20,
});

export const StarField = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rootStyle = getComputedStyle(document.documentElement);
    const backgroundColor = rootStyle
      .getPropertyValue("--mantine-color-grafite-7")
      .trim();
    const starColors = [
      rootStyle.getPropertyValue("--mantine-color-chamonix-0").trim(),
      rootStyle.getPropertyValue("--mantine-color-sprout-4").trim(),
    ];

    let stars: Star[] = [];
    let width = 0;
    let height = 0;
    let animationFrame = 0;
    let lastTime = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      stars = Array.from({ length: STAR_COUNT }, () =>
        createStar(width, height),
      );
    };

    const drawFrame = () => {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);
      stars.forEach((star, index) => {
        ctx.beginPath();
        ctx.fillStyle = starColors[index % starColors.length];
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    resize();
    drawFrame();

    const tick = (time: number) => {
      const delta = lastTime ? (time - lastTime) / 1000 : 0;
      lastTime = time;

      stars.forEach((star) => {
        star.x -= star.speed * delta;
        if (star.x < -star.radius) {
          star.x = width + star.radius;
          star.y = Math.random() * height;
        }
      });

      drawFrame();
      animationFrame = requestAnimationFrame(tick);
    };

    if (!prefersReducedMotion) {
      animationFrame = requestAnimationFrame(tick);
    }

    // Tracks the canvas's own rendered box, which stretches to the full
    // height of the page content (see the `position: relative` wrapper in
    // page.tsx) — so this catches both window resizes and content reflow.
    const resizeObserver = new ResizeObserver(() => {
      resize();
      if (prefersReducedMotion) drawFrame();
    });
    resizeObserver.observe(canvas);

    return () => {
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
};
