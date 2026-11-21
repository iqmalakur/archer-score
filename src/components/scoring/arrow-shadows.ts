import {
  DirectionalLight, Mesh, PCFShadowMap, PlaneGeometry,
  Scene, ShadowMaterial, Vector3, type WebGLRenderer,
} from "three";

export const ARROW_SHADOW_LAYER = 4;
export const BOARD_LIGHT_OFFSET = new Vector3(1050, 1050, 3000);

export function createArrowShadows(renderer: WebGLRenderer, scene: Scene, light: DirectionalLight) {
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFShadowMap;
  renderer.shadowMap.autoUpdate = false;
  light.castShadow = true;
  light.shadow.camera.layers.set(ARROW_SHADOW_LAYER);
  light.shadow.mapSize.set(1024, 1024);
  light.shadow.radius = 2;
  light.shadow.bias = -0.0001;
  light.shadow.normalBias = 0.2;
  light.shadow.camera.near = 10;
  light.shadow.camera.far = 4000;
  scene.add(light.target);

  const surface = new Mesh(new PlaneGeometry(1, 1), new ShadowMaterial({
    opacity: 0.16, depthWrite: false,
  }));
  surface.name = "arrow-shadow-receiver";
  surface.receiveShadow = true;

  return {
    surface,
    update(center: Vector3, width: number, height: number) {
      surface.position.copy(center);
      surface.scale.set(width, height, 1);
      light.position.copy(center).add(BOARD_LIGHT_OFFSET);
      light.target.position.copy(center);
      const extent = Math.max(width, height) * 0.75 + 250;
      const camera = light.shadow.camera;
      camera.left = camera.bottom = -extent;
      camera.right = camera.top = extent;
      camera.updateProjectionMatrix();
      renderer.shadowMap.needsUpdate = true;
    },
    dispose() {
      surface.geometry.dispose();
      surface.material.dispose();
      light.shadow.dispose();
      scene.remove(light.target);
    },
  };
}
