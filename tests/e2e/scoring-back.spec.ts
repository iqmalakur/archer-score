import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium, expect, test } from "@playwright/test";

test("Chromium Back visits each scoring end without a page click between presses", async ({ baseURL }, testInfo) => {
  const extension = testInfo.outputPath("back-extension");
  await mkdir(extension, { recursive: true });
  await writeFile(join(extension, "manifest.json"), JSON.stringify({
    manifest_version: 3,
    name: "Scoring Back test",
    version: "1.0",
    permissions: ["tabs"],
    background: { service_worker: "worker.js" },
  }));
  await writeFile(join(extension, "worker.js"), "chrome.runtime.onInstalled.addListener(() => {});");

  const context = await chromium.launchPersistentContext("", {
    baseURL,
    channel: "chromium",
    headless: true,
    args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`],
  });

  try {
    const worker = context.serviceWorkers().find((worker) => worker.url().startsWith("chrome-extension://"))
      ?? await context.waitForEvent("serviceworker", {
        predicate: (worker) => worker.url().startsWith("chrome-extension://"),
      });
    const page = context.pages()[0] ?? await context.newPage();
    const cdp = await context.newCDPSession(page);

    const back = () => worker.evaluate(`(async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      await chrome.tabs.goBack(tab.id);
    })()`);

    // Inspect the view without granting the page a new user activation.
    const readView = async () => {
      const { result } = await cdp.send("Runtime.evaluate", {
        expression: `({
          heading: document.querySelector("h1")?.textContent,
          active: history.state?.scoringBack?.active,
          dialog: document.querySelector("dialog[open] h2")?.textContent ?? null,
        })`,
        returnByValue: true,
        userGesture: false,
      });
      return result.value;
    };

    await page.goto("/setting");
    await page.goto("/");
    const fewerArrows = page.getByRole("button", { name: "Kurangi panah" });
    for (let count = 0; count < 4; count++) await fewerArrows.click();
    await page.getByRole("button", { name: "Mulai latihan" }).click();
    for (let end = 1; end < 4; end++) {
      await page.getByTestId("scoring-box").press("Enter");
      await page.getByRole("button", { name: "Lanjut", exact: true }).click();
    }
    await expect.poll(readView).toEqual({ heading: "Rambahan 4 dari 4", active: true, dialog: null });

    for (let end = 3; end >= 1; end--) {
      await back();
      await expect.poll(readView).toEqual({ heading: `Rambahan ${end} dari 4`, active: true, dialog: null });
    }

    await back();
    await expect.poll(readView).toEqual({
      heading: "Rambahan 1 dari 4",
      active: true,
      dialog: "Batalkan latihan?",
    });
  } finally {
    await context.close();
  }
});
