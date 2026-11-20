import {
  DirectionalLight, Group, HemisphereLight, OrthographicCamera,
  Scene, Vector3, WebGLRenderer,
} from "three";
import type { ArrowEntry } from "@/types/target-session";
import type { TargetConfig } from "@/types/target";
import { createPetungArrow, disposePetungArrow } from "@/lib/petung-arrow";
import {
  createScoringArrow, poseScoringArrow, SCORING_ARROW_TILT, SCORING_ARROW_TURN,
} from "./target-arrow-pose";

type Flight = {
  kind: "lift" | "shot"; start: Vector3; end: Vector3;
  time: number; startScale: number; endScale: number;
};

export class TargetArrowScene {
  private renderer: WebGLRenderer;
  private scene = new Scene();
  private camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 4800);
  private template = createPetungArrow();
  private placed = new Group();
  private dock = new Group();
  private flying = new Group();
  private arrows = new Map<string, Group>();
  private flights = new Map<string, Flight>();
  private previous = new Map<string, string>();
  private entries: ArrowEntry[] = [];
  private selected?: string;
  private preparing?: string;
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
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.domElement.className = "target-arrow-canvas";
    this.renderer.domElement.setAttribute("aria-hidden", "true");
    this.root.append(this.renderer.domElement);
    this.scene.add(new HemisphereLight("#fff1d1", "#65776d", 3));
    const key = new DirectionalLight("#fff3da", 4);
    key.position.set(200, 400, 800);
    this.scene.add(key, this.placed, this.dock, this.flying);
    this.camera.position.z = 2400;
    this.observer = new ResizeObserver(this.layout);
    this.observer.observe(root);
    this.root.addEventListener("scroll", this.layout, true);
    this.renderer.domElement.addEventListener("webglcontextlost", this.contextLost);
    this.renderer.domElement.addEventListener("webglcontextrestored", this.contextRestored);
    this.reduced.addEventListener("change", this.motionChanged);
    this.availability(true);
  }

  update(entries: ArrowEntry[], selected?: string, preparing = false) {
    const ready = preparing && entries.some((entry) => entry.id === selected && entry.status === "empty")
      ? selected : undefined;
    for (const entry of entries) {
      if (!this.arrows.has(entry.id)) {
        this.arrows.set(entry.id, createScoringArrow(this.template));
      }
      if ((entry.status === "hit" || entry.status === "miss")
        && this.previous.get(entry.id) === "empty" && !this.reduced.matches) {
        const arrow = this.arrows.get(entry.id)!;
        const staged = this.preparing === entry.id && this.flights.get(entry.id)?.kind !== "lift";
        this.flights.set(entry.id, {
          kind: "shot", start: staged ? arrow.position.clone() : this.readyTip(),
          end: this.impact(entry, this.box.getBoundingClientRect()), time: performance.now(),
          startScale: staged ? arrow.scale.x : this.arrowSize() * 2.2 / 8.4, endScale: 1,
        });
      }
    }

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
    return this.pixel(rect.right - 30, rect.top - 24).setZ(200);
  }

  private arrowSize() {
    return Math.min(170, this.box.getBoundingClientRect().width * 0.476) * 3;
  }

  private impact(entry: ArrowEntry & { x: number; y: number }, rect: DOMRect) {
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
    (airborne ? this.flying : spatial ? this.placed : this.dock).add(arrow);
    // Compensate for the short screen projection when viewing the arrow from behind.
    const size = spatial ? this.arrowSize() : airborne ? this.arrowSize() * 2.2 : 115;
    poseScoringArrow(arrow, size * (this.selected === entry.id ? 1.07 : 1), spatial && !flight);
    if (!spatial && !airborne) {
      arrow.rotation.set(0.08, 0, -0.04);
      arrow.children[0].rotation.y = 0;
    }
    const destination = spatial ? this.impact(entry, rect) : ready ? this.readyTip() : this.dockTip(entry.id);
    if (flight) {
      flight.end.copy(destination);
      flight.endScale = arrow.scale.x;
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
          0.08 + (SCORING_ARROW_TILT - 0.08) * progress,
          0, -0.04 + (SCORING_ARROW_TURN + 0.04) * progress,
        );
      } else {
        arrow.rotation.set(SCORING_ARROW_TILT, 0, SCORING_ARROW_TURN);
        const embedded = travel === 1;
        const model = arrow.children[0];
        model.position.y = embedded ? 0.66 : 0;
        model.getObjectByName("steel-point")!.visible = !embedded;
        const settle = Math.min(1, Math.max(0, (elapsed - 420) / 180));
        model.position.y += Math.sin(settle * Math.PI * 4) * 0.035 * (1 - settle);
      }
      if (t === 1) {
        this.flights.delete(id);
        if (!lift) this.placed.add(arrow);
      }
    }
    this.renderer.autoClear = false;
    this.renderer.setScissorTest(false);
    this.renderer.clear();
    this.renderGroup(this.placed, this.box.getBoundingClientRect());
    const dock = this.root.querySelector(".arrow-dock-scroll");
    if (dock) this.renderGroup(this.dock, dock.getBoundingClientRect());
    if (this.flights.size || this.preparing) {
      this.renderGroup(this.flying, this.renderer.domElement.getBoundingClientRect());
    }
    if (this.flights.size) this.frame = requestAnimationFrame(this.render);
  };

  private renderGroup(group: Group, bounds: DOMRect) {
    const canvas = this.renderer.domElement.getBoundingClientRect();
    this.placed.visible = group === this.placed;
    this.dock.visible = group === this.dock;
    this.flying.visible = group === this.flying;
    this.renderer.setScissorTest(true);
    this.renderer.setScissor(
      Math.max(0, bounds.left - canvas.left), Math.max(0, canvas.bottom - bounds.bottom),
      Math.min(bounds.width, canvas.width), bounds.height,
    );
    this.renderer.render(this.scene, this.camera);
    this.placed.visible = true;
    this.dock.visible = true;
    this.flying.visible = true;
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
    this.renderer.dispose();
    this.renderer.domElement.remove();
    this.availability(false);
  }
}
