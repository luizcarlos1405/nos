// Sector colours. Every colour lives in css/theme.css as a custom property, so a theme only
// swaps variables; this module only decides which series (--role-series-1 … 8) a sector rides.

import { SECTOR_SERIES } from './config.js';
import { matchKey } from './events.js';

const SERIES_COUNT = 8;
const collator = new Intl.Collator('pt-BR', { sensitivity: 'base', numeric: true });

// Suggested sectors first, in the order of SECTOR_SERIES, then any other sector of the sheet.
const SECTOR_ORDER = Object.keys(SECTOR_SERIES).map(matchKey);
export function sectorRank(sector) {
  const i = SECTOR_ORDER.indexOf(matchKey(sector));
  return i === -1 ? SECTOR_ORDER.length : i;
}

// The sheet's sectors, once each, in that order: the chips' order, and the order colours are given in.
export function sectorsOf(events) {
  const seen = new Map();
  for (const ev of events) if (ev.sector && !seen.has(matchKey(ev.sector))) seen.set(matchKey(ev.sector), ev.sector);
  return [...seen.values()].sort((a, b) => sectorRank(a) - sectorRank(b) || collator.compare(a, b));
}

// The suggested sectors keep their series whatever else the sheet contains.
const fixed = new Map(Object.entries(SECTOR_SERIES).map(([name, n]) => [matchKey(name), n]));
const assigned = new Map();

// Gives each unlisted sector of the sheet a series of its own: first the series no listed sector
// uses, then those of listed sectors that are absent from the sheet, so colours don't collide
// while there are colours left.
export function assignSectorColors(sectors) {
  assigned.clear();
  const present = new Set(sectors.map(matchKey));
  const inUse = new Set([...fixed].filter(([key]) => present.has(key)).map(([, n]) => n));
  const pinned = new Set(fixed.values());
  const series = Array.from({ length: SERIES_COUNT }, (_, i) => i + 1);
  const free = [...series.filter((n) => !pinned.has(n)), ...series.filter((n) => pinned.has(n) && !inUse.has(n))];
  for (const sector of sectors) {
    const key = matchKey(sector);
    if (!key || fixed.has(key) || assigned.has(key)) continue;
    if (free.length) assigned.set(key, free.shift());
  }
}

// 1 … 8, or 0 when the activity has no sector. Falls back to a name hash when the series run out.
export function sectorSeries(sector) {
  const key = matchKey(sector);
  if (!key) return 0;
  if (fixed.has(key)) return fixed.get(key);
  if (assigned.has(key)) return assigned.get(key);
  let hash = 0;
  for (const ch of key) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return (hash % SERIES_COUNT) + 1;
}

// A CSS value, never a hex: set it as the --sector custom property of a node and style with var(--sector).
export function sectorColor(sector) {
  const n = sectorSeries(sector);
  return n ? `var(--role-series-${n})` : 'var(--role-no-sector)';
}

export function paintSector(node, sector) {
  node.style.setProperty('--sector', sectorColor(sector));
  return node;
}
