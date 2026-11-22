import Dexie, { Table } from "dexie";
import type { TargetConfig } from "../types/target";
import type { ArrowEntry } from "../types/target-session";
import { completeEnd, isValidTargetSession, scoreProjection } from "./target-session";

export interface Practice {
  id?: number;
  createdAt: Date;
  endCount: number;
  arrowCount: number;
  targetScores: number[];
  userScores: number[][];
  title?: string;
  distance?: number;
  totalScore?: number;
  sessionId?: string;
  schemaVersion?: 2;
  targetSnapshot?: TargetConfig;
  ends?: ArrowEntry[][];
}

function validatePractice(practice: Practice) {
  if (practice.schemaVersion === undefined
    && practice.targetSnapshot === undefined && practice.ends === undefined) return practice;

  const session = {
    ...practice, currentEnd: 1, isStarted: true,
  };
  if (!isValidTargetSession(session) || !session.ends.every(completeEnd)
    || !(practice.createdAt instanceof Date) || !Number.isFinite(practice.createdAt.getTime())) {
    throw new Error("Invalid saved target session");
  }
  const projection = scoreProjection(session);
  if (JSON.stringify(projection.userScores) !== JSON.stringify(practice.userScores)
    || JSON.stringify(projection.targetScores) !== JSON.stringify(practice.targetScores)) {
    throw new Error("Inconsistent saved target scores");
  }
  return practice;
}

export interface CompletedSession {
  sessionId: string;
  practiceId: number;
}

export class ArcherScoreDB extends Dexie {
  practices!: Table<Practice, number>;
  completedSessions!: Table<CompletedSession, string>;

  constructor(name = "ArcherScoreDB") {
    super(name);
    this.version(1).stores({
      practices: "++id, createdAt, distance, title",
    });
    this.version(2).stores({ completedSessions: "sessionId" });
  }

  async addPractice(practice: Practice): Promise<Practice> {
    validatePractice(practice);
    const { sessionId } = practice;
    if (!sessionId) {
      const id = await this.practices.add(practice);
      return { ...practice, id };
    }

    return this.transaction("rw", this.practices, this.completedSessions, async () => {
      const completed = await this.completedSessions.get(sessionId);
      if (completed) return (await this.practices.get(completed.practiceId)) ?? practice;

      const practiceId = await this.practices.add(practice);
      await this.completedSessions.add({ sessionId, practiceId });
      return { ...practice, id: practiceId };
    });
  }

  async getCompletedSession(sessionId: string): Promise<CompletedSession | undefined> {
    return this.completedSessions.get(sessionId);
  }

  async getPractices(): Promise<Practice[]> {
    const practices = await this.practices.orderBy("createdAt").reverse().toArray();
    return practices.map(validatePractice);
  }

  async getPractice(id: number): Promise<Practice | undefined> {
    const practice = await this.practices.get(id);
    return practice ? validatePractice(practice) : undefined;
  }

  async removePractice(id: number): Promise<number> {
    await this.practices.delete(id);
    return id;
  }
}

export const db = new ArcherScoreDB();
