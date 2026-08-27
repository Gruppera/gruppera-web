"use client";

import { useEffect, useRef } from "react";

import { colorForIndex } from "./palette";

const COLS = 24;
const ROWS = 18;
const BASE_CELL = 20;
const BASE_TICK_MS = 190;
const MIN_TICK_MS = 70;

type Point = { x: number; y: number };

type SnakeProps = {
  photos: string[];
  saraPhoto: string;
  onWin: () => void;
};

/**
 * Sara is always the head. Body segments are the consultants she's eaten so
 * far, in order (most recent right behind the head). Goal: eat everyone.
 */
export const Snake = ({ photos, saraPhoto, onWin }: SnakeProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const WIN_SCORE = photos.length;
    const saraImage = new Image();
    saraImage.src = saraPhoto;
    const foodImages = photos.map((src) => {
      const image = new Image();
      image.src = src;
      return image;
    });

    let cell = BASE_CELL;
    let tickMs = BASE_TICK_MS;

    const resize = () => {
      const availW = container.clientWidth;
      const availH = container.clientHeight;
      cell = Math.max(8, Math.floor(Math.min(availW / COLS, availH / ROWS)));
      canvas.width = cell * COLS;
      canvas.height = cell * ROWS;
      const scale = cell / BASE_CELL;
      tickMs = Math.max(MIN_TICK_MS, Math.round(BASE_TICK_MS / scale));
    };
    resize();
    window.addEventListener("resize", resize);

    let snake: Point[] = [{ x: 8, y: 8 }];
    // segmentFaces[i] is the eaten-face index for snake[i + 1] (the head,
    // snake[0], has no entry — it's always drawn as Sara).
    let segmentFaces: number[] = [];
    let eaten = new Set<number>();
    let dir: Point = { x: 1, y: 0 };
    let nextDir = dir;
    let score = 0;
    let alive = true;
    let started = false;
    let food: Point = { x: 12, y: 8 };
    let foodIndex = 0;

    const randomCell = (): Point => ({
      x: Math.floor(Math.random() * COLS),
      y: Math.floor(Math.random() * ROWS),
    });

    const placeFood = () => {
      food = randomCell();
      const remaining = photos
        .map((_, index) => index)
        .filter((index) => !eaten.has(index));
      foodIndex = remaining[Math.floor(Math.random() * remaining.length)];
    };
    placeFood();

    const onKeyDown = (event: KeyboardEvent) => {
      if (!started) {
        event.preventDefault();
        started = true;
        return;
      }
      if (event.key.startsWith("Arrow")) event.preventDefault();
      if (event.key === "ArrowUp" && dir.y === 0) nextDir = { x: 0, y: -1 };
      if (event.key === "ArrowDown" && dir.y === 0) nextDir = { x: 0, y: 1 };
      if (event.key === "ArrowLeft" && dir.x === 0) nextDir = { x: -1, y: 0 };
      if (event.key === "ArrowRight" && dir.x === 0) nextDir = { x: 1, y: 0 };
    };
    window.addEventListener("keydown", onKeyDown);

    const drawPortrait = (
      cx: number,
      cy: number,
      r: number,
      image: HTMLImageElement,
      borderColor: string,
    ) => {
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.clip();
      if (image.complete && image.naturalWidth > 0) {
        ctx.drawImage(image, cx - r, cy - r, r * 2, r * 2);
      } else {
        ctx.fillStyle = "#C3CED9";
        ctx.fill();
      }
      ctx.restore();
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = Math.max(0.75, 1 * (cell / BASE_CELL));
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    };

    const draw = () => {
      ctx.fillStyle = "#0D0D0C";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const r = cell / 2 - 1;
      snake.forEach((segment, index) => {
        const cx = segment.x * cell + cell / 2;
        const cy = segment.y * cell + cell / 2;
        if (index === 0) {
          drawPortrait(cx, cy, r, saraImage, "#E0CCBE");
        } else {
          const faceIndex = segmentFaces[index - 1];
          drawPortrait(cx, cy, r, foodImages[faceIndex], colorForIndex(faceIndex));
        }
      });

      const fcx = food.x * cell + cell / 2;
      const fcy = food.y * cell + cell / 2;
      drawPortrait(fcx, fcy, r, foodImages[foodIndex], colorForIndex(foodIndex));

      ctx.fillStyle = "#EEEDEB";
      ctx.font = `${Math.max(14, Math.round(cell * 0.7))}px sans-serif`;
      ctx.fillText(`${score} / ${WIN_SCORE}`, 8, canvas.height - 8);

      if (!started) {
        ctx.fillStyle = "rgba(13, 13, 12, 0.55)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    };

    const step = () => {
      if (!alive || !started) return;
      dir = nextDir;
      const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

      if (
        head.x < 0 ||
        head.y < 0 ||
        head.x >= COLS ||
        head.y >= ROWS ||
        snake.some((segment) => segment.x === head.x && segment.y === head.y)
      ) {
        snake = [{ x: 8, y: 8 }];
        segmentFaces = [];
        eaten = new Set<number>();
        dir = { x: 1, y: 0 };
        nextDir = dir;
        score = 0;
        started = false;
        placeFood();
        draw();
        return;
      }

      snake.unshift(head);

      if (head.x === food.x && head.y === food.y) {
        segmentFaces.unshift(foodIndex);
        eaten.add(foodIndex);
        score += 1;
        if (score >= WIN_SCORE) {
          alive = false;
          draw();
          onWin();
          return;
        }
        placeFood();
      } else {
        snake.pop();
      }

      draw();
    };

    draw();
    let interval = window.setInterval(step, tickMs);
    const restartInterval = () => {
      window.clearInterval(interval);
      interval = window.setInterval(step, tickMs);
    };
    const onResize = () => {
      resize();
      restartInterval();
      draw();
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", resize);
      window.removeEventListener("resize", onResize);
    };
  }, [photos, saraPhoto, onWin]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ border: "2px solid #95B354", boxSizing: "content-box" }}
      />
    </div>
  );
};
