import { AGENDA_DIR } from './config.js';
import { addMonths, firstDay, monthOf } from './month-files.js';
import { agendaSummary, awaitsTime, capitalize, dateKey, findNextEvent, formatDateRange, formatLongDate, formatLongDateRange, formatTimeRange, lastDayKey, matchKey, monthName, orgFullName } from './events.js';
import { assignSectorColors, paintSector, sectorRank, sectorsOf } from './colors.js';
import { buildWhatsAppMessage, previewHtml, whatsAppShareUrl } from './whatsapp.js';
import { FLYER_STYLES, FLYER_WIDTH, canShareFiles, downloadFlyer, flyerFilename, renderFlyer, shareFlyer } from './flyer.js';
import { renderAgenda, upcomingLabel } from './agenda.js';
import { monthGridStart, renderMonth } from './month.js';
import { initSaveMenu, openSaveMenu } from './save-menu.js';
import { icon } from './icons.js';
import { $, agendaSource, announce, copyText, el, escapeHtml, initPage, registerWorker, safeUrl, showNotice, showOffline } from './page.js';

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

// The agenda's months (js/month-files.js): only the window read so far, from its first day on.
const agenda = agendaSource();

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

// The agenda opens from the 1st of last month: this month's page is whole (the grey days of its first
// week included) and "Ver N atividades anteriores" has a month behind it. sw.js saves the same months
// on the first visit.
const openingDay = () => firstDay(addMonths(monthOf(todayKey), -1));

// Reads the agenda: the index and the months from the opening day on, or with `again` the whole window
// once more (a tab coming back after a long while: a failure then leaves the agenda on screen as it
// was, quietly). Returns false when nothing could be read.
async function fetchAgenda({ again = false } = {}) {
  try {
    if (again) await agenda.refresh(openingDay());
    else await agenda.open(openingDay());
    useAgenda();
    return true;
  } catch (err) {
    console.error(err);
    if (again) return false;
    showNotice(`<strong>Não foi possível carregar a agenda.</strong> Confira a conexão e recarregue a página. Se o problema continuar, avise quem cuida da agenda (<code>${escapeHtml(AGENDA_DIR)}</code>).`, 'error');
    return false;
  }
}

// What was read goes on screen: the activities, their groups' colours, the top line, and the notices
// (rows to fix; a saved copy, i.e. the site couldn't be reached).
function useAgenda() {
  state.events = agenda.events;
  assignSectorColors(sectorsOf(state.events));
  renderSummary();
  $('notice').hidden = true;
  const { invalid, warnings, missing } = agenda.problems();
  showProblems(invalid, warnings, missing);
  const savedAt = agenda.savedAt();
  if (savedAt) showOffline(savedAt, 'a agenda salva');
}

// ---------- Going back in time ----------

// An earlier month in the month view, "Ver atividades de setembro" in the list, the address of an old
// activity: the window's first day moves back, reading the months that needs. Each first day asked
// for is read once; meanwhile its state ('loading', then 'failed' if it couldn't be read) is what the
// views show, until it is asked for again (backJobs.delete).
const backJobs = new Map();

// Returns 'ready' when the window already starts on `day` or before (or moved there at once: nothing
// left to read), else the state of its reading. `onRead` runs once the months arrive.
function goBack(day, onRead) {
  if (day >= agenda.since) return 'ready';
  if (backJobs.has(day)) return backJobs.get(day);
  const job = agenda.extend(day);
  if (!job) {
    useAgenda();
    renderFilters(); // the days now shown may bring organizations and groups
    return 'ready';
  }
  backJobs.set(day, 'loading');
  job.then(() => {
    backJobs.delete(day);
    useAgenda();
    onRead();
  }, (err) => {
    console.error(err);
    backJobs.set(day, 'failed');
    rerender(renderView);
    announce('Não foi possível carregar as atividades anteriores. Confira a conexão.');
  });
  return 'loading';
}

const pad2 = (n) => String(n).padStart(2, '0');
const shownMonth = () => `${state.year}-${pad2(state.month + 1)}`;

// "setembro", or "dezembro de 2025" in another year.
function monthLabel(month) {
  const [y, m] = month.split('-').map(Number);
  return `${monthName(m - 1)}${y !== today.getFullYear() ? ` de ${y}` : ''}`;
}

const pastCount = () => visibleEvents().filter((ev) => lastDayKey(ev) < todayKey).length;

function refreshAll() {
  rerender(() => {
    renderFilters();
    renderView();
    renderBench();
  });
}

// The month on screen is whole once the window reaches its grid's first day (the grey days of the
// month before included). Until then it is read, and drawn again when it arrives: 'loading' (or
// 'failed') only while the month's own days wait; its grey days fill in when they come.
function monthReadiness() {
  const status = goBack(dateKey(monthGridStart(state.year, state.month)), () => {
    // Turned to a month that was still on its way: its first day with activities is picked now.
    if (state.view === 'month' && !state.selectedDay) state.selectedDay = visibleEvents().find((ev) => ev.dateKey.startsWith(shownMonth()))?.dateKey ?? null;
    refreshAll();
  });
  return status !== 'ready' && firstDay(shownMonth()) >= agenda.since ? 'ready' : status;
}

function retryMonth() {
  backJobs.delete(dateKey(monthGridStart(state.year, state.month)));
  rerender(renderView);
}

// "Ver atividades de setembro": the month before the window, added to the list's past.
function loadOlder() {
  const month = agenda.older();
  if (!month) return;
  const day = firstDay(month);
  if (backJobs.get(day) === 'loading') return;
  backJobs.delete(day); // a month that failed is tried again
  const before = pastCount();
  const told = () => {
    const added = pastCount() - before;
    announce(added
      ? `${added} ${added === 1 ? 'atividade anterior' : 'atividades anteriores'}, de ${monthLabel(month)}`
      : `Nenhuma atividade ${filtered() ? `${filterLabel()} ` : ''}em ${monthLabel(month)}`);
  };
  const status = goBack(day, () => {
    refreshAll();
    told();
  });
  if (status === 'ready') {
    refreshAll();
    told();
  } else {
    rerender(renderView);
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
  openFromAddress();
}

// An address naming an activity (agenda.html#ev-…: a calendar entry's link, "Copiar o link da
// atividade") opens it in the panel; #salvar-tudo opens "Salvar tudo na agenda" (the link sent to be
// opened on a computer, or in Safari). An activity from before the window is read first: its id
// starts with its first day, so its month is known.
async function openFromAddress() {
  const target = decodeURIComponent(location.hash.slice(1));
  if (target === 'salvar-tudo' && state.events.length) {
    openSaveMenu({ all: true }, $('save-all'));
    return;
  }
  if (!target.startsWith('ev-')) return;
  let ev = findEvent(target);
  const day = /^ev-(\d{4}-\d{2}-\d{2})-/.exec(target)?.[1];
  if (!ev && day && day < agenda.since && agenda.has(monthOf(day))) {
    try {
      await agenda.extend(firstDay(monthOf(day)));
    } catch (err) {
      console.error(err);
      showNotice('<strong>Não foi possível abrir a atividade do link.</strong> Confira a conexão e recarregue a página.');
      return;
    }
    useAgenda();
    renderFilters();
    ev = findEvent(target);
  }
  if (!ev) return;
  if (!matches(ev)) {
    state.sectors.clear();
    state.org = '';
    renderFilters();
  }
  if (lastDayKey(ev) < todayKey) state.showPast = true;
  state.year = ev.date.getFullYear();
  state.month = ev.date.getMonth();
  state.selectedDay = ev.dateKey;
  select(ev);
  document.querySelector(`.event-card[data-id="${CSS.escape(ev.id)}"]`)?.scrollIntoView({ block: 'center' });
}

// Coming back to a tab left open for a while: read the agenda again (the months read so far), keeping
// filters and selection while they still exist. If it can't be read, the agenda stays as it was.
async function reload() {
  backJobs.clear(); // a month that couldn't be read is tried again
  if (await fetchAgenda({ again: true })) {
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

// Problems in the agenda's files (the pre-commit hook refuses them, so they only come from a file
// that skipped it): one summary line for visitors, the rows folded for whoever edits the agenda, each
// with its month's file ("2026-11.csv, linha 5").
function showProblems(invalid, warnings, missing) {
  if (!invalid.length && !warnings.length && !missing.length) return;
  const summary = [];
  if (missing.length) summary.push(missing.length === 1 ? '1 mês da agenda não pôde ser lido' : `${missing.length} meses da agenda não puderam ser lidos`);
  if (invalid.length) summary.push(invalid.length === 1 ? '1 linha da agenda ficou de fora' : `${invalid.length} linhas da agenda ficaram de fora`);
  if (warnings.length) summary.push(warnings.length === 1 ? '1 atividade aparece só no primeiro dia' : `${warnings.length} atividades aparecem só no primeiro dia`);
  const columns = (list) => `${list.length === 1 ? 'a coluna' : 'as colunas'} ${list.map((c) => `“${escapeHtml(c)}”`).join(' e ')}`;
  const where = (r) => `${escapeHtml(r.file)}, linha ${r.line}`;
  const items = [
    ...missing.map((r) => `<li>${escapeHtml(r.file)}: a primeira linha não tem ${columns(r.columns)}.</li>`),
    ...invalid.map((r) => `<li>${where(r)}: “${escapeHtml(r.title)}”, dia “${escapeHtml(r.day)}”: falta o título ou a data completa (17/10/2026).</li>`),
    ...warnings.map((r) => `<li>${where(r)}: “${escapeHtml(r.title)}”, dia final “${escapeHtml(r.value)}”: não é uma data depois do dia.</li>`),
  ].join('');
  showNotice(`<p><strong>${summary.join(' e ')}.</strong></p><details><summary>Ver as linhas para corrigir</summary><ul>${items}</ul></details>`);
}

// ---------- Focus across re-renders ----------

// Views are rebuilt with replaceChildren(), which drops keyboard focus. Every focusable node that
// can be rebuilt carries data-focus; after a render, focus moves to its new twin.
const FOCUS_FALLBACK = { 'month:today': 'month:title', 'month:retry': 'month:title', 'clear-filters': 'chip:all', 'past-more': 'past-toggle' };
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
  $('save-all-row').hidden = state.events.length === 0;

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
  // First, as it can move the window at once (and with it state.events).
  const monthStatus = state.view === 'month' && agenda.since != null ? monthReadiness() : 'ready';
  const events = visibleEvents();
  const nextId = findNext(events)?.id ?? null;
  lastNextId = nextId;
  const onSelect = (ev) => select(ev, { trigger: document.activeElement });
  const onSave = (ev, button) => openSaveMenu({ ev }, button);
  // The month before the window, for the list's "Ver atividades de setembro".
  const olderMonth = agenda.older();

  if (!state.events.length && !olderMonth && monthStatus === 'ready') {
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
      onSave,
      onClearFilters: clearFilters,
      onTogglePast: () => {
        state.showPast = !state.showPast;
        rerender(renderView);
        // Nothing read behind today yet (for these filters): bring the month before.
        if (state.showPast && !pastCount()) loadOlder();
      },
      older: olderMonth ? { label: monthLabel(olderMonth), status: backJobs.get(firstDay(olderMonth)) || 'idle' } : null,
      onOlder: loadOlder,
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
      onSave,
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
      status: monthStatus,
      onRetry: retryMonth,
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
  // No time reads "Horário a confirmar", except for a deadline or a period (awaitsTime): nothing.
  const pending = !time && awaitsTime(ev);
  const visual = el('span', 'bench-date-visual');
  visual.setAttribute('aria-hidden', 'true');
  visual.append(el('span', 'bench-day', `${ev.endDate ? formatDateRange(ev) : formatLongDate(ev.date).replace('-feira', '')}${year}`));
  const when = el('span', 'bench-when');
  if (time || pending) when.append(el('span', 'bench-time', time || 'Horário a confirmar'));
  const isNext = ev.id === lastNextId;
  if (isNext) when.append(el('span', 'next-label', 'a próxima'));
  visual.append(when);
  const spoken = `${formatLongDateRange(ev)}${year}${time || pending ? `, ${time || 'horário a confirmar'}` : ''}${ev.cancelled ? ', cancelada' : ''}${isNext ? ', a próxima atividade' : ''}.`;
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

  paintSector(bench, ev.sector);
  renderBenchDate(ev);
  $('bench-save').hidden = ev.cancelled || lastDayKey(ev) < todayKey;
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

// Mensagem or Panfleto. The activity's details (the facts and the description) sit above the tabs
// on both and don't depend on the tab.
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

// An activity opens at the panel's top, with its details in view.
function settleScroll() {
  $('bench-scroll').scrollTop = 0;
}

// A tab picked: the panel scrolls down until the chosen tab's content starts right under the
// stuck tab bar, and never up, so whoever is already down there stays put.
function revealPanel() {
  const scroll = $('bench-scroll');
  const bar = $('seg-bar');
  const panel = $(activePanel === 'flyer' ? 'panel-flyer' : 'panel-message');
  const panelTop = panel.getBoundingClientRect().top - scroll.getBoundingClientRect().top + scroll.scrollTop;
  // Where the stuck bar ends: its sticky top (-16px) from the scroller's padding edge, plus its height.
  const barEnd = parseFloat(getComputedStyle(scroll).paddingTop) + parseFloat(getComputedStyle(bar).top) + bar.offsetHeight;
  const target = Math.min(panelTop - barEnd, scroll.scrollHeight - scroll.clientHeight);
  if (target > scroll.scrollTop) scroll.scrollTo({ top: target, behavior: scrollBehavior() });
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
  const target = returnFocus && document.contains(returnFocus) ? returnFocus : document.querySelector(`.event-card[data-id="${state.selectedId}"] .event-open`);
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
  revealPanel();
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
$('save-pill').innerHTML = `${icon('calendar-plus')}<span>Salvar na minha agenda</span>`;
$('save-all').innerHTML = `${icon('calendar-sync')}<span class="save-all-long">Salvar tudo na agenda</span><span class="save-all-short" aria-hidden="true">Salvar tudo</span>`;
initSaveMenu();
$('save-pill').addEventListener('click', () => openSaveMenu({ ev: findEvent(state.selectedId) }, $('save-pill')));
$('save-all').addEventListener('click', () => openSaveMenu({ all: true }, $('save-all')));
addEventListener('hashchange', openFromAddress);
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
  // Escape inside the calendar options closes only them (the dialog handles it).
  if (e.key === 'Escape' && !e.target.closest?.('dialog[open]')) closeSheet();
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
