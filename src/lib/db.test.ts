import Dexie from "dexie";
import { ArcherScoreDB, type Practice } from "./db";

function check(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

// Run against browser IndexedDB; every run uses a separate synthetic database.
export async function checkPracticeDatabase(): Promise<string[]> {
  const name = `ArcherScore-check-${crypto.randomUUID()}`;
  const legacy = new Dexie(name);
  const practice: Practice = {
    createdAt: new Date(), endCount: 1, arrowCount: 1,
    targetScores: [1, 3, 6], userScores: [[6]],
  };
  legacy.version(1).stores({ practices: "++id, createdAt, distance, title" });
  const legacyId = await legacy.table("practices").add({ ...practice });
  legacy.close();

  let database = new ArcherScoreDB(name);
  const results: string[] = [];
  try {
    await database.open();
    check(typeof legacyId === "number", "Legacy history must keep numeric keys");
    check((await database.getPractice(legacyId))?.userScores[0][0] === 6,
      "Version-1 history must survive upgrade");
    results.push("Schema upgrade preserves version-1 history");

    const sessionId = crypto.randomUUID();
    const record = { ...practice, sessionId };
    const [first, concurrent] = await Promise.all([
      database.addPractice(record), database.addPractice(record),
    ]);

    check(first === concurrent, "Concurrent completion must return one ID");
    check(await database.practices.filter((row) => row.sessionId === sessionId).count() === 1,
      "Concurrent completion must create one row");
    results.push("Concurrent completion creates exactly one history row");

    database.close();
    database = new ArcherScoreDB(name);
    check(await database.addPractice(record) === first, "Reloaded completion must reuse its receipt");
    check((await database.getCompletedSession(sessionId))?.practiceId === first,
      "Receipt must survive reopening the database");
    results.push("Completion receipt survives database reopen");

    await database.removePractice(first);
    check(await database.addPractice(record) === first, "Deleted practice must not be resurrected");
    check(await database.getPractice(first) === undefined, "Deleted history must stay deleted");
    check(await database.getCompletedSession(sessionId), "History deletion must retain completion receipt");
    results.push("Stale drafts cannot resurrect deleted history");

    const failedId = crypto.randomUUID();
    const rejectReceipt = () => { throw new Error("Synthetic receipt failure"); };
    database.completedSessions.hook("creating", rejectReceipt);
    let rejected = false;
    try {
      await database.addPractice({ ...practice, sessionId: failedId });
    } catch {
      rejected = true;
    } finally {
      database.completedSessions.hook("creating").unsubscribe(rejectReceipt);
    }

    check(rejected, "Receipt failure must reject completion");
    check(await database.getCompletedSession(failedId) === undefined, "Failed save must leave no receipt");
    check(await database.practices.filter((row) => row.sessionId === failedId).count() === 0,
      "Receipt failure must roll back the practice too");
    await database.addPractice({ ...practice, sessionId: failedId });
    check(await database.getCompletedSession(failedId), "Retry must succeed after rollback");
    results.push("Receipt failure rolls back both writes; retry succeeds");
    return results;
  } finally {
    database.close();
    await Dexie.delete(name);
  }
}
