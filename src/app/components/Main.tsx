"use client";

import { useState } from "react";
import { End } from "./End";
import { Setting } from "./Setting";
import { Result } from "./Result";
import { ThemeToggle } from "./ThemeToggle";

export const Main = () => {
  const [endCount, setEndCount] = useState(4);
  const [arrowCount, setArrowCount] = useState(5);
  const [targetScores, setTargetScores] = useState([1, 2, 3, 4, 5, 6]);
  const [userScores, setUserScores] = useState<number[][]>(() =>
    Array.from({ length: endCount }, () => Array(arrowCount).fill(0))
  );

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-line bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-3 sm:px-8">
          <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            <span aria-hidden className="text-accent">🏹</span>
            Archery Scoring
          </h1>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-4 pb-14 sm:p-8 lg:gap-8">
        <section
          className="animate-[fadeInUp_0.5s_ease-out_both] rounded-2xl border border-white/20 bg-surface/75 shadow-xl backdrop-blur-xl"
        >
          <details className="group px-5 py-5 sm:px-8">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 sm:py-1">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-ink sm:text-xl">
                <span aria-hidden className="text-primary-dark dark:text-primary">⚙️</span>
                Pengaturan
              </h2>
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-line bg-surface-muted text-ink-muted transition-transform duration-200 group-open:rotate-180">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </span>
            </summary>
            <div className="mt-5">
              <Setting
                initialEndCount={endCount}
                initialArrowCount={arrowCount}
                initialTargetScores={targetScores}
                onChange={(newEndCount, newArrowCount, newTargetScores) => {
                  setEndCount(newEndCount);
                  setArrowCount(newArrowCount);
                  setTargetScores(newTargetScores);
                  setUserScores(
                    Array.from({ length: newEndCount }, () => Array(newArrowCount).fill(0))
                  );
                }}
              />
            </div>
          </details>
        </section>

        <section
          className="animate-[fadeInUp_0.5s_ease-out_0.1s_both] rounded-2xl border border-white/20 bg-surface/70 p-5 shadow-xl backdrop-blur-xl sm:p-8"
        >
          <h2 className="mb-5 flex items-center justify-center gap-2 text-lg font-semibold text-ink sm:text-xl">
            <span aria-hidden className="text-primary">🎯</span>
            Skor
          </h2>

          <div className="flex flex-col gap-6">
            {Array.from({ length: endCount }, (_, idx) => (
              <End
                key={idx}
                endNumber={idx + 1}
                arrowCount={arrowCount}
                targetScores={targetScores}
                scores={userScores[idx]}
                onScoreChange={(endIndex, arrowIndex, score) => {
                  setUserScores((prev) => {
                    const updatedScores = [...prev];
                    updatedScores[endIndex][arrowIndex] = score;
                    return updatedScores;
                  });
                }}
              />
            ))}
          </div>
        </section>

        <section
          className="animate-[fadeInUp_0.5s_ease-out_0.2s_both] rounded-2xl border border-white/20 bg-surface p-5 shadow-xl backdrop-blur-xl sm:p-6"
        >
          <h2 className="mb-4 flex items-center justify-center gap-2 text-lg font-semibold text-ink sm:text-xl">
            <span aria-hidden className="text-accent">🏆</span>
            Hasil
          </h2>
          <Result
            endCount={endCount}
            arrowCount={arrowCount}
            targetScores={targetScores}
            userScores={userScores}
          />
        </section>
      </main>
    </>
  );
};