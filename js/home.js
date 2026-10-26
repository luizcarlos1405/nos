// Início (index.html): one sentence and two doors, each a sheet of the page it opens. The
// Calendário door prints today's sheet and the next activities; the Comércio door, how many
// businesses there are and a few of them, drawn at random on every visit so each gets its turn.
// Without the sheets (offline, a broken link) the doors keep their text and their buttons.

import { COMMERCE_CSV_URL, CSV_URL } from './config.js';
import { buildEvents, capitalize, formatLongDate, formatTinyDate, monthName, startTime, upcomingEvents, weekdayName } from './events.js';
import { holidayOn, isRedLetter } from './holidays.js';
import { assignSectorColors, paintSector, sectorsOf } from './colors.js';
import { buildBusinesses } from './businesses.js';
import { $, el, initPage, readSheet, registerWorker } from './page.js';

// The phone shows the first of each list, the desk all of them (css/style.css).
const NEXT_COUNT = 3;
const PEEK_COUNT = 4;

let today = new Date();

// Today's sheet, as the calendar prints it: two-digit day, weekday, month, Hoje; red on Sundays
// and holidays.
function renderToday() {
  const head = $('today');
  const holiday = holidayOn(today);
  const label = el('span', 'sr-only', `Hoje, ${formatLongDate(today).toLowerCase()}${holiday ? `, ${holiday.name}` : ''}.`);
  const num = el('span', 'sheet-num', String(today.getDate()).padStart(2, '0'));
  const names = el('span', 'sheet-names');
  names.append(el('span', 'sheet-weekday', weekdayName(today)), el('span', 'sheet-month', capitalize(monthName(today.getMonth()))));
  if (holiday) names.append(el('span', 'sheet-holiday', holiday.name));
  const status = el('span', 'sheet-status');
  status.append(el('span', 'badge is-today', 'Hoje'));
  for (const node of [num, names, status]) node.setAttribute('aria-hidden', 'true');
  head.replaceChildren(label, num, names, status);
  head.closest('.sheet').classList.toggle('is-red', isRedLetter(today));
}

// The next activities (not cancelled, not started yet), the first one marked Próxima.
async function renderNext() {
  const { headers, records, lines } = await readSheet(CSV_URL);
  const { events } = buildEvents(headers, records, lines);
  const upcoming = upcomingEvents(events, today).slice(0, NEXT_COUNT);
  if (!upcoming.length) return;
  assignSectorColors(sectorsOf(events));
  const list = $('next-activities');
  list.replaceChildren(...upcoming.map((ev, i) => {
    const item = el('li', 'door-item');
    const when = el('span', 'door-when');
    if (i === 0) when.append(el('span', 'badge is-next', 'Próxima'));
    const date = el('span', 'door-date', formatTinyDate(ev.date));
    if (isRedLetter(ev.date)) date.classList.add('is-red');
    when.append(date);
    const time = startTime(ev);
    if (time) when.append(el('span', 'door-time', time));
    const what = el('span', 'door-what');
    what.append(el('span', 'door-item-title', ev.title));
    if (ev.org) {
      const org = el('span', 'door-org');
      paintSector(org, ev.sector);
      org.append(el('span', 'sector-mark'), el('span', null, ev.orgs[0] || ev.org));
      what.append(org);
    }
    item.append(when, what);
    return item;
  }));
  list.hidden = false;
}

// How many businesses, and a few of them at random: name, dots, category (and, on the desk, the offer).
async function renderBusinesses() {
  const { headers, records, lines } = await readSheet(COMMERCE_CSV_URL);
  const { businesses } = buildBusinesses(headers, records, lines);
  if (!businesses.length) return;
  $('business-count').textContent = `${businesses.length} ${businesses.length === 1 ? 'negócio cadastrado' : 'negócios cadastrados'}`;
  const pool = [...businesses];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const list = $('some-businesses');
  list.replaceChildren(...pool.slice(0, PEEK_COUNT).map((biz) => {
    const item = el('li', 'door-biz');
    item.append(el('span', 'door-biz-name', biz.name));
    const dots = el('span', 'door-dots');
    dots.setAttribute('aria-hidden', 'true');
    item.append(dots);
    if (biz.category) item.append(el('span', 'door-biz-category', biz.category));
    if (biz.offer) item.append(el('span', 'door-biz-offer', biz.offer));
    return item;
  }));
  list.hidden = false;
}

initPage();
renderToday();
if (location.protocol !== 'file:') {
  renderNext().catch((err) => console.warn('Agenda:', err));
  renderBusinesses().catch((err) => console.warn('Comércio:', err));
}

// The installed app opens here and may resume the next day: reprint today and the next activities.
function refresh() {
  if (new Date().toDateString() === today.toDateString()) return;
  today = new Date();
  renderToday();
  if (location.protocol !== 'file:') renderNext().catch((err) => console.warn('Agenda:', err));
}
document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
window.addEventListener('pageshow', refresh);
registerWorker();
