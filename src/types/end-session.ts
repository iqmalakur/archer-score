export interface EndSessionType {
  sessionId?: string;
  title?: string;
  distance?: number;
  currentEnd: number;
  userScores: number[][];
  isStarted: boolean;
}
