"use client";

import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Group, Stack, Text } from "@mantine/core";

import { Board } from "./circuit/Board";
import { Palette } from "./circuit/Palette";
import { evaluateCircuit, type PlacedPiece } from "./circuit/graph";
import { pointId, type GridPoint } from "./circuit/grid";
import type { ComponentKind } from "./circuit/componentKinds";
import { PCB } from "./circuit/theme";

type DropPayload = {
  kind: ComponentKind;
  consultantSlug?: string;
  consultantName?: string;
  consultantPhoto?: string;
  moveFromId?: string;
};

let nextId = 1;

export const CircuitBuilder = () => {
  const [placed, setPlaced] = useState<PlacedPiece[]>([]);
  const [unlockedSlugs, setUnlockedSlugs] = useState<Set<string>>(new Set());
  const [armedPayload, setArmedPayload] = useState<DropPayload | null>(null);

  const result = useMemo(() => evaluateCircuit(placed), [placed]);

  useEffect(() => {
    if (!result.won || result.energizedIds.size === 0) return;
    const newlyUnlocked = placed
      .filter((p) => result.energizedIds.has(p.id) && p.consultantSlug)
      .map((p) => p.consultantSlug as string);
    if (newlyUnlocked.length === 0) return;
    setUnlockedSlugs((prev) => {
      if (newlyUnlocked.every((slug) => prev.has(slug))) return prev;
      return new Set([...prev, ...newlyUnlocked]);
    });
    // `placed` intentionally excluded: this only needs to react to the
    // derived win/energized result, not every placement (which would re-run
    // this before `result` itself updates).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result.won, result.energizedIds]);

  const usedConsultantSlugs = new Set(
    placed.map((p) => p.consultantSlug).filter((slug): slug is string => Boolean(slug)),
  );

  const handleDropPiece = (a: GridPoint, b: GridPoint, payload: string) => {
    let data: DropPayload;
    try {
      data = JSON.parse(payload);
    } catch {
      return;
    }

    const moving = data.moveFromId
      ? placed.find((p) => p.id === data.moveFromId)
      : undefined;
    // A moved piece isn't "used" by its own old placement — exclude it before
    // checking whether this consultant is already elsewhere on the board.
    const otherUsedSlugs = data.moveFromId
      ? new Set(
          placed
            .filter((p) => p.id !== data.moveFromId)
            .map((p) => p.consultantSlug)
            .filter((slug): slug is string => Boolean(slug)),
        )
      : usedConsultantSlugs;
    if (data.consultantSlug && otherUsedSlugs.has(data.consultantSlug)) return;

    const piece: PlacedPiece = {
      id: moving?.id ?? `piece-${nextId}`,
      kind: data.kind,
      from: pointId(a),
      to: pointId(b),
      consultantSlug: data.consultantSlug,
      consultantName: data.consultantName,
      consultantPhoto: data.consultantPhoto,
      closed: moving ? moving.closed : data.kind === "switch" ? false : undefined,
      flipped: moving?.flipped,
    };
    if (!moving) nextId += 1;
    setPlaced((prev) => [...prev.filter((p) => p.id !== data.moveFromId), piece]);
  };

  const handleRemovePiece = (id: string) => {
    setPlaced((prev) => prev.filter((p) => p.id !== id));
  };

  const handleTogglePiece = (id: string) => {
    setPlaced((prev) =>
      prev.map((p) => (p.id === id ? { ...p, closed: !p.closed } : p)),
    );
  };

  const handleFlipPiece = (id: string) => {
    setPlaced((prev) =>
      prev.map((p) => (p.id === id ? { ...p, flipped: !p.flipped } : p)),
    );
  };

  const handleClearCircuit = () => {
    setPlaced([]);
  };

  /**
   * Keyboard/touch alternative to drag-and-drop: pressing a palette item
   * "arms" it (same payload shape a drag would carry), then pressing an
   * empty board slot places it there. Drag-and-drop keeps working
   * unchanged — this is additive, not a replacement.
   */
  const handleArmPiece = (payload: DropPayload) => {
    setArmedPayload((prev) =>
      prev &&
      prev.kind === payload.kind &&
      prev.consultantSlug === payload.consultantSlug
        ? null
        : payload,
    );
  };

  const handlePlaceArmedPiece = (a: GridPoint, b: GridPoint) => {
    if (!armedPayload) return;
    handleDropPiece(a, b, JSON.stringify(armedPayload));
    // A named piece is one-shot (that consultant is now used); a bare kind
    // badge stays armed so several plain wires/pieces can be placed in a row.
    if (armedPayload.consultantSlug) setArmedPayload(null);
  };

  return (
    <Stack gap="lg">
      <Palette
        usedConsultantSlugs={usedConsultantSlugs}
        unlockedSlugs={unlockedSlugs}
        armedPayload={armedPayload}
        onArmPiece={handleArmPiece}
      />

      <Group align="flex-start" wrap="wrap" gap="md">
        <div style={{ flex: "1 1 320px", padding: "8px 0" }}>
          <Board
            placed={placed}
            energizedIds={result.won ? result.energizedIds : new Set()}
            flowDirection={result.won ? result.flowDirection : new Map()}
            armed={armedPayload !== null}
            onDropPiece={handleDropPiece}
            onPlaceArmedPiece={handlePlaceArmedPiece}
            onRemovePiece={handleRemovePiece}
            onTogglePiece={handleTogglePiece}
            onFlipPiece={handleFlipPiece}
          />
        </div>
        <Button
          variant="outline"
          size="xs"
          disabled={placed.length === 0}
          onClick={handleClearCircuit}
          style={{
            color: PCB.copperBright,
            borderColor: PCB.copper,
            fontFamily: 'ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace',
          }}
        >
          Rensa krets
        </Button>
      </Group>

      <Text size="sm" maw={560} style={{ color: PCB.silkDim }}>
        Dra komponenter till schemat för att bygga kretsen, eller välj en
        komponent och tryck sedan på en tom plats.
      </Text>

      <div aria-live="polite">
        {result.won ? (
          <Alert
            variant="light"
            style={{
              backgroundColor: PCB.glowSoft,
              border: `1px solid ${PCB.glow}`,
              color: PCB.silk,
            }}
          >
            Kretsen lyser! Klicka på en upplåst kollega ovan för att gå till
            deras sida.
          </Alert>
        ) : (
          result.hint && (
            <Alert
              variant="light"
              style={{
                backgroundColor: PCB.chip,
                border: `1px solid ${PCB.chipBorder}`,
                color: PCB.silk,
              }}
            >
              {result.hint}
            </Alert>
          )
        )}
      </div>
    </Stack>
  );
};
