"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActionIcon,
  AspectRatio,
  Avatar,
  Badge,
  Box,
  Button,
  Group,
  Text,
} from "@mantine/core";
import {
  IconArrowDown,
  IconArrowLeft,
  IconArrowRight,
  IconArrowUp,
  IconHeart,
  IconHeartFilled,
} from "@tabler/icons-react";

import mockData from "@/app/mockdata.json";
import { consultantListSchema } from "@/features/consultants/schemas";

const COLS = 9;
const ROWS = 9;
const GOAL_ROW = 0;
const SAFE_ROW = 4;
const START_ROW = 8;
const START_COL = 4;
const LIVES = 3;
const HIT = 0.85;
const LEVEL_STEP = 0.15;
const MAX_DT = 0.05;

type Status = "idle" | "playing" | "over";

type Lane = {
  row: number;
  dir: 1 | -1;
  speed: number;
  count: number;
};

const LANES: Lane[] = [
  { row: 1, dir: -1, speed: 1.6, count: 2 },
  { row: 2, dir: 1, speed: 1.1, count: 2 },
  { row: 3, dir: -1, speed: 2.2, count: 2 },
  { row: 5, dir: 1, speed: 1.4, count: 2 },
  { row: 6, dir: -1, speed: 1.9, count: 2 },
  { row: 7, dir: 1, speed: 2.4, count: 2 },
];

type Obstacle = {
  row: number;
  dir: 1 | -1;
  speed: number;
  phase: number;
  name: string;
  photo: string;
  x: number;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const bandBg = (row: number) => {
  if (row === GOAL_ROW) return "sprout.9";
  if (row === START_ROW) return "moss.9";
  if (row === SAFE_ROW) return "moss.8";
  return row % 2 === 0 ? "grafite.7" : "grafite.8";
};

export const KonsultCrossing = () => {
  const obstacleSeed = useMemo<Obstacle[]>(() => {
    const consultants = consultantListSchema.parse(mockData);
    const seed: Obstacle[] = [];
    let picked = 0;

    LANES.forEach((lane, laneIndex) => {
      const gap = COLS / lane.count;
      for (let i = 0; i < lane.count; i += 1) {
        const consultant = consultants[picked % consultants.length];
        picked += 1;
        seed.push({
          row: lane.row,
          dir: lane.dir,
          speed: lane.speed,
          phase: (i * gap + laneIndex * 1.3) % COLS,
          name: consultant.name,
          photo: consultant.photo,
          x: (i * gap + laneIndex * 1.3) % COLS,
        });
      }
    });

    return seed;
  }, []);

  const [status, setStatus] = useState<Status>("idle");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(LIVES);
  const [player, setPlayer] = useState({ col: START_COL, row: START_ROW });
  const [, setTick] = useState(0);

  const obstaclesRef = useRef<Obstacle[] | null>(null);
  if (obstaclesRef.current === null) {
    obstaclesRef.current = obstacleSeed.map((o) => ({ ...o }));
  }

  const playerRef = useRef(player);
  const scoreRef = useRef(0);
  const livesRef = useRef(LIVES);
  const lastNowRef = useRef<number | null>(null);

  const resetPlayer = () => {
    playerRef.current = { col: START_COL, row: START_ROW };
    setPlayer(playerRef.current);
  };

  const start = () => {
    scoreRef.current = 0;
    livesRef.current = LIVES;
    setScore(0);
    setLives(LIVES);
    obstaclesRef.current = obstacleSeed.map((o) => ({ ...o }));
    lastNowRef.current = null;
    resetPlayer();
    setStatus("playing");
  };

  const move = (dx: number, dy: number) => {
    if (status !== "playing") return;

    const next = {
      col: clamp(playerRef.current.col + dx, 0, COLS - 1),
      row: clamp(playerRef.current.row + dy, 0, ROWS - 1),
    };

    if (next.row === GOAL_ROW) {
      scoreRef.current += 1;
      setScore(scoreRef.current);
      resetPlayer();
      return;
    }

    playerRef.current = next;
    setPlayer(next);
  };

  useEffect(() => {
    if (status !== "playing") return undefined;

    let raf = 0;

    const loop = (now: number) => {
      const previous = lastNowRef.current ?? now;
      lastNowRef.current = now;
      const dt = Math.min((now - previous) / 1000, MAX_DT);
      const levelFactor = 1 + scoreRef.current * LEVEL_STEP;

      const obstacles = obstaclesRef.current ?? [];
      for (const obstacle of obstacles) {
        const moved =
          obstacle.x + obstacle.dir * obstacle.speed * levelFactor * dt;
        obstacle.x = ((moved % COLS) + COLS) % COLS;
      }

      const { col, row } = playerRef.current;
      const hit = obstacles.some((obstacle) => {
        if (obstacle.row !== row) return false;
        const raw = Math.abs(obstacle.x - (col + 0.5));
        return Math.min(raw, COLS - raw) < HIT;
      });

      if (hit) {
        livesRef.current -= 1;
        setLives(livesRef.current);
        resetPlayer();
        if (livesRef.current <= 0) {
          setStatus("over");
          return;
        }
      }

      setTick((value) => value + 1);
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [status]);

  useEffect(() => {
    if (status !== "playing") return undefined;

    const onKeyDown = (event: KeyboardEvent) => {
      const moves: Record<string, [number, number]> = {
        ArrowUp: [0, -1],
        ArrowDown: [0, 1],
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
      };
      const delta = moves[event.key];
      if (!delta) return;
      event.preventDefault();
      move(delta[0], delta[1]);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // `move` reads refs and the current `status`; re-bind when `status` changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const obstacles = obstaclesRef.current ?? [];
  const cellW = 100 / COLS;
  const cellH = 100 / ROWS;

  return (
    <Box>
      <Group justify="space-between" align="center" mb="sm">
        <Text size="sm" fw={500}>
          Poäng: {score}
        </Text>
        <Group gap={4} aria-label={`${lives} liv kvar`}>
          {Array.from({ length: LIVES }, (_, i) =>
            i < lives ? (
              <IconHeartFilled
                key={i}
                size={16}
                style={{ color: "var(--mantine-color-cognac-6)" }}
              />
            ) : (
              <IconHeart
                key={i}
                size={16}
                style={{ color: "var(--mantine-color-dimmed)" }}
              />
            ),
          )}
        </Group>
        {status !== "playing" ? (
          <Button size="xs" color="sprout" onClick={start}>
            {status === "over" ? "Spela igen" : "Starta"}
          </Button>
        ) : (
          <Text size="sm" c="dimmed">
            Nivå {1 + score}
          </Text>
        )}
      </Group>

      <Box maw={480} mx="auto">
        <AspectRatio ratio={1}>
          <Box
            pos="relative"
            style={{
              overflow: "hidden",
              borderRadius: "var(--mantine-radius-md)",
              border: "1px solid var(--mantine-color-default-border)",
            }}
          >
            {Array.from({ length: ROWS }, (_, row) => (
              <Box
                key={row}
                bg={bandBg(row)}
                pos="absolute"
                style={{
                  left: 0,
                  right: 0,
                  top: `${row * cellH}%`,
                  height: `${cellH}%`,
                }}
              />
            ))}

            <Badge
              color="sprout"
              variant="filled"
              size="sm"
              pos="absolute"
              style={{
                left: "50%",
                top: `${GOAL_ROW * cellH + cellH / 2}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              Deployad!
            </Badge>

            {obstacles.flatMap((obstacle, index) =>
              [-COLS, 0, COLS].map((ghost) => {
                const centre = obstacle.x + ghost;
                if (centre < -1 || centre > COLS + 1) return null;
                return (
                  <Avatar
                    key={`${index}-${ghost}`}
                    src={`/photos/${obstacle.photo}`}
                    alt={obstacle.name}
                    radius="xl"
                    pos="absolute"
                    style={{
                      left: `${(centre / COLS) * 100}%`,
                      top: `${obstacle.row * cellH}%`,
                      width: `${cellW}%`,
                      height: `${cellH}%`,
                      transform: "translateX(-50%)",
                    }}
                  />
                );
              }),
            )}

            <Avatar
              src="/photos/jonathan.png"
              alt="Jonathan"
              radius="xl"
              pos="absolute"
              style={{
                left: `${((player.col + 0.5) / COLS) * 100}%`,
                top: `${player.row * cellH}%`,
                width: `${cellW}%`,
                height: `${cellH}%`,
                transform: "translateX(-50%)",
                outline: "2px solid var(--mantine-color-sprout-5)",
                outlineOffset: 2,
              }}
            />
          </Box>
        </AspectRatio>
      </Box>

      <Box maw={168} mx="auto" mt="sm">
        <Group justify="center" gap={4} mb={4}>
          <ActionIcon
            variant="default"
            size="lg"
            aria-label="Upp"
            disabled={status !== "playing"}
            onClick={() => move(0, -1)}
          >
            <IconArrowUp size={18} />
          </ActionIcon>
        </Group>
        <Group justify="center" gap={4}>
          <ActionIcon
            variant="default"
            size="lg"
            aria-label="Vänster"
            disabled={status !== "playing"}
            onClick={() => move(-1, 0)}
          >
            <IconArrowLeft size={18} />
          </ActionIcon>
          <ActionIcon
            variant="default"
            size="lg"
            aria-label="Ner"
            disabled={status !== "playing"}
            onClick={() => move(0, 1)}
          >
            <IconArrowDown size={18} />
          </ActionIcon>
          <ActionIcon
            variant="default"
            size="lg"
            aria-label="Höger"
            disabled={status !== "playing"}
            onClick={() => move(1, 0)}
          >
            <IconArrowRight size={18} />
          </ActionIcon>
        </Group>
      </Box>
    </Box>
  );
};
