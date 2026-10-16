// Renders the PWA and link-preview assets from their HTML sources:
//   node assets/render.cjs            all of them
//   node assets/render.cjs icons      only the icons and favicons (assets/icon.html)
//   node assets/render.cjs og         only the link preview (assets/og-image.html)
//   node assets/render.cjs shots      only the manifest screenshots (the site itself)
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

// A fresh page per render: icon.html reads its variant from the hash only when it loads. The
// templates set html[data-ready] once the word is drawn with the font loaded.
async function renderPage(browser, url, { width, height, out, transparent = false }) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await page.goto(url);
  await page.waitForSelector('html[data-ready]', { state: 'attached' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: out, omitBackground: transparent });
  await page.close();
  console.log('wrote', path.relative(ROOT, out));
}

// The theme the site uses (data-theme on <html> in index.html) goes to the templates as ?tema=,
// so adopting a theme carries through to the icons and the link preview.
const THEME = (fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8').match(/<html[^>]*\sdata-theme="([^"]*)"/) || [])[1] || '';
const themed = (page) => (THEME ? `${page}?tema=${encodeURIComponent(THEME)}` : page);

async function renderIcons(browser, base) {
  fs.mkdirSync(ICONS, { recursive: true });
  for (const [file, variant, size] of ICON_FILES) {
    // 'any' and the favicons keep their transparent corners; the others are full-bleed squares.
    const transparent = variant === 'any' || variant === 'favicon';
    await renderPage(browser, `${base}${themed('assets/icon.html')}#${variant}`, { width: size, height: size, out: path.join(ICONS, file), transparent });
  }
}

async function renderOg(browser, base) {
  await renderPage(browser, `${base}${themed('assets/og-image.html')}`, { width: 1200, height: 630, out: path.join(ROOT, 'assets/og-image.png') });
}

async function renderShots(browser, base) {
  fs.mkdirSync(SHOTS, { recursive: true });
  const open = async (options) => {
    const context = await browser.newContext({ ...options, reducedMotion: 'reduce', serviceWorkers: 'block' });
    const page = await context.newPage();
    await page.clock.install({ time: new Date(SHOT_DAY) });
    await page.goto(base);
    await page.waitForSelector('.sheet');
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(300);
    return { context, page };
  };
  const shot = async (page, file) => {
    await page.screenshot({ path: path.join(SHOTS, file) });
    console.log('wrote', path.relative(ROOT, path.join(SHOTS, file)));
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
