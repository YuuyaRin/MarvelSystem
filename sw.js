/* MARVEL 宇宙观影指挥中心 — Service Worker
   策略:核心文件预缓存;同源请求「网络优先、缓存兜底」,保证更新即时、离线可用。 */

const VERSION = 'v17';
const CACHE = `marvel-system-${VERSION}`;

const CORE = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/style.css',
  `js/data.js?v=17`,
  `js/posters.js?v=17`,
  `js/characters.js?v=17`,
  `js/lore.js?v=17`,
  `js/insights.js?v=17`,
  `js/routes.js?v=17`,
  `js/store.js?v=17`,
  `js/report.js?v=17`,
  `js/timeline-axis.js?v=17`,
  `js/lab3d.js?v=17`,
  `js/three-views.js?v=17`,
  `js/app.js?v=17`,
  'vendor/three.min.js',
  'icons/icon-192.png',
  'icons/icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;

  // 海报等跨域资源:网络优先,成功后缓存副本供离线使用
  if (url.origin !== location.origin) {
    if (url.hostname === 'upload.wikimedia.org') {
      e.respondWith(
        caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
          if (res.ok || res.type === 'opaque') {
            const copy = res.clone();
            caches.open(CACHE).then(c => c.put(e.request, copy));
          }
          return res;
        }))
      );
    }
    return; // 其它跨域(如 Google Fonts)交给浏览器
  }

  // 同源:网络优先,失败回退缓存(离线模式)
  e.respondWith(
    fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy));
      return res;
    }).catch(() =>
      caches.match(e.request).then(hit => hit || caches.match('index.html'))
    )
  );
});
