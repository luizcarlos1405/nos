// Design explorer (dev only): every design listed in designs.json, side by side on one canvas.
// Each design is an HTML file shown in an iframe at its real size, and the canvas pans and zooms
// with one CSS transform. Names, outlines and section titles are drawn over it in screen pixels,
// so they stay sharp and readable at any zoom.

const STORE = 'design-explorer:';
const FRAME_GAP = 120;     // canvas px between the designs of a section
const SECTION_GAP = 560;   // canvas px between sections
const MIN_ZOOM = 0.02;
const MAX_ZOOM = 8;
const MAX_FIT_ZOOM = 2;    // fitting one small design stops at 200%
const ZOOM_STEP = 1.5;     // + and −, keys and buttons
const MARGIN = 40;         // screen px around what a fit shows
const NAME_SPACE = 24;     // screen px above a design for its name
const MIN_NAMED = 56;      // screen px a design needs to be wide to show its name
const TITLE_SPACE = 56;    // screen px above a section for its title and the names
const TOOLBAR_SPACE = 64;  // screen px kept clear at the bottom for the toolbar
const DRAG_SLOP = 4;       // screen px a press can move and still be a click
const DOUBLE_MS = 350;
const POLL_MS = 1000;
// Every design links these, so a change to one reloads them all (designs.json is watched too).
const SHARED = ['../css/theme.css', 'assets/design.css', 'assets/components.css', 'assets/icons.svg'];
// Watching the files is for a local server; a published copy only reloads on demand.
const LIVE = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);

const $ = (id) => document.getElementById(id);
const els = {
  app: $('app'), list: $('list'), count: $('count'), viewport: $('viewport'), world: $('world'),
  overlay: $('overlay'), hover: $('hover'), selection: $('selection'), size: $('size'), zoom: $('zoom-reset'),
  open: $('open'), live: $('live'), help: $('help'), helpToggle: $('help-toggle'),
  toggleList: $('toggle-list'), toast: $('toast'), notice: $('notice'),
};

const state = {
  manifest: '',     // designs.json as last read, to tell a real change
  sections: [],     // { title, designs, el, x, y, w, h }
  designs: [],      // { file, title, slug, w, h, x, y, hint, frame, iframe, label, item, … }
  view: { x: 0, y: 0, z: 1 },
  selected: null,
  hover: null,
  // What the first view fitted ('all' or a design). Until the user moves the canvas, it is fitted
  // again when the designs' real sizes come in.
  autoFit: null,
};

const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

function readStore(key) {
  try {
    return JSON.parse(localStorage.getItem(STORE + key));
  } catch {
    return null;
  }
}

function writeStore(key, value) {
  try {
    localStorage.setItem(STORE + key, JSON.stringify(value));
  } catch {
    // Storage off (private mode): the explorer just forgets.
  }
}

// Sizes measured on earlier visits: the canvas starts from them rather than from designs.json.
const sizes = readStore('sizes') || {};

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

// ---------------------------------------------------------------- loading

async function fetchManifest() {
  const res = await fetch('designs.json', { cache: 'no-store' });
  if (!res.ok) throw new Error(`designs.json: HTTP ${res.status}`);
  return res.json();
}

// Fetches fresh copies into the browser cache, so the iframes that load next get them. A plain
// static server (python3 -m http.server) sends no Cache-Control, and browsers would otherwise
// keep serving a recently saved file from cache for a while.
function refresh(files, mode) {
  return Promise.all(files.map((file) => fetch(file, { cache: mode }).then((res) => res.arrayBuffer()).catch(() => null)));
}

function designFiles(manifest) {
  return (manifest.sections || []).flatMap((section) => (section.designs || []).map((design) => design.file));
}

function build(manifest) {
  els.world.replaceChildren();
  els.list.replaceChildren();
  for (const node of els.overlay.querySelectorAll('.label, .section-title')) node.remove();
  state.sections = [];
  state.designs = [];
  state.selected = null;
  state.hover = null;
  for (const entry of manifest.sections || []) {
    const section = { title: entry.title || '', designs: [], el: el('div', 'section-title', entry.title || '') };
    els.overlay.insertBefore(section.el, els.hover);
    const group = el('section');
    const items = el('ul');
    group.append(el('h2', null, section.title), items);
    for (const item of entry.designs || []) {
      const design = makeDesign(item);
      section.designs.push(design);
      state.designs.push(design);
      const li = el('li');
      li.append(design.item);
      items.append(li);
    }
    els.list.append(group);
    state.sections.push(section);
  }
  els.count.textContent = String(state.designs.length);
  layout();
}

function makeDesign(entry) {
  const file = String(entry.file);
  const known = sizes[file];
  const design = {
    file,
    title: entry.title || file,
    slug: file.replace(/\.html$/, ''),
    w: known?.[0] ?? entry.width ?? 390,
    h: known?.[1] ?? entry.height ?? 844,
    hint: [entry.width, entry.height],
    x: 0,
    y: 0,
  };
  design.frame = el('div', 'frame');
  design.iframe = el('iframe');
  design.iframe.title = design.title;
  design.iframe.tabIndex = -1;
  design.iframe.setAttribute('scrolling', 'no');
  design.iframe.addEventListener('load', () => onLoad(design));
  design.iframe.src = file;
  design.frame.append(design.iframe);
  els.world.append(design.frame);

  design.label = el('div', 'label', design.title);
  els.overlay.insertBefore(design.label, els.hover);

  design.item = el('button', 'item');
  design.item.type = 'button';
  design.itemDims = el('span', 'dims');
  design.item.append(el('span', 'name', design.title), design.itemDims);
  design.item.addEventListener('click', () => {
    state.autoFit = null;
    select(design, { fit: true });
  });
  showDims(design);
  return design;
}

function showDims(design) {
  design.itemDims.textContent = `${design.w} × ${design.h}`;
}

function onLoad(design) {
  const doc = design.iframe.contentDocument;
  if (!doc) return;
  measure(design);
  doc.fonts?.ready.then(() => measure(design));
}

// A design's size is the box of the first element of its body: the artboard.
function measure(design) {
  const root = design.iframe.contentDocument?.body?.firstElementChild;
  if (!root) return;
  const box = root.getBoundingClientRect();
  const w = Math.round(box.width);
  const h = Math.round(box.height);
  if (!w || !h) return;
  sizes[design.file] = [w, h];
  writeStore('sizes', sizes);
  if (w === design.w && h === design.h) return;
  const [hintW, hintH] = design.hint;
  if ((hintW && Math.abs(hintW - w) > 1) || (hintH && Math.abs(hintH - h) > 1)) {
    console.info(`[designs] ${design.file} measures ${w} × ${h}; designs.json says ${hintW} × ${hintH}.`);
  }
  design.w = w;
  design.h = h;
  showDims(design);
  layout();
}

// ---------------------------------------------------------------- layout and drawing

// Sections are rows, top to bottom; designs sit left to right in each row, tops aligned.
function layout() {
  let y = 0;
  for (const section of state.sections) {
    let x = 0;
    let height = 0;
    for (const design of section.designs) {
      design.x = x;
      design.y = y;
      Object.assign(design.frame.style, { left: `${x}px`, top: `${y}px`, width: `${design.w}px`, height: `${design.h}px` });
      x += design.w + FRAME_GAP;
      height = Math.max(height, design.h);
    }
    Object.assign(section, { x: 0, y, w: Math.max(0, x - FRAME_GAP), h: height });
    y += height + SECTION_GAP;
  }
  if (state.autoFit) fit(state.autoFit, { animate: false });
  else paint();
}

function paint() {
  const { x, y, z } = state.view;
  els.world.style.transform = `translate(${x}px, ${y}px) scale(${z})`;
  // Dots every 32 canvas px, doubled or halved to stay 16 to 64 screen px apart.
  let grid = 32 * z;
  while (grid < 16) grid *= 2;
  while (grid >= 64) grid /= 2;
  els.viewport.style.setProperty('--grid', `${grid}px`);
  els.viewport.style.backgroundPosition = `${x}px ${y}px`;
  // Above each row: the section's title, then the designs' names. Zoomed far out the gap between
  // rows gets thin: the names give way first, then the title.
  state.sections.forEach((section, index) => {
    const room = index ? SECTION_GAP * z : Infinity;
    const named = room >= TITLE_SPACE + 2;
    const top = Math.round(y + section.y * z);
    section.el.hidden = !section.designs.length || room < 30;
    section.el.style.transform = `translate(${Math.round(x + section.x * z)}px, ${top - (named ? 54 : 30)}px)`;
    for (const design of section.designs) {
      const width = design.w * z;
      design.label.hidden = !named || width < MIN_NAMED;
      design.label.style.width = `${Math.round(width)}px`;
      design.label.style.transform = `translate(${Math.round(x + design.x * z)}px, ${top - 22}px)`;
    }
  });
  els.zoom.textContent = `${Math.round(z * 100)}%`;
  paintMarks();
  saveView();
}

// Selection and hover: the outlines and the names' colours.
function paintMarks() {
  place(els.selection, state.selected);
  place(els.hover, state.hover === state.selected ? null : state.hover);
  const { selected } = state;
  els.size.hidden = !selected;
  if (selected) {
    const { x, y, z } = state.view;
    els.size.textContent = `${selected.w} × ${selected.h}`;
    els.size.style.transform = `translate(${x + (selected.x + selected.w / 2) * z}px, ${y + (selected.y + selected.h) * z + 8}px) translateX(-50%)`;
  }
  for (const design of state.designs) {
    design.label.classList.toggle('is-selected', design === state.selected);
    design.label.classList.toggle('is-hover', design === state.hover);
  }
}

function place(node, design) {
  node.hidden = !design;
  if (!design) return;
  const { x, y, z } = state.view;
  node.style.transform = `translate(${x + design.x * z}px, ${y + design.y * z}px)`;
  node.style.width = `${design.w * z}px`;
  node.style.height = `${design.h * z}px`;
}

let saveTimer = 0;
function saveView() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => writeStore('view', state.view), 300);
}

// ---------------------------------------------------------------- moving the canvas

function setView(view) {
  state.view = view;
  paint();
}

function size() {
  return { w: els.viewport.clientWidth, h: els.viewport.clientHeight };
}

function boundsOf(designs) {
  if (!designs.length) return { x: 0, y: 0, w: 1, h: 1 };
  const left = Math.min(...designs.map((d) => d.x));
  const top = Math.min(...designs.map((d) => d.y));
  const right = Math.max(...designs.map((d) => d.x + d.w));
  const bottom = Math.max(...designs.map((d) => d.y + d.h));
  return { x: left, y: top, w: right - left, h: bottom - top };
}

// The view that shows `rect` whole, centred, with `top` screen px free above it for its names.
function viewFor(rect, top) {
  const screen = size();
  const w = Math.max(1, screen.w - 2 * MARGIN);
  const h = Math.max(1, screen.h - 2 * MARGIN - top - TOOLBAR_SPACE);
  const z = clamp(Math.min(w / rect.w, h / rect.h), MIN_ZOOM, MAX_FIT_ZOOM);
  return {
    z,
    x: MARGIN + (w - rect.w * z) / 2 - rect.x * z,
    y: MARGIN + top + (h - rect.h * z) / 2 - rect.y * z,
  };
}

// target: 'all' or a design.
function fit(target, { animate = true } = {}) {
  if (target === 'all') moveTo(viewFor(boundsOf(state.designs), TITLE_SPACE), animate);
  else moveTo(viewFor(target, NAME_SPACE), animate);
}

let animation = 0;
function moveTo(target, animate = true) {
  cancelAnimationFrame(animation);
  if (!animate || reducedMotion.matches) {
    setView(target);
    return;
  }
  const from = { ...state.view };
  const screen = size();
  const cx = screen.w / 2;
  const cy = screen.h / 2;
  // Glide the canvas point under the centre of the screen, and the zoom in proportion.
  const a = { x: (cx - from.x) / from.z, y: (cy - from.y) / from.z };
  const b = { x: (cx - target.x) / target.z, y: (cy - target.y) / target.z };
  const start = performance.now();
  const frame = (now) => {
    const t = Math.min(1, (now - start) / 260);
    const e = 1 - (1 - t) ** 3;
    const z = from.z * (target.z / from.z) ** e;
    setView({ x: cx - (a.x + (b.x - a.x) * e) * z, y: cy - (a.y + (b.y - a.y) * e) * z, z });
    if (t < 1) animation = requestAnimationFrame(frame);
  };
  animation = requestAnimationFrame(frame);
}

// Zoom keeping the canvas point at (px, py) of the screen in place.
function zoomedAt(px, py, z) {
  const { x, y, z: from } = state.view;
  z = clamp(z, MIN_ZOOM, MAX_ZOOM);
  return { x: px - ((px - x) * z) / from, y: py - ((py - y) * z) / from, z };
}

function zoomBy(factor) {
  const screen = size();
  moveTo(zoomedAt(screen.w / 2, screen.h / 2, state.view.z * factor));
}

// 100%: the selected design, centred (top first when it is taller than the screen), or the
// middle of the screen.
function actualSize() {
  const design = state.selected;
  if (!design) {
    zoomBy(1 / state.view.z);
    return;
  }
  const screen = size();
  const room = screen.h - TOOLBAR_SPACE - NAME_SPACE - 2 * MARGIN;
  const y = design.h <= room
    ? MARGIN + NAME_SPACE + (room - design.h) / 2 - design.y
    : MARGIN + NAME_SPACE - design.y;
  moveTo({ z: 1, x: (screen.w - design.w) / 2 - design.x, y });
}

// ---------------------------------------------------------------- selection

function select(design, { fit: fitIt = false, animate = true } = {}) {
  state.selected = design || null;
  for (const each of state.designs) {
    if (each === state.selected) each.item.setAttribute('aria-current', 'true');
    else each.item.removeAttribute('aria-current');
  }
  els.open.href = state.selected ? state.selected.file : '#';
  els.open.setAttribute('aria-disabled', String(!state.selected));
  const hash = state.selected ? `#${state.selected.slug}` : '';
  if (location.hash !== hash) history.replaceState(null, '', hash || location.pathname + location.search);
  state.selected?.item.scrollIntoView({ block: 'nearest' });
  if (state.selected && fitIt) fit(state.selected, { animate });
  else paintMarks();
}

function designFromHash() {
  const name = decodeURIComponent(location.hash.slice(1));
  return name ? state.designs.find((d) => d.slug === name || d.file === name) || null : null;
}

function step(delta) {
  const count = state.designs.length;
  if (!count) return;
  const at = state.designs.indexOf(state.selected);
  const next = at < 0 ? (delta > 0 ? 0 : count - 1) : (at + delta + count) % count;
  select(state.designs[next], { fit: true });
}

function setHover(design) {
  if (state.hover === design) return;
  state.hover = design;
  paintMarks();
}

// The design under a point of the screen: its frame, or its name just above it.
function hit(point) {
  const { x, y, z } = state.view;
  const cx = (point.x - x) / z;
  const cy = (point.y - y) / z;
  for (let i = state.designs.length - 1; i >= 0; i--) {
    const d = state.designs[i];
    const top = d.y - (d.label.hidden ? 0 : NAME_SPACE / z);
    if (cx >= d.x && cx <= d.x + d.w && cy >= top && cy <= d.y + d.h) return d;
  }
  return null;
}

function openSelected() {
  if (state.selected) window.open(state.selected.file, '_blank', 'noopener');
}

// ---------------------------------------------------------------- panels and messages

function toggleList(show = els.app.classList.contains('is-collapsed')) {
  // The canvas keeps its place on screen while the list comes and goes.
  const before = els.viewport.getBoundingClientRect().left;
  els.app.classList.toggle('is-collapsed', !show);
  const after = els.viewport.getBoundingClientRect().left;
  els.toggleList.setAttribute('aria-pressed', String(show));
  writeStore('list', show);
  setView({ ...state.view, x: state.view.x + before - after });
}

function toggleHelp(show = els.help.hidden) {
  els.help.hidden = !show;
  els.helpToggle.setAttribute('aria-expanded', String(show));
}

let toastTimer = 0;
function toast(text) {
  els.toast.textContent = text;
  els.toast.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => els.toast.classList.remove('is-on'), 1800);
}

// The notice's text is in index.html (an inline script shows it when opened from disk).
function showNotice(detail) {
  if (detail) els.notice.append(el('p', null, detail));
  els.notice.hidden = false;
}

// ---------------------------------------------------------------- reloading

function reloadFrame(design) {
  try {
    design.iframe.contentWindow.location.reload();
  } catch {
    design.iframe.src = design.file;
  }
}

function rebuild(manifest) {
  const selected = state.selected?.file;
  state.manifest = JSON.stringify(manifest);
  build(manifest);
  select(state.designs.find((d) => d.file === selected) || null);
}

async function reloadAll() {
  let manifest;
  try {
    manifest = await fetchManifest();
  } catch (err) {
    toast(`Could not read designs.json (${err.message})`);
    return;
  }
  await refresh([...SHARED, ...designFiles(manifest)], 'reload');
  if (JSON.stringify(manifest) !== state.manifest) rebuild(manifest);
  else state.designs.forEach(reloadFrame);
  toast('Designs reloaded');
}

const stamps = new Map();

async function stampOf(file) {
  try {
    const res = await fetch(file, { method: 'HEAD', cache: 'no-store' });
    await res.arrayBuffer(); // empty: reading it ends the request cleanly
    if (!res.ok) return `missing ${res.status}`;
    return ['etag', 'last-modified', 'content-length'].map((name) => res.headers.get(name)).join('|');
  } catch {
    return null; // server stopped: not a change
  }
}

// Polls the files (HEAD requests, so only headers) and reloads what changed.
async function watch() {
  if (!document.hidden) {
    const files = ['designs.json', ...SHARED, ...state.designs.map((d) => d.file)];
    const changed = [];
    await Promise.all(files.map(async (file) => {
      const stamp = await stampOf(file);
      if (stamp === null) return;
      const before = stamps.get(file);
      stamps.set(file, stamp);
      if (before !== undefined && before !== stamp) changed.push(file);
    }));
    if (changed.length) await applyChanges(changed);
  }
  setTimeout(watch, POLL_MS);
}

async function applyChanges(changed) {
  if (changed.includes('designs.json')) {
    try {
      const manifest = await fetchManifest();
      await refresh(changed.filter((file) => file !== 'designs.json'), 'reload');
      rebuild(manifest);
      toast('designs.json changed: canvas rebuilt');
    } catch {
      toast('designs.json could not be read');
    }
    return;
  }
  await refresh(changed, 'reload');
  const shared = changed.filter((file) => SHARED.includes(file));
  const frames = shared.length ? state.designs : state.designs.filter((d) => changed.includes(d.file));
  frames.forEach(reloadFrame);
  toast(shared.length ? `${shared.join(', ')} changed: every design reloaded` : `Updated: ${frames.map((d) => d.title).join(', ')}`);
}

// ---------------------------------------------------------------- input

const pointers = new Map();
let press = null;   // one pointer down: a click, or a drag that pans
let pinch = null;   // two pointers down
let lastClick = { time: 0, design: null };
let spaceDown = false;

function local(event) {
  const box = els.viewport.getBoundingClientRect();
  return { x: event.clientX - box.left, y: event.clientY - box.top };
}

function onCanvas(event) {
  return !event.target.closest('.toolbar, .help, .notice');
}

function wire() {
  const { viewport } = els;

  viewport.addEventListener('wheel', (event) => {
    if (!onCanvas(event)) return;
    event.preventDefault();
    state.autoFit = null;
    cancelAnimationFrame(animation);
    let dx = event.deltaX;
    let dy = event.deltaY;
    if (event.deltaMode === 1) {
      dx *= 16;
      dy *= 16;
    } else if (event.deltaMode === 2) {
      dx *= viewport.clientWidth;
      dy *= viewport.clientHeight;
    }
    if (event.ctrlKey || event.metaKey) {
      // Pinches arrive as Ctrl + small deltas; a mouse wheel notch is capped to one gentle step.
      const point = local(event);
      setView(zoomedAt(point.x, point.y, state.view.z * Math.exp(-clamp(dy, -50, 50) / 100)));
    } else {
      if (event.shiftKey && !dx) {
        dx = dy;
        dy = 0;
      }
      setView({ ...state.view, x: state.view.x - dx, y: state.view.y - dy });
    }
  }, { passive: false });

  // Safari reports trackpad pinches as gestures instead of Ctrl + wheel.
  let gestureZoom = 1;
  viewport.addEventListener('gesturestart', (event) => {
    event.preventDefault();
    gestureZoom = state.view.z;
  });
  viewport.addEventListener('gesturechange', (event) => {
    event.preventDefault();
    state.autoFit = null;
    const point = local(event);
    setView(zoomedAt(point.x, point.y, gestureZoom * event.scale));
  });

  viewport.addEventListener('pointerdown', (event) => {
    if (!onCanvas(event) || (event.button !== 0 && event.button !== 1)) return;
    event.preventDefault(); // no text selection, no middle-click autoscroll
    viewport.focus({ preventScroll: true });
    viewport.setPointerCapture(event.pointerId);
    state.autoFit = null;
    const point = local(event);
    pointers.set(event.pointerId, point);
    if (pointers.size === 2) {
      cancelAnimationFrame(animation);
      const [a, b] = [...pointers.values()];
      pinch = {
        distance: Math.hypot(a.x - b.x, a.y - b.y) || 1,
        middle: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
        view: { ...state.view },
      };
      press = null;
      viewport.classList.remove('is-panning');
      return;
    }
    if (pointers.size > 2) return;
    press = { id: event.pointerId, ...point, moved: false, pan: event.button === 1 || spaceDown, touch: event.pointerType !== 'mouse' };
  });

  viewport.addEventListener('pointermove', (event) => {
    const point = local(event);
    if (pointers.has(event.pointerId)) pointers.set(event.pointerId, point);
    if (pinch) {
      if (pointers.size < 2) return;
      const [a, b] = [...pointers.values()];
      const z = clamp((pinch.view.z * Math.hypot(a.x - b.x, a.y - b.y)) / pinch.distance, MIN_ZOOM, MAX_ZOOM);
      // The canvas point under the fingers' starting middle follows their middle now.
      const cx = (pinch.middle.x - pinch.view.x) / pinch.view.z;
      const cy = (pinch.middle.y - pinch.view.y) / pinch.view.z;
      setView({ x: (a.x + b.x) / 2 - cx * z, y: (a.y + b.y) / 2 - cy * z, z });
      return;
    }
    if (press && event.pointerId === press.id) {
      if (!press.moved && Math.hypot(point.x - press.x, point.y - press.y) > DRAG_SLOP) {
        // The drag starts here, from wherever a glide has got to.
        cancelAnimationFrame(animation);
        Object.assign(press, { moved: true, view: { ...state.view }, x: point.x, y: point.y });
        viewport.classList.add('is-panning');
        setHover(null);
      }
      if (press.moved) setView({ ...state.view, x: press.view.x + point.x - press.x, y: press.view.y + point.y - press.y });
      return;
    }
    if (event.pointerType === 'mouse' && !pointers.size) setHover(hit(point));
  });

  const release = (event) => {
    if (!pointers.delete(event.pointerId)) return;
    if (pinch) {
      if (!pointers.size) pinch = null;
      return;
    }
    if (!press || event.pointerId !== press.id) return;
    const done = press;
    press = null;
    viewport.classList.remove('is-panning');
    if (done.moved || done.pan || event.type === 'pointercancel') return;
    const design = hit(local(event));
    const now = performance.now();
    if (done.touch && design && design === lastClick.design && now - lastClick.time < DOUBLE_MS) {
      lastClick = { time: 0, design: null };
      select(design, { fit: true });
      return;
    }
    lastClick = { time: now, design };
    select(design);
  };
  viewport.addEventListener('dblclick', (event) => {
    if (!onCanvas(event)) return;
    const design = hit(local(event));
    if (design) select(design, { fit: true });
  });
  viewport.addEventListener('pointerup', release);
  viewport.addEventListener('pointercancel', release);
  viewport.addEventListener('pointerleave', () => {
    if (!pointers.size) setHover(null);
  });

  document.addEventListener('keydown', (event) => {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
    const onControl = event.target.closest?.('button, a, input, select, textarea, [contenteditable]');
    const key = event.key;
    if (key === ' ' || event.code === 'Space') {
      if (onControl) return;
      event.preventDefault();
      spaceDown = true;
      viewport.classList.add('is-space');
      return;
    }
    let handled = true;
    if (event.shiftKey && event.code === 'Digit1') fit('all');
    else if (event.shiftKey && event.code === 'Digit2') {
      if (state.selected) fit(state.selected);
    } else if (event.shiftKey && event.code === 'Digit0') actualSize();
    else if (key === '+' || key === '=' || event.code === 'NumpadAdd') zoomBy(ZOOM_STEP);
    else if (key === '-' || key === '_' || event.code === 'NumpadSubtract') zoomBy(1 / ZOOM_STEP);
    else if (key === 'ArrowRight' || key === 'ArrowDown') step(1);
    else if (key === 'ArrowLeft' || key === 'ArrowUp') step(-1);
    else if (key === 'Escape') {
      if (!els.help.hidden) toggleHelp(false);
      else select(null);
    } else if (key === 'Enter' && !onControl) openSelected();
    else if (key === 'r' || key === 'R') reloadAll();
    else if (key === '?') toggleHelp();
    else if (key === '\\') toggleList();
    else handled = false;
    if (handled) {
      event.preventDefault();
      state.autoFit = null;
    }
  });

  document.addEventListener('keyup', (event) => {
    if (event.key === ' ' || event.code === 'Space') {
      spaceDown = false;
      viewport.classList.remove('is-space');
    }
  });

  window.addEventListener('blur', () => {
    spaceDown = false;
    viewport.classList.remove('is-space');
  });

  window.addEventListener('resize', () => {
    if (state.autoFit) fit(state.autoFit, { animate: false });
    else paint();
  });

  window.addEventListener('hashchange', () => {
    const design = designFromHash();
    if (design) {
      state.autoFit = null;
      select(design, { fit: true });
    }
  });

  $('zoom-in').addEventListener('click', () => zoomBy(ZOOM_STEP));
  $('zoom-out').addEventListener('click', () => zoomBy(1 / ZOOM_STEP));
  els.zoom.addEventListener('click', actualSize);
  $('fit-all').addEventListener('click', () => fit('all'));
  $('reload').addEventListener('click', reloadAll);
  els.toggleList.addEventListener('click', () => toggleList());
  els.helpToggle.addEventListener('click', () => toggleHelp());
  for (const id of ['zoom-in', 'zoom-out', 'zoom-reset', 'fit-all']) {
    $(id).addEventListener('click', () => {
      state.autoFit = null;
    });
  }
}

// ---------------------------------------------------------------- start

async function start() {
  if (location.protocol === 'file:') {
    showNotice();
    return;
  }
  let manifest;
  try {
    manifest = await fetchManifest();
  } catch (err) {
    showNotice(err.message);
    return;
  }
  state.manifest = JSON.stringify(manifest);
  await refresh([...SHARED, ...designFiles(manifest)], 'no-cache');

  const list = readStore('list');
  if (list === false || (list === null && innerWidth < 720)) {
    els.app.classList.add('is-collapsed');
    els.toggleList.setAttribute('aria-pressed', 'false');
  }
  els.viewport.tabIndex = -1;
  build(manifest);
  wire();

  const design = designFromHash();
  const saved = readStore('view');
  if (design) {
    state.autoFit = design;
    select(design, { fit: true, animate: false });
  } else if (saved && [saved.x, saved.y, saved.z].every(Number.isFinite) && saved.z > 0) {
    setView({ x: saved.x, y: saved.y, z: clamp(saved.z, MIN_ZOOM, MAX_ZOOM) });
  } else {
    state.autoFit = 'all';
    fit('all', { animate: false });
  }

  if (LIVE) {
    els.live.hidden = false;
    watch();
  }
}

start();
