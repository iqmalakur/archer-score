import { expect, test, type Page } from "@playwright/test";
import { classifyPoint } from "../../src/lib/target-geometry";
import { draft, finish, records, seedDraft } from "./helpers";

async function saveHistory(page: Page, endCount: number) {
  const points = [-0.45, 0, 0.45].flatMap((y) => [-0.45, 0, 0.45].map((x) => ({ x, y })));
  points.push({ x: 1.2, y: 0.4 }, { x: -1.2, y: -0.4 });
  const ends = Array.from({ length: endCount }, (_, end) => [
    ...points.map((point, index) => ({
      ...classifyPoint(draft.targetSnapshot, point)!, id: `${end + 1}:${index + 1}`,
    })),
    { id: `${end + 1}:12`, status: "legacy", score: 6 },
  ]);
  await seedDraft(page, { ...draft, endCount, arrowCount: 12, currentEnd: endCount, ends });
  await page.getByRole("dialog").getByRole("button", { name: "Lanjutkan", exact: true }).click();
  await expect(page.getByRole("heading", { name: `Rambahan ${endCount} dari ${endCount}` })).toBeVisible();
  await finish(page);
  await expect(page.getByRole("heading", { name: "Hasil", exact: true })).toBeVisible();
}

test("history shares one idle renderer across twenty ends and releases it on navigation", async ({ page }) => {
  await page.addInitScript(() => {
    const state = window as typeof window & {
      contexts: number; draws: number; deletions: number; opaqueClears: number;
    };
    state.contexts = 0;
    state.draws = 0;
    state.deletions = 0;
    state.opaqueClears = 0;
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type, ...args) {
      const context = Reflect.apply(getContext, this, [type, ...args]);
      if (type === "webgl2" && context) state.contexts++;
      return context;
    } as typeof getContext;
    const draw = WebGL2RenderingContext.prototype.drawElements;
    const remove = WebGL2RenderingContext.prototype.deleteBuffer;
    const clear = WebGL2RenderingContext.prototype.clear;
    WebGL2RenderingContext.prototype.clear = function (mask) {
      if ((mask & this.COLOR_BUFFER_BIT) && this.getParameter(this.COLOR_CLEAR_VALUE)[3] !== 0) {
        state.opaqueClears++;
      }
      return Reflect.apply(clear, this, [mask]);
    };
    WebGL2RenderingContext.prototype.drawElements = function (...args) {
      state.draws++;
      return Reflect.apply(draw, this, args);
    };
    WebGL2RenderingContext.prototype.deleteBuffer = function (...args) {
      state.deletions++;
      return Reflect.apply(remove, this, args);
    };
  });
  await saveHistory(page, 20);
  const saved = await records(page);

  await page.goto("/history/1");

  const section = page.locator('[aria-labelledby="ends-heading"]');
  await expect(section).toHaveAttribute("data-arrow-renderer", "ready");
  await expect(section.locator("canvas")).toHaveCount(1);
  await expect(section.locator("[data-history-end]")).toHaveCount(20);
  const first = section.locator('[data-history-end="0"]');
  await first.scrollIntoViewIfNeeded();
  await expect(first.locator("[data-arrow-id]")).toHaveCount(11);
  await expect(first.locator('[data-arrow-id="1:12"]')).toHaveCount(0);
  await first.screenshot({ path: "test-results/history-arrows-desktop.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  const last = section.locator('[data-history-end="19"]');
  await last.scrollIntoViewIfNeeded();
  await last.screenshot({ path: "test-results/history-arrows-mobile.png" });
  await expect(section).toHaveAttribute("data-arrow-renderer", "ready");
  const counts = () => page.evaluate(() => {
    const state = window as typeof window & {
      contexts: number; draws: number; deletions: number; opaqueClears: number;
    };
    return {
      contexts: state.contexts, draws: state.draws,
      deletions: state.deletions, opaqueClears: state.opaqueClears,
    };
  });
  await page.waitForTimeout(200);
  const before = await counts();
  expect(before.contexts).toBe(1);
  expect(before.opaqueClears).toBe(0);
  expect(before.draws).toBeGreaterThan(0);
  await page.waitForTimeout(200);
  expect(await counts()).toEqual(before);
  expect(await records(page)).toEqual(saved);

  await page.getByRole("link", { name: "Kembali ke Riwayat" }).click();

  await expect(page.getByRole("heading", { name: "Riwayat Latihan" })).toBeVisible();
  expect((await counts()).deletions).toBeGreaterThan(before.deletions);
});

test("history keeps spatial markers and legacy scores when WebGL is unavailable", async ({ page }) => {
  await saveHistory(page, 1);
  const saved = await records(page);
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type, ...args) {
      return type === "webgl2" ? null : Reflect.apply(original, this, [type, ...args]);
    } as typeof original;
  });

  await page.goto("/history/1");

  const section = page.locator('[aria-labelledby="ends-heading"]');
  await expect(section).toHaveAttribute("data-arrow-renderer", "unavailable");
  await expect(section.locator("[data-arrow-id]")).toHaveCount(11);
  await expect(section.locator("canvas")).toHaveCount(0);
  await expect(section.getByText("Miss", { exact: true })).toHaveCount(2);
  await expect(section.getByText("Panah 12", { exact: true })).toBeVisible();
  expect(await records(page)).toEqual(saved);
});
