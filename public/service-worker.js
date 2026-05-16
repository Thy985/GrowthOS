const STATIC_CACHE = 'growthos-static-v1';
const DYNAMIC_CACHE = 'growthos-dynamic-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png',
  '/maskable_icon.png'
];

const CACHE_STRATEGIES = {
  STATIC: 'cache-first',
  DYNAMIC: 'stale-while-revalidate',
  NETWORK_FIRST: 'network-first'
};

function isStaticAsset(url) {
  const ext = url.split('.').pop();
  return ['js', 'css', 'png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'woff', 'woff2', 'ttf', 'eot'].includes(ext);
}

function isAPIRequest(url) {
  return url.includes('/api/') || url.includes('/auth/');
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request)
    .then(response => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);
  
  return cachedResponse || fetchPromise || new Response('Offline', { status: 503 });
}

async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    if (request.mode === 'navigate') {
      return caches.match('/offline.html') || new Response('Offline', { status: 503 });
    }
    
    return new Response('Offline', { status: 503 });
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW] 预缓存静态资源');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => {
        return Promise.all(
          keys
            .filter(key => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
            .map(key => {
              console.log('[SW] 删除旧缓存:', key);
              return caches.delete(key);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  if (url.origin !== location.origin && !request.url.startsWith(self.location.origin)) {
    return;
  }
  
  let strategy = CACHE_STRATEGIES.DYNAMIC;
  let cacheName = DYNAMIC_CACHE;
  
  if (isStaticAsset(url.pathname)) {
    strategy = CACHE_STRATEGIES.STATIC;
    cacheName = STATIC_CACHE;
  } else if (isAPIRequest(url.pathname)) {
    strategy = CACHE_STRATEGIES.NETWORK_FIRST;
  } else if (request.mode === 'navigate') {
    strategy = CACHE_STRATEGIES.NETWORK_FIRST;
  }
  
  event.respondWith(
    (async () => {
      switch (strategy) {
        case CACHE_STRATEGIES.STATIC:
          return cacheFirst(request, cacheName);
        case CACHE_STRATEGIES.DYNAMIC:
          return staleWhileRevalidate(request, cacheName);
        case CACHE_STRATEGIES.NETWORK_FIRST:
          return networkFirst(request, cacheName);
        default:
          return fetch(request);
      }
    })()
  );
});

self.addEventListener('sync', (event) => {
  console.log('[SW] 收到后台同步事件:', event.tag);
  
  if (event.tag === 'sync-pending-data') {
    event.waitUntil(processBackgroundSync());
  }
});

async function processBackgroundSync() {
  try {
    const clients = await self.clients.matchAll();
    
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_STARTED',
        timestamp: new Date().toISOString()
      });
    });
    
    console.log('[SW] 后台同步完成');
    
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETED',
        timestamp: new Date().toISOString()
      });
    });
  } catch (error) {
    console.error('[SW] 后台同步失败:', error);
    
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_FAILED',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    });
    
    throw error;
  }
}

self.addEventListener('message', (event) => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
    case 'TRIGGER_SYNC':
      processBackgroundSync();
      break;
    case 'GET_VERSION':
      event.ports[0].postMessage({ version: STATIC_CACHE });
      break;
  }
});

self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  let data;
  try {
    data = event.data.json();
  } catch {
    data = {
      title: 'GrowthOS',
      body: event.data.text(),
      url: '/'
    };
  }
  
  const options = {
    body: data.body || '您有新的通知',
    icon: '/logo192.png',
    badge: '/favicon.ico',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
      timestamp: Date.now()
    },
    actions: [
      { action: 'open', title: '打开' },
      { action: 'dismiss', title: '忽略' }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'GrowthOS', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'dismiss') return;
  
  const url = event.notification.data?.url || '/';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        for (const client of clientList) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        
        if (self.clients.openWindow) {
          return self.clients.openWindow(url);
        }
      })
  );
});

self.addEventListener('notificationclose', (event) => {
  console.log('[SW] 通知被关闭:', event.notification.title);
});

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'sync-tag') {
    event.waitUntil(processBackgroundSync());
  }
});
