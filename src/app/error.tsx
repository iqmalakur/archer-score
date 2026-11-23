"use client";

import Link from "next/link";
import { StatusCard } from "@/components/StatusCard";

export default function ErrorPage() {
  const retry = () => window.location.reload();

  return (
    <>
      <StatusCard
        title="Terjadi Kesalahan"
        description="Ada yang tidak berjalan sesuai harapan. Coba muat ulang halaman ini."
      >
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={retry}
            className="min-h-11 cursor-pointer rounded-xl bg-primary px-5 py-3
              text-sm font-semibold text-on-primary hover:brightness-110"
          >
            Muat Ulang
          </button>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center rounded-xl border border-line bg-surface
              px-5 py-3 text-sm font-semibold text-ink hover:bg-surface-muted"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </StatusCard>
    </>
  );
}
