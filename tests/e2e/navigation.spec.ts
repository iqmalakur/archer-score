import { expect, test, type Page } from "@playwright/test";
import { draft, finish, records, resume, seedDraft, storedDraft } from "./helpers";

function mainNavigation(page: Page) {
  return page.getByRole("navigation", { name: "Navigasi utama" });
}

async function expectNoHorizontalScroll(page: Page) {
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth))
    .toBe(320);
}

test.describe("phone navigation", () => {
  test.use({ viewport: { width: 320, height: 667 }, isMobile: true, hasTouch: true });

  test("keeps tabs and controls reachable and restores an active draft", async ({ page }) => {
    await page.goto("/");
    const nav = mainNavigation(page);
    const practice = nav.getByRole("link", { name: "Latihan", exact: true });
    const history = nav.getByRole("link", { name: "Riwayat", exact: true });
    const settings = nav.getByRole("link", { name: "Pengaturan", exact: true });

    await expect(practice).toHaveAttribute("aria-current", "page");
    await expect(nav).toHaveCSS("position", "fixed");
    await expectNoHorizontalScroll(page);

    await settings.tap();

    await expect(settings).toHaveAttribute("aria-current", "page");
    await expect(page.getByRole("heading", { name: "Pengaturan target" })).toBeVisible();
    await expectNoHorizontalScroll(page);
    await page.getByRole("button", { name: "Simpan target", exact: true }).tap();
    await expect(page.getByRole("status")).toContainText("berhasil disimpan");
    const tabs = (await nav.boundingBox())!;
    expect(tabs.y + tabs.height).toBeCloseTo(667, 0);
    expect(await page.locator("body").evaluate((body) =>
      Number.parseFloat(getComputedStyle(body).paddingBottom))).toBeGreaterThanOrEqual(tabs.height);

    await practice.tap();
    await page.getByRole("button", { name: "Mulai latihan", exact: true }).tap();
    await page.getByTestId("scoring-box").tap();
    await expect(page.getByRole("button", { name: /^Panah 1, Skor / })).toBeVisible();
    const saved = await storedDraft(page);
    await expectNoHorizontalScroll(page);

    await history.tap();

    await expect(history).toHaveAttribute("aria-current", "page");
    await expect(page.getByRole("heading", { name: "Belum Ada Riwayat" })).toBeVisible();
    await expectNoHorizontalScroll(page);

    await page.goBack();
    await resume(page);

    await expect(practice).toHaveAttribute("aria-current", "page");
    expect(await storedDraft(page)).toEqual(saved);
  });
});

test("desktop navigation supports keyboard focus and preserves the selected theme", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  const nav = mainNavigation(page);
  const history = nav.getByRole("link", { name: "Riwayat", exact: true });
  const settings = nav.getByRole("link", { name: "Pengaturan", exact: true });
  const theme = page.getByRole("button", { name: "Ganti tema terang/gelap" });
  const root = page.locator("html");

  await expect(nav).toHaveCSS("position", "static");
  await expect(root).toHaveAttribute("data-theme", "light");
  await settings.focus();
  await page.keyboard.press("Shift+Tab");
  await expect(history).toBeFocused();
  await expect(history).toHaveCSS("outline-style", "solid");
  await page.keyboard.press("Enter");

  await expect(page).toHaveURL("/history");
  await expect(history).toHaveAttribute("aria-current", "page");

  await theme.press("Enter");
  await expect(root).toHaveAttribute("data-theme", "dark");
  await page.reload();

  await expect(root).toHaveAttribute("data-theme", "dark");
});

test("history detail links support Back and Forward and restore row focus", async ({ page }) => {
  await seedDraft(page);
  await resume(page);
  await finish(page);
  await expect(page.getByRole("heading", { name: "Hasil Latihan", exact: true })).toBeVisible();
  await mainNavigation(page).getByRole("link", { name: "Riwayat", exact: true }).click();
  const row = page.getByRole("link", { name: "Lihat detail Latihan uji" });
  const detail = page.getByRole("heading", { name: "Latihan uji", exact: true });
  const documents: string[] = [];
  page.on("request", (request) => {
    if (request.isNavigationRequest()) documents.push(request.url());
  });

  await expect(row).toHaveAttribute("href", "/history?id=1");
  await row.press("Enter");
  await expect(page).toHaveURL("/history?id=1");
  await expect(detail).toBeVisible();

  await page.goBack();
  await expect(page).toHaveURL("/history");
  await expect(row).toBeFocused();

  await page.goForward();
  await expect(detail).toBeVisible();
  await page.getByRole("button", { name: "Kembali ke Riwayat" }).click();
  await expect(page).toHaveURL("/history");
  await expect(row).toBeFocused();
  expect(documents).toEqual([]);
});

test("direct history detail validates query changes and returns to the list", async ({ page }) => {
  const second = {
    ...draft,
    sessionId: "a588bb53-2552-4bf4-a814-c31fac4ec482",
    title: "Latihan kedua",
  };

  for (const practice of [draft, second]) {
    await seedDraft(page, practice);
    await resume(page);
    await finish(page);
    await expect(page.getByRole("heading", { name: "Hasil Latihan", exact: true })).toBeVisible();
  }

  await page.goto("/setting");
  await page.goto("/history?id=");
  const detail = page.getByRole("heading", { name: "Latihan uji", exact: true });

  await expect(page.getByRole("heading", { name: "ID Riwayat Tidak Valid" })).toBeVisible();
  await page.evaluate(() => history.replaceState(null, "", "/history?id=1"));
  await expect(detail).toBeVisible();

  await page.evaluate(() => history.replaceState(null, "", "/history?id=2"));
  await expect(page.getByRole("heading", { name: "Latihan kedua", exact: true })).toBeVisible();
  await expect(detail).toHaveCount(0);

  await page.evaluate(() => history.replaceState(null, "", "/history?id=3"));
  await expect(page.getByRole("heading", { name: "Riwayat Tidak Ditemukan" })).toBeVisible();

  await page.getByRole("button", { name: "Kembali ke Riwayat" }).click();
  await expect(page).toHaveURL("/history");
  await expect(page.getByRole("heading", { name: "Riwayat Latihan" })).toBeFocused();

  await page.goBack();
  await expect(page).toHaveURL("/setting");
});

test("browser Back exits the result and keeps the saved practice", async ({ page }) => {
  await seedDraft(page);
  await resume(page);
  await finish(page);
  await expect(page.getByRole("heading", { name: "Hasil Latihan", exact: true })).toBeVisible();
  const saved = await records(page);

  await page.goBack();

  await expect(page).toHaveURL("/");
  await expect(page.getByRole("heading", { name: "Siapkan latihan" })).toBeVisible();
  expect(saved.practices).toHaveLength(1);
  expect(saved.receipts).toHaveLength(1);
  expect(await records(page)).toEqual(saved);
  expect(await storedDraft(page)).toBeNull();

  await page.goBack();
  await expect(page).toHaveURL("/setting");
});

test("browser Back moves through new ends and preserves scores after a draft write fails", async ({ page }) => {
  await page.goto("/");
  const fewerArrows = page.getByRole("button", { name: "Kurangi panah" });
  for (let count = 0; count < 4; count++) await fewerArrows.click();
  await page.getByRole("button", { name: "Mulai latihan" }).click();

  const board = page.getByTestId("scoring-box");
  const next = page.getByRole("button", { name: "Lanjut", exact: true });
  for (let end = 1; end <= 2; end++) {
    await expect(page.getByRole("heading", { name: `Rambahan ${end} dari 4` })).toBeVisible();
    await board.press("Enter");
    await next.click();
  }
  const saved = await storedDraft(page);

  await page.goBack();

  await expect(page.getByRole("heading", { name: "Rambahan 2 dari 4" })).toBeVisible();
  expect(await storedDraft(page)).toEqual({ ...saved, currentEnd: 2 });

  await page.evaluate(() => {
    const setItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === "endSession") {
        Storage.prototype.setItem = setItem;
        throw new DOMException("Synthetic draft write failure", "QuotaExceededError");
      }

      setItem.call(this, key, value);
    };
  });
  await page.goBack();

  await expect(page.getByRole("heading", { name: "Rambahan 1 dari 4" })).toBeVisible();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("Gagal menyimpan draft");
  await expect(page.getByRole("button", { name: /^Panah 1, Skor / })).toBeVisible();
  expect(await storedDraft(page)).toEqual({ ...saved, currentEnd: 2 });
  await page.getByRole("button", { name: "Coba simpan draft lagi" }).click();
  expect(await storedDraft(page)).toEqual({ ...saved, currentEnd: 1 });
});

test("browser Back moves to the previous end of a resumed draft", async ({ page }) => {
  const secondEnd = draft.ends[0].map((entry, index) => ({ ...entry, id: `2:${index + 1}` }));
  const saved = { ...draft, endCount: 2, currentEnd: 2, ends: [...draft.ends, secondEnd] };
  await seedDraft(page, saved);
  await page.getByRole("dialog").getByRole("button", { name: "Lanjutkan", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Rambahan 2 dari 2" })).toBeVisible();

  await page.goBack();

  await expect(page).toHaveURL("/");
  await expect(page.getByRole("heading", { name: "Rambahan 1 dari 2" })).toBeVisible();
  expect(await storedDraft(page)).toEqual({ ...saved, currentEnd: 1 });
});
