// Turns raw CSV records into normalized event objects and formats dates/times in pt-BR.

import { HOME_CITY } from './config.js';

// Spreadsheet headers, matched without accents, case or spacing ("Horário de término" → horario_de_termino).
// The official headers are the first of each list; the rest are accepted variations
// (sheets copied from the Calendário de Luta used the English names).
const COLUMN_ALIASES = {
  title: ['titulo', 'nome', 'atividade', 'title'],
  day: ['dia', 'data', 'dia_inicial', 'data_inicial', 'day', 'date'],
  endDay: ['dia_final', 'data_final', 'ate', 'ate_o_dia', 'ultimo_dia', 'end_day', 'end_date'],
  time: ['horario', 'hora', 'inicio', 'horario_de_inicio', 'hora_de_inicio', 'time', 'start_time'],
  endTime: ['termino', 'fim', 'horario_de_termino', 'hora_de_termino', 'horario_final', 'horario_fim', 'hora_fim', 'end_time'],
  type: ['tipo', 'type'],
  org: ['organizacao', 'organizacoes', 'organizado_por', 'quem_organiza', 'realizacao', 'organization', 'org'],
  // "Categoria" is what the Instagram survey reports call an organization's sector.
  sector: ['setor', 'segmento', 'categoria', 'sector'],
  local: ['local', 'lugar', 'endereco', 'location'],
  city: ['cidade', 'municipio', 'city'],
  description: ['descricao', 'detalhes', 'description'],
  contact: ['contato', 'responsavel', 'contact'],
  link: ['link', 'url', 'site', 'inscricao'],
  source: ['fonte', 'origem', 'post', 'source'],
  visible: ['visivel', 'mostrar', 'publicar', 'visible'],
  cancelled: ['cancelado', 'cancelada', 'cancelled', 'canceled'],
  cancelReason: ['motivo_cancelamento', 'motivo_do_cancelamento', 'motivo_de_cancelamento', 'motivo', 'cancel_reason'],
};

const WEEKDAYS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

export function normalizeKey(key) {
  return key
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[\s-]+/g, '_');
}

// Looser key for names typed by people (sectors, organizations): punctuation doesn't count,
// so "Rural indigena luta pela terra" and "Rural, indígena, luta pela terra" are the same sector.
export function matchKey(text) {
  return normalizeKey(text || '').replace(/[^a-z0-9]+/g, ' ').trim();
}

function buildColumnMap(headers) {
  const map = {};
  for (const header of headers) {
    const key = normalizeKey(header);
    for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
      if (!map[field] && aliases.includes(key)) map[field] = header;
    }
  }
  return map;
}

const YEARLESS = /^\d{1,2}[/.-]\d{1,2}$/;

// Accepts "17/10/2026", "17/10/26" and "2026-10-17". A date without a year ("17/10") only counts
// when a reference year is given: the start "Dia" must carry its year, or it would mean another
// day after New Year; the "Dia final" may leave it out and takes the start's.
export function parseDay(value, referenceYear = null) {
  const v = value.trim();
  let y, m, d;

  let match = v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (match) {
    [, y, m, d] = match.map(Number);
  } else if ((match = v.match(/^(\d{1,2})[/.-](\d{1,2})(?:[/.-](\d{2}|\d{4}))?$/))) {
    d = Number(match[1]);
    m = Number(match[2]);
    if (match[3]) y = Number(match[3]) + (match[3].length === 2 ? 2000 : 0);
    else if (referenceYear != null) y = referenceYear;
    else return null;
  } else {
    return null;
  }

  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
  return date;
}

// Accepts "9h", "9h30", "9:30h", "09:00", "9", and what spreadsheets export from time cells:
// "14:00:00", "2:00:00 PM". Returns minutes since midnight or null.
export function parseTime(value) {
  const match = value.trim().toLowerCase().match(/^(\d{1,2})(?:\s*[h:]\s*(\d{2})?)?(?::\d{2})?\s*(?:h|min)?\s*(?:([ap])\.?\s*m\.?)?$/);
  if (!match) return null;
  let h = Number(match[1]);
  const min = match[2] ? Number(match[2]) : 0;
  if (match[3]) {
    if (h < 1 || h > 12) return null;
    h = (h % 12) + (match[3] === 'p' ? 12 : 0);
  }
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

export function formatTime(minutes) {
  if (minutes == null) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`;
}

// The start time as shown in lists: parsed when possible, else the raw cell text.
export function startTime(event) {
  return event.time != null ? formatTime(event.time) : event.timeRaw;
}

// "9h às 12h", "9h", "até 12h" (end only), or the raw text where it couldn't be parsed.
export function formatTimeRange(event) {
  const start = startTime(event);
  const end = event.endTime != null ? formatTime(event.endTime) : event.endTimeRaw;
  if (start && end) return `${start} às ${end}`;
  if (end) return `até ${end}`;
  return start || '';
}

export const weekdayName = (date) => WEEKDAYS[date.getDay()];
export const monthName = (monthIndex) => MONTHS[monthIndex];
export const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const pad = (n) => String(n).padStart(2, '0');

// "17/10"
export const formatDayMonth = (date) => `${pad(date.getDate())}/${pad(date.getMonth() + 1)}`;

// "sáb, 24/10"
export function formatTinyDate(date) {
  return `${weekdayName(date).slice(0, 3)}, ${formatDayMonth(date)}`;
}

// "Sábado, 17/10"
export function formatShortDate(date) {
  return `${capitalize(weekdayName(date))}, ${formatDayMonth(date)}`;
}

// "Sábado, 17 de outubro"
export function formatLongDate(date) {
  return `${capitalize(weekdayName(date))}, ${date.getDate()} de ${monthName(date.getMonth())}`;
}

// "Sex, 09/10 a Dom, 11/10" for multi-day activities, else the short date.
export function formatDateRange(event) {
  if (!event.endDate) return formatShortDate(event.date);
  const short = (d) => `${capitalize(weekdayName(d).slice(0, 3))}, ${formatDayMonth(d)}`;
  return `${short(event.date)} a ${short(event.endDate)}`;
}

// "Sexta, 9 de outubro a domingo, 11 de outubro" for multi-day activities, else the long date.
export function formatLongDateRange(event) {
  if (!event.endDate) return formatLongDate(event.date);
  return `${formatLongDate(event.date)} a ${formatLongDate(event.endDate).replace(/^./, (c) => c.toLowerCase())}`;
}

// Whole calendar days from `from` to `to` (both treated as local dates).
export function daysBetween(from, to) {
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const b = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((b - a) / 86400000);
}

// "hoje", "amanhã", "em 3 dias", "há 2 dias"
export function relativeDay(date, today = new Date()) {
  const diff = daysBetween(today, date);
  if (diff === 0) return 'hoje';
  if (diff === 1) return 'amanhã';
  if (diff === -1) return 'ontem';
  return diff > 0 ? `em ${diff} dias` : `há ${-diff} dias`;
}

export function dateKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function dateFromKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// Last day the activity runs (the start day for one-day activities).
export const lastDayKey = (event) => event.endDateKey || event.dateKey;

// Every day key the activity covers, start to end.
export function dayKeys(event) {
  if (!event.endDate) return [event.dateKey];
  const keys = [];
  for (let d = new Date(event.date); dateKey(d) <= event.endDateKey; d.setDate(d.getDate() + 1)) keys.push(dateKey(d));
  return keys;
}

export function slugify(text) {
  return normalizeKey(text)
    .replace(/[^a-z0-9_]/g, '')
    .replace(/_+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

// "Visível" is a checkbox column in the spreadsheet (exported as TRUE/FALSE). Only an explicit
// "no" hides a row: an empty cell, or a sheet without the column, keeps everything visible.
const HIDDEN_VALUES = new Set(['false', 'falso', 'nao', 'n', 'no', '0', 'off']);

export function isHidden(value) {
  return HIDDEN_VALUES.has(normalizeKey(value || ''));
}

// "Cancelado" is also a checkbox column. Here only an explicit "yes" counts: empty means it goes ahead.
const CHECKED_VALUES = new Set(['true', 'verdadeiro', 'sim', 's', 'yes', 'y', '1', 'x', 'on']);

export function isChecked(value) {
  return CHECKED_VALUES.has(normalizeKey(value || ''));
}

// "DCE UFGD, ADUF Dourados" → ["DCE UFGD", "ADUF Dourados"]. Main organizer first.
// Splits on "," and ";" outside parentheses, so "Fórum (arte, cultura)" stays one name.
export function splitOrgs(value) {
  const names = [];
  let depth = 0;
  let current = '';
  for (const ch of value || '') {
    if (ch === '(') depth++;
    if (ch === ')') depth = Math.max(0, depth - 1);
    if ((ch === ',' || ch === ';') && depth === 0) {
      names.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  names.push(current);
  return [...new Set(names.map((s) => s.trim()).filter(Boolean))];
}

// Empty or the home city (with or without the state: "Dourados/MS", "Dourados - MS",
// "Dourados (MS)") means "here"; anything else is shown as the activity's city.
function cityOf(value) {
  const city = (value || '').trim();
  if (!city) return '';
  const name = city.replace(/\s*(?:[/,(-]\s*)?\bMS\)?\s*$/i, '');
  return matchKey(name) === matchKey(HOME_CITY) ? '' : city;
}

// Online when the place starts with it: "Online", "On-line (Google Meet)"; not "Biblioteca Virtual",
// and not a hybrid "Online e presencial, na UFGD" (it has a place to go to).
const ONLINE = /^(?:online|on-line|virtual|remot[oa])\b(?!.*presencial)/i;

// Returns { events, invalid, warnings, missing }. Invalid rows (no title or no full date) are left
// out; warnings are rows that are shown but had a cell we could not read (an unreadable "Dia final");
// missing lists the required headers the sheet lacks (then nothing can be read at all).
// Rows marked as not visible are skipped silently (they are drafts, not errors).
// `lines` gives each record's spreadsheet row (header = 1), as parseCSV returns it.
export function buildEvents(headers, records, lines = []) {
  const col = buildColumnMap(headers);
  // Ids come from the date and the title, not the row: inserting a row above in the sheet must
  // not make an open activity turn into another one when the page reads the sheet again.
  const taken = new Map();
  const uniqueId = (base) => {
    const n = (taken.get(base) || 0) + 1;
    taken.set(base, n);
    return n === 1 ? base : `${base}-${n}`;
  };
  const missing = [['title', 'Título'], ['day', 'Dia']].filter(([field]) => !col[field]).map(([, label]) => label);
  if (missing.length) return { events: [], invalid: [], warnings: [], missing };

  const get = (record, field) => (col[field] ? record[col[field]] || '' : '');
  const events = [];
  const invalid = [];
  const warnings = [];

  records.forEach((record, index) => {
    if (isHidden(get(record, 'visible'))) return;

    const title = get(record, 'title');
    const dayRaw = get(record, 'day');
    const date = parseDay(dayRaw);
    const line = lines[index] ?? index + 2;

    if (!title || !date) {
      invalid.push({ line, title: title || '(sem título)', day: dayRaw || '(vazio)' });
      return;
    }

    // A last day only counts when it is a real date after the first one. Without a year it takes
    // the start's, or the next one when that would fall before the start ("28/12/2026" to "03/01").
    const endDayRaw = get(record, 'endDay');
    let endDate = endDayRaw ? parseDay(endDayRaw, date.getFullYear()) : null;
    // Only a short span crosses New Year ("28/12" to "03/01"); "10/10" to "05/10" is a typo, not a year.
    if (endDate && endDate < date && YEARLESS.test(endDayRaw.trim())) {
      const next = parseDay(endDayRaw, date.getFullYear() + 1);
      if (next && daysBetween(date, next) <= 62) endDate = next;
    }
    if (endDayRaw && (!endDate || endDate < date)) {
      warnings.push({ line, title, value: endDayRaw });
      endDate = null;
    }
    if (endDate && dateKey(endDate) === dateKey(date)) endDate = null;

    const timeRaw = get(record, 'time');
    const endTimeRaw = get(record, 'endTime');
    const orgRaw = get(record, 'org');
    const local = get(record, 'local');

    events.push({
      id: uniqueId(`ev-${dateKey(date)}-${slugify(title)}`),
      line,
      title,
      description: get(record, 'description'),
      type: get(record, 'type'),
      date,
      dateKey: dateKey(date),
      endDate,
      endDateKey: endDate ? dateKey(endDate) : null,
      timeRaw,
      time: timeRaw ? parseTime(timeRaw) : null,
      endTimeRaw,
      endTime: endTimeRaw ? parseTime(endTimeRaw) : null,
      org: orgRaw,
      orgs: splitOrgs(orgRaw),
      sector: get(record, 'sector'),
      local,
      city: cityOf(get(record, 'city')),
      online: ONLINE.test(local),
      contact: get(record, 'contact'),
      link: get(record, 'link'),
      source: get(record, 'source'),
      cancelled: isChecked(get(record, 'cancelled')),
      cancelReason: get(record, 'cancelReason').trim(),
    });
  });

  events.sort((a, b) => a.date - b.date || (a.time ?? -1) - (b.time ?? -1) || a.line - b.line);
  return { events, invalid, warnings, missing };
}
