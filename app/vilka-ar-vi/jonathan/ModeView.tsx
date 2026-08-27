"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  Badge,
  Group,
  SegmentedControl,
  Stack,
  Text,
  Title,
  Transition,
} from "@mantine/core";

type Mode = "corporate" | "personal";

const TOGGLE_DELAY_MS = 10_000;

type ModeViewProps = {
  children: ReactNode;
};

export const ModeView = ({ children }: ModeViewProps) => {
  const [mode, setMode] = useState<Mode>("corporate");
  const [showToggle, setShowToggle] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowToggle(true), TOGGLE_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Stack gap="lg">
      {/* FIXED — identity block. Rendered client-side on this page so the */}
      {/* mode toggle can sit next to the name (see plans/lab/jonathan.md). */}
      <Stack gap="sm">
        <Group gap="sm" align="center" wrap="wrap">
          <Title order={1} fz={{ base: 36, md: 52 }}>
            Jonathan
          </Title>
          <Transition mounted={showToggle} transition="pop" duration={200}>
            {(styles) => (
              <SegmentedControl
                style={styles}
                size="xs"
                value={mode}
                onChange={(value) => setMode(value as Mode)}
                data={[
                  { label: "Corporate", value: "corporate" },
                  { label: "Personal", value: "personal" },
                ]}
              />
            )}
          </Transition>
        </Group>
        <Badge color="sprout" variant="light" size="sm">
          Senior backend
        </Badge>
      </Stack>

      {mode === "corporate" ? (
        children
      ) : (
        <Text c="dimmed" fz={{ base: 14, sm: 16 }}>
          Personligt läge — kommer snart.
        </Text>
      )}
    </Stack>
  );
};
