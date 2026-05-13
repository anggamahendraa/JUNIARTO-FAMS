// Basic Service Worker for PWA installation requirement
const CACHE_NAME = 'family-tree-pwa-v1';

self.addEventListener('install', (event) => {
  // Skip waiting to activate immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Claim clients immediately
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // We need a fetch event listener to satisfy the PWA install criteria.
  // For now, we'll just let all requests pass through normally.
  event.respondWith(fetch(event.request));
});
