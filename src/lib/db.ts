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
}

export class ArcherScoreDB extends Dexie {
  practices!: Table<Practice, number>;

  constructor() {
    super("ArcherScoreDB");
    this.version(1).stores({
      practices: "++id, createdAt, distance, title",
    });
  }

  async addPractice(practice: Practice): Promise<number> {
    return this.practices.add(practice);
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
