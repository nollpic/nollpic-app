const CACHE_NAME = "nollpic-v31";
const CACHE_URLS = [
  "/manifest.json",
  "/images/icon-192.png",
  "/images/icon-512.png"
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CACHE_URLS).catch(() => {}))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.mode === "navigate" || ["/", "/index.html", "/style.css", "/app.js"].includes(url.pathname)) {
    event.respondWith(fetch(request, { cache: "no-store" }));
    return;
  }

  event.respondWith(fetch(request).catch(() => caches.match(request)));
});
