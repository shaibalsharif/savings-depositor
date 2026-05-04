const CACHE_NAME = "project13-cache-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Only intercept HTTP/HTTPS GET requests
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  // Do not intercept auth-related routes or API routes needing fresh data
  if (url.pathname.startsWith("/api/auth") || url.pathname.includes("kinde")) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === "basic") {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      // Cache first for static assets, network first for pages/dynamic
      if (
        url.pathname.startsWith("/_next/") ||
        url.pathname.includes(".png") ||
        url.pathname.includes(".svg")
      ) {
        return cachedResponse || fetchPromise;
      }

      return fetchPromise || cachedResponse;
    })
  );
});
