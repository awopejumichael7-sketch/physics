// Scholar's Camp — Service Worker (offline shell + runtime cache)
const VERSION = "sc-v1.0.0";
const SHELL_CACHE = `${VERSION}-shell`;
const RUNTIME_CACHE = `${VERSION}-runtime`;

const SHELL_ASSETS = [
  "/",
  "/index.html",
  "/login.html",
  "/dashboard.html",
  "/topics.html",
  "/topic.html",
  "/resources.html",
  "/exams.html",
  "/results.html",
  "/css/style.css",
  "/css/components.css",
  "/css/responsive.css",
  "/js/firebase-config.js",
  "/js/firebase-init.js",
  "/js/ui.js",
  "/js/auth.js",
  "/js/sw-register.js",
  "/manifest.json"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then(c => c.addAll(SHELL_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => !k.startsWith(VERSION)).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Never cache Firebase Auth / Firestore traffic — handled by SDK
  if (url.hostname.includes("firebaseio.com") ||
      url.hostname.includes("googleapis.com") && url.pathname.includes("firestore")) return;
  if (url.hostname.includes("identitytoolkit")) return;

  // Network-first for HTML navigations (so we get latest, fall back to shell when offline)
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(res => {
          const copy = res.clone();
          caches.open(RUNTIME_CACHE).then(c => c.put(request, copy));
          return res;
        })
        .catch(() => caches.match(request).then(r => r || caches.match("/index.html")))
    );
    return;
  }

  // Cache-first for static assets (CSS/JS/images/fonts)
  if (/\.(css|js|png|jpg|jpeg|svg|webp|woff2?|ttf|ico)$/i.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then(cached =>
        cached || fetch(request).then(res => {
          const copy = res.clone();
          caches.open(RUNTIME_CACHE).then(c => c.put(request, copy));
          return res;
        }).catch(() => cached)
      )
    );
    return;
  }
});

self.addEventListener("message", event => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});
