// Minimal RFC 4180 CSV parser.
// Handles quoted fields (commas, line breaks, "" escapes), a UTF-8 BOM,
// and auto-detects "," or ";" (pt-BR spreadsheet exports use ";").

function detectDelimiter(text) {
  const firstLine = text.split(/\r?\n/, 1)[0] || '';
  const commas = (firstLine.match(/,/g) || []).length;
  const semicolons = (firstLine.match(/;/g) || []).length;
  return semicolons > commas ? ';' : ',';
}

// Every row of the file, blank ones included, so row numbers match the spreadsheet's.
function parseRows(text, delimiter) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }

    // A quote only opens a quoted field at its start: `TV 12" na sala` stays plain text.
    if (ch === '"' && field === '') {
      inQuotes = true;
    } else if (ch === delimiter) {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += ch;
    }
  }

  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

// Excel in Portuguese often saves CSV as Windows-1252 ("CSV separado por vírgulas") instead of UTF-8.
// Try strict UTF-8 first and fall back so accents survive either way.
export function decodeCSV(buffer) {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buffer);
  } catch {
    return new TextDecoder('windows-1252').decode(buffer);
  }
}

// Returns { headers, records, lines }: each record keyed by header, and lines[i] the spreadsheet
// row of records[i] (header = row 1). Blank rows are left out but still counted.
export function parseCSV(text) {
  const clean = text.replace(/^﻿/, '');
  const rows = parseRows(clean, detectDelimiter(clean));
  const blank = (cells) => cells.every((cell) => cell.trim() === '');
  const first = rows.findIndex((cells) => !blank(cells));
  if (first === -1) return { headers: [], records: [], lines: [] };

  const headers = rows[first].map((h) => h.trim());
  const records = [];
  const lines = [];
  rows.forEach((cells, index) => {
    if (index <= first || blank(cells)) return;
    const record = {};
    headers.forEach((h, i) => {
      record[h] = (cells[i] ?? '').trim();
    });
    records.push(record);
    lines.push(index + 1);
  });

  return { headers, records, lines };
}
