import { expect, test } from "@playwright/test";

const siteOrigin = new URL(
  process.env.SITE_URL || "https://panara.akur.dev",
).origin;
const landingUrl = new URL("/landing", siteOrigin).href;
const previewImage = "/brand/panara-open-graph.jpg";

test.use({ javaScriptEnabled: false });

test("landing content and practice link render without JS", async ({ page }) => {
  await page.goto("/landing");

  const heading = page.getByRole("heading", {
    name: "Catat skor latihan panahan dengan Panara",
    level: 1,
    exact: true,
  });
  const practiceLink = page.getByRole("region", {
    name: "Catat skor latihan panahan dengan Panara",
  }).getByRole("link", {
    name: "Mulai latihan",
    exact: true,
  });
  await expect(heading).toBeVisible();
  await expect(practiceLink).toHaveAttribute("href", "/");
});

test("both page URLs are canonical and indexable", async ({ page, request }) => {
  const canonical = page.locator('head link[rel="canonical"]');
  const noindex = page.locator('head meta[name="robots"][content*="noindex"]');

  await page.goto("/");

  await expect(canonical).toHaveAttribute("href", siteOrigin);
  await expect(noindex).toHaveCount(0);

  await page.goto("/landing");

  await expect(canonical).toHaveAttribute("href", landingUrl);
  await expect(noindex).toHaveCount(0);
  await expect(page.locator('head meta[property="og:image"]')).toHaveAttribute(
    "content",
    new URL(previewImage, siteOrigin).href,
  );

  const image = await request.get(previewImage);

  await expect(image).toBeOK();
  expect(image.headers()["content-type"]).toContain("image/jpeg");
});

test("robots allows crawlers and points to the sitemap", async ({ request }) => {
  const [robots, sitemap] = await Promise.all([
    request.get("/robots.txt"),
    request.get("/sitemap.xml"),
  ]);

  await expect(robots).toBeOK();
  await expect(sitemap).toBeOK();

  const robotsRules = await robots.text();
  expect(robotsRules).toMatch(/^User-Agent: \*$/im);
  expect(robotsRules).toMatch(/^Allow: \/$/im);
  expect(robotsRules).not.toMatch(/^Disallow:[^\S\r\n]*\S/im);
  expect(robotsRules).toContain(`Sitemap: ${siteOrigin}/sitemap.xml`);

  const sitemapXml = await sitemap.text();
  const sitemapUrls = Array.from(
    sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g),
    ([, url]) => new URL(url).href,
  );
  expect(sitemapUrls.sort()).toEqual([`${siteOrigin}/`, landingUrl]);
});

const utilityRoutes = ["/history", "/setting", "/arrow-preview", "/offline.html"];

for (const path of utilityRoutes) {
  test(`${path} serves a noindex directive`, async ({ page }) => {
    const response = await page.goto(path);

    expect(response?.ok()).toBe(true);
    const robots = page.locator('head meta[name="robots"]');
    await expect(robots).toHaveAttribute("content", /\bnoindex\b/i);
  });
}
