"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { Box, Button, Modal, Stack, Text, Title } from "@mantine/core";

import { Snake } from "./games/Snake";
import { SpaceInvaders } from "./games/SpaceInvaders";
import { Pong } from "./games/Pong";
import { Bubbles } from "./games/Bubbles";
import { Confetti } from "./Confetti";

const SARA_EMAIL = "sara.eriksson@gruppera.se";

type Effect = "flip" | "mirror" | "scramble";
type Game = "snake" | "invaders" | "pong" | "bubbles";

const EFFECTS: Effect[] = ["flip", "mirror", "scramble"];
const GAMES: Game[] = ["snake", "invaders", "pong", "bubbles"];

const pickRandom = <T,>(items: T[]): T =>
  items[Math.floor(Math.random() * items.length)];

const EFFECT_STYLE: Record<Effect, Partial<CSSStyleDeclaration>> = {
  flip: { transform: "scaleY(-1)" },
  mirror: { transform: "scaleX(-1)" },
  scramble: {
    transform: "rotate(18deg) skew(14deg, 10deg) scale(0.9)",
    filter: "hue-rotate(160deg) saturate(2.2) contrast(1.2)",
  },
};

const GAME_TITLES: Record<Game, string> = {
  snake: "Snake",
  invaders: "Space Invaders",
  pong: "Pong",
  bubbles: "Bubblor",
};

type SaraEasterEggProps = {
  colleaguePhotos: string[];
  saraPhoto: string;
};

const SARA_HREF = "/vilka-ar-vi/sara";

/**
 * Content root (`#sara-page-content`) is server-rendered by page.tsx; this
 * component only reaches it via the DOM, so server elements never cross the
 * client/server serialization boundary as React children.
 *
 * The page is a copy of /vilka-ar-vi (the grid), so there's no separate
 * "Sara" photo/title to hang a trigger on — the trigger is Sara's own card
 * in the grid (its link points back to this same page, so intercepting it
 * costs no real navigation).
 *
 * Two-step lock: clicking Sara's card only scrambles the page. Trying to
 * navigate away (any other link inside the content, including grid cards
 * and peer links) while scrambled is blocked and opens the game — winning
 * replays the blocked navigation.
 */
export const SaraEasterEgg = ({
  colleaguePhotos,
  saraPhoto,
}: SaraEasterEggProps) => {
  const [game, setGame] = useState<Game | null>(null);
  const [celebrating, setCelebrating] = useState(false);
  const scrambledRef = useRef(false);
  const pendingHrefRef = useRef<string | null>(null);

  useLayoutEffect(() => {
    // Attaches synchronously, before paint — a plain useEffect fires after
    // paint, which left a real window where a click landed on the anchor's
    // native href before our handler existed (first click "just navigated").
    // A tiny inline <script> in page.tsx covers the remaining gap before
    // hydration; if it already scrambled the page, adopt that state here
    // instead of re-triggering it.
    const content = document.getElementById("sara-page-content");
    if (!content) return;
    if (content.dataset.scrambled === "true") {
      scrambledRef.current = true;
    }

    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const link = target.closest("a");
      const href = link?.getAttribute("href");
      if (!link || !href) return;

      if (href === SARA_HREF) {
        event.preventDefault();
        event.stopPropagation();
        if (!scrambledRef.current) {
          scrambledRef.current = true;
          content.dataset.scrambled = "true";
          const effect = pickRandom(EFFECTS);
          Object.assign(content.style, EFFECT_STYLE[effect]);
        }
        return;
      }

      if (scrambledRef.current) {
        event.preventDefault();
        event.stopPropagation();
        pendingHrefRef.current = href;
        setGame(pickRandom(GAMES));
      }
    };

    content.addEventListener("click", onClick, true);
    return () => content.removeEventListener("click", onClick, true);
  }, []);

  const handleWin = () => {
    scrambledRef.current = false;
    const content = document.getElementById("sara-page-content");
    if (content) {
      content.style.transform = "";
      content.style.filter = "";
      delete content.dataset.scrambled;
    }
    setGame(null);
    // Winning drops the block entirely rather than replaying the one link
    // that was originally clicked — the celebration overlay below lets
    // people pick any profile once they dismiss it.
    pendingHrefRef.current = null;
    setCelebrating(true);
  };

  return (
    <>
      {celebrating && (
        <Box
          onClick={() => setCelebrating(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1002,
            background: "rgba(13, 13, 12, 0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <Confetti />
          <Stack
            align="center"
            gap="md"
            onClick={(event) => event.stopPropagation()}
            style={{ cursor: "default", textAlign: "center" }}
          >
            <Title order={2} c="chamonix.0" fz={{ base: 28, md: 40 }}>
              🎉 Du klarade det!
            </Title>
            <Text c="chamonix.2" size="lg" maw={420}>
              Vill du höra av dig till Sara?
            </Text>
            <Button
              component="a"
              href={`mailto:${SARA_EMAIL}`}
              color="sprout"
              size="lg"
              radius="md"
            >
              Maila Sara
            </Button>
            <Button
              disabled
              variant="outline"
              color="cloud"
              size="lg"
              radius="md"
              title="LinkedIn-länk kommer snart"
            >
              LinkedIn
            </Button>
            <Text c="chamonix.4" size="sm">
              Klicka var som helst för att fortsätta
            </Text>
          </Stack>
        </Box>
      )}

      <Modal
        opened={game !== null}
        onClose={() => {}}
        withCloseButton={false}
        closeOnClickOutside={false}
        closeOnEscape={false}
        fullScreen
        zIndex={1001}
        title={game ? GAME_TITLES[game] : ""}
        styles={{
          inner: { overflow: "hidden" },
          content: {
            display: "flex",
            flexDirection: "column",
            height: "100vh",
            overflow: "hidden",
          },
          body: {
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            overflow: "hidden",
            padding: "var(--mantine-spacing-md)",
          },
        }}
      >
      <Stack h="100%" gap="xs" style={{ minHeight: 0 }}>
        <Box style={{ flex: 1, minHeight: 0 }}>
          {game === "snake" && (
            <Snake
              photos={colleaguePhotos}
              saraPhoto={saraPhoto}
              onWin={handleWin}
            />
          )}
          {game === "invaders" && (
            <SpaceInvaders
              photos={colleaguePhotos}
              playerPhoto={saraPhoto}
              onWin={handleWin}
            />
          )}
          {game === "pong" && <Pong photos={colleaguePhotos} onWin={handleWin} />}
          {game === "bubbles" && (
            <Bubbles
              photos={colleaguePhotos}
              saraPhoto={saraPhoto}
              onWin={handleWin}
            />
          )}
        </Box>
      </Stack>
      </Modal>
    </>
  );
};
