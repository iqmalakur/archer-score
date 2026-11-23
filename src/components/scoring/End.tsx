"use client";

import { useRef, useState } from "react";
import type { TargetConfig, TargetPoint } from "@/types/target";
import type { ArrowEntry } from "@/types/target-session";
import { classifyPoint } from "@/lib/target-geometry";
import { entryLabel, entryScore } from "@/lib/target-session";
import { TargetBoard } from "./TargetBoard";
import { AimOverlay } from "./AimOverlay";
import { ArrowDock } from "./ArrowDock";
import { useTargetInteraction } from "./useTargetInteraction";
import { TargetArrowLayer } from "./TargetArrowLayer";

export interface EndProps {
  target: TargetConfig;
  entries: ArrowEntry[];
  disabled: boolean;
  onChange: (entries: ArrowEntry[]) => void;
  onBusyChange: (busy: boolean) => void;
  onReset: (afterReset: () => void) => void;
}

export function End({ target, entries, disabled, onChange, onBusyChange, onReset }: EndProps) {
  const box = useRef<HTMLDivElement>(null);
  const surface = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState(() => Math.max(0, entries.findIndex((entry) => entry.status === "empty")));
  const [announcement, setAnnouncement] = useState("");
  const active = entries[selected];
  const commit = (point: TargetPoint) => {
    if (disabled || active?.status !== "empty") return;
    const placement = classifyPoint(target, point);
    if (!placement) return;
    const next = entries.map((entry, index) => index === selected ? { ...placement, id: entry.id } : entry);
    onChange(next);
    const nextEmpty = next.findIndex((entry) => entry.status === "empty");
    setSelected(nextEmpty >= 0 ? nextEmpty : selected);
    setAnnouncement(`Panah ${selected + 1}, ${entryLabel(next[selected])}.`);
  };
  const aim = useTargetInteraction({
    box, target, disabled, canAim: active?.status === "empty", onCommit: commit, onBusyChange,
  });
  const preview = aim && aim.phase !== "canceled" ? classifyPoint(target, aim.point) : null;
  const busy = disabled || Boolean(aim);
  const recorded = entries.filter((entry) => entry.status !== "empty").length;
  const removeSelected = () => {
    onChange(entries.map((entry, index) => index === selected ? { id: entry.id, status: "empty" } : entry));
    setAnnouncement(`Panah ${selected + 1} dikembalikan ke bawah.`);
    box.current?.focus({ preventScroll: true });
  };

  return (
    <div className="target-end">
      <div className="end-summary">
        <div>
          <span>Panah terpilih</span>
          <strong>{selected + 1}/{entries.length}</strong>
        </div>
        <div>
          <span>Subtotal</span>
          <strong data-testid="end-subtotal">
            {entries.reduce((sum, entry) => sum + entryScore(entry), 0)}
          </strong>
        </div>
      </div>
      <div className="scoring-surface" ref={surface}>
        <div
          className={`target-input${aim?.phase === "canceled" ? " aim-canceled" : ""}`}
          ref={box} tabIndex={disabled ? -1 : 0} role="group"
          aria-label="Papan scoring" aria-describedby="board-keyboard-help"
          data-testid="scoring-box" data-aim-state={aim?.phase ?? "ready"}
          onContextMenu={(event) => event.preventDefault()}
        >
          <TargetBoard target={target} entries={entries}>
            <AimOverlay aim={aim} target={target} entries={entries} box={box} />
          </TargetBoard>
        </div>
        <ArrowDock
          entries={entries} selected={selected} disabled={busy}
          onSelect={setSelected} onRemove={removeSelected}
        />
        <TargetArrowLayer
          surface={surface} box={box} target={target} entries={entries}
          selected={active?.id} aimPoint={aim?.phase === "aiming" ? aim.point : undefined}
        />
      </div>

      <div className="end-tools">
        <p className={`aim-status${aim?.phase === "canceled" ? " is-canceled" : ""}`}>
          {aim?.phase === "canceled"
            ? <span role="alert">Bidikan dibatalkan — lepaskan untuk mencoba lagi.</span>
            : preview ? <span>{preview.status === "hit" ? `Skor ${preview.score}` : "Miss · di luar target"}</span>
              : <span>{active?.status === "empty"
                ? "Ketuk papan untuk mencatat. Tahan untuk melihat detail."
                : "Pilih panah yang tersedia atau cabut panah terpilih."}</span>}
        </p>
        <button
          type="button" disabled={busy || recorded === 0}
          onClick={() => onReset(() => {
            setSelected(0);
            setAnnouncement("Rambahan direset. Semua panah dikembalikan ke bawah.");
            requestAnimationFrame(() => box.current?.focus({ preventScroll: true }));
          })}
        >Reset rambahan</button>
      </div>
      <p id="board-keyboard-help" className="sr-only">
        Gunakan tombol panah untuk memilih posisi. Tekan Enter untuk mencatat.
      </p>
      <p className="sr-only" role="status" aria-live="polite">{announcement}</p>
    </div>
  );
}
