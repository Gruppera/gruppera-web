"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type TouchEvent as ReactTouchEvent,
} from "react";
import Link from "next/link";
import {
  ActionIcon,
  Anchor,
  AspectRatio,
  Avatar,
  Box,
  Button,
  Flex,
  Group,
  Overlay,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Transition,
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

const MET_KEY = "jonathan:fikapaus:met";
const SWIPE_THRESHOLD = 24;
const STRIDE_CAP = COLS - 2;
const ARRIVAL_MS = 2_200;
const WIN_MS = 3_600;
const SPAWN_MARGIN = 1.1;
const SPEED_JITTER = 0.4;

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
  baseSpeed: number;
  speed: number;
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

const pickConsultant = (
  consultants: Consultant[],
  excludeSlug?: string,
): Consultant => {
  const pool =
    excludeSlug === undefined
      ? consultants
      : consultants.filter((consultant) => consultant.slug !== excludeSlug);
  const from = pool.length > 0 ? pool : consultants;
  return from[Math.floor(Math.random() * from.length)];
};

const jitterSpeed = (base: number) =>
  base * (1 + (Math.random() * 2 - 1) * SPEED_JITTER);

// Re-enters the far edge as a different random colleague — never the same face.
const respawnObstacle = (obstacle: Obstacle, consultants: Consultant[]) => {
  const fresh = pickConsultant(consultants, obstacle.slug);
  obstacle.name = fresh.name;
  obstacle.slug = fresh.slug;
  obstacle.photo = fresh.photo;
  obstacle.speed = jitterSpeed(obstacle.baseSpeed);
  obstacle.x =
    obstacle.dir === 1
      ? -SPAWN_MARGIN - Math.random() * 1.5
      : COLS + SPAWN_MARGIN + Math.random() * 1.5;
};

const buildObstacles = (level: number, consultants: Consultant[]): Obstacle[] => {
  const count = countForLevel(level);
  const seed: Obstacle[] = [];

  LANES.forEach((lane, laneIndex) => {
    const gap = COLS / count;
    for (let i = 0; i < count; i += 1) {
      const consultant = pickConsultant(consultants);
      const offset = (i * gap + laneIndex * 1.3) % COLS;
      seed.push({
        row: lane.row,
        dir: lane.dir,
        baseSpeed: lane.baseSpeed,
        speed: jitterSpeed(lane.baseSpeed),
        x: offset,
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

const readMet = (): string[] => {
  try {
    const raw = window.localStorage.getItem(MET_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((slug): slug is string => typeof slug === "string")
      : [];
  } catch {
    return [];
  }
};

const writeMet = (slugs: string[]) => {
  try {
    window.localStorage.setItem(MET_KEY, JSON.stringify(slugs));
  } catch {
    // storage unavailable — unlocks stay session-only
  }
};

// Locked or not, every row is a real link; unlocking only reveals the face.
const RailItem = ({
  consultant,
  unlocked,
  reducedMotion,
}: {
  consultant: Consultant;
  unlocked: boolean;
  reducedMotion: boolean;
}) => (
  <Anchor
    component={Link}
    href={`/vilka-ar-vi/${consultant.slug}`}
    aria-label={consultant.name}
    underline={unlocked ? "hover" : "never"}
    style={{ display: "block", minWidth: 0 }}
  >
    <Group gap="xs" wrap="nowrap" style={{ minWidth: 0 }}>
      <Avatar
        src={`/photos/${consultant.photo}`}
        alt=""
        radius="xl"
        size={40}
        style={{
          flexShrink: 0,
          filter: unlocked ? undefined : "blur(6px) grayscale(0.5)",
          opacity: unlocked ? 1 : 0.7,
          transition: reducedMotion ? undefined : "filter 250ms ease",
        }}
      />
      {unlocked ? (
        <Text size="sm" c="sprout.6" fw={500} truncate>
          {consultant.name}
        </Text>
      ) : null}
    </Group>
  </Anchor>
);

// The colleague list: blurred and nameless until you meet someone in the game.
// Two columns so twelve rows don't run the full height of the board.
const ConsultantRail = ({
  consultants,
  metSlugs,
  reducedMotion,
}: {
  consultants: Consultant[];
  metSlugs: string[];
  reducedMotion: boolean;
}) => (
  <SimpleGrid
    role="group"
    aria-label="Kollegor — namn och bild visas när du möter dem i spelet"
    cols={2}
    spacing="xs"
    verticalSpacing="xs"
    w={{ base: "100%", sm: 300 }}
    style={{ flexShrink: 0, alignSelf: "flex-start" }}
  >
    {consultants.map((consultant) => (
      <RailItem
        key={consultant.slug}
        consultant={consultant}
        unlocked={metSlugs.includes(consultant.slug)}
        reducedMotion={reducedMotion}
      />
    ))}
  </SimpleGrid>
);

const CONFETTI_COLORS = [
  "var(--mantine-color-sprout-4)",
  "var(--mantine-color-moss-5)",
  "var(--mantine-color-cognac-4)",
  "var(--mantine-color-cloud-4)",
  "var(--mantine-color-patch-4)",
  "var(--mantine-color-chamonix-4)",
];

const CONFETTI = Array.from({ length: 30 }, (_, i) => ({
  left: (i * 34 + (i % 3) * 7) % 100,
  delay: (i % 6) * 0.13,
  duration: 1.5 + ((i * 7) % 10) / 10,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  size: 6 + ((i * 5) % 6),
  spin: i % 2 === 0 ? 620 : -540,
}));

// Reduced motion drops the confetti and keeps just the banner.
const WinCelebration = ({ reducedMotion }: { reducedMotion: boolean }) => (
  <Box
    aria-hidden
    style={{
      position: "absolute",
      inset: 0,
      zIndex: 6,
      pointerEvents: "none",
      overflow: "hidden",
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "center",
      paddingTop: 10,
    }}
  >
    {!reducedMotion ? (
      <>
        <style>{`
          @keyframes jonathanConfettiFall {
            0% { top: -10%; opacity: 0; transform: rotate(0deg); }
            12% { opacity: 1; }
            100% { top: 110%; opacity: 0; transform: rotate(var(--spin)); }
          }
        `}</style>
        {CONFETTI.map((piece, index) => (
          <Box
            key={index}
            style={{
              position: "absolute",
              top: "-10%",
              left: `${piece.left}%`,
              width: piece.size,
              height: piece.size,
              background: piece.color,
              borderRadius: 1,
              ["--spin" as string]: `${piece.spin}deg`,
              animation: `jonathanConfettiFall ${piece.duration}s ease-in ${piece.delay}s both`,
            }}
          />
        ))}
      </>
    ) : null}
    <Paper
      withBorder
      radius="md"
      px="md"
      py="xs"
      style={{ background: "var(--mantine-color-body)", textAlign: "center" }}
    >
      <Text fw={700} fz={18}>
        Hela Gruppera mött! 🎉
      </Text>
      <Text size="xs" c="dimmed">
        Alla kollegor är upplåsta i listan.
      </Text>
    </Paper>
  </Box>
);

type KonsultCrossingProps = {
  reducedMotion?: boolean;
};

export const KonsultCrossing = ({
  reducedMotion = false,
}: KonsultCrossingProps) => {
  const consultants = useMemo<Consultant[]>(
    () =>
      consultantListSchema
        .parse(mockData)
        .filter((consultant) => consultant.slug !== "jonathan"),
    [],
  );

  const [status, setStatus] = useState<Status>("playing");
  const [metSlugs, setMetSlugs] = useState<string[]>([]);
  const [player, setPlayer] = useState({ col: START_COL, row: START_ROW });
  const [culprit, setCulprit] = useState<{ name: string; slug: string } | null>(
    null,
  );
  const [arrival, setArrival] = useState<{ name: string; slug: string } | null>(
    null,
  );
  const [arrivalKey, setArrivalKey] = useState(0);
  const [showWin, setShowWin] = useState(false);
  const [, setTick] = useState(0);

  const allMet =
    consultants.length > 0 && metSlugs.length >= consultants.length;
  const celebratedRef = useRef(false);

  const obstaclesRef = useRef<Obstacle[] | null>(null);
  if (obstaclesRef.current === null) {
    obstaclesRef.current = buildObstacles(1, consultants);
  }

  const playerRef = useRef(player);
  const levelRef = useRef(1);
  const lastNowRef = useRef<number | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const replayRef = useRef<HTMLButtonElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    setMetSlugs(readMet());
  }, []);

  useEffect(() => {
    if (!allMet || celebratedRef.current) return undefined;
    celebratedRef.current = true;
    setShowWin(true);
    const timer = setTimeout(() => setShowWin(false), WIN_MS);
    return () => clearTimeout(timer);
  }, [allMet]);

  const unlock = useCallback((slug: string) => {
    setMetSlugs((previous) => {
      if (previous.includes(slug)) return previous;
      const next = [...previous, slug];
      writeMet(next);
      return next;
    });
  }, []);

  // Focus the board on mount so arrow keys work at once, and scroll it in view.
  useEffect(() => {
    boardRef.current?.focus({ preventScroll: true });
    boardRef.current?.scrollIntoView({
      block: "center",
      behavior: reducedMotion ? "auto" : "smooth",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (status === "over") {
      replayRef.current?.focus();
    }
  }, [status]);

  const resetPlayer = () => {
    playerRef.current = { col: START_COL, row: START_ROW };
    setPlayer(playerRef.current);
  };

  const start = () => {
    levelRef.current = 1;
    obstaclesRef.current = buildObstacles(1, consultants);
    lastNowRef.current = null;
    setCulprit(null);
    setArrival(null);
    resetPlayer();
    setStatus("playing");
    boardRef.current?.focus({ preventScroll: true });
  };

  const hitAt = (col: number, row: number): Obstacle | null => {
    const obstacles = obstaclesRef.current ?? [];
    return (
      obstacles.find((obstacle) => {
        if (obstacle.row !== row) return false;
        return Math.abs(obstacle.x - (col + 0.5)) < HIT;
      }) ?? null
    );
  };

  const endGame = useCallback(
    (struck: Obstacle | null) => {
      if (struck) {
        setCulprit({ name: struck.name, slug: struck.slug });
        unlock(struck.slug);
      }
      setStatus("over");
    },
    [unlock],
  );

  // Reduced-motion path: obstacles advance one turn per player move, stride
  // still scaled by lane speed and level.
  const stepObstacles = () => {
    const obstacles = obstaclesRef.current ?? [];
    const factor = speedFactor(levelRef.current);
    for (const obstacle of obstacles) {
      const stride = Math.min(
        STRIDE_CAP,
        Math.max(1, Math.round(obstacle.speed * factor)),
      );
      obstacle.x += obstacle.dir * stride;
      if (
        (obstacle.dir === 1 && obstacle.x > COLS + SPAWN_MARGIN) ||
        (obstacle.dir === -1 && obstacle.x < -SPAWN_MARGIN)
      ) {
        respawnObstacle(obstacle, consultants);
      }
    }
  };

  const move = (dx: number, dy: number) => {
    if (status !== "playing") return;

    const next = {
      col: clamp(playerRef.current.col + dx, 0, COLS - 1),
      row: clamp(playerRef.current.row + dy, 0, ROWS - 1),
    };

    if (next.row === GOAL_ROW) {
      levelRef.current += 1;
      obstaclesRef.current = buildObstacles(levelRef.current, consultants);
      const greeted =
        consultants[Math.floor(Math.random() * consultants.length)];
      setArrival({ name: greeted.name, slug: greeted.slug });
      setArrivalKey((key) => key + 1);
      unlock(greeted.slug);
      resetPlayer();
      return;
    }

    playerRef.current = next;
    setPlayer(next);

    if (reducedMotion) {
      const struckOnEntry = hitAt(next.col, next.row);
      if (struckOnEntry) {
        endGame(struckOnEntry);
        return;
      }
      stepObstacles();
      const struckAfterStep = hitAt(next.col, next.row);
      if (struckAfterStep) {
        endGame(struckAfterStep);
        return;
      }
      setTick((value) => value + 1);
    }
  };

  useEffect(() => {
    if (status !== "playing" || reducedMotion) return undefined;

    let raf = 0;
    lastNowRef.current = null;

    const loop = (now: number) => {
      const previous = lastNowRef.current ?? now;
      lastNowRef.current = now;
      const dt = Math.min((now - previous) / 1000, MAX_DT);
      const factor = speedFactor(levelRef.current);

      const obstacles = obstaclesRef.current ?? [];
      for (const obstacle of obstacles) {
        obstacle.x += obstacle.dir * obstacle.speed * factor * dt;
        if (
          (obstacle.dir === 1 && obstacle.x > COLS + SPAWN_MARGIN) ||
          (obstacle.dir === -1 && obstacle.x < -SPAWN_MARGIN)
        ) {
          respawnObstacle(obstacle, consultants);
        }
      }

      const { col, row } = playerRef.current;
      const struck = obstacles.find((obstacle) => {
        if (obstacle.row !== row) return false;
        return Math.abs(obstacle.x - (col + 0.5)) < HIT;
      });

      if (struck) {
        endGame(struck);
        return;
      }

      setTick((value) => value + 1);
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [status, reducedMotion, endGame, consultants]);

  useEffect(() => {
    if (arrivalKey === 0) return undefined;
    const timer = setTimeout(() => setArrival(null), ARRIVAL_MS);
    return () => clearTimeout(timer);
  }, [arrivalKey]);

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
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

  const handleTouchStart = (event: ReactTouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (event: ReactTouchEvent<HTMLDivElement>) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) < SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_THRESHOLD) {
      return;
    }
    if (Math.abs(dx) > Math.abs(dy)) {
      move(dx > 0 ? 1 : -1, 0);
    } else {
      move(0, dy > 0 ? 1 : -1);
    }
  };

  const obstacles = obstaclesRef.current ?? [];
  const cellW = 100 / COLS;
  const cellH = 100 / ROWS;

  const announcement = showWin
    ? "Alla kollegor upplåsta."
    : status === "over"
      ? culprit
        ? `Game over. Du mötte ${culprit.name}.`
        : "Game over."
      : arrival
        ? `Du mötte ${arrival.name} vid kaffemaskinen.`
        : "";

  return (
    <Box>
      <Text
        role="status"
        aria-live="polite"
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          overflow: "hidden",
          clip: "rect(0 0 0 0)",
          whiteSpace: "nowrap",
        }}
      >
        {announcement}
      </Text>

      <Flex
        gap="md"
        direction={{ base: "column", sm: "row" }}
        align={{ base: "stretch", sm: "flex-start" }}
      >
        <ConsultantRail
          consultants={consultants}
          metSlugs={metSlugs}
          reducedMotion={reducedMotion}
        />

        <Box style={{ flex: 1, minWidth: 0 }}>
          <Box maw={480} mx="auto">
            <AspectRatio ratio={1}>
              <Box
                ref={boardRef}
                tabIndex={0}
                role="application"
                aria-label="Fikapaus — hjälp Jonathan till kaffemaskinen"
                onKeyDown={handleKeyDown}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                pos="relative"
                style={{
                  overflow: "hidden",
                  borderRadius: "var(--mantine-radius-md)",
                  border: "1px solid var(--mantine-color-default-border)",
                  outlineOffset: 2,
                  touchAction: "none",
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
                      borderTop:
                        row === SAFE_ROW
                          ? "2px solid var(--mantine-color-sprout-5)"
                          : undefined,
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

                {obstacles.map((obstacle, index) => (
                  <Avatar
                    key={index}
                    src={`/photos/${obstacle.photo}`}
                    alt={obstacle.name}
                    radius="xl"
                    pos="absolute"
                    style={{
                      left: `${(obstacle.x / COLS) * 100}%`,
                      top: `${obstacle.row * cellH}%`,
                      width: `${cellW}%`,
                      height: `${cellH}%`,
                      transform: "translateX(-50%)",
                    }}
                  />
                ))}

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

                <Transition
                  mounted={arrival !== null && status === "playing"}
                  transition="fade"
                  duration={reducedMotion ? 0 : 200}
                >
                  {(styles) => (
                    <Box
                      style={{
                        ...styles,
                        position: "absolute",
                        left: "50%",
                        top: "40%",
                        transform: "translateX(-50%)",
                        width: "84%",
                        zIndex: 4,
                      }}
                    >
                      <Paper withBorder radius="md" px="sm" py="xs">
                        <Text size="xs" ta="center">
                          Du mötte{" "}
                          {arrival ? (
                            <Anchor
                              component={Link}
                              href={`/vilka-ar-vi/${arrival.slug}`}
                            >
                              {arrival.name}
                            </Anchor>
                          ) : null}{" "}
                          vid kaffemaskinen.
                        </Text>
                      </Paper>
                    </Box>
                  )}
                </Transition>

                {status === "over" ? (
                  <Overlay
                    color="var(--mantine-color-grafite-9)"
                    backgroundOpacity={0.72}
                    radius="md"
                    zIndex={5}
                    center
                  >
                    <Paper withBorder radius="md" p="md" maw="min(280px, 92%)">
                      <Stack gap="xs" align="center">
                        <Text fw={700} fz={20}>
                          Game over
                        </Text>
                        {culprit ? (
                          <Text size="sm" ta="center">
                            Du mötte{" "}
                            <Anchor
                              component={Link}
                              href={`/vilka-ar-vi/${culprit.slug}`}
                            >
                              {culprit.name}
                            </Anchor>{" "}
                            på väg dit — upplåst i listan.
                          </Text>
                        ) : null}
                        <Button
                          ref={replayRef}
                          size="xs"
                          color="sprout"
                          onClick={start}
                          mt={4}
                        >
                          Spela igen
                        </Button>
                        <Text size="xs" c="dimmed" ta="center">
                          Testa vårt andra spel:{" "}
                          <Anchor
                            href="https://skiordie.gruppera.se/"
                            target="_blank"
                            rel="noreferrer"
                          >
                            Ski or Die
                          </Anchor>
                        </Text>
                      </Stack>
                    </Paper>
                  </Overlay>
                ) : null}

                {showWin ? (
                  <WinCelebration reducedMotion={reducedMotion} />
                ) : null}
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
      </Flex>
    </Box>
  );
};
