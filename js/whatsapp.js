// Builds WhatsApp-ready messages: an activity's (Agenda), a story's (Notícias), a business's
// (Comércio, "Indicar no WhatsApp") and a place's (Mapa). WhatsApp formatting: *bold*, _italic_. Lines for empty fields are
// left out.

import { APP_NAME, CITY, HOME_CITY, SITE_URL } from './config.js';
import { formatDateRange, formatShortDate, formatTimeRange, matchKey } from './events.js';

// Closing lines added to every message, with the address of the page they come from — change them
// freely (or set to '' to remove).
export const CLOSING_LINE = `📅 Mais atividades na agenda do ${APP_NAME} ${HOME_CITY}${SITE_URL ? `: ${SITE_URL}/agenda.html` : ''}`;
export const COMMERCE_CLOSING_LINE = `🛍️ Mais negócios da rede no ${APP_NAME} ${HOME_CITY}${SITE_URL ? `: ${SITE_URL}/comercio.html` : ''}`;
export const NEWS_CLOSING_LINE = `📰 Mais notícias das organizações no ${APP_NAME} ${HOME_CITY}${SITE_URL ? `: ${SITE_URL}/noticias.html` : ''}`;
// The Mapa's: followed by the place's own address on the map (mapa.html#<id> opens it).
export const MAP_CLOSING_LINE = `🗺️ No mapa do ${APP_NAME} ${HOME_CITY}`;

// Where the activity happens, as the message header names it.
export function placeLabel(event) {
  if (event.online) return 'Online';
  return event.city || CITY;
}

// The 📍 line: the place, unless it only repeats what the header already says ("Online", the city).
function placeLine(event) {
  const local = event.local.trim();
  if (!local) return '';
  const header = matchKey(placeLabel(event));
  const same = matchKey(local) === header || (event.online && /^(?:online|on-line|virtual)$/i.test(local));
  return same ? '' : local;
}

// Text set inside *bold* or _italic_: its own * and _ would end the formatting early, so they
// become look-alikes that WhatsApp doesn't read as markup.
const literal = (text) => text.replace(/\*/g, '∗').replace(/_/g, '＿');

export function buildWhatsAppMessage(event) {
  const blocks = [];

  // A cancelled activity becomes a notice to the groups that were already invited:
  // the cancellation leads, and the description (what was planned) is left out.
  if (event.cancelled) {
    blocks.push(['❌ *ATIVIDADE CANCELADA*', event.cancelReason && `_Motivo: ${literal(event.cancelReason)}_`].filter(Boolean));
  }

  // The type (when there is one) and the place head every message, so it travels with its context.
  const place = placeLabel(event);
  blocks.push([event.type ? `🚩 *${literal(event.type.toUpperCase())}* · ${place}` : `🚩 ${place}`]);

  const head = [`*${literal(event.title)}*`];
  if (event.org) head.push(`👥 ${event.org}`);
  blocks.push(head);

  const when = [`📅 *${formatDateRange(event)}*`];
  const time = formatTimeRange(event);
  if (time) when.push(`⏰ ${time}`);
  const local = placeLine(event);
  if (local) when.push(`📍 ${local}`);
  blocks.push(when);

  if (event.description && !event.cancelled) blocks.push([event.description]);

  const extra = [];
  if (event.contact) extra.push(`📞 Fala com: ${event.contact}`);
  if (event.link) extra.push(`🔗 ${event.link}`);
  if (event.source && event.source !== event.link) extra.push(`📣 Fonte: ${event.source}`);
  if (extra.length) blocks.push(extra);

  if (CLOSING_LINE) blocks.push([CLOSING_LINE]);

  return blocks.map((lines) => lines.join('\n')).join('\n\n');
}

// A story passed on to a group: its kind and the city, the headline and who, the summary, its day and
// the post it came from.
export function buildNewsMessage(news) {
  const blocks = [[news.kind ? `📰 *${literal(news.kind.toUpperCase())}* · ${CITY}` : `📰 ${CITY}`]];
  const head = [`*${literal(news.title)}*`];
  if (news.org) head.push(`👥 ${news.org}`);
  blocks.push(head);
  if (news.summary) blocks.push([news.summary]);
  const facts = [`📅 ${formatShortDate(news.date)}`];
  if (news.source) facts.push(`📣 Fonte: ${news.source}`);
  blocks.push(facts);
  if (NEWS_CLOSING_LINE) blocks.push([NEWS_CLOSING_LINE]);
  return blocks.map((lines) => lines.join('\n')).join('\n\n');
}

// A business passed on to a group: who it is, what it offers, how to reach it, where it is.
export function buildBusinessMessage(biz) {
  const blocks = [[`*${literal(biz.name)}*`, biz.subtitle].filter(Boolean)];
  if (biz.offer) blocks.push([biz.offer]);

  const reach = [];
  for (const phone of biz.phones) reach.push(`${phone.mobile ? '💬 WhatsApp' : '📞 Telefone'}: ${phone.label}`);
  if (biz.instagram) reach.push(`📷 Instagram: ${biz.instagramHref}`);
  else if (biz.instagramNote) reach.push(`📷 Instagram: ${biz.instagramNote}`);
  for (const link of biz.links) reach.push(`🔗 ${link.label}: ${link.href}`);
  if (biz.contactNote) reach.push(`📞 Contato: ${biz.contactNote}`);
  if (biz.otherNote) reach.push(`🔗 Outras redes: ${biz.otherNote}`);
  reach.push(`📍 ${biz.address ? `${biz.address}, ` : ''}${biz.city || CITY}`);
  blocks.push(reach);

  if (COMMERCE_CLOSING_LINE) blocks.push([COMMERCE_CLOSING_LINE]);
  return blocks.map((lines) => lines.join('\n')).join('\n\n');
}

// Directions to a place, in the person's own maps app (Google Maps opens the app on phones).
export const directionsUrl = (place) => `https://www.google.com/maps/dir/?api=1&destination=${place.lngLat[1].toFixed(6)},${place.lngLat[0].toFixed(6)}`;

// A place of the Mapa passed on to a group: what and of which layer, where, when, who and how to reach it,
// the way there and the place on the map.
export function buildPlaceMessage(place) {
  const blocks = [[`*${literal(place.name)}* · ${place.layer.one}`, place.place].filter(Boolean)];
  const where = [`📍 ${[place.address, place.bairro].filter(Boolean).join(', ') || place.place || CITY}`];
  for (const line of place.when) where.push(`🕖 ${line}`);
  blocks.push(where);
  if (place.description) blocks.push([place.description]);
  const reach = [];
  if (place.who) reach.push(`👤 ${place.who}`);
  for (const phone of place.phones) reach.push(`${phone.mobile ? '💬 WhatsApp' : '📞 Telefone'}: ${phone.label}`);
  if (place.contactNote) reach.push(`📞 Contato: ${place.contactNote}`);
  if (place.instagram) reach.push(`📷 Instagram: ${place.instagramHref}`);
  if (place.link) reach.push(`🔗 ${place.link}`);
  reach.push(`🧭 Como chegar: ${directionsUrl(place)}`);
  blocks.push(reach);
  if (MAP_CLOSING_LINE) blocks.push([`${MAP_CLOSING_LINE}${SITE_URL ? `: ${SITE_URL}/mapa.html#${place.id}` : ''}`]);
  return blocks.map((lines) => lines.join('\n')).join('\n\n');
}

export function whatsAppShareUrl(message) {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

// Renders WhatsApp markup (*bold*, _italic_) as HTML for the in-page preview.
export function previewHtml(message) {
  const escaped = message
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return escaped
    .replace(/\*([^*\n]+)\*/g, '<strong>$1</strong>')
    .replace(/(^|\s)_([^_\n]+)_(?=\s|$)/g, '$1<em>$2</em>')
    .replace(/\n/g, '<br>');
}
