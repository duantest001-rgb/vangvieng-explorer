/* ═══════════════════════════════════════════════
   VangVieng Explorer — Service Worker
   Cache strategy: Cache First for assets, Network First for API
═══════════════════════════════════════════════ */

const CACHE_NAME = 'vve-v1';
const STATIC_ASSETS = [
  '/vangvieng-explorer/',
  '/vangvieng-explorer/index.html',
  '/vangvieng-explorer/pages/explore.html',
  '/vangvieng-explorer/pages/detail.html',
  '/vangvieng-explorer/pages/map.html',
  '/vangvieng-explorer/pages/ai-chat.html',
  '/vangvieng-explorer/pages/saved.html',
  '/vangvieng-explorer/css/style.css',
  '/vangvieng-explorer/css/explore.css',
  '/vangvieng-explorer/css/detail.css',
  '/vangvieng-explorer/css/map.css',
  '/vangvieng-explorer/css/ai-chat.css',
  '/vangvieng-explorer/js/app.js',
  '/vangvieng-explorer/js/explore.js',
  '/vangvieng-explorer/js/detail.js',
  '/vangvieng-explorer/js/map.js',
  '/vangvieng-explorer/js/ai-chat.js',
  '/vangvieng-explorer/js/supabase.js',
  '/vangvieng-explorer/js/saved.js',
  '/vangvieng-explorer/js/reviews.js',
  '/vangvieng-explorer/js/trip-planner.js',
  '/vangvieng-explorer/js/i18n.js',
  '/vangvieng-explorer/assets/logo.png',
];

// ── INSTALL: cache static assets ──
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ── ACTIVATE: clean old caches ──
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ── FETCH: Cache First for assets, Network First for API ──
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Skip non-GET & external API calls (Supabase, Claude Worker)
  if (e.request.method !== 'GET') return;
  if (url.hostname.includes('supabase.co')) return;
  if (url.hostname.includes('workers.dev')) return;
  if (url.hostname.includes('googleapis.com')) return;
  if (url.hostname.includes('google.com')) return;

  // Cache First — static assets
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        // Cache new responses
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return res;
      }).catch(() => {
        // Offline fallback
        if (e.request.destination === 'document') {
          return caches.match('/vangvieng-explorer/index.html');
        }
      });
    })
  );
});
