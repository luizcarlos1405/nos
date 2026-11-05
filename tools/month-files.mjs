// Keeps the site's month files in order and writes the index the pages read them by, for each folder
// of tools/folders.mjs: the agenda (AGENDA_DIR in js/config.js) and the news (NEWS_DIR). A folder holds
// one CSV per month, AAAA-MM.csv, with the rows whose day falls in it (the agenda's "Dia", the first day:
// a period that runs into the next month stays in the month it starts; the news' "Data"), and
// sem-data.csv with the drafts that still have no date, hidden; index.json lists the months with
// something to show and the last day each one's rows reach (js/month-files.js reads it). The
// repository's pre-commit hook (.githooks/pre-commit) runs this on every commit, on what is committed.
//
//   node tools/month-files.mjs          checks the folders and writes their index.json
//   node tools/month-files.mjs --check  only checks: exits with 1 on a problem or an out-of-date index
//   node tools/month-files.mjs --fix    first moves each row to the file it belongs in (a new month's
//                                       file gets the same header), then checks and writes index.json
//   node tools/month-files.mjs --list   prints each folder's index.json path (the hooks add them)
//
// A check fails on what would put a row out of sight or out of place: a file that is neither a month
// nor sem-data.csv; a header that lacks the title or the day, or isn't the same in every file of the
// folder; a row in another file than its day's month; a hidden row without a full date outside
// sem-data.csv; and what the site would leave out or show wrong (a visible row without a title or a full
// date, an agenda's "Dia final" it can't read). --fix only moves rows, as they are written (the same
// bytes), each before the first row of its new file dated later; a file the moves leave without rows is
// deleted. Needs Node 22 or newer, like tools/agenda-ics.mjs.

import { readFile, unlink, writeFile } from 'node:fs/promises';
import { INDEX_FILE, UNDATED_FILE, monthFile, monthOf } from '../js/month-files.js';
import { detectDelimiter, parseCSV } from '../js/csv.js';
import { dateKey, isHidden, lastDayKey, parseDay } from '../js/events.js';
import { MONTH_FOLDERS } from '../js/config.js';
import { FOLDERS, readFolder } from './folders.mjs';

const args = process.argv.slice(2);
const check = args.includes('--check');
const fix = args.includes('--fix');
const root = new URL('../', import.meta.url);

const say = (text) => console.log(`month-files: ${text}`);
const fail = (text) => console.error(`month-files: ${text}`);
const short = (text) => (text.length > 60 ? `${text.slice(0, 57)}…` : text);

// Where a row belongs: the file of its Dia's month, or sem-data.csv without a full date.
function homeOf(record, col) {
  const date = parseDay(record[col.day] || '');
  return date ? monthFile(monthOf(dateKey(date))) : UNDATED_FILE;
}

const hiddenRow = (record, col) => Boolean(col.visible) && isHidden(record[col.visible]);

// The file a row has to move to, or null when it is where it belongs, or when moving wouldn't help (a
// visible row without a date needs one first).
function destinationOf(record, col, name) {
  const home = homeOf(record, col);
  if (home === name || (home === UNDATED_FILE && !hiddenRow(record, col))) return null;
  return home;
}

// Everything to fix in the folder: { file, where, text, to, whole } (`to`: the file the row belongs in,
// when moving it there is the fix; `whole`: a problem of the file itself, which keeps rows from moving).
function problemsOf({ path, files, strays }, { columns, dayLabel }) {
  const problems = [];
  for (const name of strays) problems.push({ file: name, where: '', whole: true, text: `neither a month's file (AAAA-MM.csv) nor ${UNDATED_FILE}: move its rows into the folder's files, or take it out of ${path}` });
  const model = files.find((file) => !file.missing.length);
  for (const file of files) {
    if (file.missing.length) {
      problems.push({ file: file.name, where: ', its header', whole: true, text: `lacks the ${file.missing.join(' and ')} column${file.missing.length > 1 ? 's' : ''}` });
      continue;
    }
    if (file.headers.join('\n') !== model.headers.join('\n')) {
      problems.push({ file: file.name, where: ', its header', whole: true, text: `isn't the same as ${model.name}'s: every file of the folder has the same columns, in the same order` });
    }
    const col = columns(file.headers);
    file.records.forEach((record, i) => {
      const title = record[col.title] || '';
      const dayRaw = record[col.day] || '';
      const where = `, row ${file.lines[i]}${title ? ` ("${short(title)}")` : ''}`;
      const home = homeOf(record, col);
      const to = destinationOf(record, col, file.name);
      if (home !== UNDATED_FILE) {
        if (to) problems.push({ file: file.name, where, text: `its ${dayLabel}, ${dayRaw}, belongs in ${to}`, to });
      } else if (!hiddenRow(record, col)) {
        problems.push({ file: file.name, where, text: `${dayRaw ? `${dayLabel} "${dayRaw}" isn't a full date (dd/mm/aaaa)` : `no ${dayLabel}`}, so the site leaves it out: give it its date, or hide it (Visível FALSE) and keep it in ${UNDATED_FILE}` });
      } else if (to) {
        problems.push({ file: file.name, where, text: `hidden without a full date: it belongs in ${UNDATED_FILE}`, to });
      }
      if (!title && !hiddenRow(record, col)) problems.push({ file: file.name, where, text: 'no Título, so the site leaves it out' });
    });
    for (const warning of file.warnings) {
      problems.push({ file: file.name, where: `, row ${warning.line} ("${short(warning.title)}")`, text: `Dia final "${warning.value}" isn't a date after Dia, so the site shows only the first day` });
    }
  }
  return problems;
}

// index.json: each month with something to show, and the last day its activities reach.
function indexOf(files) {
  const months = files.filter((file) => file.month && file.events.length).map((file) => ({
    month: file.month,
    until: file.events.reduce((last, ev) => (lastDayKey(ev) > last ? lastDayKey(ev) : last), ''),
  }));
  const list = months.map((entry) => `    ${JSON.stringify(entry)}`).join(',\n');
  return `{\n  "months": [${list ? `\n${list}\n  ` : ''}]\n}\n`;
}

// ---------- --fix ----------

// A file's rows as they are written, without their line ends (a quoted cell may hold line breaks), one
// per row as js/csv.js counts them, blank rows included.
function rawRows(text, delimiter) {
  const rows = [];
  let start = 0;
  let quoted = false;
  let cellStart = true;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') i++;
        else quoted = false;
      }
      continue;
    }
    if (ch === '"' && cellStart) {
      quoted = true;
      cellStart = false;
    } else if (ch === delimiter) {
      cellStart = true;
    } else if (ch === '\n' || ch === '\r') {
      rows.push(text.slice(start, i));
      if (ch === '\r' && text[i + 1] === '\n') i++;
      start = i + 1;
      cellStart = true;
    } else {
      cellStart = false;
    }
  }
  if (start < text.length) rows.push(text.slice(start));
  return rows;
}

const lineEnd = (text) => /\r\n|\n|\r/.exec(text)?.[0] ?? '\r\n';

// Moves every row that `problems` sends elsewhere. Returns how many moved.
async function moveRows({ folder, path, files }, problems, { columns }) {
  if (!problems.some((problem) => problem.to)) return 0;
  if (problems.some((problem) => problem.whole)) {
    fail('rows can only move between files with the same header, and every file must be a month or sem-data.csv: fix those first (below).');
    return 0;
  }
  // Each file as its head (blank rows and the header) and its rows: { text, date } with the row's date
  // key (null: no full date; undefined: a blank row) and where it goes (`to`).
  const layout = new Map();
  let header = null;
  for (const file of files) {
    const raw = rawRows(file.text, detectDelimiter(file.text));
    const at = raw.findIndex((row) => parseCSV(row).headers.length);
    header ??= raw[at];
    const col = columns(file.headers);
    const rows = raw.slice(at + 1).map((text) => {
      const record = parseCSV(`${raw[at]}\n${text}`).records[0];
      if (!record) return { text, date: undefined };
      const date = parseDay(record[col.day] || '');
      return { text, date: date ? dateKey(date) : null, to: destinationOf(record, col, file.name), from: file.name, title: record[col.title] || '' };
    });
    layout.set(file.name, { head: raw.slice(0, at + 1), rows, eol: lineEnd(file.text), touched: false });
  }

  const moving = [];
  for (const file of layout.values()) {
    const stay = file.rows.filter((row) => !row.to);
    if (stay.length !== file.rows.length) {
      moving.push(...file.rows.filter((row) => row.to));
      file.rows = stay;
      file.touched = true;
    }
  }
  for (const row of moving) {
    if (!layout.has(row.to)) layout.set(row.to, { head: [header], rows: [], eol: '\r\n', touched: true });
    const target = layout.get(row.to);
    target.touched = true;
    // Before the first row dated later, or without a date; blank rows are passed over.
    const at = row.date ? target.rows.findIndex((other) => other.date !== undefined && (other.date === null || other.date > row.date)) : -1;
    target.rows.splice(at === -1 ? target.rows.length : at, 0, row);
    say(`${path}${row.from} → ${row.to}: ${row.title ? `"${short(row.title)}"` : 'a row'}${row.date ? `, ${row.date.split('-').reverse().join('/')}` : ''}`);
  }

  for (const [name, file] of layout) {
    if (!file.touched) continue;
    const url = new URL(name, folder);
    while (file.rows.length && file.rows[file.rows.length - 1].date === undefined) file.rows.pop();
    if (!file.rows.length) {
      await unlink(url);
      say(`${path}${name}: no rows left, removed`);
      continue;
    }
    await writeFile(url, `﻿${[...file.head, ...file.rows.map((row) => row.text)].join(file.eol)}${file.eol}`);
  }
  return moving.length;
}

// ---------- Run ----------

// Checks one folder (moving rows first with --fix) and writes its index. Returns false on a problem.
async function run(spec) {
  let agenda;
  try {
    agenda = await readFolder(root, spec);
  } catch (err) {
    fail(err.message);
    return false;
  }
  let problems = problemsOf(agenda, spec);
  if (fix && (await moveRows(agenda, problems, spec))) {
    agenda = await readFolder(root, spec);
    problems = problemsOf(agenda, spec);
  }
  if (problems.length) {
    for (const problem of problems) fail(`${agenda.path}${problem.file}${problem.where}: ${problem.text}`);
    if (!fix && problems.some((problem) => problem.to)) fail('node tools/month-files.mjs --fix moves rows to the file they belong in.');
    return false;
  }
  const index = indexOf(agenda.files);
  const indexUrl = new URL(INDEX_FILE, agenda.folder);
  const current = await readFile(indexUrl, 'utf8').catch(() => null);
  if (check) {
    if (current === index) return true;
    fail(`${agenda.path}${INDEX_FILE} is out of date with the month files. Rebuild it: node tools/month-files.mjs`);
    return false;
  }
  if (current !== index) await writeFile(indexUrl, index);
  const months = agenda.files.filter((file) => file.month);
  const shown = months.reduce((n, file) => n + file.events.length, 0);
  const undated = agenda.files.find((file) => !file.month)?.records.length ?? 0;
  say(`${agenda.path}: ${months.length} month${months.length === 1 ? '' : 's'}, ${shown} shown${undated ? `, ${undated} undated draft${undated === 1 ? '' : 's'} in ${UNDATED_FILE}` : ''}; ${INDEX_FILE} ${current === index ? 'up to date' : 'written'}`);
  return true;
}

if (args.includes('--list')) {
  for (const spec of FOLDERS) console.log(`${spec.path}${INDEX_FILE}`);
  process.exit(0);
}
// The pages' worker saves what js/config.js lists; the checks need each folder's builder here.
const listed = MONTH_FOLDERS.map((dir) => dir.replace(/\/?$/, '/'));
const known = FOLDERS.map((spec) => spec.path);
for (const dir of listed.filter((d) => !known.includes(d))) fail(`${dir} is in MONTH_FOLDERS (js/config.js) but has no entry in tools/folders.mjs (its builder, columns and day column).`);
for (const dir of known.filter((d) => !listed.includes(d))) fail(`${dir} has an entry in tools/folders.mjs but isn't in MONTH_FOLDERS (js/config.js), so the offline worker wouldn't save it.`);
if (listed.length !== known.length || listed.some((d) => !known.includes(d))) process.exit(1);

let ok = true;
for (const spec of FOLDERS) ok = (await run(spec)) && ok;
process.exit(ok ? 0 : 1);
