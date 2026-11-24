"use client";

import { useEffect, useState } from "react";
import { db, type Practice } from "@/lib/db";
import { getPracticeTitle } from "@/lib/practice-title";
import { LoadingScreen } from "@/components/LoadingScreen";
import { PracticeEnds, PracticeInfo, PracticeResult } from "@/components/PracticeDetails";
import { StatusCard } from "@/components/StatusCard";
import { PracticeDate } from "./PracticeDate";

function HistoryBackButton({ onBack }: { onBack: () => void }) {
  return (
    <button
      type="button"
      onClick={onBack}
      className="inline-flex min-h-11 w-fit items-center gap-2 rounded-xl px-3 text-sm font-semibold
        text-primary-dark hover:bg-primary-soft focus-visible:outline-2 focus-visible:outline-offset-4
        focus-visible:outline-primary dark:text-primary cursor-pointer"
    >
      <span aria-hidden>←</span> Kembali ke Riwayat
    </button>
  );
}

export const HistoryDetail = ({ id, onBack }: { id: string; onBack: () => void }) => {
  const practiceId = Number(id);
  const isValidId = /^\d+$/.test(id) && Number.isSafeInteger(practiceId) && practiceId > 0;
  const [practice, setPractice] = useState<Practice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!isValidId) return;
    let cancelled = false;

    const loadPractice = async () => {
      try {
        const data = await db.getPractice(practiceId);
        if (!cancelled) setPractice(data ?? null);
      } catch (error) {
        console.error("Gagal memuat detail riwayat latihan:", error);
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadPractice();
    return () => {
      cancelled = true;
    };
  }, [isValidId, practiceId]);

  const failure = !isValidId
    ? { title: "ID Riwayat Tidak Valid", description: "ID riwayat harus berupa bilangan bulat positif yang valid." }
    : error
      ? {
        title: "Gagal Memuat Riwayat",
        description: "Penyimpanan browser tidak dapat dibaca. Silakan coba buka kembali riwayat latihan.",
      }
      : !loading && !practice
        ? {
          title: "Riwayat Tidak Ditemukan",
          description: "Riwayat ini tidak tersedia di browser ini atau sudah dihapus.",
        }
        : null;

  if (failure) {
    return (
      <StatusCard title={failure.title} description={failure.description}>
        <HistoryBackButton onBack={onBack} />
      </StatusCard>
    );
  }

  if (loading || !practice) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-8 sm:py-10">
        <HistoryBackButton onBack={onBack} />
        <div role="status" aria-live="polite">
          <LoadingScreen />
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-6 sm:gap-6 sm:px-8 sm:py-10">
      <header>
        <div className="-mx-3 mb-2">
          <HistoryBackButton onBack={onBack} />
        </div>
        <h1 className="wrap-anywhere text-3xl font-bold tracking-tight sm:text-4xl">
          {getPracticeTitle(practice)}
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          <PracticeDate date={practice.createdAt} />
        </p>
      </header>

      <PracticeResult practice={practice} heading="h2" />
      <PracticeInfo practice={practice} />
      <PracticeEnds practice={practice} />
    </main>
  );
};
