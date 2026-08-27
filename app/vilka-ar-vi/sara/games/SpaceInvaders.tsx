"use client";

import { useEffect, useRef } from "react";
import { Text } from "@mantine/core";

const WIDTH = 400;
const HEIGHT = 320;
const INVADER_SIZE = 32;
const COLS = 6;
const ROWS = 3;
const PLAYER_WIDTH = 40;
const PLAYER_SPEED = 5;
const BULLET_SPEED = 7;
const INVADER_SPEED = 0.4;
const INVADER_DROP = 16;

type Invader = { x: number; y: number; alive: boolean; image: HTMLImageElement };
type Bullet = { x: number; y: number };

type SpaceInvadersProps = {
  photos: string[];
  onWin: () => void;
};

export const SpaceInvaders = ({ photos, onWin }: SpaceInvadersProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let playerX = WIDTH / 2 - PLAYER_WIDTH / 2;
    let moveLeft = false;
    let moveRight = false;
    let bullets: Bullet[] = [];
    let direction = 1;
    let alive = true;

    const invaders: Invader[] = [];
    for (let row = 0; row < ROWS; row += 1) {
      for (let col = 0; col < COLS; col += 1) {
        const image = new Image();
        image.src = photos[(row * COLS + col) % photos.length];
        invaders.push({
          x: col * (INVADER_SIZE + 12) + 24,
          y: row * (INVADER_SIZE + 12) + 20,
          alive: true,
          image,
        });
      }
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") moveLeft = true;
      if (event.key === "ArrowRight") moveRight = true;
      if (event.key === " ") {
        event.preventDefault();
        bullets.push({ x: playerX + PLAYER_WIDTH / 2, y: HEIGHT - 30 });
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") moveLeft = false;
      if (event.key === "ArrowRight") moveRight = false;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    let raf = 0;

    const loop = () => {
      if (!alive) return;

      if (moveLeft) playerX = Math.max(0, playerX - PLAYER_SPEED);
      if (moveRight)
        playerX = Math.min(WIDTH - PLAYER_WIDTH, playerX + PLAYER_SPEED);

      const living = invaders.filter((invader) => invader.alive);
      let hitEdge = false;
      living.forEach((invader) => {
        invader.x += INVADER_SPEED * direction;
        if (invader.x <= 0 || invader.x >= WIDTH - INVADER_SIZE) hitEdge = true;
      });
      if (hitEdge) {
        direction *= -1;
        living.forEach((invader) => {
          invader.y += INVADER_DROP;
        });
      }

      bullets = bullets
        .map((bullet) => ({ ...bullet, y: bullet.y - BULLET_SPEED }))
        .filter((bullet) => bullet.y > 0);

      bullets.forEach((bullet) => {
        invaders.forEach((invader) => {
          if (
            invader.alive &&
            bullet.x > invader.x &&
            bullet.x < invader.x + INVADER_SIZE &&
            bullet.y > invader.y &&
            bullet.y < invader.y + INVADER_SIZE
          ) {
            invader.alive = false;
            bullet.y = -100;
          }
        });
      });

      const reachedBottom = living.some(
        (invader) => invader.y + INVADER_SIZE >= HEIGHT - 40,
      );

      ctx.fillStyle = "#0D0D0C";
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      invaders.forEach((invader) => {
        if (!invader.alive) return;
        if (invader.image.complete && invader.image.naturalWidth > 0) {
          ctx.drawImage(invader.image, invader.x, invader.y, INVADER_SIZE, INVADER_SIZE);
        } else {
          ctx.fillStyle = "#C3CED9";
          ctx.fillRect(invader.x, invader.y, INVADER_SIZE, INVADER_SIZE);
        }
      });

      ctx.fillStyle = "#95B354";
      bullets.forEach((bullet) => {
        ctx.fillRect(bullet.x - 2, bullet.y, 4, 10);
      });

      ctx.fillStyle = "#EEEDEB";
      ctx.fillRect(playerX, HEIGHT - 20, PLAYER_WIDTH, 12);

      const remaining = invaders.filter((invader) => invader.alive).length;
      ctx.fillStyle = "#EEEDEB";
      ctx.font = "14px sans-serif";
      ctx.fillText(`Kvar: ${remaining}`, 8, 16);

      if (remaining === 0) {
        alive = false;
        onWin();
        return;
      }

      if (reachedBottom) {
        invaders.forEach((invader) => {
          invader.alive = true;
          const index = invaders.indexOf(invader);
          invader.y = Math.floor(index / COLS) * (INVADER_SIZE + 12) + 20;
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
    };
  }, [photos, onWin]);

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        style={{ width: "100%", maxWidth: WIDTH, display: "block" }}
      />
      <Text c="dimmed" size="sm" mt="xs">
        Pilarna flyttar, mellanslag skjuter. Skjut ner alla för att vinna.
      </Text>
    </div>
  );
};
