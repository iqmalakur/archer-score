import type { SetupType } from "./setup";

export interface EndSessionType {
  setup?: SetupType;
  sessionId?: string;
  title?: string;
  distance?: number;
  currentEnd: number;
  userScores: number[][];
  isStarted: boolean;
}
