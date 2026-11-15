import assert from "node:assert/strict";
import { getPracticeTitle } from "./practice-title";

const practice = { distance: 8, createdAt: new Date(2026, 10, 16, 12) };

assert.equal(getPracticeTitle(practice), "Latihan 8 m · 16 Nov 2026");
assert.equal(getPracticeTitle({ ...practice, title: "" }), "Latihan 8 m · 16 Nov 2026");
assert.equal(getPracticeTitle({ ...practice, title: "   " }), "Latihan 8 m · 16 Nov 2026");
assert.equal(getPracticeTitle({ ...practice, title: " Latihan Sore " }), "Latihan Sore");
assert.equal(
  getPracticeTitle({ ...practice, distance: undefined }),
  "Latihan (jarak tidak tercatat) · 16 Nov 2026",
);

console.log("getPracticeTitle: all checks passed");
