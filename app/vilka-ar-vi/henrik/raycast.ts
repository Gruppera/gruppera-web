export type WallHit = {
  distance: number;
  side: 0 | 1;
};

export type IsWall = (x: number, y: number) => boolean;

/**
 * Grid-DDA raycasting (Lodev's classic algorithm). Returns the perpendicular
 * distance to the nearest wall along (rayDirX, rayDirY) from (posX, posY),
 * plus which axis was crossed (side 0 = vertical wall face, 1 = horizontal)
 * so the caller can shade the two differently.
 */
export function castRay(
  isWall: IsWall,
  posX: number,
  posY: number,
  rayDirX: number,
  rayDirY: number,
  maxDistance = 20,
): WallHit {
  let mapX = Math.floor(posX);
  let mapY = Math.floor(posY);

  const deltaDistX = rayDirX === 0 ? 1e30 : Math.abs(1 / rayDirX);
  const deltaDistY = rayDirY === 0 ? 1e30 : Math.abs(1 / rayDirY);

  let stepX: number;
  let sideDistX: number;
  if (rayDirX < 0) {
    stepX = -1;
    sideDistX = (posX - mapX) * deltaDistX;
  } else {
    stepX = 1;
    sideDistX = (mapX + 1 - posX) * deltaDistX;
  }

  let stepY: number;
  let sideDistY: number;
  if (rayDirY < 0) {
    stepY = -1;
    sideDistY = (posY - mapY) * deltaDistY;
  } else {
    stepY = 1;
    sideDistY = (mapY + 1 - posY) * deltaDistY;
  }

  let side: 0 | 1 = 0;
  let hit = false;
  const maxSteps = Math.ceil(maxDistance * 4);

  for (let step = 0; step < maxSteps && !hit; step++) {
    if (sideDistX < sideDistY) {
      sideDistX += deltaDistX;
      mapX += stepX;
      side = 0;
    } else {
      sideDistY += deltaDistY;
      mapY += stepY;
      side = 1;
    }
    if (isWall(mapX, mapY)) hit = true;
  }

  if (!hit) return { distance: maxDistance, side };

  const perpDistance =
    side === 0
      ? (mapX - posX + (1 - stepX) / 2) / rayDirX
      : (mapY - posY + (1 - stepY) / 2) / rayDirY;

  return { distance: Math.max(perpDistance, 0.0001), side };
}

export type SpriteProjection = {
  screenX: number;
  perpDistance: number;
};

/**
 * Projects a world-space point into screen space using the same tangent-based
 * perspective as the wall renderer, so a sprite's `perpDistance` compares
 * directly against the wall z-buffer for occlusion. Returns null when the
 * point falls outside the (slightly padded) field of view.
 */
export function projectToScreen(
  playerX: number,
  playerY: number,
  playerAngle: number,
  fov: number,
  screenWidth: number,
  targetX: number,
  targetY: number,
): SpriteProjection | null {
  const dx = targetX - playerX;
  const dy = targetY - playerY;
  const distance = Math.hypot(dx, dy);

  let relativeAngle = Math.atan2(dy, dx) - playerAngle;
  while (relativeAngle > Math.PI) relativeAngle -= Math.PI * 2;
  while (relativeAngle < -Math.PI) relativeAngle += Math.PI * 2;

  const halfFov = fov / 2;
  if (Math.abs(relativeAngle) > halfFov + 0.3) return null;

  const perpDistance = distance * Math.cos(relativeAngle);
  if (perpDistance <= 0.01) return null;

  const screenX =
    (screenWidth / 2) * (1 + Math.tan(relativeAngle) / Math.tan(halfFov));

  return { screenX, perpDistance };
}
