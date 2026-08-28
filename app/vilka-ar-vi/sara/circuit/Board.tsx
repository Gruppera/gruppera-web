"use client";

import type { DragEvent } from "react";

import { KIND_LABELS, type ComponentKind } from "./componentKinds";
import { allEdges, CELL, COLS, edgeId, pixelOf, pointId, ROWS, type GridPoint } from "./grid";
import type { FlowDirection, PlacedPiece } from "./graph";

type BoardProps = {
  placed: PlacedPiece[];
  energizedIds: Set<string>;
  flowDirection: FlowDirection;
  onDropPiece: (from: GridPoint, to: GridPoint, dataTransferPayload: string) => void;
  onRemovePiece: (id: string) => void;
  onTogglePiece: (id: string) => void;
  onFlipPiece: (id: string) => void;
};

const KIND_COLOR: Record<ComponentKind, string> = {
  battery: "#E0CCBE",
  resistor: "#95B354",
  wire: "#C3CED9",
  capacitor: "#824529",
  switch: "#757263",
  led: "#95B354",
  ground: "#C3CED9",
};

const L = CELL;

/**
 * Standard schematic symbols, drawn in local coordinates for a horizontal
 * edge running from (0,0) to (L,0) — the caller rotates/translates the
 * whole <g> into place for vertical edges. IEC-ish conventions: zigzag
 * resistor, parallel-plate capacitor, knife switch, multi-line battery,
 * diode-triangle LED with emission arrows, ground hatch.
 */
const Symbol = ({ kind, closed }: { kind: ComponentKind; closed?: boolean }) => {
  const stroke = KIND_COLOR[kind];
  const common = { stroke, strokeWidth: 2, fill: "none" } as const;

  switch (kind) {
    case "wire":
      return <line x1={0} y1={0} x2={L} y2={0} {...common} />;
    case "resistor": {
      const a = L * 0.32;
      const b = L * 0.68;
      const seg = (b - a) / 6;
      const amp = 8;
      const zig = [
        [a, 0],
        [a + seg, -amp],
        [a + seg * 2, amp],
        [a + seg * 3, -amp],
        [a + seg * 4, amp],
        [a + seg * 5, -amp],
        [b, 0],
      ]
        .map((p) => p.join(","))
        .join(" ");
      return (
        <g {...common}>
          <line x1={0} y1={0} x2={a} y2={0} />
          <polyline points={zig} />
          <line x1={b} y1={0} x2={L} y2={0} />
        </g>
      );
    }
    case "capacitor": {
      const a = L * 0.46;
      const b = L * 0.54;
      return (
        <g {...common}>
          <line x1={0} y1={0} x2={a} y2={0} />
          <line x1={a} y1={-11} x2={a} y2={11} />
          <line x1={b} y1={-11} x2={b} y2={11} />
          <line x1={b} y1={0} x2={L} y2={0} />
        </g>
      );
    }
    case "switch": {
      const a = L * 0.35;
      const b = L * 0.65;
      return (
        <g {...common}>
          <line x1={0} y1={0} x2={a} y2={0} />
          <line x1={b} y1={0} x2={L} y2={0} />
          <circle cx={a} cy={0} r={2.5} fill={stroke} />
          <circle cx={b} cy={0} r={2.5} fill={stroke} />
          {closed ? (
            <line x1={a} y1={0} x2={b} y2={0} />
          ) : (
            <line x1={a} y1={0} x2={b - 6} y2={-14} />
          )}
        </g>
      );
    }
    case "battery": {
      const mid = L / 2;
      return (
        <g {...common}>
          <line x1={0} y1={0} x2={mid - 8} y2={0} />
          <line x1={mid - 8} y1={-13} x2={mid - 8} y2={13} strokeWidth={2} />
          <line x1={mid - 2} y1={-6} x2={mid - 2} y2={6} strokeWidth={4} />
          <line x1={mid + 4} y1={-13} x2={mid + 4} y2={13} strokeWidth={2} />
          <line x1={mid + 10} y1={-6} x2={mid + 10} y2={6} strokeWidth={4} />
          <line x1={mid + 10} y1={0} x2={L} y2={0} />
        </g>
      );
    }
    case "led": {
      const a = L * 0.4;
      const b = L * 0.6;
      return (
        <g {...common}>
          <line x1={0} y1={0} x2={a} y2={0} />
          <polygon
            points={`${a},-10 ${a},10 ${b},0`}
            fill={stroke}
            stroke={stroke}
          />
          <line x1={b} y1={-10} x2={b} y2={10} />
          <line x1={b} y1={0} x2={L} y2={0} />
          <g strokeWidth={1.5}>
            <line x1={a + 6} y1={-14} x2={a + 12} y2={-20} />
            <line x1={a + 12} y1={-20} x2={a + 8} y2={-20} />
            <line x1={a + 12} y1={-20} x2={a + 12} y2={-16} />
            <line x1={a + 12} y1={-10} x2={a + 18} y2={-16} />
            <line x1={a + 18} y1={-16} x2={a + 14} y2={-16} />
            <line x1={a + 18} y1={-16} x2={a + 18} y2={-12} />
          </g>
        </g>
      );
    }
    case "ground": {
      const mid = L / 2;
      return (
        <g {...common}>
          <line x1={0} y1={0} x2={mid} y2={0} />
          <line x1={mid} y1={0} x2={mid} y2={10} />
          <line x1={mid - 10} y1={10} x2={mid + 10} y2={10} />
          <line x1={mid - 6} y1={14} x2={mid + 6} y2={14} />
          <line x1={mid - 2} y1={18} x2={mid + 2} y2={18} />
          <line x1={mid} y1={0} x2={mid} y2={-1} />
          <line x1={mid} y1={0} x2={L} y2={0} />
        </g>
      );
    }
    default:
      return null;
  }
};

export const Board = ({
  placed,
  energizedIds,
  flowDirection,
  onDropPiece,
  onRemovePiece,
  onTogglePiece,
  onFlipPiece,
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

  const handleDragOver = (event: DragEvent<SVGRectElement>) => {
    event.preventDefault();
  };

  const handleDrop = (a: GridPoint, b: GridPoint) => (
    event: DragEvent<SVGRectElement>,
  ) => {
    event.preventDefault();
    const payload = event.dataTransfer.getData("text/plain");
    if (!payload) return;
    onDropPiece(a, b, payload);
  };

  return (
    <>
      <style>{`
        .circuit-flow {
          stroke-dasharray: 8 8;
          animation: circuit-flow-move 0.7s linear infinite;
        }
        @keyframes circuit-flow-move {
          to { stroke-dashoffset: -16; }
        }
        @media (prefers-reduced-motion: reduce) {
          .circuit-flow { animation: none; }
        }
      `}</style>
      <svg
        width={width}
        height={height}
        style={{ display: "block", margin: "0 auto", overflow: "visible" }}
      >
        {/* Grid dots */}
        {Array.from({ length: (COLS + 1) * (ROWS + 1) }).map((_, index) => {
          const col = index % (COLS + 1);
          const row = Math.floor(index / (COLS + 1));
          const { x, y } = pixelOf({ col, row });
          return <circle key={`dot-${col}-${row}`} cx={x} cy={y} r={1.5} fill="#757263" />;
        })}

        {edges.map(([a, b]) => {
          const id = edgeId(a, b);
          const piece = placedByEdge.get(id);
          const horizontal = a.row === b.row;
          const pa = pixelOf(a);
          const energized = piece ? energizedIds.has(piece.id) : false;
          const unlockedLink =
            piece?.consultantSlug && piece.consultantSlug !== "sara" && energized
              ? piece.consultantSlug
              : null;
          const flow = piece ? flowDirection.get(piece.id) : undefined;
          const enteringAtA = flow ? flow.enter === pointId(a) : true;

          const avatar = piece?.consultantSlug ? (
            <g>
              <clipPath id={`clip-${id}`}>
                <circle cx={horizontal ? L / 2 : 0} cy={0} r={13} />
              </clipPath>
              <circle
                cx={horizontal ? L / 2 : 0}
                cy={0}
                r={14}
                fill="#0D0D0C"
                stroke={KIND_COLOR[piece.kind]}
                strokeWidth={1.5}
              />
              <image
                href={`/photos/${piece.consultantPhoto}`}
                x={(horizontal ? L / 2 : 0) - 13}
                y={-13}
                width={26}
                height={26}
                clipPath={`url(#clip-${id})`}
                preserveAspectRatio="xMidYMid slice"
              />
            </g>
          ) : null;

          return (
            <g
              key={id}
              transform={`translate(${pa.x},${pa.y}) rotate(${horizontal ? 0 : 90})`}
            >
              {piece ? (
                <>
                  <g transform={piece.flipped ? `translate(${L},0) scale(-1,1)` : undefined}>
                    <Symbol kind={piece.kind} closed={piece.closed} />
                  </g>
                  {energized && (
                    <line
                      x1={enteringAtA ? 0 : L}
                      y1={0}
                      x2={enteringAtA ? L : 0}
                      y2={0}
                      stroke="#B7E07A"
                      strokeWidth={3}
                      className="circuit-flow"
                    />
                  )}
                  {unlockedLink ? (
                    <a href={`/vilka-ar-vi/${unlockedLink}`}>{avatar}</a>
                  ) : (
                    avatar
                  )}
                </>
              ) : (
                <line
                  x1={0}
                  y1={0}
                  x2={L}
                  y2={0}
                  stroke="rgba(195, 206, 217, 0.2)"
                  strokeWidth={1}
                  strokeDasharray="3 4"
                />
              )}
            </g>
          );
        })}

        {/* Hit-areas / drop targets on top, in board coordinates (not
            rotated) so drag/click math stays simple. */}
        {edges.map(([a, b]) => {
          const id = edgeId(a, b);
          const piece = placedByEdge.get(id);
          const horizontal = a.row === b.row;
          const pa = pixelOf(a);
          const unlockedLink =
            piece?.consultantSlug && piece.consultantSlug !== "sara" &&
            energizedIds.has(piece?.id ?? "")
              ? piece.consultantSlug
              : null;
          const hitW = horizontal ? L : 28;
          const hitH = horizontal ? 28 : L;
          const hitX = horizontal ? pa.x : pa.x - hitW / 2;
          const hitY = horizontal ? pa.y - hitH / 2 : pa.y;

          if (unlockedLink) {
            // Real link handles its own clicks; still need it to sit above
            // the hit-rect so navigation works instead of being swallowed.
            return null;
          }

          return (
            <rect
              key={`hit-${id}`}
              x={hitX}
              y={hitY}
              width={hitW}
              height={hitH}
              fill="transparent"
              style={{ cursor: piece ? "pointer" : "copy" }}
              onDragOver={piece ? undefined : handleDragOver}
              onDrop={piece ? undefined : handleDrop(a, b)}
              onClick={piece ? () => onRemovePiece(piece.id) : undefined}
            >
              <title>
                {piece
                  ? `${piece.consultantName ?? KIND_LABELS[piece.kind]} (klicka för att ta bort)`
                  : "Släpp en komponent här"}
              </title>
            </rect>
          );
        })}

        {/* Flip controls, on top of everything so they stay clickable/
            focusable over the hit-rects above. */}
        {edges.map(([a, b]) => {
          const id = edgeId(a, b);
          const piece = placedByEdge.get(id);
          if (!piece) return null;
          const horizontal = a.row === b.row;
          const pa = pixelOf(a);

          return (
            <g
              key={`flip-${id}`}
              transform={`translate(${pa.x},${pa.y}) rotate(${horizontal ? 0 : 90})`}
            >
              <g
                role="button"
                tabIndex={0}
                aria-label={`Vänd ${piece.consultantName ?? KIND_LABELS[piece.kind]}`}
                onClick={(event) => {
                  event.stopPropagation();
                  onFlipPiece(piece.id);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onFlipPiece(piece.id);
                  }
                }}
                style={{ cursor: "pointer" }}
                transform={`translate(${L * 0.18},-20)`}
              >
                <circle r={9} fill="#0D0D0C" stroke="#757263" strokeWidth={1} />
                <path
                  d="M -4,-2 A 5 5 0 1 0 4,-2"
                  stroke="#C3CED9"
                  strokeWidth={1.4}
                  fill="none"
                />
                <polygon points="4,-2 4,3 -1,-2" fill="#C3CED9" />
                <title>Vänd komponenten</title>
              </g>

              {piece.kind === "switch" && (
                <g
                  role="button"
                  tabIndex={0}
                  aria-label={`${piece.closed ? "Öppna" : "Stäng"} ${piece.consultantName ?? KIND_LABELS[piece.kind]}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    onTogglePiece(piece.id);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onTogglePiece(piece.id);
                    }
                  }}
                  style={{ cursor: "pointer" }}
                  transform={`translate(${L * 0.82},-20)`}
                >
                  <circle r={9} fill="#0D0D0C" stroke="#757263" strokeWidth={1} />
                  <line
                    x1={-3}
                    y1={3}
                    x2={3}
                    y2={-3}
                    stroke="#C3CED9"
                    strokeWidth={1.4}
                    transform={piece.closed ? "rotate(45)" : undefined}
                  />
                  <title>{piece.closed ? "Öppna brytaren" : "Stäng brytaren"}</title>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </>
  );
};
