import type { TargetConfig } from "../types/target";
import { isValidSetup } from "./practice-validation";

export const TARGET_SETTINGS_KEY = "targetSettings";
export const MAX_RING_SCORE = Math.floor(Number.MAX_SAFE_INTEGER / 240);
export const TARGET_PRESETS = [
  { name: "Ring 1–6", scores: [6, 5, 4, 3, 2, 1] },
  { name: "Ring 1–10", scores: [10, 9, 8, 7, 6, 5, 4, 3, 2, 1] },
  { name: "Ring 6–10", scores: [10, 9, 8, 7, 6] },
  { name: "Ring 5–10", scores: [10, 9, 8, 7, 6, 5] },
];

const colors = [
  "#f8ce45", "#f8ce45", "#f8ce45", "#ed5350", "#ffffff",
  "#398cbd", "#343c42", "#232a30", "#f4f1e8", "#e9e7df",
];

export function createTarget(scores = TARGET_PRESETS[0].scores): TargetConfig {
  return {
    schemaVersion: 1,
    name: "Target latihan",
    box: { halfWidth: 1.3, halfHeight: 1.15 },
    rings: scores.map((score, index) => ({
      id: `ring-${index + 1}`, score, color: colors[index % colors.length],
    })),
  };
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isValidTarget(value: unknown): value is TargetConfig {
  if (!isRecord(value) || value.schemaVersion !== 1
    || typeof value.name !== "string" || value.name.length > 60
    || !isRecord(value.box) || !Array.isArray(value.rings)
    || value.rings.length < 1 || value.rings.length > 10) return false;

  const { halfWidth, halfHeight } = value.box;
  if (typeof halfWidth !== "number" || !Number.isFinite(halfWidth) || halfWidth < 1
    || typeof halfHeight !== "number" || !Number.isFinite(halfHeight) || halfHeight < 1
    || !Number.isFinite(halfWidth / halfHeight)) return false;

  const ids = new Set<string>();
  return value.rings.every((ring) => {
    if (!isRecord(ring) || typeof ring.id !== "string" || !ring.id
      || ids.has(ring.id) || typeof ring.score !== "number"
      || !Number.isSafeInteger(ring.score) || ring.score < 1 || ring.score > MAX_RING_SCORE
      || typeof ring.color !== "string" || !/^#[0-9a-f]{6}$/i.test(ring.color)) return false;

    ids.add(ring.id);
    return true;
  });
}

export function readTargetSettings(storage: Pick<Storage, "getItem">): TargetConfig {
  const saved = storage.getItem(TARGET_SETTINGS_KEY);
  if (saved !== null) {
    const target: unknown = JSON.parse(saved);
    if (!isValidTarget(target)) throw new Error("Invalid target settings");
    return target;
  }

  const preferences = storage.getItem("setup");
  try {
    const legacy: unknown = preferences === null ? null : JSON.parse(preferences);
    if (isValidSetup(legacy)) {
      return createTarget([...legacy.targetScores].sort((a, b) => b - a));
    }
  } catch { /* Invalid legacy preferences do not replace target settings. */ }

  return createTarget();
}

export function prepareTargetSettings(storage: Pick<Storage, "getItem" | "setItem">, fallback: TargetConfig) {
  let saved: string | null;
  try { saved = storage.getItem(TARGET_SETTINGS_KEY); }
  catch { return { target: fallback, saved: false }; }

  if (saved !== null) {
    const target: unknown = JSON.parse(saved);
    if (!isValidTarget(target)) throw new Error("Invalid target settings");
    return { target, saved: true };
  }

  try {
    storage.setItem(TARGET_SETTINGS_KEY, JSON.stringify(fallback));
    return { target: fallback, saved: true };
  } catch { return { target: fallback, saved: false }; }
}
