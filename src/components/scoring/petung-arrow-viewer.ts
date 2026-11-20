import {
  ACESFilmicToneMapping, Box3, DirectionalLight, Group,
  HemisphereLight, PerspectiveCamera, Scene, Vector3, WebGLRenderer,
} from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { createPetungArrow, disposePetungArrow } from "@/lib/petung-arrow";

export type ArrowView = "full" | "point" | "tail";

export function createPetungViewer(
  container: HTMLDivElement,
  onError: () => void,
  onReady: () => void,
) {
  const renderer = new WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.3;
  renderer.domElement.setAttribute("aria-label", "Model 3D panah bambu petung");
  renderer.domElement.setAttribute("role", "img");
  container.appendChild(renderer.domElement);

  const scene = new Scene();
  const arrow = createPetungArrow();
  const display = new Group();
  display.add(arrow);
  arrow.position.y = 4.2;
  scene.add(display);

  scene.add(new HemisphereLight("#fff3d9", "#56776c", 3));
  const key = new DirectionalLight("#fff4da", 4);
  key.position.set(3, 4, 6);
  const rim = new DirectionalLight("#b8ded8", 3);
  rim.position.set(-3, 1, -3);
  scene.add(key, rim);

  const camera = new PerspectiveCamera(35, 1, 0.01, 100);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.minDistance = 0.3;
  controls.maxDistance = 30;
  controls.enablePan = false;
  let view: ArrowView = "full";
  let contextLost = false;

  const render = () => {
    if (!contextLost) renderer.render(scene, camera);
  };
  const frame = () => {
    const width = container.clientWidth;
    const height = container.clientHeight;
    if (!width || !height) return;

    renderer.setSize(width, height);
    camera.aspect = width / height;
    display.rotation.set(0, 0, width > height ? -Math.PI / 2.4 : -0.16);
    display.updateMatrixWorld(true);

    const subject = view === "point"
      ? arrow.getObjectByName("steel-point")!
      : view === "tail" ? arrow.getObjectByName("feather-1")! : display;
    const bounds = new Box3().setFromObject(subject);
    const target = bounds.getCenter(new Vector3());
    const size = view === "tail"
      ? new Vector3(2.4, 2.4, 2.4) : bounds.getSize(new Vector3());
    const halfFov = camera.fov * Math.PI / 360;
    const distance = Math.max(size.y, size.x / camera.aspect)
      / (2 * Math.tan(halfFov)) * 1.25;

    camera.position.copy(target).add(new Vector3(0.15, 0.12, distance));
    controls.target.copy(target);
    camera.updateProjectionMatrix();
    controls.update();
    render();
  };
  const lost = (event: Event) => {
    event.preventDefault();
    contextLost = true;
    onError();
  };
  const restored = () => {
    contextLost = false;
    frame();
    onReady();
  };
  renderer.domElement.addEventListener("webglcontextlost", lost);
  renderer.domElement.addEventListener("webglcontextrestored", restored);
  controls.addEventListener("change", render);
  const observer = new ResizeObserver(frame);
  observer.observe(container);
  frame();

  return {
    show(next: ArrowView) {
      view = next;
      frame();
    },
    rotate(direction: number) {
      display.rotation.y += direction * Math.PI / 6;
      render();
    },
    dispose() {
      observer.disconnect();
      controls.dispose();
      renderer.domElement.removeEventListener("webglcontextlost", lost);
      renderer.domElement.removeEventListener("webglcontextrestored", restored);
      disposePetungArrow(arrow);
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
