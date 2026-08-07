import Link from "next/link";
import { StatusCard } from "@/components/StatusCard";

export const ComingSoon = () => {
  return (
    <StatusCard
      icon="🚧"
      title="Segera Hadir"
      description="Fitur ini sedang dalam pengembangan dan akan segera tersedia. Nantikan pembaruannya!"
    >
      <Link
        href="/"
        className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-transform duration-150 hover:scale-105 active:scale-95"
      >
        Kembali ke Beranda
      </Link>
    </StatusCard>
  );
};