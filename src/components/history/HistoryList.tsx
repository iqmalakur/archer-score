"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { db, type Practice } from "@/lib/db";
import { calculateScore } from "@/lib/score";
import { getPracticeTitle } from "@/lib/practice-title";
import { Alert } from "@/components/Alert";
import { StatusCard } from "@/components/StatusCard";
import { PracticeDate } from "./PracticeDate";

function HistoryRow({
  practice,
  onDelete,
}: {
  practice: Practice;
  onDelete: () => void;
}) {
  const title = getPracticeTitle(practice);
  const { totalScore, maxScore, isPassed } = calculateScore(practice);

  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] items-stretch">
      <Link
        href={`/history/${practice.id}`}
        aria-label={`Lihat detail ${title}`}
        className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl
          px-3 py-4 hover:bg-surface-muted sm:gap-5 sm:px-4"
      >
        <div className="min-w-0">
          <p className="line-clamp-2 wrap-anywhere text-sm leading-snug font-bold text-ink sm:text-base">
            {title}
          </p>
          <p className="mt-1 text-xs text-ink-muted">
            <PracticeDate date={practice.createdAt} />
            {practice.distance !== undefined && ` · ${practice.distance} m`}
          </p>
          <p className="mt-1 text-xs text-ink-muted">
            {practice.endCount} rambahan × {practice.arrowCount} panah
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <div className="max-w-[min(35vw,13rem)] text-right leading-tight tabular-nums">
            <p className="wrap-anywhere text-xs font-medium text-ink-muted">
              <strong className="text-xl font-bold text-primary sm:text-2xl">{totalScore}</strong>
              {" / "}{maxScore}
            </p>
            <p className={`mt-1 text-xs font-semibold ${isPassed ? "text-primary" : "text-ink-muted"}`}>
              {isPassed ? "Lulus" : "Coba lagi"}
            </p>
          </div>
          <span aria-hidden="true" className="hidden text-xl text-ink-muted min-[360px]:inline">›</span>
        </div>
      </Link>

      <button
        type="button"
        aria-label={`Hapus ${title}`}
        onClick={onDelete}
        className="mr-1 grid size-11 cursor-pointer place-items-center self-center rounded-xl
          text-ink-muted hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/40
          dark:hover:text-red-300 sm:mr-2"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-4.5"
        >
          <path d="M3 6h18M9 6V3h6v3m4 0-1 14H6L5 6m5 4v6m4-6v6" />
        </svg>
      </button>
    </li>
  );
}

export function HistoryList() {
  const [practices, setPractices] = useState<Practice[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const retrying = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const deleting = useRef(false);
  const [pending, setPending] = useState(false);
  const [deleteError, setDeleteError] = useState(false);
  const [selected, setSelected] = useState<Practice | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadPractices = async () => {
      try {
        const data = await db.getPractices();
        if (!cancelled) setPractices(data);
      } catch (error) {
        console.error("Gagal memuat data riwayat latihan:", error);
        if (!cancelled) setLoadError(true);
      } finally {
        if (!cancelled) {
          setLoading(false);
          retrying.current = false;
        }
      }
    };

    loadPractices();
    return () => { cancelled = true; };
  }, [loadAttempt]);

  const retryLoad = () => {
    if (retrying.current) return;
    retrying.current = true;
    setLoadError(false);
    setLoading(true);
    setLoadAttempt((prev) => prev + 1);
    heading.current?.focus();
  };

  const confirmDelete = async () => {
    const id = selected?.id;
    if (id === undefined || deleting.current) return;
    deleting.current = true;
    setPending(true);

    try {
      await db.removePractice(id);
      setPractices((prev) => prev.filter((practice) => practice.id !== id));
      setSelected(null);
    } catch (error) {
      console.error("Gagal menghapus riwayat:", error);
      setDeleteError(true);
    } finally {
      deleting.current = false;
      setPending(false);
    }
  };

  const selectedTitle = selected ? getPracticeTitle(selected) : "";

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-6 sm:gap-6 sm:px-8 sm:py-10">
      <header>
        <h1 ref={heading} tabIndex={-1} className="text-3xl font-bold tracking-tight sm:text-4xl">
          Riwayat Latihan
        </h1>
        {!loading && !loadError && practices.length > 0 && (
          <p className="mt-2 text-sm text-ink-muted">{practices.length} sesi tersimpan</p>
        )}
      </header>

      {loading ? (
        <div role="status" className="grid gap-3">
          <span className="sr-only">Memuat riwayat latihan</span>
          {[0, 1, 2].map((index) => (
            <div key={index} aria-hidden="true" className="h-19 animate-pulse rounded-2xl bg-surface-muted" />
          ))}
        </div>
      ) : loadError ? (
        <StatusCard
          inset
          title="Gagal Memuat Riwayat"
          description="Penyimpanan browser tidak dapat dibaca. Silakan coba lagi."
        >
          <button
            type="button"
            onClick={retryLoad}
            className="min-h-11 cursor-pointer rounded-xl bg-primary px-5 py-3
              text-sm font-semibold text-on-primary hover:brightness-110"
          >
            Coba lagi
          </button>
        </StatusCard>
      ) : practices.length === 0 ? (
        <StatusCard
          inset
          title="Belum Ada Riwayat"
          description="Skor dari latihan yang selesai akan tersimpan di sini."
        >
          <Link
            href="/"
            className="inline-flex min-h-11 items-center rounded-xl bg-primary px-5 py-3
              text-sm font-semibold text-on-primary hover:brightness-110"
          >
            Mulai latihan
          </Link>
        </StatusCard>
      ) : (
        <ul role="list" className="divide-y divide-line rounded-2xl border border-line bg-surface p-1">
          {practices.map((practice, index) => (
            <HistoryRow
              key={practice.id ?? index}
              practice={practice}
              onDelete={() => {
                if (practice.id === undefined || deleting.current) return;
                setDeleteError(false);
                setSelected(practice);
              }}
            />
          ))}
        </ul>
      )}

      <Alert
        show={selected !== null}
        title="Hapus riwayat latihan?"
        message={deleteError
          ? "Riwayat belum berhasil dihapus. Silakan coba lagi."
          : `Riwayat "${selectedTitle}" akan dihapus secara permanen.`}
        type="danger"
        confirmText={deleteError ? "Coba lagi" : "Ya, Hapus"}
        pending={pending}
        fallbackFocusRef={heading}
        onCancel={() => {
          if (!deleting.current) setSelected(null);
        }}
        onConfirm={confirmDelete}
      />
    </main>
  );
}
