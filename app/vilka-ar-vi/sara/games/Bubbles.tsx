"use client";

import { useEffect, useRef } from "react";

import { colorForIndex } from "./palette";

const COLS = 32;
const INITIAL_ROWS = 16;
const MAX_ROWS = 36;
const MATCH_SIZE = 3;
const BASE_SHOOTER_SPEED = 6;
const BASE_BULLET_SPEED = 9;
const BUBBLE_RADIUS_FACTOR = 0.5; // fills the cell — bubbles touch, no gaps

type Cell = number | null; // index into `images`, or null (empty)

type BubblesProps = {
  photos: string[];
  saraPhoto: string;
  onWin: () => void;
};

/**
 * Simplified bubble-shooter: a square grid (not hex) so column-based
 * collision and 4-directional flood-fill matching stay simple. The shooter
 * picks a column and always fires straight up; matching 3+ of the same face
 * pops them.
 */
export const Bubbles = ({ photos, saraPhoto, onWin }: BubblesProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const images = photos.map((src) => {
      const image = new Image();
      image.src = src;
      return image;
    });
    const saraImage = new Image();
    saraImage.src = saraPhoto;

    let width = 400;
    let height = 400;
    let cell = 40;
    let scale = 1;
    // Movement/shot speed track the canvas' real size, not the grid density
    // — COLS only controls how many (tightly-packed) bubbles fit, and
    // shouldn't make the shooter or bullets feel slower.
    let sizeScale = 1;

    const applySize = () => {
      width = container.clientWidth;
      height = container.clientHeight;
      canvas.width = width;
      canvas.height = height;
      cell = width / COLS;
      scale = cell / 40;
      sizeScale = width / 400;
    };
    applySize();

    const grid: Cell[][] = Array.from({ length: MAX_ROWS }, () =>
      Array.from({ length: COLS }, () => null),
    );
    const randomFace = () => Math.floor(Math.random() * images.length);
    for (let row = 0; row < INITIAL_ROWS; row += 1) {
      for (let col = 0; col < COLS; col += 1) {
        grid[row][col] = randomFace();
      }
    }

    let shooterCol = Math.floor(COLS / 2);
    let moveLeft = false;
    let moveRight = false;
    let alive = true;
    let started = false;

    // Flying bubble state: null when idle at the shooter.
    let flying: { col: number; y: number; face: number } | null = null;
    let nextFace = randomFace();

    const onKeyDown = (event: KeyboardEvent) => {
      if (!started) {
        event.preventDefault();
        started = true;
        return;
      }
      if (event.key.startsWith("Arrow") || event.key === " ") {
        event.preventDefault();
      }
      if (event.key === "ArrowLeft") moveLeft = true;
      if (event.key === "ArrowRight") moveRight = true;
      if (event.key === " ") {
        const col = Math.round(shooterCol);
        if (!flying && grid[0][col] === null) {
          flying = {
            col,
            y: height - cell,
            face: nextFace,
          };
          nextFace = randomFace();
        }
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") moveLeft = false;
      if (event.key === "ArrowRight") moveRight = false;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    const onResize = () => applySize();
    window.addEventListener("resize", onResize);

    const neighbors = (row: number, col: number) =>
      [
        [row - 1, col],
        [row + 1, col],
        [row, col - 1],
        [row, col + 1],
      ].filter(
        ([r, c]) => r >= 0 && r < MAX_ROWS && c >= 0 && c < COLS,
      ) as [number, number][];

    const popMatches = (startRow: number, startCol: number) => {
      const face = grid[startRow][startCol];
      if (face === null) return;
      const seen = new Set<string>();
      const stack: [number, number][] = [[startRow, startCol]];
      const group: [number, number][] = [];
      while (stack.length > 0) {
        const [r, c] = stack.pop() as [number, number];
        const key = `${r},${c}`;
        if (seen.has(key)) continue;
        seen.add(key);
        if (grid[r][c] !== face) continue;
        group.push([r, c]);
        neighbors(r, c).forEach(([nr, nc]) => {
          if (!seen.has(`${nr},${nc}`)) stack.push([nr, nc]);
        });
      }
      if (group.length >= MATCH_SIZE) {
        group.forEach(([r, c]) => {
          grid[r][c] = null;
        });
      }
    };

    let raf = 0;

    const loop = () => {
      if (!alive) return;

      const shooterSpeed = BASE_SHOOTER_SPEED * sizeScale * (COLS / 8);
      const bulletSpeed = BASE_BULLET_SPEED * sizeScale;

      if (started && !flying) {
        if (moveLeft) shooterCol = Math.max(0, shooterCol - 0.15 * shooterSpeed);
        if (moveRight)
          shooterCol = Math.min(COLS - 1, shooterCol + 0.15 * shooterSpeed);
      }

      if (started && flying) {
        flying.y -= bulletSpeed;
        const row = Math.max(0, Math.round(flying.y / cell));
        const landed =
          flying.y <= 0 ||
          (row + 1 < MAX_ROWS && grid[row + 1][flying.col] !== null);
        if (landed) {
          const landingRow = Math.min(MAX_ROWS - 1, Math.max(0, row));
          if (grid[landingRow][flying.col] === null) {
            grid[landingRow][flying.col] = flying.face;
            popMatches(landingRow, flying.col);
          }
          flying = null;
        }
      }

      ctx.fillStyle = "#0D0D0C";
      ctx.fillRect(0, 0, width, height);

      const remainingCount = grid.reduce(
        (sum, r) => sum + r.filter((c) => c !== null).length,
        0,
      );
      if (remainingCount === 0) {
        alive = false;
        onWin();
        return;
      }

      ctx.fillStyle = "#EEEDEB";
      ctx.font = `${Math.max(14, Math.round(16 * scale))}px sans-serif`;
      ctx.fillText(`Kvar: ${remainingCount}`, 8, 20 * scale);

      for (let row = 0; row < MAX_ROWS; row += 1) {
        for (let col = 0; col < COLS; col += 1) {
          const face = grid[row][col];
          if (face === null) continue;
          const cx = col * cell + cell / 2;
          const cy = row * cell + cell / 2;
          const r = cell * BUBBLE_RADIUS_FACTOR;
          const image = images[face];
          ctx.save();
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.clip();
          if (image?.complete && image.naturalWidth > 0) {
            ctx.drawImage(image, cx - r, cy - r, r * 2, r * 2);
          } else {
            ctx.fillStyle = "#C3CED9";
            ctx.fill();
          }
          ctx.restore();
          ctx.strokeStyle = colorForIndex(face);
          ctx.lineWidth = Math.max(0.75, 1 * scale);
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      const shooterCol0 = Math.round(shooterCol);
      const shooterX = shooterCol0 * cell + cell / 2;
      const shooterY = height - cell / 2;

      if (flying) {
        const fx = flying.col * cell + cell / 2;
        const fy = flying.y + cell / 2;
        const r = cell * BUBBLE_RADIUS_FACTOR;
        const image = images[flying.face];
        ctx.save();
        ctx.beginPath();
        ctx.arc(fx, fy, r, 0, Math.PI * 2);
        ctx.clip();
        if (image?.complete && image.naturalWidth > 0) {
          ctx.drawImage(image, fx - r, fy - r, r * 2, r * 2);
        } else {
          ctx.fillStyle = "#C3CED9";
          ctx.fill();
        }
        ctx.restore();
        ctx.strokeStyle = colorForIndex(flying.face);
        ctx.lineWidth = Math.max(0.75, 1 * scale);
        ctx.beginPath();
        ctx.arc(fx, fy, r, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        // Sara is the shooter — same size as a regular bubble, but (unlike
        // the others) drawn with a green backdrop so she stands out at a
        // glance while she's "holding" the next bubble to fire.
        const r = cell * BUBBLE_RADIUS_FACTOR;
        ctx.save();
        ctx.beginPath();
        ctx.arc(shooterX, shooterY, r, 0, Math.PI * 2);
        ctx.clip();
        ctx.fillStyle = "#95B354";
        ctx.fill();
        if (saraImage.complete && saraImage.naturalWidth > 0) {
          ctx.drawImage(saraImage, shooterX - r, shooterY - r, r * 2, r * 2);
        }
        ctx.restore();
        ctx.strokeStyle = "#95B354";
        ctx.lineWidth = Math.max(0.75, 1 * scale);
        ctx.beginPath();
        ctx.arc(shooterX, shooterY, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      if (!started) {
        ctx.fillStyle = "rgba(13, 13, 12, 0.55)";
        ctx.fillRect(0, 0, width, height);
      }

      raf = window.requestAnimationFrame(loop);
    };

    raf = window.requestAnimationFrame(loop);

    return () => {
      alive = false;
      window.cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
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
        style={{
          width: "100%",
          height: "100%",
          border: "2px solid #95B354",
          boxSizing: "border-box",
        }}
      />
    </div>
  );
};
