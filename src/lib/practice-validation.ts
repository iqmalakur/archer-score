import type { EndSessionType } from "../types/end-session";
import type { SetupType } from "../types/setup";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isValidDistance(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value)
    && value >= 1 && value <= 150;
}

export function isValidSetup(value: unknown): value is SetupType {
  if (!isRecord(value)) return false;
  const { endCount, arrowCount, targetScores } = value;

  return typeof endCount === "number" && Number.isInteger(endCount)
    && endCount >= 1 && endCount <= 20
    && typeof arrowCount === "number" && Number.isInteger(arrowCount)
    && arrowCount >= 1 && arrowCount <= 12
    && Array.isArray(targetScores) && targetScores.length > 0
    && targetScores.length <= 10
    && new Set(targetScores).size === targetScores.length
    && targetScores.every((score) => Number.isInteger(score) && score >= 1 && score <= 10);
}

export function isValidSession(
  value: unknown,
  setup: SetupType,
): value is EndSessionType {
  if (!isRecord(value)) return false;
  const sessionSetup = getSessionSetup(value, setup);
  if (!sessionSetup) return false;
  const { title, distance, currentEnd, userScores, isStarted, sessionId } = value;

  return isStarted === true
    && (sessionId === undefined || (typeof sessionId === "string"
      && (/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(sessionId)
        || /^legacy-[0-9a-f]{64}$/i.test(sessionId))))
    && (title === undefined || typeof title === "string")
    && (distance === undefined || isValidDistance(distance))
    && typeof currentEnd === "number" && Number.isInteger(currentEnd)
    && currentEnd >= 1 && currentEnd <= sessionSetup.endCount
    && Array.isArray(userScores) && userScores.length === sessionSetup.endCount
    && userScores.every((scores) => Array.isArray(scores)
      && scores.length === sessionSetup.arrowCount
      && scores.every((score) => score === 0 || sessionSetup.targetScores.includes(score)));
}

export function getSessionSetup(value: unknown, legacySetup?: unknown): SetupType | undefined {
  if (!isRecord(value)) return undefined;
  const setup = Object.hasOwn(value, "setup") ? value.setup : legacySetup;
  return isValidSetup(setup) ? setup : undefined;
}
