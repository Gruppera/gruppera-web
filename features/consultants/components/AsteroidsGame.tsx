"use client";

import { useEffect, useRef, useState } from "react";
import { ActionIcon, Box, Button, Group, Stack, Text } from "@mantine/core";
import { IconArrowsMaximize, IconArrowsMinimize } from "@tabler/icons-react";

type Vec2 = { x: number; y: number };
type Ship = {
  pos: Vec2;
  vel: Vec2;
  angle: number;
  thrusting: boolean;
  invulnerableUntil: number;
};
type Meteor = { pos: Vec2; vel: Vec2; radius: number; rotation: number; rotationSpeed: number };
type Bullet = { pos: Vec2; vel: Vec2; expiresAt: number };
type Phase = "start" | "playing" | "gameover";
type SaucerKind = "large" | "small";
type Saucer = {
  kind: SaucerKind;
  pos: Vec2;
  vel: Vec2;
  radius: number;
  lastShotAt: number;
};

const ROTATION_SPEED = 3.2;
const THRUST_ACCEL = 260;
const MAX_SPEED = 320;
const DRAG = 0.995;
const SHIP_RADIUS = 12;

const BULLET_SPEED = 480;
const BULLET_RADIUS = 2;
const FIRE_COOLDOWN = 250;
// Classic Asteroids caps the player at 5 shots on screen at once — firing
// again only becomes possible once one of the existing bullets is gone.
const MAX_PLAYER_BULLETS = 5;

const SIZES = { large: 46, medium: 26, small: 14 } as const;
const SCORE_BY_RADIUS: Record<number, number> = {
  [SIZES.large]: 20,
  [SIZES.medium]: 50,
  [SIZES.small]: 100,
};

const PHOTO_SRC = "/photos/olle.png";

// --- Level / difficulty progression ---------------------------------------
// Asteroid speed ramps up gradually with a per-level multiplier, capped so
// later levels stay hard but playable.
const LEVEL_SPEED_MULTIPLIER_PER_LEVEL = 0.25;
const LEVEL_SPEED_MULTIPLIER_MAX = 2.5;
const getLevelSpeedMultiplier = (level: number) =>
  Math.min(1 + (level - 1) * LEVEL_SPEED_MULTIPLIER_PER_LEVEL, LEVEL_SPEED_MULTIPLIER_MAX);

// Large-meteor count per level follows the original's 4/6/8/10(+) curve.
const LEVEL_METEOR_COUNTS = [4, 6, 8] as const;
const LEVEL_METEOR_COUNT_MAX = 10;
const getMeteorCountForLevel = (level: number) => LEVEL_METEOR_COUNTS[level - 1] ?? LEVEL_METEOR_COUNT_MAX;

// --- UFO / saucer progression ----------------------------------------------
// Large saucers start showing up first; small (more accurate, higher-value)
// saucers only enter the rotation from a later level. Spawn frequency and the
// small/large mix both shift as the level climbs.
const UFO_LARGE_MIN_LEVEL = 3;
const UFO_SMALL_MIN_LEVEL = 6;

const UFO_SPAWN_INTERVAL_BASE_MS = 20000;
const UFO_SPAWN_INTERVAL_MIN_MS = 8000;
const UFO_SPAWN_INTERVAL_STEP_MS = 1500;
const getUfoSpawnIntervalMs = (level: number) => {
  if (level < UFO_LARGE_MIN_LEVEL) return Infinity;
  const stepsAboveMin = level - UFO_LARGE_MIN_LEVEL;
  return Math.max(UFO_SPAWN_INTERVAL_BASE_MS - stepsAboveMin * UFO_SPAWN_INTERVAL_STEP_MS, UFO_SPAWN_INTERVAL_MIN_MS);
};

const UFO_SMALL_CHANCE_START = 0.15;
const UFO_SMALL_CHANCE_MAX = 0.75;
const UFO_SMALL_CHANCE_STEP = 0.1;
const getSmallSaucerChance = (level: number) => {
  if (level < UFO_SMALL_MIN_LEVEL) return 0;
  const stepsAboveMin = level - UFO_SMALL_MIN_LEVEL;
  return Math.min(UFO_SMALL_CHANCE_START + stepsAboveMin * UFO_SMALL_CHANCE_STEP, UFO_SMALL_CHANCE_MAX);
};

const SAUCER_SPEED = 90;
const SAUCER_SHOT_COOLDOWN_MS = 1600;
const SAUCER_BULLET_SPEED = 360;
const SAUCER_STATS = {
  large: { radius: 22, score: 200, aimSpread: 0.6 },
  small: { radius: 12, score: 1000, aimSpread: 0.12 },
} as const;

const rand = (min: number, max: number) => min + Math.random() * (max - min);

const wrap = (value: number, max: number) => ((value % max) + max) % max;

const spawnMeteor = (width: number, height: number, radius: number, speedMultiplier = 1): Meteor => {
  const edge = Math.floor(rand(0, 4));
  const pos =
    edge === 0
      ? { x: rand(0, width), y: 0 }
      : edge === 1
        ? { x: width, y: rand(0, height) }
        : edge === 2
          ? { x: rand(0, width), y: height }
          : { x: 0, y: rand(0, height) };
  const baseSpeed = radius === SIZES.large ? rand(40, 70) : radius === SIZES.medium ? rand(70, 110) : rand(110, 160);
  const speed = baseSpeed * speedMultiplier;
  const dir = rand(0, Math.PI * 2);
  return {
    pos,
    vel: { x: Math.cos(dir) * speed, y: Math.sin(dir) * speed },
    radius,
    rotation: rand(0, Math.PI * 2),
    rotationSpeed: rand(-1, 1),
  };
};

const spawnSaucer = (width: number, height: number, kind: SaucerKind, now: number): Saucer => {
  const fromLeft = Math.random() < 0.5;
  const radius = SAUCER_STATS[kind].radius;
  return {
    kind,
    pos: { x: fromLeft ? -radius : width + radius, y: rand(radius, height - radius) },
    vel: { x: fromLeft ? SAUCER_SPEED : -SAUCER_SPEED, y: rand(-20, 20) },
    radius,
    lastShotAt: now,
  };
};

export const AsteroidsGame = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const keysRef = useRef({ left: false, right: false, thrust: false, fire: false });
  const phaseRef = useRef<Phase>("start");
  const [phase, setPhaseState] = useState<Phase>("start");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const resetGameRef = useRef<(() => void) | null>(null);

  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void el.requestFullscreen();
    }
  };

  const setPhase = (next: Phase) => {
    phaseRef.current = next;
    setPhaseState(next);
  };

  const startGame = () => {
    resetGameRef.current?.();
    setScore(0);
    setLives(3);
    setLevel(1);
    setPhase("playing");
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const image = new Image();
    image.src = PHOTO_SRC;

    let width = container.clientWidth;
    let height = container.clientHeight;
    canvas.width = width;
    canvas.height = height;

    let ship: Ship = {
      pos: { x: width / 2, y: height / 2 },
      vel: { x: 0, y: 0 },
      angle: -Math.PI / 2,
      thrusting: false,
      invulnerableUntil: performance.now() + 2000,
    };
    let meteors: Meteor[] = Array.from({ length: 5 }, () => spawnMeteor(width, height, SIZES.large));
    let bullets: Bullet[] = [];
    let enemyBullets: Bullet[] = [];
    let saucer: Saucer | null = null;
    let nextSaucerAt = Infinity;
    let wave = 0;
    let speedMultiplier = 1;
    let lastFire = 0;
    let scoreValue = 0;
    let livesValue = 3;

    const spawnWave = () => {
      wave += 1;
      speedMultiplier = getLevelSpeedMultiplier(wave);
      setLevel(wave);
      nextSaucerAt = Infinity;
      const count = getMeteorCountForLevel(wave);
      meteors = meteors.concat(
        Array.from({ length: count }, () => spawnMeteor(width, height, SIZES.large, speedMultiplier)),
      );
    };

    const resetGame = () => {
      ship = {
        pos: { x: width / 2, y: height / 2 },
        vel: { x: 0, y: 0 },
        angle: -Math.PI / 2,
        thrusting: false,
        invulnerableUntil: performance.now() + 2000,
      };
      bullets = [];
      enemyBullets = [];
      saucer = null;
      wave = 0;
      speedMultiplier = 1;
      livesValue = 3;
      scoreValue = 0;
      meteors = [];
      spawnWave();
    };
    resetGameRef.current = resetGame;

    // Keep every entity's relative position (e.g. ship dead centre) when the
    // canvas changes size — entering/exiting fullscreen resizes the canvas,
    // and without rescaling, positions kept their old absolute pixel values.
    const handleResize = () => {
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      if (newWidth === width && newHeight === height) return;
      const scaleX = newWidth / width;
      const scaleY = newHeight / height;
      ship.pos.x *= scaleX;
      ship.pos.y *= scaleY;
      meteors.forEach((m) => {
        m.pos.x *= scaleX;
        m.pos.y *= scaleY;
      });
      bullets.forEach((b) => {
        b.pos.x *= scaleX;
        b.pos.y *= scaleY;
      });
      enemyBullets.forEach((b) => {
        b.pos.x *= scaleX;
        b.pos.y *= scaleY;
      });
      if (saucer) {
        saucer.pos.x *= scaleX;
        saucer.pos.y *= scaleY;
      }
      width = newWidth;
      height = newHeight;
      canvas.width = width;
      canvas.height = height;
    };
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    const respawnShip = () => {
      ship = {
        pos: { x: width / 2, y: height / 2 },
        vel: { x: 0, y: 0 },
        angle: -Math.PI / 2,
        thrusting: false,
        invulnerableUntil: performance.now() + 2000,
      };
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (["ArrowLeft", "ArrowRight", "ArrowUp", " ", "a", "d", "w"].includes(e.key)) {
        e.preventDefault();
      }
      if (e.key === "ArrowLeft" || e.key === "a") keysRef.current.left = true;
      if (e.key === "ArrowRight" || e.key === "d") keysRef.current.right = true;
      if (e.key === "ArrowUp" || e.key === "w") keysRef.current.thrust = true;
      if (e.key === " ") keysRef.current.fire = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a") keysRef.current.left = false;
      if (e.key === "ArrowRight" || e.key === "d") keysRef.current.right = false;
      if (e.key === "ArrowUp" || e.key === "w") keysRef.current.thrust = false;
      if (e.key === " ") keysRef.current.fire = false;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    const onFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === container);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);

    let raf = 0;
    let last = performance.now();

    const drawShip = (now: number) => {
      const blinking = now < ship.invulnerableUntil && Math.floor(now / 100) % 2 === 0;
      if (blinking) return;
      ctx.save();
      ctx.translate(ship.pos.x, ship.pos.y);
      ctx.rotate(ship.angle);
      ctx.strokeStyle = "#95B354";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(16, 0);
      ctx.lineTo(-10, 9);
      ctx.lineTo(-6, 0);
      ctx.lineTo(-10, -9);
      ctx.closePath();
      ctx.stroke();
      if (ship.thrusting) {
        ctx.strokeStyle = "#E0CCBE";
        ctx.beginPath();
        ctx.moveTo(-6, 0);
        ctx.lineTo(-16 - rand(0, 8), 0);
        ctx.stroke();
      }
      ctx.restore();
    };

    const drawMeteor = (meteor: Meteor) => {
      ctx.save();
      ctx.translate(meteor.pos.x, meteor.pos.y);
      ctx.rotate(meteor.rotation);
      ctx.beginPath();
      ctx.arc(0, 0, meteor.radius, 0, Math.PI * 2);
      ctx.closePath();
      if (image.complete && image.naturalWidth > 0) {
        ctx.save();
        ctx.clip();
        ctx.drawImage(image, -meteor.radius, -meteor.radius, meteor.radius * 2, meteor.radius * 2);
        ctx.restore();
      } else {
        ctx.fillStyle = "#565655";
        ctx.fill();
      }
      ctx.strokeStyle = "#95B354";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    };

    const drawSaucer = (s: Saucer) => {
      ctx.save();
      ctx.translate(s.pos.x, s.pos.y);
      ctx.strokeStyle = "#95B354";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 0, s.radius, s.radius * 0.45, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(0, -s.radius * 0.35, s.radius * 0.5, s.radius * 0.32, 0, Math.PI, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-s.radius * 0.6, 0);
      ctx.lineTo(s.radius * 0.6, 0);
      ctx.stroke();
      ctx.restore();
    };

    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      ctx.fillStyle = "#0D0D0C";
      ctx.fillRect(0, 0, width, height);

      const playing = phaseRef.current === "playing";

      if (playing) {
        if (keysRef.current.left) ship.angle -= ROTATION_SPEED * dt;
        if (keysRef.current.right) ship.angle += ROTATION_SPEED * dt;
        ship.thrusting = keysRef.current.thrust;
        if (ship.thrusting) {
          ship.vel.x += Math.cos(ship.angle) * THRUST_ACCEL * dt;
          ship.vel.y += Math.sin(ship.angle) * THRUST_ACCEL * dt;
        }
        const speed = Math.hypot(ship.vel.x, ship.vel.y);
        if (speed > MAX_SPEED) {
          ship.vel.x = (ship.vel.x / speed) * MAX_SPEED;
          ship.vel.y = (ship.vel.y / speed) * MAX_SPEED;
        }
        ship.vel.x *= DRAG;
        ship.vel.y *= DRAG;
        ship.pos.x = wrap(ship.pos.x + ship.vel.x * dt, width);
        ship.pos.y = wrap(ship.pos.y + ship.vel.y * dt, height);

        if (keysRef.current.fire && now - lastFire > FIRE_COOLDOWN && bullets.length < MAX_PLAYER_BULLETS) {
          lastFire = now;
          // Bullets should reach from the ship to the far edge of the play
          // field no matter where it's fired from, so range scales with the
          // canvas's own diagonal rather than a fixed lifetime.
          const maxRange = Math.hypot(width, height) / 2;
          bullets.push({
            pos: { x: ship.pos.x + Math.cos(ship.angle) * 16, y: ship.pos.y + Math.sin(ship.angle) * 16 },
            vel: { x: Math.cos(ship.angle) * BULLET_SPEED, y: Math.sin(ship.angle) * BULLET_SPEED },
            expiresAt: now + (maxRange / BULLET_SPEED) * 1000,
          });
        }

        // UFOs: schedule the next one once the current level allows them,
        // let it fly across, and have it shoot back at the ship.
        if (!saucer && wave >= UFO_LARGE_MIN_LEVEL) {
          if (nextSaucerAt === Infinity) {
            nextSaucerAt = now + getUfoSpawnIntervalMs(wave);
          } else if (now >= nextSaucerAt) {
            const kind: SaucerKind = Math.random() < getSmallSaucerChance(wave) ? "small" : "large";
            saucer = spawnSaucer(width, height, kind, now);
            nextSaucerAt = Infinity;
          }
        }

        if (saucer) {
          saucer.pos.x += saucer.vel.x * dt;
          saucer.pos.y = wrap(saucer.pos.y + saucer.vel.y * dt, height);
          if (saucer.pos.x < -saucer.radius * 2 || saucer.pos.x > width + saucer.radius * 2) {
            saucer = null;
          }
        }

        if (saucer && now - saucer.lastShotAt > SAUCER_SHOT_COOLDOWN_MS) {
          saucer.lastShotAt = now;
          const spread = SAUCER_STATS[saucer.kind].aimSpread;
          const aimAngle = Math.atan2(ship.pos.y - saucer.pos.y, ship.pos.x - saucer.pos.x) + rand(-spread, spread);
          const maxRange = Math.hypot(width, height) / 2;
          enemyBullets.push({
            pos: { ...saucer.pos },
            vel: { x: Math.cos(aimAngle) * SAUCER_BULLET_SPEED, y: Math.sin(aimAngle) * SAUCER_BULLET_SPEED },
            expiresAt: now + (maxRange / SAUCER_BULLET_SPEED) * 1000,
          });
        }
      }

      bullets = bullets.filter((b) => now < b.expiresAt);
      bullets.forEach((b) => {
        b.pos.x = wrap(b.pos.x + b.vel.x * dt, width);
        b.pos.y = wrap(b.pos.y + b.vel.y * dt, height);
      });

      enemyBullets = enemyBullets.filter((b) => now < b.expiresAt);
      enemyBullets.forEach((b) => {
        b.pos.x = wrap(b.pos.x + b.vel.x * dt, width);
        b.pos.y = wrap(b.pos.y + b.vel.y * dt, height);
      });

      meteors.forEach((m) => {
        m.pos.x = wrap(m.pos.x + m.vel.x * dt, width);
        m.pos.y = wrap(m.pos.y + m.vel.y * dt, height);
        m.rotation += m.rotationSpeed * dt;
      });

      if (playing) {
        const survivingMeteors: Meteor[] = [];
        const survivingBullets = new Set(bullets);

        meteors.forEach((m) => {
          const hitBullet = bullets.find(
            (b) => survivingBullets.has(b) && Math.hypot(b.pos.x - m.pos.x, b.pos.y - m.pos.y) < m.radius + BULLET_RADIUS,
          );
          if (hitBullet) {
            survivingBullets.delete(hitBullet);
            scoreValue += SCORE_BY_RADIUS[m.radius] ?? 10;
            setScore(scoreValue);
            const nextRadius = m.radius === SIZES.large ? SIZES.medium : m.radius === SIZES.medium ? SIZES.small : null;
            if (nextRadius) {
              for (let i = 0; i < 2; i += 1) {
                const dir = rand(0, Math.PI * 2);
                const speed = rand(60, 140) * speedMultiplier;
                survivingMeteors.push({
                  pos: { ...m.pos },
                  vel: { x: Math.cos(dir) * speed, y: Math.sin(dir) * speed },
                  radius: nextRadius,
                  rotation: rand(0, Math.PI * 2),
                  rotationSpeed: rand(-1.5, 1.5),
                });
              }
            }
            return;
          }
          survivingMeteors.push(m);
        });
        meteors = survivingMeteors;
        bullets = bullets.filter((b) => survivingBullets.has(b));

        if (saucer) {
          const hitBullet = bullets.find(
            (b) => Math.hypot(b.pos.x - saucer!.pos.x, b.pos.y - saucer!.pos.y) < saucer!.radius + BULLET_RADIUS,
          );
          if (hitBullet) {
            bullets = bullets.filter((b) => b !== hitBullet);
            scoreValue += SAUCER_STATS[saucer.kind].score;
            setScore(scoreValue);
            saucer = null;
          }
        }

        const takeHit = () => {
          livesValue -= 1;
          setLives(livesValue);
          if (livesValue <= 0) {
            setPhase("gameover");
          } else {
            respawnShip();
          }
        };

        if (now > ship.invulnerableUntil) {
          const hitMeteor = meteors.some(
            (m) => Math.hypot(m.pos.x - ship.pos.x, m.pos.y - ship.pos.y) < m.radius + SHIP_RADIUS,
          );
          const hitSaucer =
            saucer && Math.hypot(saucer.pos.x - ship.pos.x, saucer.pos.y - ship.pos.y) < saucer.radius + SHIP_RADIUS;
          const hitEnemyBullet = enemyBullets.some(
            (b) => Math.hypot(b.pos.x - ship.pos.x, b.pos.y - ship.pos.y) < BULLET_RADIUS + SHIP_RADIUS,
          );
          if (hitSaucer) saucer = null;
          if (hitEnemyBullet) {
            enemyBullets = enemyBullets.filter(
              (b) => Math.hypot(b.pos.x - ship.pos.x, b.pos.y - ship.pos.y) >= BULLET_RADIUS + SHIP_RADIUS,
            );
          }
          if (hitMeteor || hitSaucer || hitEnemyBullet) {
            takeHit();
          }
        }

        if (meteors.length === 0) {
          spawnWave();
        }
      }

      meteors.forEach(drawMeteor);
      if (saucer) drawSaucer(saucer);
      ctx.fillStyle = "#EEEDEB";
      bullets.forEach((b) => {
        ctx.beginPath();
        ctx.arc(b.pos.x, b.pos.y, BULLET_RADIUS, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.fillStyle = "#824529";
      enemyBullets.forEach((b) => {
        ctx.beginPath();
        ctx.arc(b.pos.x, b.pos.y, BULLET_RADIUS, 0, Math.PI * 2);
        ctx.fill();
      });
      if (playing) drawShip(now);

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, []);

  const setTouchKey = (key: keyof typeof keysRef.current, value: boolean) => () => {
    keysRef.current[key] = value;
  };

  return (
    <Stack gap="md">
      <Text c="dimmed" fz={{ base: 13, sm: 14 }}>
        Piltangenter/WASD för att styra, mellanslag för att skjuta.
      </Text>

      <Box
        ref={containerRef}
        pos="relative"
        style={{
          width: "100%",
          aspectRatio: isFullscreen ? undefined : "5 / 3",
          height: isFullscreen ? "100vh" : undefined,
          borderRadius: isFullscreen ? 0 : "var(--mantine-radius-md)",
          overflow: "hidden",
          backgroundColor: "#0D0D0C",
        }}
      >
        <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: "100%" }} />

        <Group pos="absolute" top={12} left={12} gap="lg">
          <Text c="chamonix.0" fw={600} size="sm">
            Poäng: {score}
          </Text>
          <Text c="chamonix.0" fw={600} size="sm">
            Liv: {lives}
          </Text>
          <Text c="chamonix.0" fw={600} size="sm">
            Nivå: {level}
          </Text>
        </Group>

        <ActionIcon
          pos="absolute"
          top={12}
          right={12}
          size="lg"
          variant="light"
          color="sprout"
          aria-label={isFullscreen ? "Avsluta fullskärm" : "Fullskärmsläge"}
          onClick={toggleFullscreen}
        >
          {isFullscreen ? <IconArrowsMinimize size={18} /> : <IconArrowsMaximize size={18} />}
        </ActionIcon>

        {phase !== "playing" && (
          <Stack
            align="center"
            justify="center"
            gap="sm"
            pos="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            style={{ backgroundColor: "rgba(13, 13, 12, 0.75)" }}
          >
            {phase === "gameover" && (
              <Text c="chamonix.0" fw={600} fz={22}>
                Game over — {score} poäng
              </Text>
            )}
            <Button color="sprout" onClick={startGame}>
              {phase === "gameover" ? "Spela igen" : "Starta spelet"}
            </Button>
          </Stack>
        )}
      </Box>

      <Group gap="sm" hiddenFrom="sm" justify="center">
        <Button
          variant="light"
          color="sprout"
          onPointerDown={setTouchKey("left", true)}
          onPointerUp={setTouchKey("left", false)}
          onPointerLeave={setTouchKey("left", false)}
        >
          ⟲
        </Button>
        <Button
          variant="light"
          color="sprout"
          onPointerDown={setTouchKey("thrust", true)}
          onPointerUp={setTouchKey("thrust", false)}
          onPointerLeave={setTouchKey("thrust", false)}
        >
          ▲
        </Button>
        <Button
          variant="light"
          color="sprout"
          onPointerDown={setTouchKey("right", true)}
          onPointerUp={setTouchKey("right", false)}
          onPointerLeave={setTouchKey("right", false)}
        >
          ⟳
        </Button>
        <Button
          variant="filled"
          color="sprout"
          onPointerDown={setTouchKey("fire", true)}
          onPointerUp={setTouchKey("fire", false)}
          onPointerLeave={setTouchKey("fire", false)}
        >
          Skjut
        </Button>
      </Group>
    </Stack>
  );
};
