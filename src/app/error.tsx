"use client";

import Link from "next/link";
import { StatusCard } from "@/components/StatusCard";

export default function ErrorPage() {
  const retry = () => window.location.reload();

  return (
    <>
      <StatusCard
        icon="⚠️"
        title="Terjadi Kesalahan"
        description="Ada yang tidak berjalan sesuai harapan. Coba muat ulang halaman ini."
      >
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={retry}
            className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-transform duration-150 hover:scale-105 active:scale-95"
          >
            Muat Ulang
          </button>
          <Link
            href="/"
            className="rounded-full border border-line bg-surface px-6 py-2.5 text-sm font-semibold text-ink transition-colors duration-150 hover:bg-surface-muted"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </StatusCard>
    </>
  );
}
