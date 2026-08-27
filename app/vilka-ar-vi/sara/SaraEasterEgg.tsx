"use client";

import { useEffect, useRef, useState } from "react";
import { Modal, Text } from "@mantine/core";

import { Snake } from "./games/Snake";
import { SpaceInvaders } from "./games/SpaceInvaders";
import { Pong } from "./games/Pong";

type Effect = "flip" | "mirror" | "scramble";
type Game = "snake" | "invaders" | "pong";

const EFFECTS: Effect[] = ["flip", "mirror", "scramble"];
const GAMES: Game[] = ["snake", "invaders", "pong"];

const pickRandom = <T,>(items: T[]): T =>
  items[Math.floor(Math.random() * items.length)];

const EFFECT_STYLE: Record<Effect, Partial<CSSStyleDeclaration>> = {
  flip: { transform: "scaleY(-1)" },
  mirror: { transform: "scaleX(-1)" },
  scramble: {
    transform: "rotate(8deg) skew(6deg, 3deg)",
    filter: "hue-rotate(140deg) saturate(1.6)",
  },
};

const GAME_TITLES: Record<Game, string> = {
  snake: "Snake",
  invaders: "Space Invaders",
  pong: "Pong",
};

type SaraEasterEggProps = {
  colleaguePhotos: string[];
};

/**
 * Content root (`#sara-page-content`) is server-rendered by page.tsx; this
 * component only reaches it via the DOM, so server elements never cross the
 * client/server serialization boundary as React children.
 *
 * Two-step lock: clicking the name/photo only scrambles the page. Trying to
 * navigate away (any link inside the content, including peer/grid cards)
 * while scrambled is blocked and opens the game — winning replays the
 * blocked navigation.
 */
export const SaraEasterEgg = ({ colleaguePhotos }: SaraEasterEggProps) => {
  const [game, setGame] = useState<Game | null>(null);
  const scrambledRef = useRef(false);
  const pendingHrefRef = useRef<string | null>(null);

  useEffect(() => {
    const content = document.getElementById("sara-page-content");
    if (!content) return;

    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      const link = target.closest("a");
      if (scrambledRef.current && link && link.getAttribute("href")) {
        event.preventDefault();
        event.stopPropagation();
        pendingHrefRef.current = link.getAttribute("href");
        setGame(pickRandom(GAMES));
        return;
      }

      if (!scrambledRef.current && target.closest('[data-easter-trigger="sara"]')) {
        scrambledRef.current = true;
        const effect = pickRandom(EFFECTS);
        Object.assign(content.style, EFFECT_STYLE[effect]);
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
    }
    setGame(null);

    const href = pendingHrefRef.current;
    pendingHrefRef.current = null;
    if (href) {
      window.location.assign(href);
    }
  };

  return (
    <Modal
      opened={game !== null}
      onClose={() => {}}
      withCloseButton={false}
      closeOnClickOutside={false}
      closeOnEscape={false}
      centered
      size="lg"
      title={game ? `Klara ${GAME_TITLES[game]} för att komma vidare` : ""}
    >
      {game === "snake" && <Snake photos={colleaguePhotos} onWin={handleWin} />}
      {game === "invaders" && (
        <SpaceInvaders photos={colleaguePhotos} onWin={handleWin} />
      )}
      {game === "pong" && <Pong photos={colleaguePhotos} onWin={handleWin} />}
      <Text c="dimmed" size="sm" mt="sm">
        Sidan är scramblad tills du vinner.
      </Text>
    </Modal>
  );
};
