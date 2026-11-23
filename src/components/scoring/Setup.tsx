"use client";

import { useState } from "react";
import Link from "next/link";
import type { SetupDraft } from "@/types/target-session";
import type { TargetConfig } from "@/types/target";
import { getPracticeTitle } from "@/lib/practice-title";
import { isValidDistance } from "@/lib/practice-validation";
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
      <fieldset className="setup-layout" disabled={disabled}>
        <section className="setup-target-summary" aria-label="Target aktif">
          <div className="setup-target">
            <div className="setup-target-thumbnail" aria-hidden="true">
              <TargetBoard target={target} />
            </div>
            <div>
              <h2>{target.name}</h2>
              <p>{target.rings.length} ring · Maks. {highest.toLocaleString("id-ID")} per panah</p>
              <Link href="/setting">Ubah target <span aria-hidden="true">→</span></Link>
            </div>
          </div>
          <div className="setup-maximum">
            <div>
              <h3>Skor maksimal</h3>
              <p>
                {isValidDistance(setup.distance) && `${setup.distance} m · `}
                {setup.endCount} rambahan × {setup.arrowCount} panah
              </p>
            </div>
            <strong>{(highest * setup.arrowCount * setup.endCount).toLocaleString("id-ID")}</strong>
          </div>
          <button className="scoring-primary scoring-start" type="submit">
            Mulai latihan <span aria-hidden="true">→</span>
          </button>
        </section>

        <div className="setup-fields">
          <div>
            <label className="scoring-field">
              Jarak (meter)
              <input
                type="number" inputMode="numeric" min={1} max={150} step={1} required
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
            <div className="target-presets distance-presets" role="group" aria-label="Pilihan jarak">
              {[4, 6, 8, 10, 12, 14, 16, 18, 20].map((distance) => (
                <button
                  key={distance} type="button" aria-pressed={setup.distance === distance}
                  onClick={() => { onEdit({ ...setup, distance }); setDistanceError(false); }}
                >{distance} m</button>
              ))}
            </div>
          </div>

          <div className="setup-counts">
            {([
              { key: "endCount", label: "rambahan", heading: "Rambahan", max: 20 },
              { key: "arrowCount", label: "panah", heading: "Panah per rambahan", max: 12 },
            ] as const).map(({ key, label, heading, max }) => (
              <div key={key} className="setup-count" role="group" aria-label={heading}>
                <span>{heading}</span>
                <div className="setup-stepper">
                  <button
                    type="button" aria-label={`Kurangi ${label}`} disabled={setup[key] <= 1}
                    onClick={() => onEdit({ ...setup, [key]: setup[key] - 1 })}
                  >−</button>
                  <output aria-label={heading}>{setup[key]}</output>
                  <button
                    type="button" aria-label={`Tambah ${label}`} disabled={setup[key] >= max}
                    onClick={() => onEdit({ ...setup, [key]: setup[key] + 1 })}
                  >+</button>
                </div>
              </div>
            ))}
          </div>

          <label className="scoring-field">
            Nama sesi (opsional)
            <input
              value={setup.title}
              placeholder={getPracticeTitle({ distance: setup.distance, createdAt: date })}
              onChange={(event) => onEdit({ ...setup, title: event.target.value })}
            />
          </label>
        </div>
      </fieldset>
    </form>
  );
}
