"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { db, type Practice } from "@/lib/db";
import { LoadingScreen } from "@/components/LoadingScreen";
import { PracticeDetails } from "@/components/PracticeDetails";
import { StatusCard } from "@/components/StatusCard";

function HistoryBackLink() {
  return (
    <Link
      href="/history"
      className="inline-flex w-fit items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold
        text-primary-dark hover:bg-primary-soft focus-visible:outline-2 focus-visible:outline-offset-4
        focus-visible:outline-primary dark:text-primary"
    >
      <span aria-hidden>←</span> Kembali ke Riwayat
    </Link>
  );
}

export const HistoryDetail = ({ id }: { id: string }) => {
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
      <StatusCard icon="📋" title={failure.title} description={failure.description}>
        <HistoryBackLink />
      </StatusCard>
    );
  }

  if (loading || !practice) {
    return (
      <main className="mx-auto w-full max-w-3xl p-4 pb-14 sm:p-8">
        <HistoryBackLink />
        <div role="status" aria-live="polite">
          <LoadingScreen />
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-4 pb-14 sm:p-8 lg:gap-8">
      <HistoryBackLink />

      <PracticeDetails practice={practice} />
    </main>
  );
};
