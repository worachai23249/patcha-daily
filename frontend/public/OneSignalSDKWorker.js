importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

const CACHE_NAME = 'hwp-cache-v1';

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response('<h3>ระบบออฟไลน์ (Offline)</h3><p>โปรดเชื่อมต่ออินเทอร์เน็ต</p>', {
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
      })
    );
  }
});
