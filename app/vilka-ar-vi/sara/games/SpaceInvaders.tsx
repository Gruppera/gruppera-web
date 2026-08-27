"use client";

import { useEffect, useRef } from "react";

const BASE_WIDTH = 400;
const BASE_HEIGHT = 320;
const BASE_INVADER_SIZE = 32;
const COLS = 6;
const ROWS = 3;
const BASE_PLAYER_WIDTH = 40;
const BASE_PLAYER_SPEED = 5;
const BASE_BULLET_SPEED = 7;
const BASE_INVADER_SPEED = 0.4;
const BASE_INVADER_DROP = 16;

type Invader = { x: number; y: number; alive: boolean; image: HTMLImageElement };
type Bullet = { x: number; y: number };

type SpaceInvadersProps = {
  photos: string[];
  onWin: () => void;
};

export const SpaceInvaders = ({ photos, onWin }: SpaceInvadersProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = BASE_WIDTH;
    let height = BASE_HEIGHT;
    let scale = 1;

    const applySize = () => {
      width = container.clientWidth;
      height = container.clientHeight;
      canvas.width = width;
      canvas.height = height;
      scale = Math.min(width / BASE_WIDTH, height / BASE_HEIGHT);
    };
    applySize();

    // Invader grid spans a fixed share of the canvas width so it fills large
    // screens instead of clumping in a corner scaled from the small base size.
    let invaderSize = BASE_INVADER_SIZE * scale;
    const playerWidth = () => BASE_PLAYER_WIDTH * scale;

    let playerX = width / 2 - playerWidth() / 2;
    let moveLeft = false;
    let moveRight = false;
    let bullets: Bullet[] = [];
    let direction = 1;
    let alive = true;

    const invaders: Invader[] = [];
    const buildInvaders = () => {
      invaders.length = 0;
      const usableWidth = width * 0.85;
      const colSlot = usableWidth / COLS;
      const size = Math.min(colSlot * 0.7, height * 0.12);
      invaderSize = size;
      const gap = colSlot - size;
      const marginX = (width - usableWidth) / 2;
      const marginY = 20 * scale;
      for (let row = 0; row < ROWS; row += 1) {
        for (let col = 0; col < COLS; col += 1) {
          const image = new Image();
          image.src = photos[(row * COLS + col) % photos.length];
          invaders.push({
            x: marginX + col * colSlot + gap / 2,
            y: marginY + row * (size + gap),
            alive: true,
            image,
          });
        }
      }
    };
    buildInvaders();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") moveLeft = true;
      if (event.key === "ArrowRight") moveRight = true;
      if (event.key === " ") {
        event.preventDefault();
        bullets.push({ x: playerX + playerWidth() / 2, y: height - 30 * scale });
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") moveLeft = false;
      if (event.key === "ArrowRight") moveRight = false;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    const onResize = () => {
      applySize();
      buildInvaders();
    };
    window.addEventListener("resize", onResize);

    let raf = 0;

    const loop = () => {
      if (!alive) return;

      const size = invaderSize;
      const pWidth = playerWidth();
      const playerSpeed = BASE_PLAYER_SPEED * scale;
      const bulletSpeed = BASE_BULLET_SPEED * scale;
      const invaderSpeed = BASE_INVADER_SPEED * scale;
      const invaderDrop = BASE_INVADER_DROP * scale;

      if (moveLeft) playerX = Math.max(0, playerX - playerSpeed);
      if (moveRight) playerX = Math.min(width - pWidth, playerX + playerSpeed);

      const living = invaders.filter((invader) => invader.alive);
      let hitEdge = false;
      living.forEach((invader) => {
        invader.x += invaderSpeed * direction;
        if (invader.x <= 0 || invader.x >= width - size) hitEdge = true;
      });
      if (hitEdge) {
        direction *= -1;
        living.forEach((invader) => {
          invader.y += invaderDrop;
        });
      }

      bullets = bullets
        .map((bullet) => ({ ...bullet, y: bullet.y - bulletSpeed }))
        .filter((bullet) => bullet.y > 0);

      bullets.forEach((bullet) => {
        invaders.forEach((invader) => {
          if (
            invader.alive &&
            bullet.x > invader.x &&
            bullet.x < invader.x + size &&
            bullet.y > invader.y &&
            bullet.y < invader.y + size
          ) {
            invader.alive = false;
            bullet.y = -100;
          }
        });
      });

      const reachedBottom = living.some(
        (invader) => invader.y + size >= height - 40 * scale,
      );

      ctx.fillStyle = "#0D0D0C";
      ctx.fillRect(0, 0, width, height);

      invaders.forEach((invader) => {
        if (!invader.alive) return;
        if (invader.image.complete && invader.image.naturalWidth > 0) {
          ctx.drawImage(invader.image, invader.x, invader.y, size, size);
        } else {
          ctx.fillStyle = "#C3CED9";
          ctx.fillRect(invader.x, invader.y, size, size);
        }
      });

      ctx.fillStyle = "#95B354";
      bullets.forEach((bullet) => {
        ctx.fillRect(bullet.x - 2 * scale, bullet.y, 4 * scale, 10 * scale);
      });

      ctx.fillStyle = "#EEEDEB";
      ctx.fillRect(playerX, height - 20 * scale, pWidth, 12 * scale);

      const remaining = invaders.filter((invader) => invader.alive).length;
      ctx.fillStyle = "#EEEDEB";
      ctx.font = `${Math.max(14, Math.round(16 * scale))}px sans-serif`;
      ctx.fillText(`Kvar: ${remaining}`, 8, 20 * scale);

      if (remaining === 0) {
        alive = false;
        onWin();
        return;
      }

      if (reachedBottom) {
        invaders.forEach((invader, index) => {
          invader.alive = true;
          invader.y = Math.floor(index / COLS) * (size + 12 * scale) + 20 * scale;
        });
        direction = 1;
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
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
};
