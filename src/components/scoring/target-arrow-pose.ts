import { Group } from "three";

export const SCORING_ARROW_TILT = 1.5;
export const SCORING_ARROW_TURN = 3.095;

export function createScoringArrow(template: Group) {
  const arrow = new Group();
  arrow.add(template.clone(true));
  return arrow;
}

export function poseScoringArrow(arrow: Group, size: number, embedded: boolean) {
  arrow.scale.setScalar(size / 8.4);
  arrow.rotation.set(SCORING_ARROW_TILT, 0, SCORING_ARROW_TURN);
  const model = arrow.children[0];
  model.rotation.y = -Math.PI / 2;
  // Keep the shaft entry at the stored point while burying the metal tip.
  model.position.y = embedded ? 0.66 : 0;
  model.getObjectByName("steel-point")!.visible = !embedded;
}
