import { expect, test, type Page } from "@playwright/test";
import { resume, storedDraft } from "./helpers";

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
