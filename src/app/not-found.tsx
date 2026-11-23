import Link from "next/link";
import { StatusCard } from "@/components/StatusCard";

export default function NotFoundPage() {
  return (
    <>
      <StatusCard
        title="Halaman Tidak Ditemukan"
        description="Halaman yang Anda cari tidak ditemukan atau telah dipindahkan."
      >
        <Link
          href="/"
          className="inline-flex min-h-11 items-center rounded-xl bg-primary px-5 py-3
            text-sm font-semibold text-on-primary hover:brightness-110"
        >
          Kembali ke Beranda
        </Link>
      </StatusCard>
    </>
  );
}
