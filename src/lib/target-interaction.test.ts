import assert from "node:assert/strict";
import { TargetGesture, type AimState } from "./target-interaction";
import { createTarget } from "./target-settings";
import type { TargetPoint } from "../types/target";

let preview: AimState = null;
let busy = false;
const committed: TargetPoint[] = [];
const gesture = new TargetGesture({
  target: createTarget(),
  preview: (value) => { preview = value; },
  busy: (value) => { busy = value; },
  commit: (point) => committed.push(point),
});

assert.equal(gesture.begin(1, { x: 0, y: 0 }, true), true);
assert.equal(busy, true);
assert.equal(gesture.release(1, { x: 0, y: 0 }), true);
assert.equal(committed.length, 0);
assert.equal(busy, false);

gesture.begin(1, { x: 0, y: 0 }, true);
gesture.ready();
gesture.move(2, { x: 1.4, y: 0 });
assert.equal(gesture.state?.phase, "aiming");
gesture.move(1, { x: 1.2, y: 1 });
assert.equal(gesture.state?.phase, "aiming", "Leaving the circle inside the box remains valid");
gesture.move(1, { x: 1.4, y: 0 });
assert.equal(gesture.state?.phase, "canceled");
gesture.move(1, { x: 0, y: 0 });
assert.equal(gesture.state?.phase, "canceled", "Re-entry cannot reactivate a canceled gesture");
assert.equal(gesture.release(1, { x: 0, y: 0 }), false);
assert.equal(committed.length, 0);
assert.equal(preview, null);

gesture.begin(7, { x: 0, y: 0 }, true);
gesture.ready();
gesture.release(7, { x: 1.2, y: 1.1 });
gesture.release(7, { x: 1.2, y: 1.1 });
assert.deepEqual(committed, [{ x: 1.2, y: 1.1 }]);

gesture.begin(8, { x: 0, y: 0 }, true);
gesture.ready();
gesture.abort();
gesture.release(8, { x: 0, y: 0 });
assert.equal(committed.length, 1);
console.log("target interaction: all checks passed");
