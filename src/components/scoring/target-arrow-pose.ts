import { Euler, Group, Mesh, Vector3 } from "three";
import { ARROW_SHADOW_LAYER, BOARD_LIGHT_OFFSET } from "./arrow-shadows";

const shaft = new Vector3();

/** World-space offset from the board's upper-left corner to the hovering tip. */
export function scoringLaunchOffset(width: number, height: number) {
  const x = width - 30;
  const y = 24;
  // Project the tip beyond both lower-left edges, including the shadow's soft border.
  const margin = 12;
  const depth = BOARD_LIGHT_OFFSET.z * Math.max(
    (x + margin) / BOARD_LIGHT_OFFSET.x,
    (height + y + margin) / BOARD_LIGHT_OFFSET.y,
  );
  return new Vector3(x, y, depth);
}

export function createScoringArrow(template: Group) {
  const arrow = new Group();
  const caster = new Group();
  // Only the shaft, point, nock and feathers contribute to the small silhouette.
  for (const part of template.children) {
    if (part.name) caster.add(part.clone(true));
  }
  caster.traverse((part) => {
    part.layers.set(ARROW_SHADOW_LAYER);
    part.castShadow = part instanceof Mesh;
  });
  caster.rotation.y = -Math.PI / 2;
  arrow.add(template.clone(true), caster);
  return arrow;
}

export function poseArrowShadow(arrow: Group, embedded: boolean, boardScale = arrow.scale.x) {
  const caster = arrow.children[1];
  shaft.set(0, -1, 0).applyQuaternion(arrow.quaternion);
  const visibleLength = Math.hypot(shaft.x, shaft.y);
  const depth = shaft.z / BOARD_LIGHT_OFFSET.z;
  const projectedLength = Math.hypot(
    shaft.x - depth * BOARD_LIGHT_OFFSET.x,
    shaft.y - depth * BOARD_LIGHT_OFFSET.y,
  );
  // Keep a small shadow under the feathers when the shaft points straight at the camera.
  const shadowLength = 0.02 + 0.65 * visibleLength;
  const lengthScale = Math.min(1, shadowLength / Math.max(0.001, projectedLength));
  // The apparent zoom near the camera does not magnify a directional shadow on the board.
  const ratio = boardScale / arrow.scale.x;
  caster.scale.set(0.6 * ratio, lengthScale * ratio, 0.6 * ratio);
  caster.position.y = embedded ? 0.66 * caster.scale.y : 0;
}

export function scoringArrowRotation(launch: Vector3, impact: Vector3) {
  // A distant launch depth preserves the front view with the fixed scoring camera.
  const tail = new Vector3(launch.x - impact.x, launch.y - impact.y, 2400).normalize();
  return new Euler(Math.atan2(tail.z, tail.y), 0, Math.PI - Math.asin(tail.x));
}

export function poseScoringArrow(arrow: Group, size: number, embedded: boolean, rotation: Euler) {
  arrow.scale.setScalar(size / 8.4);
  arrow.rotation.copy(rotation);
  const model = arrow.children[0];
  model.rotation.y = -Math.PI / 2;
  // Keep the shaft entry at the stored point while burying the metal tip.
  model.position.y = embedded ? 0.66 : 0;
  model.getObjectByName("steel-point")!.visible = !embedded;
  poseArrowShadow(arrow, embedded);
}
