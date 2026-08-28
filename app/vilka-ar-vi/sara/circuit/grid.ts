export const COLS = 6;
export const ROWS = 4;
export const CELL = 64;

export const BATTERY_FROM = { col: 0, row: 1 };
export const BATTERY_TO = { col: 0, row: 2 };

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
