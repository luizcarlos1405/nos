// Editais (editais.html): calls, prizes and grants with money for culture, sport and leisure, a tab of
// its own since 2026-11-22 (until then it hung from the Notícias tab). The open calls by deadline, the
// ones opening soon, the ones closed lately with their results, and the announced ones without a date
// yet (js/calls.js), with a chip per area. A call opens in the news' panel (a bottom sheet
// on phones, the column at right on the desk) with its essentials, its links and the message for
// WhatsApp; its share circle opens the panel straight at the message. The calls are one file,
// CALLS_CSV_URL, read whole: they are few.

import { AGENDA_DIR, CALL_AREAS, CALLS_CSV_URL, CALLS_SUGGEST_URL } from './config.js';
import { folderPath, monthFile } from './month-files.js';
import { buildEvents, capitalize, formatDayMonth, matchKey, monthName, orgFullName, weekdayName } from './events.js';
import { areaRank, buildCalls, callStatus, douradosNow, groupCalls, hourText, leftText, reachLabel, resultText, tinyDay } from './calls.js';
import { assignSectorColors, paintSector, sectorsOf } from './colors.js';
import { buildCallMessage, previewHtml, whatsAppShareUrl } from './whatsapp.js';
import { icon } from './icons.js';
import { $, addressTarget, announce, copyText, el, escapeHtml, initPage, readSheet, registerWorker, safeUrl, showNotice, showOffline } from './page.js';

// From this width the list and the panel sit side by side (as on Notícias; css/style.css agrees).
const desktop = window.matchMedia('(min-width: 1100px)');

const state = {
  calls: [], // every call of the file, in its order
  area: '', // matchKey of the chosen area; '' = every area
  selectedId: null,
  loaded: false, // the sheet was read: until then (or when it can't be) the page lists nothing
};

const collator = new Intl.Collator('pt-BR', { sensitivity: 'base', numeric: true });

// ---------- Data ----------

// The agenda's activities the calls lead to ("Atividade" holds an activity's id, the deadline as an
// agenda row: ev-2026-11-10-…): their months' files are read, and every visible one found is linked.
const activities = new Map();
const agendaMonths = new Set();
async function linkActivities(list) {
  const months = new Set(list.map((c) => /^ev-(\d{4}-\d{2})-\d{2}-/.exec(c.activity)?.[1]).filter(Boolean));
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

// Reads the calls (and, with `again`, once more: a tab back after a long while, quietly).
async function load({ again = false } = {}) {
  try {
    const { headers, records, lines, unclosed, savedAt } = await readSheet(CALLS_CSV_URL);
    const { calls, invalid, warnings, missing } = buildCalls(headers, records, lines);
    if (missing.length) {
      showNotice(`<strong>A planilha dos editais não tem ${missing.map((c) => `a coluna “${escapeHtml(c)}”`).join(' nem ')}.</strong> Confira a primeira linha de <code>${escapeHtml(CALLS_CSV_URL)}</code>.`, 'error');
      return false;
    }
    state.calls = calls;
    state.loaded = true;
    assignSectorColors(sectorsOf(calls));
    $('notice').hidden = true;
    showProblems(invalid, warnings, unclosed);
    if (savedAt) showOffline(savedAt, 'os editais salvos');
    await linkActivities(calls);
    return true;
  } catch (err) {
    console.error(err);
    if (!again) showNotice('<strong>Não foi possível carregar os editais.</strong> Confira a conexão e recarregue a página.', 'error');
    return false;
  }
}

// Rows the page couldn't read (no title, or a date it can't parse), rows it shows with something left
// out (a closing hour it can't read), and a quoted cell that never closes (the rows after it are lost).
function showProblems(invalid, warnings = [], unclosed = null) {
  if (!invalid.length && !warnings.length && !unclosed) return;
  const items = [
    ...(unclosed ? [`<li>Linha ${unclosed}: uma célula abre aspas (") e não fecha, então as linhas depois dela foram lidas como parte dessa célula. Feche com " (não com ”).</li>`] : []),
    ...invalid.map((r) => `<li>Linha ${r.line}: “${escapeHtml(r.title)}”: ${escapeHtml(r.problem)} (as datas como 23/11/2026). Esta linha ficou de fora.</li>`),
    ...warnings.map((r) => `<li>Linha ${r.line}: “${escapeHtml(r.title)}”: ${escapeHtml(r.problem)}.</li>`),
  ].join('');
  const count = invalid.length + warnings.length + (unclosed ? 1 : 0);
  showNotice(`<p><strong>${count === 1 ? '1 linha dos editais precisa de correção' : `${count} linhas dos editais precisam de correção`}.</strong></p><details><summary>Ver as linhas para corrigir</summary><ul>${items}</ul></details>`);
}

const findCall = (id) => state.calls.find((c) => c.id === id) || null;
const matches = (c) => !state.area || matchKey(c.area) === state.area;
// The calls the page shows now, by where they stand (a call closed longer ago is left out).
const shown = (now = douradosNow()) => groupCalls(state.calls.filter(matches), now);
const flat = (groups) => [...groups.open, ...groups.soon, ...groups.closed, ...groups.coming];
const firstShown = () => flat(shown())[0] || null;

// ---------- Focus across re-renders ----------

// As on Notícias: every rebuildable focusable node carries data-focus, and focus moves to its twin.
const FOCUS_FALLBACK = { 'clear-filters': 'chip:all' };
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

// Every area of CALL_AREAS, so a person looking for sport learns there is none open, then the others
// the sheet uses.
function areas() {
  const seen = new Map(CALL_AREAS.map((a) => [matchKey(a), a]));
  for (const c of state.calls) if (c.area && !seen.has(matchKey(c.area))) seen.set(matchKey(c.area), c.area);
  return [...seen.values()].sort((a, b) => areaRank(a) - areaRank(b) || collator.compare(a, b));
}

function renderFilters() {
  const chips = $('area-chips');
  chips.replaceChildren();
  const chip = (label, key) => {
    const b = el('button', 'chip');
    b.type = 'button';
    b.dataset.focus = `chip:${key || 'all'}`;
    b.setAttribute('aria-pressed', String(state.area === key));
    const check = el('span', 'chip-check');
    check.innerHTML = icon('check');
    b.append(check, document.createTextNode(label));
    b.addEventListener('click', () => {
      state.area = key;
      refresh();
    });
    return b;
  };
  chips.append(chip('Todos', ''));
  for (const area of areas()) chips.append(chip(area, matchKey(area)));
}

// Filters changed: the call open stays while it is still listed; on the desk the panel takes the first
// of what is left.
function refresh() {
  const listed = new Set(flat(shown()).map((c) => c.id));
  if (state.selectedId && !listed.has(state.selectedId)) {
    state.selectedId = null;
    closeSheet();
  }
  if (!state.selectedId && desktop.matches) state.selectedId = firstShown()?.id ?? null;
  renderAll();
  const n = shown().open.length;
  announce(state.area ? `${n} ${n === 1 ? 'edital aberto' : 'editais abertos'}` : 'Mostrando todos os editais');
}

// ---------- The list ----------

const timeEl = (date, text, className) => {
  const time = el('time', className, text);
  time.dateTime = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  return time;
};

// The line the card starts with, by where the call stands: "Inscrições até seg, 23/11 · faltam 5 dias",
// "Abre em seg, 01/12", "Fechou em dom, 08/11", "Ainda sem data".
function dueLine(call, status, now) {
  const due = el('p', 'call-due');
  if (status === 'open') {
    due.append(el('span', 'call-due-label', 'Inscrições até'), timeEl(call.until, tinyDay(call.until), 'call-date'), el('span', 'call-left', leftText(call, now)));
    const hour = hourText(call);
    if (hour) due.append(el('span', 'call-hour', hour));
  } else if (status === 'soon') {
    due.append(el('span', 'call-due-label', 'Abre em'), timeEl(call.from, tinyDay(call.from), 'call-date'), el('span', 'call-hour', `Inscrições até ${tinyDay(call.until)}${hourText(call) ? `, ${hourText(call)}` : ''}`));
  } else if (status === 'closed') {
    due.append(el('span', 'call-due-label', 'Fechou em'), timeEl(call.until, tinyDay(call.until), 'call-date'));
  } else {
    due.append(el('span', 'call-date', 'Ainda sem data'));
  }
  return due;
}

// Who runs it: the organization's dot when NOS follows it (its "Setor"), a public building otherwise.
function orgMeta(call) {
  const meta = el('span', 'meta meta-org');
  meta.innerHTML = call.sector ? '<span class="dot"></span>' : icon('landmark');
  const text = el('span', 'meta-text');
  text.append(el('b', null, call.org));
  const full = orgFullName(call.org) || call.body;
  if (full) text.append(document.createTextNode(` · ${full}`));
  if (call.sector) text.append(el('span', 'sr-only', ` (${call.sector})`));
  meta.append(text);
  return meta;
}

function linkButton(href, iconName, label) {
  const link = el('a', 'btn btn-line');
  link.href = href;
  link.target = '_blank';
  link.rel = 'noopener';
  link.innerHTML = `${icon(iconName)}<span>${escapeHtml(label)}</span><span class="sr-only"> (abre em outra aba)</span>`;
  return link;
}

function renderCard(call, status, now) {
  const kind = status === 'closed' ? ' is-closed' : status === 'open' ? '' : ' is-coming';
  const card = el('article', `news-card call-card${kind}`);
  card.dataset.id = call.id;
  paintSector(card, call.sector);
  if (call.id === state.selectedId && desktop.matches) card.classList.add('is-selected');
  const described = [];
  const ids = (node, name) => {
    node.id = `${name}-${call.id}`;
    described.push(node.id);
    return node;
  };

  card.append(ids(dueLine(call, status, now), 'due'));

  const head = el('div', 'news-head');
  const h = el('h3', 'news-h');
  const open = el('button', 'news-open');
  open.type = 'button';
  open.dataset.focus = `call:${call.id}`;
  if (call.id === state.selectedId) open.setAttribute('aria-current', 'true');
  open.append(el('span', 'news-title', call.title));
  h.append(open);
  // The share circle is a button of its own: it opens the call straight at its message.
  const share = el('button', 'share-circle');
  share.type = 'button';
  share.dataset.focus = `share:${call.id}`;
  share.setAttribute('aria-label', `Compartilhar no WhatsApp: ${call.title}`);
  share.setAttribute('aria-haspopup', 'dialog');
  share.innerHTML = icon('share');
  head.append(h, share);
  card.append(head);

  if (status === 'open' || status === 'soon') {
    const facts = el('dl', 'call-facts');
    const fact = (iconName, label, text) => {
      const row = el('div', 'call-fact');
      const dt = el('dt');
      dt.innerHTML = `${icon(iconName)}<span class="sr-only">${label}</span>`;
      row.append(dt, el('dd', null, text));
      facts.append(row);
    };
    if (call.value) fact('banknote', 'Valor', call.value);
    if (call.who) fact('users', 'Quem pode', call.who);
    if (facts.children.length) card.append(ids(facts, 'facts'));
  } else if (status === 'closed') {
    const result = resultText(call, now);
    if (result) card.append(ids(el('p', 'call-result', result), 'result'));
  } else if (call.summary) {
    card.append(ids(el('p', 'news-dek', call.summary), 'dek'));
  }
  if (call.org) card.append(ids(orgMeta(call), 'org'));

  const foot = el('p', 'news-foot');
  if (call.area) foot.append(el('span', 'tag', call.area));
  if (reachLabel(call)) foot.append(el('span', 'tag', reachLabel(call)));
  if (call.program) foot.append(el('span', null, call.program));
  if (foot.children.length) card.append(ids(foot, 'foot'));

  if (status === 'open' || status === 'soon') {
    const links = el('div', 'call-links');
    const edital = safeUrl(call.call);
    const page = safeUrl(call.page);
    if (edital) links.append(linkButton(edital, 'file-text', 'Ler o edital'));
    if (page) links.append(linkButton(page, 'external', 'Página oficial'));
    if (links.children.length) card.append(links);
  } else if (status === 'closed' && safeUrl(call.result)) {
    const link = el('a', 'news-agenda');
    link.href = safeUrl(call.result);
    link.target = '_blank';
    link.rel = 'noopener';
    link.innerHTML = `${icon('external')}<span>Ver o resultado</span><span class="sr-only"> (abre em outra aba)</span>`;
    card.append(link);
  }

  open.setAttribute('aria-describedby', described.join(' '));
  open.addEventListener('click', () => select(call, { trigger: open }));
  share.addEventListener('click', () => select(call, { trigger: share, toMessage: true }));
  return card;
}

function section(name, items, status, now, emptyText = '') {
  const box = el('section', 'news-week');
  const headId = `h-${status}`;
  box.setAttribute('aria-labelledby', headId);
  const head = el('h2', 'news-week-head');
  head.id = headId;
  head.append(el('span', 'news-week-name', name));
  if (items.length) head.append(el('span', 'news-week-count', `${items.length} ${items.length === 1 ? 'edital' : 'editais'}`));
  box.append(head);
  if (!items.length) {
    box.append(el('p', 'empty-card', emptyText));
    return box;
  }
  const list = el('ul', 'cards');
  for (const call of items) {
    const item = el('li');
    item.append(renderCard(call, status, now));
    list.append(item);
  }
  box.append(list);
  return box;
}

const areaName = () => areas().find((a) => matchKey(a) === state.area) || '';

function renderList() {
  const container = $('lista');
  $('filters').hidden = !state.loaded;
  if (!state.loaded) {
    container.replaceChildren();
    return;
  }
  const now = douradosNow();
  const groups = shown(now);
  const wrap = el('div', 'calls');
  wrap.append(el('h2', 'sr-only', 'Lista de editais'));

  if (!flat(groups).length) {
    const box = el('section', 'empty-state');
    box.insertAdjacentHTML('beforeend', icon('search-x', 'icon empty-icon'));
    box.append(el('p', 'empty-title', state.area ? `Nenhum edital de ${areaName().toLowerCase()} aberto agora` : 'Nenhum edital aberto agora'));
    box.append(el('p', 'empty-hint', 'Quando abrir um, ele aparece aqui.'));
    if (state.area) {
      const actions = el('div', 'empty-actions');
      const clear = el('button', 'btn btn-line', 'Ver todos os editais');
      clear.type = 'button';
      clear.dataset.focus = 'clear-filters';
      clear.addEventListener('click', () => {
        state.area = '';
        refresh();
      });
      actions.append(clear);
      box.append(actions);
    }
    wrap.append(box);
  } else {
    wrap.append(section('Inscrições abertas', groups.open, 'open', now, 'Nenhum edital com inscrições abertas agora.'));
    if (groups.soon.length) wrap.append(section('Abrem em breve', groups.soon, 'soon', now));
    if (groups.closed.length) wrap.append(section('Fecharam há pouco', groups.closed, 'closed', now));
    if (groups.coming.length) wrap.append(section('Em preparação', groups.coming, 'coming', now));
  }

  // Under the list: the invitation to send a call that is missing (when CALLS_SUGGEST_URL has a link),
  // and what the summary is worth.
  const notes = el('div', 'call-notes');
  const suggest = safeUrl(CALLS_SUGGEST_URL);
  if (suggest) {
    const p = el('p', null, 'Sabe de um edital de cultura, esporte ou lazer que não está aqui? ');
    const link = el('a', null, 'Mande para o NOS');
    link.href = suggest;
    link.target = '_blank';
    link.rel = 'noopener';
    p.append(link, document.createTextNode('.'));
    notes.append(p);
  }
  notes.append(el('p', null, 'O NOS resume o essencial de cada edital. Antes de se inscrever, leia o edital: é ele que vale.'));
  wrap.append(notes);
  container.replaceChildren(wrap);
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

function factLink(href, text, sub) {
  const link = el('a', 'fact-link', text);
  link.href = href;
  if (/^https?:/i.test(href)) {
    link.target = '_blank';
    link.rel = 'noopener';
    link.append(el('span', 'sr-only', ' (abre em outra aba)'));
  }
  return sub ? [link, el('span', 'fact-sub', sub)] : [link];
}

const plain = (text, sub) => {
  const span = el('span', 'fact-plain', text);
  return sub ? [span, el('span', 'fact-sub', sub)] : [span];
};
const host = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
};
// "Segunda, 23 de novembro" (and the year when it isn't this one).
const longDate = (date, now) => `${capitalize(weekdayName(date).replace('-feira', ''))}, ${date.getDate()} de ${monthName(date.getMonth())}${date.getFullYear() !== now.getFullYear() ? ` de ${date.getFullYear()}` : ''}`;

function benchDay(call, status) {
  if (status === 'open') return `Inscrições até ${tinyDay(call.until)}`;
  if (status === 'soon') return `Abre em ${tinyDay(call.from)}`;
  if (status === 'closed') return `Fechou em ${tinyDay(call.until)}`;
  return 'Ainda sem data';
}

function renderBench() {
  const call = findCall(state.selectedId);
  const bench = $('bench');
  $('bench-empty').hidden = Boolean(call);
  $('bench-body').hidden = !call;
  if (!call) {
    bench.removeAttribute('aria-labelledby');
    bench.setAttribute('aria-label', 'Edital');
    return;
  }
  const now = douradosNow();
  const status = callStatus(call, now) || 'closed';
  bench.removeAttribute('aria-label');
  bench.setAttribute('aria-labelledby', 'story-title');
  paintSector(bench, call.sector);

  const tags = [call.area, reachLabel(call)].filter(Boolean);
  const visual = el('span', 'bench-date-visual');
  visual.setAttribute('aria-hidden', 'true');
  visual.append(el('span', 'bench-day', benchDay(call, status)));
  if (tags.length) {
    const kinds = el('span', 'story-kind');
    for (const tag of tags) kinds.append(el('span', 'tag', tag));
    visual.append(kinds);
  }
  const spoken = { open: `Inscrições até ${longDate(call.until, now)}`, soon: `Inscrições a partir de ${longDate(call.from || call.until, now)}`, closed: `As inscrições fecharam em ${longDate(call.until, now)}`, coming: 'Ainda sem data' }[status];
  $('bench-date').replaceChildren(visual, el('span', 'sr-only', `${tags.length ? `${tags.join(', ')}. ` : ''}${spoken}.`));

  $('story-title').textContent = call.title;
  const lead = status === 'closed' ? '' : call.summary;
  $('story-lead').textContent = lead;
  $('story-lead').hidden = !lead;

  const facts = $('story-facts');
  facts.replaceChildren();
  if (call.org) {
    const org = el('span', 'fact-org');
    org.append(el('span', 'fact-org-name', [call.org, call.body].filter(Boolean).join(', ')));
    if (call.sector) org.append(el('span', 'fact-muted', ` · ${call.sector}`));
    const full = [orgFullName(call.org), call.program, call.official].filter(Boolean).join(', ');
    if (full) org.append(el('span', 'fact-org-full', full));
    facts.append(fact(call.sector ? 'sector' : 'landmark', org, 'Quem faz', 'is-org'));
  }
  const hour = hourText(call);
  if (hour && (status === 'open' || status === 'soon')) facts.append(fact('clock', plain(capitalize(hour), `no último dia, ${tinyDay(call.until)}`), 'Até que horas'));
  if (call.value) facts.append(fact('banknote', plain(call.value), 'Valor'));
  if (call.who && status !== 'closed') facts.append(fact('users', plain(call.who), 'Quem pode'));
  if (status === 'closed') {
    const result = resultText(call, now);
    const resultUrl = safeUrl(call.result);
    if (resultUrl) facts.append(fact('file-text', factLink(resultUrl, 'Ver o resultado', result), 'Resultado'));
    else if (result) facts.append(fact('file-text', plain(result), 'Resultado'));
  }
  const edital = safeUrl(call.call);
  if (edital && status !== 'closed') facts.append(fact('file-text', factLink(edital, 'Ler o edital', host(edital)), 'Edital'));
  const page = safeUrl(call.page);
  if (page) facts.append(fact('external', factLink(page, 'Página oficial', host(page)), 'Página oficial'));
  const ev = activities.get(call.activity);
  if (ev && status !== 'closed') facts.append(fact('calendar-days', factLink(`agenda#${encodeURIComponent(ev.id)}`, 'O prazo na agenda', tinyDay(ev.endDate || ev.date)), 'Na agenda'));
  if (call.checked) facts.append(fact('check', plain(`Conferido pelo NOS em ${formatDayMonth(call.checked)}`, call.source), 'Conferido'));

  const message = buildCallMessage(call, status, now);
  $('bubble').innerHTML = previewHtml(message);
  $('wa-link').href = whatsAppShareUrl(message);
}

// The panel at its top, or at the message (the share circle: what it is pressed for), where the send
// button then takes the focus.
function scrollBench(toMessage) {
  const scroll = $('bench-scroll');
  const go = () => {
    scroll.scrollTop = 0;
    if (toMessage) scroll.scrollTop = $('message-head').getBoundingClientRect().top - scroll.getBoundingClientRect().top - 12;
  };
  go();
  if (!toMessage) return;
  requestAnimationFrame(() => {
    go();
    $('wa-link').focus({ preventScroll: true });
  });
}

// `trigger` is the button pressed: its data-focus key, not the node (the list is drawn again), is where
// focus goes back when the sheet closes.
function select(call, { trigger, toMessage = false } = {}) {
  if (call.id !== state.selectedId) settleCopy();
  const back = trigger?.dataset?.focus || null;
  state.selectedId = call.id;
  rerender(() => {
    renderList();
    renderBench();
  });
  if (!desktop.matches) openSheet(back);
  else if (!toMessage) announce(`Aberto ao lado: ${call.title}`);
  scrollBench(toMessage);
}

// ---------- Bottom sheet (phones) ----------
// As the news' (js/noticias.js): while open it is a modal dialog, the page behind inert, and the phone's
// Back button closes it (the sheet adds a history entry; ×, the backdrop and Escape go back through it);
// it can be dragged down by its head.

let sheetOpen = false;
let sheetInHistory = false;
let returnFocus = null; // the data-focus key of what opened the sheet

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

function openSheet(back) {
  returnFocus = back;
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
  const target = (returnFocus && findFocus(returnFocus)) || findFocus(`call:${state.selectedId}`);
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

// editais#ed-2026-11-23-…: that call opens (the area cleared when it hides it), if it is still on
// the page.
function openFromAddress() {
  const target = addressTarget();
  if (!target.startsWith('ed-')) return;
  const call = findCall(target);
  if (!call || !callStatus(call)) return;
  if (!matches(call)) {
    state.area = '';
    renderFilters();
  }
  select(call);
  document.querySelector(`.call-card[data-id="${CSS.escape(call.id)}"]`)?.scrollIntoView({ block: 'center' });
}

// ---------- Wiring ----------

async function start() {
  // Reloaded with the sheet open: drop its history entry, or the first Back would do nothing.
  if (history.state?.nosSheet) history.back();
  await load();
  if (desktop.matches) state.selectedId = firstShown()?.id ?? null;
  lastStanding = standing(douradosNow());
  renderAll();
  openFromAddress();
}

initPage('Editais');
$('bench-close').innerHTML = icon('close');
setButton($('wa-link'), 'message', 'Enviar no WhatsApp');
resetCopy();

$('filters').addEventListener('focusin', (e) => {
  if (e.target.closest('.chip')) e.target.scrollIntoView({ block: 'nearest', inline: 'nearest' });
});
$('copy-btn').addEventListener('click', async () => {
  const call = findCall(state.selectedId);
  if (!call) return;
  const copied = await copyText(buildCallMessage(call, callStatus(call) || 'closed'));
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
    if (!state.selectedId) state.selectedId = firstShown()?.id ?? null;
  }
  rerender(() => {
    renderList();
    renderBench();
  });
});

// The deadlines follow the clock: "faltam 5 dias" counts down, and a call moves to "Fecharam há pouco"
// the minute it closes. The page is drawn again only when one of them changed. After a long absence the
// file is read again.
const standing = (now) => state.calls.map((c) => `${c.id}:${callStatus(c, now)}:${c.until ? leftText(c, now) : ''}`).join('|');
let lastStanding = '';
let hiddenAt = null;
function tick() {
  if (!state.calls.length) return;
  const now = standing(douradosNow());
  if (now === lastStanding) return;
  lastStanding = now;
  rerender(() => {
    renderList();
    renderBench();
  });
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
    if (state.selectedId && !findCall(state.selectedId)) {
      state.selectedId = null;
      closeSheet();
    }
    if (!state.selectedId && desktop.matches) state.selectedId = firstShown()?.id ?? null;
    renderAll();
  }
  tick();
  hiddenAt = null;
});

if (location.protocol !== 'file:') start();
registerWorker();
