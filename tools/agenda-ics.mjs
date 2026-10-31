// Writes the agenda as the calendar people subscribe to with "Salvar tudo na agenda" (FEED_FILE in
// js/config.js, an iCalendar file at the site's root), from the same sheet the site reads (CSV_URL)
// and with the site's own modules, so the feed and the page always agree. The file is committed and
// published with the site; the repository's pre-commit hook (.githooks/pre-commit) runs this on every
// commit, so it can't fall behind the agenda.
//
//   node tools/agenda-ics.mjs            writes FEED_FILE at the project's root
//   node tools/agenda-ics.mjs <file>     writes it elsewhere
//   node tools/agenda-ics.mjs --check    exits with 1 if the root's FEED_FILE is out of date
//   --local-only                         does nothing when CSV_URL is a published sheet (the hook's
//                                        mode: a commit can't follow a sheet's edits)
//
// The same agenda always gives the same file (its DTSTAMP is fixed), so git shows only real changes.
// Needs Node 22 or newer: the site's modules are plain ES modules, without a package.json.

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { CSV_URL, FEED_FILE } from '../js/config.js';
import { decodeCSV, parseCSV } from '../js/csv.js';
import { buildEvents } from '../js/events.js';
import { buildCalendar } from '../js/ics.js';

const args = process.argv.slice(2);
const check = args.includes('--check');
const localOnly = args.includes('--local-only');
const root = new URL('../', import.meta.url);
const out = args.find((arg) => !arg.startsWith('--')) || fileURLToPath(new URL(FEED_FILE, root));
const remote = /^https?:/i.test(CSV_URL);

if (remote && localOnly) {
  console.log(`agenda-ics: CSV_URL is a published sheet (${CSV_URL}); a commit can't follow its edits, so ${FEED_FILE} is not rebuilt here (see README, "Publicando").`);
  process.exit(0);
}

async function readAgenda() {
  if (!remote) return readFile(new URL(CSV_URL, root));
  const res = await fetch(CSV_URL);
  if (!res.ok) throw new Error(`${CSV_URL}: HTTP ${res.status}`);
  return res.arrayBuffer();
}

const { headers, records, lines } = parseCSV(decodeCSV(await readAgenda()));
const { events, invalid, missing } = buildEvents(headers, records, lines);
if (missing.length) {
  console.error(`agenda-ics: ${CSV_URL} lacks the ${missing.join(' and ')} column${missing.length > 1 ? 's' : ''}; ${FEED_FILE} was not written.`);
  process.exit(1);
}
const feed = buildCalendar(events, { feed: true, now: new Date(0) });

if (check) {
  const current = await readFile(out, 'utf8').catch(() => '');
  if (current === feed) process.exit(0);
  console.error(`agenda-ics: ${FEED_FILE} is out of date with ${CSV_URL}. Rebuild it: node tools/agenda-ics.mjs`);
  process.exit(1);
}
await writeFile(out, feed);
const left = invalid.length ? ` (${invalid.length} row${invalid.length > 1 ? 's' : ''} left out: no title or date)` : '';
console.log(`agenda-ics: ${out}: ${events.length} activities${left}`);
