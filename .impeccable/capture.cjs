// Review captures for the impeccable finish review: serve the site on :8765, then
//   node .impeccable/capture.cjs
// Writes desktop/mobile screenshots of the calendar (and the states around it), the home and Comércio
// into .impeccable/review/. Needs Playwright and a Chromium, found as in assets/render.cjs
// (PLAYWRIGHT_CORE and CHROMIUM, a local playwright-core install, or the maintainer's machine). URL
// overrides the site's address (its folder, ending in /).
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
const url = `${base}calendario.html`;
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || (fs.existsSync(HOME_CHROMIUM) ? HOME_CHROMIUM : undefined) });
  const log = (p, tag) => {
    p.on('pageerror', (e) => console.log(tag, 'pageerror:', e.message));
    p.on('console', (m) => m.type() === 'error' && console.log(tag, 'console:', m.text()));
  };
  const ready = async (p) => {
    await p.goto(url);
    await p.waitForSelector('.sheet');
    await p.evaluate(() => document.fonts.ready);
    await p.waitForTimeout(200);
  };

  // Desktop
  const dctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true, reducedMotion: 'reduce' });
  const d = await dctx.newPage(); log(d, 'desktop');
  await ready(d);
  await d.screenshot({ path: `${out}/desktop.png`, fullPage: true });
  await d.screenshot({ path: `${out}/desktop-viewport.png` });
  await d.click('#seg-flyer'); await d.waitForTimeout(300);
  await d.screenshot({ path: `${out}/desktop-flyer-tab.png` });
  const [dl] = await Promise.all([d.waitForEvent('download'), d.click('#download-btn')]);
  await dl.saveAs(`${out}/flyer-next.png`);
  // A day from 1 to 9 in the panel and on the Folha do dia, to see the two-digit numeral ("04").
  const early = '.line[data-id^="ev-2026-11-04"]';
  await d.click(early); await d.waitForTimeout(300);
  await d.screenshot({ path: `${out}/desktop-day4-flyer.png` });
  await d.click('#seg-message'); await d.waitForTimeout(200);
  await d.screenshot({ path: `${out}/desktop-day4-message.png` });
  await d.click('#tab-month'); await d.waitForTimeout(200);
  await d.screenshot({ path: `${out}/desktop-month.png`, fullPage: true });
  await d.click('[data-focus="month:next"]'); await d.waitForTimeout(200);
  await d.screenshot({ path: `${out}/desktop-month-next.png`, fullPage: true });
  console.log('desktop scrollWidth', await d.evaluate(() => document.documentElement.scrollWidth));

  // Mobile
  const mctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  const m = await mctx.newPage(); log(m, 'mobile');
  await ready(m);
  await m.screenshot({ path: `${out}/mobile.png`, fullPage: true });
  await m.screenshot({ path: `${out}/mobile-viewport.png` });
  console.log('mobile scrollWidth', await m.evaluate(() => document.documentElement.scrollWidth));
  await m.click('.line >> nth=0'); await m.waitForTimeout(450);
  await m.screenshot({ path: `${out}/mobile-sheet.png` });
  await m.click('#seg-flyer'); await m.waitForTimeout(300);
  await m.screenshot({ path: `${out}/mobile-sheet-flyer.png` });
  await m.click('#bench-close'); await m.waitForTimeout(350);
  await m.click('.line[data-id^="ev-2026-11-04"]'); await m.waitForTimeout(450);
  await m.screenshot({ path: `${out}/mobile-day4-flyer.png` });
  await m.click('#seg-message'); await m.waitForTimeout(200);
  await m.screenshot({ path: `${out}/mobile-day4-message.png` });
  await m.click('#bench-close'); await m.waitForTimeout(350);
  await m.click('#past-toggle'); await m.waitForTimeout(200);
  await m.screenshot({ path: `${out}/mobile-past.png`, fullPage: true });
  await m.click('#tab-month'); await m.waitForTimeout(200);
  await m.screenshot({ path: `${out}/mobile-month.png`, fullPage: true });
  // The empty result of a filter (past days hidden again first).
  await m.click('#tab-agenda'); await m.waitForTimeout(150);
  await m.click('#past-toggle'); await m.waitForTimeout(150);
  await m.selectOption('#org-select', { value: 'comafro' }); await m.waitForTimeout(250);
  await m.screenshot({ path: `${out}/mobile-empty.png` });

  // The home (index.html) and Comércio, full page and first viewport.
  for (const [page, name, selector] of [['', 'home', '.door'], ['comercio.html', 'comercio', '.biz']]) {
    for (const [ctx, size] of [[dctx, 'desktop'], [mctx, 'mobile']]) {
      const p = await ctx.newPage(); log(p, `${size} ${name}`);
      await p.goto(base + page);
      await p.waitForSelector(selector);
      await p.evaluate(() => document.fonts.ready);
      await p.waitForTimeout(200);
      await p.screenshot({ path: `${out}/${size}-${name}.png`, fullPage: true });
      await p.screenshot({ path: `${out}/${size}-${name}-viewport.png` });
    }
  }
  await browser.close();
})();
