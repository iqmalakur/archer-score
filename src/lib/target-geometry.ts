import type { TargetConfig, TargetPoint } from "../types/target";

const epsilon = 1e-9;

export function insideBox(target: TargetConfig, point: TargetPoint) {
  return Number.isFinite(point.x) && Number.isFinite(point.y)
    && Math.abs(point.x) <= target.box.halfWidth + epsilon
    && Math.abs(point.y) <= target.box.halfHeight + epsilon;
}

export function classifyPoint(target: TargetConfig, point: TargetPoint) {
  if (!insideBox(target, point)) return null;

  const radius = Math.hypot(point.x, point.y);
  const ring = target.rings.find((_, index) =>
    radius <= (index + 1) / target.rings.length + epsilon,
  );
  return ring
    ? { status: "hit" as const, ringId: ring.id, score: ring.score, ...point }
    : { status: "miss" as const, ...point };
}

export function pointFromClient(
  target: TargetConfig,
  rect: Pick<DOMRect, "left" | "top" | "width" | "height">,
  clientX: number,
  clientY: number,
): TargetPoint {
  return {
    x: ((clientX - rect.left) / rect.width * 2 - 1) * target.box.halfWidth,
    y: ((clientY - rect.top) / rect.height * 2 - 1) * target.box.halfHeight,
  };
}

export function pointPercent(target: TargetConfig, point: TargetPoint) {
  return {
    left: `${(point.x / target.box.halfWidth + 1) * 50}%`,
    top: `${(point.y / target.box.halfHeight + 1) * 50}%`,
  };
}
