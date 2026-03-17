// sw.js — Carte service worker
// Strategy:
//   • App shell (HTML, CSS, icons, manifest) → cache-first, update in background
//   • Anthropic proxy (/api/claude) → network-only (never cache AI responses)
//   • Mapbox tiles / geocoding → network-only (live map data)
//   • Everything else → network with cache fallback

const CACHE_NAME = "carte-shell-v1";
const SHELL_URLS = [
  "/",
  "/carte.html",
  "/carte.css",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

// ── INSTALL: pre-cache the app shell ────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL_URLS))
      .then(() => self.skipWaiting())
  );
});

// ── ACTIVATE: delete stale caches ───────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
        )
      )
  );
  self.clients.claim();
});

// ── FETCH ────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Network-only: AI proxy + Mapbox API (tiles, geocoding, styles)
  if (
    url.pathname.startsWith("/api/") ||
    url.hostname === "api.mapbox.com" ||
    url.hostname.endsWith(".mapbox.com")
  ) {
    event.respondWith(fetch(request));
    return;
  }

  // Cache-first for everything else (app shell)
  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((response) => {
          // Refresh shell cache on successful GETs
          if (response.ok && request.method === "GET") {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((c) => c.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          // Offline fallback: return cached shell for navigation requests
          if (request.mode === "navigate") {
            return caches.match("/carte.html");
          }
          // For other failed requests (CSS, JS, etc.) return whatever cache has
          return caches.match(request);
        });
      return cached ?? networkFetch;
    })
  );
});
