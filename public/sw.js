// ═══════════════════════════════════════════════════════════════════════════
// Project 13 — Service Worker v3
// Strategy:
//   SHELL   → cache-first  (app shell, icons, fonts, CSS/JS bundles)
//   PAGES   → stale-while-revalidate  (HTML navigations get cached copy
//              instantly, then refreshed in background)
//   API     → network-first with cache fallback (fresh when online, cached
//              when offline — for the data routes we care about)
//   PUSH    → handled directly (no fetch strategy)
// ═══════════════════════════════════════════════════════════════════════════

const SW_VERSION = "v4.3";
const SHELL_CACHE   = `p13-shell-${SW_VERSION}`;
const PAGES_CACHE   = `p13-pages-${SW_VERSION}`;
const API_CACHE     = `p13-api-${SW_VERSION}`;
const IMAGE_CACHE   = `p13-images-${SW_VERSION}`;
const ALL_CACHES    = [SHELL_CACHE, PAGES_CACHE, API_CACHE, IMAGE_CACHE];

// ── Assets to pre-cache on install ──────────────────────────────────────────
const SHELL_ASSETS = [
  "/offline.html",          // our offline fallback page
  "/manifest.json",
  "/logo.png",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
];

// ── App pages to warm-cache on install (stale-while-revalidate candidates) ──
// NOTE: '/' and '/login' are intentionally excluded — they are auth gateway
// pages that check session server-side and redirect. Caching them stale would
// prevent expired sessions from being detected on next visit.
const PAGE_WARMUP = [
  "/dashboard",
  "/my-deposits",
  "/expenses",
  "/investments",
  "/my-profile",
  "/settings/deposits",
];

// ── API routes to cache (network-first, offline fallback) ───────────────────
// These produce JSON that we want accessible offline.
const CACHEABLE_API_PATTERNS = [
  /\/api\/offline-cache\/.*/,   // our dedicated cache-warming endpoint
];

// ────────────────────────────────────────────────────────────────────────────
// INSTALL — pre-cache shell + attempt page warmup
// ────────────────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  console.log(`[SW ${SW_VERSION}] Installing…`);
  event.waitUntil(
    (async () => {
      // 1. Cache shell assets (must succeed)
      const shellCache = await caches.open(SHELL_CACHE);
      await shellCache.addAll(SHELL_ASSETS);
      console.log(`[SW ${SW_VERSION}] Shell assets cached`);

      // 2. Warm page cache (best-effort, failures are OK at install time)
      const pagesCache = await caches.open(PAGES_CACHE);
      await Promise.allSettled(
        PAGE_WARMUP.map(url =>
          fetch(url, { credentials: "include" })
            .then(res => {
              if (res.ok) return pagesCache.put(url, res);
            })
            .catch(() => {}) // not authenticated yet — that's fine
        )
      );
    })()
  );
  // Take over immediately without waiting for existing tabs to close
  self.skipWaiting();
});

// ────────────────────────────────────────────────────────────────────────────
// ACTIVATE — prune old caches
// ────────────────────────────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  console.log(`[SW ${SW_VERSION}] Activating…`);
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter(k => !ALL_CACHES.includes(k))
          .map(k => {
            console.log(`[SW ${SW_VERSION}] Deleting old cache: ${k}`);
            return caches.delete(k);
          })
      );
      await self.clients.claim();
      console.log(`[SW ${SW_VERSION}] Active and controlling all clients`);
    })()
  );
});

// ────────────────────────────────────────────────────────────────────────────
// FETCH — tiered strategy
// ────────────────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle same-origin or HTTPS requests; skip chrome-extension, etc.
  if (!url.protocol.startsWith("http")) return;

  // ── Skip Kinde/auth flows entirely — must always go to network ──────────
  if (
    url.pathname.startsWith("/api/auth") ||
    url.hostname.includes("kinde.com") ||
    url.pathname.includes("/kinde")
  ) return;

  // ── Non-GET: pass through (POST/PUT mutations must hit network) ──────────
  if (req.method !== "GET") return;

  // ── 1. Next.js static chunks & fonts → cache-first (SHELL) ─────────────
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/_next/image") ||
    url.pathname.endsWith(".woff2") ||
    url.pathname.endsWith(".woff") ||
    url.pathname.endsWith(".ico")
  ) {
    event.respondWith(cacheFirst(req, SHELL_CACHE));
    return;
  }

  // ── 2. Static public assets (icons, logo, manifest) → cache-first ───────
  if (
    url.pathname === "/manifest.json" ||
    url.pathname === "/logo.png" ||
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/offline.html"
  ) {
    event.respondWith(cacheFirst(req, SHELL_CACHE));
    return;
  }

  // ── 3. Remote images & fonts (UploadThing, Google) → cache with TTL ──────
  if (
    url.hostname.endsWith("ufs.sh") ||
    url.hostname === "utfs.io" ||
    url.hostname === "uploadthing.com" ||
    url.hostname === "lh3.googleusercontent.com" ||
    url.hostname === "fonts.googleapis.com" ||
    url.hostname === "fonts.gstatic.com"
  ) {
    event.respondWith(cacheFirstWithExpiry(req, IMAGE_CACHE, 30 * 24 * 60 * 60)); // 30 days
    return;
  }

  // ── 4. Cacheable API routes → network-first with JSON fallback ───────────
  if (
    url.pathname.startsWith("/api/") &&
    CACHEABLE_API_PATTERNS.some(p => p.test(url.pathname))
  ) {
    event.respondWith(networkFirstAPI(req, API_CACHE));
    return;
  }

  // ── 5. Skip all other API routes (must be fresh) ─────────────────────────
  if (url.pathname.startsWith("/api/")) return;

  const isRscRequest = req.headers.get("rsc") === "1" || req.headers.get("x-rsc") === "1";

  // ── 6. Dashboard → Network-First (Ensure auth check happens before cache) ──
  if (url.pathname === "/dashboard" || url.pathname.startsWith("/dashboard/")) {
    event.respondWith(networkFirstPage(req, PAGES_CACHE, isRscRequest));
    return;
  }

  // ── 7. Other Page navigations (HTML or RSC) → stale-while-revalidate ──────
  if (req.headers.get("accept")?.includes("text/html") || isRscRequest) {
    event.respondWith(staleWhileRevalidatePage(req, isRscRequest));
    return;
  }
});

// ════════════════════════════════════════════════════════════════════════════
// STRATEGY HELPERS
// ════════════════════════════════════════════════════════════════════════════

/** Cache-first: serve from cache, fall back to network and cache result. */
async function cacheFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  if (cached) return cached;
  try {
    const fresh = await fetch(req);
    if (fresh.ok) cache.put(req, fresh.clone());
    return fresh;
  } catch {
    return new Response("Offline — resource unavailable", { status: 503 });
  }
}

/**
 * Cache-first with TTL via Date header stored in cache.
 * Expired entries fall through to network.
 */
async function cacheFirstWithExpiry(req, cacheName, maxAgeSeconds) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  if (cached) {
    const date = cached.headers.get("sw-cached-at");
    const age  = date ? (Date.now() - Number(date)) / 1000 : Infinity;
    if (age < maxAgeSeconds) return cached;
  }
  try {
    const fresh = await fetch(req);
    if (fresh.ok) {
      // Inject our timestamp header
      const headers = new Headers(fresh.headers);
      headers.set("sw-cached-at", String(Date.now()));
      const toStore = new Response(await fresh.clone().blob(), { headers, status: fresh.status });
      cache.put(req, toStore);
    }
    return fresh;
  } catch {
    return cached || new Response("Offline — image unavailable", { status: 503 });
  }
}

/**
 * Network-first: try network, store in cache. On failure serve cached JSON.
 * Returns a synthetic offline-error JSON if nothing is cached.
 */
async function networkFirstAPI(req, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const fresh = await fetch(req);
    if (fresh.ok) cache.put(req, fresh.clone());
    return fresh;
  } catch {
    const cached = await cache.match(req);
    if (cached) return cached;
    return new Response(
      JSON.stringify({ error: "offline", message: "No cached data available" }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }
}

/**
 * Stale-while-revalidate for HTML pages and RSC data.
 * Serve cached page instantly. Update cache in background.
 * On complete miss + offline → serve /offline.html from shell cache.
 */
async function staleWhileRevalidatePage(req, isRsc = false) {
  const pagesCache  = await caches.open(PAGES_CACHE);
  const shellCache  = await caches.open(SHELL_CACHE);
  const cached      = await pagesCache.match(req);

  // Start background revalidation regardless
  const revalidate = fetch(req, { credentials: "include" })
    .then(fresh => {
      if (!fresh) return null;

      // ── Detect auth redirects in the background response ─────────────────
      // If the server redirected to /api/auth/login it means the session
      // expired. Notify the client immediately so it can redirect.
      const finalUrl = fresh.url || "";
      const isAuthRedirect =
        finalUrl.includes("/api/auth/login") ||
        finalUrl.includes("/api/auth/") ||
        (fresh.redirected && finalUrl.includes("kinde"));

      if (isAuthRedirect) {
        // Tell all open clients the session expired
        self.clients.matchAll({ type: "window", includeUncontrolled: true })
          .then(clientList => {
            clientList.forEach(client => {
              client.postMessage({ type: "SESSION_EXPIRED" });
            });
          });
        // Don't cache an auth redirect response
        return fresh;
      }

      if (fresh.ok) pagesCache.put(req, fresh.clone());
      return fresh;
    })
    .catch(() => null);

  if (cached) {
    // Return stale immediately; update in background
    revalidate; // fire and forget
    return cached;
  }

  // No cache — wait for network
  try {
    const fresh = await revalidate;
    if (fresh && fresh.ok) return fresh;
    throw new Error("Not ok");
  } catch {
    // Truly offline AND no cache

    // If it's an RSC request, we can't just return offline.html (it expects JSON/RSC)
    // We return a 503 so the client knows it's offline.
    if (isRsc) {
      return new Response("Offline", {
        status: 503,
        statusText: "Service Unavailable",
        headers: { "Content-Type": "text/plain", "x-p13-offline": "1" }
      });
    }

    // Serve the beautiful offline page for full HTML navigations
    const offline = await shellCache.match("/offline.html");
    return offline || new Response("<h1>You are offline</h1>", {
      headers: { "Content-Type": "text/html" }
    });
  }
}

/**
 * Network-first for pages (Dashboard):
 * Try network (so auth redirects happen). If network fails/offline, serve from cache.
 */
async function networkFirstPage(req, cacheName, isRsc = false) {
  const cache = await caches.open(cacheName);
  const shellCache = await caches.open(SHELL_CACHE);
  
  try {
    // We use a shorter timeout for the network check to keep it snappy
    const fresh = await fetch(req, { credentials: "include" });
    
    // DETECT EXTERNAL REDIRECTS (Kinde, Google, etc.)
    // If the URL changed to a different domain, it's an auth redirect. 
    // We MUST return it as-is so the browser can navigate there.
    const isExternal = !fresh.url.includes(self.location.hostname);
    if (isExternal || fresh.redirected || (fresh.status >= 300 && fresh.status < 400) || fresh.status === 401) {
      return fresh;
    }

    if (fresh.ok) {
      cache.put(req, fresh.clone());
      return fresh;
    }

    // If it's a server error but we're online, we still might want the cache
    throw new Error("Server error");
  } catch (err) {
    // Detect if this is a true network failure (offline)
    const isOffline = !navigator.onLine;
    
    const cached = await cache.match(req);
    // Only serve cache if we're actually offline or the network failed
    if (cached && (isOffline || err.message === "Server error")) {
      return cached;
    }
    
    if (isRsc) {
      return new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain" } });
    }
    
    const offline = await shellCache.match("/offline.html");
    return offline || new Response("<h1>Offline</h1>", { headers: { "Content-Type": "text/html" } });
  }
}

// ════════════════════════════════════════════════════════════════════════════
// MESSAGE — triggered by PwaInit to pre-warm caches after auth
// ════════════════════════════════════════════════════════════════════════════
self.addEventListener("message", (event) => {
  if (event.data?.type === "CACHE_PAGES") {
    const urls = event.data.urls || [];
    caches.open(PAGES_CACHE).then(cache => {
      Promise.allSettled(
        urls.map(url =>
          fetch(url, { credentials: "include" })
            .then(res => { if (res.ok) cache.put(url, res); })
            .catch(() => {})
        )
      ).then(() => console.log(`[SW ${SW_VERSION}] Warmed ${urls.length} page(s) after auth`));
    });
  }

  if (event.data?.type === "CLEAR_PAGES_CACHE") {
    caches.delete(PAGES_CACHE).then(() => {
      console.log(`[SW ${SW_VERSION}] Pages cache cleared`);
    });
  }

  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// ════════════════════════════════════════════════════════════════════════════
// PUSH NOTIFICATION HANDLER
// ════════════════════════════════════════════════════════════════════════════
self.addEventListener("push", (event) => {
  console.log(`[SW ${SW_VERSION}] Push event received`);
  if (!event.data) {
    console.warn(`[SW ${SW_VERSION}] Push event received but no data`);
    return;
  }

  let data = {};
  try {
    data = event.data.json();
    console.log(`[SW ${SW_VERSION}] Push data parsed:`, data);
  } catch (err) {
    const text = event.data.text();
    console.warn(`[SW ${SW_VERSION}] Push data parse failed, using text:`, text);
    data = { title: "Project 13", body: text };
  }

  const {
    title   = "Project 13",
    body    = "",
    icon    = "/icons/icon-192x192.png",
    url     = "/dashboard",
    image   = null,
  } = data;

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge:             "/icons/icon-192x192.png",
      image:             image,
      data:              { url },
      vibrate:           [200, 100, 200],
      tag:               "project13-notification",
      renotify:          true,
      requireInteraction: false,
      timestamp:         Date.now(),
      actions: [
        { action: "view",  title: "View" },
        { action: "close", title: "Dismiss" },
      ],
    }).then(() => {
      console.log(`[SW ${SW_VERSION}] Notification shown: ${title}`);
      
      // NEW: Broadcast to all open tabs so they can show an in-app toast
      return clients.matchAll({ type: "window", includeUncontrolled: true });
    }).then(clientList => {
      clientList.forEach(client => {
        client.postMessage({
          type: "PUSH_RECEIVED",
          payload: { title, body, url, icon }
        });
      });
    }).catch(err => {
      console.error(`[SW ${SW_VERSION}] Failed to show notification or broadcast:`, err);
    })
  );
});

// ════════════════════════════════════════════════════════════════════════════
// NOTIFICATION CLICK HANDLER
// ════════════════════════════════════════════════════════════════════════════
self.addEventListener("notificationclick", (event) => {
  console.log(`[SW ${SW_VERSION}] Notification clicked:`, event.action);
  event.notification.close();
  const targetUrl = event.notification.data?.url ?? "/dashboard";

  if (event.action === "close") return;

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(clientList => {
        for (const client of clientList) {
          if (client.url.includes(targetUrl) && "focus" in client) {
            console.log(`[SW ${SW_VERSION}] Focusing existing tab: ${client.url}`);
            return client.focus();
          }
        }
        if (clients.openWindow) {
          console.log(`[SW ${SW_VERSION}] Opening new window: ${targetUrl}`);
          return clients.openWindow(targetUrl);
        }
      })
  );
});
