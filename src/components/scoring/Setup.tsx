"use client";

import { useMemo, useRef, useState } from "react";
import { getPracticeTitle } from "@/lib/practice-title";
import { isValidDistance } from "@/lib/practice-validation";

export interface SetupProps {
  initialTitle: string;
  initialDistance: number;
  initialEndCount: number;
  initialArrowCount: number;
  initialTargetScores: number[];
  onChange: (
    endCount: number,
    arrowCount: number,
    targetScores: number[],
    title: string,
    distance: number,
  ) => void;
}

const PRESETS = [
  { id: "1-6", label: "Ring 1 - 6", scores: [1, 2, 3, 4, 5, 6] },
  { id: "1-10", label: "Ring 1 - 10", scores: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
  { id: "6-10", label: "Ring 6 - 10", scores: [6, 7, 8, 9, 10] },
  { id: "5-10", label: "Ring 5 - 10", scores: [5, 6, 7, 8, 9, 10] },
];

const DISTANCE_PRESETS = [4, 6, 8, 10, 12, 14, 16, 18, 20];

const ALL_AVAILABLE_SCORES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export const Setup = ({
  initialTitle,
  initialDistance,
  initialEndCount,
  initialArrowCount,
  initialTargetScores,
  onChange,
}: SetupProps) => {
  const [title, setTitle] = useState(initialTitle);
  const [distance, setDistance] = useState(initialDistance);
  const distanceInput = useRef<HTMLInputElement>(null);
  const [showDistanceError, setShowDistanceError] = useState(false);
  const [sessionDate] = useState(() => new Date());
  const [endCount, setEndCount] = useState(initialEndCount);
  const [arrowCount, setArrowCount] = useState(initialArrowCount);
  const [targetScores, setTargetScores] = useState<number[]>(
    initialTargetScores.length > 0 ? initialTargetScores : [1, 2, 3, 4, 5, 6],
  );

  const maxTargetScore = useMemo(
    () => (targetScores.length > 0 ? Math.max(...targetScores) : 0),
    [targetScores],
  );

  const totalPossibleScore = useMemo(
    () => maxTargetScore * endCount * arrowCount,
    [endCount, arrowCount, maxTargetScore],
  );

  const toggleScore = (score: number) => {
    setTargetScores((prev) => {
      let updated: number[];
      if (prev.includes(score)) {
        if (prev.length <= 1) return prev; // Preserve at least one score
        updated = prev.filter((s) => s !== score);
      } else {
        updated = [...prev, score].sort((a, b) => a - b);
      }
      return updated;
    });
  };

  const applyPreset = (presetScores: number[]) => {
    setTargetScores([...presetScores].sort((a, b) => a - b));
  };

  const activePresetId = useMemo(() => {
    const sortedCurrent = [...targetScores].sort((a, b) => a - b).join(",");
    const match = PRESETS.find(
      (p) => p.scores.sort((a, b) => a - b).join(",") === sortedCurrent,
    );
    return match ? match.id : "custom";
  }, [targetScores]);

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        if (!isValidDistance(distance)) {
          setShowDistanceError(true);
          distanceInput.current?.focus();
          return;
        }
        onChange(endCount, arrowCount, targetScores, title, distance);
      }}
    >
      <div className="flex flex-col gap-2 rounded-2xl border border-line bg-surface p-4 shadow-xs transition-all duration-200 hover:border-primary/40">
        <label
          htmlFor="title-input"
          className="text-xs font-semibold uppercase tracking-wider text-ink-muted"
        >
          Nama Sesi / Catatan
        </label>
        <input
          id="title-input"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={getPracticeTitle({ distance, createdAt: sessionDate })}
          className="w-full rounded-xl border border-line bg-surface-muted/60 px-3.5 py-2.5 text-sm font-medium text-ink transition-all placeholder:text-ink-muted/50 focus:border-primary focus:bg-surface focus:outline-none"
        />
      </div>

      <div className="flex flex-col gap-2 rounded-2xl border border-line bg-surface p-4 shadow-xs transition-all duration-200 hover:border-primary/40">
        <div className="flex items-center justify-between">
          <label
            htmlFor="distance-input"
            className="text-xs font-semibold uppercase tracking-wider text-ink-muted"
          >
            Jarak (Meter)
          </label>
          <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-bold text-primary-dark dark:text-primary">
            {Number.isFinite(distance) ? `${distance}m` : "—"}
          </span>
        </div>
        <input
          id="distance-input"
          ref={distanceInput}
          type="number"
          required
          min={1}
          max={150}
          step={1}
          aria-invalid={showDistanceError}
          aria-describedby={showDistanceError ? "distance-error" : undefined}
          value={Number.isFinite(distance) ? distance : ""}
          onInvalid={() => setShowDistanceError(true)}
          onChange={(e) => {
            setDistance(e.target.valueAsNumber);
            setShowDistanceError(false);
          }}
          placeholder="18"
          className="w-full rounded-xl border border-line bg-surface-muted/60 px-3.5 py-2 text-sm font-bold text-ink transition-all focus:border-primary focus:bg-surface focus:outline-none"
        />
        {showDistanceError && (
          <p id="distance-error" role="alert" className="text-sm text-red-500">
            Masukkan jarak berupa bilangan bulat antara 1 dan 150 meter.
          </p>
        )}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {DISTANCE_PRESETS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => {
                setDistance(d);
                setShowDistanceError(false);
              }}
              className={`cursor-pointer rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                distance === d
                  ? "bg-primary text-white shadow-xs"
                  : "border border-line bg-surface-muted/60 text-ink-muted hover:bg-surface-muted hover:text-ink"
              }`}
            >
              {d}m
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2 rounded-2xl border border-line bg-surface p-4 shadow-xs transition-all duration-200 hover:border-primary/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Rambahan
            </span>
            <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-bold text-primary-dark dark:text-primary">
              {endCount} Rambahan
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 pt-1">
            <button
              type="button"
              aria-label="Kurangi rambahan"
              disabled={endCount <= 1}
              onClick={() => setEndCount((prev) => Math.max(1, prev - 1))}
              className="flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-line bg-surface-muted text-xl font-bold text-ink transition-all hover:border-primary hover:bg-primary/10 active:scale-95 disabled:pointer-events-none disabled:opacity-40"
            >
              −
            </button>
            <div className="flex flex-1 flex-col items-center justify-center">
              <span className="text-3xl font-extrabold text-ink">
                {endCount}
              </span>
            </div>
            <button
              type="button"
              aria-label="Tambah rambahan"
              disabled={endCount >= 20}
              onClick={() => setEndCount((prev) => Math.min(20, prev + 1))}
              className="flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-line bg-surface-muted text-xl font-bold text-ink transition-all hover:border-primary hover:bg-primary/10 active:scale-95 disabled:pointer-events-none disabled:opacity-40"
            >
              +
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2 rounded-2xl border border-line bg-surface p-4 shadow-xs transition-all duration-200 hover:border-primary/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Panah Per Rambahan
            </span>
            <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-bold text-primary-dark dark:text-primary">
              {arrowCount} Panah
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 pt-1">
            <button
              type="button"
              aria-label="Kurangi panah"
              disabled={arrowCount <= 1}
              onClick={() => setArrowCount((prev) => Math.max(1, prev - 1))}
              className="flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-line bg-surface-muted text-xl font-bold text-ink transition-all hover:border-primary hover:bg-primary/10 active:scale-95 disabled:pointer-events-none disabled:opacity-40"
            >
              −
            </button>
            <div className="flex flex-1 flex-col items-center justify-center">
              <span className="text-3xl font-extrabold text-ink">
                {arrowCount}
              </span>
            </div>
            <button
              type="button"
              aria-label="Tambah panah"
              disabled={arrowCount >= 12}
              onClick={() => setArrowCount((prev) => Math.min(12, prev + 1))}
              className="flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-line bg-surface-muted text-xl font-bold text-ink transition-all hover:border-primary hover:bg-primary/10 active:scale-95 disabled:pointer-events-none disabled:opacity-40"
            >
              +
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4 shadow-xs sm:p-5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <label className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
            Pilihan Skor Target
          </label>
          <span className="text-xs text-ink-muted">
            {targetScores.length} skor aktif
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5 pt-1">
          {PRESETS.map((preset) => {
            const isActive = activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset.scores)}
                className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? "bg-primary text-white shadow-xs"
                    : "border border-line bg-surface-muted/60 text-ink-muted hover:bg-surface-muted hover:text-ink"
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-5 gap-2 pt-2 sm:grid-cols-10">
          {ALL_AVAILABLE_SCORES.map((score) => {
            const isSelected = targetScores.includes(score);
            return (
              <button
                key={score}
                type="button"
                onClick={() => toggleScore(score)}
                className={`flex h-11 cursor-pointer items-center justify-center rounded-xl text-sm font-bold shadow-xs transition-all duration-150 ${
                  isSelected
                    ? "scale-105 border-2 border-primary bg-primary text-white shadow-md shadow-primary/30"
                    : "border border-line bg-surface-muted/40 text-ink-muted hover:border-primary/50 hover:text-ink"
                }`}
              >
                {score}
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-line bg-linear-to-br from-surface via-surface-muted/40 to-surface p-5 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink-muted">
              <span aria-hidden className="text-amber-500">
                ✨
              </span>
              Skor Maksimal Perolehan
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-primary-dark dark:text-primary sm:text-4xl">
                {totalPossibleScore}
              </span>
              <span className="text-xs font-semibold text-ink-muted">Poin</span>
            </div>
          </div>
          <div className="hidden rounded-xl border border-primary/20 bg-primary-soft/50 px-3.5 py-2.5 text-right sm:block">
            <div className="text-xs font-medium text-ink-muted">Formula</div>
            <div className="text-xs font-bold text-ink">
              {endCount} × {arrowCount} × {maxTargetScore}
            </div>
          </div>
        </div>
        <div className="mt-2 text-xs font-medium text-ink-muted sm:hidden">
          {endCount} rambahan × {arrowCount} panah × {maxTargetScore} poin maks
        </div>
      </div>

      <button
        type="submit"
        disabled={targetScores.length === 0}
        className="group relative flex w-full cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-xl bg-linear-to-r from-primary to-primary-dark px-6 py-4 text-base font-bold text-white shadow-lg shadow-primary/30 transition-all duration-200 hover:brightness-110 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
      >
        <span>Mulai Scoring</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          stroke="currentColor"
          className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
          />
        </svg>
      </button>
    </form>
  );
};
