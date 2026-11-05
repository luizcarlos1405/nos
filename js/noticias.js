// Notícias (noticias.html): what the organizations are living, picked by the NOS team from their posts.
// The story the team leads with ("Destaque"), then the weeks; filters by organization and by kind; a
// story opens in the agenda's panel (a bottom sheet on phones, the column at right on the desk) with
// who lived it, the source post, its activity in the agenda when it has one, the story and the message
// for WhatsApp. The news is read a month at a time (NEWS_DIR, js/month-files.js): the last three
// months, then older ones on asking ("Ver notícias de agosto").

import { AGENDA_DIR } from './config.js';
import { addMonths, firstDay, folderPath, monthFile, monthOf } from './month-files.js';
import { buildEvents, capitalize, dateKey, formatDayMonth, formatLongDate, formatTimeRange, formatTinyDate, matchKey, monthName, orgFullName, weekdayName } from './events.js';
import { kindPlural, kindRank, newestFirst, newsDay, sourceHandle } from './news.js';
import { assignSectorColors, paintSector, sectorRank, sectorsOf } from './colors.js';
import { orgRow } from './agenda.js';
import { buildNewsMessage, previewHtml, whatsAppShareUrl } from './whatsapp.js';
import { icon } from './icons.js';
import { $, announce, copyText, el, escapeHtml, initPage, newsSource, readSheet, registerWorker, safeUrl, showNotice, showOffline } from './page.js';

// From this width the list and the panel sit side by side (as on the agenda; css/style.css agrees).
const desktop = window.matchMedia('(min-width: 1100px)');

let today = new Date();
let todayKey = dateKey(today);

const state = {
  news: [], // the window read so far, newest first
  kinds: new Set(), // matchKey of the chosen kinds; empty = every kind
  org: '', // matchKey of the chosen organization; '' = every organization
  selectedId: null,
};

const source = newsSource();
const collator = new Intl.Collator('pt-BR', { sensitivity: 'base', numeric: true });

// The page opens on the last three months (this one and the two before): sw.js saves them on the first
// visit. Older months come with "Ver notícias de …".
const openingDay = () => firstDay(addMonths(monthOf(todayKey), -2));

// ---------- Data ----------

// The agenda's activities the stories lead to ("Atividade" holds an activity's id, which starts with its
// day): their months' files are read, and every id found is linked. A month that can't be read leaves
// its stories without the link, quietly.
const activities = new Map();
const agendaMonths = new Set();
async function linkActivities(list) {
  const months = new Set(list.map((n) => /^ev-(\d{4}-\d{2})-\d{2}-/.exec(n.activity)?.[1]).filter(Boolean));
  await Promise.all([...months].filter((month) => !agendaMonths.has(month)).map(async (month) => {
    agendaMonths.add(month);
    try {
      const { headers, records, lines } = await readSheet(folderPath(AGENDA_DIR, monthFile(month)));
      for (const ev of buildEvents(headers, records, lines).events) activities.set(ev.id, ev);
    } catch (err) {
      agendaMonths.delete(month);
      console.warn('Agenda:', err);
    }
  }));
}

// Reads the news (and, with `again`, the window once more: a tab back after a long while, quietly).
async function load({ again = false } = {}) {
  try {
    if (again) await source.refresh(openingDay());
    else await source.open(openingDay());
    await linkActivities(source.events);
    useNews();
    return true;
  } catch (err) {
    console.error(err);
    if (!again) showNotice('<strong>Não foi possível carregar as notícias.</strong> Confira a conexão e recarregue a página.', 'error');
    return false;
  }
}

function useNews() {
  state.news = newestFirst(source.events);
  assignSectorColors(sectorsOf(state.news));
  renderSummary();
  $('notice').hidden = true;
  showProblems(source.problems());
  const savedAt = source.savedAt();
  if (savedAt) showOffline(savedAt, 'as notícias salvas');
}

const findNews = (id) => state.news.find((n) => n.id === id) || null;
const filtered = () => state.kinds.size > 0 || Boolean(state.org);
const matches = (n) => (!state.kinds.size || state.kinds.has(matchKey(n.kind))) && (!state.org || n.orgs.some((org) => matchKey(org) === state.org));
const visibleNews = () => state.news.filter(matches);
// The story the team leads with: the newest marked "Destaque" among those shown.
const leadOf = (list) => list.find((n) => n.lead) || null;

// "12 notícias · a mais recente de 28/10" (every story read, filters aside).
function renderSummary() {
  const n = state.news.length;
  $('page-sub').textContent = n ? `${n} ${n === 1 ? 'notícia' : 'notícias'} · a mais recente de ${formatDayMonth(state.news[0].date)}` : 'O que as organizações estão vivendo';
}

// Rows the site couldn't read (the pre-commit hook refuses them, so only from a file that skipped it).
function showProblems({ invalid, missing }) {
  if (!invalid.length && !missing.length) return;
  const items = [
    ...missing.map((r) => `<li>${escapeHtml(r.file)}: a primeira linha não tem ${r.columns.map((c) => `“${escapeHtml(c)}”`).join(' e ')}.</li>`),
    ...invalid.map((r) => `<li>${escapeHtml(r.file)}, linha ${r.line}: “${escapeHtml(r.title)}”, data “${escapeHtml(r.day)}”: falta o título ou a data completa (17/10/2026).</li>`),
  ].join('');
  const count = invalid.length + missing.length;
  showNotice(`<p><strong>${count === 1 ? '1 linha das notícias ficou de fora' : `${count} linhas das notícias ficaram de fora`}.</strong></p><details><summary>Ver as linhas para corrigir</summary><ul>${items}</ul></details>`);
}

// ---------- Focus across re-renders ----------

// As on the agenda: every rebuildable focusable node carries data-focus, and focus moves to its twin.
const FOCUS_FALLBACK = { 'news-more': 'chip:all', 'clear-filters': 'chip:all' };
const findFocus = (key) => document.querySelector(`[data-focus="${CSS.escape(key)}"]`);
function rerender(render) {
  const key = document.activeElement?.closest?.('[data-focus]')?.dataset.focus;
  render();
  if (!key || document.activeElement?.closest?.('[data-focus]')) return;
  (findFocus(key) || (FOCUS_FALLBACK[key] && findFocus(FOCUS_FALLBACK[key])))?.focus({ preventScroll: true });
}

function renderAll() {
  rerender(() => {
    renderFilters();
    renderList();
    renderBench();
  });
}

// ---------- Filters ----------

// Organizations grouped by the sector of the stories they lead (or, failing that, take part in).
function orgsBySector(list) {
  const sectorOf = new Map();
  const names = new Map();
  for (const n of list) {
    n.orgs.forEach((org, i) => {
      const key = matchKey(org);
      if (!names.has(key)) names.set(key, org);
      if (n.sector && (i === 0 || !sectorOf.has(key))) sectorOf.set(key, n.sector);
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

// The kinds of the stories read, in NEWS_KINDS' order (others after, by name).
function kindsOf(list) {
  const seen = new Map();
  for (const n of list) if (n.kind && !seen.has(matchKey(n.kind))) seen.set(matchKey(n.kind), n.kind);
  return [...seen.values()].sort((a, b) => kindRank(a) - kindRank(b) || collator.compare(a, b));
}

function renderFilters() {
  $('filters').hidden = state.news.length === 0;
  const select = $('org-select');
  select.replaceChildren(new Option('Todas as organizações', ''));
  for (const [sector, orgs] of orgsBySector(state.news)) {
    const group = document.createElement('optgroup');
    group.label = sector;
    for (const org of orgs) {
      const full = orgFullName(org);
      const option = new Option(full ? `${org} – ${full}` : org, matchKey(org));
      option.dataset.short = org;
      group.append(option);
    }
    select.append(group);
  }
  select.value = state.org;
  $('org-pill').classList.toggle('is-active', Boolean(state.org));
  $('org-label').textContent = state.org && select.selectedOptions[0] ? select.selectedOptions[0].dataset.short : 'Organização';

  const chips = $('kind-chips');
  chips.replaceChildren();
  const chip = (label, focusKey, active, onClick) => {
    const b = el('button', 'chip');
    b.type = 'button';
    b.dataset.focus = focusKey;
    b.setAttribute('aria-pressed', String(active));
    const check = el('span', 'chip-check');
    check.innerHTML = icon('check');
    b.append(check, document.createTextNode(label));
    b.addEventListener('click', onClick);
    return b;
  };
  chips.append(chip('Todas', 'chip:all', state.kinds.size === 0, () => {
    state.kinds.clear();
    refresh();
  }));
  for (const kind of kindsOf(state.news)) {
    const key = matchKey(kind);
    chips.append(chip(kindPlural(kind), `chip:${key}`, state.kinds.has(key), () => {
      if (state.kinds.has(key)) state.kinds.delete(key);
      else state.kinds.add(key);
      refresh();
    }));
  }
}

// How the empty state names the filters: "para o SIMTED", "com esses filtros".
function filterLabel() {
  const parts = [];
  if (state.org) parts.push($('org-select').selectedOptions[0]?.dataset.short || state.org);
  if (state.kinds.size) parts.push(kindsOf(state.news).filter((k) => state.kinds.has(matchKey(k))).map(kindPlural).join(', ').toLowerCase());
  if (parts.length !== 1) return 'com esses filtros';
  return state.org ? `de ${parts[0]}` : `entre ${parts[0]}`;
}

// Filters changed: the story open stays while it is still listed; on the desk the panel takes the
// lead (or the newest) of what is left.
function refresh() {
  if (state.selectedId && !matches(findNews(state.selectedId))) {
    state.selectedId = null;
    closeSheet();
  }
  if (!state.selectedId && desktop.matches) state.selectedId = (leadOf(visibleNews()) || visibleNews()[0])?.id ?? null;
  renderAll();
  const n = visibleNews().length;
  announce(filtered() ? `${n} ${n === 1 ? 'notícia' : 'notícias'}` : 'Mostrando todas as notícias');
}

// ---------- The list ----------

// "Esta semana", "Semana passada", then the month ("Outubro"; "Dezembro de 2025" in another year).
function weekLabel(date) {
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const sunday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
  if (day >= sunday) return 'Esta semana';
  if (day >= new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate() - 7)) return 'Semana passada';
  return `${capitalize(monthName(day.getMonth()))}${day.getFullYear() !== today.getFullYear() ? ` de ${day.getFullYear()}` : ''}`;
}

// "agosto", or "dezembro de 2025" in another year.
function monthLabel(month) {
  const [y, m] = month.split('-').map(Number);
  return `${monthName(m - 1)}${y !== today.getFullYear() ? ` de ${y}` : ''}`;
}

// The activity a story leads to, under its card: "Na agenda: sáb, 07/11" (a period: "até dom, 08/11").
function agendaPill(ev) {
  const link = el('a', 'news-agenda');
  link.href = `agenda.html#${encodeURIComponent(ev.id)}`;
  link.innerHTML = icon('calendar-days');
  link.append(el('span', null, `Na agenda: ${ev.endDate ? `até ${formatTinyDate(ev.endDate)}` : formatTinyDate(ev.date)}`));
  link.setAttribute('aria-label', `Na agenda: ${ev.title}, ${ev.endDate ? `até ${formatTinyDate(ev.endDate)}` : formatTinyDate(ev.date)}`);
  return link;
}

function renderCard(n, isLead) {
  const card = el('article', `news-card${isLead ? ' is-lead' : ''}`);
  card.dataset.id = n.id;
  paintSector(card, n.sector);
  const selected = n.id === state.selectedId && desktop.matches;
  if (selected) card.classList.add('is-selected');

  const head = el('div', 'news-head');
  const h = el('h3', 'news-h');
  const open = el('button', 'news-open');
  open.type = 'button';
  open.dataset.focus = `news:${n.id}`;
  if (selected) open.setAttribute('aria-current', 'true');
  open.append(el('span', 'news-title', n.title));
  h.append(open);
  const share = el('span', 'share-circle');
  share.setAttribute('aria-hidden', 'true');
  share.innerHTML = icon('share');
  head.append(h, share);
  card.append(head);

  // What the button reads after the headline: the summary, who, the kind and the day.
  const described = [];
  if (n.summary) {
    const dek = el('p', 'news-dek', n.summary);
    dek.id = `dek-${n.id}`;
    described.push(dek.id);
    card.append(dek);
  }
  if (n.org) {
    const org = orgRow(n);
    org.id = `org-${n.id}`;
    described.push(org.id);
    card.append(org);
  }
  const foot = el('p', 'news-foot');
  foot.id = `foot-${n.id}`;
  described.push(foot.id);
  if (n.kind) foot.append(el('span', 'tag', n.kind));
  const time = el('time', null, newsDay(n.date));
  time.dateTime = n.dateKey;
  foot.append(time);
  card.append(foot);
  open.setAttribute('aria-describedby', described.join(' '));

  const ev = activities.get(n.activity);
  if (ev) card.append(agendaPill(ev));
  open.addEventListener('click', () => select(n, { trigger: open }));
  return card;
}

const cardList = (items, lead) => {
  const list = el('ul', 'cards');
  for (const n of items) {
    const item = el('li');
    item.append(renderCard(n, n === lead));
    list.append(item);
  }
  return list;
};

// The month before the ones read: "Ver notícias de agosto", "Carregando…", or a failure to try again.
let olderState = null; // null | 'loading' | 'failed'
function renderOlder(month) {
  const button = el('button', 'past-toggle news-more');
  button.type = 'button';
  button.dataset.focus = 'news-more';
  const label = monthLabel(month);
  if (olderState === 'loading') {
    button.setAttribute('aria-disabled', 'true');
    button.innerHTML = `${icon('history')}<span>Carregando as notícias de ${label}…</span>`;
  } else if (olderState === 'failed') {
    button.innerHTML = `${icon('alert')}<span>Não deu para carregar ${label}. Tentar de novo</span>`;
  } else {
    button.innerHTML = `${icon('history')}<span>Ver notícias de ${label}</span>`;
  }
  button.addEventListener('click', () => {
    if (olderState !== 'loading') loadOlder();
  });
  return button;
}

function renderList() {
  const container = $('lista');
  const older = source.since ? source.older() : null;
  if (!state.news.length) {
    container.replaceChildren(el('p', 'placeholder', $('notice').hidden ? 'Nenhuma notícia por enquanto.' : ''));
    if (older) container.append(renderOlder(older));
    return;
  }
  const list = visibleNews();
  const lead = leadOf(list);
  const wrap = el('div', 'news-list');
  wrap.append(el('h2', 'sr-only', 'Lista de notícias'));

  if (!list.length) {
    const box = el('section', 'empty-state');
    box.insertAdjacentHTML('beforeend', icon('search-x', 'icon empty-icon'));
    box.append(el('p', 'empty-title', `Nenhuma notícia ${filterLabel()}`));
    if (older) box.append(el('p', 'empty-hint', `Há notícias mais antigas, de ${monthLabel(older)} para trás.`));
    const actions = el('div', 'empty-actions');
    const clear = el('button', 'btn btn-line', 'Ver todas as notícias');
    clear.type = 'button';
    clear.dataset.focus = 'clear-filters';
    clear.addEventListener('click', () => {
      state.kinds.clear();
      state.org = '';
      refresh();
    });
    actions.append(clear);
    box.append(actions);
    wrap.append(box);
  } else {
    if (lead) {
      const section = el('section', 'news-lead');
      const heading = el('h2', 'sr-only', 'Em destaque');
      heading.id = 'lead-head';
      section.setAttribute('aria-labelledby', 'lead-head');
      section.append(heading, cardList([lead], lead));
      wrap.append(section);
    }
    const weeks = [];
    for (const n of list) {
      if (n === lead) continue;
      const label = weekLabel(n.date);
      if (!weeks.length || weeks[weeks.length - 1][0] !== label) weeks.push([label, []]);
      weeks[weeks.length - 1][1].push(n);
    }
    for (const [label, items] of weeks) {
      const section = el('section', 'news-week');
      const head = el('h2', 'news-week-head');
      head.append(el('span', 'news-week-name', label), el('span', 'news-week-count', `${items.length} ${items.length === 1 ? 'notícia' : 'notícias'}`));
      section.append(head, cardList(items, null));
      wrap.append(section);
    }
  }
  if (older) wrap.append(renderOlder(older));
  container.replaceChildren(wrap);
}

// "Ver notícias de agosto": the month before the window, added at the end of the list.
async function loadOlder() {
  const month = source.older();
  if (!month) return;
  const before = state.news.length;
  const job = source.extend(firstDay(month));
  if (job) {
    olderState = 'loading';
    rerender(renderList);
    try {
      await job;
    } catch (err) {
      console.error(err);
      olderState = 'failed';
      rerender(renderList);
      announce(`Não foi possível carregar as notícias de ${monthLabel(month)}. Confira a conexão.`);
      return;
    }
  }
  olderState = null;
  await linkActivities(source.events);
  useNews();
  renderAll();
  const added = state.news.length - before;
  announce(added ? `${added} ${added === 1 ? 'notícia' : 'notícias'} de ${monthLabel(month)}` : `Nenhuma notícia em ${monthLabel(month)}`);
}

// ---------- The panel ----------

// One row of the facts. `marker` is an icon name, or 'sector' for the group's dot.
function fact(marker, content, label, className = '') {
  const row = el('div', `fact ${className}`.trim());
  const dt = el('dt');
  dt.innerHTML = `${marker === 'sector' ? '<span class="dot"></span>' : icon(marker)}<span class="sr-only">${label}</span>`;
  const dd = el('dd');
  dd.append(...[content].flat());
  row.append(dt, dd);
  return row;
}

function factLink(href, text, sub, { external = false } = {}) {
  const link = el('a', 'fact-link', text);
  link.href = href;
  if (external) {
    link.target = '_blank';
    link.rel = 'noopener';
  }
  return sub ? [link, el('span', 'fact-sub', sub)] : [link];
}

// "Quarta, 28 de outubro" (and the year when it isn't this one).
const longDay = (date) => `${formatLongDate(date).replace('-feira', '')}${date.getFullYear() !== today.getFullYear() ? ` de ${date.getFullYear()}` : ''}`;

function renderBench() {
  const n = findNews(state.selectedId);
  const bench = $('bench');
  $('bench-empty').hidden = Boolean(n);
  $('bench-body').hidden = !n;
  if (!n) {
    bench.removeAttribute('aria-labelledby');
    bench.setAttribute('aria-label', 'Notícia');
    return;
  }
  bench.removeAttribute('aria-label');
  bench.setAttribute('aria-labelledby', 'story-title');
  paintSector(bench, n.sector);

  const box = $('bench-date');
  const visual = el('span', 'bench-date-visual');
  visual.setAttribute('aria-hidden', 'true');
  visual.append(el('span', 'bench-day', longDay(n.date)));
  if (n.kind) {
    const kind = el('span', 'story-kind');
    kind.append(el('span', 'tag', n.kind));
    visual.append(kind);
  }
  box.replaceChildren(visual, el('span', 'sr-only', `${n.kind ? `${n.kind}, de ` : ''}${weekdayName(n.date)}, ${n.date.getDate()} de ${monthName(n.date.getMonth())}.`));

  $('story-title').textContent = n.title;
  $('story-lead').textContent = n.summary;
  $('story-lead').hidden = !n.summary;

  const facts = $('story-facts');
  facts.replaceChildren();
  if (n.org) {
    const org = el('span', 'fact-org');
    org.append(el('span', 'fact-org-name', n.org));
    if (n.sector) org.append(el('span', 'fact-muted', ` · ${n.sector}`));
    const known = n.orgs.map((name) => [name, orgFullName(name)]).filter(([, full]) => full);
    if (known.length) org.append(el('span', 'fact-org-full', known.map(([name, full]) => (n.orgs.length > 1 ? `${name}: ${full}` : full)).join('; ')));
    facts.append(fact(n.sector ? 'sector' : 'users', org, 'Organização', 'is-org'));
  }
  const sourceUrl = safeUrl(n.source);
  if (n.source) {
    const instagram = /instagram\.com/i.test(n.source);
    const sub = sourceHandle(n.source) || (sourceUrl ? new URL(sourceUrl).hostname.replace(/^www\./, '') : '');
    facts.append(fact(instagram ? 'instagram' : 'link', sourceUrl ? factLink(sourceUrl, instagram ? 'Ver o post de origem' : 'Ver a fonte', sub, { external: true }) : n.source, 'Fonte'));
  }
  const ev = activities.get(n.activity);
  if (ev) {
    const when = [ev.endDate ? `até ${formatTinyDate(ev.endDate)}` : formatTinyDate(ev.date), formatTimeRange(ev), ev.local].filter(Boolean).join(', ');
    facts.append(fact('calendar-days', factLink(`agenda.html#${encodeURIComponent(ev.id)}`, `Na agenda: ${ev.title}`, when), 'Na agenda'));
  }

  const body = $('story-body');
  body.replaceChildren(...n.paragraphs.map((p) => el('p', null, p)));
  body.hidden = !n.paragraphs.length;

  const message = buildNewsMessage(n);
  $('bubble').innerHTML = previewHtml(message);
  $('wa-link').href = whatsAppShareUrl(message);
}

function select(n, { trigger } = {}) {
  if (n.id !== state.selectedId) settleCopy();
  state.selectedId = n.id;
  rerender(() => {
    renderList();
    renderBench();
  });
  $('bench-scroll').scrollTop = 0;
  if (!desktop.matches) openSheet(trigger);
}

// ---------- Bottom sheet (phones) ----------
// As the agenda's (js/app.js): while open it is a modal dialog, the page behind inert, and the
// phone's Back button closes it (the sheet adds a history entry; ×, the backdrop and Escape go back
// through it); it can be dragged down by its head.

let sheetOpen = false;
let sheetInHistory = false;
let returnFocus = null;

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
  setModal(true);
  sheetOpen = true;
  if (!sheetInHistory) {
    history.pushState({ nosSheet: true }, '');
    sheetInHistory = true;
  }
  requestAnimationFrame(() => {
    $('bench').classList.add('is-open');
    $('bench').focus({ preventScroll: true });
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
  const target = returnFocus && document.contains(returnFocus) ? returnFocus : findFocus(`news:${state.selectedId}`);
  target?.focus({ preventScroll: true });
}

window.addEventListener('popstate', () => {
  sheetInHistory = false;
  hideSheet();
});

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

function setButton(button, iconName, label) {
  button.innerHTML = `${icon(iconName)}<span>${label}</span>`;
  button.setAttribute('aria-label', label);
}
const resetCopy = () => setButton($('copy-btn'), 'copy', 'Copiar texto');
function settleCopy() {
  const button = $('copy-btn');
  if (!button.classList.contains('is-done')) return;
  clearTimeout(button._timer);
  button.classList.remove('is-done');
  resetCopy();
}

// ---------- The address ----------

// noticias.html#nt-2026-10-28-…: that story opens (filters cleared when they hide it). One from before
// the window has its month read first: its id starts with its day.
async function openFromAddress() {
  const target = decodeURIComponent(location.hash.slice(1));
  if (!target.startsWith('nt-')) return;
  let n = findNews(target);
  const day = /^nt-(\d{4}-\d{2}-\d{2})-/.exec(target)?.[1];
  if (!n && day && source.since && day < source.since && source.has(monthOf(day))) {
    try {
      await source.extend(firstDay(monthOf(day)));
    } catch (err) {
      console.error(err);
      showNotice('<strong>Não foi possível abrir a notícia do link.</strong> Confira a conexão e recarregue a página.');
      return;
    }
    await linkActivities(source.events);
    useNews();
    n = findNews(target);
  }
  if (!n) return;
  if (!matches(n)) {
    state.kinds.clear();
    state.org = '';
  }
  renderFilters();
  select(n);
  document.querySelector(`.news-card[data-id="${CSS.escape(n.id)}"]`)?.scrollIntoView({ block: 'center' });
}

// ---------- Wiring ----------

async function start() {
  // Reloaded with the sheet open: drop its history entry, or the first Back would do nothing.
  if (history.state?.nosSheet) history.back();
  await load();
  if (desktop.matches) state.selectedId = (leadOf(state.news) || state.news[0])?.id ?? null;
  renderAll();
  openFromAddress();
}

initPage('Notícias');
$('bench-close').innerHTML = icon('close');
setButton($('wa-link'), 'message', 'Enviar no WhatsApp');
resetCopy();

$('org-select').addEventListener('change', (e) => {
  state.org = e.target.value;
  refresh();
});
$('filters').addEventListener('focusin', (e) => {
  if (e.target.closest('.chip, .org-pill')) e.target.scrollIntoView({ block: 'nearest', inline: 'nearest' });
});
$('copy-btn').addEventListener('click', async () => {
  const n = findNews(state.selectedId);
  if (!n) return;
  const copied = await copyText(buildNewsMessage(n));
  const button = $('copy-btn');
  button.focus({ preventScroll: true });
  setButton(button, copied ? 'check' : 'alert', copied ? 'Copiado' : 'Não deu certo, tente de novo');
  button.classList.add('is-done');
  clearTimeout(button._timer);
  button._timer = setTimeout(() => {
    button.classList.remove('is-done');
    resetCopy();
  }, 2000);
});
$('bench-close').addEventListener('click', closeSheet);
$('sheet-backdrop').addEventListener('click', closeSheet);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeSheet();
});
addEventListener('hashchange', openFromAddress);
wireSheetDrag();
desktop.addEventListener('change', () => {
  if (desktop.matches) {
    closeSheet();
    if (!state.selectedId) state.selectedId = (leadOf(visibleNews()) || visibleNews()[0])?.id ?? null;
  }
  rerender(() => {
    renderList();
    renderBench();
  });
});

// The weeks follow the clock: "Esta semana" moves on Sunday. After a long absence the news is read again.
let hiddenAt = null;
function tick() {
  const now = new Date();
  const dayChanged = dateKey(now) !== todayKey;
  today = now;
  todayKey = dateKey(now);
  if (dayChanged && state.news.length) rerender(renderList);
}
setInterval(() => {
  if (!document.hidden) tick();
}, 60_000);
document.addEventListener('visibilitychange', async () => {
  if (document.hidden) {
    hiddenAt = Date.now();
    return;
  }
  if (hiddenAt && Date.now() - hiddenAt > 30 * 60_000 && (await load({ again: true }))) {
    if (state.selectedId && !findNews(state.selectedId)) {
      state.selectedId = null;
      closeSheet();
    }
    if (!state.selectedId && desktop.matches) state.selectedId = (leadOf(visibleNews()) || visibleNews()[0])?.id ?? null;
    renderAll();
  }
  tick();
  hiddenAt = null;
});

if (location.protocol !== 'file:') start();
registerWorker();
