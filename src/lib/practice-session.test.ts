import assert from "node:assert/strict";
import { getSessionId } from "./practice-session";
import { isValidSession } from "./practice-validation";

async function checkSessionIdentity() {
  const setup = { endCount: 1, arrowCount: 2, targetScores: [1, 3, 6] };
  const session = { currentEnd: 1, userScores: [[6, 0]], isStarted: true };

  const firstId = await getSessionId(session, setup);
  const restoredId = await getSessionId(JSON.parse(JSON.stringify(session)), setup);

  assert.match(firstId, /^legacy-[0-9a-f]{64}$/);
  assert.equal(firstId, restoredId);
  assert.equal(isValidSession({ ...session, sessionId: firstId }, setup), true);
  assert.notEqual(await getSessionId({ ...session, title: "Other session" }, setup), firstId);
  assert.notEqual(await getSessionId({ ...session, userScores: [[3, 0]] }, setup), firstId);
  assert.notEqual(await getSessionId(session, { ...setup, targetScores: [1, 3, 6, 10] }), firstId);

  const sessionId = crypto.randomUUID();
  const editedSession = { ...session, sessionId, userScores: [[3, 3]] };

  assert.equal(await getSessionId(editedSession, setup), sessionId);
  assert.equal(await getSessionId({ ...editedSession, setup }, setup), sessionId);
  assert.equal(await getSessionId({ ...session, sessionId: firstId, setup }, setup), firstId);
  assert.equal(isValidSession(editedSession, setup), true);
  console.log("practice session identity: all checks passed");
}

checkSessionIdentity().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
