const CACHE_NAME = 'microbit-controller-v1';
const ASSETS_TO_CACHE = [
    '/microbit-bluetooth-controller/',
    '/microbit-bluetooth-controller/index.html',
    '/microbit-bluetooth-controller/style.css',
    '/microbit-bluetooth-controller/script.js',
    '/microbit-bluetooth-controller/manifest.json',
    '/microbit-bluetooth-controller/controller-logo.png',
    '/microbit-bluetooth-controller/icons/icon-192x192.png',
    '/microbit-bluetooth-controller/icons/icon-512x512.png'
];

// Install Service Worker
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS_TO_CACHE))
            .then(() => self.skipWaiting())
    );
});

// Activate Service Worker
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            );
        })
    );
    self.clients.claim();
});

// Fetch Event - Serve Cached Content
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request);
        })
    );
});
