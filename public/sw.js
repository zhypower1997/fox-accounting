const CACHE_NAME = 'fox-accounting-v2';
const urlsToCache = [
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
];

// 安装 Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    }),
  );
});

// 拦截请求
self.addEventListener('fetch', (event) => {
  // 开发环境和API请求直接走网络
  if (
    new URL(event.request.url).searchParams.has('dev') ||
    event.request.url.includes('/api/') ||
    event.request.method !== 'GET'
  ) {
    return fetch(event.request);
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 对于成功的响应，更新缓存
        if (response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // 网络失败时尝试返回缓存
        return caches.match(event.request);
      }),
  );
});
// 监听skipWaiting消息
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// 激活时清理所有旧缓存并立即接管控制
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all([
        // 清理所有旧缓存
        ...cacheNames.map((cacheName) => {
          return caches.delete(cacheName);
        }),
        // 立即接管控制权
        self.clients.claim(),
      ]);
    }),
  );
});
