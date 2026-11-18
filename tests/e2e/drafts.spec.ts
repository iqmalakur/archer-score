import { expect, test } from "@playwright/test";
import { draft, finish, records, resume, seedDraft, setup, storedDraft } from "./helpers";

for (const [name, preferences] of [
  ["different", { endCount: 4, arrowCount: 5, targetScores: [1, 2] }],
  ["missing", null], ["invalid", { endCount: 0 }],
] as const) {
  test(`snapshot restores with ${name} setup preferences`, async ({ page }) => {
    await seedDraft(page, draft, preferences);

    await resume(page);

    await expect(page.getByRole("radio")).toHaveCount(4);
    expect(await page.getByRole("radio").evaluateAll((inputs) =>
      inputs.map((input) => (input as HTMLInputElement).value))).toEqual(["3", "6", "3", "6"]);
    await expect(page.getByRole("radio", { name: "6", exact: true }).first()).toBeChecked();
    expect((await storedDraft(page)).setup).toEqual(setup);

    await page.reload();
    await resume(page);
    await expect(page.getByRole("radio")).toHaveCount(4);
  });
}

test("legacy draft gains a snapshot without changing its completion identity", async ({ page }) => {
  const { setup: ignored, sessionId: ignoredId, ...legacy } = draft;
  void ignored;
  void ignoredId;
  await seedDraft(page, legacy);
  const expectedId = await page.evaluate(async ({ legacy, setup }) => {
    const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify([setup, legacy])));
    return "legacy-" + Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, "0")).join("");
  }, { legacy, setup });

  await resume(page);

  expect(await storedDraft(page)).toMatchObject({ sessionId: expectedId, setup });
  await page.reload();
  await resume(page);
  await finish(page);
  await expect(page.getByRole("heading", { name: "Hasil", exact: true })).toBeVisible();
  expect((await records(page)).receipts[0].sessionId).toBe(expectedId);
});

test("invalid explicit snapshot is retained until an explicit reset", async ({ page }) => {
  const invalid = { ...draft, setup: null };
  await seedDraft(page, invalid);

  await expect(page.getByRole("main").getByRole("alert")).toContainText("Draft tidak valid");
  await expect(page.getByRole("button", { name: "Mulai Scoring" })).toBeDisabled();
  expect(await storedDraft(page)).toEqual(invalid);

  await page.getByRole("button", { name: "Buat sesi baru dan buang draft" }).click();
  expect(await storedDraft(page)).toBeNull();
  await expect(page.getByRole("button", { name: "Mulai Scoring" })).toBeEnabled();
});

test("snapshot restores the current end and all score rows", async ({ page }) => {
  const session = {
    ...draft, setup: { ...setup, endCount: 2 }, currentEnd: 2, userScores: [[6, 3], [3, 0]],
  };
  await seedDraft(page, session, null);

  await page.getByRole("dialog").getByRole("button", { name: "Lanjutkan", exact: true }).click();

  await expect(page.getByRole("heading", { name: /Rambahan 2 dari 2/ })).toBeVisible();
  await expect(page.getByRole("radio", { name: "3", exact: true }).first()).toBeChecked();
  expect((await storedDraft(page)).userScores).toEqual([[6, 3], [3, 0]]);
  await page.getByRole("button", { name: "Kembali", exact: true }).click();
  await expect(page.getByRole("heading", { name: /Rambahan 1 dari 2/ })).toBeVisible();
  await expect(page.getByRole("radio", { name: "6", exact: true }).first()).toBeChecked();
});

test("a completed legacy draft is recognized before adding its snapshot", async ({ page }) => {
  const { setup: ignored, sessionId: ignoredId, ...legacy } = draft;
  void ignored;
  void ignoredId;
  await seedDraft(page, legacy);
  await resume(page);
  await finish(page);
  await expect(page.getByRole("heading", { name: "Hasil", exact: true })).toBeVisible();
  await page.evaluate((legacy) => localStorage.setItem("endSession", JSON.stringify(legacy)), legacy);

  await page.reload();

  await expect(page.getByRole("main").getByRole("alert")).toContainText("Sesi ini sudah selesai");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(await storedDraft(page)).toBeNull();
  expect((await records(page)).practices).toHaveLength(1);
});

test("unfilled and cleared arrows count as misses without adding ring choices", async ({ page }) => {
  await seedDraft(page);
  await resume(page);

  await page.getByRole("button", { name: "Hapus skor Panah 1" }).click();

  await expect(page.getByRole("radio", { name: "0", exact: true })).toHaveCount(0);
  await finish(page);
  await expect(page.getByRole("heading", { name: "Hasil", exact: true })).toBeVisible();
  expect((await records(page)).practices[0].userScores).toEqual([[0, 0]]);
  expect(await storedDraft(page)).toBeNull();
  await page.goto("/history/1");
  await expect(page.getByText("Panah yang tidak diisi dianggap meleset dan bernilai 0.")).toBeVisible();
});

test("new sessions persist their configuration and reject invalid distances", async ({ page }) => {
  await page.goto("/");
  const distance = page.getByLabel("Jarak (Meter)");

  for (const invalid of ["", "0", "151", "1.5"]) {
    await distance.fill(invalid);
    await page.getByRole("button", { name: "Mulai Scoring" }).click();

    await expect(page.getByRole("main").getByRole("alert")).toContainText("antara 1 dan 150");
    expect(await storedDraft(page)).toBeNull();
  }

  await distance.fill("18");
  await page.getByRole("button", { name: "Ring 6 - 10", exact: true }).click();
  await page.getByRole("button", { name: "Mulai Scoring" }).click();
  await expect(page.getByRole("heading", { name: /Rambahan 1 dari/ })).toBeVisible();
  expect((await storedDraft(page)).setup).toEqual({
    endCount: 4, arrowCount: 5, targetScores: [6, 7, 8, 9, 10],
  });
});
