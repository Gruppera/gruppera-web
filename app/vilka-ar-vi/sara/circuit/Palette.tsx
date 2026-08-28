"use client";

import type { DragEvent } from "react";
import Link from "next/link";
import { Badge, Card, Group, SimpleGrid, Stack, Text } from "@mantine/core";

import {
  CONSULTANT_COMPONENTS,
  KIND_DESCRIPTIONS,
  KIND_LABELS,
  KIND_ORDER,
  type ComponentKind,
} from "./componentKinds";

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
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
      {KIND_ORDER.map((kind) => {
        const people = CONSULTANT_COMPONENTS.filter((c) => c.kind === kind);
        return (
          <Card key={kind} withBorder padding="sm" radius="md" bg="chamonix.9">
            <Stack gap="xs">
              <Group gap="xs" align="baseline">
                <Text size="sm" fw={700} c="chamonix.0">
                  {KIND_LABELS[kind]}
                </Text>
                <Text size="xs" c="chamonix.4">
                  {people.length > 0
                    ? `— ${people.map((p) => p.name).join(", ")}`
                    : ""}
                </Text>
              </Group>
              <Text size="xs" c="dimmed">
                {KIND_DESCRIPTIONS[kind]}
              </Text>
              <div
                draggable
                onDragStart={onDragStart(dragPayload(kind))}
                style={{ cursor: "grab", alignSelf: "flex-start" }}
              >
                <Badge variant="outline" color="cloud" style={{ cursor: "grab" }}>
                  {KIND_LABELS[kind]}
                </Badge>
              </div>

              <SimpleGrid cols={{ base: 4, xs: 5 }} spacing={4}>
                {people.map((consultant) => {
                const isSara = consultant.slug === "sara";
                const used = usedConsultantSlugs.has(consultant.slug);
                const unlocked = !isSara && unlockedSlugs.has(consultant.slug);
                const avatar = (
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      overflow: "hidden",
                      border: unlocked
                        ? "2px solid #95B354"
                        : "1px solid #757263",
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
                        : onDragStart(dragPayload(kind, consultant))
                    }
                    title={`${consultant.name} — ${KIND_LABELS[kind]}${
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
                      <Link href={`/vilka-ar-vi/${consultant.slug}`}>
                        {avatar}
                      </Link>
                    ) : (
                      avatar
                    )}
                    <Text size="xs" c="chamonix.3" truncate>
                      {consultant.name}
                    </Text>
                  </div>
                );
                })}
              </SimpleGrid>
            </Stack>
          </Card>
        );
      })}
    </SimpleGrid>
  );
};
