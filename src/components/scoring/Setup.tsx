"use client";

import { useState } from "react";
import Link from "next/link";
import type { SetupDraft } from "@/types/target-session";
import type { TargetConfig } from "@/types/target";
import { getPracticeTitle } from "@/lib/practice-title";
import { isValidSetupDraft } from "@/lib/target-session";
import { TargetBoard } from "./TargetBoard";

export interface SetupProps {
  setup: SetupDraft;
  target: TargetConfig;
  disabled: boolean;
  onEdit: (setup: SetupDraft) => void;
  onStart: () => void;
}

export function Setup({ setup, target, disabled, onEdit, onStart }: SetupProps) {
  const [distanceError, setDistanceError] = useState(false);
  const [date] = useState(() => new Date());
  const highest = Math.max(...target.rings.map((ring) => ring.score));

  return (
    <form
      className="scoring-setup"
      onSubmit={(event) => {
        event.preventDefault();
        if (isValidSetupDraft(setup)) onStart();
      }}
    >
      <fieldset disabled={disabled}>
        <label className="scoring-field">
          Nama Sesi / Catatan
          <input
            value={setup.title}
            placeholder={getPracticeTitle({ distance: setup.distance, createdAt: date })}
            onChange={(event) => onEdit({ ...setup, title: event.target.value })}
          />
        </label>

        <label className="scoring-field">
          Jarak (Meter)
          <input
            type="number" min={1} max={150} step={1} required
            aria-invalid={distanceError}
            aria-describedby={distanceError ? "distance-error" : undefined}
            value={Number.isFinite(setup.distance) ? setup.distance : ""}
            onInvalid={() => setDistanceError(true)}
            onChange={(event) => {
              onEdit({ ...setup, distance: event.target.valueAsNumber });
              setDistanceError(false);
            }}
          />
        </label>
        {distanceError && (
          <p id="distance-error" role="alert" className="scoring-error">
            Masukkan jarak berupa bilangan bulat antara 1 dan 150 meter.
          </p>
        )}
        <div className="target-presets" aria-label="Preset jarak">
          {[4, 6, 8, 10, 12, 14, 16, 18, 20].map((distance) => (
            <button
              key={distance} type="button" aria-pressed={setup.distance === distance}
              onClick={() => { onEdit({ ...setup, distance }); setDistanceError(false); }}
            >{distance}m</button>
          ))}
        </div>

        <div className="setup-counts">
          {([
            { key: "endCount", label: "rambahan", max: 20 },
            { key: "arrowCount", label: "panah", max: 12 },
          ] as const).map(({ key, label, max }) => (
            <div key={key} className="setup-count">
              <span>{key === "arrowCount" ? "Panah per rambahan" : "Rambahan"}</span>
              <div>
                <button
                  type="button" aria-label={`Kurangi ${label}`} disabled={setup[key] <= 1}
                  onClick={() => onEdit({ ...setup, [key]: setup[key] - 1 })}
                >−</button>
                <strong>{setup[key]}</strong>
                <button
                  type="button" aria-label={`Tambah ${label}`} disabled={setup[key] >= max}
                  onClick={() => onEdit({ ...setup, [key]: setup[key] + 1 })}
                >+</button>
              </div>
            </div>
          ))}
        </div>

        <section className="setup-target-summary" aria-label="Target aktif">
          <div className="setup-target-thumbnail"><TargetBoard target={target} /></div>
          <div>
            <strong>{target.name}</strong>
            <p>{target.rings.length} ring · Skor maksimal {highest}</p>
            <Link href="/setting">Ubah target di Setting →</Link>
          </div>
        </section>
        <div className="setup-maximum">
          <span>SKOR MAKSIMAL</span>
          <strong>{highest * setup.arrowCount * setup.endCount}</strong>
          <p>{setup.endCount} rambahan × {setup.arrowCount} panah × {highest}</p>
        </div>
        <button className="scoring-primary scoring-start" type="submit">Mulai Scoring →</button>
      </fieldset>
    </form>
  );
}
