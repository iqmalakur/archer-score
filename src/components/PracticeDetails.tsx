"use client";

import { useRef } from "react";
import type { Practice } from "@/lib/db";
import { HistoryTargetArrows } from "@/components/history/HistoryTargetArrows";
import { Result } from "@/components/scoring/Result";
import { TargetBoard } from "@/components/scoring/TargetBoard";

export function PracticeEnds({ practice }: { practice: Practice }) {
  const surface = useRef<HTMLElement>(null);
  const maxEndScore = Math.max(0, ...practice.targetScores) * practice.arrowCount;

  return (
    <section ref={surface} aria-labelledby="ends-heading" className="flex flex-col gap-3 sm:gap-4">
      <h2 id="ends-heading" className="text-xl font-bold tracking-tight text-ink">Rincian Rambahan</h2>
      {practice.schemaVersion !== 2 && (
        <p className="rounded-xl bg-surface-muted p-3 text-sm text-ink-muted">
          Panah yang tidak diisi dianggap meleset dan bernilai 0.
        </p>
      )}
      {practice.userScores.map((scores, endIndex) => (
        <article key={endIndex} className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
          <header className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="font-semibold text-ink">Rambahan {endIndex + 1}</h3>
            <div className="min-w-0 wrap-anywhere">
              <span className="sr-only">Skor rambahan </span>
              <span className="text-sm font-bold text-primary tabular-nums">
                {scores.reduce((sum, score) => sum + score, 0)} / {maxEndScore}
              </span>
            </div>
          </header>
          {practice.targetSnapshot && practice.ends && (
            <div
              className="mx-auto mt-4 max-w-lg" data-history-end={endIndex}
              aria-label={`Posisi panah rambahan ${endIndex + 1}`}
            >
              <TargetBoard target={practice.targetSnapshot} entries={practice.ends[endIndex]} />
            </div>
          )}
          <ol role="list" className="mt-4 grid grid-cols-4 gap-1.5 min-[420px]:grid-cols-6 sm:gap-2">
            {scores.map((score, arrowIndex) => (
              <li
                key={arrowIndex}
                className="flex flex-col items-center gap-1 rounded-xl bg-surface-muted px-1 py-2"
              >
                <span className="text-center text-xs text-ink-muted">Panah {arrowIndex + 1}</span>
                <span className="max-w-full wrap-anywhere text-center text-sm
                  font-bold text-ink tabular-nums sm:text-base"
                >
                  {practice.ends?.[endIndex]?.[arrowIndex]?.status === "miss" ? "Miss" : score}
                </span>
              </li>
            ))}
          </ol>
        </article>
      ))}
      {practice.targetSnapshot && practice.ends && (
        <HistoryTargetArrows surface={surface} target={practice.targetSnapshot} ends={practice.ends} />
      )}
    </section>
  );
}

export function PracticeInfo({ practice }: { practice: Practice }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
      <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-ink-muted">Jarak</dt>
          <dd className="mt-1 font-semibold text-ink">
            {practice.distance === undefined ? "Tidak tercatat" : `${practice.distance} m`}
          </dd>
        </div>
        <div>
          <dt className="text-ink-muted">Rambahan</dt>
          <dd className="mt-1 font-semibold text-ink">{practice.endCount}</dd>
        </div>
        <div>
          <dt className="text-ink-muted">Panah per rambahan</dt>
          <dd className="mt-1 font-semibold text-ink">{practice.arrowCount}</dd>
        </div>
        <div>
          <dt className="text-ink-muted">Total panah</dt>
          <dd className="mt-1 font-semibold text-ink">{practice.endCount * practice.arrowCount}</dd>
        </div>
        <div className="col-span-full border-t border-line pt-3">
          <dt className="text-ink-muted">Pilihan skor target</dt>
          <dd className="mt-1 font-semibold text-ink">{practice.targetScores.join(", ") || "Tidak tercatat"}</dd>
        </div>
      </dl>
    </div>
  );
}

export function PracticeResult({
  practice,
  heading: Heading,
}: {
  practice: Practice;
  heading: "h1" | "h2";
}) {
  return (
    <section
      aria-labelledby="result-heading"
      className="rounded-2xl border border-line bg-surface p-4 sm:p-5"
    >
      <Heading id="result-heading" className="mb-4 text-xl font-bold tracking-tight text-ink sm:text-2xl">
        Hasil Latihan
      </Heading>
      <Result
        endCount={practice.endCount}
        arrowCount={practice.arrowCount}
        targetScores={practice.targetScores}
        userScores={practice.userScores}
      />
    </section>
  );
}
