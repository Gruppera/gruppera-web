"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Badge,
  Button,
  Group,
  Stack,
  Text,
  Title,
  Tooltip,
  Transition,
} from "@mantine/core";

import { KonsultCrossing } from "./KonsultCrossing";

type Mode = "corporate" | "personal";

const HINT_DELAY_MS = 5_000;

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
  const [mode, setMode] = useState<Mode>("corporate");
  const [showHint, setShowHint] = useState(false);
  const progress = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => setShowHint(true), HINT_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.altKey || event.metaKey) {
        return;
      }

      const key = event.key.toLowerCase();

      if (key === KONAMI[progress.current]) {
        progress.current += 1;
      } else {
        progress.current = key === KONAMI[0] ? 1 : 0;
      }

      if (progress.current === KONAMI.length) {
        progress.current = 0;
        // Konami only unlocks Personal mode; going back is the button.
        setMode((current) => (current === "corporate" ? "personal" : current));
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <Stack gap="lg">
      {/* FIXED — identity block. Rendered client-side on this page so the */}
      {/* konami hint / back button can sit next to the name (see plan). */}
      <Stack gap="sm">
        <Group gap="sm" align="center" wrap="wrap">
          <Title order={1} fz={{ base: 36, md: 52 }}>
            Jonathan
          </Title>
          {mode === "corporate" ? (
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
          ) : (
            <Button
              variant="light"
              color="sprout"
              size="xs"
              onClick={() => setMode("corporate")}
            >
              Tillbaka till jobbet
            </Button>
          )}
        </Group>
        <Badge color="sprout" variant="light" size="sm">
          Senior backend
        </Badge>
      </Stack>

      {mode === "corporate" ? (
        children
      ) : (
        <Stack gap="md">
          <Title order={3} fz={{ base: 22, md: 28 }}>
            Fikapaus
          </Title>
          <Text c="dimmed" fz={{ base: 14, sm: 16 }}>
            Hjälp Jonathan förbi kollegorna till kaffemaskinen. Piltangenter
            eller knapparna.
          </Text>
          <KonsultCrossing />
        </Stack>
      )}
    </Stack>
  );
};
