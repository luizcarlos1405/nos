// The month: weeks start on Sunday, Sundays and holidays are shaded as days off, today is underlined
// by hand and the next activity's day circled. One-day activities are their groups' dots inside the
// day (entries with their titles on the desk); activities that run several days are bars laid across
// the week, each in its own lane. Picking a day lists it under the month. The grid is one tab stop:
// arrow keys move between days (APG date grid pattern).

import { capitalize, dateKey, dayKeys, formatLongDate, formatTimeRange, monthName, startTime } from './events.js';
import { holidayOn, isRedLetter } from './holidays.js';
import { paintSector } from './colors.js';
import { handMark, icon } from './icons.js';
import { renderDay } from './agenda.js';
import { el } from './page.js';

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MAX_ITEMS = 3;

export const addDays = (date, n) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + n);

// The bars of one week: each multi-day activity clipped to the week, placed in the first free lane.
function weekBars(events, weekStart) {
  const startKey = dateKey(weekStart);
  const endKey = dateKey(addDays(weekStart, 6));
  const bars = [];
  for (const ev of events) {
    if (!ev.endDate || ev.endDateKey < startKey || ev.dateKey > endKey) continue;
    const from = ev.dateKey < startKey ? 0 : ev.date.getDay();
    const to = ev.endDateKey > endKey ? 6 : ev.endDate.getDay();
    bars.push({ ev, from, to, starts: ev.dateKey >= startKey, ends: ev.endDateKey <= endKey });
  }
  bars.sort((a, b) => a.from - b.from || (b.to - b.from) - (a.to - a.from));
  const lanes = [];
  for (const bar of bars) {
    let lane = lanes.findIndex((taken) => taken.every((other) => bar.from > other.to || bar.to < other.from));
    if (lane === -1) {
      lane = lanes.length;
      lanes.push([]);
    }
    lanes[lane].push(bar);
    bar.lane = lane;
  }
  // Each day only makes room for the lanes that actually cross it.
  const dayLanes = Array.from({ length: 7 }, (_, day) => bars.reduce((n, bar) => (bar.from <= day && day <= bar.to ? Math.max(n, bar.lane + 1) : n), 0));
  return { bars, laneCount: lanes.length, dayLanes };
}

function renderBar({ ev, from, to, starts, ends, lane }) {
  const bar = el('span', 'week-bar');
  paintSector(bar, ev.sector);
  bar.style.gridColumn = `${from + 1} / ${to + 2}`;
  bar.style.setProperty('--lane', lane);
  if (starts) bar.classList.add('is-start');
  if (ends) bar.classList.add('is-end');
  if (ev.cancelled) bar.classList.add('is-cancelled');
  bar.append(el('span', 'week-bar-text', ev.title));
  return bar;
}

function renderItem(ev) {
  const item = el('span', `cell-item${ev.cancelled ? ' is-cancelled' : ''}`);
  paintSector(item, ev.sector);
  item.append(el('span', 'cell-mark'));
  const text = el('span', 'cell-item-text');
  const time = startTime(ev) || (ev.endTime != null || ev.endTimeRaw ? formatTimeRange(ev) : '');
  if (time) text.append(el('span', 'cell-item-time', time), ' ');
  text.append(document.createTextNode(ev.title));
  item.append(text);
  return item;
}

const navButton = (iconName, label, focus, onClick) => {
  const button = el('button', 'icon-btn');
  button.type = 'button';
  button.dataset.focus = focus;
  button.setAttribute('aria-label', label);
  button.innerHTML = icon(iconName);
  button.addEventListener('click', onClick);
  return button;
};

export function renderMonth(container, { year, month, events, today, selectedDay, focusDay, selectedId, nextId, onPrev, onNext, onToday, onDay, onMove, onSelect }) {
  container.replaceChildren();
  const todayKey = dateKey(today);

  const head = el('div', 'month-head');
  const title = el('h2', 'month-title', `${capitalize(monthName(month))} ${year}`);
  title.tabIndex = -1;
  title.dataset.focus = 'month:title';
  head.append(navButton('left', 'Mês anterior', 'month:prev', onPrev), title, navButton('right', 'Próximo mês', 'month:next', onNext));
  if (year !== today.getFullYear() || month !== today.getMonth()) {
    const back = el('button', 'btn-text month-today', 'Voltar para hoje');
    back.type = 'button';
    back.dataset.focus = 'month:today';
    back.addEventListener('click', onToday);
    head.append(back);
  }
  container.append(head);

  // Activities of each day, multi-day ones included (they decide the day's count and the day sheet).
  const byDay = new Map();
  const single = new Map();
  for (const ev of events) {
    for (const key of dayKeys(ev)) {
      if (!byDay.has(key)) byDay.set(key, []);
      byDay.get(key).push(ev);
      if (!ev.endDate) {
        if (!single.has(key)) single.set(key, []);
        single.get(key).push(ev);
      }
    }
  }

  const first = new Date(year, month, 1);
  const gridStart = addDays(first, -first.getDay()); // Sunday first
  const weeks = Math.ceil((first.getDay() + new Date(year, month + 1, 0).getDate()) / 7);
  const gridKeys = new Set(Array.from({ length: weeks * 7 }, (_, i) => dateKey(addDays(gridStart, i))));
  // The grid's one tab stop: the day being moved to, else the picked day, today or the 1st.
  const inMonth = (key) => key && gridKeys.has(key) && Number(key.slice(5, 7)) === month + 1;
  const tabStop = [focusDay, selectedDay, todayKey].find(inMonth) || dateKey(first);

  // The next activity's first day gets the hand loop.
  const nextKey = events.find((ev) => ev.id === nextId)?.dateKey;

  const page = el('div', 'month');
  const weekdays = el('div', 'month-weekdays');
  weekdays.setAttribute('aria-hidden', 'true');
  WEEKDAYS.forEach((label) => weekdays.append(el('span', 'month-weekday', label)));
  page.append(weekdays);

  const grid = el('div', 'month-weeks');
  grid.setAttribute('role', 'group');
  grid.setAttribute('aria-label', `${capitalize(monthName(month))} de ${year}. Use as setas para mudar de dia.`);
  for (let w = 0; w < weeks; w++) {
    const weekStart = addDays(gridStart, w * 7);
    const { bars, laneCount, dayLanes } = weekBars(events, weekStart);
    const week = el('div', 'week');
    week.style.setProperty('--week-lanes', laneCount);
    // A holiday's name takes a line under its numeral; the whole week makes room for it.
    if (Array.from({ length: 7 }, (_, i) => holidayOn(addDays(weekStart, i))).some(Boolean)) week.classList.add('has-holiday');

    const days = el('div', 'week-days');
    for (let i = 0; i < 7; i++) {
      const date = addDays(weekStart, i);
      const key = dateKey(date);
      const dayEvents = byDay.get(key) || [];
      const items = single.get(key) || [];
      const holiday = holidayOn(date);

      const cell = el('button', 'day');
      cell.type = 'button';
      cell.dataset.day = key;
      cell.dataset.focus = `day:${key}`;
      cell.tabIndex = key === tabStop ? 0 : -1;
      cell.style.setProperty('--lanes', dayLanes[i]);
      if (date.getMonth() !== month) cell.classList.add('is-outside');
      if (key < todayKey) cell.classList.add('is-past');
      if (key === todayKey) cell.classList.add('is-today');
      if (key === selectedDay) cell.classList.add('is-selected');
      if (isRedLetter(date)) cell.classList.add('is-off');
      if (key === nextKey) cell.classList.add('is-next');
      cell.setAttribute('aria-pressed', String(key === selectedDay));
      const count = dayEvents.length ? `${dayEvents.length} ${dayEvents.length === 1 ? 'atividade' : 'atividades'}` : 'sem atividades';
      cell.setAttribute('aria-label', `${key === todayKey ? 'Hoje, ' : ''}${formatLongDate(date)}${holiday ? ` (${holiday.name})` : ''}: ${count}${key === nextKey ? ', a próxima atividade' : ''}`);

      const top = el('span', 'day-top');
      const num = el('span', 'day-num', String(date.getDate()));
      if (key === todayKey) num.insertAdjacentHTML('beforeend', handMark('underline'));
      if (key === nextKey) num.insertAdjacentHTML('beforeend', handMark('loop'));
      top.append(num);
      if (holiday) top.append(el('span', 'day-holiday', holiday.short));
      cell.append(top);

      if (items.length) {
        const list = el('span', 'day-items');
        items.slice(0, MAX_ITEMS).forEach((ev) => list.append(renderItem(ev)));
        if (items.length > MAX_ITEMS) list.append(el('span', 'day-more', `+${items.length - MAX_ITEMS}`));
        cell.append(list);
      }

      cell.addEventListener('click', () => onDay(key, dayEvents));
      days.append(cell);
    }
    week.append(days);

    if (bars.length) {
      const layer = el('div', 'week-bars');
      layer.setAttribute('aria-hidden', 'true');
      bars.forEach((bar) => layer.append(renderBar(bar)));
      week.append(layer);
    }
    grid.append(week);
  }

  // Arrow keys move the tab stop: a day, a week, the ends of the week, a month.
  grid.addEventListener('keydown', (e) => {
    const key = e.target.closest('.day')?.dataset.day;
    if (!key) return;
    const [y, m, d] = key.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const moves = {
      ArrowLeft: () => addDays(date, -1),
      ArrowRight: () => addDays(date, 1),
      ArrowUp: () => addDays(date, -7),
      ArrowDown: () => addDays(date, 7),
      Home: () => addDays(date, -date.getDay()),
      End: () => addDays(date, 6 - date.getDay()),
      PageUp: () => new Date(y, m - 2, Math.min(d, new Date(y, m - 1, 0).getDate())),
      PageDown: () => new Date(y, m, Math.min(d, new Date(y, m + 1, 0).getDate())),
    };
    if (!moves[e.key]) return;
    e.preventDefault();
    onMove(dateKey(moves[e.key]()));
  });

  page.append(grid);
  container.append(page);

  // The chosen day, listed under the month, when that day is on this month's page.
  if (selectedDay && inMonth(selectedDay)) {
    const day = renderDay(selectedDay, byDay.get(selectedDay) || [], { today, nextId, selectedId, onSelect });
    day.classList.add('month-day');
    container.append(day);
  }
}
