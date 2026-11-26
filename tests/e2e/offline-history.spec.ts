import { expect, test, type Page } from "@playwright/test";
import { finish, resume, seedDraft } from "./helpers";

async function savePractice(page: Page) {
  await seedDraft(page);
  await resume(page);
  await finish(page);
  await expect(page.getByRole("heading", { name: "Hasil Latihan", exact: true })).toBeVisible();
}

async function waitForHistoryCache(page: Page) {
  await expect.poll(() => page.evaluate(async () => {
    const history = await caches.match("/history", { cacheName: "manah-history-v1" });
    return Boolean(navigator.serviceWorker.controller && history);
  }), { timeout: 10_000 }).toBe(true);
}

test("an unvisited history detail opens and reloads offline after preparation", async ({ context, page }) => {
  await page.addInitScript(() => {
    const fetch = window.fetch.bind(window);
    window.fetch = (input, init) => {
      const url = new URL(input instanceof Request ? input.url : input, location.href);
      if (navigator.onLine && url.pathname === "/history" && url.searchParams.has("_rsc")) {
        return Promise.reject(new TypeError("History prefetch disabled for this test"));
      }

      return fetch(input, init);
    };
  });
  await savePractice(page);
  await waitForHistoryCache(page);
  const detailUrl = "/history?id=1";
  const hasPrefetch = await page.evaluate(async () => {
    const cache = await caches.open("app-v1");
    return (await cache.keys()).some((request) => {
      const url = new URL(request.url);
      return url.pathname === "/history" && url.searchParams.has("_rsc");
    });
  });
  expect(hasPrefetch).toBe(false);

  await context.setOffline(true);
  await page.getByRole("navigation", { name: "Navigasi utama" })
    .getByRole("link", { name: "Riwayat", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Riwayat Latihan" })).toBeVisible();

  await page.getByRole("link", { name: "Lihat detail Latihan uji" }).click();
  await expect(page).toHaveURL(detailUrl);
  await expect(page.getByRole("heading", { name: "Latihan uji", exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Kembali ke Riwayat" }).click();
  await expect(page).toHaveURL("/history");
  const row = page.getByRole("link", { name: "Lihat detail Latihan uji" });
  await expect(row).toBeFocused();
  await row.click();
  await expect(page).toHaveURL(detailUrl);

  const reloaded = await page.reload();
  expect(reloaded?.fromServiceWorker()).toBe(true);
  await expect(page).toHaveURL(detailUrl);
  await expect(page.getByRole("heading", { name: "Latihan uji", exact: true })).toBeVisible();

  const tab = await context.newPage();
  const response = await tab.goto(detailUrl);
  expect(response?.fromServiceWorker()).toBe(true);
  await expect(tab).toHaveURL(detailUrl);
  await expect(tab.getByRole("heading", { name: "Latihan uji", exact: true })).toBeVisible();
});

test("a failed asset refresh retains the usable History document", async ({ context, page }) => {
  await page.goto("/");
  await waitForHistoryCache(page);

  const warning = page.waitForEvent("console", {
    predicate: (message) => message.text().includes("Could not prepare History for offline use"),
  });

  await page.evaluate(() => {
    const fetch = window.fetch.bind(window);
    window.fetch = (input, init) => {
      if (input !== "/history") return fetch(input, init);

      return Promise.resolve(new Response(
        '<script src="/_next/static/missing-history-fixture.js"></script>',
        { headers: { "Content-Type": "text/html" } },
      ));
    };
    window.dispatchEvent(new Event("online"));
  });
  await warning;

  await context.setOffline(true);
  const response = await page.goto("/history");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { name: "Belum Ada Riwayat" })).toBeVisible();
});

test("the offline status page follows Panara theme and retries the original detail", async ({ context, page }) => {
  await savePractice(page);
  await waitForHistoryCache(page);
  await page.evaluate(() => caches.delete("manah-history-v1"));
  await context.setOffline(true);
  const detailUrl = "/history?id=1";
  const offlineHeading = page.getByRole("heading", { name: "Halaman belum tersedia offline" });
  const retry = page.getByRole("button", { name: "Muat Ulang" });
  const themes = [
    { device: "light", saved: "dark", expected: "dark", background: "rgb(16, 28, 23)" },
    { device: "dark", saved: "light", expected: "light", background: "rgb(246, 244, 236)" },
    { device: "dark", saved: null, expected: "dark", background: "rgb(16, 28, 23)" },
    { device: "light", saved: null, expected: "light", background: "rgb(246, 244, 236)" },
  ] as const;

  for (const theme of themes) {
    await page.emulateMedia({ colorScheme: theme.device });
    await page.evaluate((saved) => {
      if (saved === null) localStorage.removeItem("theme");
      else localStorage.setItem("theme", saved);
    }, theme.saved);

    const response = await page.goto(detailUrl);
    expect(response?.status()).toBe(503);
    expect(response?.fromServiceWorker()).toBe(true);
    await expect(page).toHaveTitle("Halaman belum tersedia offline · Panara");
    await expect(offlineHeading).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme.expected);
    await expect(page.locator("body")).toHaveCSS("background-color", theme.background);
  }

  await page.setViewportSize({ width: 320, height: 667 });
  await expect(offlineHeading).toBeVisible();
  expect(await page.locator("html").evaluate((root) => root.scrollWidth)).toBe(320);
  await page.keyboard.press("Tab");
  await expect(retry).toBeFocused();
  await expect(retry).toHaveCSS("outline-style", "solid");

  await context.setOffline(false);
  await retry.press("Enter");
  await expect(page).toHaveURL(detailUrl);
  await expect(page.getByRole("heading", { name: "Latihan uji", exact: true })).toBeVisible();
});

test("the offline status page can open Practice before its first visit", async ({ context, page }) => {
  await page.goto("/setting");
  await expect.poll(() => page.evaluate(async () => {
    const practice = await caches.match("/", { cacheName: "manah-home-v1" });
    return Boolean(navigator.serviceWorker.controller && practice);
  }), { timeout: 10_000 }).toBe(true);

  await context.setOffline(true);
  const response = await page.goto("/uncached-offline-page");
  const practice = page.getByRole("link", { name: "Kembali ke Latihan" });

  expect(response?.status()).toBe(503);
  await expect(practice).toHaveAttribute("href", "/");
  await practice.press("Enter");

  await expect(page).toHaveURL("/");
  await expect(page.getByRole("heading", { name: "Siapkan latihan" })).toBeVisible();
  await page.getByRole("button", { name: "Mulai latihan" }).click();
  await expect(page.getByRole("heading", { name: /Rambahan 1 dari/ })).toBeVisible();
});
