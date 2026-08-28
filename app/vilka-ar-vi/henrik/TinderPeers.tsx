"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AspectRatio,
  Badge,
  Box,
  Button,
  Card,
  CardSection,
  Divider,
  Group,
  Image,
  Stack,
  Text,
  Title,
} from "@mantine/core";

import mockData from "@/app/mockdata.json";
import { consultantListSchema } from "@/features/consultants/schemas";

type TinderPeersProps = {
  currentSlug: string;
};

type ExitDirection = "left" | "right";

const SWIPE_THRESHOLD_PX = 80;
const EXIT_TRANSITION_MS = 250;

export const TinderPeers = ({ currentSlug }: TinderPeersProps) => {
  const router = useRouter();

  const peers = useMemo(() => {
    const consultants = consultantListSchema.parse(mockData);
    return consultants
      .filter((consultant) => consultant.slug !== currentSlug)
      .sort((a, b) => a.name.localeCompare(b.name, "sv"));
  }, [currentSlug]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [exiting, setExiting] = useState<ExitDirection | null>(null);
  const [reducedMotion] = useState(() =>
    typeof window === "undefined"
      ? false
      : window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  const startXRef = useRef(0);
  const didDragRef = useRef(false);
  const pointerIdRef = useRef<number | null>(null);

  const commitSwipe = (direction: ExitDirection, slug: string) => {
    if (exiting) return;
    setIsDragging(false);
    setExiting(direction);

    const advance = () => {
      setCurrentIndex((i) => i + 1);
      setExiting(null);
      setDragX(0);
    };

    if (reducedMotion) {
      if (direction === "right") router.push(`/vilka-ar-vi/${slug}`);
      advance();
      return;
    }

    if (direction === "right") {
      window.setTimeout(() => router.push(`/vilka-ar-vi/${slug}`), EXIT_TRANSITION_MS);
    }
    window.setTimeout(advance, EXIT_TRANSITION_MS);
  };

  const onPointerDown = (e: React.PointerEvent, index: number) => {
    if (index !== currentIndex || exiting) return;
    startXRef.current = e.clientX;
    didDragRef.current = false;
    pointerIdRef.current = e.pointerId;
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent, index: number) => {
    if (index !== currentIndex || !isDragging || pointerIdRef.current !== e.pointerId) {
      return;
    }
    const delta = e.clientX - startXRef.current;
    if (Math.abs(delta) > 6) didDragRef.current = true;
    setDragX(delta);
  };

  const onPointerUp = (e: React.PointerEvent, index: number, slug: string) => {
    if (index !== currentIndex || pointerIdRef.current !== e.pointerId) return;
    pointerIdRef.current = null;
    setIsDragging(false);

    if (Math.abs(dragX) > SWIPE_THRESHOLD_PX) {
      commitSwipe(dragX > 0 ? "right" : "left", slug);
    } else {
      setDragX(0);
    }
  };

  const onCardLinkClick = (e: React.MouseEvent) => {
    if (didDragRef.current) {
      e.preventDefault();
      didDragRef.current = false;
    }
  };

  const allDone = currentIndex >= peers.length;
  const transitionMs = reducedMotion ? 0 : EXIT_TRANSITION_MS;

  return (
    <Stack gap="lg">
      <Divider />
      <Title order={3} fz={{ base: 22, md: 28 }}>
        Fler konsulter
      </Title>
      <Text c="dimmed" fz={{ base: 13, sm: 14 }}>
        Svep höger för att besöka, vänster för att gå vidare — eller använd
        knapparna nedan.
      </Text>

      <Box
        pos="relative"
        mx="auto"
        style={{ width: "100%", maxWidth: 360, height: 520 }}
      >
        {peers.map((peer, index) => {
          const isTop = index === currentIndex;
          const isPeek1 = index === currentIndex + 1;
          const isPeek2 = index === currentIndex + 2;

          // Only the top card and its two peeks ever need a transform (and
          // the GPU compositor layer that comes with one) — cards outside
          // that window sit invisibly with none, so a 10-person deck doesn't
          // promote 10 layers of full-size portraits at once.
          let transform = "none";
          let opacity = 0;
          if (isTop) {
            if (exiting) {
              transform = `translateX(${exiting === "right" ? 480 : -480}px) rotate(${
                exiting === "right" ? 24 : -24
              }deg)`;
              opacity = 0;
            } else {
              transform = `translateX(${dragX}px) rotate(${dragX / 18}deg)`;
              opacity = 1;
            }
          } else if (isPeek1) {
            transform = "translateY(10px) scale(0.96)";
            opacity = 1;
          } else if (isPeek2) {
            transform = "translateY(20px) scale(0.92)";
            opacity = 1;
          }

          return (
            <Box
              key={peer.slug}
              pos="absolute"
              top={0}
              left={0}
              right={0}
              bottom={0}
              style={{
                transform,
                opacity,
                zIndex: peers.length - index,
                pointerEvents: isTop && !exiting ? "auto" : "none",
                transition:
                  isTop && isDragging
                    ? "none"
                    : `transform ${transitionMs}ms ease, opacity ${transitionMs}ms ease`,
                touchAction: "pan-y",
              }}
            >
              <Link
                href={`/vilka-ar-vi/${peer.slug}`}
                onClick={onCardLinkClick}
                onPointerDown={(e) => onPointerDown(e, index)}
                onPointerMove={(e) => onPointerMove(e, index)}
                onPointerUp={(e) => onPointerUp(e, index, peer.slug)}
                style={{ textDecoration: "none", display: "block", height: "100%" }}
                tabIndex={isTop ? 0 : -1}
                aria-hidden={!isTop}
              >
                <Card
                  radius="md"
                  p={0}
                  withBorder
                  shadow="md"
                  style={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    backgroundColor: "var(--mantine-color-grafite-8)",
                    userSelect: "none",
                  }}
                >
                  <CardSection>
                    <AspectRatio ratio={4 / 3}>
                      <Image
                        alt={`${peer.name} portrait`}
                        src={`/photos/corridor/${peer.photo}`}
                        fit="cover"
                        draggable={false}
                      />
                    </AspectRatio>
                  </CardSection>
                  <Stack gap={6} p="md" style={{ flex: 1, overflow: "hidden" }}>
                    <Group justify="space-between" align="center">
                      <Title order={4} fz={22}>
                        {peer.name}
                      </Title>
                      <Badge color="sprout" variant="light" size="sm">
                        {peer.focus}
                      </Badge>
                    </Group>
                    <Text fz={14} c="chamonix.2" lineClamp={4}>
                      {peer.about}
                    </Text>
                  </Stack>
                </Card>
              </Link>
            </Box>
          );
        })}

        {allDone && (
          <Stack
            align="center"
            justify="center"
            gap="sm"
            pos="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            style={{
              backgroundColor: "var(--mantine-color-grafite-8)",
              borderRadius: "var(--mantine-radius-md)",
            }}
          >
            <Text c="chamonix.0" fw={600}>
              Det var alla!
            </Text>
            <Button color="sprout" onClick={() => setCurrentIndex(0)}>
              Börja om
            </Button>
          </Stack>
        )}
      </Box>

      {!allDone && (
        <Group justify="center" gap="xl">
          <Button
            variant="light"
            color="cognac"
            radius="xl"
            size="lg"
            aria-label="Nästa"
            onClick={() => commitSwipe("left", peers[currentIndex]?.slug ?? "")}
          >
            ✗ Nästa
          </Button>
          <Button
            variant="filled"
            color="sprout"
            radius="xl"
            size="lg"
            aria-label="Besök"
            onClick={() => commitSwipe("right", peers[currentIndex]?.slug ?? "")}
          >
            ❤ Besök
          </Button>
        </Group>
      )}

      <Stack gap={4}>
        <Text c="dimmed" size="sm">
          Hoppa direkt till:
        </Text>
        <Group gap="md">
          {peers.map((peer) => (
            <Link
              key={peer.slug}
              href={`/vilka-ar-vi/${peer.slug}`}
              style={{ textDecoration: "none" }}
            >
              <Text c="sprout.6" fw={500} size="sm">
                {peer.name}
              </Text>
            </Link>
          ))}
        </Group>
      </Stack>

      <Link href="/vilka-ar-vi" style={{ textDecoration: "none" }}>
        <Text c="dimmed" size="sm">
          ← Tillbaka till Vilka är vi
        </Text>
      </Link>
    </Stack>
  );
};
