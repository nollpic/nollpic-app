const CACHE_NAME = "nollpic-v20";
const CACHE_NAME_CURRENT = "nollpic-v21";
const CACHE_URLS = [
  "/",
  "/index.html",
  "/style.css",
  "/app.js",
  "/play/stopwatch.html",
  "/play/number.html",
  "/play/shape-dice.html",
  "/play/dice_sound.mp3",
  "/manifest.json",
  "/images/icon-192.png",
  "/images/icon-512.png"
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME_CURRENT).then((cache) => cache.addAll(CACHE_URLS).catch(() => {}))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME_CURRENT).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
