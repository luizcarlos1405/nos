// Offline support. Network-first for everything: the live site and the live spreadsheet always win,
// and the cache is only a fallback when the network fails. Every successful response refreshes the
// cache, so there is no version to bump on deploy: the cache name changes only if the way copies are
// kept changes.

// This app's caches share this prefix. On activation only older caches of this app are removed:
// another app on the same origin (e.g. GitHub Pages, one origin for every repository) keeps its own.
const CACHE_PREFIX = 'nos-dourados-';
const CACHE = `${CACHE_PREFIX}v1`;

// Absolute address without the #fragment (never sent to the server), or null if it can't be parsed.
// Relative addresses resolve against this script, which sits next to the pages, like theirs.
function absolute(url) {
  try {
    const parsed = new URL(url, location.href);
    parsed.hash = '';
    return parsed.href;
  } catch {
    return null;
  }
}

// The spreadsheets' CSVs can live on another origin. Every page passes them in the query string
// (registerWorker in js/page.js: CSV_URL, the agenda, and COMMERCE_CSV_URL, the businesses, both
// from js/config.js, maybe relative like 'data/agenda.csv'). Request URLs are absolute, so these are too.
const CSV_URLS = new URL(location.href).searchParams.getAll('csv').map(absolute).filter(Boolean);

// Set on saved CSV copies so the page can tell it's showing saved (possibly stale) data.
const CACHED_AT_HEADER = 'X-Cached-At';

// The saved home page: what an address of the app's folder that was never saved falls back to offline.
const HOME = absolute('./');

// App shell, cached on install so the first visit already works offline: on that visit the page
// isn't controlled by this worker yet, so only what is listed here gets saved. That is the three
// pages (index.html as './', calendario.html, comercio.html) and everything they load: the manifest
// and its icons, the favicons, the three stylesheets with the fonts they declare and the woven band
// (assets/faixa.svg), every module reached from js/home.js, js/app.js and js/comercio.js, and the
// vendored image library (which also fetches the fonts again to embed them in the flyer PNG). Later
// visits also save at runtime anything missing here, but keep this list in step with those files.
const SHELL = [
  './',
  'calendario.html',
  'comercio.html',
  'manifest.webmanifest',
  'assets/icons/icon-192.png',
  'assets/icons/icon-512.png',
  'assets/icons/icon-maskable-192.png',
  'assets/icons/icon-maskable-512.png',
  'assets/icons/apple-touch-icon.png',
  'assets/icons/favicon-16.png',
  'assets/icons/favicon-32.png',
  'assets/icons/favicon-48.png',
  'assets/faixa.svg',
  'css/theme.css',
  'css/style.css',
  'css/flyers.css',
  'js/app.js',
  'js/agenda.js',
  'js/businesses.js',
  'js/colors.js',
  'js/comercio.js',
  'js/config.js',
  'js/csv.js',
  'js/events.js',
  'js/flyer.js',
  'js/holidays.js',
  'js/home.js',
  'js/icons.js',
  'js/month.js',
  'js/page.js',
  'js/sky.js',
  'js/whatsapp.js',
  'js/vendor/html-to-image.js',
  'fonts/bricolage-grotesque.woff2',
  'fonts/inter.woff2',
  'fonts/barlow-500.woff2',
  'fonts/barlow-600.woff2',
  'fonts/barlow-700.woff2',
  'fonts/barlow-condensed-600.woff2',
  'fonts/barlow-condensed-700.woff2',
  'fonts/barlow-condensed-800.woff2',
];

const isCSV = (url) => CSV_URLS.includes(absolute(url));

// Cacheable = a complete, successful, readable response.
const cacheable = (res) => res.ok && res.status !== 206 && (res.type === 'basic' || res.type === 'cors');

// Copies are saved under their bare URL, never under the page's Request: an entry saved by the
// install (no request headers) and one saved later must replace each other even when the server
// sends Vary. Pages are saved without their query (?tema=escuro, ?utm_source=…, ?fbclid=…): it is
// the same static file, and one copy per query would grow the cache with every shared link. For the
// same reason index.html and its folder share one copy, refreshed by a visit to either address.
function keyFor(request) {
  if (request.mode !== 'navigate') return absolute(request.url);
  const url = new URL(request.url);
  url.search = '';
  url.hash = '';
  url.pathname = url.pathname.replace(/\/index\.html$/, '/');
  return url.href;
}

// Store a copy. A redirected response is saved as a plain one (a page refuses to be answered with a
// redirected response, which the install's fetch of './' can get from some hosts), and CSV copies get
// stamped with the time they were saved.
async function store(cache, key, res) {
  const csv = isCSV(key);
  if (!csv && !res.redirected) return cache.put(key, res);
  const headers = new Headers(res.headers);
  if (csv) {
    headers.set(CACHED_AT_HEADER, new Date().toISOString());
    // For a CSV on another origin, browsers that apply CORS rules to the copy still let the page read the stamp.
    headers.set('Access-Control-Expose-Headers', CACHED_AT_HEADER);
  }
  const body = await res.blob();
  return cache.put(key, new Response(body, { status: res.status, statusText: res.statusText, headers }));
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // Best effort: one missing file must not keep the worker from installing. What can't be fetched
    // now keeps the copy an earlier worker saved under the same cache name, if any.
    const urls = [...SHELL.map(absolute), ...CSV_URLS];
    await Promise.all(urls.map(async (url) => {
      try {
        const res = await fetch(url, { cache: 'no-cache', mode: isCSV(url) ? 'cors' : 'same-origin' });
        if (!cacheable(res)) throw new Error(`HTTP ${res.status}`);
        await store(cache, url, res);
      } catch (err) {
        console.warn('[sw] could not save', url, err);
      }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE).map((key) => caches.delete(key)));
    // The cache keeps only what this worker lists: copies of files a deploy removed, or of a
    // spreadsheet the site no longer reads, go.
    const cache = await caches.open(CACHE);
    const keep = new Set([...SHELL.map(absolute), ...CSV_URLS]);
    await Promise.all((await cache.keys()).filter((req) => !keep.has(req.url)).map((req) => cache.delete(req)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  // Only whole GETs: HEAD, POST and Range requests (media) go straight to the network.
  if (request.method !== 'GET' || request.headers.has('range')) return;
  const url = new URL(request.url);
  const sameOrigin = url.origin === location.origin;
  if (!sameOrigin && !isCSV(request.url)) return;
  if (sameOrigin && url.pathname === location.pathname) return; // never serve sw.js itself
  event.respondWith(networkFirst(event, request));
});

async function networkFirst(event, request) {
  const cache = await caches.open(CACHE);
  let res;
  try {
    res = await fetch(request);
  } catch (err) {
    return (await fromCache(cache, request)) || Promise.reject(err);
  }
  // Server errors also fall back, but are passed through when nothing is saved.
  if (res.status >= 500) return (await fromCache(cache, request)) || res;
  // A page's redirect comes back unfollowed (opaqueredirect) and isn't cacheable: the browser follows
  // it and the page it lands on is saved instead.
  if (cacheable(res)) event.waitUntil(store(cache, keyFor(request), res.clone()));
  // A response that followed a redirect goes back to the page as a plain copy. The published Google
  // Sheets CSV answers 307 to googleusercontent.com, and some Firefox builds (Playwright's; stock
  // Firefox 156 is fine) never hand a redirected response from respondWith to the page, whose fetch
  // then hangs. The copy is harmless everywhere.
  if (res.redirected && request.mode !== 'navigate') {
    return new Response(await res.blob(), { status: res.status, statusText: res.statusText, headers: res.headers });
  }
  return res;
}

// A page address in the app's own folder. Deeper ones would get the home page at the wrong base,
// unstyled, so offline they fail like any page the browser can't reach.
const inHomeFolder = (url) => new URL(url).pathname.replace(/[^/]*$/, '') === new URL(HOME).pathname;

async function fromCache(cache, request) {
  return (await cache.match(keyFor(request), { ignoreVary: true }))
    // Any other address of the app's folder (a page never opened online) gets the saved home page.
    || (request.mode === 'navigate' && inHomeFolder(request.url) && (await cache.match(HOME, { ignoreVary: true })))
    || null;
}
