// The agenda in the person's own calendar: an activity as iCalendar text (RFC 5545) and as the
// "new event" forms of Google Agenda and Outlook, and the whole agenda as the calendar people
// subscribe to ("Salvar tudo na agenda"). No DOM: tools/agenda-ics.mjs writes the published feed
// (FEED_FILE) with this same code.

import { APP_NAME, CITY, FEED_FILE, HOME_CITY, SITE_URL, TIME_ZONE } from './config.js';
import { formatTimeRange, matchKey, orgFullName } from './events.js';

export const CALENDAR_NAME = `${APP_NAME} ${HOME_CITY}`;

// ---------- When ----------

const pad = (n) => String(n).padStart(2, '0');
const compact = (key) => key.replace(/-/g, ''); // "2026-11-02" → "20261102"

function nextKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + 1));
  return `${next.getUTCFullYear()}-${pad(next.getUTCMonth() + 1)}-${pad(next.getUTCDate())}`;
}

// When it happens, in Dourados' wall-clock time: all day (date keys, the end being the day after the
// last, as calendars count) or from a { key, minutes } to another. No time ("Horário a confirmar")
// and periods of several days take whole days (a period's hours go in the notes); a time without an
// end lasts an hour, as calendars do; an end before the start runs past midnight.
export function eventSpan(ev) {
  if (ev.time == null || ev.endDate) return { allDay: true, start: ev.dateKey, end: nextKey(ev.endDateKey || ev.dateKey) };
  let minutes = ev.endTime != null && ev.endTime !== ev.time ? ev.endTime : ev.time + 60;
  let key = ev.dateKey;
  if (minutes <= ev.time || minutes >= 1440) {
    key = nextKey(key);
    minutes %= 1440;
  }
  return { allDay: false, start: { key: ev.dateKey, minutes: ev.time }, end: { key, minutes } };
}

// A wall-clock time in Dourados as an instant. Intl knows the zone's offset (and daylight saving,
// should it come back), whatever the zone of the device reading the page.
const zoneClock = new Intl.DateTimeFormat('en-US', { timeZone: TIME_ZONE, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' });
function zoneOffset(ms) {
  const p = Object.fromEntries(zoneClock.formatToParts(new Date(ms)).map(({ type, value }) => [type, Number(value)]));
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute) - ms;
}
function instant({ key, minutes }) {
  const [y, m, d] = key.split('-').map(Number);
  const wall = Date.UTC(y, m - 1, d, Math.floor(minutes / 60), minutes % 60);
  return new Date(wall - zoneOffset(wall - zoneOffset(wall)));
}

const utcStamp = (date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); // 20261102T180000Z
const utcIso = (date) => date.toISOString().replace(/\.\d{3}/, ''); // 2026-11-02T18:00:00Z
const wallStamp = ({ key, minutes }) => `${compact(key)}T${pad(Math.floor(minutes / 60))}${pad(minutes % 60)}00`;

// ---------- What ----------

// Where, as calendars and maps read it: the place with its city ("…, Dourados/MS") unless it names
// it already; an online place as it is; without a place, only a city that isn't Dourados.
export function eventLocation(ev) {
  const local = ev.local.trim();
  if (!local) return ev.city;
  if (ev.online || matchKey(local).includes(matchKey(ev.city || HOME_CITY))) return local;
  return `${local}, ${ev.city || CITY}`;
}

// The activity on the site: agenda.html opens the one its address names after the #.
export const eventPage = (ev) => `${SITE_URL}/agenda.html#${ev.id}`;

// The calendar entry's notes: who organizes it and what it is, the hours a whole-day entry can't
// show, what the organizations say about it, how to reach them, and the way back to the agenda.
export function eventNotes(ev) {
  const lines = [];
  if (ev.cancelled) lines.push(`Atividade cancelada.${ev.cancelReason ? ` Motivo: ${ev.cancelReason}` : ''}`, '');
  if (ev.orgs.length) {
    const names = ev.orgs.map((org) => (orgFullName(org) ? `${org} (${orgFullName(org)})` : org));
    lines.push(`${ev.orgs.length > 1 ? 'Organizações' : 'Organização'}: ${names.join(', ')}`);
  }
  if (ev.type) lines.push(`Tipo: ${ev.type}`);
  if (eventSpan(ev).allDay) lines.push(formatTimeRange(ev) ? `Horário: ${formatTimeRange(ev)}` : 'Horário a confirmar');
  if (ev.description && !ev.cancelled) lines.push('', ev.description);
  const reach = [];
  if (ev.contact) reach.push(`Contato: ${ev.contact}`);
  if (ev.link) reach.push(`Link: ${ev.link}`);
  if (ev.source && ev.source !== ev.link) reach.push(`Fonte: ${ev.source}`);
  if (reach.length) lines.push('', ...reach);
  lines.push('', `Na agenda do ${CALENDAR_NAME}: ${eventPage(ev)}`);
  return lines.join('\n');
}

// ---------- iCalendar ----------

// Text values escape \ ; , and line breaks (RFC 5545, 3.3.11).
const text = (value) => value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

// A line longer than 75 octets goes on in the next one after a space, never inside a character.
function fold(line) {
  const parts = [];
  let current = '';
  let size = 0;
  for (const ch of line) {
    const code = ch.codePointAt(0);
    const bytes = code < 0x80 ? 1 : code < 0x800 ? 2 : code < 0x10000 ? 3 : 4;
    if (size + bytes > (parts.length ? 74 : 75)) {
      parts.push(current);
      current = '';
      size = 0;
    }
    current += ch;
    size += bytes;
  }
  parts.push(current);
  return parts.join('\r\n ');
}

const HOST = new URL(SITE_URL).host;

// One activity. Its UID is its id, so the subscribed calendar keeps each entry across updates; a
// cancelled one stays, marked as such.
function vevent(ev, stamp) {
  const span = eventSpan(ev);
  const lines = ['BEGIN:VEVENT', `UID:${ev.id}@${HOST}`, `DTSTAMP:${stamp}`];
  if (span.allDay) lines.push(`DTSTART;VALUE=DATE:${compact(span.start)}`, `DTEND;VALUE=DATE:${compact(span.end)}`);
  else lines.push(`DTSTART:${utcStamp(instant(span.start))}`, `DTEND:${utcStamp(instant(span.end))}`);
  lines.push(`SUMMARY:${text(ev.cancelled ? `Cancelada: ${ev.title}` : ev.title)}`);
  const location = eventLocation(ev);
  if (location) lines.push(`LOCATION:${text(location)}`);
  lines.push(`DESCRIPTION:${text(eventNotes(ev))}`, `URL:${eventPage(ev)}`);
  lines.push(`STATUS:${ev.cancelled ? 'CANCELLED' : 'CONFIRMED'}`, `TRANSP:${span.allDay ? 'TRANSPARENT' : 'OPAQUE'}`, 'END:VEVENT');
  return lines;
}

// A calendar file: one activity to import, or (`feed`) the whole agenda as the calendar people
// subscribe to, with its name and how often their apps should look for changes.
export function buildCalendar(events, { feed = false, now = new Date() } = {}) {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', `PRODID:-//${CALENDAR_NAME}//Agenda//PT`, 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
  if (feed) {
    lines.push(
      `X-WR-CALNAME:${text(CALENDAR_NAME)}`,
      `X-WR-CALDESC:${text(`Atividades das organizações de ${CITY}, da agenda do ${CALENDAR_NAME}: ${SITE_URL}/agenda.html`)}`,
      `X-WR-TIMEZONE:${TIME_ZONE}`,
      'REFRESH-INTERVAL;VALUE=DURATION:PT1H',
      'X-PUBLISHED-TTL:PT1H',
    );
  }
  const stamp = utcStamp(now);
  for (const ev of events) lines.push(...vevent(ev, stamp));
  lines.push('END:VCALENDAR');
  return `${lines.map(fold).join('\r\n')}\r\n`;
}

export const icsFilename = (ev) => `${APP_NAME.toLowerCase()}-${ev.id.replace(/^ev-/, '')}.ics`;

// ---------- Links ----------

const query = (params) => Object.entries(params).filter(([, value]) => value).map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join('&');

// Google Agenda's "new event" form, filled in: in Dourados' hours (ctz), or whole days. `phone`: the
// form phones get (the one the Android app opens too).
export function googleEventUrl(ev, { phone = false } = {}) {
  const span = eventSpan(ev);
  const dates = span.allDay ? `${compact(span.start)}/${compact(span.end)}` : `${wallStamp(span.start)}/${wallStamp(span.end)}`;
  const params = query({ action: phone ? 'TEMPLATE' : '', dates, ctz: span.allDay ? '' : TIME_ZONE, text: ev.title, location: eventLocation(ev), details: eventNotes(ev) });
  return `https://calendar.google.com/calendar/${phone ? 'render' : 'r/eventedit'}?${params}`;
}

// On Android, Chrome hands the same form to the Google Agenda app; without the app it opens it in
// the browser.
export const androidIntent = (url) => `intent://${url.replace(/^https:\/\//, '')}#Intent;scheme=https;package=com.google.android.calendar;S.browser_fallback_url=${encodeURIComponent(url)};end`;

// Outlook's (outlook.com) "new event" form, filled in. A whole-day entry ends on the day after its
// last on the desk and on the last day itself on phones: that is how each of its versions reads it.
export function outlookEventUrl(ev, { phone = false } = {}) {
  const span = eventSpan(ev);
  const [startdt, enddt] = span.allDay ? [span.start, phone ? ev.endDateKey || ev.dateKey : span.end] : [utcIso(instant(span.start)), utcIso(instant(span.end))];
  const params = query({ startdt, enddt, allday: span.allDay ? 'true' : '', subject: ev.title, location: eventLocation(ev), body: eventNotes(ev) });
  return `https://outlook.live.com/calendar/0/deeplink/compose?path=%2Fcalendar%2Faction%2Fcompose&rru=addevent&${params}`;
}

// The published feed: its https address for apps that take an address, webcal:// for the ones that
// subscribe on a tap, and the "add this calendar" pages of Google Agenda and Outlook.
export const feedUrl = () => `${SITE_URL}/${FEED_FILE}`;
export const webcalUrl = () => feedUrl().replace(/^https?:/, 'webcal:');
export const googleSubscribeUrl = () => `https://calendar.google.com/calendar/u/0/r?cid=${encodeURIComponent(webcalUrl())}`;
export const outlookSubscribeUrl = () => `https://outlook.live.com/calendar/0/addfromweb/?${query({ url: feedUrl(), name: CALENDAR_NAME })}`;
