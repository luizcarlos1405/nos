// Turns the Editais' CSV records (CALLS_CSV_URL in js/config.js: one file, a row per call) into call
// objects, as js/news.js does with the stories: each with its name, who runs it, its area and reach, its
// registration dates, the essentials (how much, who can apply), its links and when the team checked it.
// No DOM. The page (js/editais.js) places each call by its dates with callStatus(): open, opening soon,
// closed lately, or announced without a date yet.

import { CALL_AREAS, CALLS_CLOSED_DAYS, TIME_ZONE } from './config.js';
import { dateKey, daysBetween, formatDayMonth, formatTime, isHidden, matchKey, normalizeKey, parseDay, parseTime, slugify, weekdayName } from './events.js';

// Headers, matched without accents, case or spacing; the official ones first.
const COLUMN_ALIASES = {
  title: ['titulo', 'nome', 'title'],
  official: ['nome_oficial', 'official'],
  program: ['programa', 'program'],
  org: ['organizacao', 'quem_faz', 'organization', 'org'],
  body: ['orgao', 'body'],
  sector: ['setor', 'sector'],
  area: ['area'],
  reach: ['esfera', 'abrangencia', 'reach'],
  from: ['inscricoes_de', 'abre_em', 'from'],
  until: ['inscricoes_ate', 'prazo', 'until'],
  hour: ['horario', 'hora', 'hour'],
  resultOn: ['resultado_em'],
  value: ['valor', 'value'],
  who: ['quem_pode', 'who'],
  summary: ['resumo', 'summary'],
  call: ['edital', 'call'],
  page: ['pagina_oficial', 'pagina', 'page'],
  result: ['resultado', 'result'],
  activity: ['atividade', 'activity'],
  checked: ['conferido_em', 'conferido'],
  source: ['fonte', 'source'],
  visible: ['visivel', 'mostrar', 'publicar', 'visible'],
};

// Which header holds each field ({ title: 'Título', until: 'Inscrições até', … }).
export function callColumnMap(headers) {
  const map = {};
  for (const header of headers) {
    const key = normalizeKey(header);
    for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
      if (!map[field] && aliases.includes(key)) map[field] = header;
    }
  }
  return map;
}

// Dourados' clock as a local Date: its fields (the day, the hour) are the time in TIME_ZONE, whatever
// the zone of the device, so a call set to close at 17h in Dourados closes at 17h there for everyone.
const douradosClock = new Intl.DateTimeFormat('en-US', { timeZone: TIME_ZONE, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' });
export function douradosNow(date = new Date()) {
  const p = Object.fromEntries(douradosClock.formatToParts(date).map(({ type, value }) => [type, Number(value)]));
  return new Date(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
}

// Returns { calls, invalid, warnings, missing }: the calls in the file's order, the rows the page can't
// read (no title, or a date it can't parse), the rows it shows with something left out (a closing hour
// it can't read: the call then stays open to the end of its last day), and the required columns the
// file lacks. Hidden rows (Visível
// unchecked) are drafts, skipped silently. Ids come from the last day of registration and the name:
// ed-2026-11-23-slug (ed-sem-data-slug while there is no date), -2 for a repeat.
export function buildCalls(headers, records, lines = []) {
  const col = callColumnMap(headers);
  const missing = [['title', 'Título'], ['until', 'Inscrições até']].filter(([field]) => !col[field]).map(([, label]) => label);
  if (missing.length) return { calls: [], invalid: [], warnings: [], missing };
  const get = (record, field) => (col[field] ? (record[col[field]] || '').trim() : '');
  const taken = new Map();
  const uniqueId = (base) => {
    const n = (taken.get(base) || 0) + 1;
    taken.set(base, n);
    return n === 1 ? base : `${base}-${n}`;
  };
  const calls = [];
  const invalid = [];
  const warnings = [];
  records.forEach((record, index) => {
    if (isHidden(get(record, 'visible'))) return;
    const line = lines[index] ?? index + 2;
    const title = get(record, 'title');
    const dates = {};
    const unread = [];
    for (const [field, label] of [['from', 'Inscrições de'], ['until', 'Inscrições até'], ['resultOn', 'Resultado em'], ['checked', 'Conferido em']]) {
      const raw = get(record, field);
      dates[field] = raw ? parseDay(raw) : null;
      if (raw && !dates[field]) unread.push(`${label} “${raw}”`);
    }
    if (!title || unread.length) {
      invalid.push({ line, title: title || '(sem título)', problem: title ? `não deu para ler ${unread.join(', ')}` : 'falta o título' });
      return;
    }
    const hour = get(record, 'hour');
    if (hour && parseTime(hour) == null) warnings.push({ line, title, problem: `não deu para ler o Horário “${hour}” (escreva como 17h ou 17h30, no horário de Dourados): o edital aparece sem a hora e fica aberto até o fim do dia` });
    calls.push({
      id: uniqueId(`ed-${dates.until ? dateKey(dates.until) : 'sem-data'}-${slugify(title)}`),
      line,
      title,
      official: get(record, 'official'),
      program: get(record, 'program'),
      org: get(record, 'org'),
      body: get(record, 'body'),
      sector: get(record, 'sector'),
      area: get(record, 'area'),
      reach: get(record, 'reach'),
      ...dates,
      hour: hour ? parseTime(hour) : null,
      value: get(record, 'value'),
      who: get(record, 'who'),
      summary: get(record, 'summary'),
      call: get(record, 'call'),
      page: get(record, 'page'),
      result: get(record, 'result'),
      activity: get(record, 'activity'),
      source: get(record, 'source'),
    });
  });
  return { calls, invalid, warnings, missing };
}

// Where a call stands at `now`:
// - 'open': registration is on, its last day is today or later (past its closing hour on that day, it
//   counts as closed) and it has opened;
// - 'soon': its registration opens later;
// - 'closed': its last day passed less than CALLS_CLOSED_DAYS ago;
// - 'coming': announced, still without a last day;
// - null: closed longer ago, so it leaves the page (its row stays in the file).
export function callStatus(call, now = douradosNow()) {
  if (!call.until) return 'coming';
  const left = daysBetween(now, call.until);
  const pastHour = left === 0 && call.hour != null && now.getHours() * 60 + now.getMinutes() >= call.hour;
  if (left > 0 || (left === 0 && !pastHour)) return call.from && daysBetween(now, call.from) > 0 ? 'soon' : 'open';
  return -left <= CALLS_CLOSED_DAYS ? 'closed' : null;
}

// The lists as the page shows them: the open calls by deadline (the soonest first, then by the hour it
// closes), the ones opening soon by the day they open, the closed ones the most recent first, and the
// announced ones in the file's order.
export function groupCalls(calls, now = douradosNow()) {
  const groups = { open: [], soon: [], closed: [], coming: [] };
  for (const call of calls) {
    const status = callStatus(call, now);
    if (status) groups[status].push(call);
  }
  const byLine = (a, b) => a.line - b.line;
  groups.open.sort((a, b) => a.until - b.until || (a.hour ?? 1440) - (b.hour ?? 1440) || byLine(a, b));
  groups.soon.sort((a, b) => a.from - b.from || byLine(a, b));
  groups.closed.sort((a, b) => b.until - a.until || byLine(a, b));
  groups.coming.sort(byLine);
  return groups;
}

// The areas in CALL_AREAS' order (others after, by name), for the chips.
const AREAS = new Map(CALL_AREAS.map((area, i) => [matchKey(area), i]));
export const areaRank = (area) => AREAS.get(matchKey(area)) ?? AREAS.size;

// Where a call reaches, said when it isn't Dourados (Dourados first: other places are always labelled):
// '' for Dourados or an empty cell, else the cell as written ("MS", "Nacional").
export const reachLabel = (call) => (!call.reach || matchKey(call.reach) === 'dourados' ? '' : call.reach);
const isNational = (call) => matchKey(call.reach) === 'nacional';

// "seg, 23/11" and "segunda, 23/11".
export const tinyDay = (date) => `${weekdayName(date).slice(0, 3)}, ${formatDayMonth(date)}`;
export const longDay = (date) => `${weekdayName(date).replace('-feira', '')}, ${formatDayMonth(date)}`;

// The closing hour in Dourados' time, and Brasília's beside it for a national call (they set their
// deadlines in Brasília's time, one hour ahead of Mato Grosso do Sul): "às 17h de Dourados (18h de
// Brasília)"; '' when the call closes at the end of its day.
export function hourText(call) {
  if (call.hour == null) return '';
  if (!isNational(call)) return `às ${formatTime(call.hour)}`;
  return `às ${formatTime(call.hour)} de Dourados (${formatTime((call.hour + 60) % 1440)} de Brasília)`;
}

// How long is left: "faltam 5 dias", "fecha amanhã", "último dia".
export function leftText(call, now = douradosNow()) {
  const left = daysBetween(now, call.until);
  if (left <= 0) return 'último dia';
  return left === 1 ? 'fecha amanhã' : `faltam ${left} dias`;
}

// What a closed call says of its result: the team's line in "Resumo" when there is one; else "Saiu o
// resultado em 14/11" (only once the result's link is in the sheet: a forecast day alone says nothing
// came out), "Resultado previsto para 08/12", or "Saiu o resultado" (a link without a day).
export function resultText(call, now = douradosNow()) {
  if (call.summary) return call.summary;
  if (call.resultOn) return daysBetween(now, call.resultOn) > 0 || !call.result ? `Resultado previsto para ${formatDayMonth(call.resultOn)}` : `Saiu o resultado em ${formatDayMonth(call.resultOn)}`;
  return call.result ? 'Saiu o resultado' : '';
}

// "Quem pode" inside a sentence: its first letter in lower case unless it starts an acronym ("MEI e …").
export const inSentence = (text) => (/^[A-ZÀ-Ý][a-zà-ÿ]/.test(text) ? text.charAt(0).toLowerCase() + text.slice(1) : text);
