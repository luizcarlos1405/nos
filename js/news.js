// Turns the news' CSV records (NEWS_DIR in js/config.js, one file per month, read by js/month-files.js)
// into news objects, as js/events.js does with the agenda's activities: each with its day, kind,
// headline, summary, story, organizations, source post and, when it leads to one, an activity of the
// agenda. No DOM: the tools (tools/month-files.mjs) check the same rows.

import { NEWS_KINDS } from './config.js';
import { dateKey, formatDayMonth, isChecked, isHidden, matchKey, normalizeKey, parseDay, slugify, splitOrgs, weekdayName } from './events.js';

// Headers, matched without accents, case or spacing; the official ones first.
const COLUMN_ALIASES = {
  title: ['titulo', 'manchete', 'title'],
  day: ['data', 'dia', 'date', 'day'],
  kind: ['tipo', 'kind', 'type'],
  org: ['organizacao', 'organizacoes', 'organization', 'org'],
  sector: ['setor', 'categoria', 'sector'],
  summary: ['resumo', 'summary'],
  text: ['texto', 'text'],
  source: ['fonte', 'origem', 'post', 'source'],
  activity: ['atividade', 'activity'],
  lead: ['destaque', 'lead'],
  visible: ['visivel', 'mostrar', 'publicar', 'visible'],
};

// Which header holds each field ({ title: 'Título', day: 'Data', … }).
export function newsColumnMap(headers) {
  const map = {};
  for (const header of headers) {
    const key = normalizeKey(header);
    for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
      if (!map[field] && aliases.includes(key)) map[field] = header;
    }
  }
  return map;
}

// "Texto" holds the story: paragraphs apart by a blank line (a line break inside a paragraph is a space).
const paragraphsOf = (text) => text.split(/\n\s*\n/).map((p) => p.replace(/\s*\n\s*/g, ' ').trim()).filter(Boolean);

// The kind as the chips name it: the plural of a known kind, the kind itself otherwise.
const KINDS = new Map(NEWS_KINDS.map((k, i) => [matchKey(k.name), { ...k, rank: i }]));
export const kindPlural = (kind) => KINDS.get(matchKey(kind))?.plural || kind;
export const kindRank = (kind) => KINDS.get(matchKey(kind))?.rank ?? KINDS.size;

// The post's author when its address says it: "https://www.instagram.com/simteddourados/p/…" → "@simteddourados".
export function sourceHandle(url) {
  const match = /instagram\.com\/([A-Za-z0-9._]+)\/(?:p|reel|reels|tv)\//i.exec(url || '');
  return match ? `@${match[1]}` : '';
}

// The stories as the page lists them: the newest day first, a day's stories in the order the file
// has them.
export const newestFirst = (list) => [...list].sort((a, b) => b.date - a.date || a.line - b.line);

// What the page leads with: the newest story marked "Destaque", else the newest one (home's door).
export const leadStory = (list) => {
  const sorted = newestFirst(list);
  return sorted.find((n) => n.lead) || sorted[0] || null;
};

// "qua, 28/10": a story's day on its card.
export const newsDay = (date) => `${weekdayName(date).slice(0, 3)}, ${formatDayMonth(date)}`;

// Returns { events, invalid, warnings, missing } like buildEvents, so the loader and the tools read both
// folders the same way: `events` are the news in date order (oldest first; the page lists them newest
// first). Rows without a title or a full date are reported; hidden rows (Visível unchecked) are drafts,
// skipped silently. Ids come from the day and the headline: nt-2026-10-28-slug, -2 for a repeat.
export function buildNews(headers, records, lines = []) {
  const col = newsColumnMap(headers);
  const missing = [['title', 'Título'], ['day', 'Data']].filter(([field]) => !col[field]).map(([, label]) => label);
  if (missing.length) return { events: [], invalid: [], warnings: [], missing };
  const get = (record, field) => (col[field] ? record[col[field]] || '' : '');
  const taken = new Map();
  const uniqueId = (base) => {
    const n = (taken.get(base) || 0) + 1;
    taken.set(base, n);
    return n === 1 ? base : `${base}-${n}`;
  };
  const events = [];
  const invalid = [];
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
    const org = get(record, 'org');
    events.push({
      id: uniqueId(`nt-${dateKey(date)}-${slugify(title)}`),
      line,
      title,
      date,
      dateKey: dateKey(date),
      kind: get(record, 'kind'),
      org,
      orgs: splitOrgs(org),
      sector: get(record, 'sector'),
      summary: get(record, 'summary'),
      paragraphs: paragraphsOf(get(record, 'text')),
      source: get(record, 'source'),
      activity: get(record, 'activity'),
      lead: isChecked(get(record, 'lead')),
    });
  });
  events.sort((a, b) => a.date - b.date || a.line - b.line);
  return { events, invalid, warnings: [], missing };
}
