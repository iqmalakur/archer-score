import { expect, test } from "@playwright/test";

test("petung arrow renders, rotates, and shows details on desktop and mobile", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));

  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/arrow-preview");
    const model = page.getByRole("img", { name: "Model 3D panah bambu petung" });
    const point = page.getByRole("button", { name: "Ujung logam" });
    await expect(model).toBeVisible();
    await expect(point).toBeEnabled();
    const full = await model.screenshot();

    await point.click();
    await expect(point).toHaveAttribute("aria-pressed", "true");
    expect((await model.screenshot()).equals(full)).toBe(false);

    await page.getByRole("button", { name: "Bulu & nock" }).click();
    await page.screenshot({
      path: `test-results/petung-tail-${width}.png`, fullPage: true,
    });
    await page.getByRole("button", { name: "Panah utuh" }).click();
    const before = await model.screenshot();
    await page.getByRole("button", { name: "Putar panah ke kanan" }).click();
    expect((await model.screenshot()).equals(before)).toBe(false);
    await page.getByRole("button", { name: "Panah utuh" }).click();
    await page.screenshot({
      path: `test-results/petung-full-${width}.png`, fullPage: true,
    });

    expect(await page.evaluate(() =>
      document.documentElement.scrollWidth <= window.innerWidth,
    )).toBe(true);
  }

  expect(errors).toEqual([]);
});

test("petung preview reports unsupported WebGL without crashing", async ({ page }) => {
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement, type, ...args
    ) {
      if (type === "webgl2") return null;
      return Reflect.apply(getContext, this, [type, ...args]);
    } as typeof getContext;
  });

  await page.goto("/arrow-preview");

  await expect(page.getByRole("status")).toContainText("Preview 3D tidak tersedia");
  await expect(page.getByRole("button", { name: "Ujung logam" })).toBeDisabled();
});
