// What the three pages share: Início (index.html, js/home.js), Agenda (agenda.html, js/app.js)
// and Comércio (comercio.html, js/comercio.js). The header on the sky, small DOM helpers, notices,
// reading the sheets (Comércio's, and the agenda's months), and the offline worker.

import { APP_FULL_NAME, APP_NAME, CITY, COMMERCE_CSV_URL } from './config.js';
import { INDEX_FILE, agendaPath, createAgenda } from './agenda-source.js';
import { decodeCSV, parseCSV } from './csv.js';
import { formatShortDate, formatTime } from './events.js';
import { brandMark, icon } from './icons.js';
import { initSky } from './sky.js';

export const $ = (id) => document.getElementById(id);

export function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

export const escapeHtml = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

// Only web links leave the page: a bare domain ("forms.gle/abc") gets https://, and anything
// else typed in the sheet (javascript:, data:, relative paths) is shown as text, not linked.
export function safeUrl(value) {
  const v = (value || '').trim();
  if (/^https?:\/\/[^\s"<>]+$/i.test(v)) return v;
  if (/^(?:www\.)?[\p{L}\p{N}-]+(?:\.[\p{L}\p{N}-]+)+(?:[/?#][^\s"<>]*)?$/u.test(v)) return `https://${v}`;
  return null;
}

// The header on the sky: the NOS mark and the city of js/config.js (each page keeps a static copy,
// so the name shows without JS), the full name under the page, the page's name in the tab title, the
// icons of [data-icon] nodes, and the sky and theme (js/sky.js).
export function initPage(pageName = '') {
  const place = CITY.split('/')[0];
  const site = `${APP_NAME} ${place}`;
  $('brand-mark').innerHTML = brandMark(APP_NAME);
  $('brand-name-sr').textContent = `${APP_NAME} `;
  $('app-city').textContent = place;
  $('app-full-name').textContent = `${site} · ${APP_FULL_NAME}`;
  document.title = pageName ? `${pageName} · ${site}` : `${site} · ${APP_FULL_NAME}`;
  document.querySelectorAll('[data-icon]').forEach((node) => node.insertAdjacentHTML('afterbegin', icon(node.dataset.icon)));
  initSky();
}

// ---------- Notices ----------

export function showNotice(html, kind = 'warning') {
  const notice = $('notice');
  notice.innerHTML = `${icon('alert')}<div>${html}</div>`;
  notice.dataset.kind = kind;
  notice.hidden = false;
}

// `what` names what is on screen: "a agenda salva", "a lista salva".
export function showOffline(savedAt, what) {
  const when = isNaN(savedAt) ? '' : ` em ${formatShortDate(savedAt).toLowerCase()}, às ${formatTime(savedAt.getHours() * 60 + savedAt.getMinutes())}`;
  const html = `<strong>Sem conexão.</strong> Mostrando ${what}${when}; mudanças feitas depois disso não aparecem aqui.`;
  const notice = $('notice');
  // Keep the spreadsheet warning if it's already up.
  if (notice.hidden) showNotice(html);
  else notice.lastElementChild.insertAdjacentHTML('afterbegin', `<p class="notice-offline">${html}</p>`);
}

// Screen readers hear results through one region that is never replaced.
export function announce(text) {
  const live = $('live');
  live.textContent = '';
  requestAnimationFrame(() => {
    live.textContent = text;
  });
}

// Returns whether the text reached the clipboard (the panel's message, the agenda's addresses).
export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    // Inside an open <dialog> only the dialog can take focus, so the fallback lives there.
    (document.querySelector('dialog[open]') || document.body).append(ta);
    ta.select();
    let copied = false;
    try {
      copied = document.execCommand('copy');
    } catch {
      copied = false;
    }
    ta.remove();
    return copied;
  }
}

// ---------- Sheets ----------

// A published sheet, fresh. Offline, sw.js answers with the copy it saved; where the browser doesn't
// ask the worker (Firefox's offline mode, as emulated in tests, skips it for no-store requests) and
// the fetch fails, that copy is read from the worker's cache directly. Either way it carries
// X-Cached-At.
async function fetchSheet(url) {
  try {
    return await fetch(url, { cache: 'no-store' });
  } catch (err) {
    const saved = 'caches' in window ? await caches.match(new URL(url, location.href).href, { ignoreVary: true }).catch(() => null) : null;
    if (saved) return saved;
    throw err;
  }
}

const savedAtOf = (res) => {
  const stamp = res.headers.get('X-Cached-At');
  return stamp ? new Date(stamp) : null;
};

// Reads a sheet: { headers, records, lines } as parseCSV returns them, plus `savedAt`, the date of
// the saved copy when the live sheet couldn't be reached (sw.js stamps its copies), else null.
export async function readSheet(url) {
  const res = await fetchSheet(url);
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return { ...parseCSV(decodeCSV(await res.arrayBuffer())), savedAt: savedAtOf(res) };
}

// Reads a JSON file the same way: { data, savedAt }.
export async function readJSON(url) {
  const res = await fetchSheet(url);
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return { data: await res.json(), savedAt: savedAtOf(res) };
}

// The agenda of AGENDA_DIR, read a month at a time (js/agenda-source.js), with the readers above.
export const agendaSource = () => createAgenda({
  readIndex: () => readJSON(agendaPath(INDEX_FILE)),
  readMonth: (file) => readSheet(agendaPath(file)),
});

// ---------- Offline ----------

// Offline support (sw.js). The sheets' addresses go in the query string so the worker can save them
// too: Comércio's sheet (`csv`) and the agenda's folder (`dir`, every file in it). Every page registers
// the same address: a different one would replace the worker each time.
export function registerWorker() {
  if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
  const query = `csv=${encodeURIComponent(COMMERCE_CSV_URL)}&dir=${encodeURIComponent(agendaPath(''))}`;
  navigator.serviceWorker.register(`sw.js?${query}`).catch((err) => console.warn('Service worker:', err));
}
