export default function LoadingPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-4 px-4 pb-14 sm:px-8">
      <span
        role="status"
        aria-label="Memuat"
        className="h-12 w-12 animate-spin rounded-full border-4 border-line border-t-primary"
      />
      <span className="animate-pulse text-sm font-medium text-ink-muted">
        Memuat...
      </span>
    </div>
  );
}
