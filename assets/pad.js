// The NOS mark drawn as the folhinha's pad: today's sheet (binding strip, perforation row, the
// word) over the edges of the sheets under it. Shared by assets/icon.html (the mark's proportions,
// PAD) and assets/og-image.html (the same pad at poster size, its own proportions, the word left to
// the page). It draws into an <svg> in px; the parts carry the classes .pad-paper, .pad-seam,
// .pad-binding, .pad-perf and .pad-word, which the pages colour with the roles of css/theme.css
// (the seams take the mark's perforation grey: the seam grey of the screen's sheets fades out at
// icon sizes).

const NS = 'http://www.w3.org/2000/svg';

// Proportions, in hundredths of the sheet's width.
export const PAD = {
  height: 107, // today's sheet
  topRadius: 4.5, // nearly square where the sheet is bound...
  bottomRadius: 10.5, // ...softer where it hangs free (the Bound Top Rule)
  binding: 15,
  perf: 13.5,
  dot: 4.3,
  dots: 7,
  perfMargin: 10, // from the sheet's edge to the first dot's centre
  wordWidth: 78, // the word's ink width
  wordLift: 2.7, // the word sits this much above the middle of its space
  under: 2, // sheets showing under today's
  edge: 7, // how far each one shows
  inset: 2, // and how much narrower it is on each side
  seam: 2,
};

// Height of the whole pad (today's sheet and the edges under it) for a sheet of width w.
export function padHeight(w, p = PAD) {
  return ((p.height + p.under * p.edge) * w) / 100;
}

// The pad's geometry in px for a sheet of width w whose top-left corner is at (x, y).
export function padLayout(x, y, w, p = PAD) {
  const u = w / 100;
  return {
    x, y, w, h: p.height * u, rt: p.topRadius * u, rb: p.bottomRadius * u,
    binding: p.binding * u, perf: p.perf * u, dot: p.dot * u, dots: p.dots,
    firstDot: p.perfMargin * u, dotStep: (w - 2 * p.perfMargin * u) / (p.dots - 1),
    wordWidth: p.wordWidth / 100, wordLift: p.wordLift * u,
    under: Array.from({ length: p.under }, (_, i) => ({ inset: p.inset * (i + 1) * u, edge: p.edge * (i + 1) * u })),
    seam: p.seam * u,
  };
}

// A sheet's outline: top corners rt, bottom corners rb.
export function sheetPath(x, y, w, h, rt, rb) {
  return `M${x + rt},${y}H${x + w - rt}Q${x + w},${y} ${x + w},${y + rt}V${y + h - rb}`
    + `Q${x + w},${y + h} ${x + w - rb},${y + h}H${x + rb}Q${x},${y + h} ${x},${y + h - rb}`
    + `V${y + rt}Q${x},${y} ${x + rt},${y}Z`;
}

// Ink box of a word in Barlow Condensed 800, per 1px of font size (measure once the font is in).
export function wordMetrics(word) {
  const ctx = document.createElement('canvas').getContext('2d');
  ctx.font = "800 100px 'Barlow Condensed'";
  const m = ctx.measureText(word);
  const cap = ctx.measureText(word.replace(/[^A-Z]/g, '').slice(0, 1) || 'H');
  return { left: -m.actualBoundingBoxLeft / 100, right: m.actualBoundingBoxRight / 100, cap: cap.actualBoundingBoxAscent / 100 };
}

// NOS until the font is measured.
export const NOS_METRICS = { left: 0.03, right: 1.441, cap: 0.71 };

let clipCount = 0;

function add(parent, tag, attrs, cls) {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  if (cls) el.setAttribute('class', cls);
  parent.append(el);
  return el;
}

// Draws the pad L (from padLayout, or fitted by hand) into svg. The word, if any, sits in the space
// under the perforation: sized to L.wordWidth of the sheet, or to a cap height of L.cap px placed
// L.capTop px under the perforation; with L.glyphs it is drawn from those pixel glyphs instead,
// when they have every letter.
export function drawPad(svg, L, word, metrics = NOS_METRICS) {
  const { x, y, w, h, rt, rb } = L;
  const group = add(svg, 'g', {}, 'pad');

  // The sheets under today's, from the deepest up; each sheet above leaves a seam on the one below.
  for (let i = L.under.length - 1; i >= 0; i--) {
    const { inset, edge } = L.under[i];
    const below = sheetPath(x + inset, y, w - 2 * inset, h + edge, rt, rb);
    add(group, 'path', { d: below }, 'pad-paper');
    const id = `pad-clip-${++clipCount}`;
    add(add(group, 'clipPath', { id }), 'path', { d: below });
    const above = i ? L.under[i - 1] : { inset: 0, edge: 0 };
    add(group, 'path', { d: sheetPath(x + above.inset, y, w - 2 * above.inset, h + above.edge + L.seam, rt, rb), 'clip-path': `url(#${id})` }, 'pad-seam');
  }

  // Today's sheet: binding strip, perforation, the word.
  add(group, 'path', { d: sheetPath(x, y, w, h, rt, rb) }, 'pad-paper');
  add(group, 'path', { d: `M${x + rt},${y}H${x + w - rt}Q${x + w},${y} ${x + w},${y + rt}V${y + L.binding}H${x}V${y + rt}Q${x},${y} ${x + rt},${y}Z` }, 'pad-binding');
  if (L.perf) {
    const cy = y + L.binding + L.perf / 2;
    for (let i = 0; i < L.dots; i++) {
      const cx = x + L.firstDot + i * L.dotStep;
      if (L.squareDots) add(group, 'rect', { x: cx - L.dot / 2, y: cy - L.dot / 2, width: L.dot, height: L.dot }, 'pad-perf');
      else add(group, 'circle', { cx, cy, r: L.dot / 2 }, 'pad-perf');
    }
  }

  if (!word) return group;
  const top = y + L.binding + L.perf;
  const letters = [...word];
  if (L.glyphs && letters.every((c) => L.glyphs[c])) {
    const glyphs = letters.map((c) => L.glyphs[c]);
    const width = glyphs.reduce((sum, g) => sum + g[0].length, 0) + glyphs.length - 1;
    let gx = x + Math.round((w - width) / 2);
    for (const g of glyphs) {
      g.forEach((row, r) => [...row].forEach((p, c) => {
        if (p === '.') return;
        const px = add(group, 'rect', { x: gx + c, y: top + L.capTop + r, width: 1, height: 1 }, 'pad-word');
        if (p === '+') px.setAttribute('fill-opacity', 0.5);
      }));
      gx += g[0].length + 1;
    }
    return group;
  }

  let size;
  let baseline;
  let tx;
  if (L.cap) {
    // Fitted: the cap height and the ink's left edge on whole pixels.
    size = L.cap / metrics.cap;
    baseline = top + L.capTop + L.cap;
    tx = Math.round(x + w / 2 - ((metrics.right - metrics.left) * size) / 2) - metrics.left * size;
  } else {
    size = (L.wordWidth * w) / (metrics.right - metrics.left);
    baseline = top + (h - L.binding - L.perf + metrics.cap * size) / 2 - L.wordLift;
    tx = x + w / 2 - ((metrics.left + metrics.right) / 2) * size;
  }
  const text = add(group, 'text', { x: tx, y: baseline, 'font-size': size }, 'pad-word');
  text.textContent = word;
  return group;
}
