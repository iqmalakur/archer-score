"use client";

import { useEffect, useState } from "react";
import { End } from "./End";
import { Result } from "./Result";
import { Setup } from "./Setup";
import { Alert } from "../Alert";
import { LoadingScreen } from "../LoadingScreen";
import { SetupType } from "@/types/setup";
import { EndSessionType } from "@/types/end-session";

export const Main = () => {
  const [endCount, setEndCount] = useState(4);
  const [arrowCount, setArrowCount] = useState(5);
  const [targetScores, setTargetScores] = useState([1, 2, 3, 4, 5, 6]);
  const [userScores, setUserScores] = useState<number[][]>(() =>
    Array.from({ length: endCount }, () => Array(arrowCount).fill(0)),
  );
  const [step, setStep] = useState(1);
  const [currentEnd, setCurrentEnd] = useState(1);
  const [alertState, setAlertState] = useState<{
    show: boolean;
    callback?: () => void;
    title: string;
    message: string;
    type: "warning" | "success" | "danger" | "info";
  }>({
    show: false,
    callback: undefined,
    title: "",
    message: "",
    type: "warning",
  });
  const [isHydrated, setIsHydrated] = useState(false);
  const [isEndStarted, setIsEndStarted] = useState(false);

  const closeAlert = () => {
    setAlertState({
      show: false,
      callback: undefined,
      title: "",
      message: "",
      type: "warning",
    });
  };

  useEffect(() => {
    const storedSession = localStorage.getItem("endSession");

    if (storedSession) {
      try {
        const parsed = JSON.parse(storedSession) as EndSessionType;

        if (parsed.isStarted) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setCurrentEnd((prev) => parsed.currentEnd ?? prev);
          setUserScores((prev) => parsed.userScores ?? prev);
          setStep(2);
          setIsEndStarted(true);
        }
      } catch (error) {
        console.error(error);
      }
    }

    const storedSetup = localStorage.getItem("setup");

    if (storedSetup) {
      try {
        const parsed = JSON.parse(storedSetup) as SetupType;

        setEndCount((prev) => parsed.endCount ?? prev);
        setArrowCount((prev) => parsed.arrowCount ?? prev);
        setTargetScores((prev) => parsed.targetScores ?? prev);
      } catch (error) {
        console.error(error);
      }
    }

    setIsHydrated(true);
  }, []);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "instant",
    });
  }, [step, currentEnd]);

  const updateEndSession = (endSession: EndSessionType) => {
    localStorage.setItem("endSession", JSON.stringify(endSession));
  };

  useEffect(() => {
    if (isEndStarted) {
      updateEndSession({
        userScores,
        currentEnd,
        isStarted: true,
      });
    }
  }, [currentEnd, isEndStarted, userScores]);

  if (!isHydrated) return <LoadingScreen />;

  return (
    <>
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-4 pb-14 sm:p-8 lg:gap-8">
        {step === 1 && (
          <section className="animate-[fadeInUp_0.5s_ease-out_0.1s_both] rounded-2xl border border-white/20 bg-surface/50 p-5 shadow-xl backdrop-blur-xl sm:p-8">
            <h2 className="mb-4 flex items-center justify-center gap-2 text-lg font-semibold text-ink sm:text-xl">
              <span aria-hidden className="text-primary-dark dark:text-primary">
                📋
              </span>
              Scoring Setup
            </h2>
            <Setup
              initialEndCount={endCount}
              initialArrowCount={arrowCount}
              initialTargetScores={targetScores}
              onChange={(newEndCount, newArrowCount, newTargetScores) => {
                setEndCount(newEndCount);
                setArrowCount(newArrowCount);
                setTargetScores(newTargetScores);
                setUserScores(
                  Array.from({ length: newEndCount }, () =>
                    Array(newArrowCount).fill(0),
                  ),
                );
                setStep(2);
                localStorage.setItem(
                  "setup",
                  JSON.stringify({
                    endCount: newEndCount,
                    arrowCount: newArrowCount,
                    targetScores: newTargetScores,
                  }),
                );
                updateEndSession({
                  userScores,
                  currentEnd,
                  isStarted: true,
                });
                setIsEndStarted(true);
              }}
            />
          </section>
        )}

        {step === 2 && (
          <section className="animate-[fadeInUp_0.5s_ease-out_0.1s_both] rounded-2xl border border-white/20 bg-surface/70 p-5 shadow-xl backdrop-blur-xl sm:p-8">
            <h2 className="mb-4 flex items-center justify-center gap-2 text-lg font-semibold text-ink sm:text-xl">
              <span aria-hidden className="text-primary-dark dark:text-primary">
                🏹
              </span>
              Rambahan {currentEnd} dari {endCount}
            </h2>
            <End
              endNumber={currentEnd}
              arrowCount={arrowCount}
              targetScores={targetScores}
              scores={userScores[currentEnd - 1]}
              onScoreChange={(endIndex, arrowIndex, score) => {
                setUserScores((prev) => {
                  const updatedScores = [...prev];
                  updatedScores[endIndex][arrowIndex] = score;
                  return updatedScores;
                });
              }}
            />
            <div className="mt-6 flex gap-3">
              {currentEnd > 1 ? (
                <button
                  className="flex-1 cursor-pointer rounded-xl border border-line bg-surface px-6 py-3 font-semibold text-ink-muted transition-all hover:bg-surface-muted"
                  onClick={() => setCurrentEnd((prev) => prev - 1)}
                >
                  Kembali
                </button>
              ) : (
                <button
                  className="flex-1 cursor-pointer rounded-xl border border-red-200 bg-red-50 px-6 py-3 font-semibold text-red-600 transition-all hover:bg-red-100 dark:border-red-500/30 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
                  onClick={() => {
                    setAlertState({
                      show: true,
                      type: "danger",
                      title: "Batalkan rambahan?",
                      message:
                        "Semua skor yang sudah diinput akan dihapus dan kamu kembali ke ringkasan scoring.",
                      callback: () => {
                        setUserScores(
                          Array.from({ length: endCount }, () =>
                            Array(arrowCount).fill(0),
                          ),
                        );
                        setStep(1);
                        localStorage.removeItem("endSession");
                        setIsEndStarted(false);
                      },
                    });
                  }}
                >
                  Batalkan rambahan
                </button>
              )}

              {currentEnd < endCount ? (
                <button
                  className="flex-1 cursor-pointer rounded-xl bg-primary px-6 py-3 font-semibold text-white shadow-lg shadow-primary/30 transition-all hover:brightness-110 active:scale-[0.97]"
                  onClick={() => setCurrentEnd((prev) => prev + 1)}
                >
                  Lanjut
                </button>
              ) : (
                <button
                  className="flex-1 cursor-pointer rounded-xl bg-primary px-6 py-3 font-semibold text-white shadow-lg shadow-primary/30 transition-all hover:brightness-110 active:scale-[0.97]"
                  onClick={() => {
                    setAlertState({
                      show: true,
                      type: "success",
                      title: "Selesaikan scoring?",
                      message:
                        "Hasil akhir akan dihitung dan ditampilkan berdasarkan skor yang sudah diinput.",
                      callback: () => {
                        setStep(3);
                        localStorage.removeItem("endSession");
                        setIsEndStarted(false);
                      },
                    });
                  }}
                >
                  Selesai
                </button>
              )}
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="animate-[fadeInUp_0.5s_ease-out_0.2s_both] rounded-2xl border border-white/20 bg-surface p-5 shadow-xl backdrop-blur-xl sm:p-6">
            <h2 className="mb-4 flex items-center justify-center gap-2 text-lg font-semibold text-ink sm:text-xl">
              <span aria-hidden className="text-accent">
                🏆
              </span>
              Hasil
            </h2>
            <Result
              endCount={endCount}
              arrowCount={arrowCount}
              targetScores={targetScores}
              userScores={userScores}
            />
            <div className="mt-6 flex gap-3">
              <button
                className="flex-1 cursor-pointer rounded-xl border border-red-200 bg-red-50 px-6 py-3 font-semibold text-red-600 transition-all hover:bg-red-100 dark:border-red-500/30 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
                onClick={() => {
                  setUserScores(
                    Array.from({ length: endCount }, () =>
                      Array(arrowCount).fill(0),
                    ),
                  );
                  setStep(1);
                  setCurrentEnd(1);
                }}
              >
                Ulangi lagi
              </button>
            </div>
          </section>
        )}
      </main>

      <Alert
        show={alertState.show}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        onCancel={closeAlert}
        onConfirm={() => {
          alertState.callback?.();
          closeAlert();
        }}
      />
    </>
  );
};
