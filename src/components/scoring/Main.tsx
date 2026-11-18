"use client";

import { useEffect, useRef, useState } from "react";
import { End } from "./End";
import { Result } from "./Result";
import { Setup } from "./Setup";
import { Alert, AlertProps } from "../Alert";
import { LoadingScreen } from "../LoadingScreen";
import { SetupType } from "@/types/setup";
import { db } from "@/lib/db";
import { getSessionId } from "@/lib/practice-session";
import {
  isValidDistance,
  isValidSession,
  isValidSetup,
  getSessionSetup,
} from "@/lib/practice-validation";

const storageWarning = "Penyimpanan browser tidak tersedia. Skor hanya ada di halaman ini "
  + "dan dapat hilang saat dimuat ulang.";

export const Main = () => {
  const [title, setTitle] = useState("");
  const [distance, setDistance] = useState(8);
  const [endCount, setEndCount] = useState(4);
  const [arrowCount, setArrowCount] = useState(5);
  const [targetScores, setTargetScores] = useState([1, 2, 3, 4, 5, 6]);
  const [userScores, setUserScores] = useState<number[][]>(() =>
    Array.from({ length: endCount }, () => Array(arrowCount).fill(0)),
  );
  const [step, setStep] = useState(1);
  const [currentEnd, setCurrentEnd] = useState(1);
  const defaultAlertState: AlertProps = {
    show: false,
    onConfirm: undefined,
    onCancel: undefined,
    title: "",
    message: "",
    confirmText: undefined,
    cancelText: undefined,
    type: "warning",
  };
  const [alertState, setAlertState] = useState<AlertProps>(defaultAlertState);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isEndStarted, setIsEndStarted] = useState(false);
  const [pending, setPending] = useState(false);
  const confirming = useRef(false);
  const completed = useRef(false);
  const sessionId = useRef<string | undefined>(undefined);
  const [cleanupFailed, setCleanupFailed] = useState(false);
  const [storageMessage, setStorageMessage] = useState("");
  const [draftBlocked, setDraftBlocked] = useState(false);
  const [restoreFailed, setRestoreFailed] = useState(false);
  const storageUnavailable = useRef(false);

  const closeAlert = () => {
    setAlertState((prev) => ({ ...prev, show: false }));
  };

  const clearDraft = () => {
    try {
      localStorage.removeItem("endSession");
      setCleanupFailed(false);
    } catch {
      setCleanupFailed(true);
    }
  };

  const completePractice = async () => {
    if (completed.current) return;
    if (!sessionId.current) throw new Error("Missing session identity");
    await db.addPractice({
      title, distance, arrowCount, endCount, targetScores, userScores,
      sessionId: sessionId.current,
      createdAt: new Date(),
    });
    completed.current = true;
    setIsEndStarted(false);
    setStorageMessage("");
    clearDraft();
    setStep(3);
  };

  const discardDraft = () => {
    try {
      localStorage.removeItem("endSession");
      setStorageMessage("");
    } catch {
      storageUnavailable.current = true;
      setStorageMessage(storageWarning);
    }
    setDraftBlocked(false);
    setRestoreFailed(false);
  };

  const confirmAlert = async () => {
    if (confirming.current) return;
    confirming.current = true;
    setPending(true);

    try {
      await alertState.onConfirm?.();
      closeAlert();
    } catch (error) {
      console.error("Gagal menyimpan latihan:", error);
      setAlertState((prev) => ({
        ...prev,
        type: "danger",
        message: "Gagal menyimpan latihan. Skor tetap tersedia di halaman ini. Silakan coba lagi.",
        confirmText: "Coba lagi",
      }));
    } finally {
      confirming.current = false;
      setPending(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    let storedSetup: string | null;
    let storedSession: string | null;
    try {
      storedSetup = localStorage.getItem("setup");
      storedSession = localStorage.getItem("endSession");
    } catch {
      storageUnavailable.current = true;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStorageMessage(storageWarning);
      setIsHydrated(true);
      return;
    }

    let setup: SetupType | undefined;
    try {
      const parsed: unknown = storedSetup === null ? null : JSON.parse(storedSetup);
      if (storedSetup !== null && !isValidSetup(parsed)) throw new Error("Invalid setup");
      if (isValidSetup(parsed)) {
        setup = parsed;
        setEndCount(parsed.endCount);
        setArrowCount(parsed.arrowCount);
        setTargetScores(parsed.targetScores);
      }
    } catch {
      setStorageMessage("Setup tersimpan tidak valid. Silakan atur ulang latihan.");
    }

    if (storedSession !== null) {
      setDraftBlocked(true);
      try {
        const parsed: unknown = JSON.parse(storedSession);
        const sessionSetup = getSessionSetup(parsed, setup);
        if (!sessionSetup || !isValidSession(parsed, sessionSetup)) throw new Error("Invalid draft");
        setStorageMessage("Memeriksa status draft tersimpan...");
        const inspectSession = async () => {
          try {
            const id = await getSessionId(parsed, sessionSetup);
            const saved = await db.getCompletedSession(id);
            if (cancelled) return;
            if (saved) {
              completed.current = true;
              setDraftBlocked(false);
              setStorageMessage("Sesi ini sudah selesai. Draft lama tidak akan dilanjutkan.");
              clearDraft();
              return;
            }
            setStorageMessage("Sesi skoring tersimpan tersedia. Pilih lanjutkan atau buat sesi baru.");
            setAlertState({
              show: true,
              type: "info",
              title: "Lanjutkan skoring?",
              message: "Sesi skoring akan dilanjutkan dari rambahan terakhir.",
              confirmText: "Lanjutkan",
              cancelText: "Buat ulang sesi",
              onConfirm: () => {
                sessionId.current = id;
                setTitle(parsed.title ?? "");
                setDistance(parsed.distance ?? 8);
                setCurrentEnd(parsed.currentEnd);
                setUserScores(parsed.userScores);
                setEndCount(sessionSetup.endCount);
                setArrowCount(sessionSetup.arrowCount);
                setTargetScores(sessionSetup.targetScores);
                setStorageMessage("");
                setDraftBlocked(false);
                setStep(2);
                setIsEndStarted(true);
              },
              onCancel: discardDraft,
            });
          } catch {
            if (cancelled) return;
            setRestoreFailed(true);
            setStorageMessage("Gagal memeriksa status draft. Draft tetap disimpan. Silakan periksa ulang.");
          }
        };
        void inspectSession();
      } catch {
        setStorageMessage("Draft tidak valid atau tidak cocok dengan setup. "
          + "Draft tetap disimpan sampai Anda memilih buat sesi baru.");
      }
    }
    setIsHydrated(true);
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "instant",
    });
  }, [step, currentEnd]);

  useEffect(() => {
    if (isEndStarted && !completed.current && !storageUnavailable.current) {
      try {
        localStorage.setItem("endSession", JSON.stringify({
          title, distance, userScores, currentEnd, isStarted: true,
          sessionId: sessionId.current,
          setup: { endCount, arrowCount, targetScores },
        }));
      } catch {
        storageUnavailable.current = true;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setStorageMessage(storageWarning);
      }
    }
  }, [arrowCount, currentEnd, distance, endCount, isEndStarted, targetScores, title, userScores]);

  if (!isHydrated) return <LoadingScreen />;

  return (
    <>
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-4 pb-14 sm:p-8 lg:gap-8">
        {storageMessage && (
          <div role="alert" className="rounded-xl border border-line bg-surface p-4 text-sm">
            {storageMessage}
            {restoreFailed && (
              <button type="button" onClick={() => window.location.reload()} className="ml-2 underline">
                Periksa ulang draft
              </button>
            )}
            {draftBlocked && !alertState.show && (
              <>
                {!restoreFailed && alertState.onConfirm && (
                  <button
                    type="button"
                    onClick={() => setAlertState((prev) => ({ ...prev, show: true }))}
                    className="ml-2 underline"
                  >
                    Lanjutkan sesi tersimpan
                  </button>
                )}
                <button type="button" onClick={discardDraft} className="ml-2 underline">
                  Buat sesi baru dan buang draft
                </button>
              </>
            )}
          </div>
        )}
        {cleanupFailed && (
          <div role="alert" className="rounded-xl border border-line bg-surface p-4 text-sm">
            Sesi sudah selesai, tetapi draft belum dapat dihapus.
            <button type="button" onClick={clearDraft} className="ml-2 underline">
              Coba hapus draft lagi
            </button>
          </div>
        )}
        {step === 1 && (
          <section className="animate-[fadeInUp_0.5s_ease-out_0.1s_both] rounded-2xl border border-white/20 bg-surface/50 p-5 shadow-xl backdrop-blur-xl sm:p-8">
            <h2 className="mb-4 flex items-center justify-center gap-2 text-lg font-semibold text-ink sm:text-xl">
              <span aria-hidden className="text-primary-dark dark:text-primary">
                📋
              </span>
              Scoring Setup
            </h2>
            <fieldset disabled={draftBlocked}>
              <Setup
                initialTitle={title}
                initialDistance={distance}
                initialEndCount={endCount}
                initialArrowCount={arrowCount}
                initialTargetScores={targetScores}
                onChange={(
                  newEndCount,
                  newArrowCount,
                  newTargetScores,
                  newTitle,
                  newDistance,
                ) => {
                  if (draftBlocked || !isValidDistance(newDistance)
                    || !isValidSetup({
                      endCount: newEndCount,
                      arrowCount: newArrowCount,
                      targetScores: newTargetScores,
                    })) return;

                  completed.current = false;
                  sessionId.current = crypto.randomUUID();
                  setCleanupFailed(false);
                  setTitle(newTitle);
                  setDistance(newDistance);
                  setEndCount(newEndCount);
                  setArrowCount(newArrowCount);
                  setTargetScores(newTargetScores);
                  setUserScores(
                    Array.from({ length: newEndCount }, () =>
                      Array(newArrowCount).fill(0),
                    ),
                  );
                  setStep(2);

                  try {
                    if (storageUnavailable.current) {
                      setStorageMessage(storageWarning);
                    } else {
                      localStorage.setItem("setup", JSON.stringify({
                        endCount: newEndCount,
                        arrowCount: newArrowCount,
                        targetScores: newTargetScores,
                      }));
                      setStorageMessage("");
                    }
                  } catch {
                    storageUnavailable.current = true;
                    setStorageMessage(storageWarning);
                  }
                  setIsEndStarted(true);
                }}
              />
            </fieldset>
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
                if (confirming.current) return;
                setUserScores((prev) => {
                  const updatedScores = [...prev];
                  updatedScores[endIndex] = [...prev[endIndex]];
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
                        "Semua skor yang sudah diinput pada sesi latihan ini akan dihapus.",
                      confirmText: "Ya, batalkan",
                      cancelText: "Batal",
                      onConfirm: () => {
                        setUserScores(
                          Array.from({ length: endCount }, () =>
                            Array(arrowCount).fill(0),
                          ),
                        );
                        setStep(1);
                        setIsEndStarted(false);
                        discardDraft();
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
                      title: "Selesaikan skoring?",
                      message:
                        "Hasil akhir akan dihitung dan ditampilkan berdasarkan skor yang sudah diinput.",
                      confirmText: "Selesai",
                      cancelText: "Batal",
                      onConfirm: completePractice,
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
        confirmText={alertState.confirmText}
        cancelText={alertState.cancelText}
        pending={pending}
        onDismiss={() => {
          if (!confirming.current) closeAlert();
        }}
        onCancel={() => {
          if (confirming.current) return;
          alertState.onCancel?.();
          closeAlert();
        }}
        onConfirm={confirmAlert}
      />
    </>
  );
};
