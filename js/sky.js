// The sky of this hour and the theme (light or dark), shared by the three pages. The inline script in
// each page's head sets <html data-scheme> and <html data-sky> before the first paint (css/theme.css
// explains both); this module keeps them right while the page stays open (the hour turns, the system
// switches to dark, another tab changes the theme), wires the theme button, and copies the sky's top
// band into the theme-color metas, so the phone's browser bar continues the sky.

const KEY = 'nos.tema'; // 'claro' or 'escuro'; absent = follow the system
const query = new URLSearchParams(location.search);
const FORCED_SKY = { amanhecer: 'dawn', dia: 'day', entardecer: 'dusk', noite: 'night' }[query.get('ceu')] || null;
let forcedScheme = { claro: 'light', escuro: 'dark' }[query.get('tema')] || null;
const system = window.matchMedia('(prefers-color-scheme: dark)');

// amanhecer 5–9h, dia 9–16h, entardecer 16–19h, noite 19–5h.
export function skyPeriod(date = new Date()) {
  const hour = date.getHours();
  if (hour >= 5 && hour < 9) return 'dawn';
  if (hour >= 9 && hour < 16) return 'day';
  if (hour >= 16 && hour < 19) return 'dusk';
  return 'night';
}

// "Bom dia" until noon, "Boa tarde" until 18h, "Boa noite" after.
export function greeting(date = new Date()) {
  const hour = date.getHours();
  return hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
}

function saved() {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null; // storage unavailable (private mode): follow the system
  }
}

function scheme() {
  if (forcedScheme) return forcedScheme;
  const choice = saved();
  if (choice === 'escuro') return 'dark';
  if (choice === 'claro') return 'light';
  return system.matches ? 'dark' : 'light';
}

function apply() {
  const root = document.documentElement;
  root.dataset.scheme = scheme();
  root.dataset.sky = FORCED_SKY || skyPeriod();
  const dark = root.dataset.scheme === 'dark';
  for (const button of document.querySelectorAll('[data-theme-toggle]')) button.setAttribute('aria-pressed', String(dark));
  // Both metas (one per system scheme) take the sky's top band: the page's theme may differ from the system's.
  const top = getComputedStyle(root).getPropertyValue('--role-sky-1').trim();
  if (top) for (const meta of document.querySelectorAll('meta[name="theme-color"]')) meta.content = top;
}

// The button flips light and dark and remembers the choice; choosing what the system already says
// forgets it, so the site follows the system again.
function toggle() {
  const next = document.documentElement.dataset.scheme === 'dark' ? 'light' : 'dark';
  forcedScheme = null;
  try {
    if (next === (system.matches ? 'dark' : 'light')) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, next === 'dark' ? 'escuro' : 'claro');
  } catch {
    forcedScheme = next; // not remembered; still applied for this visit
  }
  apply();
}

export function initSky() {
  for (const button of document.querySelectorAll('[data-theme-toggle]')) button.addEventListener('click', toggle);
  system.addEventListener('change', apply);
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) apply();
  });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) apply();
  });
  window.addEventListener('pageshow', apply);
  setInterval(apply, 60_000);
  apply();
}
