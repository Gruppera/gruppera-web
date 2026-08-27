"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ActionIcon, Box, Button, Group, Stack, Text } from "@mantine/core";
import { IconArrowsMaximize, IconArrowsMinimize } from "@tabler/icons-react";

import mockData from "@/app/mockdata.json";
import { consultantListSchema } from "@/features/consultants/schemas";
import { CONSULTANT_SPAWNS, PLAYER_START, isWallAt } from "./map";
import { castRay, projectToScreen } from "./raycast";

type Keys = {
  forward: boolean;
  back: boolean;
  turnLeft: boolean;
  turnRight: boolean;
  fire: boolean;
};

type Phase = "start" | "playing";

type Sprite = {
  slug: string;
  name: string;
  focus: string;
  x: number;
  y: number;
  image: HTMLImageElement;
};

const INTERNAL_WIDTH = 320;
const INTERNAL_HEIGHT = 180;
const FOV = (66 * Math.PI) / 180;
const HALF_FOV = FOV / 2;
const MOVE_SPEED = 2.6;
const TURN_SPEED = 2.4;
const MAX_RENDER_DISTANCE = 20;
const PLAYER_RADIUS = 0.2;
const SHOOT_MAX_RANGE = 14;
const AIM_TOLERANCE_PX = 20;
const HIT_NAVIGATE_DELAY_MS = 550;
const FLASH_DURATION_MS = 200;

export const CorridorGame = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const keysRef = useRef<Keys>({
    forward: false,
    back: false,
    turnLeft: false,
    turnRight: false,
    fire: false,
  });
  const phaseRef = useRef<Phase>("start");
  const navigateTimeoutRef = useRef<number | null>(null);

  const [phase, setPhaseState] = useState<Phase>("start");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hitMessage, setHitMessage] = useState<string | null>(null);
  const [aimedLabel, setAimedLabel] = useState<string | null>(null);

  const router = useRouter();

  const setPhase = (next: Phase) => {
    phaseRef.current = next;
    setPhaseState(next);
  };

  const startGame = () => {
    setHitMessage(null);
    setAimedLabel(null);
    setPhase("playing");
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;
    if (document.fullscreenElement === container) {
      document.exitFullscreen();
    } else {
      container.requestFullscreen();
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = INTERNAL_WIDTH;
    canvas.height = INTERNAL_HEIGHT;

    const rootStyle = getComputedStyle(document.documentElement);
    const colors = {
      ceiling: rootStyle.getPropertyValue("--mantine-color-grafite-7").trim(),
      floor: rootStyle.getPropertyValue("--mantine-color-grafite-9").trim(),
      wallLight: rootStyle.getPropertyValue("--mantine-color-grafite-4").trim(),
      wallDark: rootStyle.getPropertyValue("--mantine-color-grafite-6").trim(),
      fog: rootStyle.getPropertyValue("--mantine-color-grafite-9").trim(),
      crosshair: rootStyle.getPropertyValue("--mantine-color-chamonix-0").trim(),
      hitFlash: rootStyle.getPropertyValue("--mantine-color-sprout-4").trim(),
      missFlash: rootStyle.getPropertyValue("--mantine-color-cognac-5").trim(),
    };

    const consultants = consultantListSchema.parse(mockData);
    const sprites: Sprite[] = CONSULTANT_SPAWNS.map((spawn) => {
      const consultant = consultants.find((c) => c.slug === spawn.slug);
      const image = new Image();
      image.src = `/photos/corridor/${spawn.slug}.png`;
      return {
        slug: spawn.slug,
        name: consultant?.name ?? spawn.slug,
        focus: consultant?.focus ?? "",
        x: spawn.x,
        y: spawn.y,
        image,
      };
    });

    const player = { ...PLAYER_START };
    let lastAimedSlug: string | null = null;
    let flashUntil = 0;
    let flashColor = colors.hitFlash;
    let awaitingNavigation = false;

    const canMoveTo = (x: number, y: number): boolean => {
      const r = PLAYER_RADIUS;
      return (
        !isWallAt(x - r, y - r) &&
        !isWallAt(x + r, y - r) &&
        !isWallAt(x - r, y + r) &&
        !isWallAt(x + r, y + r)
      );
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (
        ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " ", "a", "d", "w", "s"].includes(
          e.key,
        )
      ) {
        e.preventDefault();
      }
      if (e.key === "ArrowUp" || e.key === "w") keysRef.current.forward = true;
      if (e.key === "ArrowDown" || e.key === "s") keysRef.current.back = true;
      if (e.key === "ArrowLeft" || e.key === "a") keysRef.current.turnLeft = true;
      if (e.key === "ArrowRight" || e.key === "d") keysRef.current.turnRight = true;
      if (e.key === " ") keysRef.current.fire = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" || e.key === "w") keysRef.current.forward = false;
      if (e.key === "ArrowDown" || e.key === "s") keysRef.current.back = false;
      if (e.key === "ArrowLeft" || e.key === "a") keysRef.current.turnLeft = false;
      if (e.key === "ArrowRight" || e.key === "d") keysRef.current.turnRight = false;
      if (e.key === " ") keysRef.current.fire = false;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    const onFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === container);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);

    let firePressedLastFrame = false;
    let raf = 0;
    let lastTime = 0;

    const tick = (time: number) => {
      const dt = lastTime ? Math.min((time - lastTime) / 1000, 0.1) : 0;
      lastTime = time;

      if (phaseRef.current === "playing" && !awaitingNavigation) {
        const keys = keysRef.current;

        player.angle +=
          ((keys.turnRight ? 1 : 0) - (keys.turnLeft ? 1 : 0)) * TURN_SPEED * dt;

        const moveDir = (keys.forward ? 1 : 0) - (keys.back ? 1 : 0);
        if (moveDir !== 0) {
          const dirX = Math.cos(player.angle);
          const dirY = Math.sin(player.angle);
          const nextX = player.x + dirX * moveDir * MOVE_SPEED * dt;
          const nextY = player.y + dirY * moveDir * MOVE_SPEED * dt;
          if (canMoveTo(nextX, player.y)) player.x = nextX;
          if (canMoveTo(player.x, nextY)) player.y = nextY;
        }
      }

      // --- render ---
      ctx.fillStyle = colors.ceiling;
      ctx.fillRect(0, 0, INTERNAL_WIDTH, INTERNAL_HEIGHT / 2);
      ctx.fillStyle = colors.floor;
      ctx.fillRect(0, INTERNAL_HEIGHT / 2, INTERNAL_WIDTH, INTERNAL_HEIGHT / 2);

      const zBuffer = new Float64Array(INTERNAL_WIDTH);

      for (let col = 0; col < INTERNAL_WIDTH; col++) {
        const normalizedX = (col / INTERNAL_WIDTH) * 2 - 1;
        const relativeAngle = Math.atan(normalizedX * Math.tan(HALF_FOV));
        const rayAngle = player.angle + relativeAngle;
        const rayDirX = Math.cos(rayAngle);
        const rayDirY = Math.sin(rayAngle);

        const wallHit = castRay(
          isWallAt,
          player.x,
          player.y,
          rayDirX,
          rayDirY,
          MAX_RENDER_DISTANCE,
        );
        // Raw DDA distance is Euclidean along this column's own ray; multiplying
        // by cos(relativeAngle) projects it back onto the player's forward axis
        // so straight walls render straight instead of bowing (the "fisheye" bug).
        const correctedDistance = wallHit.distance * Math.cos(relativeAngle);
        zBuffer[col] = correctedDistance;

        const lineHeight = Math.min(
          INTERNAL_HEIGHT * 3,
          INTERNAL_HEIGHT / correctedDistance,
        );
        const drawStart = Math.floor((INTERNAL_HEIGHT - lineHeight) / 2);

        ctx.fillStyle = wallHit.side === 0 ? colors.wallLight : colors.wallDark;
        ctx.fillRect(col, drawStart, 1, lineHeight);

        const fogAlpha = Math.min(0.85, correctedDistance / MAX_RENDER_DISTANCE);
        if (fogAlpha > 0) {
          ctx.globalAlpha = fogAlpha;
          ctx.fillStyle = colors.fog;
          ctx.fillRect(col, drawStart, 1, lineHeight);
          ctx.globalAlpha = 1;
        }
      }

      const projected = sprites
        .map((sprite) => {
          const projection = projectToScreen(
            player.x,
            player.y,
            player.angle,
            FOV,
            INTERNAL_WIDTH,
            sprite.x,
            sprite.y,
          );
          return projection ? { sprite, projection } : null;
        })
        .filter((entry): entry is { sprite: Sprite; projection: NonNullable<ReturnType<typeof projectToScreen>> } => entry !== null)
        .sort((a, b) => b.projection.perpDistance - a.projection.perpDistance);

      let aimedSlug: string | null = null;
      let aimedDistance = Infinity;

      for (const { sprite, projection } of projected) {
        if (!sprite.image.complete || sprite.image.naturalWidth === 0) continue;
        const { screenX, perpDistance } = projection;
        const size = Math.min(
          INTERNAL_HEIGHT * 2,
          (INTERNAL_HEIGHT / perpDistance) * 0.85,
        );
        const drawStartX = screenX - size / 2;
        const drawEndX = screenX + size / 2;
        const drawStartY = INTERNAL_HEIGHT / 2 - size / 2;

        const colStart = Math.max(0, Math.floor(drawStartX));
        const colEnd = Math.min(INTERNAL_WIDTH - 1, Math.floor(drawEndX));

        for (let col = colStart; col <= colEnd; col++) {
          if (perpDistance >= zBuffer[col]) continue;
          const texX = Math.floor(
            ((col - drawStartX) / (drawEndX - drawStartX)) *
              sprite.image.naturalWidth,
          );
          ctx.drawImage(
            sprite.image,
            texX,
            0,
            1,
            sprite.image.naturalHeight,
            col,
            drawStartY,
            1,
            size,
          );
          const fogAlpha = Math.min(0.85, perpDistance / MAX_RENDER_DISTANCE);
          if (fogAlpha > 0) {
            ctx.globalAlpha = fogAlpha;
            ctx.fillStyle = colors.fog;
            ctx.fillRect(col, drawStartY, 1, size);
            ctx.globalAlpha = 1;
          }
        }

        const centerCol = Math.round(screenX);
        if (
          Math.abs(screenX - INTERNAL_WIDTH / 2) < AIM_TOLERANCE_PX &&
          perpDistance < SHOOT_MAX_RANGE &&
          centerCol >= 0 &&
          centerCol < INTERNAL_WIDTH &&
          perpDistance < zBuffer[centerCol] &&
          perpDistance < aimedDistance
        ) {
          aimedSlug = sprite.slug;
          aimedDistance = perpDistance;
        }
      }

      if (aimedSlug !== lastAimedSlug) {
        lastAimedSlug = aimedSlug;
        const aimedSprite = sprites.find((s) => s.slug === aimedSlug);
        setAimedLabel(
          aimedSprite ? `${aimedSprite.name} — ${aimedSprite.focus}` : null,
        );
      }

      // crosshair
      const cx = INTERNAL_WIDTH / 2;
      const cy = INTERNAL_HEIGHT / 2;
      ctx.strokeStyle = colors.crosshair;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - 6, cy);
      ctx.lineTo(cx + 6, cy);
      ctx.moveTo(cx, cy - 6);
      ctx.lineTo(cx, cy + 6);
      ctx.stroke();

      if (time < flashUntil) {
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = flashColor;
        ctx.fillRect(0, 0, INTERNAL_WIDTH, INTERNAL_HEIGHT);
        ctx.globalAlpha = 1;
      }

      // fire on press, not on hold
      if (
        phaseRef.current === "playing" &&
        !awaitingNavigation &&
        keysRef.current.fire &&
        !firePressedLastFrame
      ) {
        flashUntil = time + FLASH_DURATION_MS;
        if (aimedSlug) {
          const hitSprite = sprites.find((s) => s.slug === aimedSlug);
          flashColor = colors.hitFlash;
          if (hitSprite) {
            setHitMessage(`Träff: ${hitSprite.name} — ${hitSprite.focus}`);
            awaitingNavigation = true;
            navigateTimeoutRef.current = window.setTimeout(() => {
              router.push(`/vilka-ar-vi/${hitSprite.slug}`);
            }, HIT_NAVIGATE_DELAY_MS);
          }
        } else {
          flashColor = colors.missFlash;
          setHitMessage("Bom.");
          window.setTimeout(() => setHitMessage(null), 700);
        }
      }
      firePressedLastFrame = keysRef.current.fire;

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      if (navigateTimeoutRef.current !== null) {
        window.clearTimeout(navigateTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setTouchKey = (key: keyof Keys, value: boolean) => () => {
    keysRef.current[key] = value;
  };

  return (
    <Stack gap="md">
      <Text c="dimmed" fz={{ base: 13, sm: 14 }}>
        Piltangenter/WASD för att röra dig, mellanslag för att skjuta.
      </Text>

      <Box
        ref={containerRef}
        pos="relative"
        style={{
          width: "100%",
          aspectRatio: isFullscreen ? undefined : "16 / 9",
          height: isFullscreen ? "100vh" : undefined,
          borderRadius: isFullscreen ? 0 : "var(--mantine-radius-md)",
          overflow: "hidden",
          backgroundColor: "var(--mantine-color-grafite-9)",
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            display: "block",
            width: "100%",
            height: "100%",
            imageRendering: "pixelated",
          }}
        />

        <Text
          pos="absolute"
          top={12}
          left={12}
          c="chamonix.0"
          fw={600}
          size="sm"
          style={{ letterSpacing: 1 }}
        >
          SPELARE: HENRIK
        </Text>

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

        {(aimedLabel || hitMessage) && phase === "playing" && (
          <Text
            pos="absolute"
            bottom={16}
            left={0}
            right={0}
            ta="center"
            c="chamonix.0"
            fw={600}
            size="sm"
          >
            {hitMessage ?? aimedLabel}
          </Text>
        )}

        {phase === "start" && (
          <Stack
            align="center"
            justify="center"
            gap="sm"
            pos="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            style={{ backgroundColor: "rgba(13, 13, 12, 0.85)" }}
          >
            <Text c="chamonix.0" fw={600} fz={22} ta="center" px="md">
              Gruppera-korridorerna
            </Text>
            <Text c="dimmed" fz={14} ta="center" px="xl">
              Gå runt, hitta kollegorna och skjut på dem för att öppna deras
              sida.
            </Text>
            <Button color="sprout" onClick={startGame}>
              Kliv in i korridoren
            </Button>
          </Stack>
        )}
      </Box>

      <Group gap="sm" hiddenFrom="sm" justify="center">
        <Button
          variant="light"
          color="sprout"
          onPointerDown={setTouchKey("turnLeft", true)}
          onPointerUp={setTouchKey("turnLeft", false)}
          onPointerLeave={setTouchKey("turnLeft", false)}
        >
          ⟲
        </Button>
        <Button
          variant="light"
          color="sprout"
          onPointerDown={setTouchKey("back", true)}
          onPointerUp={setTouchKey("back", false)}
          onPointerLeave={setTouchKey("back", false)}
        >
          ▼
        </Button>
        <Button
          variant="light"
          color="sprout"
          onPointerDown={setTouchKey("forward", true)}
          onPointerUp={setTouchKey("forward", false)}
          onPointerLeave={setTouchKey("forward", false)}
        >
          ▲
        </Button>
        <Button
          variant="light"
          color="sprout"
          onPointerDown={setTouchKey("turnRight", true)}
          onPointerUp={setTouchKey("turnRight", false)}
          onPointerLeave={setTouchKey("turnRight", false)}
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
