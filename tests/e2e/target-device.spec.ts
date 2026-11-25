import { expect, test } from "@playwright/test";
import { emptyEnds } from "../../src/lib/target-session";
import { draft, resume, seedDraft, storedDraft } from "./helpers";

test("mobile native touch ignores the second pointer and cancels interrupted gestures", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true,
  });
  try {
    const page = await context.newPage();
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await seedDraft(page, { ...draft, ends: emptyEnds({ endCount: 1, arrowCount: 2 }) });
    await resume(page);
    const box = page.getByTestId("scoring-box");
    await box.scrollIntoViewIfNeeded();
    const bounds = (await box.boundingBox())!;
    const touch = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2, id: 1 };
    const second = { x: touch.x + 30, y: touch.y + 30, id: 2 };
    const cdp = await context.newCDPSession(page);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [touch] });
    await page.waitForTimeout(220);
    await expect(box).toHaveAttribute("data-aim-state", "aiming");
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [touch, second] });
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove", touchPoints: [touch, { ...second, x: bounds.x + bounds.width + 30 }],
    });
    await expect(box).toHaveAttribute("data-aim-state", "aiming");
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    expect((await storedDraft(page)).ends[0].map((entry: { status: string }) => entry.status))
      .toEqual(["hit", "empty"]);

    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [touch] });
    await page.waitForTimeout(220);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchCancel", touchPoints: [] });
    await expect(box).toHaveAttribute("data-aim-state", "ready");
    expect((await storedDraft(page)).ends[0][1].status).toBe("empty");
    await page.touchscreen.tap(
      bounds.x + bounds.width * (1.2 / 1.3 + 1) / 2, bounds.y + bounds.height / 2,
    );
    await expect(page.getByRole("button", { name: "Panah 2, Miss", exact: true })).toBeVisible();
    expect((await storedDraft(page)).ends[0].map((entry: { status: string }) => entry.status))
      .toEqual(["hit", "miss"]);
    expect(errors).toEqual([]);
    await page.screenshot({ path: "test-results/scoring-touch.png", fullPage: true });
  } finally {
    await context.close();
  }
});

test("arrows cast shadows from release, idle after impact, and free buffers on navigation", async ({ page }) => {
  await page.addInitScript(() => {
    const state = window as typeof window & {
      draws: number; deletions: number; framebuffers: number; framebufferDeletions: number;
      shadowDraws: number;
    };
    state.draws = 0;
    state.shadowDraws = 0;
    state.deletions = 0;
    state.framebuffers = 0;
    state.framebufferDeletions = 0;
    const draw = WebGL2RenderingContext.prototype.drawElements;
    const remove = WebGL2RenderingContext.prototype.deleteBuffer;
    const createFramebuffer = WebGL2RenderingContext.prototype.createFramebuffer;
    const deleteFramebuffer = WebGL2RenderingContext.prototype.deleteFramebuffer;
    WebGL2RenderingContext.prototype.createFramebuffer = function () {
      state.framebuffers++;
      return Reflect.apply(createFramebuffer, this, []);
    };
    WebGL2RenderingContext.prototype.deleteFramebuffer = function (framebuffer) {
      state.framebufferDeletions++;
      return Reflect.apply(deleteFramebuffer, this, [framebuffer]);
    };
    WebGL2RenderingContext.prototype.drawElements = function (...args) {
      state.draws++;
      if (this.getParameter(this.DRAW_FRAMEBUFFER_BINDING)) state.shadowDraws++;
      return Reflect.apply(draw, this, args);
    };
    WebGL2RenderingContext.prototype.deleteBuffer = function (...args) {
      state.deletions++;
      return Reflect.apply(remove, this, args);
    };
  });
  await seedDraft(page, { ...draft, arrowCount: 12, ends: emptyEnds({ endCount: 1, arrowCount: 12 }) });
  await resume(page);
  await expect(page.locator('[data-arrow-renderer="ready"]')).toBeVisible();
  const box = page.getByTestId("scoring-box");
  await box.scrollIntoViewIfNeeded();
  const bounds = (await box.boundingBox())!;
  await page.clock.install({ time: new Date("2026-01-01T12:00:00Z") });
  await page.clock.pauseAt(new Date("2026-01-01T12:01:00Z"));
  const shadowDraws = () => page.evaluate(() =>
    (window as typeof window & { shadowDraws: number }).shadowDraws);
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  await page.mouse.down();
  await page.clock.fastForward(200);
  await page.clock.fastForward(250);
  await expect(box).toHaveAttribute("data-aim-state", "aiming");
  expect(await shadowDraws()).toBe(0);

  await page.mouse.up();
  await page.clock.fastForward(210);
  expect(await shadowDraws()).toBeGreaterThan(0);
  await page.screenshot({ path: "test-results/scoring-shadow-in-flight.png" });
  await page.clock.fastForward(170);
  await box.screenshot({ path: "test-results/scoring-shadow-before-impact.png" });
  await page.clock.fastForward(330);
  await page.clock.resume();
  const counts = () => page.evaluate(() => {
    const state = window as typeof window & {
      draws: number; deletions: number; framebuffers: number; framebufferDeletions: number;
    };
    return {
      draws: state.draws, deletions: state.deletions,
      framebuffers: state.framebuffers, framebufferDeletions: state.framebufferDeletions,
    };
  });
  const before = await counts();
  await page.waitForTimeout(250);
  expect(await counts()).toEqual(before);
  expect(before.draws).toBeGreaterThan(0);
  expect(before.framebuffers).toBeGreaterThan(0);
  await page.getByTestId("scoring-box").screenshot({ path: "test-results/scoring-arrow-shadow.png" });

  await page.getByRole("link", { name: "Pengaturan", exact: true }).click();
  const cancel = page.getByRole("dialog", { name: "Batalkan latihan?" });
  await cancel.getByRole("button", { name: "Ya, batalkan" }).click();

  await expect(page.getByRole("heading", { name: "Pengaturan target" })).toBeVisible();
  expect((await counts()).deletions).toBeGreaterThan(before.deletions);
  expect((await counts()).framebufferDeletions).toBeGreaterThan(before.framebufferDeletions);
});
