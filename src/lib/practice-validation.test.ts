import assert from "node:assert/strict";
import {
  getSessionSetup, isValidDistance, isValidSession, isValidSetup,
} from "./practice-validation";

const setup = { endCount: 2, arrowCount: 2, targetScores: [1, 3, 6] };
const session = {
  currentEnd: 2,
  userScores: [[6, 0], [3, 1]],
  isStarted: true,
};

assert.equal(isValidSetup(setup), true);
assert.equal(isValidSession(session, setup), true);
assert.equal(isValidSession({ ...session, title: "Sore", distance: 8 }, setup), true);

const snapshot = { ...session, setup };
const differentSetup = { endCount: 1, arrowCount: 1, targetScores: [10] };

assert.deepEqual(getSessionSetup(snapshot), setup);
assert.deepEqual(getSessionSetup(snapshot, differentSetup), setup);
assert.deepEqual(getSessionSetup(snapshot, { broken: true }), setup);
assert.equal(isValidSession(snapshot, differentSetup), true);
assert.deepEqual(getSessionSetup(session, setup), setup);
assert.equal(getSessionSetup(session), undefined);
assert.equal(getSessionSetup({ ...snapshot, setup: null }, setup), undefined);
assert.equal(getSessionSetup({ ...snapshot, setup: {} }, setup), undefined);
assert.equal(isValidSession({ ...snapshot, setup: null }, setup), false);
assert.equal(isValidSession({ ...snapshot, userScores: [[10, 0], [0, 0]] }, setup), false);
assert.equal(isValidSession({ ...snapshot, userScores: [[0, 0], [0, 0]] }, setup), true);

for (const value of [null, [], 1, "setup", {}, { ...setup, endCount: 0 },
  { ...setup, endCount: 21 }, { ...setup, endCount: 1.5 },
  { ...setup, arrowCount: 0 }, { ...setup, arrowCount: 13 },
  { ...setup, arrowCount: "2" }, { ...setup, targetScores: [] },
  { ...setup, targetScores: [1, 1] }, { ...setup, targetScores: [0] },
  { ...setup, targetScores: [11] }, { ...setup, targetScores: [NaN] },
  { ...setup, targetScores: ["1"] }]) {
  assert.equal(isValidSetup(value), false, JSON.stringify(value));
}

for (const value of [null, [], "session", {}, { ...session, isStarted: false },
  { ...session, currentEnd: 0 }, { ...session, currentEnd: 3 },
  { ...session, currentEnd: 1.5 }, { ...session, currentEnd: "1" },
  { ...session, userScores: [] }, { ...session, userScores: [[1], [3, 0]] },
  { ...session, userScores: [[1, 0], null] },
  { ...session, userScores: [["1", 0], [3, 0]] },
  { ...session, userScores: [[2, 0], [3, 0]] },
  { ...session, userScores: [[Infinity, 0], [3, 0]] },
  { ...session, userScores: [[NaN, 0], [3, 0]] },
  { ...session, sessionId: null }, { ...session, sessionId: "" },
  { ...session, sessionId: 123 }, { ...session, sessionId: "invalid-id" },
  { ...session, title: null }, { ...session, distance: 0 }]) {
  assert.equal(isValidSession(value, setup), false, JSON.stringify(value));
}

for (const distance of [1, 150, 4, 6, 8, 10, 12, 14, 16, 18, 20]) {
  assert.equal(isValidDistance(distance), true);
}

for (const distance of ["", "8", null, undefined, 0, -1, 1.5, 151, NaN, Infinity]) {
  assert.equal(isValidDistance(distance), false);
}

console.log("practice validation: all checks passed");
