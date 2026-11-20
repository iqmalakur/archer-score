import assert from "node:assert/strict";
import {
  emptyEnds, isValidTargetSession, restoreTargetSession, scoreProjection,
} from "./target-session";
import { classifyPoint } from "./target-geometry";
import { createTarget } from "./target-settings";
import { getSessionId } from "./practice-session";
import type { TargetSession } from "../types/target-session";

async function check() {
  const targetSnapshot = createTarget();
  const session: TargetSession = {
    schemaVersion: 2, sessionId: crypto.randomUUID(), title: "Test", distance: 18,
    endCount: 2, arrowCount: 2, currentEnd: 1, isStarted: true,
    targetSnapshot, ends: emptyEnds({ endCount: 2, arrowCount: 2 }),
  };
  const miss = classifyPoint(targetSnapshot, { x: 1.2, y: 1.1 })!;
  session.ends[0][0] = { ...miss, id: session.ends[0][0].id };

  assert.equal(isValidTargetSession(session), true);
  assert.deepEqual(scoreProjection(session).userScores, [[0, 0], [0, 0]]);
  assert.equal(isValidTargetSession({
    ...session, ends: [[{ id: "1:1", status: "miss" }], []],
  }), false);
  assert.equal(isValidTargetSession({ ...session, schemaVersion: 3 }), false);
  assert.equal(isValidTargetSession({
    ...session, ends: [[session.ends[0][0], session.ends[0][0]], session.ends[1]],
  }), false);

  const setup = { endCount: 1, arrowCount: 2, targetScores: [3, 6] };
  const legacy = { currentEnd: 1, userScores: [[6, 0]], isStarted: true };
  const originalId = await getSessionId(legacy, setup);
  const restored = await restoreTargetSession(legacy, setup);

  assert.equal(restored.session.sessionId, originalId);
  assert.equal(restored.converted, true);
  assert.deepEqual(restored.session.ends, [[
    { id: "1:1", status: "legacy", score: 6 }, { id: "1:2", status: "empty" },
  ]]);
  await assert.rejects(restoreTargetSession({ ...session, ends: [] }));
  await assert.rejects(restoreTargetSession({ ...session, schemaVersion: 3 }));
  console.log("target session: all checks passed");
}

void check();
