/* Copete Club: funciona sin conexión después de la primera visita. */
const CACHE = "copete-v2";
const SHELL = ["./", "index.html", "app.js", "data.json", "world.json", "manifest.webmanifest", "privacidad.html", "icons/icon-192.png", "icons/icon-512.png"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  // Red primero (contenido fresco), caché si no hay conexión.
  e.respondWith(fetch(req).then((res) => {
    if (res.ok || res.type === "opaque") { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
    return res;
  }).catch(() => caches.match(req, { ignoreSearch: req.mode === "navigate" }).then((r) => r || (req.mode === "navigate" ? caches.match("index.html") : undefined))));
});
