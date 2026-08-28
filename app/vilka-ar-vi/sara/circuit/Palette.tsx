"use client";

import type { DragEvent, KeyboardEvent } from "react";
import Link from "next/link";
import { Badge, Card, SimpleGrid, Stack, Text } from "@mantine/core";

import {
  ALWAYS_SHOWN_KINDS,
  CONSULTANT_COMPONENTS,
  KIND_DESCRIPTIONS,
  KIND_LABELS,
  KIND_ORDER,
  type ComponentKind,
} from "./componentKinds";
import { PCB } from "./theme";

type ArmedPayload = {
  kind: ComponentKind;
  consultantSlug?: string;
  consultantName?: string;
  consultantPhoto?: string;
};

type PaletteProps = {
  usedConsultantSlugs: Set<string>;
  unlockedSlugs: Set<string>;
  armedPayload: ArmedPayload | null;
  onArmPiece: (payload: ArmedPayload) => void;
};

const buildPayload = (
  kind: ComponentKind,
  consultant?: { slug: string; name: string; photo: string },
): ArmedPayload => ({
  kind,
  consultantSlug: consultant?.slug,
  consultantName: consultant?.name,
  consultantPhoto: consultant?.photo,
});

const activateOnKey = (onActivate: () => void) => (event: KeyboardEvent) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    onActivate();
  }
};

export const Palette = ({
  usedConsultantSlugs,
  unlockedSlugs,
  armedPayload,
  onArmPiece,
}: PaletteProps) => {
  const onDragStart = (payload: string) => (event: DragEvent<HTMLDivElement>) => {
    event.dataTransfer.setData("text/plain", payload);
    event.dataTransfer.effectAllowed = "copy";
  };

  const isArmed = (payload: ArmedPayload) =>
    armedPayload?.kind === payload.kind &&
    armedPayload?.consultantSlug === payload.consultantSlug;

  return (
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
      {KIND_ORDER.filter(
        (kind) =>
          ALWAYS_SHOWN_KINDS.includes(kind) ||
          CONSULTANT_COMPONENTS.some((c) => c.kind === kind),
      ).map((kind) => {
        const people = CONSULTANT_COMPONENTS.filter((c) => c.kind === kind);
        return (
          <Card
            key={kind}
            padding="sm"
            radius="sm"
            style={{
              backgroundColor: PCB.chip,
              border: `1px solid ${PCB.chipBorder}`,
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
            }}
          >
            <Stack gap="xs">
              <Text
                size="sm"
                fw={700}
                style={{
                  color: PCB.copperBright,
                  fontFamily: 'ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace',
                  letterSpacing: 0.5,
                }}
              >
                {KIND_LABELS[kind]}
              </Text>
              <Text size="xs" style={{ color: PCB.silkDim }}>
                {KIND_DESCRIPTIONS[kind]}
              </Text>
              <div
                role="button"
                tabIndex={0}
                aria-pressed={isArmed(buildPayload(kind))}
                aria-label={`Välj ${KIND_LABELS[kind]} för att placera i schemat`}
                draggable
                onDragStart={onDragStart(JSON.stringify(buildPayload(kind)))}
                onClick={() => onArmPiece(buildPayload(kind))}
                onKeyDown={activateOnKey(() => onArmPiece(buildPayload(kind)))}
                style={{
                  cursor: "grab",
                  alignSelf: "flex-start",
                  outline: isArmed(buildPayload(kind)) ? `2px solid ${PCB.copperBright}` : undefined,
                  outlineOffset: 2,
                  borderRadius: 4,
                }}
              >
                <Badge
                  variant="outline"
                  style={{
                    cursor: "grab",
                    color: PCB.copper,
                    borderColor: PCB.copper,
                    fontFamily: 'ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace',
                  }}
                >
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
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: unlocked
                        ? `2px solid ${PCB.glow}`
                        : `1px solid ${PCB.chipBorder}`,
                      backgroundColor: unlocked ? PCB.glow : undefined,
                      boxShadow: unlocked ? `0 0 10px ${PCB.glowSoft}` : undefined,
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/photos/${consultant.photo}`}
                      alt={consultant.name}
                      width={34}
                      height={34}
                      style={{ objectFit: "cover", width: 34, height: 34, borderRadius: "50%" }}
                    />
                  </div>
                );
                const payload = buildPayload(kind, consultant);
                const armed = isArmed(payload);
                const label = unlocked
                  ? `${consultant.name} — klar! Gå till sidan.`
                  : used
                    ? `${consultant.name} — redan i kretsen`
                    : `Välj ${consultant.name} (${KIND_LABELS[kind]}) för att placera i schemat`;
                return (
                  <div
                    key={consultant.slug}
                    role={used ? undefined : "button"}
                    tabIndex={used ? undefined : 0}
                    aria-pressed={used ? undefined : armed}
                    aria-label={used ? undefined : label}
                    draggable={!used}
                    onDragStart={used ? undefined : onDragStart(JSON.stringify(payload))}
                    onClick={used ? undefined : () => onArmPiece(payload)}
                    onKeyDown={used ? undefined : activateOnKey(() => onArmPiece(payload))}
                    title={label}
                    style={{
                      opacity: used && !unlocked ? 0.35 : 1,
                      cursor: unlocked ? "pointer" : used ? "default" : "grab",
                      textAlign: "center",
                      width: 56,
                      padding: 4,
                      borderRadius: 8,
                      outline: armed ? `2px solid ${PCB.copperBright}` : undefined,
                      outlineOffset: 2,
                    }}
                  >
                    {unlocked ? (
                      <Link href={`/vilka-ar-vi/${consultant.slug}`} aria-label={label}>
                        {avatar}
                      </Link>
                    ) : (
                      avatar
                    )}
                    <Text size="xs" style={{ color: PCB.silkDim }} truncate>
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
