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

// The sheets. Every page passes them in the query string (registerWorker in js/page.js, from
// js/config.js): `csv`, a CSV that can live on another origin (COMMERCE_CSV_URL, the businesses), and
// `dir`, a folder whose every file is a sheet (AGENDA_DIR, the agenda: index.json and one CSV per month,
// js/agenda-source.js). They may be relative, like 'data/agenda/'; request URLs are absolute, so these
// are too.
const params = new URL(location.href).searchParams;
const CSV_URLS = params.getAll('csv').map(absolute).filter(Boolean);
const SHEET_DIRS = params.getAll('dir').map(absolute).filter((dir) => dir && dir.endsWith('/'));

// Set on saved sheet copies so the page can tell it's showing saved (possibly stale) data.
const CACHED_AT_HEADER = 'X-Cached-At';

// The saved home page: what an address of the app's folder that was never saved falls back to offline.
const HOME = absolute('./');

// App shell, cached on install so the first visit already works offline: on that visit the page
// isn't controlled by this worker yet, so only what is listed here gets saved. That is the three
// pages (index.html as './', agenda.html, comercio.html), the agenda's old address (calendario.html, which
// forwards to agenda.html) and everything they load: the manifest
// and its icons, the favicons, the three stylesheets with the fonts they declare and the woven band
// (assets/faixa.svg), every module reached from js/home.js, js/app.js and js/comercio.js, and the
// vendored image library (which also fetches the fonts again to embed them in the flyer PNG). Later
// visits also save at runtime anything missing here, but keep this list in step with those files.
const SHELL = [
  './',
  'agenda.html',
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
  'js/agenda-source.js',
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
  'js/ics.js',
  'js/month.js',
  'js/page.js',
  'js/save-menu.js',
  'js/sky.js',
  'js/whatsapp.js',
  'js/vendor/html-to-image.js',
  'fonts/bricolage-grotesque.woff2',
  'fonts/inter.woff2',
];

const inSheetDir = (url) => SHEET_DIRS.some((dir) => url.startsWith(dir));
const isSheet = (url) => {
  const key = absolute(url);
  return Boolean(key) && (CSV_URLS.includes(key) || inSheetDir(key));
};

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
// redirected response, which the install's fetch of './' can get from some hosts), and sheet copies get
// stamped with the time they were saved.
async function store(cache, key, res) {
  const sheet = isSheet(key);
  if (!sheet && !res.redirected) return cache.put(key, res);
  const headers = new Headers(res.headers);
  if (sheet) {
    headers.set(CACHED_AT_HEADER, new Date().toISOString());
    // For a CSV on another origin, browsers that apply CORS rules to the copy still let the page read the stamp.
    headers.set('Access-Control-Expose-Headers', CACHED_AT_HEADER);
  }
  const body = await res.blob();
  return cache.put(key, new Response(body, { status: res.status, statusText: res.statusText, headers }));
}

// Saves one file for the install. Best effort: one missing file must not keep the worker from
// installing, and what can't be fetched now keeps the copy an earlier worker saved under the same cache
// name, if any. Returns the response saved (a copy), or null.
async function save(cache, url) {
  try {
    const res = await fetch(url, { cache: 'no-cache', mode: isSheet(url) ? 'cors' : 'same-origin' });
    if (!cacheable(res)) throw new Error(`HTTP ${res.status}`);
    const copy = res.clone();
    await store(cache, url, res);
    return copy;
  } catch (err) {
    console.warn('[sw] could not save', url, err);
    return null;
  }
}

// The agenda's months the agenda page opens with, so the first visit already works offline: its
// index.json, then every month whose activities reach the 1st of last month (js/app.js opens there;
// js/agenda-source.js explains the index; the home needs less, from today on).
async function saveAgenda(cache, dir) {
  const res = await save(cache, new URL('index.json', dir).href);
  const months = res ? await res.json().then((data) => data?.months, () => null) : null;
  if (!Array.isArray(months)) return;
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const first = `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, '0')}-01`;
  const wanted = months.filter((entry) => /^\d{4}-\d{2}$/.test(entry?.month) && typeof entry.until === 'string' && entry.until >= first);
  await Promise.all(wanted.map((entry) => save(cache, new URL(`${entry.month}.csv`, dir).href)));
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await Promise.all([
      ...[...SHELL.map(absolute), ...CSV_URLS].map((url) => save(cache, url)),
      ...SHEET_DIRS.map((dir) => saveAgenda(cache, dir)),
    ]);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE).map((key) => caches.delete(key)));
    // The cache keeps only what this worker lists, and the agenda's months read so far: copies of
    // files a deploy removed, or of a spreadsheet the site no longer reads (data/agenda.csv, before the
    // agenda was a month per file), go.
    const cache = await caches.open(CACHE);
    const keep = new Set([...SHELL.map(absolute), ...CSV_URLS]);
    await Promise.all((await cache.keys()).filter((req) => !keep.has(req.url) && !inSheetDir(req.url)).map((req) => cache.delete(req)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  // Only whole GETs: HEAD, POST and Range requests (media) go straight to the network.
  if (request.method !== 'GET' || request.headers.has('range')) return;
  const url = new URL(request.url);
  const sameOrigin = url.origin === location.origin;
  if (!sameOrigin && !isSheet(request.url)) return;
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
