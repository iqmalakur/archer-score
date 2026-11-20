"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import type { TargetConfig, TargetPoint } from "@/types/target";
import { pointFromClient } from "@/lib/target-geometry";
import { TargetGesture, type AimState } from "@/lib/target-interaction";

interface InteractionOptions {
  box: RefObject<HTMLDivElement | null>;
  target: TargetConfig;
  canAim: boolean;
  disabled: boolean;
  onCommit: (point: TargetPoint) => void;
  onBusyChange: (busy: boolean) => void;
}

function bindInteraction(element: HTMLDivElement, options: InteractionOptions, preview: (aim: AimState) => void) {
  const gesture = new TargetGesture({
    target: options.target, preview, commit: options.onCommit, busy: options.onBusyChange,
  });
  let timer: ReturnType<typeof setTimeout> | undefined;
  let frame = 0;
  let lastPoint: TargetPoint = { x: 0, y: 0 };
  let keyboard = false;
  const point = (event: PointerEvent) => pointFromClient(
    options.target, element.getBoundingClientRect(), event.clientX, event.clientY,
  );
  const flush = () => { cancelAnimationFrame(frame); clearTimeout(timer); };
  const abort = () => { flush(); keyboard = false; gesture.abort(); };

  const down = (event: PointerEvent) => {
    if (options.disabled || gesture.pointer !== null || !event.isPrimary || event.button !== 0) return;
    flush();
    if (!gesture.begin(event.pointerId, point(event), options.canAim)) return;
    element.setPointerCapture(event.pointerId);
    timer = setTimeout(() => gesture.ready(), 180);
  };
  const move = (event: PointerEvent) => {
    if (gesture.pointer !== event.pointerId) return;
    lastPoint = point(event);
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => gesture.move(event.pointerId, lastPoint));
  };
  const up = (event: PointerEvent) => {
    if (gesture.pointer !== event.pointerId) return;
    flush();
    const tapped = gesture.release(event.pointerId, point(event));
    if (element.hasPointerCapture(event.pointerId)) element.releasePointerCapture(event.pointerId);
    if (tapped && !options.disabled && options.canAim) {
      options.onCommit(point(event));
    }
  };
  const lost = (event: PointerEvent) => { if (gesture.pointer === event.pointerId) abort(); };
  const hidden = () => { if (document.hidden) abort(); };
  const key = (event: KeyboardEvent) => {
    if (options.disabled || gesture.pointer !== null) return;
    if (event.key === "Escape" || event.key === "Tab") { abort(); return; }
    if (!options.canAim) return;
    if (event.key === "Enter") {
      event.preventDefault();
      const destination = keyboard ? lastPoint : { x: 0, y: 0 };
      abort();
      options.onCommit(destination);
      return;
    }
    const directions: Record<string, [number, number]> = {
      ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1],
    };
    if (!directions[event.key]) return;
    event.preventDefault();
    if (!keyboard) lastPoint = { x: 0, y: 0 };
    keyboard = true;
    const [x, y] = directions[event.key];
    const step = event.shiftKey ? 0.01 : 0.04;
    lastPoint = {
      x: Math.max(-options.target.box.halfWidth, Math.min(options.target.box.halfWidth, lastPoint.x + x * step)),
      y: Math.max(-options.target.box.halfHeight, Math.min(options.target.box.halfHeight, lastPoint.y + y * step)),
    };
    preview({ phase: "aiming", point: lastPoint });
    options.onBusyChange(true);
  };
  const initial = element.getBoundingClientRect();
  const observer = new ResizeObserver(() => {
    const rect = element.getBoundingClientRect();
    if (rect.width !== initial.width || rect.height !== initial.height) abort();
  });
  observer.observe(element);
  element.addEventListener("pointerdown", down);
  element.addEventListener("pointermove", move);
  element.addEventListener("pointerup", up);
  element.addEventListener("pointercancel", abort);
  element.addEventListener("lostpointercapture", lost);
  element.addEventListener("keydown", key);
  element.addEventListener("blur", abort);
  document.addEventListener("visibilitychange", hidden);
  window.addEventListener("blur", abort);
  window.addEventListener("orientationchange", abort);

  return () => {
    observer.disconnect();
    element.removeEventListener("pointerdown", down);
    element.removeEventListener("pointermove", move);
    element.removeEventListener("pointerup", up);
    element.removeEventListener("pointercancel", abort);
    element.removeEventListener("lostpointercapture", lost);
    element.removeEventListener("keydown", key);
    element.removeEventListener("blur", abort);
    document.removeEventListener("visibilitychange", hidden);
    window.removeEventListener("blur", abort);
    window.removeEventListener("orientationchange", abort);
    abort();
  };
}

export function useTargetInteraction(options: InteractionOptions) {
  const [aim, setAim] = useState<AimState>(null);
  const current = useRef(options);
  useEffect(() => { current.current = options; });
  const { box, target, disabled } = options;

  useEffect(() => {
    if (!box.current) return;
    return bindInteraction(box.current, {
      box, target, disabled,
      get canAim() { return current.current.canAim; },
      onCommit: (point) => current.current.onCommit(point),
      onBusyChange: (busy) => current.current.onBusyChange(busy),
    }, setAim);
  }, [box, target, disabled]);

  return aim;
}
