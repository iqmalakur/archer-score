import React from "react";

export interface EndProps {
  endNumber: number;
  arrowCount: number;
  targetScores: number[];
  scores: number[];
  onScoreChange: (endIndex: number, arrowIndex: number, score: number) => void;
}

export const End = ({ endNumber, arrowCount, targetScores, scores, onScoreChange }: EndProps) => {
  const arrowCountArray = Array.from({ length: arrowCount }, (_, idx) => idx + 1);

  const handleScoreChange = (arrowIndex: number, score: number) => {
    if (onScoreChange) {
      onScoreChange(endNumber - 1, arrowIndex, score);
    }
  };

  const subtotal = scores.reduce((acc, score) => acc + score, 0);

  return (
    <div className="rounded-2xl bg-linear-to-br from-primary/40 via-line to-transparent p-px">
      <div className="rounded-[15px] bg-surface p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-sm font-semibold text-primary-dark dark:text-primary">
            <span aria-hidden>🏹</span>
            Rambahan {endNumber}
          </span>
        </div>

        <div className="flex flex-col gap-5">
          {arrowCountArray.map((arrowNumber, arrowIndex) => {
            return (
              <div
                key={arrowNumber}
                className="flex flex-col gap-2 rounded-xl border border-line bg-surface-muted/60 p-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-ink-muted">
                    Panah {arrowNumber}
                  </h4>

                  {scores[arrowIndex] !== 0 && (
                    <button
                      aria-label={`Hapus skor Panah ${arrowNumber}`}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-red-500 transition-all duration-150 hover:bg-red-50 hover:ring-2 hover:ring-red-200 dark:hover:bg-red-900/30"
                      onClick={() => handleScoreChange(arrowIndex, 0)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                  {targetScores.map((score) => {
                    return (
                      <React.Fragment key={score}>
                        <label className="relative flex cursor-pointer items-center justify-center">
                          <input
                            type="radio"
                            name={`end-${endNumber}-arrow-${arrowNumber}-score`}
                            value={score}
                            className="peer sr-only"
                            checked={score === (scores[arrowIndex] ?? 0)}
                            onChange={() => handleScoreChange(arrowIndex, score)}
                          />
                          <span className="flex min-h-12 min-w-12 items-center justify-center rounded-full border border-line bg-surface text-sm font-semibold text-ink-muted shadow-sm transition-all duration-150 ease-out hover:-translate-y-px hover:border-primary/60 hover:ring-2 hover:ring-primary/20 peer-checked:scale-110 peer-checked:border-primary peer-checked:bg-primary peer-checked:text-white peer-checked:shadow-lg peer-checked:shadow-primary/40 peer-focus-visible:ring-2 peer-focus-visible:ring-primary/50">
                            {score}
                          </span>
                        </label>
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
          <span className="text-sm font-medium text-ink-muted">Subtotal</span>
          <span className="text-lg font-bold text-primary-dark dark:text-primary">
            {subtotal}
          </span>
        </div>
      </div>
    </div>
  );
};