import { expect, test, type Locator, type Page } from "@playwright/test";
import { emptyEnds } from "../../src/lib/target-session";
import { draft, legacyDraft, placeArrow, records, resume, seedDraft, storedDraft, finish } from "./helpers";

async function emptySession(page: Page, arrowCount = 3, endCount = 1) {
  await seedDraft(page, {
    ...draft, arrowCount, endCount, ends: emptyEnds({ arrowCount, endCount }),
  });
  await resume(page);
}

test.describe("short phone scoring", () => {
  test.use({ viewport: { width: 320, height: 568 }, isMobile: true, hasTouch: true });

  test("session actions stay reachable on a short phone with hidden tabs", async ({ page }) => {
    await emptySession(page, 1, 2);
    const box = page.getByTestId("scoring-box");
    const next = page.getByRole("button", { name: "Lanjut", exact: true });
    const back = page.getByRole("button", { name: "Kembali", exact: true });
    const finish = page.getByRole("button", { name: "Selesai", exact: true });
    const tabs = page.getByRole("navigation", { name: "Navigasi utama" });
    const actions = page.locator(".scoring-navigation");
    const scrollPosition = () => page.evaluate(() => window.scrollY);

    async function tapVisible(control: Locator) {
      await expect(control).toBeVisible();
      const bounds = (await control.boundingBox())!;
      const point = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };

      expect(bounds.y).toBeGreaterThanOrEqual(0);
      expect(bounds.y + bounds.height).toBeLessThanOrEqual(568);
      expect(await control.evaluate((element, { x, y }) =>
        element.contains(document.elementFromPoint(x, y)), point)).toBe(true);

      await page.touchscreen.tap(point.x, point.y);
    }

    await expect(tabs).toBeHidden();
    await expect(next).toBeDisabled();
    await expect.poll(async () => {
      const board = (await box.boundingBox())!;
      const bar = (await actions.boundingBox())!;
      return bar.y - (board.y + board.height);
    }).toBeGreaterThanOrEqual(4);

    await tapVisible(box);
    await expect(next).toBeEnabled();
    await tapVisible(next);

    await expect(page.getByRole("heading", { name: "Rambahan 2 dari 2" })).toBeVisible();
    await expect(finish).toBeDisabled();
    await tapVisible(back);

    await expect(page.getByRole("heading", { name: "Rambahan 1 dari 2" })).toBeVisible();
    await tapVisible(next);
    await tapVisible(box);

    await expect(finish).toBeEnabled();
    expect(await scrollPosition()).toBe(0);

    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await tapVisible(page.getByRole("button", { name: "Reset rambahan", exact: true }));

    const reset = page.getByRole("dialog", { name: "Reset rambahan ini?" });
    await reset.getByRole("button", { name: "Batal", exact: true }).tap();
    await page.evaluate(() => window.scrollTo(0, 0));
    await tapVisible(finish);

    const save = page.getByRole("dialog", { name: "Selesaikan skoring?" });
    await save.getByRole("button", { name: "Selesai", exact: true }).tap();
    await expect(page.getByRole("heading", { name: "Hasil Latihan" })).toBeVisible();
    await expect(tabs).toBeVisible();
  });
});

test("hold shows exact aim feedback; box exit stays canceled; spatial misses survive reload", async ({ page }) => {
  await emptySession(page);
  const box = page.getByTestId("scoring-box");
  await box.scrollIntoViewIfNeeded();
  const bounds = (await box.boundingBox())!;
  const center = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };

  for (const outside of [
    { x: bounds.x - 5, y: center.y },
    { x: bounds.x + bounds.width + 5, y: center.y },
    { x: center.x, y: bounds.y - 5 },
    { x: center.x, y: bounds.y + bounds.height + 5 },
  ]) {
    await page.mouse.move(center.x, center.y);
    await page.mouse.down();
    await page.waitForTimeout(220);
    await expect(page.getByTestId("aim-reticle")).toBeVisible();
    await expect(page.getByTestId("aim-magnifier")).toBeVisible();
    await page.mouse.move(outside.x, outside.y);
    await expect(box).toHaveAttribute("data-aim-state", "canceled");
    await expect(page.getByText(/Bidikan dibatalkan — lepaskan/)).toBeVisible();
    await expect(page.getByTestId("aim-magnifier")).toHaveCount(0);
    await page.mouse.move(center.x, center.y);
    await expect(box).toHaveAttribute("data-aim-state", "canceled");
    await page.mouse.up();
    await expect(box).toHaveAttribute("data-aim-state", "ready");
    expect((await storedDraft(page)).ends[0][0].status).toBe("empty");
  }

  await placeArrow(page, 1.2, 1.05);
  const stored = await storedDraft(page);
  expect(stored.ends[0][0].status).toBe("miss");
  expect(stored.ends[0][0].x).toBeCloseTo(1.2, 4);
  expect(stored.ends[0][0].y).toBeCloseTo(1.05, 4);
  expect(stored.targetSnapshot.rings.every((ring: { score: number }) => ring.score >= 1)).toBe(true);
  await page.reload();
  await resume(page);
  expect((await storedDraft(page)).ends).toEqual(stored.ends);
});

test("board taps place overlapping arrows while selection is confined to Panahmu", async ({ page }) => {
  await emptySession(page);
  const box = page.getByTestId("scoring-box");
  const bounds = (await box.boundingBox())!;
  const center = { x: bounds.width / 2, y: bounds.height / 2 };

  await box.click({ position: center });

  expect((await storedDraft(page)).ends[0].map((entry: { status: string }) => entry.status))
    .toEqual(["hit", "empty", "empty"]);
  await expect(page.getByTestId("end-subtotal")).toHaveText("6");
  await box.click({ position: center });

  expect((await storedDraft(page)).ends[0].map((entry: { status: string }) => entry.status))
    .toEqual(["hit", "hit", "empty"]);
  const dock = page.getByRole("region", { name: "Panahmu", exact: true });
  await expect(dock.getByRole("button", { name: "Panah 3, Belum dipasang", exact: true }))
    .toHaveAttribute("aria-pressed", "true");

  await dock.getByRole("button", { name: "Panah 1, Skor 6", exact: true }).click();
  const selected = await storedDraft(page);
  await box.click({ position: center });
  await expect(dock.getByRole("button", { name: "Panah 1, Skor 6", exact: true }))
    .toHaveAttribute("aria-pressed", "true");
  expect((await storedDraft(page)).ends).toEqual(selected.ends);

  await dock.getByRole("button", { name: "Panah 3, Belum dipasang", exact: true }).click();
  await box.click({ position: { x: bounds.width * (1.2 / 1.3 + 1) / 2, y: bounds.height / 2 } });

  const saved = await storedDraft(page);
  expect(saved.ends[0][2]).toMatchObject({ status: "miss" });
  expect(saved.ends[0][2].x).toBeCloseTo(1.2, 3);
  await expect(page.getByTestId("end-subtotal")).toHaveText("12");
});

test("grouped arrows support selection, removal, reset cancellation, and end isolation", async ({ page }) => {
  await emptySession(page, 3, 2);
  await placeArrow(page);
  await placeArrow(page);
  const dock = page.getByRole("region", { name: "Panahmu", exact: true });
  const remove = dock.getByRole("button", { name: "Cabut", exact: true });
  const first = dock.getByRole("button", { name: "Panah 1, Skor 6", exact: true });
  await expect(dock.getByRole("button", { name: /Pilih panah (sebelumnya|berikutnya)/ })).toHaveCount(0);
  await expect(page.getByText("Keyboard: tombol arah", { exact: false })).toHaveCount(0);
  await expect(remove).toBeDisabled();
  await first.click();
  await expect(first).toHaveAttribute("aria-pressed", "true");
  await remove.click();
  await expect(page.getByTestId("scoring-box")).toBeFocused();
  let saved = await storedDraft(page);
  expect(saved.ends[0][0].status).toBe("empty");
  expect(saved.ends[0][1].status).toBe("hit");
  await page.getByRole("button", { name: "Panah 2, Skor 6", exact: true }).click();

  await page.getByRole("button", { name: "Reset rambahan", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Batal", exact: true }).click();
  expect((await storedDraft(page)).ends).toEqual(saved.ends);
  await page.getByRole("button", { name: "Reset rambahan", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Reset rambahan", exact: true }).click();
  saved = await storedDraft(page);
  expect(saved.ends[0].every((entry: { status: string }) => entry.status === "empty")).toBe(true);
  expect(saved.ends[1]).toEqual(emptyEnds({ endCount: 2, arrowCount: 3 })[1]);
  await expect(page.getByTestId("end-subtotal")).toHaveText("0");
  await expect(page.getByText("3 tersedia")).toBeVisible();
  await expect(page.getByTestId("scoring-box")).toBeFocused();
  await expect(page.getByRole("button", { name: "Panah 1, Belum dipasang", exact: true }))
    .toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "Lanjut", exact: true })).toBeDisabled();
});

test("magnifier changes sides without shifting the impact point", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await emptySession(page, 2);
  const box = page.getByTestId("scoring-box");
  await box.evaluate((element) => window.scrollTo(0, element.getBoundingClientRect().top + window.scrollY - 90));
  const bounds = (await box.boundingBox())!;
  const x = bounds.x + bounds.width / 2;

  for (const [index, y] of [bounds.y + 20, bounds.y + bounds.height - 20].entries()) {
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.waitForTimeout(220);
    const reticle = (await page.getByTestId("aim-reticle").boundingBox())!;
    const lens = (await page.getByTestId("aim-magnifier").boundingBox())!;
    expect(reticle.x + reticle.width / 2).toBeCloseTo(x, 1);
    expect(reticle.y + reticle.height / 2).toBeCloseTo(y, 1);
    expect(lens.x).toBeGreaterThanOrEqual(8);
    expect(lens.x + lens.width).toBeLessThanOrEqual(382);
    expect(lens.y).toBeGreaterThanOrEqual(8);
    expect(lens.y + lens.height).toBeLessThanOrEqual(836);
    if (index === 0) expect(lens.y).toBeGreaterThan(y);
    else expect(lens.y + lens.height).toBeLessThan(y);
    await page.screenshot({ path: `test-results/scoring-aim-${index}.png` });
    await expect(box).toHaveAttribute("data-aim-state", "aiming");
    await page.mouse.move(bounds.x - 5, y);
    await expect(box).toHaveAttribute("data-aim-state", "canceled");
    await page.screenshot({ path: "test-results/scoring-cancel.png" });
    await page.mouse.up();
  }
});

test("settings changes preserve the active snapshot and recorded miss positions in history", async ({ page }) => {
  await emptySession(page, 2);
  await placeArrow(page, 1.2, 0.5);
  await placeArrow(page);
  const session = await storedDraft(page);
  await page.goto("/setting");
  await page.getByRole("button", { name: "Ring 1–10", exact: true }).click();
  await page.getByRole("button", { name: "Simpan target", exact: true }).click();
  await page.goto("/");
  await resume(page);
  expect((await storedDraft(page)).targetSnapshot).toEqual(session.targetSnapshot);

  await finish(page);
  await expect(page.getByRole("heading", { name: "Hasil Latihan", level: 1 })).toBeVisible();
  await expect(page.getByText("Pilihan skor target", { exact: true })).toHaveCount(0);
  const restart = page.getByRole("button", { name: "Ulangi lagi", exact: true });
  const neighbors = await restart.evaluate((button) => [
    button.previousElementSibling?.getAttribute("aria-labelledby"),
    button.nextElementSibling?.getAttribute("aria-labelledby"),
  ]);
  expect(neighbors).toEqual(["result-heading", "ends-heading"]);
  const missNote = page.getByText(/Miss ditampilkan pada posisi/);
  await expect(missNote).toHaveCount(0);
  const practice = (await records(page)).practices[0];
  expect(practice.ends).toEqual(session.ends);
  expect(practice.userScores).toEqual([[0, 6]]);
  await restart.click();
  await expect(page.getByRole("heading", { name: "Siapkan latihan" })).toBeVisible();
  await page.goto(`/history?id=${practice.id}`);
  await expect(page.locator('[data-arrow-id="1:1"]')).toBeVisible();
  await expect(page.getByText("Pilihan skor target", { exact: true })).toBeVisible();
  await expect(missNote).toHaveCount(0);
});

test("keyboard entry and reduced motion complete a session without numeric inputs", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await emptySession(page, 2);
  const box = page.getByTestId("scoring-box");
  await box.focus();
  await page.keyboard.press("Enter");
  await box.focus();
  for (let step = 0; step < 31; step++) await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Enter");

  const session = await storedDraft(page);
  expect(session.ends[0].map((entry: { status: string }) => entry.status)).toEqual(["hit", "miss"]);
  await expect(page.getByRole("radio")).toHaveCount(0);
  await finish(page);
  await expect(page.getByRole("heading", { name: "Hasil Latihan", exact: true })).toBeVisible();
});

test("unavailable WebGL retains target input and numbered arrow controls", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type, ...args) {
      return type === "webgl2" ? null : Reflect.apply(original, this, [type, ...args]);
    } as typeof original;
  });
  await emptySession(page, 1);
  await placeArrow(page);

  await expect(page.getByTestId("end-subtotal")).toHaveText("6");
  await expect(page.getByRole("button", { name: "Panah 1, Skor 6", exact: true })).toBeVisible();
  await expect(page.getByTestId("scoring-box").locator("[data-arrow-id]")).toHaveCount(1);
});

test("draft write failure keeps the old draft and supports explicit retry", async ({ page }) => {
  await emptySession(page, 1);
  const before = await storedDraft(page);
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    (window as typeof window & { failDraft?: boolean }).failDraft = true;
    Storage.prototype.setItem = function (key, value) {
      if (key === "endSession" && (window as typeof window & { failDraft?: boolean }).failDraft) {
        throw new DOMException("Synthetic write failure", "QuotaExceededError");
      }
      original.call(this, key, value);
    };
  });
  await placeArrow(page);

  await expect(page.getByTestId("end-subtotal")).toHaveText("6");
  await expect(page.getByRole("main").getByRole("alert")).toContainText("Gagal menyimpan draft");
  expect(await storedDraft(page)).toEqual(before);
  await page.evaluate(() => { (window as typeof window & { failDraft?: boolean }).failDraft = false; });
  await page.getByRole("button", { name: "Coba simpan draft lagi" }).click();
  expect((await storedDraft(page)).ends[0][0].status).toBe("hit");
});

test("responsive scoring keeps all twelve slots reachable", async ({ page }) => {
  await emptySession(page, 12);
  await expect(page.locator('[data-arrow-renderer="ready"]')).toBeVisible();
  for (const width of [320, 360, 390, 430, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    const last = page.getByRole("button", { name: "Panah 12, Belum dipasang", exact: true });
    await last.scrollIntoViewIfNeeded();
    await last.click();
    await expect(last).toHaveAttribute("aria-pressed", "true");
    await page.getByTestId("scoring-box").scrollIntoViewIfNeeded();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: `test-results/scoring-${width}.png`, fullPage: true });
  }
});

test("legacy conversion write failure preserves the original draft and reports both warnings", async ({ page }) => {
  await seedDraft(page, legacyDraft);
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === "endSession") throw new DOMException("Synthetic failure", "QuotaExceededError");
      original.call(this, key, value);
    };
  });
  await resume(page);

  const warning = page.getByRole("main").getByRole("alert");
  await expect(warning).toContainText("Gagal menyimpan draft");
  await expect(warning).toContainText("Periksa slot nol");
  expect(await storedDraft(page)).toEqual(legacyDraft);
});

test("new sessions read newer settings from another tab without overwriting them", async ({ page, context }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Mulai latihan" })).toBeEnabled();
  const other = await context.newPage();
  await other.goto("/setting");
  await expect(other.getByRole("button", { name: "Simpan target", exact: true })).toBeEnabled();
  await other.getByLabel("Skor ring 1", { exact: true }).fill("25");
  await other.getByRole("button", { name: "Simpan target", exact: true }).click();
  await expect(other.getByRole("status")).toContainText("berhasil disimpan");
  await other.close();

  await page.getByRole("button", { name: "Mulai latihan" }).click();

  expect((await storedDraft(page)).targetSnapshot.rings[0].score).toBe(25);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("targetSettings")!).rings[0].score)).toBe(25);
});

test("damaged spatial history reports an error without discarding the record", async ({ page }) => {
  await seedDraft(page);
  await resume(page);
  await finish(page);
  await expect(page.getByRole("heading", { name: "Hasil Latihan", exact: true })).toBeVisible();
  await page.evaluate(() => new Promise<void>((resolve, reject) => {
    const request = indexedDB.open("ArcherScoreDB");
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const database = request.result;
      const transaction = database.transaction("practices", "readwrite");
      const store = transaction.objectStore("practices");
      store.get(1).onsuccess = (event) => {
        const record = (event.target as IDBRequest).result;
        record.ends[0][0].score = 99;
        store.put(record);
      };
      transaction.oncomplete = () => { database.close(); resolve(); };
      transaction.onerror = () => { database.close(); reject(transaction.error); };
    };
  }));

  await page.goto("/history?id=1");

  await expect(page.getByRole("heading", { name: "Gagal Memuat Riwayat" })).toBeVisible();
  expect((await records(page)).practices[0].ends?.[0][0]).toMatchObject({ score: 99 });
});
