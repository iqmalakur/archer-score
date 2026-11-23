import { expect, test } from "@playwright/test";

test("the Manah logo links to practice and the browser uses its SVG icon", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/setting");

  const brand = page.getByRole("banner").getByRole("link", { name: "Manah", exact: true });
  const logo = brand.locator("img");
  await expect(logo).toBeVisible();
  await expect.poll(() => logo.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);

  await brand.click();

  await expect(page).toHaveURL("/");
  await expect(page).toHaveTitle("Manah");
  await expect(page.getByRole("heading", { name: "Siapkan latihan" })).toBeVisible();
  const icon = page.locator('link[rel="icon"]');
  await expect(icon).toHaveAttribute("type", "image/svg+xml");
  const response = await page.request.get((await icon.getAttribute("href"))!);
  expect(response.ok()).toBe(true);
  expect(response.headers()["content-type"]).toContain("image/svg+xml");
});
