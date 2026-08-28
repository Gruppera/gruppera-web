// A bit roomier than a single loop needs — multiple batteries means
// multiple independent loops are a reasonable thing to want to build.
// ROWS is taller relative to COLS than a "natural" board so the schematic
// reaches further down toward the height of the palette sidebar beside it
// (Board.tsx also stretches to fill that height exactly; more rows just
// means less distortion is needed to get there).
export const COLS = 8;
export const ROWS = 10;
export const CELL = 60; // 75% of the previous 80px spacing between points

export type GridPoint = { col: number; row: number };

export const pointId = (p: GridPoint) => `${p.col},${p.row}`;

export const pixelOf = (p: GridPoint) => ({ x: p.col * CELL, y: p.row * CELL });

/** Every horizontal + vertical edge slot on the board, as endpoint pairs. */
export const allEdges = (): [GridPoint, GridPoint][] => {
  const edges: [GridPoint, GridPoint][] = [];
  for (let row = 0; row <= ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      edges.push([{ col, row }, { col: col + 1, row }]);
    }
  }
  for (let col = 0; col <= COLS; col += 1) {
    for (let row = 0; row < ROWS; row += 1) {
      edges.push([{ col, row }, { col, row: row + 1 }]);
    }
  }
  return edges;
};

export const edgeId = (a: GridPoint, b: GridPoint) => {
  const [x, y] = [pointId(a), pointId(b)].sort();
  return `${x}|${y}`;
};
