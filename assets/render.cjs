// Renders the PWA and link-preview assets from their HTML sources:
//   node assets/render.cjs            all of them
//   node assets/render.cjs icons      only the icons and favicons (assets/icon.html)
//   node assets/render.cjs og         only the link preview (assets/og-image.html)
//   node assets/render.cjs shots      only the manifest screenshots (the site itself: calendario.html
//                                     and comercio.html)
// It serves the project folder itself, on a free local port. Needs Playwright and a Chromium:
// `npm i --no-save playwright-core && npx playwright-core install chromium` in the project folder,
// or PLAYWRIGHT_CORE and CHROMIUM pointing at your own.
const http = require('http');
const fs = require('fs');
const path = require('path');

// The maintainer's machine, used when nothing else is found.
const HOME_PLAYWRIGHT = '/home/luizcarlos1405/.local/lib/node_modules/@playwright/cli/node_modules/playwright-core';
const HOME_CHROMIUM = '/home/luizcarlos1405/.nix-profile/bin/chromium';
const local = (name) => {
  try {
    return require.resolve(name);
  } catch {
    return null;
  }
};
const PLAYWRIGHT_CORE = process.env.PLAYWRIGHT_CORE || local('playwright-core') || HOME_PLAYWRIGHT;
// Undefined = the Chromium Playwright installed.
const CHROMIUM = process.env.CHROMIUM || (fs.existsSync(HOME_CHROMIUM) ? HOME_CHROMIUM : undefined);
const { chromium } = require(PLAYWRIGHT_CORE);

const ROOT = path.resolve(__dirname, '..');
const ICONS = path.join(ROOT, 'assets/icons');
const SHOTS = path.join(ROOT, 'assets/screenshots');

// Each icon file: the template variant (icon.html#variant) and its pixel size.
const ICON_FILES = [
  ['icon-192.png', 'any', 192],
  ['icon-512.png', 'any', 512],
  ['icon-maskable-192.png', 'maskable', 192],
  ['icon-maskable-512.png', 'maskable', 512],
  ['apple-touch-icon.png', 'apple', 180],
  ['favicon-16.png', 'favicon', 16],
  ['favicon-32.png', 'favicon', 32],
  ['favicon-48.png', 'favicon', 48],
];

// The screenshots show a fixed day, so they read the same whenever they are made.
const SHOT_DAY = '2026-10-15T10:00:00';
const SHOT_ACTIVITY = '.line[data-id^="ev-2026-10-18"]'; // Almoço dos Educadores: time, place and contact

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.csv': 'text/csv; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
};

function serve(root) {
  const server = http.createServer((req, res) => {
    let file = path.join(root, decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
    if (file !== root && !file.startsWith(root + path.sep)) {
      res.writeHead(403).end();
      return;
    }
    if (file.endsWith(path.sep)) file = path.join(file, 'index.html');
    fs.readFile(file, (err, data) => {
      if (err) {
        res.writeHead(404).end();
        return;
      }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' }).end(data);
    });
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}

// Every PNG says where it comes from, in a tEXt chunk after its header (the keyword the impeccable
// skill reads with `impeccable embed-prompt <file> --read`), so the origin travels with the file.
const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(bytes) {
  let c = 0xffffffff;
  for (const byte of bytes) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function stampOrigin(file, origin) {
  const png = fs.readFileSync(file);
  const data = Buffer.from(`impeccable:prompt\0${origin}`, 'latin1');
  const chunk = Buffer.alloc(12 + data.length);
  chunk.writeUInt32BE(data.length, 0);
  chunk.write('tEXt', 4, 'latin1');
  data.copy(chunk, 8);
  chunk.writeUInt32BE(crc32(chunk.subarray(4, 8 + data.length)), 8 + data.length);
  const afterHeader = 8 + 12 + png.readUInt32BE(8); // signature + IHDR
  fs.writeFileSync(file, Buffer.concat([png.subarray(0, afterHeader), chunk, png.subarray(afterHeader)]));
}

// A fresh page per render: icon.html reads its variant from the hash only when it loads. The
// templates set html[data-ready] once they are drawn (the link preview waits for its fonts).
async function renderPage(browser, url, { width, height, out, transparent = false, origin }) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await page.goto(url);
  await page.waitForSelector('html[data-ready]', { state: 'attached' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: out, omitBackground: transparent });
  await page.close();
  stampOrigin(out, origin);
  console.log('wrote', path.relative(ROOT, out));
}

// The theme the site uses (data-theme on <html>, the same in the three pages; read from index.html)
// goes to the templates as ?tema=, so adopting a theme carries through to the icons and the link preview.
const THEME = (fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8').match(/<html[^>]*\sdata-theme="([^"]*)"/) || [])[1] || '';
const themed = (page) => (THEME ? `${page}?tema=${encodeURIComponent(THEME)}` : page);

async function renderIcons(browser, base) {
  fs.mkdirSync(ICONS, { recursive: true });
  for (const [file, variant, size] of ICON_FILES) {
    // 'any' and the favicons keep their transparent corners; the others are full-bleed squares.
    const transparent = variant === 'any' || variant === 'favicon';
    const origin = `Drawn in HTML, not generated: assets/icon.html#${variant} (the NOS mark of js/icons.js), rendered at ${size}x${size}px by node assets/render.cjs icons.`;
    await renderPage(browser, `${base}${themed('assets/icon.html')}#${variant}`, { width: size, height: size, out: path.join(ICONS, file), transparent, origin });
  }
}

async function renderOg(browser, base) {
  const origin = 'Drawn in HTML, not generated: assets/og-image.html (the NOS mark of js/icons.js on the pad), rendered at 1200x630px by node assets/render.cjs og.';
  await renderPage(browser, `${base}${themed('assets/og-image.html')}`, { width: 1200, height: 630, out: path.join(ROOT, 'assets/og-image.png'), origin });
}

async function renderShots(browser, base) {
  fs.mkdirSync(SHOTS, { recursive: true });
  const open = async (options, file = 'calendario.html', ready = '.sheet') => {
    const context = await browser.newContext({ ...options, reducedMotion: 'reduce', serviceWorkers: 'block' });
    const page = await context.newPage();
    await page.clock.install({ time: new Date(SHOT_DAY) });
    await page.goto(`${base}${file}`);
    await page.waitForSelector(ready);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(300);
    return { context, page };
  };
  const shot = async (page, file) => {
    const out = path.join(SHOTS, file);
    await page.screenshot({ path: out });
    const where = new URL(page.url()).pathname.split('/').pop() || 'index.html';
    stampOrigin(out, `Screenshot of the site itself, not generated: ${where} with the data of data/, clock fixed at ${SHOT_DAY}, taken by node assets/render.cjs shots.`);
    console.log('wrote', path.relative(ROOT, out));
  };

  // Phone (narrow): 390x844 at DPR 2 = 780x1688.
  const phone = await open({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await shot(phone.page, 'phone-agenda.png');
  await phone.page.click(SHOT_ACTIVITY);
  await phone.page.waitForTimeout(500);
  await shot(phone.page, 'phone-message.png');
  await phone.page.click('#seg-flyer');
  await phone.page.waitForTimeout(500);
  await shot(phone.page, 'phone-flyer.png');
  await phone.context.close();

  const commerce = await open({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }, 'comercio.html', '.biz');
  await shot(commerce.page, 'phone-comercio.png');
  await commerce.context.close();

  // Desktop (wide): 1440x900.
  const desk = await open({ viewport: { width: 1440, height: 900 } });
  await desk.page.click(SHOT_ACTIVITY);
  await desk.page.mouse.move(1, 1); // no hover underline on the picked line
  await desk.page.waitForTimeout(300);
  await shot(desk.page, 'desktop.png');
  await desk.context.close();
}

(async () => {
  const only = process.argv[2];
  const server = await serve(ROOT);
  const base = `http://127.0.0.1:${server.address().port}/`;
  const browser = await chromium.launch({ executablePath: CHROMIUM });
  try {
    if (!only || only === 'icons') await renderIcons(browser, base);
    if (!only || only === 'og') await renderOg(browser, base);
    if (!only || only === 'shots') await renderShots(browser, base);
  } finally {
    await browser.close();
    server.close();
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
