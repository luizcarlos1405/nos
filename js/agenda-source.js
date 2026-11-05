// The agenda, read a month at a time. AGENDA_DIR (js/config.js) holds one CSV per month, AAAA-MM.csv,
// with the activities that start in that month (by "Dia"; a period that runs into the next month stays
// in the month it starts), sem-data.csv with the drafts that still have no date (hidden; no page reads
// it), and index.json, which the pre-commit hook writes from the month files (tools/agenda-data.mjs):
//
//   { "months": [{ "month": "2026-10", "until": "2026-11-08" }, …] }
//
// one entry per month with something to show, "until" being the last day its activities reach. A page
// reads the index, then only the months it shows from a first day on (its window): every month with an
// activity on that day or after (its "until" reaches it), so a period that started months ago is read
// while it runs. The agenda opens from the 1st of last month, the home from today; going back in time
// (an earlier month, "Ver atividades de setembro", the address of an old activity) moves the first day
// back and reads what that needs. No DOM: the pages pass their readers (agendaSource() in js/page.js),
// and the tools (tools/agenda-files.mjs) share the names and mergeEvents.

import { AGENDA_DIR } from './config.js';
import { buildEvents, lastDayKey } from './events.js';

export const INDEX_FILE = 'index.json';
export const UNDATED_FILE = 'sem-data.csv';
export const MONTH_FILE = /^\d{4}-(?:0[1-9]|1[0-2])\.csv$/;

// A file of the agenda's folder, as the pages address it: "data/agenda/2026-11.csv".
export const agendaPath = (file) => `${AGENDA_DIR.replace(/\/?$/, '/')}${file}`;

export const monthOf = (key) => key.slice(0, 7); // "2026-11-05" → "2026-11"
export const monthFile = (month) => `${month}.csv`;
export const firstDay = (month) => `${month}-01`;

// "2026-01", -1 → "2025-12"
export function addMonths(month, n) {
  const [y, m] = month.split('-').map(Number);
  const date = new Date(y, m - 1 + n, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

// The activities of several months as one list, in date order as buildEvents gives them. A day's
// activities all come from its month's file, so the sort (stable) keeps their order there.
export function mergeEvents(lists) {
  return lists.flat().sort((a, b) => a.date - b.date || (a.time ?? -1) - (b.time ?? -1));
}

// The index's months, oldest first; an entry that isn't { month: "AAAA-MM", until: "AAAA-MM-DD" } is
// left out.
export function indexMonths(data) {
  const list = Array.isArray(data?.months) ? data.months : [];
  return list
    .filter((entry) => /^\d{4}-\d{2}$/.test(entry?.month) && /^\d{4}-\d{2}-\d{2}$/.test(entry?.until))
    .map(({ month, until }) => ({ month, until }))
    .sort((a, b) => (a.month < b.month ? -1 : a.month > b.month ? 1 : 0));
}

// `readIndex()` resolves to { data, savedAt } (index.json, parsed), `readMonth(file)` to a sheet as
// readSheet in js/page.js gives it ({ headers, records, lines, savedAt }); both read fresh, and
// `savedAt` is set when what came back is a saved copy (offline, sw.js).
export function createAgenda({ readIndex, readMonth }) {
  let months = []; // the index's entries
  let indexSavedAt = null;
  let since = null; // the window's first day: every activity on it or after is read
  let sheets = new Map(); // month → { month, file, events, invalid, warnings, missing, savedAt }
  const reading = new Map(); // month → the promise of its sheet, while it is read
  let events = [];

  const needed = (day, list = months) => list.filter((entry) => entry.until >= day).map((entry) => entry.month);

  function read(month) {
    if (!reading.has(month)) {
      const file = monthFile(month);
      const job = readMonth(file).then(({ headers, records, lines, savedAt }) => ({ month, file, ...buildEvents(headers, records, lines), savedAt }));
      reading.set(month, job);
      const done = () => reading.delete(month);
      job.then(done, done);
    }
    return reading.get(month);
  }

  // What the window shows: the activities that reach its first day or later.
  function settle() {
    events = mergeEvents([...sheets.values()].sort((a, b) => (a.month < b.month ? -1 : 1)).map((sheet) => sheet.events))
      .filter((ev) => lastDayKey(ev) >= since);
  }

  // Reads the index and the months the window from `day` on needs, all of them or nothing.
  async function load(day) {
    const { data, savedAt } = await readIndex();
    const list = indexMonths(data);
    const loaded = await Promise.all(needed(day, list).map(read));
    months = list;
    indexSavedAt = savedAt;
    sheets = new Map(loaded.map((sheet) => [sheet.month, sheet]));
    since = day;
    settle();
  }

  return {
    get since() {
      return since;
    },
    // The window's activities, in date order.
    get events() {
      return events;
    },

    // Reads the agenda from `day` (a date key) on. Rejects if the index or one of those months can't
    // be read.
    open: (day) => load(day),

    // Reads the window again, the index too (a page left open a long while), or from `day` when
    // nothing could be read yet. Rejects if something can't be read, keeping what was read before.
    refresh: (day) => load(since ?? day),

    // Moves the window's first day back to `day`. When the months that needs are read already it moves
    // at once and returns null; otherwise it returns a promise that moves it once they are read, and
    // rejects, leaving the window as it was, if one can't be.
    extend(day) {
      if (since == null || day >= since) return null;
      const missing = needed(day).filter((month) => !sheets.has(month));
      if (!missing.length) {
        since = day;
        settle();
        return null;
      }
      return Promise.all(missing.map(read)).then((list) => {
        for (const sheet of list) sheets.set(sheet.month, sheet);
        if (day < since) since = day;
        settle();
      });
    },

    // The latest month before the window, to go back to ("Ver atividades de setembro"), or null when
    // the agenda has nothing older.
    older() {
      for (let i = months.length - 1; i >= 0; i--) if (firstDay(months[i].month) < since) return months[i].month;
      return null;
    },

    // Whether the index has this month ("2026-09").
    has: (month) => months.some((entry) => entry.month === month),

    // What the site couldn't read in the months read, each with its file: rows left out (`invalid`),
    // periods shown on their first day only (`warnings`), files without a required column (`missing`).
    problems() {
      const out = { invalid: [], warnings: [], missing: [] };
      for (const sheet of [...sheets.values()].sort((a, b) => (a.month < b.month ? -1 : 1))) {
        out.invalid.push(...sheet.invalid.map((row) => ({ ...row, file: sheet.file })));
        out.warnings.push(...sheet.warnings.map((row) => ({ ...row, file: sheet.file })));
        if (sheet.missing.length) out.missing.push({ file: sheet.file, columns: sheet.missing });
      }
      return out;
    },

    // The oldest of the saved copies read (offline), or null when everything came from the site.
    savedAt() {
      const stamps = [indexSavedAt, ...[...sheets.values()].map((sheet) => sheet.savedAt)].filter((stamp) => stamp && !isNaN(stamp));
      return stamps.length ? new Date(Math.min(...stamps)) : null;
    },
  };
}
