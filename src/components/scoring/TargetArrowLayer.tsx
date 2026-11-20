"use client";

import { useEffect, useRef, type RefObject } from "react";
import type { TargetConfig, TargetPoint } from "@/types/target";
import type { ArrowEntry } from "@/types/target-session";
import type { TargetArrowScene } from "./target-arrow-scene";

interface TargetArrowLayerProps {
  surface: RefObject<HTMLDivElement | null>;
  box: RefObject<HTMLDivElement | null>;
  target: TargetConfig;
  entries: ArrowEntry[];
  selected?: string;
  aimPoint?: TargetPoint;
}

export function TargetArrowLayer({ surface, box, target, entries, selected, aimPoint }: TargetArrowLayerProps) {
  const scene = useRef<TargetArrowScene | null>(null);
  const latest = useRef({ entries, selected, aimPoint });
  useEffect(() => {
    latest.current = { entries, selected, aimPoint };
    scene.current?.update(entries, selected, aimPoint);
  }, [entries, selected, aimPoint]);

  useEffect(() => {
    let disposed = false;
    const root = surface.current;
    const available = (ready: boolean) => {
      root?.classList.toggle("arrows-ready", ready);
      if (root) root.dataset.arrowRenderer = ready ? "ready" : "unavailable";
    };
    import("./target-arrow-scene").then(({ TargetArrowScene }) => {
      if (disposed || !root || !box.current) return;
      scene.current = new TargetArrowScene(root, box.current, target, available);
      const current = latest.current;
      scene.current.update(current.entries, current.selected, current.aimPoint);
    }).catch(() => available(false));

    return () => {
      disposed = true;
      scene.current?.dispose();
      scene.current = null;
    };
  }, [surface, box, target]);

  return null;
}
