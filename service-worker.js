const CACHE_NAME = "j-ali-billing-v2.0.1";

const STATIC_ASSETS = [
  "./assets/logo/logo.png",
  "./assets/logo/main-logo.png",
  "./assets/logo/horizontal-logo.png",
  "./assets/signature/signature.png",
  "./assets/icons/app-icon.png",
  "./assets/icons/whatsapp-qr.jpeg"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      for (const asset of STATIC_ASSETS) {
        try {
          await cache.add(asset);
        } catch (error) {
          console.warn("Failed to cache:", asset, error);
        }
      }
    })
  );

  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );

  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // HTML: always network
  if (
    event.request.mode === "navigate" ||
    url.pathname.endsWith(".html")
  ) {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  // Config: always network
  if (url.pathname.endsWith("config.json")) {
    event.respondWith(fetch(event.request));
    return;
  }

  // JavaScript: always network
  if (url.pathname.endsWith(".js")) {
    event.respondWith(fetch(event.request));
    return;
  }

  // CSS: always network
  if (url.pathname.endsWith(".css")) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Images: cache first + update cache from network
  if (
    event.request.destination === "image" ||
    /\.(png|jpg|jpeg|gif|svg|webp|ico)$/i.test(url.pathname)
  ) {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        const networkResponse = fetch(event.request)
          .then(response => {
            if (response.ok) {
              const responseClone = response.clone();

              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, responseClone);
              });
            }

            return response;
          })
          .catch(() => cachedResponse);

        return cachedResponse || networkResponse;
      })
    );

    return;
  }

  // Everything else: network first
  event.respondWith(
    fetch(event.request).catch(() =>
      caches.match(event.request)
    )
  );
});