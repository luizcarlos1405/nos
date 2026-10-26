// The agenda: a pad of folhinha sheets, one per day, with the day's activities printed on it.
// Past days are torn off (hidden) until asked for; today's sheet is always on top.

import { capitalize, dateFromKey, dateKey, formatLongDate, formatTimeRange, formatTinyDate, lastDayKey, monthName, relativeDay, startTime, weekdayName } from './events.js';
import { holidayOn, isRedLetter } from './holidays.js';
import { paintSector } from './colors.js';
import { icon } from './icons.js';
import { el } from './page.js';

// Day numbers on sheets always take two digits, like a printed folhinha: "09".
export const sheetNumber = (date) => String(date.getDate()).padStart(2, '0');

// The status on the right of a sheet head: Hoje and/or Próxima, or how far the day is.
function sheetStatus(key, todayKey, isNext, today) {
  const box = el('span', 'sheet-status');
  if (key === todayKey) box.append(el('span', 'badge is-today', 'Hoje'));
  if (isNext) box.append(el('span', 'badge is-next', 'Próxima'));
  if (!box.childNodes.length) box.append(el('span', 'sheet-when', relativeDay(dateFromKey(key), today)));
  return box;
}

// What the date line of a multi-day activity says on a given sheet.
function rangeText(ev, shownOn, todayKey) {
  const until = `até ${formatTinyDate(ev.endDate)}`;
  if (shownOn === ev.dateKey) return until;
  if (shownOn === todayKey) return `Em andamento, ${until}`;
  return `De ${formatTinyDate(ev.date)} a ${formatTinyDate(ev.endDate)}`;
}

// One activity printed on a sheet. `shownOn` is the day key of the sheet it is printed on.
export function renderLine(ev, { shownOn, todayKey, nextId, selectedId, onSelect, markEmptyNext }) {
  const line = el('button', 'line');
  line.type = 'button';
  line.dataset.id = ev.id;
  line.dataset.focus = `line:${ev.id}`;
  paintSector(line, ev.sector);
  // The yellow marks the next activity only on the sheet of the day it starts.
  if (ev.id === nextId && ev.dateKey === shownOn) {
    line.classList.add('is-next');
    if (markEmptyNext) line.classList.add('mark-next');
  }
  if (ev.id === selectedId) {
    line.classList.add('is-selected');
    line.setAttribute('aria-current', 'true');
  }

  const time = startTime(ev);
  // Only an end time: "até 12h" in the time column.
  const until = !time && (ev.endTime != null || ev.endTimeRaw) ? formatTimeRange(ev) : '';
  const timeCol = el('span', 'line-time');
  if (time) {
    timeCol.append(el('span', 'line-clock', time));
  } else if (until) {
    timeCol.append(el('span', 'line-clock is-until', until));
  } else {
    const dash = el('span', 'line-clock is-empty', '—');
    dash.setAttribute('aria-hidden', 'true');
    timeCol.append(dash, el('span', 'sr-only', 'Sem horário.'));
  }
  if (ev.type) timeCol.append(el('span', 'line-type', ev.type));
  line.append(timeCol);

  const body = el('span', 'line-body');
  if (ev.cancelled) {
    line.classList.add('is-cancelled');
    body.append(el('span', 'stamp', 'Cancelada'));
  }
  body.append(el('span', 'line-title', ev.title));
  if (ev.cancelled && ev.cancelReason) body.append(el('span', 'line-reason', `Motivo: ${ev.cancelReason}`));

  if (ev.org) {
    const org = el('span', 'line-org');
    org.append(el('span', 'sector-mark'), el('span', null, ev.org));
    if (ev.sector) org.append(el('span', 'sr-only', ` (${ev.sector})`));
    body.append(org);
  }

  if (ev.local || ev.city) {
    const place = el('span', 'line-place');
    place.insertAdjacentHTML('beforeend', icon(ev.online ? 'globe' : 'pin'));
    const text = el('span', 'line-place-text');
    if (ev.city) text.append(el('span', 'city-tag', ev.city));
    if (ev.local) text.append(document.createTextNode(ev.local));
    place.append(text);
    body.append(place);
  }

  if (ev.endDate) {
    const range = el('span', 'line-range');
    range.insertAdjacentHTML('beforeend', icon('calendar-range'));
    range.append(el('span', null, rangeText(ev, shownOn, todayKey)));
    body.append(range);
  }
  line.append(body);

  const go = el('span', 'line-go');
  go.innerHTML = icon('share');
  line.append(go);

  line.addEventListener('click', () => onSelect(ev));
  return line;
}

// A day's activities in reading order: those starting that day by time (untimed first, they
// usually last the whole day), then the ones that started before and are still running.
function dayOrder(dayEvents, key) {
  const own = dayEvents.filter((ev) => ev.dateKey === key);
  const running = dayEvents.filter((ev) => ev.dateKey !== key);
  const byTime = (a, b) => (a.time ?? -1) - (b.time ?? -1) || a.line - b.line;
  return [...own.sort(byTime), ...running.sort((a, b) => a.date - b.date || byTime(a, b))];
}

// One sheet of the pad.
export function renderSheet(key, dayEvents, { today, nextId, selectedId, onSelect }) {
  const todayKey = dateKey(today);
  const date = dateFromKey(key);
  const holiday = holidayOn(date);
  const isNext = dayEvents.some((ev) => ev.id === nextId && ev.dateKey === key);

  const sheet = el('section', 'sheet');
  sheet.dataset.day = key;
  if (key < todayKey) sheet.classList.add('is-past');
  if (key === todayKey) sheet.classList.add('is-today');
  if (isRedLetter(date)) sheet.classList.add('is-red');

  const head = el('header', 'sheet-head');
  const label = `${formatLongDate(date)}${date.getFullYear() !== today.getFullYear() ? ` de ${date.getFullYear()}` : ''}${holiday ? `, ${holiday.name}` : ''}`;
  head.append(el('h3', 'sr-only', label));
  const num = el('span', 'sheet-num', sheetNumber(date));
  num.setAttribute('aria-hidden', 'true');
  const names = el('span', 'sheet-names');
  names.setAttribute('aria-hidden', 'true');
  names.append(el('span', 'sheet-weekday', weekdayName(date)));
  const month = capitalize(monthName(date.getMonth())) + (date.getFullYear() !== today.getFullYear() ? ` ${date.getFullYear()}` : '');
  names.append(el('span', 'sheet-month', month));
  if (holiday) names.append(el('span', 'sheet-holiday', holiday.name));
  head.append(num, names, sheetStatus(key, todayKey, isNext, today));
  sheet.append(head);

  if (dayEvents.length) {
    // On today's sheet, or among several activities, an untimed next one needs its own mark.
    const markEmptyNext = key === todayKey || dayEvents.length > 1;
    const list = el('ul', 'lines');
    for (const ev of dayOrder(dayEvents, key)) {
      const item = el('li');
      item.append(renderLine(ev, { shownOn: key, todayKey, nextId, selectedId, onSelect, markEmptyNext }));
      list.append(item);
    }
    sheet.append(list);
  } else {
    sheet.append(el('p', 'sheet-empty', key === todayKey ? 'Nenhuma atividade hoje' : 'Nenhuma atividade neste dia'));
  }
  return sheet;
}

// Groups activities by the day their sheet shows them on. Activities that started before today
// and are still running move to today's sheet, so a period never disappears while it is open.
export function groupByShownDay(events, todayKey) {
  const byDay = new Map();
  for (const ev of events) {
    const key = ev.dateKey < todayKey && lastDayKey(ev) >= todayKey ? todayKey : ev.dateKey;
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key).push(ev);
  }
  return byDay;
}

export function renderAgenda(container, { events, today, nextId, selectedId, showPast, filtered, onSelect, onTogglePast, onClearFilters, filterLabel }) {
  container.replaceChildren(el('h2', 'sr-only', 'Agenda'));
  const todayKey = dateKey(today);
  const upcoming = events.filter((ev) => lastDayKey(ev) >= todayKey);
  const past = events.filter((ev) => lastDayKey(ev) < todayKey);

  // With a filter on and nothing ahead, a blank sheet says so (and offers the past itself).
  if (filtered && !upcoming.length && !showPast) {
    container.append(renderEmpty({ past, today, filterLabel, onTogglePast: past.length ? onTogglePast : null, onClearFilters }));
    return;
  }

  // With a filter on, say how many activities it leaves ahead.
  if (filtered) container.append(el('p', 'result-count', upcomingLabel(upcoming.length)));

  if (past.length) {
    const toggle = el('button', 'pad-toggle');
    toggle.type = 'button';
    toggle.id = 'past-toggle';
    toggle.dataset.focus = 'past-toggle';
    toggle.setAttribute('aria-expanded', String(showPast));
    const count = `${past.length} ${past.length === 1 ? 'atividade anterior' : 'atividades anteriores'}`;
    toggle.innerHTML = `${icon(showPast ? 'down' : 'up')}<span>${showPast ? 'Ocultar' : 'Ver'} ${count}</span>`;
    toggle.addEventListener('click', onTogglePast);
    container.append(toggle);
  }

  const pad = el('div', 'pad');
  const byDay = groupByShownDay(showPast ? events : upcoming, todayKey);
  const keys = new Set(byDay.keys());
  keys.add(todayKey);
  for (const key of [...keys].sort()) {
    pad.append(renderSheet(key, byDay.get(key) || [], { today, nextId, selectedId, onSelect }));
  }
  container.append(pad);
}

export const upcomingLabel = (n) => `${n} ${n === 1 ? 'atividade' : 'atividades'} de hoje em diante`;

// "ontem", "no sábado, 7 de setembro", "na segunda-feira, 5 de outubro"
function lastWhen(date, today) {
  if (relativeDay(date, today) === 'ontem') return 'ontem';
  const weekend = date.getDay() === 0 || date.getDay() === 6;
  return `${weekend ? 'no' : 'na'} ${formatLongDate(date).replace(/^./, (c) => c.toLowerCase())}`;
}

// A blank sheet: nothing ahead for this filter.
function renderEmpty({ past, today, filterLabel, onTogglePast, onClearFilters }) {
  const box = el('section', 'sheet is-blank');
  const body = el('div', 'blank');
  body.insertAdjacentHTML('beforeend', icon('calendar-x', 'icon blank-icon'));
  body.append(el('p', 'blank-title', `Nenhuma atividade ${filterLabel} de hoje em diante`));
  const last = past[past.length - 1];
  if (last) body.append(el('p', 'blank-hint', `A última foi ${lastWhen(last.date, today)}.`));
  const actions = el('div', 'blank-actions');
  if (onTogglePast) {
    const more = el('button', 'btn btn-line');
    more.type = 'button';
    more.dataset.focus = 'past-toggle';
    more.innerHTML = `${icon('history')}<span>Ver atividades anteriores</span>`;
    more.addEventListener('click', onTogglePast);
    actions.append(more);
  }
  const clear = el('button', 'btn-text', 'Limpar filtros');
  clear.type = 'button';
  clear.dataset.focus = 'clear-filters';
  clear.addEventListener('click', onClearFilters);
  actions.append(clear);
  body.append(actions);
  box.append(body);
  return box;
}
