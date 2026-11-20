import { useEffect, useRef } from "react";
import type { ArrowEntry } from "@/types/target-session";
import { entryLabel } from "@/lib/target-session";

interface ArrowDockProps {
  entries: ArrowEntry[];
  selected: number;
  disabled: boolean;
  onSelect: (index: number) => void;
}

export function ArrowDock({ entries, selected, disabled, onSelect }: ArrowDockProps) {
  const placed = entries.flatMap((entry, index) => entry.status === "hit" || entry.status === "miss" ? [index] : []);
  const position = placed.indexOf(selected);
  const scroll = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const viewport = scroll.current;
    const slot = viewport?.children[selected];
    if (!viewport || !slot) return;
    const bounds = viewport.getBoundingClientRect();
    const rect = slot.getBoundingClientRect();
    if (rect.left < bounds.left) viewport.scrollLeft += rect.left - bounds.left - 3;
    else if (rect.right > bounds.right) viewport.scrollLeft += rect.right - bounds.right + 3;
  }, [selected]);

  return (
    <section className="arrow-dock" data-testid="arrow-dock" aria-label="Panahmu">
      <div className="arrow-dock-label">
        <span>PANAHMU</span>
        <span>{entries.filter((entry) => entry.status === "empty").length} tersedia</span>
        <div className="arrow-dock-navigation">
          <button
            type="button" aria-label="Pilih panah sebelumnya"
            disabled={disabled || position <= 0}
            onClick={() => onSelect(placed[position - 1])}
          >←</button>
          <button
            type="button" aria-label="Pilih panah berikutnya"
            disabled={disabled || position < 0 || position >= placed.length - 1}
            onClick={() => onSelect(placed[position + 1])}
          >→</button>
        </div>
      </div>
      <div ref={scroll} className="arrow-dock-scroll" role="group" aria-label="Pilihan panah">
        {entries.map((entry, index) => (
          <button
            key={entry.id} type="button"
            className={`arrow-slot${entry.status === "empty" ? " is-available" : ""}`}
            data-slot-id={entry.id}
            aria-label={`Panah ${index + 1}, ${entryLabel(entry)}`}
            aria-pressed={selected === index}
            disabled={disabled}
            onClick={() => onSelect(index)}
          >
            {entry.status === "empty"
              ? <span className="dock-arrow-fallback" aria-hidden="true">↑</span>
              : <span className="dock-used-score">{entry.status === "miss" ? "M" : entry.score}</span>}
            <span className="arrow-slot-caption">
              <b>{index + 1}</b>
              <span>{entry.status === "empty" ? "Siap" : entry.status === "miss" ? "Miss" : "Tercatat"}</span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
