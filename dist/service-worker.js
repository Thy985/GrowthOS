// 缓存名称
const CACHE_NAME = 'growthos-cache-v1';

// 需要缓存的资源
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png',
  '/maskable_icon.png',
  '/static/js/main.js',
  '/static/js/0.chunk.js',
  '/static/js/1.chunk.js',
  '/static/js/2.chunk.js',
  '/static/js/3.chunk.js',
  '/static/js/4.chunk.js',
  '/static/js/5.chunk.js',
  '/static/css/main.css'
];

// 安装 Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('缓存已打开');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// 激活 Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('删除旧缓存:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 拦截网络请求
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // 如果缓存中有响应，则返回缓存
        if (response) {
          return response;
        }

        // 否则发送网络请求
        return fetch(event.request)
          .then((response) => {
            // 检查响应是否有效
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // 克隆响应
            const responseToCache = response.clone();

            // 将响应添加到缓存
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // 如果网络请求失败，返回离线页面
            if (event.request.mode === 'navigate') {
              return caches.match('/');
            }
          });
      })
  );
});

// 处理后台同步
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-records') {
    event.waitUntil(syncRecords());
  }
});

// 同步记录的函数
async function syncRecords() {
  try {
    // 从 IndexedDB 获取待同步的记录
    // 这里需要根据实际的数据存储方式来实现
    console.log('同步记录到服务器');
  } catch (error) {
    console.error('同步记录失败:', error);
  }
}

// 处理推送通知
self.addEventListener('push', (event) => {
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [100, 50, 100],
    data: {
      url: data.url
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// 处理通知点击
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});