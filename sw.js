self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

// รองรับการทำงานของการได้รับ Push Notifications ในอนาคต (Phase 2)
self.addEventListener('push', function(event) {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body || 'มีการเคลื่อนไหวใหม่ในระบบการเงิน',
      icon: '/logo.png',
      badge: '/logo.png', // ตัวลูกศร/ไอคอนเล็กๆ ใน Notification bar (Android)
      vibrate: [200, 100, 200, 100, 200, 100, 200], // สั่นแบบรัว (แอปพลิเคชันสไตล์)
      data: { url: data.url || '/' },
      requireInteraction: true // แนะนำให้ค้างไว้ที่จอจนกว่าจะกด
    };
    event.waitUntil(self.registration.showNotification(data.title || "The House of Worship", options));
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close(); // ปิดแจ้งเตือนหลังกด
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      const targetUrl = event.notification.data.url;
      // กรณีเคยเปิดจอไว้อยู่แล้ว ก็เรียกโฟกัสที่หน้าเดิม
      for (let i = 0; i < clientList.length; i++) {
        let client = clientList[i];
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      // กรณีถ้ามือถือพับอยู่ ให้แอปเด้งทำงานขึ้นมาใหม่
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

self.addEventListener('fetch', (event) => {
  // จำเป็นต้องมีคำสั่งดักจับ Fetch เพื่อให้เบราว์เซอร์อย่าง Chrome 
  // ยอมรับว่าเป็นแอปพลิเคชัน (PWA) เต็มรูปแบบ และยอมให้ดาวน์โหลด
});
