import assert from "node:assert/strict";
import { test } from "node:test";
import { DirectionalLight, PCFShadowMap, Scene, Vector3, type WebGLRenderer } from "three";
import { createArrowShadows } from "../components/scoring/arrow-shadows";
import { createPetungArrow, disposePetungArrow } from "./petung-arrow";
import { createScoringArrow, poseArrowShadow, poseScoringArrow, scoringArrowRotation, scoringLaunchOffset }
  from "../components/scoring/target-arrow-pose";

test("arrow shadows use a transparent receiver and consistent light direction across boards", () => {
  const renderer = { shadowMap: {} } as WebGLRenderer;
  const scene = new Scene();
  const light = new DirectionalLight();
  const shadows = createArrowShadows(renderer, scene, light);
  let geometryDisposed = false;
  let materialDisposed = false;
  shadows.surface.geometry.addEventListener("dispose", () => { geometryDisposed = true; });
  shadows.surface.material.addEventListener("dispose", () => { materialDisposed = true; });

  for (const center of [new Vector3(0, 0, 0), new Vector3(200, -800, 0)]) {
    shadows.update(center, 512, 453);

    const ray = light.position.clone().sub(light.target.position);
    for (const x of [-320, 0, 320]) {
      for (const y of [-283, 0, 283]) {
        const impact = center.clone().add(new Vector3(x, y, 0));
        const launch = center.clone().add(new Vector3(290, 307, 200));
        for (const pose of [scoringArrowRotation(launch, impact), scoringArrowRotation(impact, center)]) {
          const tail = new Vector3(0, -1, 0).applyEuler(pose);
          const shadow = tail.clone().addScaledVector(ray, -tail.z / ray.z);
          assert.ok(shadow.angleTo(new Vector3(-1, -1, 0)) < Math.PI / 6);
        }
      }
    }
    assert.equal(shadows.surface.position.z, center.z);
    assert.deepEqual(shadows.surface.scale, new Vector3(512, 453, 1));
    assert.equal(renderer.shadowMap.needsUpdate, true);
    assert.ok(light.shadow.camera.right >= 512);
  }
  assert.equal(shadows.surface.receiveShadow, true);
  assert.equal(shadows.surface.castShadow, false);
  assert.equal(shadows.surface.material.transparent, true);
  assert.equal(shadows.surface.material.depthWrite, false);
  assert.equal(light.castShadow, true);
  assert.equal(renderer.shadowMap.type, PCFShadowMap);
  assert.equal(renderer.shadowMap.autoUpdate, false);

  shadows.dispose();

  assert.equal(geometryDisposed, true);
  assert.equal(materialDisposed, true);
  assert.equal(scene.children.includes(light.target), false);
});

test("the shadow stays compact during zoom and its tip reaches the board at impact", () => {
  const template = createPetungArrow();
  const arrow = createScoringArrow(template);
  const light = new DirectionalLight();
  const shadows = createArrowShadows({ shadowMap: {} } as WebGLRenderer, new Scene(), light);
  const launch = scoringLaunchOffset(318, 281).add(new Vector3(-159, 140.5, 0));
  const impact = new Vector3();
  const rotation = scoringArrowRotation(launch, impact);
  shadows.update(impact, 318, 281);
  const ray = light.position.clone().sub(light.target.position);
  const project = (point: Vector3) => point.clone().addScaledVector(ray, -point.z / ray.z);
  let previousGap = Infinity;
  let flightLength = 0;

  for (const progress of [0, 0.25, 0.7, 0.99, 1]) {
    const embedded = progress === 1;
    arrow.position.lerpVectors(launch, impact, progress);
    poseScoringArrow(arrow, 1000 - 590 * progress, embedded, rotation);
    poseArrowShadow(arrow, embedded, 410 / 8.4);
    const caster = arrow.children[1];
    const tip = project(caster.localToWorld(new Vector3(0, embedded ? -0.66 : 0, 0)));
    const tail = project(caster.localToWorld(new Vector3(0, -8.4, 0)));
    const gap = Math.hypot(tip.x - arrow.position.x, tip.y - arrow.position.y);
    const length = tip.distanceTo(tail);

    if (!progress) assert.ok(tip.x < -159 && tip.y < -140.5);
    if (!embedded) assert.ok(tip.x < impact.x && tip.y < impact.y);
    assert.ok(length > 15 && length < 42);
    if (progress === 0) flightLength = length;
    if (!embedded) assert.ok(Math.abs(length - flightLength) < 1e-8);
    assert.ok(gap < previousGap);
    assert.ok(embedded ? gap < 1e-8 : gap > 0);
    previousGap = gap;
  }

  shadows.dispose();
  disposePetungArrow(template);
});

test("embedded shadows grow with visible shaft length on either side of the light", () => {
  const template = createPetungArrow();
  const arrow = createScoringArrow(template);
  const light = new DirectionalLight();
  const shadows = createArrowShadows({ shadowMap: {} } as WebGLRenderer, new Scene(), light);
  const center = new Vector3();
  shadows.update(center, 640, 566);
  const ray = light.position.clone().sub(light.target.position);

  for (const [dx, dy] of [[1, 1], [1, -1], [-1, 1], [-1, -1], [0, 1], [1, 0]]) {
    let previousLength = 0;
    for (const distance of [0, 85, 230]) {
      const tail = new Vector3(dx * distance, dy * distance, 0);
      poseScoringArrow(arrow, 459, true, scoringArrowRotation(tail, center));
      const [model, caster] = arrow.children;
      const visibleTail = model.localToWorld(new Vector3(0, -8.4, 0));
      const shadowTail = caster.localToWorld(new Vector3(0, -8.4, 0));
      shadowTail.addScaledVector(ray, -shadowTail.z / ray.z);
      const length = shadowTail.length();
      const visible = Math.hypot(visibleTail.x, visibleTail.y);

      if (!distance) assert.ok(length > 0 && length < 12);
      else assert.ok(length > previousLength + 5 && length < visible + 12);
      assert.ok(shadowTail.x < 0 && shadowTail.y < 0);
      assert.ok(caster.localToWorld(new Vector3(0, -0.66, 0)).length() < 1e-8);
      previousLength = length;
    }
  }

  shadows.dispose();
  disposePetungArrow(template);
});
