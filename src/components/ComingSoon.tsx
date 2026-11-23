import Link from "next/link";
import { StatusCard } from "@/components/StatusCard";

export const ComingSoon = () => {
  return (
    <StatusCard
      title="Segera Hadir"
      description="Fitur ini sedang dalam pengembangan dan akan segera tersedia. Nantikan pembaruannya!"
    >
      <Link
        href="/"
        className="inline-flex min-h-11 items-center rounded-xl bg-primary px-5 py-3
          text-sm font-semibold text-on-primary hover:brightness-110"
      >
        Kembali ke Beranda
      </Link>
    </StatusCard>
  );
};
