"use client";

import { useState, type ReactNode } from "react";
import { Badge, Button, Group, Stack, Text, Title } from "@mantine/core";

import { KonsultCrossing } from "./KonsultCrossing";

type Mode = "corporate" | "personal";

type ModeViewProps = {
  children: ReactNode;
};

export const ModeView = ({ children }: ModeViewProps) => {
  const [mode, setMode] = useState<Mode>("corporate");

  return (
    <Stack gap="lg">
      {/* FIXED — identity block. Rendered client-side on this page so the */}
      {/* mode toggle can sit next to the name (see plans/lab/jonathan.md). */}
      <Stack gap="sm">
        <Group gap="sm" align="center" wrap="wrap">
          <Title order={1} fz={{ base: 36, md: 52 }}>
            Jonathan
          </Title>
          <Button
            variant="light"
            color="sprout"
            size="xs"
            onClick={() =>
              setMode((current) =>
                current === "corporate" ? "personal" : "corporate",
              )
            }
          >
            {mode === "corporate"
              ? "Personligt läge"
              : "Tillbaka till jobbet"}
          </Button>
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
