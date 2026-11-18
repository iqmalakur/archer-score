import { expect, test } from "@playwright/test";
import { draft, finish, holdWrites, resume, seedDraft, storedDraft } from "./helpers";

test("resume Escape preserves the draft and can reopen the dialog", async ({ page }) => {
  await seedDraft(page);
  const dialog = page.getByRole("dialog", { name: "Lanjutkan skoring?" });
  await expect(dialog).toHaveAccessibleDescription("Sesi skoring akan dilanjutkan dari rambahan terakhir.");
  await expect(dialog.getByRole("button", { name: "Buat ulang sesi" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  expect(await storedDraft(page)).toEqual(draft);
  await page.getByRole("button", { name: "Lanjutkan sesi tersimpan" }).click();
  await expect(dialog).toBeVisible();
  await resume(page);
});

test("confirmation contains keyboard focus and restores its trigger", async ({ page }) => {
  await seedDraft(page);
  await resume(page);
  const trigger = page.getByRole("main").getByRole("button", { name: "Selesai", exact: true });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Selesaikan skoring?" });
  const cancel = dialog.getByRole("button", { name: "Batal", exact: true });
  const confirm = dialog.getByRole("button", { name: "Selesai", exact: true });

  await expect(cancel).toBeFocused();
  await trigger.evaluate((button) => button.focus());
  await expect(cancel).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(confirm).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(cancel).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(confirm).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  expect(await storedDraft(page)).not.toBeNull();
});

test("pending save disables actions and prevents Escape", async ({ page }) => {
  await seedDraft(page);
  await resume(page);
  // A real conflicting transaction holds completion pending until released.
  const release = await holdWrites(page);

  await page.getByRole("button", { name: "Selesai", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Selesai", exact: true }).click();
  await expect(dialog).toHaveAttribute("aria-busy", "true");
  await expect(dialog.getByRole("button", { name: "Batal" })).toBeDisabled();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeVisible();
  await release();
  await expect(page.getByRole("heading", { name: "Hasil", exact: true })).toBeVisible();
});

test("pending deletion blocks Escape until the transaction completes", async ({ page }) => {
  await seedDraft(page);
  await resume(page);
  await finish(page);
  await expect(page.getByRole("heading", { name: "Hasil", exact: true })).toBeVisible();
  await page.goto("/history");
  await page.getByRole("button", { name: "Hapus Latihan uji", exact: true }).click();
  const release = await holdWrites(page);
  const dialog = page.getByRole("dialog", { name: "Hapus riwayat latihan?" });

  await dialog.getByRole("button", { name: "Ya, Hapus" }).click();

  await expect(dialog).toHaveAttribute("aria-busy", "true");
  await expect(dialog.getByRole("button", { name: "Batal" })).toBeDisabled();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeVisible();
  await release();
  await expect(page.getByRole("heading", { name: "Belum Ada Riwayat" })).toBeVisible();
});
