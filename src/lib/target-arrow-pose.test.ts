import assert from "node:assert/strict";
import { test } from "node:test";
import { Vector3 } from "three";
import { createPetungArrow, disposePetungArrow } from "./petung-arrow";
import { createScoringArrow, poseScoringArrow } from "../components/scoring/target-arrow-pose";

test("embedded arrow hides its point and extends above and right of the stored entry", () => {
  const template = createPetungArrow();
  const arrow = createScoringArrow(template);
  arrow.position.set(40, -20, 0);

  poseScoringArrow(arrow, 170, true);
  arrow.updateMatrixWorld(true);

  const model = arrow.children[0];
  const entry = model.localToWorld(new Vector3(0, -0.66, 0));
  const tail = model.localToWorld(new Vector3(0, -8.4, 0));
  assert.ok(entry.distanceTo(arrow.position) < 1e-10);
  assert.ok(tail.x > entry.x && tail.y > entry.y && tail.z > entry.z);
  const direction = tail.clone().sub(entry);
  assert.ok(direction.z > Math.hypot(direction.x, direction.y) * 8);
  const creamFeather = model.localToWorld(new Vector3(0.35, -7.5, 0));
  const shaft = model.localToWorld(new Vector3(0, -7.5, 0));
  assert.ok(creamFeather.y < shaft.y);
  assert.equal(model.getObjectByName("steel-point")!.visible, false);
  assert.equal(template.getObjectByName("steel-point")!.visible, true);

  poseScoringArrow(arrow, 115, false);
  assert.equal(model.position.y, 0);
  assert.equal(model.getObjectByName("steel-point")!.visible, true);
  disposePetungArrow(template);
});

test("every placed arrow keeps the steady aim orientation and its recorded entry point", () => {
  const template = createPetungArrow();
  const arrow = createScoringArrow(template);
  poseScoringArrow(arrow, 1122, false);
  const steadyAim = arrow.quaternion.clone();
  const points = [-0.6, 0, 0.6].flatMap((y) => [-0.6, 0, 0.6].map((x) => ({ x, y })));
  points.push({ x: 1.3, y: 1.15 }, { x: -1.3, y: -1.15 });

  for (const { x, y } of points) {
    arrow.position.set(x * 180, -y * 180, 0);
    poseScoringArrow(arrow, 510, true);
    arrow.updateMatrixWorld(true);
    const model = arrow.children[0];
    const entry = model.localToWorld(new Vector3(0, -0.66, 0));

    assert.ok(entry.distanceTo(arrow.position) < 1e-10);
    assert.ok(arrow.quaternion.angleTo(steadyAim) < 1e-7);
    assert.equal(model.getObjectByName("steel-point")!.visible, false);
  }

  assert.equal(template.getObjectByName("steel-point")!.visible, true);
  disposePetungArrow(template);
});
