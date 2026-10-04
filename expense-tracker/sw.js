// VG Expenses offline cache.
// The app page is fetched fresh whenever there's internet (so updates arrive on their own)
// and served from the cache when there isn't. Libraries, icons and fonts come from the cache.
const CACHE = "vg-expenses-v1";
const CORE = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./lib/jspdf.umd.min.js",
  "./lib/jspdf.plugin.autotable.min.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const isPage = req.mode === "navigate" || url.pathname.endsWith(".html") || url.pathname.endsWith(".webmanifest");

  if (url.origin === location.origin && isPage) {
    // network first: always the newest version when online
    event.respondWith(
      // "no-cache" asks the server whether there's a newer copy instead of trusting the browser's own cache
      fetch(req.url, { cache: "no-cache", credentials: "same-origin" })
        .then(res => {
          if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
          return res;
        })
        .catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match("./index.html")))
    );
    return;
  }

  const cacheable = url.origin === location.origin || url.hostname.endsWith("fonts.googleapis.com") ||
    url.hostname.endsWith("fonts.gstatic.com") || url.hostname === "cdnjs.cloudflare.com";
  if (!cacheable) return;
  // cache first for libraries, icons and fonts
  event.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok || res.type === "opaque") { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }))
  );
});
