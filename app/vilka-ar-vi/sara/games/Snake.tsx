"use client";

import { useEffect, useRef } from "react";

const COLS = 24;
const ROWS = 18;
const WIN_SCORE = 5;
const BASE_CELL = 20;
const BASE_TICK_MS = 130;
const MIN_TICK_MS = 45;

type Point = { x: number; y: number };

type SnakeProps = {
  photos: string[];
  onWin: () => void;
};

export const Snake = ({ photos, onWin }: SnakeProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

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
    let dir: Point = { x: 1, y: 0 };
    let nextDir = dir;
    let score = 0;
    let alive = true;
    let food: Point = { x: 12, y: 8 };
    let foodImage = new Image();

    const randomCell = (): Point => ({
      x: Math.floor(Math.random() * COLS),
      y: Math.floor(Math.random() * ROWS),
    });

    const placeFood = () => {
      food = randomCell();
      const src = photos[Math.floor(Math.random() * photos.length)];
      foodImage = new Image();
      foodImage.src = src;
    };
    placeFood();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowUp" && dir.y === 0) nextDir = { x: 0, y: -1 };
      if (event.key === "ArrowDown" && dir.y === 0) nextDir = { x: 0, y: 1 };
      if (event.key === "ArrowLeft" && dir.x === 0) nextDir = { x: -1, y: 0 };
      if (event.key === "ArrowRight" && dir.x === 0) nextDir = { x: 1, y: 0 };
    };
    window.addEventListener("keydown", onKeyDown);

    const draw = () => {
      ctx.fillStyle = "#0D0D0C";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "#95B354";
      snake.forEach((segment) => {
        ctx.fillRect(segment.x * cell, segment.y * cell, cell - 2, cell - 2);
      });

      if (foodImage.complete && foodImage.naturalWidth > 0) {
        ctx.drawImage(foodImage, food.x * cell, food.y * cell, cell, cell);
      } else {
        ctx.fillStyle = "#EEEDEB";
        ctx.fillRect(food.x * cell, food.y * cell, cell, cell);
      }

      ctx.fillStyle = "#EEEDEB";
      ctx.font = `${Math.max(14, Math.round(cell * 0.7))}px sans-serif`;
      ctx.fillText(`${score} / ${WIN_SCORE}`, 8, canvas.height - 8);
    };

    const step = () => {
      if (!alive) return;
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
        dir = { x: 1, y: 0 };
        nextDir = dir;
        score = 0;
        draw();
        return;
      }

      snake.unshift(head);

      if (head.x === food.x && head.y === food.y) {
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
  }, [photos, onWin]);

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
      <canvas ref={canvasRef} />
    </div>
  );
};
