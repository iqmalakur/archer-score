import assert from "node:assert/strict";
import { test } from "node:test";
import { Mesh, Vector3 } from "three";
import { createPetungArrow, disposePetungArrow } from "./petung-arrow";
import {
  createScoringArrow, poseScoringArrow, scoringArrowRotation,
} from "../components/scoring/target-arrow-pose";

test("embedded arrow hides its point and extends above and right of the stored entry", () => {
  const template = createPetungArrow();
  const arrow = createScoringArrow(template);
  assert.equal((arrow.children[0].getObjectByName("bamboo-shaft") as Mesh).castShadow, false);
  assert.equal((arrow.children[1].getObjectByName("bamboo-shaft") as Mesh).castShadow, true);
  assert.equal((template.getObjectByName("bamboo-shaft") as Mesh).castShadow, false);
  arrow.position.set(40, -20, 0);

  const rotation = scoringArrowRotation(new Vector3(150, 200, 200), arrow.position);
  poseScoringArrow(arrow, 170, true, rotation);
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

  poseScoringArrow(arrow, 115, false, rotation);
  assert.equal(model.position.y, 0);
  assert.equal(model.getObjectByName("steel-point")!.visible, true);
  disposePetungArrow(template);
});

test("each placement preserves its own last aim rotation and exact entry point", () => {
  const template = createPetungArrow();
  const arrow = createScoringArrow(template);
  const launch = new Vector3(150, 220, 200);
  const points = [-0.6, 0, 0.6].flatMap((y) => [-0.6, 0, 0.6].map((x) => ({ x, y })));
  points.push({ x: 1.3, y: 1.15 }, { x: -1.3, y: -1.15 });

  for (const { x, y } of points) {
    const impact = new Vector3(x * 180, -y * 180, 0);
    const rotation = scoringArrowRotation(launch, impact);
    arrow.position.copy(launch);
    poseScoringArrow(arrow, 1122, false, rotation);
    const steadyAim = arrow.quaternion.clone();
    arrow.position.set(x * 180, -y * 180, 0);
    poseScoringArrow(arrow, 459, true, rotation);
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

test("aim rotation tracks the destination from one fixed launch without changing its position", () => {
  const launch = new Vector3(150, 220, 200);
  const original = launch.clone();
  const destinations = [new Vector3(-150, -100, 0), new Vector3(100, 100, 0)];
  const directions = destinations.map((impact) => new Vector3(0, -1, 0)
    .applyEuler(scoringArrowRotation(launch, impact)));

  for (const [index, direction] of directions.entries()) {
    const impact = destinations[index];
    assert.ok(Math.abs(direction.x / direction.z - (launch.x - impact.x) / 2400) < 1e-10);
    assert.ok(Math.abs(direction.y / direction.z - (launch.y - impact.y) / 2400) < 1e-10);
    assert.ok(direction.z > 0.98);
  }
  assert.ok(directions[0].angleTo(directions[1]) > 0.05);
  assert.deepEqual(launch, original);
});

test("history arrows lean away from the target center and face forward at the bullseye", () => {
  const center = new Vector3(40, -20, 0);
  const template = createPetungArrow();
  const arrow = createScoringArrow(template);

  for (const x of [-180, 0, 180]) {
    for (const y of [-160, 0, 160]) {
      arrow.position.copy(center).add(new Vector3(x, y, 0));
      const rotation = scoringArrowRotation(arrow.position, center);
      poseScoringArrow(arrow, 459, true, rotation);
      arrow.updateMatrixWorld(true);
      const model = arrow.children[0];
      const entry = model.localToWorld(new Vector3(0, -0.66, 0));
      const direction = new Vector3(0, -1, 0).applyEuler(rotation);

      assert.ok(entry.distanceTo(arrow.position) < 1e-10);
      assert.ok(Math.abs(direction.x / direction.z - x / 2400) < 1e-10);
      assert.ok(Math.abs(direction.y / direction.z - y / 2400) < 1e-10);
      assert.ok(direction.z > 0.99);
      assert.equal(model.getObjectByName("steel-point")!.visible, false);
    }
  }
  disposePetungArrow(template);
});
