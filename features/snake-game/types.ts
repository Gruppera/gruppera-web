import type { Consultant } from "../consultants/types";

export type Position = { x: number; y: number };

export type Direction = "up" | "down" | "left" | "right";

export type GameStatus = "idle" | "running" | "won" | "lost";

export type FoodItem = {
  position: Position;
  consultant: Consultant;
};
