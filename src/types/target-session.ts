import type { TargetConfig, TargetPoint } from "./target";

export type ArrowEntry =
  | { id: string; status: "empty" }
  | ({ id: string; status: "hit"; ringId: string; score: number } & TargetPoint)
  | ({ id: string; status: "miss" } & TargetPoint)
  | { id: string; status: "legacy"; score: number };

export interface SessionSetup {
  endCount: number;
  arrowCount: number;
}

export interface SetupDraft extends SessionSetup {
  schemaVersion: 2;
  title: string;
  distance: number;
}

export interface TargetSession extends SetupDraft {
  sessionId: string;
  currentEnd: number;
  isStarted: true;
  targetSnapshot: TargetConfig;
  ends: ArrowEntry[][];
}
