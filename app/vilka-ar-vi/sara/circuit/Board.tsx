"use client";

import type { DragEvent, KeyboardEvent, SVGProps } from "react";

import { KIND_LABELS, type ComponentKind } from "./componentKinds";
import { allEdges, CELL, COLS, edgeId, pixelOf, pointId, ROWS, type GridPoint } from "./grid";
import type { FlowDirection, PlacedPiece } from "./graph";

type BoardProps = {
  placed: PlacedPiece[];
  energizedIds: Set<string>;
  flowDirection: FlowDirection;
  armed: boolean;
  onDropPiece: (from: GridPoint, to: GridPoint, dataTransferPayload: string) => void;
  onPlaceArmedPiece: (from: GridPoint, to: GridPoint) => void;
  onRemovePiece: (id: string) => void;
  onTogglePiece: (id: string) => void;
  onFlipPiece: (id: string) => void;
};

const activateOnKey = (onActivate: () => void) => (event: KeyboardEvent) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    onActivate();
  }
};

const KIND_COLOR: Record<ComponentKind, string> = {
  battery: "#E0CCBE",
  ic: "#95B354",
  wire: "#C3CED9",
  capacitor: "#824529",
  switch: "#757263",
  led: "#95B354",
  ground: "#C3CED9",
  microcontroller: "#95B354",
  display: "#C3CED9",
  testPoint: "#824529",
  relay: "#757263",
  diode: "#824529",
  memory: "#824529",
  fuse: "#757263",
};

const L = CELL;

/** Small shared box-with-glyph symbol for the not-yet-staffed kinds. */
const GenericBox = ({ stroke, glyph }: { stroke: string; glyph: string }) => {
  const w = L * 0.34;
  return (
    <g stroke={stroke} strokeWidth={2} fill="none">
      <line x1={0} y1={0} x2={L / 2 - w / 2} y2={0} />
      <rect x={L / 2 - w / 2} y={-11} width={w} height={22} />
      <line x1={L / 2 + w / 2} y1={0} x2={L} y2={0} />
      <text
        x={L / 2}
        y={4}
        textAnchor="middle"
        fontSize={10}
        stroke="none"
        fill={stroke}
      >
        {glyph}
      </text>
    </g>
  );
};

/**
 * Standard-ish schematic symbols, drawn in local coordinates for a
 * horizontal edge running from (0,0) to (L,0) — the caller rotates/
 * translates the whole <g> into place for vertical edges. IEC-ish
 * conventions where they exist (parallel-plate capacitor, knife switch,
 * multi-line battery, diode-triangle LED with perception arrows, ground
 * hatch); chip/IC outlines for the roles that don't have a classic
 * passive-component analog.
 */
const Symbol = ({ kind, closed }: { kind: ComponentKind; closed?: boolean }) => {
  const stroke = KIND_COLOR[kind];
  const common = { stroke, strokeWidth: 2, fill: "none" } as const;

  switch (kind) {
    case "wire":
      return <line x1={0} y1={0} x2={L} y2={0} {...common} />;
    case "ic": {
      const w = L * 0.36;
      const pin = 6;
      return (
        <g {...common}>
          <line x1={0} y1={0} x2={L / 2 - w / 2} y2={0} />
          <rect x={L / 2 - w / 2} y={-12} width={w} height={24} />
          <line x1={L / 2 - w / 2 + pin} y1={-12} x2={L / 2 - w / 2 + pin} y2={-18} />
          <line x1={L / 2 + w / 2 - pin} y1={-12} x2={L / 2 + w / 2 - pin} y2={-18} />
          <line x1={L / 2 - w / 2 + pin} y1={12} x2={L / 2 - w / 2 + pin} y2={18} />
          <line x1={L / 2 + w / 2 - pin} y1={12} x2={L / 2 + w / 2 - pin} y2={18} />
          <line x1={L / 2 + w / 2} y1={0} x2={L} y2={0} />
        </g>
      );
    }
    case "microcontroller": {
      const w = L * 0.4;
      return (
        <g {...common}>
          <line x1={0} y1={0} x2={L / 2 - w / 2} y2={0} />
          <rect x={L / 2 - w / 2} y={-13} width={w} height={26} />
          {[-14, -4, 6].map((dx) => (
            <g key={dx}>
              <line x1={L / 2 + dx} y1={-13} x2={L / 2 + dx} y2={-18} />
              <line x1={L / 2 + dx} y1={13} x2={L / 2 + dx} y2={18} />
            </g>
          ))}
          <line x1={L / 2 + w / 2} y1={0} x2={L} y2={0} />
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
    case "display":
      return <GenericBox stroke={stroke} glyph="OUT" />;
    case "testPoint":
      return <GenericBox stroke={stroke} glyph="QA" />;
    case "relay":
      return <GenericBox stroke={stroke} glyph="PO" />;
    case "diode":
      return <GenericBox stroke={stroke} glyph="TL" />;
    case "memory":
      return <GenericBox stroke={stroke} glyph="MEM" />;
    case "fuse":
      return <GenericBox stroke={stroke} glyph="SEC" />;
    default:
      return null;
  }
};

export const Board = ({
  placed,
  energizedIds,
  flowDirection,
  armed,
  onDropPiece,
  onPlaceArmedPiece,
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
        .circuit-control:focus-visible,
        .circuit-slot:focus-visible {
          outline: 2px solid #B7E07A;
          outline-offset: 2px;
        }
      `}</style>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        role="group"
        aria-label="Kretsschema — komponenter kan tas bort, vändas eller (för brytare) öppnas/stängas med tangentbordet"
        style={{ display: "block", height: "auto", overflow: "visible" }}
      >
        {/* Grid dots: purely decorative. */}
        <g aria-hidden="true">
          {Array.from({ length: (COLS + 1) * (ROWS + 1) }).map((_, index) => {
            const col = index % (COLS + 1);
            const row = Math.floor(index / (COLS + 1));
            const { x, y } = pixelOf({ col, row });
            return <circle key={`dot-${col}-${row}`} cx={x} cy={y} r={1.5} fill="#757263" />;
          })}
        </g>

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
                  {/* Decorative — the accessible name/controls for this piece
                      live on the hit-rect and flip/toggle buttons below. */}
                  <g aria-hidden="true">
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
                    {!unlockedLink && avatar}
                  </g>
                  {unlockedLink && (
                    <a
                      href={`/vilka-ar-vi/${unlockedLink}`}
                      aria-label={`${piece.consultantName} — gå till profilsidan`}
                    >
                      {avatar}
                    </a>
                  )}
                </>
              ) : (
                <line
                  aria-hidden="true"
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
          const hitW = horizontal ? L : 34;
          const hitH = horizontal ? 34 : L;
          const hitX = horizontal ? pa.x : pa.x - hitW / 2;
          const hitY = horizontal ? pa.y - hitH / 2 : pa.y;

          if (unlockedLink) {
            // Real link handles its own clicks; still need it to sit above
            // the hit-rect so navigation works instead of being swallowed.
            return null;
          }

          const activate = piece
            ? () => onRemovePiece(piece.id)
            : () => onPlaceArmedPiece(a, b);
          const label = piece
            ? `${piece.consultantName ?? KIND_LABELS[piece.kind]}, tryck för att ta bort, eller dra för att flytta`
            : armed
              ? "Tom plats, tryck för att placera den valda komponenten"
              : "Tom plats, dra en komponent hit eller välj en i biblioteket ovan och tryck här";

          const handleMoveDragStart = (event: DragEvent<SVGRectElement>) => {
            if (!piece) return;
            event.dataTransfer.setData(
              "text/plain",
              JSON.stringify({
                kind: piece.kind,
                consultantSlug: piece.consultantSlug,
                consultantName: piece.consultantName,
                consultantPhoto: piece.consultantPhoto,
                moveFromId: piece.id,
              }),
            );
            event.dataTransfer.effectAllowed = "move";
          };

          return (
            <rect
              key={`hit-${id}`}
              className="circuit-slot"
              x={hitX}
              y={hitY}
              width={hitW}
              height={hitH}
              fill="transparent"
              role="button"
              tabIndex={0}
              aria-label={label}
              style={{ cursor: piece ? "grab" : armed ? "cell" : "copy" }}
              {...({ draggable: Boolean(piece) } as SVGProps<SVGRectElement>)}
              onDragStart={piece ? handleMoveDragStart : undefined}
              onDragOver={piece ? undefined : handleDragOver}
              onDrop={piece ? undefined : handleDrop(a, b)}
              onClick={activate}
              onKeyDown={activateOnKey(activate)}
            >
              <title>{label}</title>
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
                className="circuit-control"
                role="button"
                tabIndex={0}
                aria-label={`Vänd ${piece.consultantName ?? KIND_LABELS[piece.kind]}`}
                onClick={(event) => {
                  event.stopPropagation();
                  onFlipPiece(piece.id);
                }}
                onKeyDown={activateOnKey(() => onFlipPiece(piece.id))}
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
                  className="circuit-control"
                  role="button"
                  tabIndex={0}
                  aria-label={`${piece.closed ? "Öppna" : "Stäng"} ${piece.consultantName ?? KIND_LABELS[piece.kind]}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    onTogglePiece(piece.id);
                  }}
                  onKeyDown={activateOnKey(() => onTogglePiece(piece.id))}
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
