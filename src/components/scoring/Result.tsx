import { calculateScore } from "@/lib/score";

export interface ResultProps {
  targetScores: number[];
  userScores: number[][];
  arrowCount: number;
  endCount: number;
  minimumPassedScore?: number;
}

export function Result({
  minimumPassedScore = 50,
  ...practice
}: ResultProps) {
  const { maxScore, totalScore, percentage, isPassed } = calculateScore(
    practice,
    minimumPassedScore,
  );
  const progress = Math.min(100, Math.max(0, percentage));
  const scoreSize = String(totalScore).length > 6
    ? "text-xl sm:text-3xl"
    : "text-5xl sm:text-6xl";

  return (
    <div className="space-y-4">
      <div
        className="relative isolate overflow-hidden rounded-2xl bg-primary px-4 py-5
          text-on-primary sm:px-6"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-14 -bottom-25 -z-10 size-64 rounded-full
            bg-[repeating-radial-gradient(transparent_0_18px,currentColor_19px_20px)] opacity-20"
        />
        <p className="text-sm font-semibold">Skor total</p>
        <p className="mt-1 flex flex-wrap items-baseline gap-x-2 tabular-nums">
          <strong className={`max-w-full wrap-anywhere leading-none font-bold tracking-tight ${scoreSize}`}>
            {totalScore}
          </strong>
          <span className="max-w-full wrap-anywhere text-xl font-medium">/ {maxScore}</span>
        </p>
      </div>

      <div>
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-sm text-ink-muted">
            <strong className="text-base font-bold text-ink tabular-nums">{percentage.toFixed(1)}%</strong>
            {" dari skor maksimal"}
          </p>
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
            isPassed ? "bg-primary-soft text-primary" : "bg-surface-muted text-ink"
          }`}>
            {isPassed ? "Lulus" : "Coba lagi"}
          </span>
        </div>
        <div aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-surface-muted">
          <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-2 text-xs text-ink-muted">Batas lulus {minimumPassedScore}%</p>
      </div>
    </div>
  );
}
