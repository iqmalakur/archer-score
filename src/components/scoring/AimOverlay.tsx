"use client";

import { useLayoutEffect, useRef, type RefObject } from "react";
import type { TargetConfig } from "@/types/target";
import type { ArrowEntry } from "@/types/target-session";
import type { AimState } from "@/lib/target-interaction";
import { pointPercent } from "@/lib/target-geometry";
import { TargetBoard } from "./TargetBoard";

interface AimOverlayProps {
  aim: AimState;
  target: TargetConfig;
  entries: ArrowEntry[];
  box: RefObject<HTMLDivElement | null>;
}

export function AimOverlay({ aim, target, entries, box }: AimOverlayProps) {
  const loupe = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!aim || aim.phase === "canceled" || !box.current || !loupe.current || !content.current) return;
    const rect = box.current.getBoundingClientRect();
    const x = (aim.point.x / target.box.halfWidth + 1) * rect.width / 2;
    const y = (aim.point.y / target.box.halfHeight + 1) * rect.height / 2;
    const diameter = 128;
    const lensCenter = loupe.current.clientWidth / 2;
    const contactY = rect.top + y;
    const above = contactY - diameter - 48;
    const top = above >= 8 ? above : contactY + 64;
    const left = Math.max(8, Math.min(window.innerWidth - diameter - 8, rect.left + x - diameter / 2));
    loupe.current.style.left = `${left}px`;
    loupe.current.style.top = `${Math.max(8, Math.min(window.innerHeight - diameter - 8, top))}px`;
    content.current.style.width = `${rect.width * 2.5}px`;
    content.current.style.left = `${lensCenter - x * 2.5}px`;
    content.current.style.top = `${lensCenter - y * 2.5}px`;
  }, [aim, target, box]);

  if (!aim || aim.phase === "canceled") return null;

  return (
    <>
      <span className="aim-reticle" data-testid="aim-reticle" style={pointPercent(target, aim.point)} />
      <div ref={loupe} className="aim-loupe" data-testid="aim-magnifier" aria-hidden="true">
        <div ref={content} className="aim-loupe-content">
          <TargetBoard target={target} entries={entries} />
        </div>
        <span className="aim-reticle" />
      </div>
    </>
  );
}
