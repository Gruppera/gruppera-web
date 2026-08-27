"use client";

import { useEffect, useRef } from "react";

import { colorForIndex } from "./palette";

const COLS = 32;
const INITIAL_ROWS = 13; // ~1/5 fewer bubbles than a full 16 rows
const MAX_ROWS = 36;
const MATCH_SIZE = 3;
const BASE_BULLET_SPEED = 9;
const BUBBLE_RADIUS_FACTOR = 0.5; // fills the cell — bubbles touch, no gaps
const AIM_STEP = 0.035; // radians per frame while held
const AIM_MAX = 1.2; // ~69 degrees off straight up, either side

type Cell = number | null; // index into `images`, or null (empty)

type BubblesProps = {
  photos: string[];
  saraPhoto: string;
  onWin: () => void;
};

/**
 * Bubble shooter on a square grid (not hex) so collision/adjacency stay
 * simple. Sara is mixed into the same face pool as everyone else — the
 * bubble about to be fired (which may be her) sits static at the bottom
 * with a green backdrop, aimed with a rotating arrow rather than moving
 * sideways. Landing snaps to the nearest empty cell touching an existing
 * bubble (or the ceiling). Matching 3+ of the same face pops them, and any
 * bubbles left disconnected from the ceiling afterward fall away too.
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

    const images = [...photos, saraPhoto].map((src) => {
      const image = new Image();
      image.src = src;
      return image;
    });

    let width = 400;
    let height = 400;
    let cell = 40;
    let scale = 1;
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

    const cellCenter = (row: number, col: number) => ({
      x: col * cell + cell / 2,
      y: row * cell + cell / 2,
    });

    let aim = 0;
    let aimLeft = false;
    let aimRight = false;
    let alive = true;
    let started = false;

    let flying: { x: number; y: number; vx: number; vy: number; face: number } | null =
      null;
    let nextFace = randomFace();

    const shooterX = () => width / 2;
    const shooterY = () => height - cell / 2 - 4 * scale;

    const onKeyDown = (event: KeyboardEvent) => {
      if (!started) {
        event.preventDefault();
        started = true;
        return;
      }
      if (event.key.startsWith("Arrow") || event.key === " ") {
        event.preventDefault();
      }
      if (event.key === "ArrowLeft") aimLeft = true;
      if (event.key === "ArrowRight") aimRight = true;
      if (event.key === " " && !flying) {
        const speed = BASE_BULLET_SPEED * sizeScale;
        flying = {
          x: shooterX(),
          y: shooterY(),
          vx: Math.sin(aim) * speed,
          vy: -Math.cos(aim) * speed,
          face: nextFace,
        };
        nextFace = randomFace();
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") aimLeft = false;
      if (event.key === "ArrowRight") aimRight = false;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    const onResize = () => applySize();
    window.addEventListener("resize", onResize);

    const neighbors4 = (row: number, col: number) =>
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
        neighbors4(r, c).forEach(([nr, nc]) => {
          if (!seen.has(`${nr},${nc}`)) stack.push([nr, nc]);
        });
      }
      if (group.length >= MATCH_SIZE) {
        group.forEach(([r, c]) => {
          grid[r][c] = null;
        });
      }
    };

    // Bubbles no longer connected to the ceiling (row 0) fall away.
    const dropFloating = () => {
      const reachable: boolean[][] = Array.from({ length: MAX_ROWS }, () =>
        Array(COLS).fill(false),
      );
      const stack: [number, number][] = [];
      for (let col = 0; col < COLS; col += 1) {
        if (grid[0][col] !== null) {
          reachable[0][col] = true;
          stack.push([0, col]);
        }
      }
      while (stack.length > 0) {
        const [r, c] = stack.pop() as [number, number];
        neighbors4(r, c).forEach(([nr, nc]) => {
          if (!reachable[nr][nc] && grid[nr][nc] !== null) {
            reachable[nr][nc] = true;
            stack.push([nr, nc]);
          }
        });
      }
      for (let r = 0; r < MAX_ROWS; r += 1) {
        for (let c = 0; c < COLS; c += 1) {
          if (grid[r][c] !== null && !reachable[r][c]) {
            grid[r][c] = null;
          }
        }
      }
    };

    const radius = () => cell * BUBBLE_RADIUS_FACTOR;

    const settleBullet = (x: number, y: number, face: number) => {
      const row = Math.max(0, Math.min(MAX_ROWS - 1, Math.round((y - cell / 2) / cell)));
      const col = Math.max(0, Math.min(COLS - 1, Math.round((x - cell / 2) / cell)));
      let target: [number, number] | null = grid[row][col] === null ? [row, col] : null;
      if (!target) {
        let bestDist = Infinity;
        for (let dr = -1; dr <= 1; dr += 1) {
          for (let dc = -1; dc <= 1; dc += 1) {
            const rr = row + dr;
            const cc = col + dc;
            if (rr < 0 || rr >= MAX_ROWS || cc < 0 || cc >= COLS) continue;
            if (grid[rr][cc] !== null) continue;
            const center = cellCenter(rr, cc);
            const dist = (center.x - x) ** 2 + (center.y - y) ** 2;
            if (dist < bestDist) {
              bestDist = dist;
              target = [rr, cc];
            }
          }
        }
      }
      if (!target) return;
      const [tr, tc] = target;
      grid[tr][tc] = face;
      popMatches(tr, tc);
      dropFloating();
    };

    let raf = 0;

    const loop = () => {
      if (!alive) return;

      if (started) {
        if (aimLeft) aim = Math.max(-AIM_MAX, aim - AIM_STEP);
        if (aimRight) aim = Math.min(AIM_MAX, aim + AIM_STEP);

        if (flying) {
          const steps = 3;
          for (let i = 0; i < steps && flying; i += 1) {
            flying.x += flying.vx / steps;
            flying.y += flying.vy / steps;

            const r = radius();
            if (flying.x - r <= 0) {
              flying.x = r;
              flying.vx = Math.abs(flying.vx);
            } else if (flying.x + r >= width) {
              flying.x = width - r;
              flying.vx = -Math.abs(flying.vx);
            }

            let landed = flying.y - r <= 0;
            if (!landed) {
              const row = Math.round((flying.y - cell / 2) / cell);
              const col = Math.round((flying.x - cell / 2) / cell);
              for (let dr = -1; dr <= 1 && !landed; dr += 1) {
                for (let dc = -1; dc <= 1 && !landed; dc += 1) {
                  const rr = row + dr;
                  const cc = col + dc;
                  if (rr < 0 || rr >= MAX_ROWS || cc < 0 || cc >= COLS) continue;
                  if (grid[rr][cc] === null) continue;
                  const center = cellCenter(rr, cc);
                  const dist = Math.hypot(center.x - flying.x, center.y - flying.y);
                  if (dist <= r * 1.9) landed = true;
                }
              }
            }

            if (landed) {
              settleBullet(flying.x, flying.y, flying.face);
              flying = null;
            }
          }
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

      const r = radius();
      for (let row = 0; row < MAX_ROWS; row += 1) {
        for (let col = 0; col < COLS; col += 1) {
          const face = grid[row][col];
          if (face === null) continue;
          const { x: cx, y: cy } = cellCenter(row, col);
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

      if (flying) {
        const image = images[flying.face];
        ctx.save();
        ctx.beginPath();
        ctx.arc(flying.x, flying.y, r, 0, Math.PI * 2);
        ctx.clip();
        if (image?.complete && image.naturalWidth > 0) {
          ctx.drawImage(image, flying.x - r, flying.y - r, r * 2, r * 2);
        } else {
          ctx.fillStyle = "#C3CED9";
          ctx.fill();
        }
        ctx.restore();
        ctx.strokeStyle = colorForIndex(flying.face);
        ctx.lineWidth = Math.max(0.75, 1 * scale);
        ctx.beginPath();
        ctx.arc(flying.x, flying.y, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Static shooter: the loaded bubble, always on a green backdrop, plus
      // an arrow showing where it'll go.
      const sx = shooterX();
      const sy = shooterY();
      if (!flying) {
        const image = images[nextFace];
        ctx.save();
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.clip();
        ctx.fillStyle = "#95B354";
        ctx.fill();
        if (image?.complete && image.naturalWidth > 0) {
          ctx.drawImage(image, sx - r, sy - r, r * 2, r * 2);
        }
        ctx.restore();
      }
      ctx.strokeStyle = "#95B354";
      ctx.lineWidth = Math.max(0.75, 1 * scale);
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.stroke();

      const arrowLen = r * 2.2;
      const tipX = sx + Math.sin(aim) * arrowLen;
      const tipY = sy - Math.cos(aim) * arrowLen;
      ctx.strokeStyle = "#EEEDEB";
      ctx.lineWidth = Math.max(1, 1.5 * scale);
      ctx.beginPath();
      ctx.moveTo(sx, sy - r * 1.15);
      ctx.lineTo(tipX, tipY);
      ctx.stroke();
      const headAngle = Math.PI / 7;
      const dirAngle = Math.atan2(tipY - sy, tipX - sx);
      ctx.beginPath();
      ctx.moveTo(tipX, tipY);
      ctx.lineTo(
        tipX - Math.cos(dirAngle - headAngle) * r * 0.5,
        tipY - Math.sin(dirAngle - headAngle) * r * 0.5,
      );
      ctx.moveTo(tipX, tipY);
      ctx.lineTo(
        tipX - Math.cos(dirAngle + headAngle) * r * 0.5,
        tipY - Math.sin(dirAngle + headAngle) * r * 0.5,
      );
      ctx.stroke();

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
