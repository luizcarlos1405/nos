// When a row was last checked against its source (its "Última revisão" column), and whether that was
// too long ago. Comércio (js/businesses.js) and the Mapa (js/places.js) show only rows reviewed within
// their period (COMMERCE_REVIEW_MONTHS and MAP_REVIEW_MONTHS in js/config.js): a business or a place
// nobody has confirmed for that long leaves the site by itself, until someone confirms it and writes the
// new date. The agenda and the news need none: their rows age by their own dates.

import { parseDay } from './events.js';

// "26/10/2026", "2026-10-26", and the form's stamp, "26/10/2026 10:20:40": that day, or null.
export function reviewDay(value) {
  const day = (value || '').trim().split(/\s+/)[0];
  return day ? parseDay(day) : null;
}

// The last day a row reviewed on `date` stays on the site: `months` later.
export function reviewDeadline(date, months) {
  return new Date(date.getFullYear(), date.getMonth() + months, date.getDate());
}

// True when the review is older than `months` (a missing date counts as never reviewed).
export function isStale(date, months, now = new Date()) {
  if (!date) return true;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return reviewDeadline(date, months) < today;
}
