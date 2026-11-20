import type { ReactNode } from "react";
import type { TargetConfig } from "@/types/target";
import type { ArrowEntry } from "@/types/target-session";
import { entryLabel } from "@/lib/target-session";
import { pointPercent } from "@/lib/target-geometry";
import "./target-scoring.css";
import "./target-board.css";

interface TargetBoardProps {
  target: TargetConfig;
  entries?: ArrowEntry[];
  children?: ReactNode;
}

export function TargetBoard({ target, entries = [], children }: TargetBoardProps) {
  return (
    <div
      className="target-board"
      data-testid="target-board"
      style={{ aspectRatio: `${target.box.halfWidth} / ${target.box.halfHeight}` }}
    >
      <div
        className="target-circles"
        aria-hidden="true"
        style={{ width: `${100 / target.box.halfWidth}%` }}
      >
        {[...target.rings].reverse().map((ring, reverseIndex) => {
          const index = target.rings.length - 1 - reverseIndex;
          const diameter = (index + 1) / target.rings.length * 100;
          return (
            <div
              className="target-ring"
              key={ring.id}
              data-ring-id={ring.id}
              style={{
                width: `${diameter}%`, height: `${diameter}%`,
                backgroundColor: ring.color,
              }}
            />
          );
        })}
        {target.rings.map((ring, index) => (
          <span
            key={ring.id}
            className="target-ring-score"
            style={{ top: `${50 - (index + 0.5) / target.rings.length * 50}%` }}
          >{Number.isSafeInteger(ring.score) ? ring.score : "—"}</span>
        ))}
        <span className="target-center" />
      </div>

      {entries.map((entry, index) => (entry.status === "hit" || entry.status === "miss") && (
        <span
          key={entry.id}
          className="target-marker"
          style={pointPercent(target, entry)}
          data-arrow-id={entry.id}
          aria-label={`Panah ${index + 1}, ${entryLabel(entry)}`}
        />
      ))}
      {children}
    </div>
  );
}
