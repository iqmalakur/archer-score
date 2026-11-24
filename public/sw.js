const CACHE = "app-v1";
const PAGE_CACHES = {
  "/": "manah-home-v1",
  "/history": "manah-history-v1",
};
const OFFLINE_PAGE = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.add(new Request(OFFLINE_PAGE, { cache: "reload" })))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

function isHtml(response) {
  return response.headers.get("content-type")?.startsWith("text/html");
}

async function offlineResponse(request, url) {
  const navigation = request.mode === "navigate";
  const cacheName = PAGE_CACHES[url.pathname];
  if (navigation && cacheName) {
    const page = await caches.match(url.pathname, { cacheName });
    if (page) return page;
  }

  const cached = await caches.match(request, { cacheName: CACHE });
  if (cached && (!navigation || isHtml(cached))) return cached;
  if (!navigation) return Response.error();

  const offline = await caches.match(OFFLINE_PAGE, { cacheName: CACHE });
  if (!offline) return Response.error();

  return new Response(offline.body, {
    status: 503,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const network = fetch(request);
  event.respondWith(network.catch(() => offlineResponse(request, url)));

  event.waitUntil(network.then((response) => {
    // The client publishes each prepared document after its assets are ready.
    if (response.status !== 200 || (PAGE_CACHES[url.pathname] && isHtml(response))) return;

    const copy = response.clone();
    return caches.open(CACHE).then((cache) => cache.put(request, copy));
  }).catch(() => {}));
});
