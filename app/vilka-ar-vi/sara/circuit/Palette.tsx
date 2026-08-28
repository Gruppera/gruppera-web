"use client";

import type { DragEvent } from "react";
import Link from "next/link";
import { Badge, Group, Stack, Text } from "@mantine/core";

import {
  CONSULTANT_COMPONENTS,
  KIND_LABELS,
  type ComponentKind,
} from "./componentKinds";

const LIBRARY_KINDS: ComponentKind[] = [
  "wire",
  "resistor",
  "capacitor",
  "switch",
  "led",
];

type PaletteProps = {
  usedConsultantSlugs: Set<string>;
  unlockedSlugs: Set<string>;
};

const dragPayload = (
  kind: ComponentKind,
  consultant?: { slug: string; name: string; photo: string },
) =>
  JSON.stringify({
    kind,
    consultantSlug: consultant?.slug,
    consultantName: consultant?.name,
    consultantPhoto: consultant?.photo,
  });

export const Palette = ({ usedConsultantSlugs, unlockedSlugs }: PaletteProps) => {
  const onDragStart = (payload: string) => (event: DragEvent<HTMLDivElement>) => {
    event.dataTransfer.setData("text/plain", payload);
    event.dataTransfer.effectAllowed = "copy";
  };

  return (
    <Stack gap="md">
      <Stack gap="xs">
        <Text size="sm" fw={600} c="chamonix.2">
          Kollegor
        </Text>
        <Group gap="xs">
          {CONSULTANT_COMPONENTS.map((consultant) => {
            const used = usedConsultantSlugs.has(consultant.slug);
            const unlocked = unlockedSlugs.has(consultant.slug);
            const avatar = (
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  overflow: "hidden",
                  margin: "0 auto",
                  border: unlocked ? "2px solid #95B354" : "1px solid #757263",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/photos/${consultant.photo}`}
                  alt={consultant.name}
                  width={40}
                  height={40}
                  style={{ objectFit: "cover", width: 40, height: 40 }}
                />
              </div>
            );
            return (
              <div
                key={consultant.slug}
                draggable={!used}
                onDragStart={
                  used
                    ? undefined
                    : onDragStart(dragPayload(consultant.kind, consultant))
                }
                title={`${consultant.name} — ${KIND_LABELS[consultant.kind]}${
                  unlocked ? " — klar! Klicka för att gå till sidan." : ""
                }`}
                style={{
                  opacity: used && !unlocked ? 0.35 : 1,
                  cursor: unlocked ? "pointer" : used ? "default" : "grab",
                  textAlign: "center",
                  width: 56,
                }}
              >
                {unlocked ? (
                  <Link href={`/vilka-ar-vi/${consultant.slug}`}>{avatar}</Link>
                ) : (
                  avatar
                )}
                <Text size="xs" c="chamonix.3" truncate>
                  {consultant.name}
                </Text>
              </div>
            );
          })}
        </Group>
      </Stack>

      <Stack gap="xs">
        <Text size="sm" fw={600} c="chamonix.2">
          Bibliotek
        </Text>
        <Group gap="xs">
          {LIBRARY_KINDS.map((kind) => (
            <div
              key={kind}
              draggable
              onDragStart={onDragStart(dragPayload(kind))}
              style={{ cursor: "grab" }}
            >
              <Badge variant="outline" color="cloud" style={{ cursor: "grab" }}>
                {KIND_LABELS[kind]}
              </Badge>
            </div>
          ))}
        </Group>
      </Stack>
    </Stack>
  );
};
