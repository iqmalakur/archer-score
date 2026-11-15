import assert from "node:assert/strict";
import { calculateScore } from "./score";

const practice = {
  targetScores: [1, 2, 3, 4, 5, 6],
  userScores: [[6, 3], [3, 0]],
  arrowCount: 2,
  endCount: 2,
};

assert.deepEqual(calculateScore(practice), {
  maxScore: 24,
  totalScore: 12,
  percentage: 50,
  isPassed: true,
});
assert.deepEqual(calculateScore({ ...practice, targetScores: [1, 3, 5, 10] }), {
  maxScore: 40,
  totalScore: 12,
  percentage: 30,
  isPassed: false,
});
assert.deepEqual(calculateScore({ ...practice, userScores: [[0, 0], [0, 0]] }), {
  maxScore: 24,
  totalScore: 0,
  percentage: 0,
  isPassed: false,
});
assert.deepEqual(calculateScore({ ...practice, targetScores: [] }), {
  maxScore: 0,
  totalScore: 12,
  percentage: 0,
  isPassed: false,
});
assert.deepEqual(calculateScore({ ...practice, endCount: 0, userScores: [] }), {
  maxScore: 0,
  totalScore: 0,
  percentage: 0,
  isPassed: false,
});
assert.equal(calculateScore({ ...practice, userScores: [[6, 3], [2, 0]] }).isPassed, false);
assert.equal(calculateScore(practice, 51).isPassed, false);
assert.equal(calculateScore(practice, 40).isPassed, true);

console.log("calculateScore: all checks passed");
