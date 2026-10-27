// Review captures for the impeccable finish review: serve the site on :8765, then
//   node .impeccable/capture.cjs
// Writes desktop/mobile screenshots of the agenda (and the states around it), the home and Comércio,
// in the light and the dark theme, into .impeccable/review/. Needs Playwright and a Chromium, found as
// in assets/render.cjs (PLAYWRIGHT_CORE and CHROMIUM, a local playwright-core install, or the
// maintainer's machine). URL overrides the site's address (its folder, ending in /); CLOCK (an ISO date
// and time, e.g. 2026-10-27T10:30:00) fixes "now", and with it the sky of that hour.
const fs = require('fs');
const local = (name) => {
  try {
    return require.resolve(name);
  } catch {
    return null;
  }
};
const HOME_CHROMIUM = '/home/luizcarlos1405/.nix-profile/bin/chromium';
const { chromium } = require(process.env.PLAYWRIGHT_CORE || local('playwright-core') || '/home/luizcarlos1405/.local/lib/node_modules/@playwright/cli/node_modules/playwright-core');
const out = '.impeccable/review';
const base = process.env.URL || 'http://localhost:8765/';
const url = `${base}agenda.html`;
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || (fs.existsSync(HOME_CHROMIUM) ? HOME_CHROMIUM : undefined) });
  const log = (p, tag) => {
    p.on('pageerror', (e) => console.log(tag, 'pageerror:', e.message));
    p.on('console', (m) => m.type() === 'error' && console.log(tag, 'console:', m.text()));
  };
  const context = async (options, scheme) => {
    const ctx = await browser.newContext({ ...options, colorScheme: scheme, acceptDownloads: true, reducedMotion: 'reduce' });
    if (process.env.CLOCK) await ctx.clock.install({ time: new Date(process.env.CLOCK) });
    return ctx;
  };
  // Chromium now and then refuses a capture: one more try after a moment.
  const shot = async (page, options) => {
    try {
      await page.screenshot(options);
    } catch {
      await page.waitForTimeout(500);
      await page.screenshot(options);
    }
  };
  const ready = async (p, address = url, selector = '.event-card') => {
    await p.goto(address);
    await p.waitForSelector(selector);
    await p.evaluate(() => document.fonts.ready);
    await p.waitForTimeout(250);
  };
  const DESK = { viewport: { width: 1440, height: 900 } };
  const PHONE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true };

  // Desktop
  const dctx = await context(DESK, 'light');
  const d = await dctx.newPage(); log(d, 'desktop');
  await ready(d);
  await shot(d, { path: `${out}/desktop.png`, fullPage: true });
  await shot(d, { path: `${out}/desktop-viewport.png` });
  await d.click('#seg-flyer'); await d.waitForTimeout(400);
  await shot(d, { path: `${out}/desktop-flyer-tab.png` });
  const [dl] = await Promise.all([d.waitForEvent('download'), d.click('#download-btn')]);
  await dl.saveAs(`${out}/flyer-next.png`);
  // A day from 1 to 9 in the panel and on the Folha do dia, to see the two-digit numeral ("04").
  const early = '.event-card[data-id^="ev-2026-11-04"]';
  await d.click(early); await d.waitForTimeout(300);
  await shot(d, { path: `${out}/desktop-day4-flyer.png` });
  await d.click('#seg-message'); await d.waitForTimeout(200);
  await shot(d, { path: `${out}/desktop-day4-message.png` });
  await d.click('#tab-month'); await d.waitForTimeout(200);
  await shot(d, { path: `${out}/desktop-month.png`, fullPage: true });
  await d.click('[data-focus="month:prev"]'); await d.waitForTimeout(200);
  await shot(d, { path: `${out}/desktop-month-prev.png`, fullPage: true });
  console.log('desktop scrollWidth', await d.evaluate(() => document.documentElement.scrollWidth));

  const ddark = await context(DESK, 'dark');
  const dd = await ddark.newPage(); log(dd, 'desktop dark');
  await ready(dd);
  await shot(dd, { path: `${out}/desktop-dark.png`, fullPage: true });
  await dd.click('#tab-month'); await dd.waitForTimeout(200);
  await shot(dd, { path: `${out}/desktop-month-dark.png`, fullPage: true });

  // Mobile
  const mctx = await context(PHONE, 'light');
  const m = await mctx.newPage(); log(m, 'mobile');
  await ready(m);
  await shot(m, { path: `${out}/mobile.png`, fullPage: true });
  await shot(m, { path: `${out}/mobile-viewport.png` });
  console.log('mobile scrollWidth', await m.evaluate(() => document.documentElement.scrollWidth));
  await m.click('.event-card >> nth=0'); await m.waitForTimeout(450);
  await shot(m, { path: `${out}/mobile-sheet.png` });
  await m.click('#seg-flyer'); await m.waitForTimeout(400);
  await shot(m, { path: `${out}/mobile-sheet-flyer.png` });
  await m.click('#bench-close'); await m.waitForTimeout(350);
  await m.click('.event-card[data-id^="ev-2026-11-04"]'); await m.waitForTimeout(450);
  await shot(m, { path: `${out}/mobile-day4-flyer.png` });
  await m.click('#seg-message'); await m.waitForTimeout(200);
  await shot(m, { path: `${out}/mobile-day4-message.png` });
  await m.click('#bench-close'); await m.waitForTimeout(350);
  await m.click('#past-toggle'); await m.waitForTimeout(200);
  await shot(m, { path: `${out}/mobile-past.png`, fullPage: true });
  await m.click('#tab-month'); await m.waitForTimeout(200);
  await shot(m, { path: `${out}/mobile-month.png`, fullPage: true });
  // The empty result of a filter (past days hidden again first).
  await m.click('#tab-agenda'); await m.waitForTimeout(150);
  await m.click('#past-toggle'); await m.waitForTimeout(150);
  await m.selectOption('#org-select', { value: 'comafro' }); await m.waitForTimeout(250);
  await shot(m, { path: `${out}/mobile-empty.png` });

  const mdark = await context(PHONE, 'dark');
  const md = await mdark.newPage(); log(md, 'mobile dark');
  await ready(md);
  await shot(md, { path: `${out}/mobile-dark.png`, fullPage: true });
  await md.click('.event-card >> nth=0'); await md.waitForTimeout(450);
  await shot(md, { path: `${out}/mobile-sheet-dark.png` });

  // The home (index.html) and Comércio, full page and first viewport, light and dark.
  for (const [page, name, selector] of [['', 'home', '.next-head'], ['comercio.html', 'comercio', '.soon, .biz']]) {
    for (const [ctx, size] of [[dctx, 'desktop'], [mctx, 'mobile'], [ddark, 'desktop-dark'], [mdark, 'mobile-dark']]) {
      const p = await ctx.newPage(); log(p, `${size} ${name}`);
      await ready(p, base + page, selector);
      await shot(p, { path: `${out}/${size}-${name}.png`, fullPage: true });
      await shot(p, { path: `${out}/${size}-${name}-viewport.png` });
    }
  }
  await browser.close();
})();
