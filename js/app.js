import { CSV_URL } from './config.js';
import { agendaSummary, buildEvents, capitalize, dateKey, findNextEvent, formatDateRange, formatLongDate, formatLongDateRange, formatTimeRange, matchKey, monthName, orgFullName } from './events.js';
import { assignSectorColors, paintSector, sectorRank, sectorsOf } from './colors.js';
import { buildWhatsAppMessage, previewHtml, whatsAppShareUrl } from './whatsapp.js';
import { FLYER_STYLES, FLYER_WIDTH, canShareFiles, downloadFlyer, flyerFilename, renderFlyer, shareFlyer } from './flyer.js';
import { renderAgenda, upcomingLabel } from './agenda.js';
import { renderMonth } from './month.js';
import { icon } from './icons.js';
import { $, announce, el, escapeHtml, initPage, readSheet, registerWorker, safeUrl, showNotice, showOffline } from './page.js';

// From this width the agenda and the activity panel sit side by side; below it the panel is a
// bottom sheet. Keep in sync with the 1100px media queries in css/style.css.
const desktop = window.matchMedia('(min-width: 1100px)');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

// "Now" moves: the page can stay open past midnight, or past an activity's start (see tick()).
let today = new Date();
let todayKey = dateKey(today);

const state = {
  events: [],
  view: 'agenda',
  sectors: new Set(), // matchKey of the chosen sectors; empty = every sector
  org: '', // matchKey of the chosen organization; '' = every organization
  selectedId: null,
  showPast: false,
  year: today.getFullYear(),
  month: today.getMonth(),
  selectedDay: todayKey,
  focusDay: null, // the month grid's keyboard position
};

const collator = new Intl.Collator('pt-BR', { sensitivity: 'base', numeric: true });
const scrollBehavior = () => (reducedMotion.matches ? 'auto' : 'smooth');

// ---------- Data ----------

const fullName = orgFullName;

// Organizations grouped by the sector of the activities they lead (or, failing that, take part in).
function orgsBySector(events) {
  const sectorOf = new Map();
  const names = new Map();
  for (const ev of events) {
    ev.orgs.forEach((org, i) => {
      const key = matchKey(org);
      if (!names.has(key)) names.set(key, org);
      if (ev.sector && (i === 0 || !sectorOf.has(key))) sectorOf.set(key, ev.sector);
    });
  }
  const groups = new Map();
  for (const [key, name] of names) {
    const sector = sectorOf.get(key) || '';
    const group = matchKey(sector);
    if (!groups.has(group)) groups.set(group, { label: sector || 'Sem setor', orgs: [] });
    groups.get(group).orgs.push(name);
  }
  return [...groups.values()]
    .sort((a, b) => sectorRank(a.label) - sectorRank(b.label) || collator.compare(a.label, b.label))
    .map(({ label, orgs }) => [label, orgs.sort(collator.compare)]);
}

const filtered = () => state.sectors.size > 0 || Boolean(state.org);

function matches(ev) {
  if (state.sectors.size && !state.sectors.has(matchKey(ev.sector))) return false;
  if (state.org && !ev.orgs.some((org) => matchKey(org) === state.org)) return false;
  return true;
}

const visibleEvents = () => state.events.filter(matches);
const findEvent = (id) => state.events.find((ev) => ev.id === id) || null;

// The next activity from "now" (see findNextEvent in js/events.js).
const findNext = (events) => findNextEvent(events, today);

// Fetches and reads the spreadsheet. Returns false when nothing could be read. With keepOnError
// (a tab coming back after a long while) a failure leaves the agenda on screen as it was, quietly.
async function fetchAgenda({ keepOnError = false } = {}) {
  try {
    const { headers, records, lines, savedAt } = await readSheet(CSV_URL);
    const { events, invalid, warnings, missing } = buildEvents(headers, records, lines);
    if (missing.length) {
      if (keepOnError) return false;
      showNotice(`<strong>A planilha não tem ${missing.length === 1 ? 'a coluna' : 'as colunas'} ${missing.map((m) => `“${m}”`).join(' e ')}.</strong> Confira se o link em <code>CSV_URL</code> é o da agenda publicada como CSV (<code>${escapeHtml(CSV_URL)}</code>) e se a primeira linha tem os nomes das colunas.`, 'error');
      return false;
    }
    $('notice').hidden = true;
    state.events = events;
    assignSectorColors(sectorsOf(events));
    renderSummary();
    showProblems(invalid, warnings);
    // Set only on sw.js's saved copy, i.e. the live spreadsheet couldn't be reached.
    if (savedAt) showOffline(savedAt, 'a agenda salva');
    return true;
  } catch (err) {
    console.error(err);
    if (keepOnError) return false;
    showNotice(`<strong>Não foi possível carregar a agenda.</strong> Confira a conexão e recarregue a página. Se o problema continuar, avise quem cuida da planilha (<code>${escapeHtml(CSV_URL)}</code>).`, 'error');
    return false;
  }
}

async function start() {
  // Reloaded with the sheet open: drop its history entry, or the first Back would do nothing.
  if (history.state?.nosSheet) history.back();
  await fetchAgenda();
  const next = findNext(state.events);
  if (next) {
    state.year = next.date.getFullYear();
    state.month = next.date.getMonth();
    state.selectedDay = next.dateKey;
    if (desktop.matches) state.selectedId = next.id;
  }
  renderFilters();
  renderTabs();
  renderView();
  renderBench();
}

// Coming back to a tab left open for a while: read the spreadsheet again, keeping filters and
// selection while they still exist. If the sheet can't be read, the agenda stays as it was.
async function reload() {
  if (await fetchAgenda({ keepOnError: true })) {
    const orgs = new Set(state.events.flatMap((ev) => ev.orgs.map(matchKey)));
    if (state.org && !orgs.has(state.org)) state.org = '';
    const sectors = new Set(state.events.map((ev) => matchKey(ev.sector)));
    for (const key of state.sectors) if (!sectors.has(key)) state.sectors.delete(key);
    const selected = findEvent(state.selectedId);
    if (state.selectedId && (!selected || !matches(selected))) {
      state.selectedId = null;
      closeSheet();
    }
    if (!state.selectedId && desktop.matches) state.selectedId = findNext(visibleEvents())?.id ?? null;
    rerender(renderFilters);
  }
  tick(true);
}

// The line under the page's name: "4 atividades até 20/11" (every activity, filters aside).
function renderSummary() {
  $('page-sub').textContent = agendaSummary(state.events, today);
}

// ---------- Notices ----------

// Spreadsheet problems: one summary line for visitors, the row list folded for whoever edits the sheet.
function showProblems(invalid, warnings) {
  if (!invalid.length && !warnings.length) return;
  const summary = [];
  if (invalid.length) summary.push(invalid.length === 1 ? '1 linha da planilha ficou de fora' : `${invalid.length} linhas da planilha ficaram de fora`);
  if (warnings.length) summary.push(warnings.length === 1 ? '1 atividade aparece só no primeiro dia' : `${warnings.length} atividades aparecem só no primeiro dia`);
  const items = [
    ...invalid.map((r) => `<li>Linha ${r.line}: “${escapeHtml(r.title)}”, dia “${escapeHtml(r.day)}”: falta o título ou a data completa (17/10/2026).</li>`),
    ...warnings.map((r) => `<li>Linha ${r.line}: “${escapeHtml(r.title)}”, dia final “${escapeHtml(r.value)}”: não é uma data depois do dia.</li>`),
  ].join('');
  showNotice(`<p><strong>${summary.join(' e ')}.</strong></p><details><summary>Ver as linhas para corrigir</summary><ul>${items}</ul></details>`);
}

// ---------- Focus across re-renders ----------

// Views are rebuilt with replaceChildren(), which drops keyboard focus. Every focusable node that
// can be rebuilt carries data-focus; after a render, focus moves to its new twin.
const FOCUS_FALLBACK = { 'month:today': 'month:title', 'clear-filters': 'chip:all' };
const findFocus = (key) => document.querySelector(`[data-focus="${CSS.escape(key)}"]`);

function rerender(render) {
  const key = document.activeElement?.closest?.('[data-focus]')?.dataset.focus;
  render();
  if (!key || document.activeElement?.closest?.('[data-focus]')) return;
  (findFocus(key) || (FOCUS_FALLBACK[key] && findFocus(FOCUS_FALLBACK[key])))?.focus({ preventScroll: true });
}

// ---------- Filters ----------

function renderFilters() {
  const bar = $('filters');
  bar.hidden = state.events.length === 0;

  // Organization: a native select dressed as a pill, so phones get their own picker.
  // Options carry the full name, so people outside the movements know who is who.
  const select = $('org-select');
  select.replaceChildren(new Option('Todas as organizações', ''));
  for (const [sector, orgs] of orgsBySector(state.events)) {
    const group = document.createElement('optgroup');
    group.label = sector;
    for (const org of orgs) {
      const full = fullName(org);
      const option = new Option(full ? `${org} – ${full}` : org, matchKey(org));
      option.dataset.short = org;
      group.append(option);
    }
    select.append(group);
  }
  select.value = state.org;
  const chosen = select.selectedOptions[0];
  $('org-pill').classList.toggle('is-active', Boolean(state.org));
  $('org-label').textContent = state.org && chosen ? chosen.dataset.short : 'Organização';

  const chips = $('sector-chips');
  chips.replaceChildren();
  const chip = (label, focusKey, active, onClick, sector) => {
    const b = el('button', 'chip');
    b.type = 'button';
    b.dataset.focus = focusKey;
    b.setAttribute('aria-pressed', String(active));
    const check = el('span', 'chip-check');
    check.innerHTML = icon('check');
    b.append(check);
    if (sector) {
      paintSector(b, sector);
      b.append(el('span', 'dot'));
    }
    b.append(document.createTextNode(label));
    b.addEventListener('click', onClick);
    return b;
  };
  chips.append(chip('Todos', 'chip:all', state.sectors.size === 0, () => {
    state.sectors.clear();
    refresh();
  }));
  for (const sector of sectorsOf(state.events)) {
    const key = matchKey(sector);
    chips.append(chip(sector, `chip:${key}`, state.sectors.has(key), () => {
      if (state.sectors.has(key)) state.sectors.delete(key);
      else state.sectors.add(key);
      refresh();
    }, sector));
  }
}

// How the empty state names the active filter.
function filterLabel() {
  const parts = [];
  if (state.org) parts.push($('org-select').selectedOptions[0]?.dataset.short || state.org);
  if (state.sectors.size) parts.push(sectorsOf(state.events).filter((s) => state.sectors.has(matchKey(s))).join(', '));
  return parts.length === 1 ? `para ${parts[0]}` : 'com esses filtros';
}

function clearFilters() {
  state.sectors.clear();
  state.org = '';
  refresh();
}

// Filters changed: the selected activity stays only if it is still listed.
function refresh() {
  if (state.selectedId && !matches(findEvent(state.selectedId))) {
    state.selectedId = null;
    closeSheet();
  }
  if (!state.selectedId && desktop.matches) state.selectedId = findNext(visibleEvents())?.id ?? null;
  rerender(() => {
    renderFilters();
    renderView();
    renderBench();
  });
  if (filtered()) announce(upcomingLabel(visibleEvents().filter((ev) => (ev.endDateKey || ev.dateKey) >= todayKey).length));
  else announce('Mostrando todas as atividades');
}

// ---------- Views ----------

function renderTabs() {
  document.querySelectorAll('.view-tabs [role=tab]').forEach((tab) => {
    const active = tab.dataset.view === state.view;
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
  });
  $('view').setAttribute('aria-labelledby', state.view === 'agenda' ? 'tab-agenda' : 'tab-month');
}

let lastNextId = null;

function renderView() {
  const container = $('view');
  const events = visibleEvents();
  const nextId = findNext(events)?.id ?? null;
  lastNextId = nextId;
  const onSelect = (ev) => select(ev, { trigger: document.activeElement });

  if (!state.events.length) {
    container.replaceChildren(el('p', 'placeholder', $('notice').hidden ? 'A agenda está vazia.' : ''));
    return;
  }

  if (state.view === 'agenda') {
    renderAgenda(container, {
      events,
      today,
      nextId,
      selectedId: state.selectedId,
      showPast: state.showPast,
      filtered: filtered(),
      filterLabel: filterLabel(),
      onSelect,
      onClearFilters: clearFilters,
      onTogglePast: () => {
        state.showPast = !state.showPast;
        rerender(renderView);
      },
    });
  } else {
    renderMonth(container, {
      year: state.year,
      month: state.month,
      events,
      today,
      nextId,
      selectedDay: state.selectedDay,
      focusDay: state.focusDay,
      selectedId: state.selectedId,
      onSelect,
      onPrev: () => shiftMonth(-1),
      onNext: () => shiftMonth(1),
      onToday: () => {
        state.year = today.getFullYear();
        state.month = today.getMonth();
        state.selectedDay = todayKey;
        state.focusDay = null;
        rerender(renderView);
        announce(`${capitalize(monthName(state.month))} de ${state.year}`);
      },
      onDay: (key, dayEvents) => pickDay(key, dayEvents),
      onMove: (key) => moveFocusDay(key),
    });
  }
}

// A day was picked in the month: print its sheet (on desk, open its first activity). Picking a
// grey day of the neighbouring month flips to that month.
function pickDay(key, dayEvents) {
  const [y, m] = key.split('-').map(Number);
  const flipped = y !== state.year || m - 1 !== state.month;
  state.year = y;
  state.month = m - 1;
  state.selectedDay = key;
  state.focusDay = key;
  if (desktop.matches && dayEvents.length && !dayEvents.some((ev) => ev.id === state.selectedId)) state.selectedId = dayEvents[0].id;
  rerender(() => {
    renderView();
    renderBench();
  });
  findFocus(`day:${key}`)?.focus({ preventScroll: true });
  if (flipped) announce(`${capitalize(monthName(state.month))} de ${state.year}`);
  // Phones: bring the day's sheet into view under the page.
  if (!desktop.matches) $('view').querySelector('.month-day')?.scrollIntoView({ behavior: scrollBehavior(), block: 'nearest' });
}

// Arrow keys in the month grid: move the keyboard position, flipping the month when needed.
function moveFocusDay(key) {
  const [y, m] = key.split('-').map(Number);
  const flipped = y !== state.year || m - 1 !== state.month;
  state.year = y;
  state.month = m - 1;
  state.focusDay = key;
  renderView();
  findFocus(`day:${key}`)?.focus();
  if (flipped) announce(`${capitalize(monthName(state.month))} de ${state.year}`);
}

// Turning the page keeps a day of the new month under it: today in today's month, else the
// month's first day with activities, else none.
function shiftMonth(delta) {
  const d = new Date(state.year, state.month + delta, 1);
  state.year = d.getFullYear();
  state.month = d.getMonth();
  state.focusDay = null;
  const prefix = `${state.year}-${String(state.month + 1).padStart(2, '0')}`;
  if (todayKey.startsWith(prefix)) state.selectedDay = todayKey;
  else state.selectedDay = visibleEvents().find((ev) => ev.dateKey.startsWith(prefix))?.dateKey ?? null;
  rerender(renderView);
  announce(`${capitalize(monthName(state.month))} de ${state.year}`);
}

// The page stays open: re-render when the day turns or the next activity changes.
function tick(force = false) {
  const now = new Date();
  const dayChanged = dateKey(now) !== todayKey;
  today = now;
  todayKey = dateKey(now);
  const nextId = findNext(visibleEvents())?.id ?? null;
  if (force || dayChanged || nextId !== lastNextId) {
    renderSummary();
    rerender(() => {
      renderView();
      renderBench();
    });
  }
}

// ---------- Activity panel ("bench": side panel on desktop, bottom sheet on phones) ----------

let activePanel = 'message';
let returnFocus = null;

function select(ev, { trigger } = {}) {
  if (ev.id !== state.selectedId) settleButtons();
  state.selectedId = ev.id;
  rerender(() => {
    renderView();
    renderBench();
  });
  if (!desktop.matches) openSheet(trigger);
}

// One row of the facts list. `marker` is an icon name, or 'sector' for the group's dot.
function fact(marker, content, label, className = '') {
  const row = el('div', `fact ${className}`.trim());
  const dt = el('dt');
  dt.innerHTML = `${marker === 'sector' ? '<span class="dot"></span>' : icon(marker)}<span class="sr-only">${label}</span>`;
  const dd = el('dd');
  if (typeof content === 'string') dd.textContent = content;
  else dd.append(content);
  row.append(dt, dd);
  return row;
}

function link(href, text, { wide = false } = {}) {
  const a = el('a', wide ? 'fact-link' : null, text);
  a.href = href;
  if (/^https?:/.test(href)) {
    a.target = '_blank';
    a.rel = 'noopener';
  }
  return a;
}

// Contact text with its phone numbers and e-mails made tappable: Brazilian mobile numbers open
// WhatsApp, landlines call. "(67) 9 8457-5974" → wa.me/5567984575974.
const CONTACT_PARTS = /(\(?\b0?\d{2}\)?[\s.-]?(?:9[\s.-]?)?\d{4}[\s.-]?\d{4}\b)|([\p{L}\p{N}._%+-]+@[\p{L}\p{N}-]+(?:\.[\p{L}\p{N}-]+)+)/gu;
function contactNode(text) {
  const out = document.createDocumentFragment();
  let last = 0;
  for (const match of text.matchAll(CONTACT_PARTS)) {
    out.append(text.slice(last, match.index));
    const [whole, phone, email] = match;
    if (email) {
      out.append(link(`mailto:${email}`, email));
    } else {
      const digits = phone.replace(/\D/g, '').replace(/^0/, '');
      out.append(link(digits.length === 11 ? `https://wa.me/55${digits}` : `tel:+55${digits}`, whole));
    }
    last = match.index + whole.length;
  }
  out.append(text.slice(last));
  return out;
}

// The panel's head: the day in NOS's voice ("Sábado, 31 de outubro", a period as "Sex, 09/10 a Dom,
// 11/10") and the time, "a próxima" on the next activity; the full date for screen readers.
function renderBenchDate(ev) {
  const box = $('bench-date');
  box.replaceChildren();
  box.classList.toggle('is-struck', ev.cancelled);
  const year = ev.date.getFullYear() !== today.getFullYear() ? ` de ${ev.date.getFullYear()}` : '';
  const time = formatTimeRange(ev);
  const visual = el('span', 'bench-date-visual');
  visual.setAttribute('aria-hidden', 'true');
  visual.append(el('span', 'bench-day', `${ev.endDate ? formatDateRange(ev) : formatLongDate(ev.date).replace('-feira', '')}${year}`));
  const when = el('span', 'bench-when');
  when.append(el('span', 'bench-time', time || 'Horário a confirmar'));
  const isNext = ev.id === lastNextId;
  if (isNext) when.append(el('span', 'next-label', 'a próxima'));
  visual.append(when);
  const spoken = `${formatLongDateRange(ev)}${year}, ${time || 'horário a confirmar'}${ev.cancelled ? ', cancelada' : ''}${isNext ? ', a próxima atividade' : ''}.`;
  box.append(visual, el('span', 'sr-only', spoken));
}

function renderBench() {
  const ev = findEvent(state.selectedId);
  const bench = $('bench');
  $('bench-empty').hidden = Boolean(ev);
  $('bench-body').hidden = !ev;
  if (!ev) {
    bench.removeAttribute('aria-labelledby');
    bench.setAttribute('aria-label', 'Atividade');
    return;
  }
  bench.removeAttribute('aria-label');
  bench.setAttribute('aria-labelledby', 'bench-title');
  loadFlyerFonts();

  paintSector(bench, ev.sector);
  renderBenchDate(ev);
  $('bench-title').textContent = ev.title;
  $('bench-title').classList.toggle('is-struck', ev.cancelled);

  const note = $('bench-cancel');
  note.hidden = !ev.cancelled;
  note.innerHTML = ev.cancelled ? `<span class="tag tag-cancelled">Cancelada</span>${ev.cancelReason ? `<p>Motivo: ${escapeHtml(ev.cancelReason)}</p>` : ''}` : '';

  const facts = $('bench-facts');
  facts.replaceChildren();
  if (ev.org) {
    const org = el('span', 'fact-org');
    org.append(el('span', 'fact-org-name', ev.org));
    if (ev.sector) org.append(el('span', 'fact-muted', ` · ${ev.sector}`));
    // Acronyms come with the organization's name where it is known (ORG_NAMES in js/config.js).
    const known = ev.orgs.map((name) => [name, fullName(name)]).filter(([, full]) => full);
    if (known.length) org.append(el('span', 'fact-org-full', known.map(([name, full]) => (ev.orgs.length > 1 ? `${name}: ${full}` : full)).join('; ')));
    facts.append(fact(ev.sector ? 'sector' : 'users', org, 'Organização', 'is-org'));
  }
  if (ev.endDate) facts.append(fact('calendar-range', formatLongDateRange(ev), 'Período'));
  if (ev.local || ev.city) {
    const place = el('span');
    if (ev.city) place.append(el('span', 'city-tag', ev.city));
    if (ev.local) place.append(document.createTextNode(ev.local));
    facts.append(fact(ev.online ? 'globe' : 'pin', place, 'Local'));
  }
  if (ev.type) facts.append(fact('tag', ev.type, 'Tipo'));
  if (ev.contact) {
    const contact = el('span');
    contact.append(contactNode(ev.contact));
    facts.append(fact('phone', contact, 'Contato'));
  }
  const linkUrl = safeUrl(ev.link);
  if (ev.link) facts.append(fact('link', linkUrl ? link(linkUrl, linkUrl.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, ''), { wide: true }) : ev.link, 'Link'));
  const sourceUrl = safeUrl(ev.source);
  if (ev.source) {
    const instagram = /instagram\.com/i.test(ev.source);
    facts.append(fact(instagram ? 'instagram' : 'link', sourceUrl ? link(sourceUrl, instagram ? 'Ver o post de origem' : 'Ver a fonte', { wide: true }) : ev.source, 'Fonte'));
  }
  $('bench-desc').textContent = ev.description;
  $('bench-desc').hidden = !ev.description;

  const message = buildWhatsAppMessage(ev);
  $('bubble').innerHTML = previewHtml(message);
  $('wa-link').href = whatsAppShareUrl(message);
  setButton($('wa-link'), 'message', ev.cancelled ? 'Avisar no WhatsApp' : 'Enviar no WhatsApp');

  renderFlyerPreview(ev);
  showPanel(activePanel);
}

// The flyers are set in Barlow (css/flyers.css), which nothing else on the page uses: it is asked for
// as soon as an activity is open, so the preview and the PNG don't wait for it.
let flyerFontsAsked = false;
function loadFlyerFonts() {
  if (flyerFontsAsked || !document.fonts) return;
  flyerFontsAsked = true;
  for (const face of ['500 1em Barlow', '600 1em Barlow', '700 1em Barlow', '600 1em "Barlow Condensed"', '700 1em "Barlow Condensed"', '800 1em "Barlow Condensed"']) {
    document.fonts.load(face).catch(() => {});
  }
}

// ---------- Flyer style picker ----------

const STYLE_KEY = 'nos.flyerStyle';
let flyerStyle = FLYER_STYLES[0].id;
try {
  const saved = localStorage.getItem(STYLE_KEY);
  if (FLYER_STYLES.some((s) => s.id === saved)) flyerStyle = saved;
} catch {
  // Storage unavailable (private mode): the default style is fine.
}

function renderFlyerPreview(ev = findEvent(state.selectedId)) {
  if (!ev) return;
  $('flyer-scaler').replaceChildren(renderFlyer(ev, flyerStyle));
  // A cancelled activity always gets the notice layout, so there is no style to pick.
  $('style-picker').hidden = ev.cancelled;
  $('flyer-hint').textContent = ev.cancelled
    ? 'Aviso de cancelamento, 1080 × 1350, no formato do WhatsApp e do Instagram.'
    : 'Imagem 1080 × 1350, no formato do WhatsApp e do Instagram.';
  const index = FLYER_STYLES.findIndex((s) => s.id === flyerStyle);
  $('style-select').value = flyerStyle;
  $('style-count').textContent = `${index + 1}/${FLYER_STYLES.length}`;
  requestAnimationFrame(scaleFlyer);
}

function setFlyerStyle(id) {
  flyerStyle = id;
  try {
    localStorage.setItem(STYLE_KEY, id);
  } catch {
    // Not remembered; still applied for this visit.
  }
  renderFlyerPreview();
}

function stepFlyerStyle(delta) {
  const index = FLYER_STYLES.findIndex((s) => s.id === flyerStyle);
  setFlyerStyle(FLYER_STYLES[(index + delta + FLYER_STYLES.length) % FLYER_STYLES.length].id);
}

for (const style of FLYER_STYLES) $('style-select').append(new Option(style.name, style.id));
$('style-select').addEventListener('change', (e) => setFlyerStyle(e.target.value));
$('style-prev').innerHTML = icon('left');
$('style-next').innerHTML = icon('right');
$('style-prev').addEventListener('click', () => stepFlyerStyle(-1));
$('style-next').addEventListener('click', () => stepFlyerStyle(1));

// Mensagem or Panfleto. In flyer mode the panel folds the facts and the description away, so the
// title, the style picker, the preview and the buttons fit together without scrolling.
function showPanel(name) {
  activePanel = name;
  $('bench').dataset.panel = name;
  document.querySelectorAll('.seg [role=tab]').forEach((tab) => {
    const active = tab.dataset.panel === name;
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
  });
  $('panel-message').hidden = name !== 'message';
  $('panel-flyer').hidden = name !== 'flyer';
  $('actions-message').hidden = name !== 'message';
  $('actions-flyer').hidden = name !== 'flyer';
  if (name === 'flyer') requestAnimationFrame(scaleFlyer);
}

// The panel starts at its top; on short screens flyer mode starts at the format bar instead, so
// the preview gets the room (the 699px media query in style.css sizes it for that).
function settleScroll() {
  const scroll = $('bench-scroll');
  scroll.scrollTop = 0;
  if (activePanel !== 'flyer' || window.innerHeight >= 700) return;
  const bar = $('seg-bar').getBoundingClientRect().top - scroll.getBoundingClientRect().top;
  // Only when the panel is long enough to bring the bar to the top: stopping short would cut the
  // title in half (phones on their side, where the preview stands beside the bar).
  if (scroll.scrollHeight - scroll.clientHeight >= bar) scroll.scrollTop = bar;
}

function scaleFlyer() {
  const frame = $('flyer-frame');
  if (!frame.clientWidth) return;
  $('flyer-scaler').style.transform = `scale(${frame.clientWidth / FLYER_WIDTH})`;
}

// ---------- Bottom sheet (phones) ----------

// While the sheet is open it is a modal dialog: the page behind is inert, and the phone's Back
// button closes it (the sheet adds a history entry; ×, the backdrop and Escape go back through it).
let sheetOpen = false;
let sheetInHistory = false;

function setModal(on) {
  for (const node of document.querySelectorAll('.skip-link, .site-head, #main, .site-foot')) node.inert = on;
  const bench = $('bench');
  if (on) {
    bench.setAttribute('role', 'dialog');
    bench.setAttribute('aria-modal', 'true');
  } else {
    bench.removeAttribute('role');
    bench.removeAttribute('aria-modal');
  }
}

function openSheet(trigger) {
  returnFocus = trigger instanceof HTMLElement && trigger !== document.body ? trigger : null;
  $('sheet-backdrop').hidden = false;
  document.body.classList.add('sheet-open');
  settleScroll();
  setModal(true);
  sheetOpen = true;
  if (!sheetInHistory) {
    history.pushState({ nosSheet: true }, '');
    sheetInHistory = true;
  }
  requestAnimationFrame(() => {
    $('bench').classList.add('is-open');
    $('bench').focus({ preventScroll: true });
    scaleFlyer();
  });
}

function closeSheet() {
  if (!sheetOpen) return;
  if (sheetInHistory) {
    sheetInHistory = false;
    history.back(); // popstate hides the sheet
    return;
  }
  hideSheet();
}

function hideSheet() {
  if (!sheetOpen) return;
  sheetOpen = false;
  $('bench').classList.remove('is-open');
  $('bench').style.removeProperty('--drag');
  document.body.classList.remove('sheet-open');
  $('sheet-backdrop').hidden = true;
  setModal(false);
  const target = returnFocus && document.contains(returnFocus) ? returnFocus : document.querySelector(`.event-card[data-id="${state.selectedId}"]`);
  target?.focus({ preventScroll: true });
}

window.addEventListener('popstate', () => {
  sheetInHistory = false;
  hideSheet();
});

// Dragging the sheet's head down closes it, as the grabber promises.
function wireSheetDrag() {
  const bench = $('bench');
  let startY = null;
  let dy = 0;
  bench.addEventListener('pointerdown', (e) => {
    if (!sheetOpen || desktop.matches || !e.target.closest('.grabber, .bench-head') || e.target.closest('button')) return;
    startY = e.clientY;
    dy = 0;
    bench.setPointerCapture(e.pointerId);
    bench.classList.add('is-dragging');
  });
  bench.addEventListener('pointermove', (e) => {
    if (startY == null) return;
    dy = Math.max(0, e.clientY - startY);
    bench.style.setProperty('--drag', `${dy}px`);
  });
  const end = () => {
    if (startY == null) return;
    startY = null;
    bench.classList.remove('is-dragging');
    bench.style.removeProperty('--drag');
    if (dy > 90) closeSheet();
  };
  bench.addEventListener('pointerup', end);
  bench.addEventListener('pointercancel', end);
}

// ---------- Buttons ----------

// Returns whether the text reached the clipboard.
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.append(ta);
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

// The label also goes to aria-label: on narrow phones the second action shows only its icon.
function setButton(button, iconName, label) {
  button.innerHTML = `${icon(iconName)}<span>${label}</span>`;
  button.setAttribute('aria-label', label);
}

function flash(button, iconName, label, restore) {
  setButton(button, iconName, label);
  button.classList.add('is-done');
  clearTimeout(button._timer);
  button._timer = setTimeout(() => {
    button.classList.remove('is-done');
    restore();
  }, 2000);
}

// ---------- Wiring ----------

function wireTabs(selector, onPick) {
  const tabs = [...document.querySelectorAll(selector)];
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => onPick(tab));
    tab.addEventListener('keydown', (e) => {
      const to = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
      if (to == null) return;
      e.preventDefault();
      const next = tabs[(to + tabs.length) % tabs.length];
      next.focus();
      onPick(next);
    });
  });
}

initPage('Agenda');

wireTabs('.view-tabs [role=tab]', (tab) => {
  state.view = tab.dataset.view;
  state.focusDay = null;
  renderTabs();
  renderView();
});
wireTabs('.seg [role=tab]', (tab) => {
  showPanel(tab.dataset.panel);
  settleScroll();
});

$('org-select').addEventListener('change', (e) => {
  state.org = e.target.value;
  refresh();
});

// Phones: a chip or the organization select reached with the keyboard scrolls fully into view
// (the bar scrolls sideways; Shift+Tab back to the select would leave it half off the edge).
$('filters').addEventListener('focusin', (e) => {
  if (e.target.closest('.chip, .org-pill')) e.target.scrollIntoView({ behavior: scrollBehavior(), block: 'nearest', inline: 'nearest' });
});

const resetWa = () => setButton($('wa-link'), 'message', findEvent(state.selectedId)?.cancelled ? 'Avisar no WhatsApp' : 'Enviar no WhatsApp');
const resetCopy = () => setButton($('copy-btn'), 'copy', 'Copiar texto');
const resetShare = () => setButton($('share-btn'), 'share', 'Compartilhar imagem');
const resetDownload = () => setButton($('download-btn'), 'download', 'Baixar PNG');
resetWa();
resetCopy();
resetShare();
resetDownload();
$('bench-close').innerHTML = icon('close');
$('share-btn').hidden = !canShareFiles();
// Without native sharing the download is the only action, so it takes the lead.
if ($('share-btn').hidden) $('download-btn').classList.replace('btn-line', 'btn-accent');

$('copy-btn').addEventListener('click', async () => {
  const ev = findEvent(state.selectedId);
  if (!ev) return;
  const copied = await copyText(buildWhatsAppMessage(ev));
  $('copy-btn').focus({ preventScroll: true });
  if (copied) flash($('copy-btn'), 'check', 'Copiado', resetCopy);
  else flash($('copy-btn'), 'alert', 'Não deu certo, tente de novo', resetCopy);
});

// "Copiado" or "Imagem baixada" belongs to the activity it was done for: picking another one ends it.
function settleButtons() {
  for (const [id, reset] of [['copy-btn', resetCopy], ['share-btn', resetShare], ['download-btn', resetDownload]]) {
    const button = $(id);
    if (!button.classList.contains('is-done')) continue;
    clearTimeout(button._timer);
    button.classList.remove('is-done');
    reset();
  }
}

async function withFlyer(button, busyLabel, action, doneLabel, reset) {
  const ev = findEvent(state.selectedId);
  const node = $('flyer-scaler').firstElementChild;
  if (!ev || !node) return;
  button.disabled = true;
  setButton(button, 'image', busyLabel);
  try {
    await action(node, ev);
    flash(button, 'check', doneLabel, reset);
  } catch (err) {
    if (err?.name === 'AbortError') {
      reset();
    } else {
      console.error(err);
      flash(button, 'alert', 'Não deu certo, tente de novo', reset);
    }
  } finally {
    button.disabled = false;
  }
}

$('download-btn').addEventListener('click', () =>
  withFlyer($('download-btn'), 'Gerando imagem…', (node, ev) => downloadFlyer(node, flyerFilename(ev, flyerStyle)), 'Imagem baixada', resetDownload));

$('share-btn').addEventListener('click', () =>
  withFlyer($('share-btn'), 'Gerando imagem…', (node, ev) => shareFlyer(node, flyerFilename(ev, flyerStyle), ev.title), 'Compartilhado', resetShare));

$('bench-close').addEventListener('click', closeSheet);
$('sheet-backdrop').addEventListener('click', closeSheet);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeSheet();
});
wireSheetDrag();

desktop.addEventListener('change', () => {
  if (desktop.matches) {
    closeSheet();
    if (!state.selectedId) {
      state.selectedId = findNext(visibleEvents())?.id ?? null;
      renderView();
      renderBench();
    }
  }
  scaleFlyer();
});
new ResizeObserver(scaleFlyer).observe($('flyer-frame'));

// Keep "Hoje" and "Próxima" true while the page stays open, and read the sheet again after a
// long absence (a phone tab resumed the next morning).
let hiddenAt = null;
setInterval(() => {
  if (!document.hidden) tick();
}, 60_000);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    hiddenAt = Date.now();
    return;
  }
  if (hiddenAt && Date.now() - hiddenAt > 30 * 60_000) reload();
  else tick();
  hiddenAt = null;
});
window.addEventListener('pageshow', (e) => {
  if (e.persisted) tick();
});

if (location.protocol !== 'file:') start();

registerWorker();
