import assert from "node:assert/strict";
import { createTarget, prepareTargetSettings, readTargetSettings, TARGET_SETTINGS_KEY } from "./target-settings";

const values = new Map<string, string>();
const storage = { getItem: (key: string) => values.get(key) ?? null };
assert.deepEqual(readTargetSettings(storage), createTarget());
values.set("setup", JSON.stringify({ endCount: 1, arrowCount: 2, targetScores: [3, 6] }));
assert.deepEqual(readTargetSettings(storage).rings.map((ring) => ring.score), [6, 3]);

const custom = createTarget([25, 10, 1]);
values.set(TARGET_SETTINGS_KEY, JSON.stringify(custom));
assert.deepEqual(readTargetSettings(storage), custom);
values.set(TARGET_SETTINGS_KEY, "not-json");
assert.throws(() => readTargetSettings(storage));
assert.equal(values.get(TARGET_SETTINGS_KEY), "not-json");
assert.throws(() => readTargetSettings({ getItem: () => { throw new Error("Storage unavailable"); } }));

values.set(TARGET_SETTINGS_KEY, JSON.stringify(custom));
const startStorage = { ...storage, setItem: (key: string, value: string) => { values.set(key, value); } };
assert.deepEqual(prepareTargetSettings(startStorage, createTarget()).target, custom);
assert.equal(values.get(TARGET_SETTINGS_KEY), JSON.stringify(custom), "Starting cannot overwrite newer settings");
assert.deepEqual(prepareTargetSettings({
  getItem: () => { throw new Error("Unavailable"); },
  setItem: () => { assert.fail("Do not overwrite settings after a failed read"); },
}, custom), { target: custom, saved: false });
console.log("target settings: all checks passed");
