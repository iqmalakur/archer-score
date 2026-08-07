"use client";

import { useState } from "react";

export interface SettingProps {
  initialEndCount: number;
  initialArrowCount: number;
  initialTargetScores: number[];
  onChange: (endCount: number, arrowCount: number, targetScores: number[]) => void;
}

export const Setting = ({ initialEndCount, initialArrowCount, initialTargetScores, onChange }: SettingProps) => {
  const [endCount, setEndCount] = useState(initialEndCount);
  const [arrowCount, setArrowCount] = useState(initialArrowCount);
  const [targetScores, setTargetScores] = useState(initialTargetScores);

  const handleApplyChanges = () => {
    onChange(endCount, arrowCount, targetScores);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="relative">
        <label htmlFor="endCount" className="mb-1.5 block text-sm font-medium text-ink-muted">
          Jumlah Rambahan
        </label>
        <input
          id="endCount"
          type="number"
          min={1}
          value={endCount}
          onChange={(e) => setEndCount(Number(e.target.value))}
          className="min-h-14 w-full rounded-xl border border-line bg-surface px-4 py-3 text-base text-ink shadow-sm outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/25"
        />
      </div>

      <div className="relative">
        <label htmlFor="arrowCount" className="mb-1.5 block text-sm font-medium text-ink-muted">
          Jumlah Panah per Rambahan
        </label>
        <input
          id="arrowCount"
          type="number"
          min={1}
          value={arrowCount}
          onChange={(e) => setArrowCount(Number(e.target.value))}
          className="min-h-14 w-full rounded-xl border border-line bg-surface px-4 py-3 text-base text-ink shadow-sm outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/25"
        />
      </div>

      <div className="relative">
        <label htmlFor="targetScores" className="mb-1.5 block text-sm font-medium text-ink-muted">
          Skor Target (pisahkan dengan koma)
        </label>
        <input
          id="targetScores"
          type="text"
          value={targetScores.join(", ")}
          onChange={(e) => setTargetScores(e.target.value.split(",").map((s) => Number(s.trim())))}
          className="min-h-14 w-full rounded-xl border border-line bg-surface px-4 py-3 text-base text-ink shadow-sm outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/25"
        />
      </div>

      <button
        onClick={handleApplyChanges}
        className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-primary to-primary-dark py-4 text-base font-semibold text-white shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary/40"
      >
        <span aria-hidden className="text-white">
          ✓
        </span>
        Terapkan Perubahan
      </button>
    </div>
  );
};