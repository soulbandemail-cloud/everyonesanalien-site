/** Original swept Wish/Pong reflection. No owned bodies, timers or alien runtime.
 * Before migration the caller supplied flying alien heads; the public page no
 * longer creates those. Keep this surface reusable without inventing a ball. */
export type WishBody = { x:number; y:number; vx:number; vy:number; lastWishBounce?:number };
export type WishBarrier = { key:number; activeUntil:number; xOffset:number; starOffsets:number[] };
const WISH_BOUNCE_COOLDOWN = 140;
const WISH_STAR_HIT_PADDING = 18;
export const reflectOffWishStars = <T extends WishBody>(
  alien: T,
  next: T,
  now: number,
  barrier: WishBarrier | null,
  view: { width: number; height: number }
) => {

  if (
    !barrier ||
    now > barrier.activeUntil ||
    now - (alien.lastWishBounce ?? 0) < WISH_BOUNCE_COOLDOWN
  ) {
    return next;
  }

  const starY = view.height * (view.width < 640 ? 0.24 : 0.34);
  const minX =
    view.width / 2 +
    barrier.xOffset +
    Math.min(...barrier.starOffsets) -
    WISH_STAR_HIT_PADDING;
  const maxX =
    view.width / 2 +
    barrier.xOffset +
    Math.max(...barrier.starOffsets) +
    WISH_STAR_HIT_PADDING;
  const crossedStars =
    (alien.y <= starY && next.y >= starY) ||
    (alien.y >= starY && next.y <= starY);

  if (!crossedStars || alien.vy === 0) {
    return next;
  }

  const travelY = next.y - alien.y;
  const progress = travelY === 0 ? 0 : (starY - alien.y) / travelY;
  const hitX = alien.x + (next.x - alien.x) * progress;

  if (hitX < minX || hitX > maxX) {
    return next;
  }

  return {
    ...next,
    x: hitX + alien.vx * Math.max(0, 1 - progress),
    y: starY - Math.sign(alien.vy) * 18,
    vy: -alien.vy,
    lastWishBounce: now,
  };
};

