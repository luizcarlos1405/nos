// The site's folders of month files read from disk for the tools, with the site's own modules: the
// agenda (AGENDA_DIR in js/config.js, js/events.js builds its rows) and the news (NEWS_DIR, js/news.js).
// Each file's text and rows, and what the site makes of them (js/month-files.js says how a folder is
// laid out). tools/month-files.mjs checks the folders and writes their index; tools/agenda-ics.mjs
// writes the feed from every month of the agenda.

import { readdir, readFile } from 'node:fs/promises';
import { AGENDA_DIR, NEWS_DIR } from '../js/config.js';
import { INDEX_FILE, MONTH_FILE, UNDATED_FILE, mergeEvents } from '../js/month-files.js';
import { decodeCSV, parseCSV } from '../js/csv.js';
import { buildColumnMap, buildEvents } from '../js/events.js';
import { buildNews, newsColumnMap } from '../js/news.js';

const slash = (dir) => dir.replace(/\/?$/, '/');

// Each folder: its path from the project's root ("data/agenda/"), how its rows become what the site
// shows, how its columns are found, and the name of the column that files a row in its month.
export const AGENDA = { path: slash(AGENDA_DIR), build: buildEvents, columns: buildColumnMap, dayLabel: 'Dia' };
export const NEWS = { path: slash(NEWS_DIR), build: buildNews, columns: newsColumnMap, dayLabel: 'Data' };
export const FOLDERS = [AGENDA, NEWS];

// Every CSV of the folder, the months first, then sem-data.csv: { name, month (null for sem-data.csv),
// text, headers, records, lines, events, invalid, warnings, missing }; and `strays`, the other files,
// which don't belong there (index.json aside; hidden files, such as the lock file a spreadsheet keeps
// beside an open file, are left out). `root` is the project's root (a file: URL ending in /).
export async function readFolder(root, folder) {
  const url = new URL(folder.path, root);
  let entries;
  try {
    entries = await readdir(url, { withFileTypes: true });
  } catch (err) {
    throw new Error(`${folder.path} can't be read (${err.code || err.message}): one CSV per month lives there.`);
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
    const text = decodeCSV(await readFile(new URL(name, url)));
    const sheet = parseCSV(text);
    files.push({ name, month: name === UNDATED_FILE ? null : name.slice(0, 7), text, ...sheet, ...folder.build(sheet.headers, sheet.records, sheet.lines) });
  }
  files.sort((a, b) => (a.month === null) - (b.month === null) || (a.name < b.name ? -1 : 1));
  return { folder: url, path: folder.path, files, strays: strays.sort() };
}

// What every month of a folder holds, in date order: the whole agenda, as the feed has it.
export const allEvents = (files) => mergeEvents(files.filter((file) => file.month).map((file) => file.events));
