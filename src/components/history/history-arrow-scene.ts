import {
  DirectionalLight, Group, HemisphereLight, OrthographicCamera,
  Scene, Vector3, WebGLRenderer,
} from "three";
import type { TargetConfig } from "@/types/target";
import type { ArrowEntry } from "@/types/target-session";
import { createPetungArrow, disposePetungArrow } from "@/lib/petung-arrow";
import { createScoringArrow, poseScoringArrow, scoringArrowRotation } from "../scoring/target-arrow-pose";
import { createArrowShadows } from "../scoring/arrow-shadows";

export class HistoryArrowScene {
  private renderer: WebGLRenderer;
  private shadows: ReturnType<typeof createArrowShadows>;
  private scene = new Scene();
  private camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 4800);
  private template = createPetungArrow();
  private groups: Group[];
  private boards: HTMLElement[];
  private observer: ResizeObserver;
  private frame = 0;
  private width = 0;
  private height = 0;
  private lost = false;

  constructor(
    private root: HTMLElement,
    private target: TargetConfig,
    private ends: ArrowEntry[][],
    private availability: (ready: boolean) => void,
  ) {
    this.renderer = new WebGLRenderer({ alpha: true, antialias: true });
    this.renderer.setClearColor("#000000", 0);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.autoClear = false;
    const canvas = this.renderer.domElement;
    canvas.className = "fixed inset-0 z-10 pointer-events-none";
    canvas.setAttribute("aria-hidden", "true");
    this.root.append(canvas);
    this.camera.position.z = 2400;
    this.scene.add(new HemisphereLight("#fff1d1", "#65776d", 3));
    const key = new DirectionalLight("#fff3da", 4);
    this.shadows = createArrowShadows(this.renderer, this.scene, key);
    this.scene.add(key, this.shadows.surface);
    this.boards = Array.from(root.querySelectorAll<HTMLElement>("[data-history-end]"));
    this.groups = ends.map((entries) => {
      const group = new Group();
      for (const entry of entries) {
        if (entry.status === "hit" || entry.status === "miss") group.add(createScoringArrow(this.template));
      }
      group.visible = false;
      this.scene.add(group);
      return group;
    });
    this.observer = new ResizeObserver(this.schedule);
    for (const board of this.boards) this.observer.observe(board);
    window.addEventListener("scroll", this.schedule, { passive: true });
    window.addEventListener("resize", this.schedule);
    canvas.addEventListener("webglcontextlost", this.contextLost);
    canvas.addEventListener("webglcontextrestored", this.contextRestored);
    this.render();
    this.availability(true);
  }

  private schedule = () => {
    cancelAnimationFrame(this.frame);
    this.frame = requestAnimationFrame(this.render);
  };

  private render = () => {
    if (this.lost) return;
    const width = document.documentElement.clientWidth;
    const height = window.innerHeight;
    if (width !== this.width || height !== this.height) {
      this.width = width;
      this.height = height;
      this.renderer.setSize(width, height);
      this.camera.left = -width / 2;
      this.camera.right = width / 2;
      this.camera.top = height / 2;
      this.camera.bottom = -height / 2;
      this.camera.updateProjectionMatrix();
    }
    this.renderer.setScissorTest(false);
    this.renderer.clear();
    this.boards.forEach((element, index) => this.drawBoard(element, index));
  };

  private drawBoard(element: HTMLElement, index: number) {
    const rect = element.getBoundingClientRect();
    const left = Math.max(0, rect.left);
    const right = Math.min(this.width, rect.right);
    const top = Math.max(0, rect.top);
    const bottom = Math.min(this.height, rect.bottom);
    if (right <= left || bottom <= top) return;

    const group = this.groups[index];
    const center = new Vector3(rect.left + rect.width / 2 - this.width / 2,
      this.height / 2 - rect.top - rect.height / 2, 0);
    const size = Math.min(170, rect.width * 0.476) * 3 * 0.9;
    let arrowIndex = 0;
    for (const entry of this.ends[index]) {
      if (entry.status !== "hit" && entry.status !== "miss") continue;
      const arrow = group.children[arrowIndex++] as Group;
      arrow.position.set(
        center.x + entry.x / this.target.box.halfWidth * rect.width / 2,
        center.y - entry.y / this.target.box.halfHeight * rect.height / 2, 0,
      );
      // Looking from the target center makes each shaft lean outward from its impact.
      poseScoringArrow(arrow, size, true, scoringArrowRotation(arrow.position, center));
    }
    group.visible = true;
    this.shadows.update(center, rect.width, rect.height);
    this.renderer.setScissorTest(true);
    this.renderer.setScissor(left, this.height - bottom, right - left, bottom - top);
    this.renderer.render(this.scene, this.camera);
    group.visible = false;
  }

  private contextLost = (event: Event) => {
    event.preventDefault();
    this.lost = true;
    cancelAnimationFrame(this.frame);
    this.availability(false);
  };

  private contextRestored = () => {
    this.lost = false;
    this.render();
    this.availability(true);
  };

  dispose() {
    cancelAnimationFrame(this.frame);
    this.observer.disconnect();
    window.removeEventListener("scroll", this.schedule);
    window.removeEventListener("resize", this.schedule);
    this.renderer.domElement.removeEventListener("webglcontextlost", this.contextLost);
    this.renderer.domElement.removeEventListener("webglcontextrestored", this.contextRestored);
    disposePetungArrow(this.template);
    this.shadows.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
    this.availability(false);
  }
}
