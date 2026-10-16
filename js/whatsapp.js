// Builds a WhatsApp-ready message for an event.
// WhatsApp formatting: *bold*, _italic_. Lines for empty fields are left out.

import { APP_NAME, CITY, HOME_CITY, SITE_URL } from './config.js';
import { formatDateRange, formatTimeRange, matchKey } from './events.js';

// Closing line added to every message — change it freely (or set to '' to remove).
export const CLOSING_LINE = `📅 Mais atividades na agenda do ${APP_NAME} ${HOME_CITY}${SITE_URL ? `: ${SITE_URL}` : ''}`;

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
