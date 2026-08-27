"use client";

import { useEffect, useRef } from "react";

const BASE_WIDTH = 400;
const BASE_HEIGHT = 300;
const BASE_PADDLE_WIDTH = 10;
const BASE_PADDLE_HEIGHT = 60;
const BASE_BALL_SIZE = 24;
const BASE_PLAYER_SPEED = 4.2;
const BASE_CPU_SPEED = 1.4;
const CPU_ERROR = 40;
const BASE_BALL_VX = 2.8;
const BASE_BALL_VY = 2.1;
const WIN_SCORE = 3;

type PongProps = {
  photos: string[];
  onWin: () => void;
  onLose: () => void;
};

export const Pong = ({ photos, onWin, onLose }: PongProps) => {
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

    let playerY = height / 2 - (BASE_PADDLE_HEIGHT * scale) / 2;
    let cpuY = height / 2 - (BASE_PADDLE_HEIGHT * scale) / 2;
    let ballX = width / 2;
    let ballY = height / 2;
    let ballVX = BASE_BALL_VX * scale;
    let ballVY = BASE_BALL_VY * scale;
    let cpuWasApproaching = false;
    let cpuError = 0;
    let playerScore = 0;
    let cpuScore = 0;
    let moveUp = false;
    let moveDown = false;
    let alive = true;
    let started = false;

    const ballImage = new Image();
    const setRandomBallImage = () => {
      const index = Math.floor(Math.random() * photos.length);
      ballImage.src = photos[index];
    };
    setRandomBallImage();

    const onKeyDown = (event: KeyboardEvent) => {
      if (!started) {
        event.preventDefault();
        started = true;
        return;
      }
      if (event.key.startsWith("Arrow")) event.preventDefault();
      if (event.key === "ArrowUp") moveUp = true;
      if (event.key === "ArrowDown") moveDown = true;
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === "ArrowUp") moveUp = false;
      if (event.key === "ArrowDown") moveDown = false;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    const onResize = () => {
      applySize();
    };
    window.addEventListener("resize", onResize);

    const resetBall = (loser: "player" | "cpu") => {
      const ballSize = BASE_BALL_SIZE * scale;
      const margin = 10 * scale;
      const paddleWidth = BASE_PADDLE_WIDTH * scale;
      if (loser === "player") {
        // Loser serves: ball starts on their side, heading toward the winner.
        ballX = margin + paddleWidth + ballSize * 1.5;
        ballVX = BASE_BALL_VX * scale;
      } else {
        ballX = width - margin - paddleWidth - ballSize * 2.5;
        ballVX = -BASE_BALL_VX * scale;
      }
      ballY = height / 2;
      ballVY = Math.random() > 0.5 ? BASE_BALL_VY * scale : -BASE_BALL_VY * scale;
      setRandomBallImage();
    };

    let raf = 0;

    const loop = () => {
      if (!alive) return;

      const paddleWidth = BASE_PADDLE_WIDTH * scale;
      const paddleHeight = BASE_PADDLE_HEIGHT * scale;
      const ballSize = BASE_BALL_SIZE * scale;
      const playerSpeed = BASE_PLAYER_SPEED * scale;
      const cpuSpeed = BASE_CPU_SPEED * scale;
      const margin = 10 * scale;

      if (started) {
        if (moveUp) playerY = Math.max(0, playerY - playerSpeed);
        if (moveDown)
          playerY = Math.min(height - paddleHeight, playerY + playerSpeed);

        // Imperfect tracking: the CPU only "notices" the ball direction
        // change when it starts heading its way, and aims at a slightly
        // wrong spot from then on — a real (beatable) opponent, not a wall.
        const approaching = ballVX > 0;
        if (approaching && !cpuWasApproaching) {
          cpuError = (Math.random() - 0.5) * CPU_ERROR * scale;
        }
        cpuWasApproaching = approaching;

        const cpuTarget = ballY + cpuError;
        const cpuCenter = cpuY + paddleHeight / 2;
        if (cpuCenter < cpuTarget - 14 * scale) cpuY += cpuSpeed;
        if (cpuCenter > cpuTarget + 14 * scale) cpuY -= cpuSpeed;
        cpuY = Math.max(0, Math.min(height - paddleHeight, cpuY));

        ballX += ballVX;
        ballY += ballVY;

        if (ballY <= 0 || ballY >= height - ballSize) ballVY *= -1;

        if (
          ballX <= paddleWidth + margin &&
          ballY + ballSize >= playerY &&
          ballY <= playerY + paddleHeight
        ) {
          ballVX = Math.abs(ballVX);
        }

        if (
          ballX >= width - paddleWidth - margin - ballSize &&
          ballY + ballSize >= cpuY &&
          ballY <= cpuY + paddleHeight
        ) {
          ballVX = -Math.abs(ballVX);
        }

        if (ballX < 0) {
          cpuScore += 1;
          if (cpuScore >= WIN_SCORE) {
            cpuScore = 0;
            playerScore = 0;
            onLose();
          }
          resetBall("player");
          started = false;
        }
        if (ballX > width) {
          playerScore += 1;
          if (playerScore >= WIN_SCORE) {
            alive = false;
          } else {
            resetBall("cpu");
            started = false;
          }
        }
      }

      ctx.fillStyle = "#0D0D0C";
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = "#EEEDEB";
      ctx.fillRect(margin, playerY, paddleWidth, paddleHeight);
      ctx.fillRect(width - margin - paddleWidth, cpuY, paddleWidth, paddleHeight);

      if (ballImage.complete && ballImage.naturalWidth > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(
          ballX + ballSize / 2,
          ballY + ballSize / 2,
          ballSize / 2,
          0,
          Math.PI * 2,
        );
        ctx.clip();
        ctx.drawImage(ballImage, ballX, ballY, ballSize, ballSize);
        ctx.restore();
        ctx.strokeStyle = "#95B354";
        ctx.lineWidth = Math.max(0.75, 1 * scale);
        ctx.beginPath();
        ctx.arc(
          ballX + ballSize / 2,
          ballY + ballSize / 2,
          ballSize / 2,
          0,
          Math.PI * 2,
        );
        ctx.stroke();
      } else {
        ctx.fillStyle = "#95B354";
        ctx.fillRect(ballX, ballY, ballSize, ballSize);
      }

      ctx.fillStyle = "#EEEDEB";
      ctx.font = `${Math.max(16, Math.round(16 * scale))}px sans-serif`;
      ctx.fillText(`${playerScore} - ${cpuScore}`, width / 2 - 16 * scale, 24 * scale);

      if (!alive) {
        onWin();
        return;
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
  }, [photos, onWin, onLose]);

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
