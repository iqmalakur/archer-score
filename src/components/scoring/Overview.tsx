export interface OverviewProps {
  endCount: number;
  arrowCount: number;
  targetScores: number[];
}

export const Overview = ({
  endCount,
  arrowCount,
  targetScores,
}: OverviewProps) => {
  const totalPossibleScore = Math.max(...targetScores) * endCount * arrowCount;

  const stats = [
    { label: "Jumlah Rambahan", value: endCount },
    { label: "Panah Per Rambahan", value: arrowCount },
    { label: "Poin Skor", value: targetScores.join(", ") },
    { label: "Skor Tertinggi", value: totalPossibleScore },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex flex-col gap-1 rounded-xl border border-line bg-surface-muted/50 p-4"
        >
          <span className="text-xs font-medium uppercase tracking-wide text-ink-muted">
            {stat.label}
          </span>
          <span className="text-2xl font-bold text-ink">{stat.value}</span>
        </div>
      ))}
    </div>
  );
};