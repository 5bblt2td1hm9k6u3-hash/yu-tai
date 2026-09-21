// 株主優待管理アプリ用 Service Worker
// ページ本体をキャッシュし、オフラインでも開けるようにする

const CACHE_NAME = 'yutai-tracker-cache-v1';
const CORE_ASSETS = ['./', './index.html'];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .catch(() => {}) // ファイル名が違う環境でも失敗しないようにする
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // オンライン時：最新版を取得しつつキャッシュも更新しておく（次回オフライン時のため）
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() =>
        // オフライン時：キャッシュから返す。無ければトップページのキャッシュで代用
        caches.match(event.request).then((cached) => cached || caches.match('./index.html'))
      )
  );
});
