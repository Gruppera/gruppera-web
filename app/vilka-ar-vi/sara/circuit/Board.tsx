"use client";

import { useRef, type DragEvent, type KeyboardEvent, type PointerEvent } from "react";

import { KIND_LABELS, type ComponentKind } from "./componentKinds";
import { allEdges, CELL, COLS, edgeId, pixelOf, pointId, ROWS, type GridPoint } from "./grid";
import type { FlowDirection, PlacedPiece } from "./graph";
import { PCB } from "./theme";

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
  battery: PCB.copperBright,
  ic: PCB.silk,
  wire: PCB.copper,
  capacitor: "#5fb8a8",
  switch: "#c7d0cb",
  led: PCB.glow,
  ground: PCB.copper,
  microcontroller: PCB.silk,
  display: PCB.silk,
  testPoint: PCB.warn,
  relay: "#c7d0cb",
  diode: "#5fb8a8",
  memory: "#5fb8a8",
  fuse: PCB.warn,
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

  // Moving an already-placed piece uses manual pointer tracking rather than
  // native HTML5 drag-and-drop: `draggable` on an SVG element is unreliable
  // across real browsers (it doesn't reliably fire dragstart), and pointer
  // events work uniformly for mouse and touch. A press-without-movement
  // still falls through to the normal click-to-remove handler; `draggingRef`
  // distinguishes the two so a completed move doesn't also fire a remove.
  // These handlers are static (not created per-edge inside the render map)
  // and read the target piece from `event.currentTarget.dataset` instead of
  // closing over it, both to avoid one closure per grid cell and because
  // touching a ref from a closure defined during render trips the
  // react-hooks/refs lint rule even when the read itself is deferred.
  type Drag =
    | { mode: "move"; pieceId: string; startX: number; startY: number; moved: boolean }
    | { mode: "extend"; pieceId: string; endCol: number; endRow: number; startX: number; startY: number; moved: boolean };
  const draggingRef = useRef<Drag | null>(null);
  const suppressClickRef = useRef(false);

  const handlePieceGrab = (event: PointerEvent<SVGRectElement>) => {
    const pieceId = event.currentTarget.dataset.pieceId;
    if (!pieceId) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    draggingRef.current = { mode: "move", pieceId, startX: event.clientX, startY: event.clientY, moved: false };
  };

  // Dedicated small handle at each end of a placed piece: dragging one
  // stretches a new plain wire out from that exact grid point instead of
  // moving the whole piece. A fixed data attribute identifies the endpoint
  // directly, rather than inferring "which end" from where within the main
  // hit-rect a press landed.
  const handleExtendGrab = (event: PointerEvent<SVGCircleElement>) => {
    const ds = event.currentTarget.dataset;
    const pieceId = ds.pieceId;
    if (!pieceId) return;
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    draggingRef.current = {
      mode: "extend",
      pieceId,
      endCol: Number(ds.endCol),
      endRow: Number(ds.endRow),
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
    };
  };

  const handlePieceDrag = (event: PointerEvent<SVGRectElement | SVGCircleElement>) => {
    const drag = draggingRef.current;
    if (!drag) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (Math.hypot(dx, dy) > 6) drag.moved = true;
  };

  const handlePieceRelease = (event: PointerEvent<SVGRectElement | SVGCircleElement>) => {
    const drag = draggingRef.current;
    draggingRef.current = null;
    const pieceId = event.currentTarget.dataset.pieceId;
    if (!drag || !pieceId || drag.pieceId !== pieceId || !drag.moved) return;
    // A real drag happened (regardless of whether it lands on a valid
    // target) — the click that follows pointerup shouldn't also remove it.
    suppressClickRef.current = true;

    const piece = placed.find((p) => p.id === pieceId);
    const target = document.elementFromPoint(event.clientX, event.clientY) as HTMLElement | null;
    if (!piece || !target?.classList.contains("circuit-slot") || target.dataset.occupied === "true") return;
    const a = { col: Number(target.dataset.colA), row: Number(target.dataset.rowA) };
    const b = { col: Number(target.dataset.colB), row: Number(target.dataset.rowB) };

    if (drag.mode === "extend") {
      // Only extends into an edge that actually touches the endpoint that
      // was grabbed — otherwise it isn't really "extending" anything.
      const touchesEndpoint =
        (a.col === drag.endCol && a.row === drag.endRow) || (b.col === drag.endCol && b.row === drag.endRow);
      if (!touchesEndpoint) return;
      onDropPiece(a, b, JSON.stringify({ kind: "wire" }));
      return;
    }

    onDropPiece(
      a,
      b,
      JSON.stringify({
        kind: piece.kind,
        consultantSlug: piece.consultantSlug,
        consultantName: piece.consultantName,
        consultantPhoto: piece.consultantPhoto,
        moveFromId: piece.id,
      }),
    );
  };

  const handleSlotClick = (event: { currentTarget: { dataset: DOMStringMap } }) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    const { pieceId, colA, rowA, colB, rowB } = event.currentTarget.dataset;
    if (pieceId) {
      onRemovePiece(pieceId);
    } else {
      onPlaceArmedPiece({ col: Number(colA), row: Number(rowA) }, { col: Number(colB), row: Number(rowB) });
    }
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
          outline: 2px solid ${PCB.glow};
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
        {/* Board substrate. */}
        <rect
          aria-hidden="true"
          x={-8}
          y={-8}
          width={width + 16}
          height={height + 16}
          rx={6}
          fill={PCB.bgBoard}
          stroke={PCB.bgBoardDark}
          strokeWidth={2}
        />

        {/* Grid dots: via-holes, purely decorative. */}
        <g aria-hidden="true">
          {Array.from({ length: (COLS + 1) * (ROWS + 1) }).map((_, index) => {
            const col = index % (COLS + 1);
            const row = Math.floor(index / (COLS + 1));
            const { x, y } = pixelOf({ col, row });
            return (
              <circle
                key={`dot-${col}-${row}`}
                cx={x}
                cy={y}
                r={2}
                fill={PCB.bgBoardDark}
                stroke="rgba(238, 247, 240, 0.35)"
                strokeWidth={0.75}
              />
            );
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
                <circle cx={L / 2} cy={0} r={13} />
              </clipPath>
              <circle
                cx={L / 2}
                cy={0}
                r={14}
                fill={PCB.bgBoardDark}
                stroke={KIND_COLOR[piece.kind]}
                strokeWidth={1.5}
              />
              <image
                href={`/photos/${piece.consultantPhoto}`}
                x={L / 2 - 13}
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
                        stroke={PCB.glow}
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
                  stroke="rgba(238, 247, 240, 0.18)"
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

          const label = piece
            ? `${piece.consultantName ?? KIND_LABELS[piece.kind]}, tryck för att ta bort eller dra för att flytta — dra i ett handtag i änden för att förlänga med en wire`
            : armed
              ? "Tom plats, tryck för att placera den valda komponenten"
              : "Tom plats, dra en komponent hit eller välj en i biblioteket ovan och tryck här";

          return (
            <rect
              key={`hit-${id}`}
              className="circuit-slot"
              data-piece-id={piece?.id}
              data-occupied={piece ? "true" : "false"}
              data-col-a={a.col}
              data-row-a={a.row}
              data-col-b={b.col}
              data-row-b={b.row}
              x={hitX}
              y={hitY}
              width={hitW}
              height={hitH}
              fill="transparent"
              role="button"
              tabIndex={0}
              aria-label={label}
              style={{ cursor: piece ? "grab" : armed ? "cell" : "copy" }}
              onPointerDown={piece ? handlePieceGrab : undefined}
              onPointerMove={piece ? handlePieceDrag : undefined}
              onPointerUp={piece ? handlePieceRelease : undefined}
              onDragOver={piece ? undefined : handleDragOver}
              onDrop={piece ? undefined : handleDrop(a, b)}
              onClick={handleSlotClick}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  handleSlotClick(event);
                }
              }}
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
              {/* End handles — drag one to stretch a new plain wire out from
                  that exact grid point, separate from dragging the piece
                  itself (which moves the whole thing). */}
              <circle
                className="circuit-control"
                cx={0}
                cy={0}
                r={5}
                fill={PCB.copper}
                stroke={PCB.bgBoardDark}
                strokeWidth={1}
                style={{ cursor: "crosshair" }}
                data-piece-id={piece.id}
                data-end-col={a.col}
                data-end-row={a.row}
                onPointerDown={handleExtendGrab}
                onPointerMove={handlePieceDrag}
                onPointerUp={handlePieceRelease}
                onClick={(event) => event.stopPropagation()}
              >
                <title>Dra härifrån för att förlänga med en wire</title>
              </circle>
              <circle
                className="circuit-control"
                cx={L}
                cy={0}
                r={5}
                fill={PCB.copper}
                stroke={PCB.bgBoardDark}
                strokeWidth={1}
                style={{ cursor: "crosshair" }}
                data-piece-id={piece.id}
                data-end-col={b.col}
                data-end-row={b.row}
                onPointerDown={handleExtendGrab}
                onPointerMove={handlePieceDrag}
                onPointerUp={handlePieceRelease}
                onClick={(event) => event.stopPropagation()}
              >
                <title>Dra härifrån för att förlänga med en wire</title>
              </circle>

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
                <circle r={9} fill={PCB.bgBoardDark} stroke={PCB.chipBorder} strokeWidth={1} />
                <path
                  d="M -4,-2 A 5 5 0 1 0 4,-2"
                  stroke={PCB.silk}
                  strokeWidth={1.4}
                  fill="none"
                />
                <polygon points="4,-2 4,3 -1,-2" fill={PCB.silk} />
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
                  <circle r={9} fill={PCB.bgBoardDark} stroke={PCB.chipBorder} strokeWidth={1} />
                  <line
                    x1={-3}
                    y1={3}
                    x2={3}
                    y2={-3}
                    stroke={PCB.silk}
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
