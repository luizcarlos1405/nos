// Writes the agenda as the calendar people subscribe to with "Salvar tudo na agenda" (FEED_FILE in
// js/config.js, an iCalendar file at the site's root), from every month of the agenda's folder
// (AGENDA_DIR) and with the site's own modules, so the feed and the page always agree. The file is
// committed and published with the site; the repository's pre-commit hook (.githooks/pre-commit) runs
// this on every commit, so it can't fall behind the agenda.
//
//   node tools/agenda-ics.mjs            writes FEED_FILE at the project's root
//   node tools/agenda-ics.mjs <file>     writes it elsewhere
//   node tools/agenda-ics.mjs --check    exits with 1 if the root's FEED_FILE is out of date
//
// The same agenda always gives the same file (its DTSTAMP is fixed), so git shows only real changes.
// Needs Node 22 or newer: the site's modules are plain ES modules, without a package.json.

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { FEED_FILE } from '../js/config.js';
import { buildCalendar } from '../js/ics.js';
import { AGENDA, allEvents, readFolder } from './folders.mjs';

const args = process.argv.slice(2);
const check = args.includes('--check');
const root = new URL('../', import.meta.url);
const out = args.find((arg) => !arg.startsWith('--')) || fileURLToPath(new URL(FEED_FILE, root));

let files;
try {
  ({ files } = await readFolder(root, AGENDA));
} catch (err) {
  console.error(`agenda-ics: ${err.message} ${FEED_FILE} was not written.`);
  process.exit(1);
}
const months = files.filter((file) => file.month);
const broken = months.filter((file) => file.missing.length);
if (broken.length) {
  for (const file of broken) console.error(`agenda-ics: ${AGENDA.path}${file.name} lacks the ${file.missing.join(' and ')} column${file.missing.length > 1 ? 's' : ''}.`);
  console.error(`agenda-ics: ${FEED_FILE} was not written.`);
  process.exit(1);
}
const events = allEvents(files);
const feed = buildCalendar(events, { feed: true, now: new Date(0) });

if (check) {
  const current = await readFile(out, 'utf8').catch(() => '');
  if (current === feed) process.exit(0);
  console.error(`agenda-ics: ${FEED_FILE} is out of date with ${AGENDA.path}. Rebuild it: node tools/agenda-ics.mjs`);
  process.exit(1);
}
await writeFile(out, feed);
const invalid = months.reduce((n, file) => n + file.invalid.length, 0);
const left = invalid ? ` (${invalid} row${invalid > 1 ? 's' : ''} left out: no title or date)` : '';
console.log(`agenda-ics: ${out}: ${events.length} activities from ${months.length} month${months.length === 1 ? '' : 's'}${left}`);
