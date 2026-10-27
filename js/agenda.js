// The agenda as a list: the days on the land, each with its activities as cards. Today is always
// there, underlined by hand; the next activity's time is circled ("a próxima"). Past days stay hidden
// until asked for.

import { capitalize, dateFromKey, dateKey, formatDayMonth, formatLongDate, formatTimeRange, formatTinyDate, lastDayKey, orgFullName, relativeDay, startTime, weekdayName } from './events.js';
import { holidayOn } from './holidays.js';
import { paintSector } from './colors.js';
import { handMark, icon } from './icons.js';
import { el } from './page.js';

// "terça", "sábado": the weekday as people say it.
const plainWeekday = (date) => weekdayName(date).replace('-feira', '');

// What the date line of a multi-day activity says on a given day.
function rangeText(ev, shownOn, todayKey) {
  const until = `até ${formatTinyDate(ev.endDate)}`;
  if (shownOn === ev.dateKey) return until;
  if (shownOn === todayKey) return `Em andamento, ${until}`;
  return `De ${formatTinyDate(ev.date)} a ${formatTinyDate(ev.endDate)}`;
}

function metaRow(className, iconName, content) {
  const row = el('span', `meta ${className}`);
  if (iconName) row.insertAdjacentHTML('beforeend', icon(iconName));
  const text = el('span', 'meta-text');
  text.append(content);
  row.append(text);
  return row;
}

// When: the time (its range, "até 12h", or "Horário a confirmar"), circled by hand on the next
// activity's own day. The type stays in the panel and the message.
function timeRow(ev, isNext) {
  const row = el('span', 'meta meta-time');
  row.insertAdjacentHTML('beforeend', icon('clock'));
  const text = startTime(ev) || ev.endTime != null || ev.endTimeRaw ? formatTimeRange(ev) : 'Horário a confirmar';
  if (isNext) {
    const circled = el('span', 'circled meta-text', text);
    circled.insertAdjacentHTML('beforeend', handMark('loopAlt'));
    row.append(circled, el('span', 'next-label', 'a próxima'));
  } else {
    row.append(el('span', 'meta-text', text));
  }
  return row;
}

// Who: the group's dot, the organization, and its full name where it is known (else the group).
export function orgRow(ev) {
  const row = el('span', 'meta meta-org');
  row.append(el('span', 'dot'));
  const text = el('span', 'meta-text');
  text.append(el('b', null, ev.org));
  const full = ev.orgs.length === 1 ? orgFullName(ev.orgs[0]) : '';
  if (full || ev.sector) text.append(` · ${full || ev.sector}`);
  if (full && ev.sector) text.append(el('span', 'sr-only', ` (${ev.sector})`));
  row.append(text);
  return row;
}

// Where: another city than Dourados is always named first.
export function placeRow(ev) {
  const place = document.createDocumentFragment();
  if (ev.city) place.append(el('span', 'city-tag', ev.city));
  if (ev.local) place.append(ev.local);
  return metaRow('meta-place', ev.online ? 'globe' : 'pin', place);
}

// One activity as a card: the whole card is the button that opens it in the panel. `shownOn` is the
// key of the day it is listed under.
export function renderCard(ev, { shownOn, todayKey, nextId, selectedId, onSelect }) {
  const card = el('button', 'event-card');
  card.type = 'button';
  card.dataset.id = ev.id;
  card.dataset.focus = `line:${ev.id}`;
  paintSector(card, ev.sector);
  if (ev.id === selectedId) {
    card.classList.add('is-selected');
    card.setAttribute('aria-current', 'true');
  }
  if (ev.cancelled) {
    card.classList.add('is-cancelled');
    card.append(el('span', 'tag tag-cancelled', 'Cancelada'));
  }

  const head = el('span', 'event-head');
  head.append(el('span', 'event-title', ev.title));
  const share = el('span', 'share-circle');
  share.setAttribute('aria-hidden', 'true');
  share.innerHTML = icon('share');
  head.append(share);
  card.append(head);
  if (ev.cancelled && ev.cancelReason) card.append(el('span', 'event-reason', `Motivo: ${ev.cancelReason}`));

  const meta = el('span', 'event-meta');
  // "a próxima" only on the day it starts.
  meta.append(timeRow(ev, ev.id === nextId && ev.dateKey === shownOn));
  if (ev.org) meta.append(orgRow(ev));
  if (ev.local || ev.city) meta.append(placeRow(ev));
  if (ev.endDate) meta.append(metaRow('meta-range', 'calendar-range', rangeText(ev, shownOn, todayKey)));
  card.append(meta);

  card.addEventListener('click', () => onSelect(ev));
  return card;
}

// A day's activities in reading order: those starting that day by time (untimed first, they
// usually last the whole day), then the ones that started before and are still running.
function dayOrder(dayEvents, key) {
  const own = dayEvents.filter((ev) => ev.dateKey === key);
  const running = dayEvents.filter((ev) => ev.dateKey !== key);
  const byTime = (a, b) => (a.time ?? -1) - (b.time ?? -1) || a.line - b.line;
  return [...own.sort(byTime), ...running.sort((a, b) => a.date - b.date || byTime(a, b))];
}

// One day: "Hoje · terça, 27/10" (Hoje underlined by hand), "Sábado, 31/10", a holiday's name and
// tag; then its cards, or a quiet line when nothing is on (a holiday between listed days is its head
// alone: `holidayLine`).
export function renderDay(key, dayEvents, { today, nextId, selectedId, onSelect, holidayLine = false }) {
  const todayKey = dateKey(today);
  const date = dateFromKey(key);
  const holiday = holidayOn(date);
  const relative = relativeDay(date, today);
  const otherYear = date.getFullYear() !== today.getFullYear();

  const day = el('section', 'day-group');
  day.dataset.day = key;
  if (key < todayKey) day.classList.add('is-past');
  if (key === todayKey) day.classList.add('is-today');

  const head = el('h3', 'day-head');
  const near = ['hoje', 'amanhã', 'ontem'].includes(relative) ? `${capitalize(relative)}, ` : '';
  head.append(el('span', 'sr-only', `${near}${formatLongDate(date)}${otherYear ? ` de ${date.getFullYear()}` : ''}${holiday ? `, ${holiday.name}` : ''}`));
  const label = el('span', 'day-label');
  label.setAttribute('aria-hidden', 'true');
  const short = `${formatDayMonth(date)}${otherYear ? `/${date.getFullYear()}` : ''}`;
  if (key === todayKey) {
    const word = el('span', 'underlined', 'Hoje');
    word.insertAdjacentHTML('beforeend', handMark('underline'));
    label.append(word, ` · ${plainWeekday(date)}, ${short}`);
  } else if (near) {
    label.append(`${capitalize(relative)} · ${plainWeekday(date)}, ${short}`);
  } else {
    label.append(`${capitalize(plainWeekday(date))}, ${short}`);
  }
  if (holiday) label.append(' ', el('span', 'day-head-holiday', `· ${holiday.name}`));
  head.append(label);
  if (holiday) {
    const tag = el('span', 'tag', 'Feriado');
    tag.setAttribute('aria-hidden', 'true');
    head.append(tag);
  }
  day.append(head);

  if (dayEvents.length) {
    const list = el('ul', 'cards');
    for (const ev of dayOrder(dayEvents, key)) {
      const item = el('li');
      item.append(renderCard(ev, { shownOn: key, todayKey, nextId, selectedId, onSelect }));
      list.append(item);
    }
    day.append(list);
  } else if (!holidayLine) {
    const empty = el('p', 'empty-card');
    empty.innerHTML = icon('calendar-x');
    empty.append(key === todayKey ? 'Nada marcado para hoje' : 'Nada marcado neste dia');
    day.append(empty);
  }
  return day;
}

// Groups activities by the day they are listed under. Activities that started before today and are
// still running move to today, so a period never disappears while it is open.
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
  container.replaceChildren(el('h2', 'sr-only', 'Lista de atividades'));
  const todayKey = dateKey(today);
  const upcoming = events.filter((ev) => lastDayKey(ev) >= todayKey);
  const past = events.filter((ev) => lastDayKey(ev) < todayKey);

  // With a filter on and nothing ahead, say so (and offer the past itself).
  if (filtered && !upcoming.length && !showPast) {
    container.append(renderEmpty({ past, today, filterLabel, onTogglePast: past.length ? onTogglePast : null, onClearFilters }));
    return;
  }

  // With a filter on, say how many activities it leaves ahead.
  if (filtered) container.append(el('p', 'result-count', upcomingLabel(upcoming.length)));

  if (past.length) {
    const toggle = el('button', 'past-toggle');
    toggle.type = 'button';
    toggle.id = 'past-toggle';
    toggle.dataset.focus = 'past-toggle';
    toggle.setAttribute('aria-expanded', String(showPast));
    const count = `${past.length} ${past.length === 1 ? 'atividade anterior' : 'atividades anteriores'}`;
    toggle.innerHTML = `${icon(showPast ? 'down' : 'up')}<span>${showPast ? 'Ocultar' : 'Ver'} ${count}</span>`;
    toggle.addEventListener('click', onTogglePast);
    container.append(toggle);
  }

  const days = el('div', 'days');
  const byDay = groupByShownDay(showPast ? events : upcoming, todayKey);
  const keys = new Set(byDay.keys());
  keys.add(todayKey);
  // The holidays between the first and the last listed day are listed too, as day lines.
  const sorted = [...keys].sort();
  const holidays = new Set();
  for (let d = dateFromKey(sorted[0]), last = sorted[sorted.length - 1]; dateKey(d) <= last; d.setDate(d.getDate() + 1)) {
    if (!keys.has(dateKey(d)) && holidayOn(d)) holidays.add(dateKey(d));
  }
  for (const key of [...keys, ...holidays].sort()) {
    days.append(renderDay(key, byDay.get(key) || [], { today, nextId, selectedId, onSelect, holidayLine: holidays.has(key) }));
  }
  container.append(days);
}

export const upcomingLabel = (n) => `${n} ${n === 1 ? 'atividade' : 'atividades'} de hoje em diante`;

// "ontem", "no sábado, 7 de setembro", "na segunda-feira, 5 de outubro"
function lastWhen(date, today) {
  if (relativeDay(date, today) === 'ontem') return 'ontem';
  const weekend = date.getDay() === 0 || date.getDay() === 6;
  return `${weekend ? 'no' : 'na'} ${formatLongDate(date).replace(/^./, (c) => c.toLowerCase())}`;
}

// Nothing ahead for this filter.
function renderEmpty({ past, today, filterLabel, onTogglePast, onClearFilters }) {
  const box = el('section', 'empty-state');
  box.insertAdjacentHTML('beforeend', icon('calendar-x', 'icon empty-icon'));
  box.append(el('p', 'empty-title', `Nenhuma atividade ${filterLabel} de hoje em diante`));
  const last = past[past.length - 1];
  if (last) box.append(el('p', 'empty-hint', `A última foi ${lastWhen(last.date, today)}.`));
  const actions = el('div', 'empty-actions');
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
  box.append(actions);
  return box;
}
