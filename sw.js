// MORTI///STYLE Service Worker: Shell offline verfuegbar, Daten immer frisch aus dem Netz
const V = 'ms-v1';
const SHELL = ['./', 'index.html', 'style.css', 'i18n.js', 'config.js', 'store.js', 'icons.js', 'app.js', 'admin.js', 'cloud.js', 'main.js', 'icon.svg'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(SHELL).catch(() => {})).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin) return; // Supabase/Fonts nicht abfangen
  e.respondWith(fetch(r).then(res => { const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); return res; }).catch(() => caches.match(r).then(m => m || caches.match('index.html'))));
});
