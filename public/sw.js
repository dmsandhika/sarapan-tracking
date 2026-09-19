const VERSION = "v1";
const RUNTIME_CACHE = `jompesan-runtime-${VERSION}`;
const OFFLINE_URL = "/offline.html";

const CACHEABLE_PATTERNS = [
  /^\/_next\/static\//,
  /^\/icon0\.svg$/,
  /^\/icon1\.png$/,
  /^\/apple-icon\.png$/,
  /^\/favicon\.ico$/,
  /^\/web-app-manifest-/,
  /^\/dono_UZmG3Ta\.mp3$/,
];

function isCacheableAsset(url) {
  return CACHEABLE_PATTERNS.some((pattern) => pattern.test(url.pathname));
}

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(RUNTIME_CACHE).then((cache) => cache.add(OFFLINE_URL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== RUNTIME_CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Navigations: always try the network first (menu/pesanan data must stay
  // fresh), only fall back to the offline page when there's truly no network.
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
    return;
  }

  // Static build assets/icons/sound: stale-while-revalidate so repeat visits
  // feel instant, while still picking up new deploys in the background.
  if (isCacheableAsset(url)) {
    event.respondWith(
      caches.open(RUNTIME_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) {
          // Serve the cached copy immediately, refresh it in the background.
          event.waitUntil(
            fetch(request)
              .then((response) => {
                if (response.ok) cache.put(request, response.clone());
              })
              .catch(() => {})
          );
          return cached;
        }
        // Nothing cached yet: go straight to the network. If this throws,
        // it propagates as a normal network error (same as no SW at all)
        // instead of resolving to `undefined`, which respondWith() can't
        // convert to a Response.
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
      })
    );
    return;
  }

  // Everything else (RSC payloads, server actions, dynamic pages): never
  // cached, always hit the network so admin/order data is never stale.
});
