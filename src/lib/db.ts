import Dexie, { Table } from "dexie";

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

  async addPractice(practice: Practice): Promise<number> {
    const { sessionId } = practice;
    if (!sessionId) return this.practices.add(practice);

    return this.transaction("rw", this.practices, this.completedSessions, async () => {
      const completed = await this.completedSessions.get(sessionId);
      if (completed) return completed.practiceId;

      const practiceId = await this.practices.add(practice);
      await this.completedSessions.add({ sessionId, practiceId });
      return practiceId;
    });
  }

  async getCompletedSession(sessionId: string): Promise<CompletedSession | undefined> {
    return this.completedSessions.get(sessionId);
  }

  async getPractices(): Promise<Practice[]> {
    return this.practices.orderBy("createdAt").reverse().toArray();
  }

  async getPractice(id: number): Promise<Practice | undefined> {
    return this.practices.get(id);
  }

  async removePractice(id: number): Promise<number> {
    await this.practices.delete(id);
    return id;
  }
}

export const db = new ArcherScoreDB();
