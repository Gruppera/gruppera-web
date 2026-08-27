"use client";

import { useEffect, useRef } from "react";
import { Text } from "@mantine/core";

const WIDTH = 400;
const HEIGHT = 300;
const PADDLE_WIDTH = 10;
const PADDLE_HEIGHT = 60;
const BALL_SIZE = 24;
const PLAYER_SPEED = 6;
const CPU_SPEED = 3.5;
const WIN_SCORE = 3;

type PongProps = {
  photos: string[];
  onWin: () => void;
};

export const Pong = ({ photos, onWin }: PongProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let playerY = HEIGHT / 2 - PADDLE_HEIGHT / 2;
    let cpuY = HEIGHT / 2 - PADDLE_HEIGHT / 2;
    let ballX = WIDTH / 2;
    let ballY = HEIGHT / 2;
    let ballVX = 4;
    let ballVY = 3;
    let playerScore = 0;
    let cpuScore = 0;
    let moveUp = false;
    let moveDown = false;
    let alive = true;

    const ballImage = new Image();
    const setRandomBallImage = () => {
      ballImage.src = photos[Math.floor(Math.random() * photos.length)];
    };
    setRandomBallImage();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowUp") moveUp = true;
      if (event.key === "ArrowDown") moveDown = true;
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === "ArrowUp") moveUp = false;
      if (event.key === "ArrowDown") moveDown = false;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    const resetBall = () => {
      ballX = WIDTH / 2;
      ballY = HEIGHT / 2;
      ballVX = ballVX > 0 ? -4 : 4;
      ballVY = 3;
      setRandomBallImage();
    };

    let raf = 0;

    const loop = () => {
      if (!alive) return;

      if (moveUp) playerY = Math.max(0, playerY - PLAYER_SPEED);
      if (moveDown)
        playerY = Math.min(HEIGHT - PADDLE_HEIGHT, playerY + PLAYER_SPEED);

      const cpuCenter = cpuY + PADDLE_HEIGHT / 2;
      if (cpuCenter < ballY - 8) cpuY += CPU_SPEED;
      if (cpuCenter > ballY + 8) cpuY -= CPU_SPEED;
      cpuY = Math.max(0, Math.min(HEIGHT - PADDLE_HEIGHT, cpuY));

      ballX += ballVX;
      ballY += ballVY;

      if (ballY <= 0 || ballY >= HEIGHT - BALL_SIZE) ballVY *= -1;

      if (
        ballX <= PADDLE_WIDTH + 10 &&
        ballY + BALL_SIZE >= playerY &&
        ballY <= playerY + PADDLE_HEIGHT
      ) {
        ballVX = Math.abs(ballVX);
      }

      if (
        ballX >= WIDTH - PADDLE_WIDTH - 10 - BALL_SIZE &&
        ballY + BALL_SIZE >= cpuY &&
        ballY <= cpuY + PADDLE_HEIGHT
      ) {
        ballVX = -Math.abs(ballVX);
      }

      if (ballX < 0) {
        cpuScore += 1;
        resetBall();
      }
      if (ballX > WIDTH) {
        playerScore += 1;
        if (playerScore >= WIN_SCORE) {
          alive = false;
        } else {
          resetBall();
        }
      }

      ctx.fillStyle = "#0D0D0C";
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      ctx.fillStyle = "#EEEDEB";
      ctx.fillRect(10, playerY, PADDLE_WIDTH, PADDLE_HEIGHT);
      ctx.fillRect(WIDTH - 10 - PADDLE_WIDTH, cpuY, PADDLE_WIDTH, PADDLE_HEIGHT);

      if (ballImage.complete && ballImage.naturalWidth > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(
          ballX + BALL_SIZE / 2,
          ballY + BALL_SIZE / 2,
          BALL_SIZE / 2,
          0,
          Math.PI * 2,
        );
        ctx.clip();
        ctx.drawImage(ballImage, ballX, ballY, BALL_SIZE, BALL_SIZE);
        ctx.restore();
      } else {
        ctx.fillStyle = "#95B354";
        ctx.fillRect(ballX, ballY, BALL_SIZE, BALL_SIZE);
      }

      ctx.fillStyle = "#EEEDEB";
      ctx.font = "16px sans-serif";
      ctx.fillText(`${playerScore} - ${cpuScore}`, WIDTH / 2 - 16, 20);

      if (!alive) {
        onWin();
        return;
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
        Pil upp/ner styr. Först till {WIN_SCORE} poäng vinner.
      </Text>
    </div>
  );
};
