export type Cell = 0 | 1;

export type ConsultantSpawn = {
  slug: string;
  x: number;
  y: number;
};

export const MAP_WIDTH = 33;
export const MAP_HEIGHT = 13;
const MAIN_ROW = 6;

const BRANCH_SLUGS = [
  "daniel",
  "gunnar",
  "jonathan",
  "mattias",
  "olle",
  "shane",
  "anton",
  "christopher",
  "sara",
  "james",
] as const;

const BRANCH_COLS = [3, 6, 9, 12, 15, 18, 21, 24, 27, 30];

function buildGrid(): Cell[][] {
  const grid: Cell[][] = Array.from({ length: MAP_HEIGHT }, () =>
    Array.from({ length: MAP_WIDTH }, () => 1 as Cell),
  );

  for (let x = 1; x <= MAP_WIDTH - 2; x++) {
    grid[MAIN_ROW][x] = 0;
  }

  BRANCH_COLS.forEach((col, index) => {
    const goesUp = index % 2 === 0;
    if (goesUp) {
      for (let y = 1; y <= MAIN_ROW - 1; y++) grid[y][col] = 0;
      for (let y = 1; y <= 2; y++) {
        grid[y][col - 1] = 0;
        grid[y][col + 1] = 0;
      }
    } else {
      for (let y = MAIN_ROW + 1; y <= MAP_HEIGHT - 2; y++) grid[y][col] = 0;
      for (let y = MAP_HEIGHT - 3; y <= MAP_HEIGHT - 2; y++) {
        grid[y][col - 1] = 0;
        grid[y][col + 1] = 0;
      }
    }
  });

  return grid;
}

export const MAP_GRID: Cell[][] = buildGrid();

export const PLAYER_START = { x: 1.5, y: MAIN_ROW + 0.5, angle: 0 };

export const CONSULTANT_SPAWNS: ConsultantSpawn[] = BRANCH_COLS.map(
  (col, index) => ({
    slug: BRANCH_SLUGS[index],
    x: col + 0.5,
    y: index % 2 === 0 ? 1.5 : MAP_HEIGHT - 2.5,
  }),
);

export function isWallAt(x: number, y: number): boolean {
  const cellX = Math.floor(x);
  const cellY = Math.floor(y);
  if (cellY < 0 || cellY >= MAP_HEIGHT || cellX < 0 || cellX >= MAP_WIDTH) {
    return true;
  }
  return MAP_GRID[cellY][cellX] === 1;
}
