// GrowthOS Service Worker - 缓存优先策略
const CACHE_NAME = 'growthos-cache-v1';

// 核心资源（构建时确定）
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
];

// 安装时缓存核心资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] 缓存核心资源');
        return cache.addAll(CORE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// 激活时清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] 删除旧缓存:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 拦截网络请求 - 缓存优先策略
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // 跳过非 GET 请求
  if (request.method !== 'GET') {
    return;
  }

  // 跳过 chrome-extension 和外部请求
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      // 缓存命中，直接返回
      if (cachedResponse) {
        // 后台更新缓存（stale-while-revalidate）
        fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, networkResponse.clone());
            });
          }
        }).catch(() => {});
        return cachedResponse;
      }

      // 缓存未命中，网络请求
      return fetch(request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200) {
          return networkResponse;
        }

        // 缓存新资源
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // 网络失败，返回离线页面
        if (request.mode === 'navigate') {
          return caches.match('/');
        }
      });
    })
  );
});

// 后台同步
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-records') {
    event.waitUntil(syncRecords());
  }
});

async function syncRecords() {
  console.log('[SW] 后台同步记录');
}

// 推送通知
self.addEventListener('push', (event) => {
  try {
    const data = event.data?.json() || { title: 'GrowthOS', body: '新提醒' };
    const options = {
      body: data.body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      vibrate: [100, 50, 100],
      data: { url: data.url || '/' },
    };
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  } catch (error) {
    console.error('[SW] 推送处理失败:', error);
  }
});

// 通知点击
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data?.url || '/')
  );
});
