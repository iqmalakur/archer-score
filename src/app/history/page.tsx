import type { Metadata } from "next";
import { HistoryList } from "@/components/history/HistoryList";

export const metadata: Metadata = {
  title: "Riwayat Latihan | Panara",
  robots: { index: false, follow: true },
};

export default function HistoryPage() {
  return <HistoryList />;
}
