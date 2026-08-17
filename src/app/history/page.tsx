import { HistoryList } from "@/components/history/HistoryList";

export default function HistoryPage() {
  return (
    <div className="bg-linear-to-b from-background via-surface-muted/40 to-background text-ink transition-colors duration-300">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, color-mix(in srgb, var(--primary) 14%, transparent) 1px, transparent 0)",
          backgroundSize: "22px 22px",
        }}
      />
      <HistoryList />
    </div>
  );
}
