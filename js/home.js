// Início (index.html): the city's question on the sky of this hour ("O que está acontecendo em
// Dourados?"), then on the land the very next activity, named as such (its day circled by hand, its title
// a link to it in the agenda, who, when and where, "Mandar no WhatsApp" and, from 760px, "Ver na agenda"),
// the link to the whole agenda with how much is ahead, and what the other pages hold today: Notícias' lead
// story, the Mapa's places with its layers' drawings, Comércio's businesses and their categories. Who NOS
// follows is static text in index.html. Without the agenda (offline with nothing saved, a broken link) the
// next activity says so; each row keeps its own text until its sheet is read.

import { COMMERCE_CSV_URL, MAP_LAYERS } from './config.js';
import { awaitsTime, dateKey, formatDayMonth, formatTimeRange, lastDayKey, orgFullName, relativeDay, upcomingEvents, weekdayName } from './events.js';
import { assignSectorColors, paintSector, sectorsOf } from './colors.js';
import { buildBusinesses, categoriesOf } from './businesses.js';
import { buildPlaces } from './places.js';
import { handMark, icon } from './icons.js';
import { buildWhatsAppMessage, whatsAppShareUrl } from './whatsapp.js';
import { $, agendaSource, el, initPage, newsSource, readSheet, registerWorker } from './page.js';
import { addMonths, firstDay, monthOf } from './month-files.js';
import { leadStory } from './news.js';

// The agenda's months (js/month-files.js): only those with something from today on.
const agenda = agendaSource();

let today = new Date();
let events = null;
let shownNext = undefined; // the id on screen, to redraw only when it changes

// "sex 13/11"
const shortDate = (date) => `${weekdayName(date).slice(0, 3)} ${formatDayMonth(date)}`;

// One line of the next activity's facts: an icon and its text.
function fact(iconName, content) {
  const item = el('li');
  item.insertAdjacentHTML('beforeend', icon(iconName));
  const text = el('span');
  text.append(content);
  item.append(text);
  return item;
}

// The section's heading stays; what follows it is the activity, or a line saying why there is none.
function showStatus(text) {
  $('upcoming').querySelector('.upcoming-actions')?.remove();
  $('upcoming-body').replaceChildren($('upcoming-label'), el('p', 'upcoming-status', text));
}

// The very next activity.
function renderNext(next) {
  shownNext = next?.id ?? null;
  if (!next) {
    showStatus('Nada marcado por enquanto. As atividades das organizações aparecem aqui assim que entram na agenda.');
    return;
  }
  const time = formatTimeRange(next);
  // No time reads "horário a confirmar", except for a deadline or a period (awaitsTime): nothing.
  const pending = !time && awaitsTime(next);
  const relative = relativeDay(next.date, today);
  const eventUrl = `agenda.html#${encodeURIComponent(next.id)}`;

  const when = el('p', 'upcoming-when');
  const day = el('time', 'circled', shortDate(next.date));
  day.dateTime = next.dateKey;
  day.insertAdjacentHTML('beforeend', handMark('loop'));
  when.append(day);
  // Beside the day: "hoje" or "amanhã", and the time ("hoje, 18h30").
  const soon = [relative === 'hoje' || relative === 'amanhã' ? relative : '', time].filter(Boolean).join(', ');
  if (soon) when.append(el('span', 'upcoming-soon', soon));

  // The title opens the activity in the agenda; under 760px its link covers the whole block.
  const title = el('h3', 'upcoming-title');
  const link = el('a', null, next.title);
  link.href = eventUrl;
  title.append(link);

  const facts = el('ul', 'upcoming-facts');
  if (next.org) {
    const org = el('li', 'upcoming-org');
    paintSector(org, next.sector);
    org.append(el('span', 'dot'));
    const text = el('span');
    text.append(el('b', null, next.org));
    const full = next.orgs.length === 1 ? orgFullName(next.orgs[0]) : '';
    if (full) text.append(` · ${full}`);
    org.append(text);
    facts.append(org);
  }
  // Where: another city than Dourados is always named first.
  const place = document.createDocumentFragment();
  if (next.city) place.append(el('span', 'city-tag', next.city));
  if (next.local) place.append(next.local);
  // The time is beside the day; without one, it is to be confirmed (and so is the place when it is missing too).
  if (pending && !next.local && !next.city) facts.append(fact('clock', 'Horário e local a confirmar'));
  else {
    if (pending) facts.append(fact('clock', 'Horário a confirmar'));
    if (next.local || next.city) facts.append(fact(next.online ? 'globe' : 'pin', place));
  }
  if (next.endDate) facts.append(fact('calendar-range', `Até ${shortDate(next.endDate)}`));

  $('upcoming-body').replaceChildren($('upcoming-label'), when, title, facts);

  const actions = el('div', 'upcoming-actions');
  const send = el('a', 'btn btn-accent');
  send.href = whatsAppShareUrl(buildWhatsAppMessage(next));
  send.target = '_blank';
  send.rel = 'noopener';
  send.innerHTML = `${icon('message')}<span>Mandar no WhatsApp</span>`;
  const open = el('a', 'btn btn-line', 'Ver na agenda');
  open.href = eventUrl;
  actions.append(send, open);
  $('upcoming').querySelector('.upcoming-actions')?.remove();
  $('upcoming').append(actions);
}

// The whole agenda: how many activities are ahead (cancelled ones aside).
function renderSeeAll() {
  const ahead = events.filter((ev) => !ev.cancelled && lastDayKey(ev) >= dateKey(today)).length;
  $('see-all-text').textContent = ahead > 1 ? `Ver todas as ${ahead} atividades` : 'Abrir a agenda';
}

function render() {
  renderNext(upcomingEvents(events, today)[0] || null);
  renderSeeAll();
}

async function load() {
  try {
    // What is ahead: the months with an activity from today on. Later reads read them again.
    if (events) await agenda.refresh(dateKey(today));
    else await agenda.open(dateKey(today));
    events = agenda.events;
    assignSectorColors(sectorsOf(events));
    render();
  } catch (err) {
    console.warn('Agenda:', err);
    // A failed re-read keeps what is on screen.
    if (!events) showStatus('Não foi possível carregar a agenda agora. Confira a conexão e abra a agenda.');
  }
}

// Notícias: what the page leads with (the newest story marked "Destaque", else the newest), with its day,
// kind and who; the last two months are read (the news page opens on three). Without news the row keeps
// its description.
async function renderNewsRow() {
  const news = newsSource();
  await news.open(firstDay(addMonths(monthOf(dateKey(new Date())), -1)));
  const lead = leadStory(news.events);
  if (!lead) return;
  $('news-lead').textContent = lead.title;
  const meta = $('news-meta');
  const when = el('time', null, shortDate(lead.date));
  when.dateTime = lead.dateKey;
  meta.replaceChildren(when, ...[lead.kind, lead.org].filter(Boolean).map((part) => ` · ${part}`));
  meta.hidden = false;
  $('news-text').hidden = true;
}

// Mapa: how many places it shows (as the page counts them: reviewed, with coordinates) and the drawings
// of its layers, the points of the map, each named for screen readers with its count.
async function renderMapRow() {
  const read = await Promise.allSettled(MAP_LAYERS.map(async (layer) => {
    const { headers, records, lines } = await readSheet(layer.file);
    return buildPlaces(layer, headers, records, lines).places.length;
  }));
  const counts = read.map((r) => (r.status === 'fulfilled' ? r.value : 0));
  const total = counts.reduce((a, b) => a + b, 0);
  if (!total || read.some((r) => r.status === 'rejected')) return;
  $('map-lead').textContent = `${total} ${total === 1 ? 'lugar' : 'lugares'} da cultura e dos movimentos`;
  const glyphs = $('map-glyphs');
  glyphs.replaceChildren(...MAP_LAYERS.flatMap((layer, i) => {
    if (!counts[i]) return [];
    const glyph = el('span', 'home-glyph');
    glyph.insertAdjacentHTML('beforeend', icon(layer.icon));
    glyph.append(el('span', 'sr-only', `${layer.name}: ${counts[i]}`));
    return [glyph];
  }));
  glyphs.hidden = false;
  $('map-text').hidden = true;
}

// Comércio: how many businesses there are, and their categories in the chips' order.
async function renderCommerceRow() {
  const { headers, records, lines } = await readSheet(COMMERCE_CSV_URL);
  const { businesses } = buildBusinesses(headers, records, lines);
  if (!businesses.length) return;
  $('commerce-lead').textContent = `${businesses.length} ${businesses.length === 1 ? 'negócio' : 'negócios'} da rede`;
  const categories = categoriesOf(businesses);
  if (categories.length) $('commerce-meta').textContent = categories.join(' · ');
}

initPage();
if (location.protocol !== 'file:') {
  load();
  renderNewsRow().catch((err) => console.warn('Notícias:', err));
  renderMapRow().catch((err) => console.warn('Mapa:', err));
  renderCommerceRow().catch((err) => console.warn('Comércio:', err));
}

// "Now" moves: the next activity changes (an activity stays next until an hour after it starts) and so does
// "hoje"/"amanhã" when the day turns. After a long absence the agenda is read again.
let hiddenAt = null;
function tick() {
  const dayTurned = dateKey(new Date()) !== dateKey(today);
  today = new Date();
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
