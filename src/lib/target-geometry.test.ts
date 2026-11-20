import assert from "node:assert/strict";
import { classifyPoint, insideBox, pointFromClient } from "./target-geometry";
import { createTarget, isValidTarget } from "./target-settings";

const target = createTarget();

assert.equal(classifyPoint(target, { x: 0, y: 0 })?.status, "hit");
assert.equal(classifyPoint(target, { x: 1 / 6, y: 0 })?.status, "hit");
assert.equal(classifyPoint(target, { x: 0.5, y: 0 })?.status, "hit");
assert.deepEqual(classifyPoint(target, { x: 0.5, y: 0 }), {
  status: "hit", x: 0.5, y: 0, ringId: "ring-3", score: 4,
});
assert.equal(classifyPoint(target, { x: 0.50001, y: 0 })?.status, "hit");
assert.deepEqual(classifyPoint(target, { x: 1.2, y: 1.1 }), {
  status: "miss", x: 1.2, y: 1.1,
});
assert.equal(classifyPoint(target, { x: 1, y: 0 })?.status, "hit");
assert.equal(classifyPoint(target, { x: 1.3, y: 1.15 })?.status, "miss");
assert.equal(classifyPoint(target, { x: 1.301, y: 0 }), null);
assert.equal(insideBox(target, { x: NaN, y: 0 }), false);
const converted = pointFromClient(target, {
  left: 20, top: 30, width: 260, height: 230,
}, 270, 255);
assert.ok(Math.abs(converted.x - 1.2) < 1e-9);
assert.ok(Math.abs(converted.y - 1.1) < 1e-9);

for (const score of [0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER]) {
  assert.equal(isValidTarget({
    ...target, rings: [{ ...target.rings[0], score }],
  }), false);
}
assert.equal(isValidTarget({ ...target, rings: [] }), false);
assert.equal(isValidTarget({ ...target, rings: [target.rings[0], target.rings[0]] }), false);
console.log("target geometry: all checks passed");
