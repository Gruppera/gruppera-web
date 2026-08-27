"use client";

import { useEffect, useRef } from "react";

const BASE_WIDTH = 400;
const BASE_HEIGHT = 320;
const BASE_INVADER_SIZE = 20;
const COLS = 6;
const ROWS = 4;
const BASE_PLAYER_WIDTH = 40;
const BASE_PLAYER_SPEED = 5;
const BASE_BULLET_SPEED = 7;
const BASE_ENEMY_BULLET_SPEED = 4;
const BASE_INVADER_SPEED = 0.4;
const BASE_INVADER_DROP = 16;
const VOLLEY_MIN_INTERVAL = 55; // frames
const VOLLEY_MAX_INTERVAL = 110;
const VOLLEY_MAX_SHOOTERS = 3;
const START_LIVES = 3;

type Invader = {
  x: number;
  y: number;
  alive: boolean;
  image: HTMLImageElement;
  jitterX: number;
  jitterY: number;
};
type Bullet = { x: number; y: number };

type SpaceInvadersProps = {
  photos: string[];
  playerPhoto: string;
  onWin: () => void;
  onLose: () => void;
};

export const SpaceInvaders = ({
  photos,
  playerPhoto,
  onWin,
  onLose,
}: SpaceInvadersProps) => {
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

    const playerImage = new Image();
    playerImage.src = playerPhoto;

    let playerX = width / 2 - playerWidth() / 2;
    let moveLeft = false;
    let moveRight = false;
    let bullets: Bullet[] = [];
    let enemyBullets: Bullet[] = [];
    let direction = 1;
    let alive = true;
    let started = false;
    let lives = START_LIVES;
    let volleyCooldown =
      VOLLEY_MIN_INTERVAL +
      Math.random() * (VOLLEY_MAX_INTERVAL - VOLLEY_MIN_INTERVAL);

    const invaders: Invader[] = [];
    const buildInvaders = () => {
      invaders.length = 0;
      const usableWidth = width * 0.9;
      const colSlot = usableWidth / COLS;
      const size = Math.min(colSlot, height * 0.1);
      invaderSize = size;
      const marginX = (width - usableWidth) / 2;
      // Four tight rows right at the top, touching — no gap, no jitter, so
      // they read as a solid block like the classic formation.
      const marginY = 4 * scale;
      for (let row = 0; row < ROWS; row += 1) {
        for (let col = 0; col < COLS; col += 1) {
          const photoIndex = (row * COLS + col) % photos.length;
          const image = new Image();
          image.src = photos[photoIndex];
          invaders.push({
            x: marginX + col * colSlot,
            y: marginY + row * size,
            alive: true,
            image,
            jitterX: 0,
            jitterY: 0,
          });
        }
      }
    };
    buildInvaders();

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

    const resetWave = () => {
      buildInvaders();
      direction = 1;
      enemyBullets = [];
      bullets = [];
    };

    let raf = 0;

    const loop = () => {
      if (!alive) return;

      const size = invaderSize;
      const pWidth = playerWidth();
      const pHeight = 16 * scale;
      const playerY = height - 20 * scale;
      const playerSpeed = BASE_PLAYER_SPEED * scale;
      const bulletSpeed = BASE_BULLET_SPEED * scale;
      const enemyBulletSpeed = BASE_ENEMY_BULLET_SPEED * scale;
      const invaderSpeed = BASE_INVADER_SPEED * scale;
      const invaderDrop = BASE_INVADER_DROP * scale;

      let playerHit = false;
      let reachedBottom = false;

      if (started) {
        if (moveLeft) playerX = Math.max(0, playerX - playerSpeed);
        if (moveRight) playerX = Math.min(width - pWidth, playerX + playerSpeed);

        const living = invaders.filter((invader) => invader.alive);
        let hitEdge = false;
        living.forEach((invader) => {
          invader.x += invaderSpeed * direction;
          const drawX = invader.x + invader.jitterX;
          if (drawX <= 0 || drawX >= width - size) hitEdge = true;
        });
        if (hitEdge) {
          direction *= -1;
          living.forEach((invader) => {
            invader.y += invaderDrop;
          });
        }

        // Invaders fire in occasional volleys of 1-3 shooters, not all at
        // once — pick a few random living invaders each time the cooldown
        // elapses, rather than rolling a chance per invader per frame.
        volleyCooldown -= 1;
        if (volleyCooldown <= 0 && living.length > 0) {
          volleyCooldown =
            VOLLEY_MIN_INTERVAL +
            Math.random() * (VOLLEY_MAX_INTERVAL - VOLLEY_MIN_INTERVAL);
          const shooterCount = Math.min(
            living.length,
            1 + Math.floor(Math.random() * VOLLEY_MAX_SHOOTERS),
          );
          const shuffled = [...living].sort(() => Math.random() - 0.5);
          shuffled.slice(0, shooterCount).forEach((invader) => {
            enemyBullets.push({
              x: invader.x + invader.jitterX + size / 2,
              y: invader.y + invader.jitterY + size,
            });
          });
        }

        bullets = bullets
          .map((bullet) => ({ ...bullet, y: bullet.y - bulletSpeed }))
          .filter((bullet) => bullet.y > 0);

        enemyBullets = enemyBullets
          .map((bullet) => ({ ...bullet, y: bullet.y + enemyBulletSpeed }))
          .filter((bullet) => bullet.y < height);

        bullets.forEach((bullet) => {
          invaders.forEach((invader) => {
            const ix = invader.x + invader.jitterX;
            const iy = invader.y + invader.jitterY;
            if (
              invader.alive &&
              bullet.x > ix &&
              bullet.x < ix + size &&
              bullet.y > iy &&
              bullet.y < iy + size
            ) {
              invader.alive = false;
              bullet.y = -100;
            }
          });
        });

        enemyBullets.forEach((bullet) => {
          if (
            bullet.x > playerX &&
            bullet.x < playerX + pWidth &&
            bullet.y > playerY &&
            bullet.y < playerY + pHeight
          ) {
            playerHit = true;
            bullet.y = height + 100;
          }
        });

        reachedBottom = living.some(
          (invader) => invader.y + invader.jitterY + size >= playerY,
        );
      }

      ctx.fillStyle = "#0D0D0C";
      ctx.fillRect(0, 0, width, height);

      invaders.forEach((invader) => {
        if (!invader.alive) return;
        const ix = invader.x + invader.jitterX;
        const iy = invader.y + invader.jitterY;
        const icx = ix + size / 2;
        const icy = iy + size / 2;
        const ir = size / 2;
        if (invader.image.complete && invader.image.naturalWidth > 0) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(icx, icy, ir, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(invader.image, ix, iy, size, size);
          ctx.restore();
        } else {
          ctx.fillStyle = "#C3CED9";
          ctx.beginPath();
          ctx.arc(icx, icy, ir, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.strokeStyle = "#95B354";
        ctx.lineWidth = Math.max(0.75, 0.9 * scale);
        ctx.beginPath();
        ctx.arc(icx, icy, ir, 0, Math.PI * 2);
        ctx.stroke();
      });

      ctx.fillStyle = "#95B354";
      bullets.forEach((bullet) => {
        ctx.fillRect(bullet.x - 2 * scale, bullet.y, 4 * scale, 10 * scale);
      });
      ctx.fillStyle = "#CC5B4B";
      enemyBullets.forEach((bullet) => {
        ctx.fillRect(bullet.x - 2 * scale, bullet.y, 4 * scale, 10 * scale);
      });

      if (playerImage.complete && playerImage.naturalWidth > 0) {
        const pcx = playerX + pWidth / 2;
        const pcy = playerY + pHeight / 2;
        const pr = pWidth / 2;
        ctx.save();
        ctx.beginPath();
        ctx.arc(pcx, pcy, pr, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(playerImage, playerX, pcy - pr, pWidth, pWidth);
        ctx.restore();
        ctx.strokeStyle = "#95B354";
        ctx.lineWidth = Math.max(0.75, 1 * scale);
        ctx.beginPath();
        ctx.arc(pcx, pcy, pr, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.fillStyle = "#EEEDEB";
        ctx.fillRect(playerX, playerY, pWidth, pHeight);
      }

      const remaining = invaders.filter((invader) => invader.alive).length;
      ctx.fillStyle = "#EEEDEB";
      ctx.font = `${Math.max(14, Math.round(16 * scale))}px sans-serif`;
      ctx.fillText(`Kvar: ${remaining}   Liv: ${lives}`, 8, 20 * scale);

      if (remaining === 0) {
        alive = false;
        onWin();
        return;
      }

      if (playerHit || reachedBottom) {
        lives = playerHit ? lives - 1 : lives;
        if (lives <= 0) {
          lives = START_LIVES;
          onLose();
        }
        resetWave();
        started = false;
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
  }, [photos, playerPhoto, onWin, onLose]);

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
