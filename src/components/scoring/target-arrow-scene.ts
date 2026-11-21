import {
  DirectionalLight, Euler, Group, HemisphereLight, OrthographicCamera,
  Scene, Vector3, WebGLRenderer,
} from "three";
import type { ArrowEntry } from "@/types/target-session";
import type { TargetConfig, TargetPoint } from "@/types/target";
import { createPetungArrow, disposePetungArrow } from "@/lib/petung-arrow";
import {
  createScoringArrow, poseArrowShadow, poseScoringArrow, scoringArrowRotation, scoringLaunchOffset,
} from "./target-arrow-pose";
import { createArrowShadows } from "./arrow-shadows";

type Flight = {
  kind: "lift" | "shot"; start: Vector3; end: Vector3;
  time: number; startScale: number; endScale: number;
  rotation: Euler;
};

const BOARD = 0;
const SHOT = 1;
const AIM = 2;
const DOCK = 3;

function setArrowLayer(arrow: Group, layer: number) {
  if (!arrow.layers.isEnabled(layer)) {
    arrow.layers.set(layer);
    arrow.children[0].traverse((part) => part.layers.set(layer));
  }
  arrow.children[1].visible = layer === SHOT || layer === BOARD;
}

export class TargetArrowScene {
  private renderer: WebGLRenderer;
  private shadows: ReturnType<typeof createArrowShadows>;
  private scene = new Scene();
  private camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 4800);
  private template = createPetungArrow();
  private arrows = new Map<string, Group>();
  private flights = new Map<string, Flight>();
  private previous = new Map<string, string>();
  private entries: ArrowEntry[] = [];
  private selected?: string;
  private preparing?: string;
  private aimPoint: TargetPoint = { x: 0, y: 0 };
  private frame = 0;
  private observer: ResizeObserver;
  private lost = false;
  private reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

  constructor(
    private root: HTMLDivElement,
    private box: HTMLDivElement,
    private target: TargetConfig,
    private availability: (ready: boolean) => void,
  ) {
    this.renderer = new WebGLRenderer({ alpha: true, antialias: true });
    this.renderer.setClearColor("#000000", 0);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.domElement.className = "target-arrow-canvas";
    this.renderer.domElement.setAttribute("aria-hidden", "true");
    this.root.append(this.renderer.domElement);
    const fill = new HemisphereLight("#fff1d1", "#65776d", 3);
    const key = new DirectionalLight("#fff3da", 4);
    fill.layers.enableAll();
    key.layers.enableAll();
    this.shadows = createArrowShadows(this.renderer, this.scene, key);
    this.scene.add(fill, key, this.shadows.surface);
    this.camera.position.z = 4000;
    this.observer = new ResizeObserver(this.layout);
    this.observer.observe(root);
    this.root.addEventListener("scroll", this.layout, true);
    this.renderer.domElement.addEventListener("webglcontextlost", this.contextLost);
    this.renderer.domElement.addEventListener("webglcontextrestored", this.contextRestored);
    this.reduced.addEventListener("change", this.motionChanged);
    this.availability(true);
  }

  update(entries: ArrowEntry[], selected?: string, aimPoint?: TargetPoint) {
    if (entries === this.entries && selected === this.selected && this.preparing && aimPoint) {
      this.aimPoint = aimPoint;
      const rotation = this.orientation(aimPoint);
      const lift = this.flights.get(this.preparing);
      if (lift) lift.rotation.copy(rotation);
      else this.arrows.get(this.preparing)!.rotation.copy(rotation);
      this.render();
      return;
    }
    const ready = aimPoint && entries.some((entry) => entry.id === selected && entry.status === "empty")
      ? selected : undefined;
    for (const entry of entries) {
      if (!this.arrows.has(entry.id)) {
        const arrow = createScoringArrow(this.template);
        this.arrows.set(entry.id, arrow);
        this.scene.add(arrow);
      }
      if ((entry.status === "hit" || entry.status === "miss")
        && this.previous.get(entry.id) === "empty" && !this.reduced.matches) {
        const arrow = this.arrows.get(entry.id)!;
        const staged = this.preparing === entry.id && this.flights.get(entry.id)?.kind !== "lift";
        this.flights.set(entry.id, {
          kind: "shot", start: staged ? arrow.position.clone() : this.readyTip(),
          end: this.impact(entry, this.box.getBoundingClientRect()), time: performance.now(),
          startScale: staged ? arrow.scale.x : this.arrowSize() * 2.2 / 8.4, endScale: 1,
          rotation: this.orientation(entry),
        });
      }
    }

    this.aimPoint = aimPoint ?? { x: 0, y: 0 };
    if (ready !== this.preparing) {
      if (this.preparing && this.flights.get(this.preparing)?.kind === "lift") {
        this.flights.delete(this.preparing);
      }
      this.preparing = ready;
      if (ready && !this.reduced.matches) {
        this.flights.set(ready, {
          kind: "lift", start: this.arrows.get(ready)!.position.clone(),
          end: this.readyTip(), time: performance.now(),
          startScale: this.arrows.get(ready)!.scale.x, endScale: 1,
          rotation: this.orientation(this.aimPoint),
        });
      }
    }
    this.entries = entries;
    this.selected = selected;
    this.layout();
    this.previous = new Map(entries.map((entry) => [entry.id, entry.status]));
  }

  private pixel(x: number, y: number) {
    const root = this.root.getBoundingClientRect();
    return new Vector3(x - root.left - root.width / 2, root.height / 2 - (y - root.top), 0);
  }

  private dockTip(id: string) {
    const slot = Array.from(this.root.querySelectorAll<HTMLElement>("[data-slot-id]"))
      .find((element) => element.dataset.slotId === id)?.getBoundingClientRect();
    return slot ? this.pixel(slot.left + slot.width / 2, slot.top + 12) : new Vector3();
  }

  private readyTip() {
    const rect = this.box.getBoundingClientRect();
    return this.pixel(rect.left, rect.top).add(scoringLaunchOffset(rect.width, rect.height));
  }

  private arrowSize() {
    return Math.min(170, this.box.getBoundingClientRect().width * 0.476) * 3;
  }

  private orientation(point: TargetPoint) {
    return scoringArrowRotation(this.readyTip(), this.impact(point, this.box.getBoundingClientRect()));
  }

  private impact(entry: TargetPoint, rect: DOMRect) {
    return this.pixel(
      rect.left + (entry.x / this.target.box.halfWidth + 1) * rect.width / 2,
      rect.top + (entry.y / this.target.box.halfHeight + 1) * rect.height / 2,
    );
  }

  private placeArrow(entry: ArrowEntry, rect: DOMRect) {
    const arrow = this.arrows.get(entry.id)!;
    const spatial = entry.status === "hit" || entry.status === "miss";
    arrow.visible = spatial || entry.status === "empty";
    if (!arrow.visible) { this.flights.delete(entry.id); return; }
    const ready = entry.id === this.preparing;
    let flight = this.flights.get(entry.id);
    if (!spatial && flight?.kind === "shot") {
      this.flights.delete(entry.id);
      flight = undefined;
    }
    const airborne = ready || Boolean(flight);
    setArrowLayer(arrow, spatial ? (flight ? SHOT : BOARD) : (airborne ? AIM : DOCK));
    // Compensate for the short screen projection when viewing the arrow from behind.
    const size = spatial ? this.arrowSize() * 0.9 : airborne ? this.arrowSize() * 2.2 : 115;
    const rotation = spatial ? this.orientation(entry) : this.orientation(this.aimPoint);
    poseScoringArrow(arrow, size * (this.selected === entry.id ? 1.07 : 1), spatial && !flight, rotation);
    if (!spatial && !airborne) {
      arrow.rotation.set(0.08, 0, -0.04);
      arrow.children[0].rotation.y = 0;
    }
    const destination = spatial ? this.impact(entry, rect) : ready ? this.readyTip() : this.dockTip(entry.id);
    if (flight) {
      flight.end.copy(destination);
      flight.endScale = arrow.scale.x;
      flight.rotation.copy(rotation);
      return;
    }
    arrow.position.copy(destination);
  }

  private layout = () => {
    const root = this.root.getBoundingClientRect();
    if (!root.width || !root.height || this.lost) return;
    const above = Math.max(260, root.top);
    const left = Math.max(0, root.left);
    const width = Math.max(root.width, document.documentElement.clientWidth);
    this.renderer.setSize(width, root.height + above);
    this.renderer.domElement.style.top = `${-above}px`;
    this.renderer.domElement.style.left = `${-left}px`;
    this.camera.left = -root.width / 2 - left;
    this.camera.right = this.camera.left + width;
    this.camera.top = root.height / 2 + above;
    this.camera.bottom = -root.height / 2;
    this.camera.updateProjectionMatrix();
    const rect = this.box.getBoundingClientRect();
    for (const entry of this.entries) this.placeArrow(entry, rect);
    this.shadows.update(this.pixel(rect.left + rect.width / 2, rect.top + rect.height / 2), rect.width, rect.height);
    this.render();
  };

  private render = () => {
    cancelAnimationFrame(this.frame);
    if (this.lost) return;
    const now = performance.now();
    for (const [id, flight] of this.flights) {
      const arrow = this.arrows.get(id)!;
      const elapsed = now - flight.time;
      const lift = flight.kind === "lift";
      const t = Math.min(1, elapsed / (lift ? 220 : 600));
      const travel = lift ? t : Math.min(1, elapsed / 420);
      const progress = lift ? 1 - Math.pow(1 - travel, 3) : travel * travel;
      arrow.position.lerpVectors(flight.start, flight.end, progress);
      const scaleProgress = lift ? progress ** 3 : progress;
      arrow.scale.setScalar(flight.startScale + (flight.endScale - flight.startScale) * scaleProgress);
      if (lift) {
        arrow.rotation.set(
          0.08 + (flight.rotation.x - 0.08) * progress,
          flight.rotation.y * progress, -0.04 + (flight.rotation.z + 0.04) * progress,
        );
      } else {
        arrow.rotation.copy(flight.rotation);
        const embedded = travel === 1;
        poseArrowShadow(arrow, embedded, flight.endScale);
        if (embedded) setArrowLayer(arrow, BOARD);
        const model = arrow.children[0];
        model.position.y = embedded ? 0.66 : 0;
        model.getObjectByName("steel-point")!.visible = !embedded;
        const settle = Math.min(1, Math.max(0, (elapsed - 420) / 180));
        model.position.y += Math.sin(settle * Math.PI * 4) * 0.035 * (1 - settle);
      }
      if (t === 1) this.flights.delete(id);
    }
    this.renderer.autoClear = false;
    this.renderer.setScissorTest(false);
    this.renderer.clear();
    this.renderLayer(BOARD, this.box.getBoundingClientRect());
    const dock = this.root.querySelector(".arrow-dock-scroll");
    if (dock) this.renderLayer(DOCK, dock.getBoundingClientRect());
    if (this.flights.size || this.preparing) {
      this.renderLayer(SHOT, this.renderer.domElement.getBoundingClientRect());
    }
    if (this.flights.size) this.frame = requestAnimationFrame(this.render);
  };

  private renderLayer(layer: number, bounds: DOMRect) {
    const canvas = this.renderer.domElement.getBoundingClientRect();
    this.camera.layers.set(layer);
    if (layer === SHOT) this.camera.layers.enable(AIM);
    this.renderer.setScissorTest(true);
    this.renderer.setScissor(
      Math.max(0, bounds.left - canvas.left), Math.max(0, canvas.bottom - bounds.bottom),
      Math.min(bounds.width, canvas.width), bounds.height,
    );
    this.renderer.shadowMap.needsUpdate = layer === BOARD;
    this.renderer.render(this.scene, this.camera);
  }

  private contextLost = (event: Event) => {
    event.preventDefault();
    this.lost = true;
    cancelAnimationFrame(this.frame);
    this.availability(false);
  };

  private contextRestored = () => {
    this.lost = false;
    this.availability(true);
    this.layout();
  };

  private motionChanged = () => { this.flights.clear(); this.layout(); };

  dispose() {
    cancelAnimationFrame(this.frame);
    this.observer.disconnect();
    this.root.removeEventListener("scroll", this.layout, true);
    this.reduced.removeEventListener("change", this.motionChanged);
    this.renderer.domElement.removeEventListener("webglcontextlost", this.contextLost);
    this.renderer.domElement.removeEventListener("webglcontextrestored", this.contextRestored);
    disposePetungArrow(this.template);
    this.shadows.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
    this.availability(false);
  }
}
