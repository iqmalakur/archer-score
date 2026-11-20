import type { TargetConfig, TargetPoint } from "../types/target";
import { insideBox } from "./target-geometry";

export type AimState = { phase: "pending" | "aiming" | "canceled"; point: TargetPoint } | null;

interface GestureOptions {
  target: TargetConfig;
  preview: (aim: AimState) => void;
  commit: (point: TargetPoint) => void;
  busy: (value: boolean) => void;
}

export class TargetGesture {
  pointer: number | null = null;
  state: AimState = null;

  constructor(private options: GestureOptions) {}

  begin(pointer: number, point: TargetPoint, canAim: boolean) {
    if (this.pointer !== null || !insideBox(this.options.target, point)) return false;
    this.pointer = pointer;
    this.state = canAim ? { phase: "pending", point } : null;
    this.options.preview(this.state);
    this.options.busy(true);
    return true;
  }

  ready() {
    if (this.state?.phase !== "pending") return;
    this.state = { ...this.state, phase: "aiming" };
    this.options.preview(this.state);
  }

  move(pointer: number, point: TargetPoint) {
    if (this.pointer !== pointer || !this.state || this.state.phase === "canceled") return;
    this.state = {
      phase: insideBox(this.options.target, point) ? this.state.phase : "canceled", point,
    };
    this.options.preview(this.state);
  }

  release(pointer: number, point: TargetPoint) {
    if (this.pointer !== pointer) return false;
    this.move(pointer, point);
    const state = this.state;
    this.abort();
    if (state?.phase === "aiming") this.options.commit(state.point);
    return state === null || state.phase === "pending";
  }

  abort() {
    this.pointer = null;
    this.state = null;
    this.options.preview(null);
    this.options.busy(false);
  }
}
