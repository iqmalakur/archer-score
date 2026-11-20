import { expect, test } from "@playwright/test";

test("target editor validates positive scores and persists color and geometry", async ({ page }) => {
  await page.goto("/setting");
  const score = page.getByLabel("Skor ring 1", { exact: true });
  await score.fill("0");
  await expect(page.getByRole("button", { name: "Simpan target", exact: true })).toBeDisabled();
  await score.fill("25");
  const color = page.getByLabel("Warna ring 1", { exact: true });
  await color.fill("#d8b578");
  await page.getByRole("button", { name: "Tambah ring" }).click();
  await page.getByRole("button", { name: "Simpan target", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("berhasil disimpan");
  await page.reload();

  await expect(score).toHaveValue("25");
  await page.screenshot({ path: "test-results/scoring-settings.png", fullPage: true });
  await expect(color).toHaveValue("#d8b578");
  await expect(page.locator(".target-ring")).toHaveCount(7);
  await score.fill("8");
  await page.getByRole("button", { name: "Batalkan perubahan" }).click();
  await expect(score).toHaveValue("25");
});

test("invalid saved target settings remain intact and save errors are visible", async ({ page }) => {
  await page.goto("/setting");
  await page.evaluate(() => localStorage.setItem("targetSettings", "damaged"));
  await page.reload();
  await expect(page.getByRole("status")).toContainText("tidak dapat dibaca");
  expect(await page.evaluate(() => localStorage.getItem("targetSettings"))).toBe("damaged");
  await page.evaluate(() => {
    Storage.prototype.setItem = () => { throw new DOMException("Synthetic failure", "SecurityError"); };
  });
  await page.getByRole("button", { name: "Simpan target", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Gagal menyimpan target");
});
