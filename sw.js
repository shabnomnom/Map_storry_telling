// sw.js — Carte service worker
// Strategy:
//   • App shell (HTML, CSS, icons, manifest) → network-first, cache fallback when offline
//   • Anthropic proxy (/api/claude) → network-only (never cache AI responses)
//   • Mapbox tiles / geocoding → network-only (live map data)
//   • Everything else → network-first, cache fallback

const CACHE_NAME = "carte-shell-v4";
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

  // Network-first for app shell — always get fresh CSS/HTML, cache only as offline fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Update the cache with the fresh response
        if (response.ok && request.method === "GET") {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((c) => c.put(request, clone));
        }
        return response;
      })
      .catch(() => {
        // Offline fallback: serve from cache
        return caches.match(request).then((cached) => {
          if (cached) return cached;
          if (request.mode === "navigate") return caches.match("/carte.html");
          return new Response("Offline", { status: 503 });
        });
      })
  );
});
