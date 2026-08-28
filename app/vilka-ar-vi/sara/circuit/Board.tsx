"use client";

import { useRef, type DragEvent, type KeyboardEvent, type PointerEvent } from "react";

import { KIND_LABELS } from "./componentKinds";
import { allEdges, CELL, COLS, edgeId, pixelOf, pointId, ROWS, type GridPoint } from "./grid";
import type { FlowDirection, PlacedPiece } from "./graph";
import { PCB } from "./theme";
import { KIND_COLOR, Symbol } from "./symbols";

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
  armedCorner: GridPoint | null;
  onCornerClick: (point: GridPoint) => void;
};

const activateOnKey = (onActivate: () => void) => (event: KeyboardEvent) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    onActivate();
  }
};

const L = CELL;

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
  armedCorner,
  onCornerClick,
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
  type Drag = { pieceId: string; startX: number; startY: number; moved: boolean };
  const draggingRef = useRef<Drag | null>(null);
  const suppressClickRef = useRef(false);

  const handlePieceGrab = (event: PointerEvent<SVGRectElement>) => {
    const pieceId = event.currentTarget.dataset.pieceId;
    if (!pieceId) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    draggingRef.current = { pieceId, startX: event.clientX, startY: event.clientY, moved: false };
  };

  const handlePieceDrag = (event: PointerEvent<SVGRectElement>) => {
    const drag = draggingRef.current;
    if (!drag) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (Math.hypot(dx, dy) > 6) drag.moved = true;
  };

  const handlePieceRelease = (event: PointerEvent<SVGRectElement>) => {
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
            ? `${piece.consultantName ?? KIND_LABELS[piece.kind]}, tryck för att ta bort eller dra för att flytta`
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

        {/* Grid-point corners: via-holes that double as click targets, on
            top of the hit-rects so a precise click near a corner reaches
            the corner rather than whichever edge rect sits underneath it.
            Press a corner that touches a placed piece to arm it, then press
            another corner reachable in an unobstructed straight line to
            fill that stretch with wire. */}
        {Array.from({ length: (COLS + 1) * (ROWS + 1) }).map((_, index) => {
          const col = index % (COLS + 1);
          const row = Math.floor(index / (COLS + 1));
          const point = { col, row };
          const { x, y } = pixelOf(point);
          const isArmed = armedCorner?.col === col && armedCorner?.row === row;
          return (
            <circle
              key={`corner-${col}-${row}`}
              className="circuit-control"
              cx={x}
              cy={y}
              r={isArmed ? 6 : 3}
              fill={isArmed ? PCB.copperBright : PCB.bgBoardDark}
              stroke={isArmed ? PCB.copperBright : "rgba(238, 247, 240, 0.35)"}
              strokeWidth={isArmed ? 2 : 0.75}
              role="button"
              tabIndex={0}
              aria-label={
                isArmed
                  ? "Valt hörn — tryck på ett annat hörn i rak linje utan hinder för att förlänga med wire, eller tryck igen för att avbryta"
                  : "Hörn — tryck på ett hörn med en komponent för att börja förlänga med wire"
              }
              style={{ cursor: "pointer" }}
              onClick={() => onCornerClick(point)}
              onKeyDown={activateOnKey(() => onCornerClick(point))}
            />
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
