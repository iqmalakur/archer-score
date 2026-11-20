import { Euler, Group, Vector3 } from "three";

export function createScoringArrow(template: Group) {
  const arrow = new Group();
  arrow.add(template.clone(true));
  return arrow;
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
}
