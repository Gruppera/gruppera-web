"use client";

import type { DragEvent } from "react";

import { KIND_LABELS } from "./componentKinds";
import { allEdges, CELL, COLS, edgeId, pixelOf, ROWS, type GridPoint } from "./grid";
import type { PlacedPiece } from "./graph";

type BoardProps = {
  placed: PlacedPiece[];
  energizedIds: Set<string>;
  onDropPiece: (from: GridPoint, to: GridPoint, dataTransferPayload: string) => void;
  onRemovePiece: (id: string) => void;
  onTogglePiece: (id: string) => void;
};

const KIND_COLOR: Record<string, string> = {
  battery: "#E0CCBE",
  resistor: "#95B354",
  wire: "#C3CED9",
  capacitor: "#824529",
  switch: "#757263",
  led: "#95B354",
};

const PieceSymbol = ({ piece }: { piece: PlacedPiece }) => {
  const label =
    piece.kind === "switch"
      ? piece.closed
        ? "⏻"
        : "⏼"
      : piece.kind === "led"
        ? "◉"
        : piece.kind === "resistor"
          ? "⌇"
          : piece.kind === "capacitor"
            ? "⫲"
            : piece.kind === "battery"
              ? "⎓"
              : "—";
  return (
    <span
      style={{
        fontSize: 14,
        color: KIND_COLOR[piece.kind],
        lineHeight: 1,
      }}
      aria-hidden
    >
      {label}
    </span>
  );
};

export const Board = ({
  placed,
  energizedIds,
  onDropPiece,
  onRemovePiece,
  onTogglePiece,
}: BoardProps) => {
  const edges = allEdges();
  const width = COLS * CELL;
  const height = ROWS * CELL;

  const placedByEdge = new Map<string, PlacedPiece>();
  placed.forEach((piece) => {
    const [colA, rowA] = piece.from.split(",").map(Number);
    const [colB, rowB] = piece.to.split(",").map(Number);
    placedByEdge.set(
      edgeId({ col: colA, row: rowA }, { col: colB, row: rowB }),
      piece,
    );
  });

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleDrop = (a: GridPoint, b: GridPoint) => (
    event: DragEvent<HTMLDivElement>,
  ) => {
    event.preventDefault();
    const payload = event.dataTransfer.getData("text/plain");
    if (!payload) return;
    onDropPiece(a, b, payload);
  };

  return (
    <div
      style={{
        position: "relative",
        width,
        height,
        margin: "0 auto",
      }}
    >
      {/* Grid dots */}
      {Array.from({ length: (COLS + 1) * (ROWS + 1) }).map((_, index) => {
        const col = index % (COLS + 1);
        const row = Math.floor(index / (COLS + 1));
        const { x, y } = pixelOf({ col, row });
        return (
          <div
            key={`dot-${col}-${row}`}
            style={{
              position: "absolute",
              left: x - 2,
              top: y - 2,
              width: 4,
              height: 4,
              borderRadius: "50%",
              background: "#757263",
            }}
          />
        );
      })}

      {edges.map(([a, b]) => {
        const id = edgeId(a, b);
        const piece = placedByEdge.get(id);
        const horizontal = a.row === b.row;
        const pa = pixelOf(a);
        const isBattery = piece?.kind === "battery";
        const energized = piece ? energizedIds.has(piece.id) : false;

        const baseStyle = horizontal
          ? {
              left: pa.x,
              top: pa.y - 12,
              width: CELL,
              height: 24,
            }
          : {
              left: pa.x - 12,
              top: pa.y,
              width: 24,
              height: CELL,
            };

        return (
          <div
            key={id}
            onDragOver={piece ? undefined : handleDragOver}
            onDrop={piece ? undefined : handleDrop(a, b)}
            onClick={
              piece && !isBattery
                ? () =>
                    piece.kind === "switch"
                      ? onTogglePiece(piece.id)
                      : onRemovePiece(piece.id)
                : undefined
            }
            title={
              piece
                ? `${piece.consultantName ?? KIND_LABELS[piece.kind]}${
                    isBattery ? "" : " (klicka för att ta bort)"
                  }`
                : "Släpp en komponent här"
            }
            style={{
              position: "absolute",
              ...baseStyle,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: piece ? (isBattery ? "default" : "pointer") : "copy",
              border: piece
                ? `2px solid ${energized ? "#95B354" : KIND_COLOR[piece.kind]}`
                : "1px dashed rgba(195, 206, 217, 0.25)",
              borderRadius: 4,
              background: energized ? "rgba(149, 179, 84, 0.15)" : "transparent",
              boxShadow: energized ? "0 0 8px rgba(149,179,84,0.6)" : undefined,
            }}
          >
            {piece?.consultantSlug ? (
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  overflow: "hidden",
                  border: `1px solid ${KIND_COLOR[piece.kind]}`,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/photos/${piece.consultantPhoto}`}
                  alt={piece.consultantName ?? ""}
                  width={20}
                  height={20}
                  style={{ objectFit: "cover", width: 20, height: 20 }}
                />
              </div>
            ) : (
              piece && <PieceSymbol piece={piece} />
            )}
          </div>
        );
      })}
    </div>
  );
};
