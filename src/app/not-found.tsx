import Link from "next/link";
import { StatusCard } from "@/components/StatusCard";

export default function NotFoundPage() {
  return (
    <>
      <StatusCard
        icon="🎯"
        title="Halaman Tidak Ditemukan"
        description="Halaman yang Anda cari tidak ditemukan atau telah dipindahkan."
      >
        <Link
          href="/"
          className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-transform duration-150 hover:scale-105 active:scale-95"
        >
          Kembali ke Beranda
        </Link>
      </StatusCard>
    </>
  );
}
