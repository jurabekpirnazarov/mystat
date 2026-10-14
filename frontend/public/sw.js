/* FQ-11: my.stat.uz service worker.
 *
 * - Statik fayllar (/assets/*, ikonkalar): cache-first.
 * - Ochiq GET API (faqat ruxsat etilgan ro'yxat, Authorization sarlavhasisiz): stale-while-revalidate —
 *   oxirgi ko'rilgan ochiq sahifalar internetsiz ham ochiladi.
 * - Login talab qiladigan so'rovlar (Authorization sarlavhasi bor) va kabinet ma'lumotlari HECH QACHON keshlanmaydi.
 * - Navigatsiya: tarmoq, bo'lmasa keshdagi ilova qobig'i (index.html).
 */
const VERSION = "v1";
const STATIC_CACHE = `mystat-static-${VERSION}`;
const API_CACHE = `mystat-api-${VERSION}`;
const SHELL = ["/", "/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon-512.png"];

// Faqat ochiq, shaxsiy bo'lmagan endpoint'lar
const PUBLIC_API = [
  "/api/citizens/articles/",
  "/api/citizens/glossary/",
  "/api/citizens/prices/",
  "/api/citizens/salary/",
  "/api/citizens/names/",
  "/api/citizens/surveys/",
  "/api/citizens/answers/",
  "/api/common/regions/",
  "/api/common/home-stats/",
  "/api/common/question-answer/",
  "/api/additional-services/cpi/series/",
  "/api/additional-services/external-trade/trade-flows/",
  "/api/additional-services/reportlist/calendar/",
  "/api/additional-services/market-report/",
  "/api/services/tariff-compare/",
];
const PRIVATE_HINTS = ["/me", "/my", "/cabinet", "/accounts/", "/notifications/", "/favorites", "/keys", "/questions/"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(STATIC_CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => ![STATIC_CACHE, API_CACHE].includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function isPublicApi(request, url) {
  if (request.method !== "GET" || request.headers.get("Authorization")) return false;
  if (PRIVATE_HINTS.some((h) => url.pathname.includes(h))) return false;
  return PUBLIC_API.some((p) => url.pathname.startsWith(p));
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(API_CACHE);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached);
  return cached || network;
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) (await caches.open(STATIC_CACHE)).put(request, response.clone());
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          caches.open(STATIC_CACHE).then((c) => c.put("/", response.clone()));
          return response;
        })
        .catch(() => caches.match("/"))
    );
    return;
  }
  if (url.pathname.startsWith("/assets/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(cacheFirst(request));
    return;
  }
  if (url.pathname.startsWith("/api/") && isPublicApi(request, url)) {
    event.respondWith(staleWhileRevalidate(request));
  }
  // qolgan hammasi (shaxsiy API, media) — oddiy tarmoq, keshsiz
});

// Chiqishda (logout) ilova API keshini tozalashni so'rashi mumkin
self.addEventListener("message", (event) => {
  if (event.data === "clear-api-cache") caches.delete(API_CACHE);
});
