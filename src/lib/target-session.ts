import type { ArrowEntry, SessionSetup, SetupDraft, TargetSession } from "../types/target-session";
import type { TargetConfig } from "../types/target";
import { classifyPoint } from "./target-geometry";
import { createTarget, isRecord, isValidTarget } from "./target-settings";
import { getSessionSetup, isValidDistance, isValidSession } from "./practice-validation";
import { getSessionId } from "./practice-session";

export function validCounts(value: unknown): value is SessionSetup {
  return isRecord(value) && Number.isInteger(value.endCount)
    && Number(value.endCount) >= 1 && Number(value.endCount) <= 20
    && Number.isInteger(value.arrowCount)
    && Number(value.arrowCount) >= 1 && Number(value.arrowCount) <= 12;
}

export function isValidSetupDraft(value: unknown): value is SetupDraft {
  return validCounts(value) && isRecord(value) && value.schemaVersion === 2
    && typeof value.title === "string" && isValidDistance(value.distance);
}

export function emptyEnds(setup: SessionSetup): ArrowEntry[][] {
  return Array.from({ length: setup.endCount }, (_, end) =>
    Array.from({ length: setup.arrowCount }, (_, arrow) => ({
      id: `${end + 1}:${arrow + 1}`, status: "empty" as const,
    })),
  );
}

export function entryScore(entry: ArrowEntry) {
  return entry.status === "hit" || entry.status === "legacy" ? entry.score : 0;
}

export function entryLabel(entry: ArrowEntry) {
  if (entry.status === "empty") return "Belum dipasang";
  if (entry.status === "miss") return "Miss";
  return `Skor ${entry.score}${entry.status === "legacy" ? " · tanpa posisi" : ""}`;
}

export function scoreProjection(session: TargetSession) {
  return {
    endCount: session.endCount,
    arrowCount: session.arrowCount,
    targetScores: session.targetSnapshot.rings.map((ring) => ring.score),
    userScores: session.ends.map((end) => end.map(entryScore)),
  };
}

export function validEntry(value: unknown, target: TargetConfig): value is ArrowEntry {
  if (!isRecord(value) || typeof value.id !== "string" || !value.id) return false;
  if (value.status === "empty") return value.score === undefined && value.x === undefined
    && value.y === undefined && value.ringId === undefined;
  if (value.status === "legacy") return value.x === undefined && value.y === undefined
    && value.ringId === undefined && target.rings.some((ring) => ring.score === value.score);
  if (typeof value.x !== "number" || typeof value.y !== "number") return false;

  const placement = classifyPoint(target, { x: value.x, y: value.y });
  if (value.status === "miss") return placement?.status === "miss"
    && value.ringId === undefined && value.score === undefined;
  return value.status === "hit" && placement?.status === "hit"
    && placement.ringId === value.ringId && placement.score === value.score;
}

export function isValidTargetSession(value: unknown): value is TargetSession {
  if (!isValidSetupDraft(value) || !isRecord(value) || value.isStarted !== true
    || typeof value.sessionId !== "string"
    || !/^(?:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|legacy-[0-9a-f]{64})$/i
      .test(value.sessionId)
    || !Number.isInteger(value.currentEnd) || Number(value.currentEnd) < 1
    || Number(value.currentEnd) > value.endCount
    || !isValidTarget(value.targetSnapshot) || !Array.isArray(value.ends)
    || value.ends.length !== value.endCount) return false;

  const target = value.targetSnapshot;
  const ids = new Set<string>();
  return value.ends.every((end) => Array.isArray(end) && end.length === value.arrowCount
    && end.every((entry: unknown) => {
      if (!validEntry(entry, target) || ids.has(entry.id)) return false;
      ids.add(entry.id);
      return true;
    }));
}

export async function restoreTargetSession(value: unknown, preferences?: unknown) {
  if (isRecord(value) && Object.hasOwn(value, "schemaVersion")) {
    if (!isValidTargetSession(value)) throw new Error("Invalid target draft");
    return { session: value, converted: false };
  }

  const setup = getSessionSetup(value, preferences);
  if (!setup || !isValidSession(value, setup)) throw new Error("Invalid legacy draft");

  const sessionId = await getSessionId(value, setup);
  const targetSnapshot = createTarget([...setup.targetScores].sort((a, b) => b - a));
  targetSnapshot.name = "Target konversi sesi lama";
  const session: TargetSession = {
    schemaVersion: 2, sessionId, title: value.title ?? "", distance: value.distance ?? 8,
    endCount: setup.endCount, arrowCount: setup.arrowCount,
    currentEnd: value.currentEnd, isStarted: true, targetSnapshot,
    ends: value.userScores.map((end, e) => end.map((score, a) => score === 0
      ? { id: `${e + 1}:${a + 1}`, status: "empty" }
      : { id: `${e + 1}:${a + 1}`, status: "legacy", score })),
  };
  if (!isValidTargetSession(session)) throw new Error("Invalid converted draft");
  return { session, converted: true };
}

export function completeEnd(entries: ArrowEntry[]) {
  return entries.every((entry) => entry.status !== "empty");
}
