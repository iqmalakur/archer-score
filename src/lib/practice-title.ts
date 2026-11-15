import type { Practice } from "./db";

export function getPracticeTitle(
  practice: Pick<Practice, "title" | "distance" | "createdAt">,
): string {
  if (practice.title?.trim()) return practice.title.trim();

  const distance = practice.distance === undefined
    ? "(jarak tidak tercatat)"
    : `${practice.distance} m`;
  const date = new Date(practice.createdAt).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return `Latihan ${distance} · ${date}`;
}
