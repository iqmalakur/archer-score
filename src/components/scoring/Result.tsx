export interface ResultProps {
  targetScores: number[];
  userScores: number[][];
  arrowCount: number;
  endCount: number;
  minimumPassedScore?: number;
}

export const Result = ({ userScores, targetScores, arrowCount, endCount, minimumPassedScore = 50 }: ResultProps) => {
  const totalPossibleScore = Math.max(...targetScores) * arrowCount * endCount;
  const totalUserScore = userScores.flat().reduce((acc, score) => acc + score, 0);
  const percentage = (totalUserScore / totalPossibleScore) * 100;
  const isPassed = percentage > minimumPassedScore;

  const clamped = Math.min(100, Math.max(0, percentage));
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);
  const ringColor =
    clamped < 40
      ? "stroke-red-500"
      : clamped < 80
        ? "stroke-amber-500 dark:stroke-amber-400"
        : "stroke-emerald-500 dark:stroke-emerald-400";

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative h-44 w-44">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            strokeWidth="10"
            className="stroke-line/40"
          />
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            strokeWidth="10"
            strokeLinecap="round"
            className={ringColor}
            strokeDasharray={circumference}
            style={
              {
                "--ring-full": circumference,
                "--ring-current": offset,
                animation: "progressRing 1s ease-out forwards",
              } as React.CSSProperties
            }
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-3xl font-extrabold ${isPassed ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
            {percentage.toFixed(1)}%
          </span>
          <span className="text-xs font-medium text-ink-muted">dari skor maksimal</span>
        </div>
      </div>

      <div className="grid w-full grid-cols-2 gap-3">
        <div className="flex flex-col gap-1 rounded-xl border border-line bg-surface-muted/50 p-4">
          <span className="text-xs font-medium uppercase tracking-wide text-ink-muted">Skor Total</span>
          <span className="text-2xl font-bold text-ink">{totalUserScore}</span>
        </div>

        <div className="flex flex-col gap-1 rounded-xl border border-line bg-surface-muted/50 p-4">
          <span className="text-xs font-medium uppercase tracking-wide text-ink-muted">Skor Maksimal</span>
          <span className="text-2xl font-bold text-ink-muted">{totalPossibleScore}</span>
        </div>

        <div className="flex flex-col gap-1 rounded-xl border border-line bg-surface-muted/50 p-4">
          <span className="text-xs font-medium uppercase tracking-wide text-ink-muted">Persentase</span>
          <span className={`text-2xl font-bold ${ringColor.replace("stroke-", "text-")}`}>
            {percentage.toFixed(1)}%
          </span>
        </div>

        <div
          className={`flex flex-col gap-1 rounded-xl border p-4 ${
            isPassed
              ? "border-emerald-300 bg-emerald-50/70 dark:border-emerald-500/50 dark:bg-emerald-900/20"
              : "border-red-300 bg-red-50/70 dark:border-red-500/50 dark:bg-red-900/20"
          }`}
        >
          <span className="text-xs font-medium uppercase tracking-wide text-ink-muted">Status</span>
          <span className={`flex items-center gap-1.5 text-2xl font-bold ${isPassed ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
            <span aria-hidden>{isPassed ? "✓" : "✕"}</span>
            {isPassed ? "Lulus" : "Coba lagi"}
          </span>
        </div>
      </div>
    </div>
  );
};