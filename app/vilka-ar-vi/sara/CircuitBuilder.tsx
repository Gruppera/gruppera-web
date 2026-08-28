"use client";

import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Group, Stack, Text } from "@mantine/core";

import { Board } from "./circuit/Board";
import { Palette } from "./circuit/Palette";
import { evaluateCircuit, type PlacedPiece } from "./circuit/graph";
import { pointId, type GridPoint } from "./circuit/grid";
import type { ComponentKind } from "./circuit/componentKinds";

type DropPayload = {
  kind: ComponentKind;
  consultantSlug?: string;
  consultantName?: string;
  consultantPhoto?: string;
};

let nextId = 1;

export const CircuitBuilder = () => {
  const [placed, setPlaced] = useState<PlacedPiece[]>([]);
  const [unlockedSlugs, setUnlockedSlugs] = useState<Set<string>>(new Set());

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
    if (data.consultantSlug && usedConsultantSlugs.has(data.consultantSlug)) return;

    const piece: PlacedPiece = {
      id: `piece-${nextId}`,
      kind: data.kind,
      from: pointId(a),
      to: pointId(b),
      consultantSlug: data.consultantSlug,
      consultantName: data.consultantName,
      consultantPhoto: data.consultantPhoto,
      closed: data.kind === "switch" ? false : undefined,
    };
    nextId += 1;
    setPlaced((prev) => [...prev, piece]);
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

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-end" wrap="wrap">
        <Text c="dimmed" size="sm" maw={560}>
          Dra komponenter och slut kretsen.
        </Text>
        <Button
          variant="outline"
          color="cloud"
          size="xs"
          disabled={placed.length === 0}
          onClick={handleClearCircuit}
        >
          Rensa krets
        </Button>
      </Group>

      <Palette
        usedConsultantSlugs={usedConsultantSlugs}
        unlockedSlugs={unlockedSlugs}
      />

      <div style={{ overflowX: "auto", padding: "8px 0" }}>
        <Board
          placed={placed}
          energizedIds={result.won ? result.energizedIds : new Set()}
          flowDirection={result.won ? result.flowDirection : new Map()}
          onDropPiece={handleDropPiece}
          onRemovePiece={handleRemovePiece}
          onTogglePiece={handleTogglePiece}
          onFlipPiece={handleFlipPiece}
        />
      </div>

      {result.won ? (
        <Alert color="sprout" variant="light">
          Kretsen lyser! Klicka på en upplåst kollega ovan för att gå till deras
          sida.
        </Alert>
      ) : (
        result.hint && (
          <Alert color="cloud" variant="light">
            {result.hint}
          </Alert>
        )
      )}
    </Stack>
  );
};
