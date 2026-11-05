// The agenda's folder (AGENDA_DIR in js/config.js) read from disk for the tools, with the site's own
// modules: each file's text and rows, and the activities the site makes of them (js/agenda-source.js
// says how the folder is laid out). tools/agenda-data.mjs checks the files and writes the index;
// tools/agenda-ics.mjs writes the feed from every month.

import { readdir, readFile } from 'node:fs/promises';
import { AGENDA_DIR } from '../js/config.js';
import { INDEX_FILE, MONTH_FILE, UNDATED_FILE, mergeEvents } from '../js/agenda-source.js';
import { decodeCSV, parseCSV } from '../js/csv.js';
import { buildEvents } from '../js/events.js';

// The folder's path from the project's root, as messages name it ("data/agenda/").
export const AGENDA_PATH = AGENDA_DIR.replace(/\/?$/, '/');

// The folder in a checkout whose root is `root` (a file: URL ending in /).
export const agendaFolder = (root) => new URL(AGENDA_PATH, root);

// Every CSV of the folder, the months first, then sem-data.csv: { name, month (null for
// sem-data.csv), text, headers, records, lines, events, invalid, warnings, missing }; and `strays`, the
// other files, which don't belong there (index.json aside; hidden files, such as the lock file a
// spreadsheet keeps beside an open file, are left out).
export async function readAgenda(root) {
  const folder = agendaFolder(root);
  let entries;
  try {
    entries = await readdir(folder, { withFileTypes: true });
  } catch (err) {
    throw new Error(`${AGENDA_PATH} can't be read (${err.code || err.message}): the agenda lives there, one CSV per month.`);
  }
  const names = entries.filter((entry) => entry.isFile() && !entry.name.startsWith('.')).map((entry) => entry.name);
  const files = [];
  const strays = [];
  for (const name of names) {
    if (name === INDEX_FILE) continue;
    if (!MONTH_FILE.test(name) && name !== UNDATED_FILE) {
      strays.push(name);
      continue;
    }
    const text = decodeCSV(await readFile(new URL(name, folder)));
    const sheet = parseCSV(text);
    files.push({ name, month: name === UNDATED_FILE ? null : name.slice(0, 7), text, ...sheet, ...buildEvents(sheet.headers, sheet.records, sheet.lines) });
  }
  files.sort((a, b) => (a.month === null) - (b.month === null) || (a.name < b.name ? -1 : 1));
  return { folder, files, strays: strays.sort() };
}

// The activities of every month, in date order: the whole agenda, as the feed has it.
export const allEvents = (files) => mergeEvents(files.filter((file) => file.month).map((file) => file.events));
