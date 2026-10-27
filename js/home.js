// Início (index.html): the greeting of this hour on the sky, the next activity resting on the band
// (its date circled by hand, a link to send it to WhatsApp and, from 760px, "Ver na agenda" and what
// else comes), then a door to each page. The agenda's door says how much is ahead; Comércio's says
// "Em breve" while its list is paused. Without the agenda's sheet (offline with nothing saved, a
// broken link) the card says so and the doors stay.

import { COMMERCE_CSV_URL, CSV_URL } from './config.js';
import { agendaSummary, buildEvents, capitalize, dateKey, formatDayMonth, formatTimeRange, lastDayKey, monthName, orgFullName, relativeDay, startTime, upcomingEvents, weekdayName } from './events.js';
import { assignSectorColors, paintSector, sectorsOf } from './colors.js';
import { buildBusinesses } from './businesses.js';
import { placeRow } from './agenda.js';
import { handMark, icon } from './icons.js';
import { greeting } from './sky.js';
import { buildWhatsAppMessage, whatsAppShareUrl } from './whatsapp.js';
import { $, el, initPage, readSheet, registerWorker } from './page.js';

// What else comes, under the next one (from 760px).
const LATER_COUNT = 3;

let today = new Date();
let events = null;
let shownNext = undefined; // the id on the card, to redraw it only when it changes

const plainWeekday = (date) => weekdayName(date).replace('-feira', '');

// "Terça, 27 de outubro" (and the year from 760px).
function renderHello() {
  $('hello-word').textContent = greeting(today);
  $('hello-date').replaceChildren(`${capitalize(plainWeekday(today))}, ${today.getDate()} de ${monthName(today.getMonth())}`, el('span', 'hello-year', ` de ${today.getFullYear()}`));
}

// "sáb 31/10"
const shortDate = (date) => `${weekdayName(date).slice(0, 3)} ${formatDayMonth(date)}`;
const timeOf = (ev) => (startTime(ev) || ev.endTime != null || ev.endTimeRaw ? formatTimeRange(ev) : '');

function metaRow(className, iconName, content) {
  const row = el('p', `meta ${className}`);
  if (iconName) row.insertAdjacentHTML('beforeend', icon(iconName));
  const text = el('span', 'meta-text');
  text.append(content);
  row.append(text);
  return row;
}

// The next activity, resting on the band.
function renderNext(next, upcoming) {
  const card = $('next-card');
  shownNext = next?.id ?? null;
  if (!next) {
    const title = el('h2', 'next-title', 'A próxima atividade');
    title.id = 'next-title';
    card.style.removeProperty('--sector');
    card.replaceChildren(title, el('p', 'next-status', 'Nada marcado por enquanto. As atividades das organizações aparecem aqui assim que entram na agenda.'));
    return;
  }
  paintSector(card, next.sector);
  const message = buildWhatsAppMessage(next);
  const shareUrl = whatsAppShareUrl(message);
  const time = timeOf(next);
  const relative = relativeDay(next.date, today);

  const head = el('div', 'next-head');
  const when = el('p', 'next-when');
  const date = el('span', 'circled date-big', shortDate(next.date));
  date.insertAdjacentHTML('beforeend', handMark('loop'));
  when.append(date, el('span', 'next-time', time || 'horário a confirmar'));
  when.append(el('span', 'next-label', ['hoje', 'amanhã'].includes(relative) ? `a próxima, ${relative}` : 'a próxima'));
  const share = el('a', 'share-button');
  share.href = shareUrl;
  share.target = '_blank';
  share.rel = 'noopener';
  share.setAttribute('aria-label', `Compartilhar no WhatsApp: ${next.title}`);
  share.innerHTML = icon('share');
  head.append(when, share);

  const title = el('h2', 'next-title', next.title);
  title.id = 'next-title';

  const facts = el('div', 'next-facts');
  facts.append(metaRow('meta-time', 'clock', time || 'Horário a confirmar'));
  if (next.org) {
    const org = el('p', 'meta meta-org');
    org.append(el('span', 'dot'));
    const text = el('span', 'meta-text');
    text.append(el('b', null, next.org));
    const full = next.orgs.length === 1 ? orgFullName(next.orgs[0]) : '';
    if (full) text.append(el('span', 'next-org-full', ` · ${full}`));
    org.append(text);
    facts.append(org);
  }
  if (next.local || next.city) {
    const place = placeRow(next);
    const row = el('p', place.className);
    row.append(...place.childNodes);
    facts.append(row);
  }
  if (next.endDate) facts.append(metaRow('meta-range', 'calendar-range', `Até ${weekdayName(next.endDate).slice(0, 3)}, ${formatDayMonth(next.endDate)}`));

  // From 760px: the two actions, and what else comes.
  const actions = el('div', 'next-actions');
  const send = el('a', 'btn btn-accent');
  send.href = shareUrl;
  send.target = '_blank';
  send.rel = 'noopener';
  send.innerHTML = `${icon('message')}<span>Compartilhar no WhatsApp</span>`;
  const open = el('a', 'btn btn-line', 'Ver na agenda');
  open.href = 'calendario.html';
  actions.append(send, open);

  const parts = [head, title, facts, actions];
  const later = upcoming.slice(1, 1 + LATER_COUNT);
  if (later.length) {
    const box = el('section', 'later');
    box.setAttribute('aria-labelledby', 'later-title');
    const heading = el('h3', 'later-title', 'Também na agenda');
    heading.id = 'later-title';
    const list = el('ul', 'later-list');
    for (const ev of later) {
      const item = el('li', 'later-item');
      const at = el('time', null, [shortDate(ev.date), timeOf(ev)].filter(Boolean).join(', '));
      at.dateTime = ev.dateKey;
      item.append(at, el('span', null, ev.title), el('span', 'later-org', ev.orgs[0] || ''));
      list.append(item);
    }
    const ahead = events.filter((ev) => !ev.cancelled && lastDayKey(ev) >= dateKey(today)).length;
    const more = el('a', 'more');
    more.href = 'calendario.html';
    more.innerHTML = `<span>Ver ${ahead > 1 ? `as ${agendaSummary(events, today)}` : 'a agenda'}</span>${icon('arrow-right')}`;
    box.append(heading, list, more);
    parts.push(box);
  }
  card.replaceChildren(...parts);
}

function render() {
  const upcoming = upcomingEvents(events, today);
  renderNext(upcoming[0] || null, upcoming);
  $('door-agenda-line').textContent = agendaSummary(events, today);
}

async function load() {
  try {
    const { headers, records, lines } = await readSheet(CSV_URL);
    events = buildEvents(headers, records, lines).events;
    assignSectorColors(sectorsOf(events));
    render();
  } catch (err) {
    console.warn('Agenda:', err);
    // A failed re-read keeps what is on screen.
    if (!events) $('next-status').textContent = 'Não foi possível carregar a agenda agora. Confira a conexão e abra a agenda.';
  }
}

// Comércio's door when its list returns: how many businesses there are.
async function renderCommerceDoor() {
  const { headers, records, lines } = await readSheet(COMMERCE_CSV_URL);
  const { businesses } = buildBusinesses(headers, records, lines);
  if (businesses.length) $('door-commerce-line').textContent = `${businesses.length} ${businesses.length === 1 ? 'negócio' : 'negócios'} da rede`;
}

initPage();
renderHello();
if (location.protocol !== 'file:') load();
// Comércio is paused while the businesses are collected and organized: its door says "Em breve" and
// why (index.html), and this page doesn't read its sheet. When the list returns, call
// renderCommerceDoor().catch(…) here and give the door its own text again.

// "Now" moves: the greeting follows the hour, the date the day, and the card the next activity (an
// activity stays next until an hour after it starts). After a long absence the sheet is read again.
let hiddenAt = null;
function tick() {
  const dayTurned = dateKey(new Date()) !== dateKey(today);
  today = new Date();
  renderHello();
  if (!events) return;
  const next = upcomingEvents(events, today)[0]?.id ?? null;
  if (dayTurned || next !== shownNext) render();
}
setInterval(() => {
  if (!document.hidden) tick();
}, 60_000);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    hiddenAt = Date.now();
    return;
  }
  if (hiddenAt && Date.now() - hiddenAt > 30 * 60_000 && location.protocol !== 'file:') load();
  tick();
  hiddenAt = null;
});
window.addEventListener('pageshow', (e) => {
  if (e.persisted) tick();
});
registerWorker();
