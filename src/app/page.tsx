import { Main } from "@/components/Main";

export default function Home() {
  return (
    <div className="min-h-screen bg-linear-to-b from-background via-surface-muted/40 to-background text-ink transition-colors duration-300">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, color-mix(in srgb, var(--primary) 14%, transparent) 1px, transparent 0)",
          backgroundSize: "22px 22px",
        }}
      />
      <Main />
    </div>
  );
}