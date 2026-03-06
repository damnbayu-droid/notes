// Service Worker for offline support
const CACHE_NAME = 'smart-notes-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/vite.svg',
    '/manifest.json',
];

// Routes that should always be Network-First or ignored by SW
const IGNORE_ROUTES = [
    'supabase.co',
    'api.openai.com',
    '/auth/v1/',
    '/rest/v1/'
];

// Install event - cache essential files
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(urlsToCache))
    );
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch event - Optimized Strategy
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Skip caching for API calls and dynamic routes
    if (IGNORE_ROUTES.some(route => url.href.includes(route))) {
        return; // Let browser handle normally
    }

    // Network-First strategy for index.html and root to prevent ChunkLoadErrors after deploy
    if (url.pathname === '/' || url.pathname === '/index.html') {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }

    // Cache-First (with Network fallback and update) for static assets
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    return response;
                }

                const fetchRequest = event.request.clone();
                return fetch(fetchRequest).then((response) => {
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });

                    return response;
                });
            })
    );
});
