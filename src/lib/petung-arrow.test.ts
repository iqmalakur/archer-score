import assert from "node:assert/strict";
import { Box3, Mesh } from "three";
import { createPetungArrow, disposePetungArrow } from "./petung-arrow";

const arrow = createPetungArrow();
const bounds = new Box3().setFromObject(arrow);

assert.ok(Math.abs(bounds.max.y) < 0.00001, "The tip stays at the origin");
assert.ok(bounds.min.y < -8.39, "The arrow extends behind the tip");
assert.equal(arrow.children.filter((part) => part.name.startsWith("feather-")).length, 3);
assert.ok(arrow.getObjectByName("slotted-nock"));

arrow.traverse((part) => {
  if (!(part instanceof Mesh)) return;

  const positions = part.geometry.getAttribute("position");
  assert.ok(Array.from(positions.array).every(Number.isFinite));
});

const shaft = arrow.getObjectByName("bamboo-shaft") as Mesh;
let geometryDisposed = false;
shaft.geometry.addEventListener("dispose", () => { geometryDisposed = true; });

disposePetungArrow(arrow);

assert.ok(geometryDisposed, "Disposing the model releases its geometry");
console.log("petung-arrow: all checks passed");
