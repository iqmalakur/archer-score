"use client";

import { useRef } from "react";
import type { Practice } from "@/lib/db";
import { calculateScore } from "@/lib/score";
import { getPracticeTitle } from "@/lib/practice-title";
import { HistoryTargetArrows } from "@/components/history/HistoryTargetArrows";
import { Result } from "@/components/scoring/Result";
import { TargetBoard } from "@/components/scoring/TargetBoard";

export function PracticeEnds({ practice }: { practice: Practice }) {
  const surface = useRef<HTMLElement>(null);
  const { totalScore } = calculateScore(practice);
  const maxEndScore = Math.max(0, ...practice.targetScores) * practice.arrowCount;

  return (
    <section ref={surface} aria-labelledby="ends-heading" className="flex flex-col gap-4">
      <h2 id="ends-heading" className="text-lg font-semibold text-ink">Rincian Rambahan</h2>
      {practice.schemaVersion !== 2 && (
        <p className="text-sm text-ink-muted">Panah yang tidak diisi dianggap meleset dan bernilai 0.</p>
      )}
      {practice.userScores.map((scores, endIndex) => (
        <article key={endIndex} className="rounded-2xl border border-line bg-surface/75 p-5 shadow-sm sm:p-6">
          <h3 className="font-semibold text-ink">Rambahan {endIndex + 1}</h3>
          {practice.targetSnapshot && practice.ends && (
            <div
              className="mx-auto my-4 max-w-lg" data-history-end={endIndex}
              aria-label={`Posisi panah rambahan ${endIndex + 1}`}
            >
              <TargetBoard target={practice.targetSnapshot} entries={practice.ends[endIndex]} />
            </div>
          )}
          <ol className="mt-4 flex flex-wrap gap-2">
            {scores.map((score, arrowIndex) => (
              <li
                key={arrowIndex}
                className="flex min-w-16 flex-col items-center gap-1 rounded-xl border border-line
                  bg-surface-muted/60 px-3 py-2"
              >
                <span className="text-xs text-ink-muted">Panah {arrowIndex + 1}</span>
                <span className="text-lg font-bold text-ink">
                  {practice.ends?.[endIndex]?.[arrowIndex]?.status === "miss" ? "Miss" : score}
                </span>
              </li>
            ))}
          </ol>
          <div className="mt-4 flex flex-wrap items-baseline justify-between gap-2 border-t border-line pt-3 text-sm">
            <span className="text-ink-muted">Subtotal / maksimal rambahan</span>
            <span className="font-bold text-primary-dark dark:text-primary">
              {scores.reduce((sum, score) => sum + score, 0)} / {maxEndScore}
            </span>
          </div>
        </article>
      ))}
      {practice.targetSnapshot && practice.ends && (
        <HistoryTargetArrows surface={surface} target={practice.targetSnapshot} ends={practice.ends} />
      )}
      <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface-muted p-4">
        <span className="font-semibold text-ink">Total skor keseluruhan</span>
        <span className="text-xl font-bold text-primary-dark dark:text-primary">{totalScore}</span>
      </div>
    </section>
  );
}

export function PracticeInfo({ practice }: { practice: Practice }) {
  const savedAt = new Date(practice.createdAt);

  return (
    <section className="rounded-2xl border border-line bg-surface/75 p-5 shadow-md sm:p-6">
      <h1 className="wrap-anywhere text-xl font-bold text-ink sm:text-2xl">
        {getPracticeTitle(practice)}
      </h1>
      <p className="mt-2 text-sm text-ink-muted">
        Disimpan pada{" "}
        <time dateTime={savedAt.toISOString()}>
          {savedAt.toLocaleString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </time>
      </p>

      <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-line pt-5 text-sm">
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
          <dt className="text-ink-muted">Total panah yang direncanakan</dt>
          <dd className="mt-1 font-semibold text-ink">{practice.endCount * practice.arrowCount}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-ink-muted">Pilihan skor target</dt>
          <dd className="mt-1 font-semibold text-ink">{practice.targetScores.join(", ") || "Tidak tercatat"}</dd>
        </div>
      </dl>
    </section>
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
      className="rounded-2xl border border-line bg-surface p-5 shadow-md sm:p-6"
    >
      <Heading id="result-heading" className="mb-4 text-center text-lg font-semibold text-ink">Hasil Latihan</Heading>
      <Result
        endCount={practice.endCount}
        arrowCount={practice.arrowCount}
        targetScores={practice.targetScores}
        userScores={practice.userScores}
      />
      <p className="mt-4 text-center text-sm text-ink-muted">Batas lulus: 50%</p>
    </section>
  );
}
