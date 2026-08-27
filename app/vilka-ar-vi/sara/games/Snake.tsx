"use client";

import { useEffect, useRef } from "react";
import { Text } from "@mantine/core";

const CELL = 20;
const COLS = 20;
const ROWS = 16;
const WIN_SCORE = 5;
const TICK_MS = 130;

type Point = { x: number; y: number };

type SnakeProps = {
  photos: string[];
  onWin: () => void;
};

export const Snake = ({ photos, onWin }: SnakeProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

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
      ctx.fillRect(0, 0, COLS * CELL, ROWS * CELL);

      ctx.fillStyle = "#95B354";
      snake.forEach((segment) => {
        ctx.fillRect(segment.x * CELL, segment.y * CELL, CELL - 2, CELL - 2);
      });

      if (foodImage.complete && foodImage.naturalWidth > 0) {
        ctx.drawImage(foodImage, food.x * CELL, food.y * CELL, CELL, CELL);
      } else {
        ctx.fillStyle = "#EEEDEB";
        ctx.fillRect(food.x * CELL, food.y * CELL, CELL, CELL);
      }

      ctx.fillStyle = "#EEEDEB";
      ctx.font = "14px sans-serif";
      ctx.fillText(`${score} / ${WIN_SCORE}`, 8, ROWS * CELL - 8);
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
    const interval = window.setInterval(step, TICK_MS);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [photos, onWin]);

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={COLS * CELL}
        height={ROWS * CELL}
        style={{ width: "100%", maxWidth: COLS * CELL, display: "block" }}
      />
      <Text c="dimmed" size="sm" mt="xs">
        Pilarna styr. Ät {WIN_SCORE} kollegor för att vinna.
      </Text>
    </div>
  );
};
