import type { Metadata } from "next";
import { TargetSettings } from "@/components/settings/TargetSettings";

export const metadata: Metadata = {
  title: "Pengaturan | Panara",
  robots: { index: false, follow: true },
};

export default function SettingPage() {
  return <TargetSettings />;
}
