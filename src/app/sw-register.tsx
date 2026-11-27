"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const OFFLINE_PAGES = [
  { path: "/", cacheName: "manah-home-v1", label: "Latihan" },
  { path: "/history", cacheName: "manah-history-v1", label: "History" },
];

async function preparePage(path: string, cacheName: string) {
  const response = await fetch(path, { cache: "no-cache" });
  if (!response.ok || !response.headers.get("content-type")?.startsWith("text/html")) {
    throw new Error(`The document at ${path} is unavailable.`);
  }

  const html = new DOMParser().parseFromString(await response.clone().text(), "text/html");
  const assets = new Set<string>();
  const selector = "script[src], img[src], link[rel=stylesheet], link[rel=preload], link[rel=modulepreload]";

  for (const element of html.querySelectorAll(selector)) {
    const path = element.getAttribute("src") ?? element.getAttribute("href");
    if (!path) continue;

    const url = new URL(path, window.location.origin);
    if (url.origin === window.location.origin) assets.add(url.href);
  }

  if (assets.size === 0) throw new Error(`The document at ${path} has no app assets.`);

  const cache = await caches.open("app-v1");
  await Promise.all(Array.from(assets, async (asset) => {
    if (!await cache.match(asset)) await cache.add(asset);
  }));

  const pages = await caches.open(cacheName);
  await pages.put(path, response);
}

export default function SwRegister() {
  const isLanding = usePathname() === "/landing";

  useEffect(() => {
    if (isLanding || process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;

    let active = true;
    const ready = navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .then(() => navigator.serviceWorker.ready)
      .catch((error) => console.warn("Could not register the service worker:", error));

    const prepare = async () => {
      if (!navigator.onLine || !await ready || !active) return;

      await Promise.all(OFFLINE_PAGES.map(async ({ path, cacheName, label }) => {
        try {
          await preparePage(path, cacheName);
        } catch (error) {
          console.warn(`Could not prepare ${label} for offline use:`, error);
        }
      }));
    };

    window.addEventListener("online", prepare);
    prepare();

    return () => {
      active = false;
      window.removeEventListener("online", prepare);
    };
  }, [isLanding]);

  return null;
}
