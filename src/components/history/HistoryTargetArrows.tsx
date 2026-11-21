"use client";

import { useEffect, type RefObject } from "react";
import type { TargetConfig } from "@/types/target";
import type { ArrowEntry } from "@/types/target-session";
import type { HistoryArrowScene } from "./history-arrow-scene";

interface HistoryTargetArrowsProps {
  surface: RefObject<HTMLElement | null>;
  target: TargetConfig;
  ends: ArrowEntry[][];
}

export function HistoryTargetArrows({ surface, target, ends }: HistoryTargetArrowsProps) {
  useEffect(() => {
    let disposed = false;
    let scene: HistoryArrowScene | undefined;
    const root = surface.current;
    const available = (ready: boolean) => {
      root?.classList.toggle("arrows-ready", ready);
      if (root) root.dataset.arrowRenderer = ready ? "ready" : "unavailable";
    };
    import("./history-arrow-scene").then(({ HistoryArrowScene }) => {
      if (disposed || !root) return;
      scene = new HistoryArrowScene(root, target, ends, available);
    }).catch(() => available(false));

    return () => {
      disposed = true;
      scene?.dispose();
    };
  }, [surface, target, ends]);

  return null;
}
