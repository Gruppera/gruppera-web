import type { Consultant } from "../consultants/types";
import { GRID_SIZE } from "./constants";
import type { Direction, Position } from "./types";

export const DIRECTION_VECTORS: Record<Direction, Position> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const OPPOSITES: Record<Direction, Direction> = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};

export const isOppositeDirection = (a: Direction, b: Direction): boolean =>
  OPPOSITES[a] === b;

export const shuffle = <T,>(items: T[]): T[] => {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

export const buildFoodQueue = (consultants: Consultant[]): Consultant[] =>
  shuffle(consultants);

export const getRandomEmptyCell = (occupied: Position[]): Position => {
  const occupiedKeys = new Set(occupied.map((cell) => `${cell.x},${cell.y}`));
  const empty: Position[] = [];
  for (let x = 0; x < GRID_SIZE; x += 1) {
    for (let y = 0; y < GRID_SIZE; y += 1) {
      if (!occupiedKeys.has(`${x},${y}`)) {
        empty.push({ x, y });
      }
    }
  }
  return empty[Math.floor(Math.random() * empty.length)];
};

export const positionsEqual = (a: Position, b: Position): boolean =>
  a.x === b.x && a.y === b.y;

export const isOutOfBounds = (position: Position): boolean =>
  position.x < 0 ||
  position.y < 0 ||
  position.x >= GRID_SIZE ||
  position.y >= GRID_SIZE;

export const detectSelfCollision = (
  head: Position,
  segments: Position[],
): boolean => segments.some((segment) => positionsEqual(segment, head));
