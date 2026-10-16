// National holidays, printed in red like Sundays, as Brazilian wall calendars do.
// Only holidays set by federal law; pontos facultativos (Carnaval, Corpus Christi) are left out.
// Local holidays can be added in EXTRA_HOLIDAYS (js/config.js).

import { EXTRA_HOLIDAYS } from './config.js';
import { dateKey } from './events.js';

// [month, day, full name, short name for small calendar cells]
const FIXED = [
  [1, 1, 'Confraternização Universal', 'Ano Novo'],
  [4, 21, 'Tiradentes', 'Tiradentes'],
  [5, 1, 'Dia do Trabalhador', 'Dia do Trabalhador'],
  [9, 7, 'Independência do Brasil', 'Independência'],
  [10, 12, 'Nossa Senhora Aparecida', 'N. Sra. Aparecida'],
  [11, 2, 'Finados', 'Finados'],
  [11, 15, 'Proclamação da República', 'República'],
  [11, 20, 'Dia da Consciência Negra', 'Consciência Negra'],
  [12, 25, 'Natal', 'Natal'],
];

// Easter Sunday (Gregorian calendar, anonymous algorithm).
function easter(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

const cache = new Map();

function holidaysOf(year) {
  if (cache.has(year)) return cache.get(year);
  const map = new Map();
  const add = (date, name, short) => map.set(dateKey(date), { name, short: short || name });
  for (const [m, d, name, short] of FIXED) add(new Date(year, m - 1, d), name, short);
  const goodFriday = easter(year);
  goodFriday.setDate(goodFriday.getDate() - 2);
  add(goodFriday, 'Sexta-feira Santa', 'Sexta-feira Santa');
  for (const { month, day, name, short } of EXTRA_HOLIDAYS) add(new Date(year, month - 1, day), name, short);
  cache.set(year, map);
  return map;
}

// { name, short } for a holiday, or null.
export function holidayOn(date) {
  return holidaysOf(date.getFullYear()).get(dateKey(date)) || null;
}

// Red-letter day: Sunday or holiday.
export const isRedLetter = (date) => date.getDay() === 0 || Boolean(holidayOn(date));
