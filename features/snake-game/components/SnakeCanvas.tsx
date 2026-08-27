"use client";

import { Box } from "@mantine/core";
import type { RefObject } from "react";

import { CANVAS_PX } from "../constants";

type SnakeCanvasProps = {
  canvasRef: RefObject<HTMLCanvasElement | null>;
};

export const SnakeCanvas = ({ canvasRef }: SnakeCanvasProps) => (
  <Box
    style={{
      borderRadius: "var(--mantine-radius-md)",
      overflow: "hidden",
      width: CANVAS_PX,
      maxWidth: "100%",
    }}
  >
    <canvas
      ref={canvasRef}
      width={CANVAS_PX}
      height={CANVAS_PX}
      style={{ display: "block", width: "100%", height: "auto" }}
    />
  </Box>
);
