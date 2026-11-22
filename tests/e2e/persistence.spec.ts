import { expect, test } from "@playwright/test";
import { draft, fault, finish, installFaults, placeArrow, records, resume, seedDraft, storedDraft } from "./helpers";

for (const store of ["practices", "completedSessions"]) {
  test(`${store} write failure retains draft and rolls back completion`, async ({ page }) => {
    await installFaults(page);
    await seedDraft(page);
    await resume(page);
    await fault(page, `${store}:add`);
    await finish(page);
    const dialog = page.getByRole("dialog");
    await expect(dialog).toContainText("Gagal menyimpan latihan");
    expect(await storedDraft(page)).toEqual(draft);
    expect(await records(page)).toEqual({ practices: [], receipts: [] });
    await fault(page);
    await dialog.getByRole("button", { name: "Coba lagi" }).click();
    await expect(page.getByRole("heading", { name: "Hasil Latihan", exact: true })).toBeVisible();
    const saved = await records(page);
    expect(saved.practices).toHaveLength(1);
    expect(saved.receipts).toEqual([{ sessionId: draft.sessionId, practiceId: saved.practices[0].id }]);
    expect(await storedDraft(page)).toBeNull();
  });
}

test("two tabs completing the same session create one history record", async ({ page, context }) => {
  await seedDraft(page);
  await resume(page);
  const second = await context.newPage();
  await second.goto("/");
  await resume(second);
  await second.getByRole("button", { name: "Panah 2, Miss", exact: true }).click();
  await second.getByRole("button", { name: "Cabut", exact: true }).click();
  await placeArrow(second);

  await Promise.all([finish(page), finish(second)]);
  for (const tab of [page, second]) {
    await expect(tab.getByRole("heading", { name: "Hasil Latihan", exact: true })).toBeVisible();
  }
  const saved = await records(page);
  expect(saved.practices).toHaveLength(1);
  expect(saved.receipts).toHaveLength(1);
  const total = saved.practices[0].userScores[0].reduce((sum, score) => sum + score, 0);
  for (const tab of [page, second]) {
    const ends = tab.getByRole("region", { name: "Rincian Rambahan" });
    await expect(ends.getByText(`${total} / 12`, { exact: true })).toBeVisible();
  }
});

test("cleanup failure cannot resume or resurrect a completed and deleted practice", async ({ page }) => {
  await installFaults(page);
  await seedDraft(page);
  await resume(page);
  await fault(page, "cleanup");
  await finish(page);
  await expect(page.getByRole("heading", { name: "Hasil Latihan", exact: true })).toBeVisible();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("draft belum dapat dihapus");
  expect(await storedDraft(page)).not.toBeNull();
  await page.reload();
  await expect(page.getByRole("alert").first()).toContainText("Sesi ini sudah selesai");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.goto("/history");
  await page.getByRole("button", { name: "Hapus Latihan uji", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Ya, Hapus" }).click();
  await expect(page.getByRole("heading", { name: "Belum Ada Riwayat" })).toBeVisible();
  await page.goto("/");
  await expect(page.getByRole("alert").first()).toContainText("Sesi ini sudah selesai");
  expect((await records(page)).practices).toHaveLength(0);
  expect((await records(page)).receipts).toHaveLength(1);
  await fault(page);
  await page.getByRole("button", { name: "Coba hapus draft lagi" }).click();
  expect(await storedDraft(page)).toBeNull();
});

test("history read and delete failures expose retry without losing the record", async ({ page }) => {
  await installFaults(page);
  await seedDraft(page);
  await resume(page);
  await finish(page);
  await expect(page.getByRole("heading", { name: "Hasil Latihan", exact: true })).toBeVisible();
  await fault(page, "practices:read");
  await page.goto("/history");
  await expect(page.getByRole("heading", { name: "Gagal Memuat Riwayat" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Belum Ada Riwayat" })).toHaveCount(0);
  await fault(page);
  await page.getByRole("button", { name: "Coba lagi", exact: true }).click();
  const remove = page.getByRole("button", { name: "Hapus Latihan uji", exact: true });
  await expect(remove).toBeVisible();
  await remove.click();
  let dialog = page.getByRole("dialog", { name: "Hapus riwayat latihan?" });
  await expect(dialog.getByRole("button", { name: "Batal" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(remove).toBeFocused();
  await remove.click();
  dialog = page.getByRole("dialog");
  await fault(page, "practices:delete");
  await dialog.getByRole("button", { name: "Ya, Hapus" }).click();
  await expect(dialog).toContainText("Riwayat belum berhasil dihapus");
  expect((await records(page)).practices).toHaveLength(1);
  await fault(page);
  await dialog.getByRole("button", { name: "Coba lagi", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Belum Ada Riwayat" })).toBeVisible();
});

test("schema migration preserves version-one history", async ({ page }) => {
  await page.goto("/setting");
  await page.evaluate(() => new Promise<void>((resolve, reject) => {
    // Dexie maps version(1) to native IndexedDB version 10.
    const request = indexedDB.open("ArcherScoreDB", 10);
    request.onupgradeneeded = () => {
      const store = request.result.createObjectStore("practices", { keyPath: "id", autoIncrement: true });
      for (const key of ["createdAt", "distance", "title"]) store.createIndex(key, key);
    };
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const database = request.result;
      const tx = database.transaction("practices", "readwrite");
      tx.objectStore("practices").add({
        title: "Latihan lama", createdAt: new Date(), distance: 18,
        endCount: 1, arrowCount: 2, targetScores: [3, 6], userScores: [[6, 0]],
      });
      tx.oncomplete = () => { database.close(); resolve(); };
      tx.onerror = () => { database.close(); reject(tx.error); };
    };
  }));
  await page.goto("/history");
  await expect(page.getByRole("link", { name: "Lihat detail Latihan lama" })).toBeVisible();
  const saved = await records(page);
  expect(saved.practices).toMatchObject([{ id: 1, userScores: [[6, 0]] }]);
  expect(saved.receipts).toHaveLength(0);
  await page.getByRole("link", { name: "Lihat detail Latihan lama" }).click();
  await expect(page.getByRole("heading", { name: "Latihan lama", exact: true })).toBeVisible();
});
