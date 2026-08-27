"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { Consultant } from "../../consultants/types";
import {
  COLOR_BACKGROUND,
  COLOR_BORDER,
  COLOR_GRID_LINE,
  COLOR_SNAKE,
  GRID_SIZE,
  CELL_PX,
  TICK_MS,
} from "../constants";
import type { Direction, GameStatus, Position } from "../types";
import {
  DIRECTION_VECTORS,
  buildFoodQueue,
  detectSelfCollision,
  getRandomEmptyCell,
  isOppositeDirection,
  isOutOfBounds,
  positionsEqual,
} from "../utils";

const initialSnake = (): Position[] => {
  const midY = Math.floor(GRID_SIZE / 2);
  const midX = Math.floor(GRID_SIZE / 2);
  return [
    { x: midX, y: midY },
    { x: midX - 1, y: midY },
    { x: midX - 2, y: midY },
  ];
};

export const useSnakeGame = (
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  foodConsultants: Consultant[],
  opened: boolean,
) => {
  const [status, setStatus] = useState<GameStatus>("idle");
  const [score, setScore] = useState(0);

  const snakeRef = useRef<Position[]>(initialSnake());
  const directionRef = useRef<Direction>("right");
  const nextDirectionRef = useRef<Direction>("right");
  const foodQueueRef = useRef<Consultant[]>([]);
  const currentFoodRef = useRef<{ position: Position; consultant: Consultant } | null>(
    null,
  );
  const imagesRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const statusRef = useRef<GameStatus>("idle");
  const rafIdRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);

  const setStatusBoth = useCallback((next: GameStatus) => {
    statusRef.current = next;
    setStatus(next);
  }, []);

  const spawnNextFood = useCallback(() => {
    const nextConsultant = foodQueueRef.current.shift();
    if (!nextConsultant) {
      currentFoodRef.current = null;
      setStatusBoth("won");
      return;
    }
    currentFoodRef.current = {
      position: getRandomEmptyCell(snakeRef.current),
      consultant: nextConsultant,
    };
  }, [setStatusBoth]);

  const resetState = useCallback(() => {
    snakeRef.current = initialSnake();
    directionRef.current = "right";
    nextDirectionRef.current = "right";
    foodQueueRef.current = buildFoodQueue(foodConsultants);
    setScore(0);
    spawnNextFood();
  }, [foodConsultants, spawnNextFood]);

  const start = useCallback(() => {
    resetState();
    setStatusBoth("running");
  }, [resetState, setStatusBoth]);

  const restart = useCallback(() => {
    start();
  }, [start]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    ctx.fillStyle = COLOR_BACKGROUND;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = COLOR_GRID_LINE;
    for (let i = 0; i <= GRID_SIZE; i += 1) {
      ctx.beginPath();
      ctx.moveTo(i * CELL_PX, 0);
      ctx.lineTo(i * CELL_PX, canvas.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * CELL_PX);
      ctx.lineTo(canvas.width, i * CELL_PX);
      ctx.stroke();
    }

    ctx.fillStyle = COLOR_SNAKE;
    snakeRef.current.forEach((segment) => {
      ctx.fillRect(
        segment.x * CELL_PX + 1,
        segment.y * CELL_PX + 1,
        CELL_PX - 2,
        CELL_PX - 2,
      );
    });

    const food = currentFoodRef.current;
    if (food) {
      const image = imagesRef.current.get(food.consultant.photo);
      if (image && image.complete) {
        ctx.save();
        ctx.beginPath();
        const cx = food.position.x * CELL_PX + CELL_PX / 2;
        const cy = food.position.y * CELL_PX + CELL_PX / 2;
        ctx.arc(cx, cy, CELL_PX / 2 - 1, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(
          image,
          food.position.x * CELL_PX,
          food.position.y * CELL_PX,
          CELL_PX,
          CELL_PX,
        );
        ctx.restore();
      }
    }

    ctx.strokeStyle = COLOR_BORDER;
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
  }, [canvasRef]);

  const tick = useCallback(() => {
    if (!isOppositeDirection(directionRef.current, nextDirectionRef.current)) {
      directionRef.current = nextDirectionRef.current;
    }
    const vector = DIRECTION_VECTORS[directionRef.current];
    const head = snakeRef.current[0];
    const newHead: Position = { x: head.x + vector.x, y: head.y + vector.y };

    if (isOutOfBounds(newHead) || detectSelfCollision(newHead, snakeRef.current)) {
      setStatusBoth("lost");
      return;
    }

    const ateFood =
      currentFoodRef.current !== null &&
      positionsEqual(newHead, currentFoodRef.current.position);

    snakeRef.current = [newHead, ...snakeRef.current];
    if (ateFood) {
      setScore((prev) => prev + 1);
      spawnNextFood();
    } else {
      snakeRef.current.pop();
    }
  }, [setStatusBoth, spawnNextFood]);

  const loopRef = useRef<(timestamp: number) => void>(() => {});
  useEffect(() => {
    loopRef.current = (timestamp: number) => {
      if (statusRef.current !== "running") return;
      if (timestamp - lastTickRef.current >= TICK_MS) {
        lastTickRef.current = timestamp;
        tick();
      }
      draw();
      if (statusRef.current === "running") {
        rafIdRef.current = requestAnimationFrame((next) => loopRef.current(next));
      }
    };
  }, [draw, tick]);
  const loop = useCallback((timestamp: number) => loopRef.current(timestamp), []);

  useEffect(() => {
    foodConsultants.forEach((consultant) => {
      if (imagesRef.current.has(consultant.photo)) return;
      const image = new Image();
      image.src = `/photos/${consultant.photo}`;
      imagesRef.current.set(consultant.photo, image);
    });
  }, [foodConsultants]);

  useEffect(() => {
    if (!opened) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      const map: Record<string, Direction> = {
        ArrowUp: "up",
        ArrowDown: "down",
        ArrowLeft: "left",
        ArrowRight: "right",
        w: "up",
        s: "down",
        a: "left",
        d: "right",
      };
      const next = map[event.key];
      if (!next) return;
      event.preventDefault();
      nextDirectionRef.current = next;
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [opened]);

  useEffect(() => {
    if (!opened || status !== "running") {
      draw();
      return;
    }
    lastTickRef.current = performance.now();
    rafIdRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [opened, status, loop, draw]);

  return { status, score, total: foodConsultants.length, start, restart };
};
