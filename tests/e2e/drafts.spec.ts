import { expect, test } from "@playwright/test";
import {
  draft, legacyDraft, finish, placeArrow, records, resume, seedDraft, setup, storedDraft,
} from "./helpers";

for (const [name, preferences] of [
  ["different", { endCount: 4, arrowCount: 5, targetScores: [1, 2] }],
  ["missing", null], ["invalid", { endCount: 0 }],
] as const) {
  test(`snapshot restores with ${name} setup preferences`, async ({ page }) => {
    await seedDraft(page, draft, preferences);
    await resume(page);

    await expect(page.getByRole("button", { name: "Panah 1, Skor 6", exact: true })).toBeVisible();
    await expect(page.getByRole("radio")).toHaveCount(0);
    expect((await storedDraft(page)).targetSnapshot).toEqual(draft.targetSnapshot);

    await page.reload();
    await resume(page);
    expect((await storedDraft(page)).ends).toEqual(draft.ends);
  });
}

test("legacy draft gains a target snapshot without changing its completion identity", async ({ page }) => {
  const { setup: ignored, sessionId: ignoredId, ...legacy } = legacyDraft;
  void ignored;
  void ignoredId;
  await seedDraft(page, legacy);
  const expectedId = await page.evaluate(async ({ legacy, setup }) => {
    const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify([setup, legacy])));
    return "legacy-" + Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, "0")).join("");
  }, { legacy, setup });

  await resume(page);

  expect(await storedDraft(page)).toMatchObject({ sessionId: expectedId, schemaVersion: 2 });
  expect((await storedDraft(page)).ends[0]).toEqual([
    { id: "1:1", status: "legacy", score: 6 }, { id: "1:2", status: "empty" },
  ]);
  await expect(page.getByRole("main").getByRole("alert")).toContainText("Periksa slot nol");
  await page.reload();
  await resume(page);
  await placeArrow(page, 1.2, 0);
  await finish(page);
  await expect(page.getByRole("heading", { name: "Hasil", exact: true })).toBeVisible();
  expect((await records(page)).receipts[0].sessionId).toBe(expectedId);
});

test("invalid explicit legacy snapshot is retained until an explicit discard", async ({ page }) => {
  const invalid = { ...legacyDraft, setup: null };
  await seedDraft(page, invalid);

  await expect(page.getByRole("main").getByRole("alert")).toContainText("Draft tidak valid");
  await expect(page.getByRole("button", { name: "Mulai Scoring" })).toBeDisabled();
  expect(await storedDraft(page)).toEqual(invalid);

  await page.getByRole("button", { name: "Buat sesi baru dan buang draft" }).click();
  expect(await storedDraft(page)).toBeNull();
  await expect(page.getByRole("button", { name: "Mulai Scoring" })).toBeEnabled();
});

test("snapshot restores the current end and all legacy score rows", async ({ page }) => {
  const session = {
    ...legacyDraft, setup: { ...setup, endCount: 2 }, currentEnd: 2,
    userScores: [[6, 3], [3, 0]],
  };
  await seedDraft(page, session, null);
  await page.getByRole("dialog").getByRole("button", { name: "Lanjutkan", exact: true }).click();

  await expect(page.getByRole("heading", { name: /Rambahan 2 dari 2/ })).toBeVisible();
  expect((await storedDraft(page)).ends[0].map((entry: { score: number }) => entry.score)).toEqual([6, 3]);
  expect((await storedDraft(page)).ends[1][1].status).toBe("empty");
  await page.getByRole("button", { name: "Kembali", exact: true }).click();
  await expect(page.getByRole("heading", { name: /Rambahan 1 dari 2/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Panah 1, Skor 6/ })).toBeVisible();
});

test("a completed legacy draft is recognized before converting its zeros", async ({ page }) => {
  const { setup: ignored, sessionId: ignoredId, ...legacy } = legacyDraft;
  void ignored;
  void ignoredId;
  await seedDraft(page, legacy);
  await resume(page);
  await placeArrow(page, 1.2, 0);
  await finish(page);
  await expect(page.getByRole("heading", { name: "Hasil", exact: true })).toBeVisible();
  await page.evaluate((legacy) => localStorage.setItem("endSession", JSON.stringify(legacy)), legacy);

  await page.reload();

  await expect(page.getByRole("main").getByRole("alert")).toContainText("Sesi ini sudah selesai");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(await storedDraft(page)).toBeNull();
  expect((await records(page)).practices).toHaveLength(1);
});

test("removed arrows require explicit placement rather than automatic misses", async ({ page }) => {
  await seedDraft(page);
  await resume(page);
  await page.getByRole("button", { name: "Cabut", exact: true }).click();

  await expect(page.getByRole("button", { name: "Selesai", exact: true })).toBeDisabled();
  expect((await storedDraft(page)).ends[0][0].status).toBe("empty");
  await placeArrow(page, 1.2, 0);
  await finish(page);
  await expect(page.getByRole("heading", { name: "Hasil", exact: true })).toBeVisible();
  expect((await records(page)).practices[0].userScores).toEqual([[0, 0]]);
  expect(await storedDraft(page)).toBeNull();
  await page.goto("/history/1");
  await expect(page.getByText(/Miss ditampilkan pada posisi/)).toBeVisible();
});

test("new sessions use Setting and preserve unfinished Setup fields", async ({ page }) => {
  await page.goto("/");
  const distance = page.getByLabel("Jarak (Meter)");
  for (const invalid of ["", "0", "151", "1.5"]) {
    await distance.fill(invalid);
    await page.getByRole("button", { name: "Mulai Scoring" }).click();
    await expect(page.getByRole("main").getByRole("alert")).toContainText("antara 1 dan 150");
    expect(await storedDraft(page)).toBeNull();
  }

  await distance.fill("18");
  await page.getByLabel("Nama Sesi / Catatan").fill("Latihan sore");
  await page.getByRole("link", { name: "Ubah target di Setting" }).click();
  await page.getByRole("button", { name: "Ring 6–10", exact: true }).click();
  await page.getByRole("button", { name: "Simpan target", exact: true }).click();
  await page.getByRole("link", { name: "Kembali ke latihan" }).click();

  await expect(page.getByLabel("Nama Sesi / Catatan")).toHaveValue("Latihan sore");
  await expect(page.getByLabel("Jarak (Meter)")).toHaveValue("18");
  await page.getByRole("button", { name: "Mulai Scoring" }).click();
  await expect(page.getByRole("heading", { name: /Rambahan 1 dari/ })).toBeVisible();
  const saved = await storedDraft(page);
  expect(saved.targetSnapshot.rings.map((ring: { score: number }) => ring.score)).toEqual([10, 9, 8, 7, 6]);
  expect(saved.endCount).toBe(4);
  expect(saved.arrowCount).toBe(5);
});
