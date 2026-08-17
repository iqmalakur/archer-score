"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { db, Practice } from "@/lib/db";
import { calculateScore } from "@/lib/score";
import { Alert, AlertProps } from "@/components/Alert";
import { StatusCard } from "@/components/StatusCard";

export const HistoryList = () => {
  const [practices, setPractices] = useState<Practice[]>([]);
  const [loading, setLoading] = useState(true);

  const defaultAlertState: AlertProps = {
    show: false,
    title: "",
    message: "",
    type: "danger",
    confirmText: "Hapus",
    cancelText: "Batal",
  };

  const [alertState, setAlertState] = useState<AlertProps>(defaultAlertState);

  useEffect(() => {
    const loadPractices = async () => {
      try {
        const data = await db.getPractices();
        setPractices(data);
      } catch (error) {
        console.error("Gagal memuat data riwayat latihan:", error);
      } finally {
        setLoading(false);
      }
    };

    loadPractices();
  }, []);

  const handleDeleteRequest = (practice: Practice) => {
    if (practice.id === undefined) return;
    setAlertState({
      show: true,
      type: "danger",
      title: "Hapus riwayat latihan?",
      message: `Riwayat "${practice.title || "Latihan Tanpa Judul"}" akan dihapus secara permanen.`,
      confirmText: "Ya, Hapus",
      cancelText: "Batal",
      onConfirm: async () => {
        if (practice.id !== undefined) {
          try {
            await db.removePractice(practice.id);
            setPractices((prev) => prev.filter((p) => p.id !== practice.id));
          } catch (error) {
            console.error("Gagal menghapus riwayat:", error);
          }
        }
        setAlertState(defaultAlertState);
      },
      onCancel: () => {
        setAlertState(defaultAlertState);
      },
    });
  };

  const formatDate = (dateInput: Date | string) => {
    try {
      const d = new Date(dateInput);
      return d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "-";
    }
  };

  if (loading) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-4 pb-14 sm:p-8 lg:gap-8">
        <div className="flex flex-col gap-4">
          <div className="h-7 w-48 animate-pulse rounded-lg bg-surface-muted" />
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex h-36 w-full animate-pulse flex-col justify-between rounded-2xl border border-line bg-surface/60 p-5 shadow-sm sm:p-6"
            >
              <div className="flex justify-between gap-4">
                <div className="flex flex-col gap-2">
                  <div className="h-5 w-40 rounded bg-surface-muted" />
                  <div className="h-4 w-28 rounded bg-surface-muted" />
                </div>
                <div className="h-8 w-8 rounded-full bg-surface-muted" />
              </div>
              <div className="flex justify-between items-end gap-2 pt-4">
                <div className="h-6 w-32 rounded bg-surface-muted" />
                <div className="h-6 w-20 rounded-full bg-surface-muted" />
              </div>
            </div>
          ))}
        </div>
      </main>
    );
  }

  if (practices.length === 0) {
    return (
      <StatusCard
        icon="📭"
        title="Belum Ada Riwayat"
        description="Riwayat latihan panahan Anda akan otomatis tersimpan di sini setelah Anda menyelesaikan sesi skoring."
      >
        <Link
          href="/"
          className="rounded-xl bg-primary px-6 py-3 font-semibold text-white shadow-lg shadow-primary/30 transition-all hover:brightness-110 active:scale-[0.97]"
        >
          Mulai Skoring Baru
        </Link>
      </StatusCard>
    );
  }

  return (
    <>
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-4 pb-14 sm:p-8 lg:gap-8">
        <section className="flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl font-bold text-ink sm:text-2xl">
              <span aria-hidden className="text-primary">
                📜
              </span>
              Riwayat Latihan
            </h2>
            <span className="rounded-full border border-line bg-surface-muted px-3 py-1 text-xs font-semibold text-ink-muted">
              {practices.length} {practices.length === 1 ? "Sesi" : "Sesi"}
            </span>
          </div>

          <div className="flex flex-col gap-4">
            {practices.map((practice, index) => {
              const { totalScore, maxScore, percentage, isPassed } =
                calculateScore(practice);

              const formattedDate = formatDate(practice.createdAt);

              const scoreColorClass =
                percentage < 40
                  ? "text-red-500"
                  : percentage < 80
                    ? "text-amber-500 dark:text-amber-400"
                    : "text-emerald-500 dark:text-emerald-400";

              return (
                <article
                  key={practice.id ?? index}
                  className="animate-[fadeInUp_0.4s_ease-out_both] group relative flex flex-col justify-between rounded-2xl border border-line bg-surface/75 p-5 shadow-md backdrop-blur-xl transition-all duration-200 hover:border-primary/40 hover:shadow-lg sm:p-6"
                  style={{ animationDelay: `${Math.min(index * 0.05, 0.4)}s` }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-col gap-1 pr-8 sm:pr-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-ink sm:text-lg">
                          {practice.title && practice.title.trim() !== ""
                            ? practice.title
                            : "Latihan Tanpa Judul"}
                        </h3>
                        {practice.distance !== undefined && (
                          <span className="inline-flex items-center rounded-md border border-line bg-surface-muted px-2 py-0.5 text-xs font-medium text-ink-muted">
                            🎯 {practice.distance}m
                          </span>
                        )}
                      </div>
                      <time
                        dateTime={new Date(practice.createdAt).toISOString()}
                        className="text-xs font-medium text-ink-muted"
                      >
                        📅 {formattedDate}
                      </time>
                    </div>

                    <button
                      type="button"
                      aria-label={`Hapus ${practice.title || "riwayat latihan"}`}
                      onClick={() => handleDeleteRequest(practice)}
                      className="cursor-pointer rounded-xl p-2 text-ink-muted/60 transition-all hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/40 dark:hover:text-red-400 active:scale-95"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.8}
                        stroke="currentColor"
                        className="h-5 w-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                        />
                      </svg>
                    </button>
                  </div>

                  <div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t border-line/60 pt-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-medium text-ink-muted">
                        {practice.endCount} Rambahan × {practice.arrowCount}{" "}
                        Panah
                      </span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xl font-extrabold text-ink sm:text-2xl">
                          {totalScore}
                        </span>
                        <span className="text-xs font-semibold text-ink-muted">
                          / {maxScore} pts
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-extrabold sm:text-base ${scoreColorClass}`}
                      >
                        {percentage.toFixed(1)}%
                      </span>

                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
                          isPassed
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                            : "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"
                        }`}
                      >
                        <span>{isPassed ? "✓" : "✕"}</span>
                        {isPassed ? "Lulus" : "Coba lagi"}
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </main>

      <Alert
        show={alertState.show}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        confirmText={alertState.confirmText}
        cancelText={alertState.cancelText}
        onCancel={() => {
          alertState.onCancel?.();
          setAlertState(defaultAlertState);
        }}
        onConfirm={() => {
          alertState.onConfirm?.();
        }}
      />
    </>
  );
};
