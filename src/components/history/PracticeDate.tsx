const dateFormat = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function PracticeDate({ date }: { date: Date }) {
  const savedAt = new Date(date);
  if (!Number.isFinite(savedAt.getTime())) return "Tanggal tidak tercatat";

  return <time dateTime={savedAt.toISOString()}>{dateFormat.format(savedAt)}</time>;
}
