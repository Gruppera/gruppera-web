"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AspectRatio,
  Badge,
  Box,
  Button,
  Group,
  Image,
  SimpleGrid,
  Stack,
  Text,
  UnstyledButton,
} from "@mantine/core";
import { useReducedMotion } from "@mantine/hooks";

export type MemoryPerson = {
  slug: string;
  name: string;
  focus: string;
  photo: string;
};

type CardKind = "portrait" | "name";

type MemoryCard = {
  id: string;
  slug: string;
  kind: CardKind;
};

type MemoryGameProps = {
  people: MemoryPerson[];
  /** The consultant whose page this is. Their pair starts face up and locked. */
  ownSlug: string;
};

const buildDeck = (people: MemoryPerson[]): MemoryCard[] =>
  people.flatMap((person) => [
    { id: `${person.slug}-portrait`, slug: person.slug, kind: "portrait" as const },
    { id: `${person.slug}-name`, slug: person.slug, kind: "name" as const },
  ]);

/** Fisher-Yates over a supplied random source. */
const shuffle = (cards: MemoryCard[], random: () => number): MemoryCard[] => {
  const next = [...cards];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
};

/**
 * The opening deal is deterministic on purpose. This page is prerendered by the
 * static export, so a Math.random() deal during render would differ between the
 * server HTML and the first client render and break hydration. A fixed seed gives
 * the same well-scrambled board in both. "Blanda om" then reshuffles for real,
 * which is safe because it only ever runs from a click.
 */
const OPENING_SEED = 20260827;

const seededRandom = (seed: number): (() => number) => {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
};

export const MemoryGame = ({ people, ownSlug }: MemoryGameProps) => {
  const reduceMotion = useReducedMotion();

  const bySlug = useMemo(
    () => new Map(people.map((person) => [person.slug, person])),
    [people],
  );
  const byId = useMemo(() => {
    const deck = buildDeck(people);
    return new Map(deck.map((card) => [card.id, card]));
  }, [people]);

  const [deck, setDeck] = useState<MemoryCard[]>(() =>
    shuffle(buildDeck(people), seededRandom(OPENING_SEED)),
  );
  const [faceUp, setFaceUp] = useState<string[]>([]);
  const [matched, setMatched] = useState<string[]>([ownSlug]);
  const [moves, setMoves] = useState(0);
  const [locked, setLocked] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    [],
  );

  const reset = useCallback(() => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    setDeck((current) => shuffle(current, Math.random));
    setFaceUp([]);
    setMatched([ownSlug]);
    setMoves(0);
    setLocked(false);
  }, [ownSlug]);

  const pick = (card: MemoryCard) => {
    if (locked || matched.includes(card.slug) || faceUp.includes(card.id)) return;

    const next = [...faceUp, card.id];
    setFaceUp(next);

    if (next.length < 2) return;

    setMoves((value) => value + 1);
    const first = byId.get(next[0]);
    const second = byId.get(next[1]);

    if (first && second && first.slug === second.slug && first.kind !== second.kind) {
      setMatched((current) => [...current, first.slug]);
      setFaceUp([]);
      return;
    }

    setLocked(true);
    timer.current = window.setTimeout(
      () => {
        setFaceUp([]);
        setLocked(false);
      },
      reduceMotion ? 400 : 900,
    );
  };

  const found = matched.length;
  const total = people.length;
  const complete = found === total;

  return (
    <Stack gap="md">
      <Group justify="space-between" align="center" wrap="wrap" gap="xs">
        <Group gap="xs" align="center">
          <Badge color="patch" variant="light" size="sm">
            {found} av {total} par
          </Badge>
          <Text c="dimmed" fz={12}>
            {moves} försök
          </Text>
        </Group>
        <Button variant="subtle" color="moss" size="compact-sm" onClick={reset}>
          Blanda om
        </Button>
      </Group>

      <SimpleGrid cols={{ base: 3, xs: 4, sm: 5, md: 6 }} spacing="xs">
        {deck.map((card) => {
          const person = bySlug.get(card.slug);
          if (!person) return null;

          const isMatched = matched.includes(card.slug);
          const isUp = isMatched || faceUp.includes(card.id);

          const face =
            card.kind === "portrait" ? (
              <Image
                src={`/photos/${person.photo}`}
                alt={`Foto av ${person.name}`}
                fit="cover"
                h="100%"
                w="100%"
              />
            ) : (
              <Stack
                gap={2}
                justify="center"
                align="center"
                h="100%"
                bg="cognac.8"
                px={6}
              >
                <Text fz={{ base: 14, sm: 16 }} fw={600} c="chamonix.0" ta="center">
                  {person.name}
                </Text>
                <Text fz={12} c="patch.4" ta="center" lineClamp={2}>
                  {person.focus}
                </Text>
              </Stack>
            );

          const inner = (
            <Box style={{ perspective: 900, width: "100%", height: "100%" }}>
              <Box
                style={{
                  position: "relative",
                  width: "100%",
                  height: "100%",
                  transformStyle: "preserve-3d",
                  transform: isUp ? "rotateY(180deg)" : "rotateY(0deg)",
                  transition: reduceMotion ? undefined : "transform 260ms ease",
                }}
              >
                {/* back */}
                <Box
                  style={{
                    position: "absolute",
                    inset: 0,
                    backfaceVisibility: "hidden",
                    borderRadius: "var(--mantine-radius-md)",
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  bg="moss.8"
                >
                  <Image
                    src="/gruppera-logo-symbol.svg"
                    alt=""
                    w="46%"
                    style={{ opacity: 0.45 }}
                  />
                </Box>
                {/* face */}
                <Box
                  style={{
                    position: "absolute",
                    inset: 0,
                    backfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                    borderRadius: "var(--mantine-radius-md)",
                    overflow: "hidden",
                    outline: isMatched
                      ? "2px solid var(--mantine-color-patch-5)"
                      : undefined,
                    outlineOffset: -2,
                  }}
                  bg="grafite.6"
                >
                  {face}
                </Box>
              </Box>
            </Box>
          );

          if (isMatched) {
            return (
              <Box
                key={card.id}
                component={Link}
                href={`/vilka-ar-vi/${person.slug}`}
                aria-label={`Gå till ${person.name}s sida`}
                style={{ display: "block", textDecoration: "none" }}
              >
                <AspectRatio ratio={1}>{inner}</AspectRatio>
              </Box>
            );
          }

          return (
            <UnstyledButton
              key={card.id}
              onClick={() => pick(card)}
              aria-label={
                faceUp.includes(card.id)
                  ? card.kind === "portrait"
                    ? `Foto av ${person.name}`
                    : person.name
                  : "Vänd kort"
              }
              style={{ display: "block" }}
            >
              <AspectRatio ratio={1}>{inner}</AspectRatio>
            </UnstyledButton>
          );
        })}
      </SimpleGrid>

      <Text role="status" aria-live="polite" fz={{ base: 14, sm: 16 }} c="dimmed">
        {complete
          ? "Alla par hittade. Rätt lösning på rätt plats — elva delar som blir något först tillsammans. Klicka på ett kort för att träffa personen."
          : "Vänd två kort. Hittar du ansiktet och namnet som hör samman låses paret upp, och båda korten blir en länk till personens sida."}
      </Text>
    </Stack>
  );
};
