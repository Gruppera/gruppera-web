"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ActionIcon,
  Anchor,
  AspectRatio,
  Avatar,
  Box,
  Button,
  Group,
  Stack,
  Text,
} from "@mantine/core";
import {
  IconArrowDown,
  IconArrowLeft,
  IconArrowRight,
  IconArrowUp,
  IconCoffee,
} from "@tabler/icons-react";

import mockData from "@/app/mockdata.json";
import { consultantListSchema } from "@/features/consultants/schemas";

const COLS = 9;
const ROWS = 9;
const GOAL_ROW = 0;
const SAFE_ROW = 4;
const START_ROW = 8;
const START_COL = 4;
const HIT = 0.85;
const MAX_DT = 0.05;

const BASE_FACTOR = 0.6;
const LEVEL_STEP = 0.16;
const MAX_FACTOR = 2.4;
const MAX_COUNT = 4;

type Status = "playing" | "over";

type Lane = {
  row: number;
  dir: 1 | -1;
  baseSpeed: number;
};

const LANES: Lane[] = [
  { row: 1, dir: -1, baseSpeed: 1.3 },
  { row: 2, dir: 1, baseSpeed: 0.9 },
  { row: 3, dir: -1, baseSpeed: 1.7 },
  { row: 5, dir: 1, baseSpeed: 1.1 },
  { row: 6, dir: -1, baseSpeed: 1.5 },
  { row: 7, dir: 1, baseSpeed: 1.9 },
];

type Obstacle = {
  row: number;
  dir: 1 | -1;
  speed: number;
  phase: number;
  x: number;
  name: string;
  slug: string;
  photo: string;
};

type Consultant = { name: string; slug: string; photo: string };

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const countForLevel = (level: number) =>
  Math.min(2 + Math.floor((level - 1) / 3), MAX_COUNT);

const speedFactor = (level: number) =>
  Math.min(BASE_FACTOR + (level - 1) * LEVEL_STEP, MAX_FACTOR);

const buildObstacles = (level: number, consultants: Consultant[]): Obstacle[] => {
  const count = countForLevel(level);
  const seed: Obstacle[] = [];
  let picked = 0;

  LANES.forEach((lane, laneIndex) => {
    const gap = COLS / count;
    for (let i = 0; i < count; i += 1) {
      const consultant = consultants[picked % consultants.length];
      picked += 1;
      const phase = (i * gap + laneIndex * 1.3) % COLS;
      seed.push({
        row: lane.row,
        dir: lane.dir,
        speed: lane.baseSpeed,
        phase,
        x: phase,
        name: consultant.name,
        slug: consultant.slug,
        photo: consultant.photo,
      });
    }
  });

  return seed;
};

const bandBg = (row: number) => {
  if (row === GOAL_ROW) return "cognac.9";
  if (row === START_ROW) return "moss.9";
  if (row === SAFE_ROW) return "moss.8";
  return row % 2 === 0 ? "grafite.7" : "grafite.8";
};

export const KonsultCrossing = () => {
  const consultants = useMemo<Consultant[]>(
    () =>
      consultantListSchema
        .parse(mockData)
        .filter((consultant) => consultant.slug !== "jonathan"),
    [],
  );

  const [status, setStatus] = useState<Status>("playing");
  const [level, setLevel] = useState(1);
  const [player, setPlayer] = useState({ col: START_COL, row: START_ROW });
  const [culprit, setCulprit] = useState<{ name: string; slug: string } | null>(
    null,
  );
  const [arrival, setArrival] = useState<{ name: string; slug: string } | null>(
    null,
  );
  const [arrivalKey, setArrivalKey] = useState(0);
  const [, setTick] = useState(0);

  const obstaclesRef = useRef<Obstacle[] | null>(null);
  if (obstaclesRef.current === null) {
    obstaclesRef.current = buildObstacles(1, consultants);
  }

  const playerRef = useRef(player);
  const levelRef = useRef(1);
  const lastNowRef = useRef<number | null>(null);

  const resetPlayer = () => {
    playerRef.current = { col: START_COL, row: START_ROW };
    setPlayer(playerRef.current);
  };

  const start = () => {
    levelRef.current = 1;
    setLevel(1);
    obstaclesRef.current = buildObstacles(1, consultants);
    lastNowRef.current = null;
    setCulprit(null);
    setArrival(null);
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
      levelRef.current += 1;
      setLevel(levelRef.current);
      obstaclesRef.current = buildObstacles(levelRef.current, consultants);
      const met = consultants[Math.floor(Math.random() * consultants.length)];
      setArrival({ name: met.name, slug: met.slug });
      setArrivalKey((key) => key + 1);
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
      const factor = speedFactor(levelRef.current);

      const obstacles = obstaclesRef.current ?? [];
      for (const obstacle of obstacles) {
        const moved = obstacle.x + obstacle.dir * obstacle.speed * factor * dt;
        obstacle.x = ((moved % COLS) + COLS) % COLS;
      }

      const { col, row } = playerRef.current;
      const struck = obstacles.find((obstacle) => {
        if (obstacle.row !== row) return false;
        const raw = Math.abs(obstacle.x - (col + 0.5));
        return Math.min(raw, COLS - raw) < HIT;
      });

      if (struck) {
        setCulprit({ name: struck.name, slug: struck.slug });
        setStatus("over");
        return;
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

  useEffect(() => {
    if (arrivalKey === 0) return undefined;
    const timer = setTimeout(() => setArrival(null), 2200);
    return () => clearTimeout(timer);
  }, [arrivalKey]);

  const obstacles = obstaclesRef.current ?? [];
  const cellW = 100 / COLS;
  const cellH = 100 / ROWS;

  return (
    <Box>
      {status === "over" ? (
        <Group justify="center" mb="sm">
          <Button size="xs" color="sprout" onClick={start}>
            Spela igen
          </Button>
        </Group>
      ) : null}

      <Group justify="space-between" align="center" mb="sm">
        <Text size="sm" fw={500}>
          Nivå: {level}
        </Text>
        <Box mih={20}>
          {arrival && status === "playing" ? (
            <Text size="sm" c="sprout.4" ta="right">
              Du mötte{" "}
              <Anchor component={Link} href={`/vilka-ar-vi/${arrival.slug}`}>
                {arrival.name}
              </Anchor>{" "}
              vid kaffemaskinen.
            </Text>
          ) : null}
        </Box>
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

            <Box
              pos="absolute"
              aria-label="Kaffemaskin"
              style={{
                left: "50%",
                top: `${GOAL_ROW * cellH + cellH / 2}%`,
                transform: "translate(-50%, -50%)",
                width: `${cellW * 1.9}%`,
                height: `${cellH * 0.92}%`,
              }}
            >
              <Box
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "var(--mantine-color-grafite-5)",
                  border: "1px solid var(--mantine-color-default-border)",
                  borderRadius: "var(--mantine-radius-sm)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 2,
                }}
              >
                <Box
                  style={{
                    width: "62%",
                    height: "24%",
                    background: "var(--mantine-color-grafite-7)",
                    borderRadius: 2,
                  }}
                />
                <IconCoffee
                  size={16}
                  style={{ color: "var(--mantine-color-cognac-4)" }}
                />
              </Box>
              <Box
                style={{
                  position: "absolute",
                  top: 3,
                  right: 3,
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: "var(--mantine-color-sprout-4)",
                }}
              />
            </Box>

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

      {status === "over" ? (
        <Stack gap={4} align="center" mt="sm">
          {culprit ? (
            <Text size="sm" c="dimmed" ta="center">
              Du mötte{" "}
              <Anchor component={Link} href={`/vilka-ar-vi/${culprit.slug}`}>
                {culprit.name}
              </Anchor>{" "}
              på väg till kaffemaskinen.
            </Text>
          ) : null}
          <Text size="sm" c="dimmed" ta="center">
            Game over — nådde nivå {level}. Testa vårt andra spel:{" "}
            <Anchor
              href="https://skiordie.gruppera.se/"
              target="_blank"
              rel="noreferrer"
            >
              Ski or Die
            </Anchor>
          </Text>
        </Stack>
      ) : null}

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
