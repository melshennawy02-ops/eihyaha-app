// Service Worker لتطبيق «إحياها باستمتاع»
// - بيخلي التطبيق قابل للتثبيت (PWA) ولتحويله لنسخة أندرويد عبر PWABuilder
// - بيحفظ نسخة من الصفحة عشان تفتح أسرع (التطبيق نفسه محتاج نت لبيانات Firebase)
// - جاهز لاستقبال الإشعارات الحقيقية (Push) لما نفعّلها
const CACHE = 'eihyaha-v1';
const SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// الصفحة: من النت الأول (عشان التحديثات توصل فورًا)، ولو مفيش نت نعرض النسخة المحفوظة
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // Firebase والصور الخارجية بتروح للنت مباشرة
  e.respondWith(
    fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
  );
});
// الإشعارات الحقيقية (هتشتغل لما نربط Firebase Cloud Messaging)
self.addEventListener('push', e => {
  let data = {};
  try { data = e.data ? e.data.json() : {}; } catch (err) { data = { body: e.data ? e.data.text() : '' }; }
  const n = data.notification || data;
  e.waitUntil(self.registration.showNotification(n.title || 'إحياها باستمتاع 🌿', {
    body: n.body || 'بذرتك مستنياك — دقيقة واحدة لنفسك النهاردة 🌱',
    icon: './icon-192.png', badge: './icon-192.png', dir: 'rtl', lang: 'ar',
    data: { url: n.url || './' }
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const target = (e.notification.data && e.notification.data.url) || './';
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) { if ('focus' in c) return c.focus(); }
    return clients.openWindow(target);
  }));
});
