// Photographs the map of each Mapa artboard (proposal of 11/11/2026), by day and at night:
//   node design/tools/mapa-render.cjs              every view of VIEWS (design/assets/mapa.js)
//   node design/tools/mapa-render.cjs a-celular    only the views named
// It serves the project folder on a free local port, opens design/mapa-vivo.html?so-mapa at each view's
// centre (the map alone, MapLibre over OpenFreeMap's tiles, painted by design/assets/mapa-estilo.js) and
// writes design/assets/mapa/<view>-claro.webp and -escuro.webp at twice the view's size, for sharp maps on
// the canvas: a screen twice as large, one zoom closer, every line and label twice as large (?escala=2),
// which is the view itself at twice the pixels, with the streets of the closer zoom. The artboards draw their pins over these photographs, at the
// same centre and zoom, so a change to a view or to the paint means running this again.
// Needs the network (the tiles), ImageMagick (`magick`, for WebP) and Playwright with a Chromium, as
// assets/render.cjs: PLAYWRIGHT_CORE and CHROMIUM, a local playwright-core, or the maintainer's paths.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { pathToFileURL } = require('url');

const HOME_PLAYWRIGHT = '/home/luizcarlos1405/.local/lib/node_modules/@playwright/cli/node_modules/playwright-core';
const HOME_CHROMIUM = '/home/luizcarlos1405/.nix-profile/bin/chromium';
const local = (name) => { try { return require.resolve(name); } catch { return null; } };
const PLAYWRIGHT_CORE = process.env.PLAYWRIGHT_CORE || local('playwright-core') || HOME_PLAYWRIGHT;
const CHROMIUM = process.env.CHROMIUM || (fs.existsSync(HOME_CHROMIUM) ? HOME_CHROMIUM : undefined);
const { chromium } = require(PLAYWRIGHT_CORE);

const ROOT = path.resolve(__dirname, '../..');
const OUT = path.join(ROOT, 'design/assets/mapa');
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp' };

function serve(root) {
  const server = http.createServer((req, res) => {
    const file = path.join(root, decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
    if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
    fs.readFile(file, (err, data) => {
      if (err) return res.writeHead(404).end();
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' }).end(data);
    });
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}

(async () => {
  const { VIEWS } = await import(pathToFileURL(path.join(ROOT, 'design/assets/mapa.js')).href);
  const names = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(VIEWS);
  const unknown = names.filter((n) => !VIEWS[n]);
  if (unknown.length) throw new Error(`No such view: ${unknown.join(', ')}`);
  fs.mkdirSync(OUT, { recursive: true });

  const server = await serve(ROOT);
  const base = `http://127.0.0.1:${server.address().port}/design/mapa-vivo.html`;
  // WebGL without a GPU: SwiftShader.
  const browser = await chromium.launch({ executablePath: CHROMIUM,
    args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
  try {
    for (const name of names) {
      const v = VIEWS[name];
      for (const [tema, suffix] of [['claro', 'claro'], ['escuro', 'escuro']]) {
        const page = await browser.newPage({ viewport: { width: v.w * 2, height: v.h * 2 }, deviceScaleFactor: 1 });
        const url = `${base}?so-mapa&escala=2&tema=${tema}&lat=${v.lat}&lon=${v.lon}&z=${v.z + 1}`;
        await page.goto(url);
        await page.waitForSelector('html[data-ready]', { state: 'attached', timeout: 90000 });
        await page.waitForTimeout(400);
        const png = path.join(OUT, `${name}-${suffix}.png`);
        await page.screenshot({ path: png });
        await page.close();
        const webp = png.replace(/\.png$/, '.webp');
        execFileSync('magick', [png, '-quality', '86', '-define', 'webp:method=6', webp]);
        fs.unlinkSync(png);
        console.log(`${path.relative(ROOT, webp)}  ${v.w}×${v.h} @2x  z ${v.z}`);
      }
    }
  } finally {
    await browser.close();
    server.close();
  }
})().catch((err) => { console.error(err); process.exit(1); });
