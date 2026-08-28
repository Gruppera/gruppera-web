"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Badge,
  Group,
  SegmentedControl,
  Stack,
  Text,
  Title,
  Tooltip,
  Transition,
} from "@mantine/core";
import { useReducedMotion } from "@mantine/hooks";

import { KonsultCrossing } from "./KonsultCrossing";

type Mode = "jobbet" | "fikapaus";

const HINT_DELAY_MS = 5_000;
const CHEAT_FLASH_MS = 2_200;

const KONAMI = [
  "arrowup",
  "arrowup",
  "arrowdown",
  "arrowdown",
  "arrowleft",
  "arrowright",
  "arrowleft",
  "arrowright",
  "b",
  "a",
] as const;

type ModeViewProps = {
  children: ReactNode;
};

export const ModeView = ({ children }: ModeViewProps) => {
  const [mode, setMode] = useState<Mode>("jobbet");
  const [showHint, setShowHint] = useState(false);
  const [showCheat, setShowCheat] = useState(false);
  const reducedMotion = useReducedMotion();

  // The key handler is bound once, so it reads `mode` through a ref.
  const modeRef = useRef(mode);
  // Last KONAMI.length keys; comparing the whole buffer means a wrong key or a
  // botched attempt just scrolls out and retrying works.
  const keyHistory = useRef<string[]>([]);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    const timer = setTimeout(() => setShowHint(true), HINT_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!showCheat) return undefined;
    const timer = setTimeout(() => setShowCheat(false), CHEAT_FLASH_MS);
    return () => clearTimeout(timer);
  }, [showCheat]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || event.ctrlKey || event.altKey || event.metaKey) {
        return;
      }
      const target = event.target as HTMLElement | null;
      if (
        target?.closest('input, textarea, select, [contenteditable="true"]')
      ) {
        return;
      }

      const history = keyHistory.current;
      history.push(event.key.toLowerCase());
      if (history.length > KONAMI.length) {
        history.shift();
      }

      const matched =
        history.length === KONAMI.length &&
        history.every((key, index) => key === KONAMI[index]);

      if (matched && modeRef.current === "jobbet") {
        keyHistory.current = [];
        setMode("fikapaus");
        setShowCheat(true);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <Stack gap="lg">
      {/* FIXED — identity block. Rendered client-side on this page so the */}
      {/* konami hint and the mode toggle can sit next to the name.        */}
      <Stack gap="sm">
        <Group gap="sm" align="center" wrap="wrap">
          <Title order={1} fz={{ base: 36, md: 52 }}>
            Jonathan
          </Title>
          <Transition mounted={showCheat} transition="pop" duration={200}>
            {(styles) => (
              <Badge style={styles} color="sprout" variant="filled" size="sm">
                Fuskkod aktiverad
              </Badge>
            )}
          </Transition>
        </Group>

        <Group gap="sm" align="center" wrap="wrap">
          <Badge color="sprout" variant="light" size="sm">
            Senior backend
          </Badge>
          <SegmentedControl
            size="xs"
            color="sprout"
            value={mode}
            onChange={(value) => setMode(value as Mode)}
            data={[
              { label: "Jobbet", value: "jobbet" },
              { label: "Fikapaus", value: "fikapaus" },
            ]}
            aria-label="Växla mellan jobbvyn och fikapaus"
          />
          {mode === "jobbet" ? (
            <Transition mounted={showHint} transition="fade" duration={200}>
              {(styles) => (
                <Tooltip label="↑ ↑ ↓ ↓ ← → ← → B A" withArrow>
                  <Text
                    style={styles}
                    component="span"
                    tabIndex={0}
                    c="dimmed"
                    size="sm"
                  >
                    Kan du konami-koden?
                  </Text>
                </Tooltip>
              )}
            </Transition>
          ) : null}
        </Group>
      </Stack>

      {mode === "jobbet" ? (
        children
      ) : (
        <Stack gap="md">
          <Title order={3} fz={{ base: 22, md: 28 }}>
            Fikapaus
          </Title>
          <Text c="dimmed" fz={{ base: 14, sm: 16 }}>
            Hjälp Jonathan förbi kollegorna till kaffemaskinen. Piltangenter,
            svep på spelplanen eller knapparna.
          </Text>
          <KonsultCrossing reducedMotion={reducedMotion ?? false} />
        </Stack>
      )}
    </Stack>
  );
};
