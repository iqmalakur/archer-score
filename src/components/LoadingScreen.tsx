export const LoadingScreen = () => {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6">
      <div className="relative flex h-20 w-20 items-center justify-center">
        <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-[pulseGlow_2s_ease-in-out_infinite]" />

        <svg
          className="absolute inset-0 h-20 w-20 animate-spin"
          style={{ animationDuration: "2.5s" }}
          viewBox="0 0 80 80"
          fill="none"
          aria-hidden
        >
          <circle
            cx="40"
            cy="40"
            r="36"
            stroke="var(--primary)"
            strokeWidth="3"
            strokeDasharray="60 166"
            strokeLinecap="round"
          />
        </svg>

        <svg
          className="absolute inset-2 h-16 w-16 animate-spin"
          style={{ animationDuration: "1.8s", animationDirection: "reverse" }}
          viewBox="0 0 64 64"
          fill="none"
          aria-hidden
        >
          <circle
            cx="32"
            cy="32"
            r="28"
            stroke="var(--primary-dark)"
            strokeWidth="2"
            strokeDasharray="40 136"
            strokeLinecap="round"
            opacity="0.6"
          />
        </svg>

        <div className="relative h-3 w-3 rounded-full bg-primary shadow-md shadow-primary/40" />
      </div>

      <div className="flex flex-col items-center gap-2">
        <p className="text-sm font-semibold text-ink-muted tracking-wide">
          Memuat data...
        </p>

        <div className="h-1 w-32 rounded-full overflow-hidden bg-surface-muted">
          <div
            className="h-full w-full rounded-full animate-[shimmer_1.5s_ease-in-out_infinite]"
            style={{
              backgroundImage:
                "linear-gradient(90deg, transparent, var(--primary), transparent)",
              backgroundSize: "200% 100%",
            }}
          />
        </div>
      </div>
    </div>
  );
};
