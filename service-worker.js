/* =========================================================
   BILLING APP — service-worker.js
   Cache First Strategy
   Safe Activation Handoff
   ========================================================= */

// Bump this string on every deploy — that's what makes the browser detect
// a new worker and triggers the in-app "Update Available" modal.
const CACHE_NAME = "v2.1.7";

// Delay before taking control of already-open pages.
const CLAIM_DELAY_MS = 2000;

const STATIC_ASSETS = [
  "./index.html",
  "./config.json",
  "./manifest.json",
  "./assets/logo/logo.png",
  "./assets/logo/horizontal-logo.png",
  "./assets/logo/main-logo.png",
  "./assets/signature/signature.png",
  "./assets/icons/app-icon.png",
  "./assets/icons/whatsapp-qr.jpeg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.allSettled(
        STATIC_ASSETS.map((asset) =>
          cache.add(asset).catch((error) => {
            console.warn(
              `Service worker failed to cache "${asset}":`,
              error
            );
          })
        )
      )
    )
  );

  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(
        () =>
          new Promise((resolve) =>
            setTimeout(resolve, CLAIM_DELAY_MS)
          )
      )
      .then(() => self.clients.claim())
  );
});

// =========================================================
// MESSAGE HANDLING — respond to the page asking for our version
// =========================================================

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "GET_VERSION") {
    // Reply on the MessageChannel port if the page provided one,
    // otherwise reply to the tab that sent the message.
    const respondTo = event.ports && event.ports[0]
      ? event.ports[0]
      : event.source;

    respondTo?.postMessage(CACHE_NAME);
  }
});

/**
 * CACHE FIRST
 *
 * 1. Check cache first.
 * 2. If cached → return cached copy immediately.
 * 3. If not cached → request from network.
 * 4. Save successful network response into cache.
 */
function cacheFirst(request) {
  return caches.open(CACHE_NAME).then(async (cache) => {
    const cached = await cache.match(request);

    // Cached copy exists → use it immediately.
    if (cached) {
      return cached;
    }

    // No cached copy → get it from network.
    try {
      const response = await fetch(request);

      const isCacheable =
        response &&
        (response.ok || response.type === "opaque");

      if (isCacheable) {
        await cache.put(request, response.clone());
      }

      return response;
    } catch (error) {
      if (error && error.name === "AbortError") {
        return new Response(null, { status: 408, statusText: "Aborted" });
      }
      return Response.error();
    }
  });
}

self.addEventListener("fetch", (event) => {
  // Only handle GET requests.
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // =========================================================
  // MANIFEST.JSON — CACHE FIRST
  // =========================================================
  if (url.pathname.endsWith("manifest.json")) {
    event.respondWith(
      cacheFirst(event.request)
    );

    return;
  }

  // =========================================================
  // HTML + NAVIGATION + CONFIG — CACHE FIRST
  // =========================================================
  if (
    event.request.mode === "navigate" ||
    url.pathname.endsWith(".html") ||
    url.pathname.endsWith("config.json")
  ) {
    event.respondWith(
      cacheFirst(event.request).then(async (response) => {
        if (response && response.ok) {
          return response;
        }

        const cache = await caches.open(CACHE_NAME);

        return (
          (await cache.match("./index.html")) ||
          response
        );
      })
    );

    return;
  }

  // =========================================================
  // JAVASCRIPT + CSS — CACHE FIRST
  // =========================================================
  if (
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".css") ||
    event.request.destination === "script" ||
    event.request.destination === "style"
  ) {
    event.respondWith(
      cacheFirst(event.request)
    );

    return;
  }

  // =========================================================
  // FONTS — CACHE FIRST
  // =========================================================
  if (
    event.request.destination === "font" ||
    /\.(woff2?|ttf|otf|eot)$/i.test(url.pathname)
  ) {
    event.respondWith(
      cacheFirst(event.request)
    );

    return;
  }

  // =========================================================
  // IMAGES — CACHE FIRST
  // =========================================================
  if (
    event.request.destination === "image" ||
    /\.(png|jpg|jpeg|gif|svg|webp|ico)$/i.test(
      url.pathname
    )
  ) {
    event.respondWith(
      cacheFirst(event.request)
    );

    return;
  }

  // =========================================================
  // EVERYTHING ELSE — NETWORK ONLY
  // =========================================================
  event.respondWith(
    fetch(event.request).catch(() =>
      Response.error()
    )
  );
});