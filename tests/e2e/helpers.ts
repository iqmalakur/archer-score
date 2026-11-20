import { expect, type Page } from "@playwright/test";
import type { CompletedSession, Practice } from "../../src/lib/db";
import { createTarget } from "../../src/lib/target-settings";

export const setup = { endCount: 1, arrowCount: 2, targetScores: [3, 6] };
export const legacyDraft = {
  sessionId: "a588bb53-2552-4bf4-a814-c31fac4ec47d",
  title: "Latihan uji", distance: 18, currentEnd: 1,
  userScores: [[6, 0]], isStarted: true, setup,
};
export const draft = {
  schemaVersion: 2, sessionId: legacyDraft.sessionId,
  title: "Latihan uji", distance: 18, currentEnd: 1, isStarted: true,
  endCount: 1, arrowCount: 2, targetSnapshot: createTarget([6, 3]),
  ends: [[
    { id: "1:1", status: "hit", x: 0, y: 0, ringId: "ring-1", score: 6 },
    { id: "1:2", status: "miss", x: 1.2, y: 0 },
  ]],
};

export async function placeArrow(page: Page, x = 0, y = 0) {
  const box = page.getByTestId("scoring-box");
  await box.scrollIntoViewIfNeeded();
  const bounds = (await box.boundingBox())!;
  const session = await storedDraft(page);
  const geometry = session.targetSnapshot.box;
  await page.mouse.move(
    bounds.x + (x / geometry.halfWidth + 1) * bounds.width / 2,
    bounds.y + (y / geometry.halfHeight + 1) * bounds.height / 2,
  );
  await page.mouse.down();
  await page.waitForTimeout(220);
  await page.mouse.up();
}

export async function seedDraft(
  page: Page,
  session: unknown = draft,
  preferences: unknown = setup,
) {
  await page.goto("/setting");
  await page.evaluate(({ session, preferences }) => {
    localStorage.setItem("endSession", JSON.stringify(session));
    if (preferences === null) localStorage.removeItem("setup");
    else localStorage.setItem("setup", JSON.stringify(preferences));
  }, { session, preferences });
  await page.goto("/");
}

export async function resume(page: Page) {
  await page.getByRole("dialog", { name: "Lanjutkan skoring?" })
    .getByRole("button", { name: "Lanjutkan", exact: true }).click();
  await expect(page.getByRole("heading", { name: /Rambahan 1 dari/ })).toBeVisible();
}

export async function finish(page: Page) {
  await page.getByRole("button", { name: "Selesai", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Selesai", exact: true }).click();
}

export async function storedDraft(page: Page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem("endSession") ?? "null"));
}

export async function holdWrites(page: Page) {
  await page.evaluate(() => new Promise<void>((resolve, reject) => {
    const state = window as typeof window & { releaseLock?: () => void };
    const request = indexedDB.open("ArcherScoreDB");

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const database = request.result;
      const tx = database.transaction(["practices", "completedSessions"], "readwrite");
      let held = true;
      state.releaseLock = () => { held = false; };

      const keepAlive = () => {
        if (held) tx.objectStore("practices").count().onsuccess = keepAlive;
      };
      keepAlive();
      tx.oncomplete = () => database.close();
      resolve();
    };
  }));

  return () => page.evaluate(() => {
    (window as typeof window & { releaseLock?: () => void }).releaseLock?.();
  });
}

export async function records(page: Page) {
  return page.evaluate(() => new Promise<{
    practices: Practice[];
    receipts: CompletedSession[];
  }>((resolve, reject) => {
    const request = indexedDB.open("ArcherScoreDB");

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const database = request.result;
      const tx = database.transaction(["practices", "completedSessions"], "readonly");
      const practices = tx.objectStore("practices").getAll();
      const receipts = tx.objectStore("completedSessions").getAll();

      tx.oncomplete = () => {
        resolve({ practices: practices.result, receipts: receipts.result });
        database.close();
      };
      tx.onerror = () => {
        reject(tx.error);
        database.close();
      };
    };
  }));
}

// Fail native storage at the browser boundary; production code needs no test hooks.
export async function installFaults(page: Page) {
  await page.addInitScript(() => {
    const state = window as typeof window & { storageFault?: string };
    state.storageFault = sessionStorage.getItem("storageFault") ?? "";

    for (const prototype of [IDBObjectStore.prototype, IDBIndex.prototype]) {
      const methods = prototype as unknown as Record<string, (...args: unknown[]) => unknown>;
      for (const method of ["add", "delete", "openCursor", "getAll"]) {
        const original = methods[method];
        if (!original) continue;

        methods[method] = function (...args) {
          const source = this as unknown as IDBObjectStore | IDBIndex;
          const store = "objectStore" in source ? source.objectStore.name : source.name;
          if (state.storageFault === `${store}:${method}`
            || (state.storageFault === `${store}:read` && ["openCursor", "getAll"].includes(method))) {
            throw new DOMException("Synthetic storage failure", "QuotaExceededError");
          }

          return Reflect.apply(original, this, args);
        };
      }
    }

    const remove = Storage.prototype.removeItem;
    Storage.prototype.removeItem = function (key) {
      if (key === "endSession" && state.storageFault === "cleanup") {
        throw new DOMException("Synthetic cleanup failure", "SecurityError");
      }
      return remove.call(this, key);
    };
  });
}

export async function fault(page: Page, value = "") {
  await page.evaluate((value) => {
    (window as typeof window & { storageFault?: string }).storageFault = value;
    sessionStorage.setItem("storageFault", value);
  }, value);
}
