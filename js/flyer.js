// Flyers: 1080 × 1350 PNGs in the site's tear-off calendar look (the red header card, day sheets
// with their binding strip and perforation, Barlow). Three layouts to pick from, plus the
// cancellation notice that every cancelled activity gets. Each layout turns an activity into a
// detached DOM node styled by css/flyers.css (.fl--<id>).
//
// Everything that depends on the text is planned here, without measuring the DOM: the glyph
// widths of the self-hosted fonts (below) break each text into lines, each layout picks its sizes
// from those lines, and the text is set in exactly those lines, one block per line that never
// wraps, at whole-pixel sizes. So the preview and the exported PNG are always the same picture.
// The fixed measures each layout plans with mirror css/flyers.css: change them together.
// Uses the global `htmlToImage` (js/vendor/html-to-image.js) for the export.

import { APP_FULL_NAME, APP_NAME, CITY } from './config.js';
import { capitalize, dateKey, dayKeys, formatDayMonth, formatTimeRange, formatTinyDate, monthName, slugify, weekdayName } from './events.js';
import { holidayOn, isRedLetter } from './holidays.js';
import { paintSector } from './colors.js';
import { brandMark, icon } from './icons.js';

export const FLYER_WIDTH = 1080;
export const FLYER_HEIGHT = 1350;

const HOME = CITY.split('/')[0];
const FOOTER_LINE = `Agenda das organizações de ${HOME}`;
const NBSP = '\u00a0';

// ---------- Text metrics ----------

// Advance widths in thousandths of an em, measured from fonts/*.woff2 with canvas at 1000px,
// kerning off: the printable ASCII range (space to tilde), then the signs of EXTRA_SIGNS.
// An accented letter counts as its base letter (as wide or a little wider). Kerning is left out:
// it makes real titles up to 1% narrower (7% in contrived capitals like "AVATAR VOLTA"), so the
// estimates run wide, the safe side; the 3% margin of FIT covers the rare pair that kerns wider.
const ADVANCES = {
  'barlow-500': [200, 328, 297, 669, 563, 839, 675, 145, 291, 291, 398, 495, 264, 400, 275, 426, 566, 352, 544, 524, 570, 523, 523, 481, 527, 525, 348, 312, 495, 495, 495, 482, 823, 630, 624, 607, 618, 598, 565, 613, 645, 260, 579, 616, 570, 715, 673, 622, 593, 582, 613, 588, 574, 641, 601, 878, 604, 585, 551, 393, 426, 393, 458, 498, 209, 517, 553, 526, 553, 536, 367, 543, 542, 255, 248, 512, 235, 826, 542, 555, 558, 558, 371, 487, 369, 538, 491, 743, 499, 476, 451, 329, 179, 329, 513],
  'barlow-600': [200, 335, 325, 677, 567, 833, 688, 155, 316, 316, 398, 491, 265, 404, 273, 447, 568, 353, 551, 531, 585, 530, 529, 488, 533, 527, 355, 314, 491, 491, 491, 500, 821, 648, 622, 608, 618, 592, 563, 613, 637, 262, 581, 620, 571, 715, 669, 621, 595, 587, 613, 591, 579, 636, 610, 878, 616, 599, 554, 403, 447, 403, 465, 509, 219, 522, 559, 531, 559, 541, 376, 549, 544, 255, 251, 522, 239, 829, 544, 556, 563, 563, 376, 493, 374, 541, 504, 761, 516, 489, 455, 350, 190, 350, 522],
  'barlow-700': [200, 344, 359, 687, 572, 825, 705, 168, 347, 347, 399, 486, 265, 409, 270, 473, 570, 354, 560, 540, 605, 539, 537, 496, 541, 531, 364, 316, 486, 486, 486, 521, 819, 671, 620, 608, 618, 584, 560, 612, 628, 263, 583, 626, 572, 715, 665, 621, 597, 593, 614, 595, 585, 629, 622, 877, 631, 617, 557, 416, 473, 416, 473, 523, 233, 528, 566, 537, 566, 546, 387, 556, 547, 255, 254, 533, 244, 835, 547, 557, 568, 568, 383, 502, 380, 545, 520, 783, 538, 504, 460, 376, 203, 376, 534],
  'condensed-600': [200, 269, 306, 606, 434, 772, 581, 152, 279, 279, 361, 439, 199, 325, 211, 386, 450, 274, 425, 426, 459, 428, 429, 392, 434, 423, 252, 218, 439, 439, 439, 413, 759, 456, 462, 457, 472, 435, 415, 462, 477, 224, 443, 477, 415, 538, 507, 467, 457, 455, 461, 434, 452, 478, 471, 665, 460, 456, 406, 330, 386, 330, 413, 405, 206, 434, 437, 422, 437, 426, 291, 431, 439, 215, 211, 433, 199, 665, 439, 432, 441, 441, 313, 398, 282, 438, 415, 592, 417, 403, 368, 319, 171, 319, 480],
  'condensed-700': [200, 279, 346, 616, 444, 766, 603, 170, 311, 311, 361, 438, 211, 331, 223, 415, 453, 284, 438, 436, 484, 439, 440, 407, 440, 435, 275, 232, 438, 438, 438, 437, 759, 482, 470, 464, 476, 438, 421, 467, 480, 230, 452, 491, 426, 548, 514, 473, 465, 461, 471, 444, 468, 479, 488, 689, 475, 474, 412, 345, 415, 345, 422, 421, 220, 446, 445, 434, 445, 436, 298, 441, 447, 219, 217, 449, 209, 675, 447, 442, 448, 448, 324, 412, 291, 447, 436, 613, 439, 423, 373, 344, 186, 344, 490],
  'condensed-800': [200, 289, 385, 626, 454, 761, 624, 188, 343, 343, 362, 437, 223, 337, 235, 444, 456, 294, 451, 446, 508, 450, 451, 422, 446, 446, 298, 246, 437, 437, 437, 462, 760, 508, 477, 470, 480, 441, 427, 473, 483, 235, 462, 505, 437, 558, 522, 479, 474, 467, 481, 454, 485, 480, 506, 707, 490, 492, 419, 360, 444, 360, 432, 437, 234, 457, 453, 445, 453, 446, 305, 451, 455, 223, 223, 465, 219, 685, 455, 452, 456, 456, 336, 426, 299, 455, 456, 635, 462, 442, 377, 370, 201, 370, 500],
};
const EXTRA_SIGNS = 'ªº–—…“”‘’·•°«»×÷±²³¹½¼¾§©®™€£¢¥¿¡µ¶″‹›¨´¸¯¬¦\u00a0\u202f\u2009\u200a\u2007';
const EXTRA_ADVANCES = {
  'barlow-500': [326, 358, 460, 676, 815, 301, 301, 163, 163, 219, 311, 379, 529, 529, 430, 495, 495, 332, 323, 188, 798, 813, 907, 468, 850, 449, 662, 635, 609, 526, 687, 482, 328, 548, 594, 352, 353, 383, 360, 209, 151, 278, 495, 179, 200, 100, 200, 63, 566],
  'barlow-600': [327, 358, 467, 668, 831, 329, 329, 181, 181, 226, 314, 378, 520, 520, 437, 491, 491, 337, 323, 190, 800, 819, 911, 479, 835, 447, 665, 635, 610, 531, 687, 500, 335, 549, 608, 373, 345, 368, 375, 219, 159, 285, 491, 190, 200, 100, 200, 63, 568],
  'barlow-700': [330, 356, 476, 659, 851, 363, 363, 204, 204, 235, 317, 376, 509, 509, 446, 486, 486, 343, 324, 194, 802, 826, 916, 494, 817, 445, 670, 634, 613, 537, 686, 521, 344, 551, 625, 401, 335, 347, 394, 233, 169, 294, 486, 203, 200, 100, 200, 63, 570],
  'condensed-600': [286, 290, 377, 593, 679, 316, 316, 165, 165, 215, 302, 359, 463, 463, 389, 439, 439, 258, 275, 153, 682, 697, 771, 419, 807, 435, 532, 495, 512, 422, 528, 413, 269, 443, 498, 349, 298, 311, 346, 206, 140, 391, 439, 171, 200, 100, 200, 63, 450],
  'condensed-700': [292, 295, 380, 593, 709, 352, 352, 188, 188, 225, 306, 359, 459, 459, 399, 438, 438, 266, 282, 157, 691, 716, 793, 437, 791, 434, 542, 500, 517, 434, 531, 437, 279, 450, 514, 380, 292, 300, 369, 220, 151, 335, 438, 186, 200, 100, 200, 63, 453],
  'condensed-800': [298, 301, 383, 593, 739, 389, 389, 211, 211, 235, 310, 359, 454, 454, 409, 437, 437, 273, 289, 161, 701, 735, 815, 454, 776, 433, 552, 505, 522, 445, 534, 462, 289, 458, 530, 410, 285, 290, 391, 234, 162, 280, 437, 201, 200, 100, 200, 63, 456],
};
const EXTRA_INDEX = new Map([...EXTRA_SIGNS].map((sign, i) => [sign, i]));
// Drawn with no width of their own: combining accents (over their letter), zero-width spaces and
// joiners, the soft hyphen, variation selectors, the keycap mark and the skin tones and tags
// inside an emoji.
const ZERO_WIDTH = /[\u0300-\u036f\u00ad\u200b-\u200f\u2060\u20e3\ufe00-\ufe0f\u{1f3fb}-\u{1f3ff}\u{e0020}-\u{e007f}]/u;
const PICTOGRAPH = /\p{Extended_Pictographic}/u;
const FLAG_HALF = /\p{Regional_Indicator}/u;
// Colour emoji are 1.25em wide (Noto Color Emoji, measured): counted a little wider. Any other
// sign the fonts lack (other scripts, rare symbols) counts as a full em.
const EMOJI = 1300;
const UNKNOWN = 1000;

// Lines are filled up to this share of their box, a margin for rounding in the browser.
const FIT = 0.97;

const TITLE_FONT = { face: 'barlow-700', track: -0.013 };
const ORG_FONT = { face: 'barlow-600' };
const PLACE_FONT = { face: 'barlow-500' };
const TAG_FONT = { face: 'condensed-700', size: 34, track: 0.015 };

const advanceCache = new Map();

function advance(text, face) {
  const key = `${face}\u0000${text}`;
  if (advanceCache.has(key)) return advanceCache.get(key);
  const ascii = ADVANCES[face];
  const extra = EXTRA_ADVANCES[face];
  const signs = [...text.normalize('NFD')];
  let units = 0;
  signs.forEach((sign, i) => {
    if (ZERO_WIDTH.test(sign)) return;
    const code = sign.codePointAt(0);
    // Shown as an emoji: a pictograph the fonts lack, or any sign asked to (U+FE0F, a keycap).
    if (signs[i + 1] === '\ufe0f' || signs[i + 1] === '\u20e3' || (PICTOGRAPH.test(sign) && !EXTRA_INDEX.has(sign))) units += EMOJI;
    else if (code >= 32 && code < 127) units += ascii[code - 32];
    else if (EXTRA_INDEX.has(sign)) units += extra[EXTRA_INDEX.get(sign)];
    else units += FLAG_HALF.test(sign) ? EMOJI / 2 : UNKNOWN;
  });
  if (advanceCache.size > 5000) advanceCache.clear();
  advanceCache.set(key, units);
  return units;
}

// Width in px of one line of text. A font is { face, size, track }, track in em (letter-spacing).
function textWidth(text, { face, size, track = 0 }) {
  return (advance(text, face) * size) / 1000 + track * size * [...text].length;
}

// The whole-pixel size at which one line of text fills `width`, kept between `min` and `max`.
function sizeToWidth(text, font, width, max, min) {
  const perPixel = textWidth(text, { ...font, size: 1 });
  return Math.max(min, Math.min(max, Math.floor((width * FIT) / perPixel)));
}

// ---------- Line planning ----------

// Spaces are the break points; a no-break space keeps its neighbours together.
const words = (text) => text.trim().split(/[ \t\r\n]+/).filter(Boolean);

// Where a word too wide for the line may break, as browsers do: after a slash or a hyphen (links,
// compounds) and before an emoji (unless a joiner ties it to the one before).
function breakPoints(word) {
  const signs = [...word];
  const pieces = [];
  let piece = '';
  signs.forEach((sign, i) => {
    if (piece && PICTOGRAPH.test(sign) && signs[i - 1] !== '\u200d' && !/[/-]$/.test(piece)) {
      pieces.push(piece);
      piece = '';
    }
    piece += sign;
    if ((sign === '/' || sign === '-') && i < signs.length - 1 && !/[/-]/.test(signs[i + 1])) {
      pieces.push(piece);
      piece = '';
    }
  });
  return piece ? [...pieces, piece] : pieces;
}

// A piece too wide for any line, cut between letters into pieces that fit; a plain word gets a
// hyphen at each cut.
function splitLetters(piece, font, limit) {
  const hyphen = /^[\p{L}\p{M}]+$/u.test(piece) ? '-' : '';
  const parts = [];
  let part = '';
  for (const sign of piece) {
    if (part && textWidth(part + sign + hyphen, font) > limit) {
      parts.push(part + hyphen);
      part = '';
    }
    part += sign;
  }
  return [...parts, part];
}

// The text as break units { text, width, glued } (glued: no space before it, the rest of a word).
// A word wider than the line breaks at its break points; with `force`, a piece still too wide
// breaks between letters, the last resort once no smaller size is left to try.
function unitsOf(text, font, limit, force = false) {
  const units = [];
  for (const word of words(text)) {
    const pieces = textWidth(word, font) > limit ? breakPoints(word) : [word];
    pieces.forEach((piece, i) => {
      let glued = i > 0;
      for (const part of force && textWidth(piece, font) > limit ? splitLetters(piece, font, limit) : [piece]) {
        units.push({ text: part, width: textWidth(part, font), glued });
        glued = true;
      }
    });
  }
  return units;
}

const joinUnits = (units) => units.map((unit, i) => (i > 0 && !unit.glued ? ' ' : '') + unit.text).join('');

// Short words that read badly at the end of a line ("Caminhada Ecológica de / Dourados"), the
// shorter the worse: "para a / Aldeia" hurts more than "de / Dourados", which hurts more than
// "para / a Aldeia".
const WEAK = new Set('a à ao aos as às o os e é de da do das dos em no na nos nas num numa com por pra pro para pelo pela pelos pelas um uma ou sem sob até que se'.split(' '));
const isWeak = (word) => WEAK.has(word.toLocaleLowerCase('pt-BR'));
const weakness = (word) => (!isWeak(word) ? 0 : word.length === 1 ? 1 : word.length <= 3 ? 0.6 : 0.3);
// Emoji alone on a line read as stray as short words alone ("FESTA DA PRIMAVERA / 🌸🎉 / …").
const EMOJI_ONLY = /^(?:\p{Extended_Pictographic}|[\u200d\ufe0f\u20e3\u{1f3fb}-\u{1f3ff}])+$/u;
const isFiller = (word) => isWeak(word) || EMOJI_ONLY.test(word);

// What a line break costs, against 100 for a line left empty: after a short word (times its
// weakness), a line of nothing but short words, inside a word (after a slash or hyphen, or
// between letters); a break between clauses ("Baile dos Educadores –" over "Festa Tropical",
// "Dourados vem pra rua:" over "ato pela democracia", an address before its parenthesis) earns a
// little back.
const COST = { weakEnd: 60, weakLine: 200, inWord: 60, clause: -10 };
const CLAUSE_END = /[,;:.!?–—-]$/;

// Greedy fill, as a browser breaks: the fewest lines. Returns [start, end) unit ranges.
function fill(units, font, limit) {
  const space = textWidth(' ', font);
  const ranges = [];
  let start = 0;
  let used = 0;
  units.forEach((unit, i) => {
    const gap = unit.glued ? 0 : space;
    if (i > start && used + gap + unit.width > limit) {
      ranges.push([start, i]);
      start = i;
      used = unit.width;
    } else {
      used += (i > start ? gap : 0) + unit.width;
    }
  });
  if (units.length) ranges.push([start, units.length]);
  return ranges;
}

// The units in exactly `count` lines, evened out: the least sum of squared slack (every line, as
// text-wrap: balance does, or all but the last when `ragged`), plus the cost of the breaks that
// read badly. Returns [start, end) unit ranges.
function evenLines(units, font, limit, count, ragged) {
  const n = units.length;
  if (count <= 1 || n <= 1) return [[0, n]];
  const space = textWidth(' ', font);
  const edge = [0];
  const weak = [0];
  const ends = units.map((unit) => (unit.glued ? 0 : weakness(unit.text)));
  units.forEach((unit, i) => {
    edge.push(edge[i] + (i > 0 && !unit.glued ? space : 0) + unit.width);
    weak.push(weak[i] + (ends[i] > 0 || EMOJI_ONLY.test(unit.text) ? 1 : 0));
  });
  const lineCost = (i, j) => {
    const width = edge[j] - edge[i] - (i > 0 && !units[i].glued ? space : 0);
    if (width > limit && j - i > 1) return Infinity;
    let cost = ragged && j === n ? 0 : 100 * ((limit - Math.min(width, limit)) / limit) ** 2;
    if (width > limit) cost += 1000; // one unit wider than the line: only when nothing else will do
    if (j < n && units[j].glued) cost += COST.inWord;
    else if (j < n && (CLAUSE_END.test(units[j - 1].text) || units[j].text.startsWith('('))) cost += COST.clause;
    if (j < n) cost += COST.weakEnd * ends[j - 1];
    if (weak[j] - weak[i] === j - i) cost += COST.weakLine;
    return cost;
  };
  // best[k][j]: the least cost of units [0, j) in k lines; from[k][j]: where its last line starts.
  const best = Array.from({ length: count + 1 }, () => new Array(n + 1).fill(Infinity));
  const from = Array.from({ length: count + 1 }, () => new Array(n + 1).fill(0));
  best[0][0] = 0;
  for (let k = 1; k <= count; k++) {
    for (let j = k; j <= n; j++) {
      for (let i = k - 1; i < j; i++) {
        if (best[k - 1][i] === Infinity) continue;
        const cost = best[k - 1][i] + lineCost(i, j);
        if (cost < best[k][j]) {
          best[k][j] = cost;
          from[k][j] = i;
        }
      }
    }
  }
  if (best[count][n] === Infinity) return fill(units, font, limit);
  const ranges = [];
  for (let k = count, j = n; k > 0; k--) {
    ranges.unshift([from[k][j], j]);
    j = from[k][j];
  }
  return ranges;
}

// The text in the fewest lines no wider than `width` (less the FIT margin): evened out (titles,
// rows), `ragged` (the first lines kept full, as a struck title in the design) or `greedy` (a
// paragraph, filled as a browser would).
function planLines(text, font, width, { ragged = false, greedy = false, force = false } = {}) {
  const limit = width * FIT;
  const units = unitsOf(text, font, limit, force);
  if (!units.length) return [];
  const filled = fill(units, font, limit);
  const ranges = greedy ? filled : evenLines(units, font, limit, filled.length, ragged);
  return ranges.map(([i, j]) => joinUnits(units.slice(i, j)));
}

// How many lines the text takes, at the fewest.
function lineCount(text, font, width, force = false) {
  const limit = width * FIT;
  return fill(unitsOf(text, font, limit, force), font, limit).length;
}

// True when every word fits on a line by itself (links and compounds may break after / and -).
function wordsFit(text, font, width) {
  const limit = width * FIT;
  return unitsOf(text, font, limit).every((unit) => unit.width <= limit);
}

// The planned lines at this size, or null when a word doesn't fit or they are more than maxLines.
function fitLines(text, font, width, maxLines, layout) {
  if (!wordsFit(text, font, width) || lineCount(text, font, width) > maxLines) return null;
  return planLines(text, font, width, layout);
}

// How badly planned lines read: lines ending in a short word (summing their weakness), lines of
// nothing but short words or emoji.
function badBreaks(lines) {
  const split = lines.map((line) => line.split(' '));
  return {
    weakEnds: sum(split.slice(0, -1).map((list) => weakness(list[list.length - 1]))),
    weakLines: lines.length > 1 ? split.filter((list) => list.every(isFiller)).length : 0,
  };
}

// Runaway text cut to `maxLines` with an ellipsis (and `tail` after it: the city after a place).
// It ends at the last clause that fits (before ; , a dash or a parenthesis) unless that keeps less
// than half of what ending at the last word that fits keeps; failing both, between letters.
function cut(text, font, width, maxLines, tail = '', force = false) {
  const fits = (t) => lineCount(t, font, width, force) <= maxLines;
  if (fits(text + tail)) return text + tail;
  const close = (head) => `${head.replace(/[\s,;:.·–—-]+$/u, '')}…${tail}`;
  const list = words(text);
  let byWord = '';
  for (let n = list.length - 1; n > 0 && !byWord; n--) {
    const head = list.slice(0, n).join(' ');
    if (fits(close(head))) byWord = head;
  }
  let byClause = '';
  for (const { index } of [...text.matchAll(/[;,](?=\s)|\s(?=[(–—]|-\s)/gu)].reverse()) {
    if (index > 0 && fits(close(text.slice(0, index)))) {
      byClause = text.slice(0, index);
      break;
    }
  }
  if (byClause && byClause.length * 2 >= byWord.length) return close(byClause);
  if (byWord) return close(byWord);
  // Not even the first word fits: a place gives way to its city, anything else is cut in the word.
  if (tail) return cut(tail.replace(/^,\s*/, ''), font, width, maxLines, '', force);
  let head = list[0] || '';
  while ([...head].length > 1 && !fits(close(head))) head = [...head].slice(0, -1).join('');
  return close(head);
}

// The first of `steps` ([size, maxLines], largest first) at which the text fits its lines with no
// word broken. Past the steps the size goes on down, 2px at a time to `floor`, while the longest
// word is wider than the line; then the text is cut to the last step's lines, and at the floor a
// word still too wide breaks between letters. `tail` stays whole after a cut (the city of a
// place); `ragged` keeps the first lines full. Returns { text, size, font, lines }.
function pickSize(text, font, width, steps, { floor, tail = '', ragged = false } = {}) {
  for (const [size, maxLines] of steps) {
    const sized = { ...font, size };
    const lines = fitLines(text + tail, sized, width, maxLines, { ragged });
    if (lines) return { text: text + tail, size, font: sized, lines };
  }
  const [last, maxLines] = steps[steps.length - 1];
  let size = last;
  while (size > (floor ?? last) && !wordsFit(text + tail, { ...font, size }, width)) size -= 2;
  const sized = { ...font, size };
  const force = !wordsFit(text + tail, sized, width);
  const shown = cut(text, sized, width, maxLines, tail, force);
  return { text: shown, size, font: sized, lines: planLines(shown, sized, width, { ragged, force }) };
}

// Text at a set size in at most `maxLines`: cut when longer, a word too wide broken between letters.
function setLines(text, font, width, maxLines) {
  const force = !wordsFit(text, font, width);
  return planLines(cut(text, font, width, maxLines, '', force), font, width, { force });
}

// A time ("11h", "19h às 22h"): one line as large as `width` allows, up to `max`. A raw text from
// the sheet ("manhã, tarde e noite") that would need less than `min` goes in lines at `min`, cut
// to `maxLines`; css/flyers.css opens their line height (.is-lines). Returns { size, lines, multi }.
function fitTime(text, font, width, max, min, maxLines) {
  const one = sizeToWidth(text, font, width, max, 1);
  if (one >= min) return { size: one, lines: [text], multi: false };
  const lines = setLines(text, { ...font, size: min }, width, maxLines);
  return { size: min, lines, multi: lines.length > 1 };
}

// ---------- Facts ----------

const upper = (text) => text.toLocaleUpperCase('pt-BR');
const sum = (values) => values.reduce((a, b) => a + b, 0);
const between = (from, to, t) => from + (to - from) * t;

// No-break spaces where a line must not break: before a spaced dash, so it ends a line and never
// starts one ("Baile dos Educadores –" over "Festa Tropical"), and after an abbreviation ("R.
// João"). Short words ("de", "com", "e") are kept with the next word by the line planning.
const tidy = (text) => text
  .replace(/ ([–—-]) /g, `${NBSP}$1 `)
  .replace(/(^|[\s(])(R|Av|Al|Pç|Rod|Dr|Dra|Prof|Profa|Sr|Sra|Sto|Sta|Vl|Jd|Pq)\. (?=\S)/g, `$1$2.${NBSP}`);

// "sexta", "sábado": the weekday without "-feira".
const weekdayShort = (date) => weekdayName(date).split('-')[0];

// "19h às 22h" that never breaks before "às" or the end time.
const unbrokenTime = (ev) => (ev.time != null && ev.endTime != null ? formatTimeRange(ev).replace(/ /g, NBSP) : formatTimeRange(ev));

const hasPlace = (ev) => Boolean(ev.local || ev.city);
const orgNames = (ev) => (ev.orgs.length ? ev.orgs : ev.org ? [ev.org] : []);

// "Chácara do SIMTED", "Praça Ary Coelho, Campo Grande" or just the city. A place cut short keeps
// its city: "Praça Ary Coelho (concentração)…, Campo Grande".
function fitPlace(ev, font, width, steps, floor) {
  const local = tidy(ev.local);
  if (local && ev.city) return pickSize(local, font, width, steps, { floor, tail: `, ${ev.city}` });
  return pickSize(local || ev.city, font, width, steps, { floor });
}

// "A", "A e B", "A, B e C"; naming fewer, "A, B e mais 2". Short names ("DCE UFGD") never break.
function listOrgs(names, shown = names.length) {
  const list = names.map((name) => (name.length <= 16 ? name.replace(/ /g, NBSP) : tidy(name)));
  if (shown < list.length) return `${list.slice(0, shown).join(', ')} e mais${NBSP}${list.length - shown}`;
  return list.length > 1 ? `${list.slice(0, -1).join(', ')} e ${list[list.length - 1]}` : list[0];
}

// The organizations, naming as many as fit (at most `maxShown`, then "e mais N"), each count tried
// at every step ([size, maxLines]) before a name is dropped. Returns what pickSize returns.
function fitOrgs(names, font, width, steps, maxShown, floor) {
  for (let shown = Math.min(maxShown, names.length); shown >= 1; shown--) {
    const text = listOrgs(names, shown);
    for (const [size, maxLines] of steps) {
      const sized = { ...font, size };
      const lines = fitLines(text, sized, width, maxLines);
      if (lines) return { text, size, font: sized, lines };
    }
  }
  return pickSize(listOrgs(names, 1), font, width, steps.slice(-1), { floor });
}

// ---------- DOM helpers ----------

function h(tag, className, ...kids) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  for (const kid of kids.flat()) {
    if (kid == null || kid === false || kid === '') continue;
    node.append(kid instanceof Node ? kid : String(kid));
  }
  return node;
}

function fromHtml(markup) {
  const template = document.createElement('template');
  template.innerHTML = markup.trim();
  return template.content.firstElementChild;
}

const px = (n) => `${Math.round(n * 10) / 10}px`;

// Font sizes are whole pixels: the PNG export floors fractional ones.
function sized(node, size) {
  node.style.fontSize = `${Math.round(size)}px`;
  return node;
}

// Text set in the lines planned for it: one block per line that never wraps (css/flyers.css).
// A line is a string or a list of children. The spaces between the blocks draw nothing; they
// only keep the node's text readable ("ALMOÇO DOS EDUCADORES", not "ALMOÇO DOSEDUCADORES").
function lined(tag, className, lines, size) {
  const node = h(tag, className);
  lines.forEach((line, i) => {
    if (i > 0) node.append(' ');
    node.append(h('span', 'fl-line', line));
  });
  return size ? sized(node, size) : node;
}

// The red header card: the mark beside "NOS Dourados" and the full name.
const masthead = () =>
  h('div', 'fl-mast', fromHtml(brandMark(APP_NAME)), h('div', 'fl-mast-text', h('div', 'fl-mast-name', CITY), h('div', 'fl-mast-full', APP_FULL_NAME)));

const footer = () => h('div', 'fl-foot', FOOTER_LINE);

// Top of a sheet: the binding strip and the perforation.
const sheetTop = () => [h('div', 'fl-binding'), h('div', 'fl-perf')];

// A row of facts: a fixed slot with the icon (or the sector square), then the text in its planned
// lines. `fit` comes from fitPlace, fitOrgs or pickSize.
function row(kind, mark, fit) {
  return sized(h('div', `fl-row is-${kind}`, h('span', 'fl-row-mark', mark), lined('span', 'fl-row-text', fit.lines)), fit.size);
}
const placeRow = (ev, fit) => row('place', fromHtml(icon(ev.online ? 'globe' : 'pin', 'fl-icon')), fit);
const orgRow = (fit) => row('org', h('span', 'fl-square'), fit);

// ---------- 1. Day sheet ("Folha do dia") ----------
// The day's sheet torn off the pad: the numeral fills the head, the activity is written below.

const DAY = {
  inner: 1009, // sheet inside its borders: 1350 − header 194 − wall 40 − footer 103 − 4
  chrome: 46, // binding 12 + perforation 32 + rule 2
  width: 860, // body: sheet 956 − 2 × 48
  rowWidth: 808, // row text: body − slot 36 − gap 16
};

function dayFlyer(ev) {
  const date = ev.date;
  const names = orgNames(ev);
  const length = ev.title.length;
  const tier = length <= 28 ? 78 : length <= 56 ? 66 : 56;
  const title = pickSize(tidy(ev.title), TITLE_FONT, DAY.width, [[78, 3], [66, 3], [56, 3], [48, 3], [44, 3]].filter(([s]) => s <= tier), { floor: 32 });
  const org = names.length ? fitOrgs(names, ORG_FONT, DAY.rowWidth, [[40, 2]], names.length, 32) : null;
  const where = hasPlace(ev) ? fitPlace(ev, PLACE_FONT, DAY.rowWidth, [[38, 2], [34, 3]], 28) : null;
  const type = ev.type ? setLines(ev.type, TAG_FONT, DAY.width - 32, 1)[0] : '';

  // The body is written first; the head takes the rest of the sheet.
  const rows = [org, where].filter(Boolean).map((fit) => fit.lines.length * fit.size * 1.2);
  let meta = sum(rows) + 14 * Math.max(0, rows.length - 1);
  if (type) meta += (rows.length ? 24 : 0) + 53;
  const body = 44 + title.lines.length * title.size * 1.08 + (meta ? 36 + meta : 0) + 48;
  const heavy = length >= 57 || org?.lines.length > 1 || where?.lines.length > 1;
  const room = DAY.inner - DAY.chrome - body;
  // The head needs about its numeral size: the 0.8em numeral, its bottom padding and some air.
  const numeral = Math.max(260, Math.min(heavy ? 400 : 460, Math.floor(room / 20) * 20));
  const k = numeral / 460;
  const scaled = (n) => Math.round(n * k);

  // The numeral, days 1–9 with a leading zero ("09") as on the cancellation notice, and the
  // column beside it: weekday, month and holiday on top, the time at the bottom.
  const day = String(date.getDate()).padStart(2, '0');
  const column = DAY.width - textWidth(day, { face: 'condensed-800', size: numeral, track: -0.013 }) - 40 * k;
  const holiday = holidayOn(date);
  const holidayFont = { face: 'barlow-600', size: scaled(34) };
  const holidayName = holiday ? setLines(lineCount(holiday.name, holidayFont, column) > 1 ? holiday.short : holiday.name, holidayFont, column, 1)[0] : '';
  const until = ev.endDate ? `até ${formatTinyDate(ev.endDate)}` : '';
  const timeText = formatTimeRange(ev);
  let time = null;
  if (timeText) {
    const top = (32 + 70 + 8 + 44) * k + (holidayName ? 8 * k + holidayFont.size * 1.2 : 0);
    const free = 368 * k - top - 28 * k - (until ? 56 * k : 0); // 28k of air between the groups
    // One line as large as the column and the room allow, up to 120k; a raw text from the sheet
    // that would need less than 44k goes in lines at 44k.
    const max = Math.max(scaled(44), Math.min(scaled(120), Math.floor(free / 0.8)));
    time = fitTime(timeText, { face: 'condensed-800', track: -0.008 }, column, max, scaled(44), Math.max(1, Math.floor(free / scaled(44))));
  }

  const head = h('div', `dy-head${isRedLetter(date) ? ' is-red' : ''}`,
    sized(h('div', 'dy-num', day), numeral),
    h('div', 'dy-col',
      h('div', 'dy-date',
        sized(h('div', 'dy-weekday', upper(weekdayShort(date))), scaled(70)),
        sized(h('div', 'dy-month', `${upper(monthName(date.getMonth()))} ${date.getFullYear()}`), scaled(40)),
        holidayName && sized(h('div', 'dy-holiday', holidayName), holidayFont.size)),
      (until || time) && h('div', 'dy-when',
        until && sized(h('div', 'dy-until', until), scaled(48)),
        time && lined('div', `dy-time${time.multi ? ' is-lines' : ''}`, time.lines, time.size))));
  head.style.setProperty('--k', k.toFixed(4));

  const sheetBody = h('div', 'dy-body',
    lined('div', 'dy-title', title.lines, title.size),
    meta > 0 && h('div', 'dy-meta',
      (org || where) && h('div', 'dy-rows', org && orgRow(org), where && placeRow(ev, where)),
      type && h('div', 'fl-tag', type)));

  return [masthead(), h('div', 'dy-wall', h('div', 'fl-sheet', sheetTop(), head, sheetBody)), footer()];
}

// ---------- 2. Month calendar ("Calendário do mês") ----------
// The month page of the wall calendar with the day circled by hand, the activity written under it.

const MONTH = {
  room: 965, // sheet + info: 1350 − header 162 − footer 103 − content padding 76 − gap 44
  sheet: 245, // sheet parts that don't stretch: borders 4, binding 12, perforation 32, month 111, weekday row 50, paddings 36
  width: 960,
  rowWidth: 908, // 960 − slot 36 − gap 16
};

const WEEK_HEAD = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

// Tighter and tighter info blocks, until the weeks keep a readable height (the title's own size
// also follows its length). Each row may take a third line at a smaller size before anything is
// cut; then the organizations give way (fewer names) before the place, which says where to go.
const MONTH_STEPS = [
  { title: 76, line: 40, place: [[38, 2], [34, 3]], org: [[40, 2], [36, 3]] },
  { title: 64, line: 40, place: [[38, 2], [34, 3]], org: [[40, 2], [36, 3]] },
  { title: 64, line: 36, place: [[34, 2], [32, 3]], org: [[36, 2], [34, 3]] },
  { title: 52, line: 36, place: [[34, 2], [32, 3]], org: [[36, 2], [34, 3]] },
  { title: 52, line: 34, place: [[32, 3]], org: [[34, 3]] },
  { title: 44, line: 32, place: [[30, 3]], org: [[32, 3]] },
  { title: 44, line: 32, place: [[30, 3]], org: [[32, 2]] },
  { title: 44, line: 32, place: [[30, 3]], org: [[32, 1]] },
  { title: 44, line: 32, place: [[30, 2]], org: [[32, 1]] },
  { title: 44, line: 32, place: [[30, 1]], org: [[32, 1]] },
];

// "Sexta, 20 de novembro, 19h" or "De sexta, 16 de outubro a sábado, 24 de outubro", each date
// in one piece ("sábado, 24 de outubro"), the time range too.
function longWhen(ev) {
  const day = (d) => `${weekdayShort(d)}, ${d.getDate()} de ${monthName(d.getMonth())}`.replace(/ /g, NBSP);
  const when = ev.endDate ? `De ${day(ev.date)} a ${day(ev.endDate)}` : capitalize(day(ev.date));
  const time = unbrokenTime(ev);
  return time ? `${when}, ${time}` : when;
}

// The date lines, then " · " and the holiday on the last one, or the holiday on a line of its own
// (no dot) when it doesn't fit there. Returns [{ text, holiday }].
function whenLines(ev, holiday, font, width) {
  const lines = planLines(longWhen(ev), font, width).map((text) => ({ text, holiday: '' }));
  if (!holiday) return lines;
  const name = textWidth(holiday.name, font) <= width * FIT ? holiday.name : holiday.short;
  const last = lines[lines.length - 1];
  if (textWidth(`${last.text} · ${name}`, font) <= width * FIT) last.holiday = name;
  else lines.push({ text: '', holiday: name });
  return lines;
}

function monthFlyer(ev) {
  const date = ev.date;
  const year = date.getFullYear();
  const month = date.getMonth();
  const offset = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const weeks = Math.ceil((offset + days) / 7);

  const names = orgNames(ev);
  const holiday = holidayOn(date);
  const length = ev.title.length;
  const tier = length <= 28 ? 76 : length <= 56 ? 64 : 52;
  const minRow = weeks > 5 ? 58 : 66;

  let plan;
  for (const step of MONTH_STEPS) {
    const top = Math.min(tier, step.title);
    const title = pickSize(tidy(ev.title), TITLE_FONT, MONTH.width, [[76, 3], [64, 3], [52, 3], [44, 3]].filter(([s]) => s <= top), { floor: 32 });
    const when = whenLines(ev, holiday, { face: 'barlow-600', size: step.line }, MONTH.width);
    const where = hasPlace(ev) ? fitPlace(ev, PLACE_FONT, MONTH.rowWidth, step.place, 28) : null;
    const org = names.length ? fitOrgs(names, ORG_FONT, MONTH.rowWidth, step.org, names.length, 28) : null;
    const rows = [where, org].filter(Boolean).map((fit) => fit.lines.length * fit.size * 1.2);
    const info = title.lines.length * title.size * 1.08 + 12 + when.length * step.line * 1.25 + (rows.length ? 28 + sum(rows) + 14 * (rows.length - 1) : 0);
    const rowHeight = (MONTH.room - info - MONTH.sheet) / weeks;
    plan = { step, title, when, where, org, rowHeight };
    if (rowHeight >= minRow) break;
  }

  // Numerals and the hand-drawn ring follow the height the weeks end up with.
  const numeral = Math.min(weeks > 5 ? 48 : 54, Math.floor(plan.rowHeight * 0.66));
  const ringHeight = Math.max(52, Math.min(92, plan.rowHeight + 3));
  const covered = new Set(dayKeys(ev));

  const cells = [];
  for (let i = 0; i < weeks * 7; i++) {
    const n = i - offset + 1;
    if (n < 1 || n > days) {
      cells.push(h('span', 'mo-day'));
      continue;
    }
    const d = new Date(year, month, n);
    const key = dateKey(d);
    const cell = h('span', `mo-day${isRedLetter(d) ? ' is-red' : ''}`, h('span', 'mo-num', String(n)));
    if (key === ev.dateKey) {
      const ring = h('span', 'mo-ring');
      ring.style.width = px(ringHeight * (160 / 92));
      ring.style.height = px(ringHeight);
      cell.append(ring);
    } else if (covered.has(key)) {
      cell.append(h('span', 'mo-underline'));
    }
    cells.push(cell);
  }

  const grid = h('div', 'mo-grid',
    h('div', 'mo-weekdays', WEEK_HEAD.map((label) => h('span', null, label))),
    h('div', 'mo-weeks', cells));
  grid.style.setProperty('--num', `${numeral}px`);
  grid.style.setProperty('--weeks', String(weeks));

  const { step, title, when, where, org } = plan;
  const whenNode = lined('p', 'mo-when', when.map((line) => (line.holiday ? [line.text && `${line.text} · `, h('span', 'mo-holiday', line.holiday)] : line.text)), step.line);
  const info = h('div', 'mo-info',
    h('div', 'mo-titles', lined('div', 'mo-title', title.lines, title.size), whenNode),
    (where || org) && h('div', 'mo-rows', where && placeRow(ev, where), org && orgRow(org)));

  const sheet = h('div', 'fl-sheet', sheetTop(),
    h('div', 'mo-head', h('div', 'mo-month', `${upper(monthName(month))} ${year}`)),
    grid);

  return [masthead(), h('div', 'mo-content', sheet, info), footer()];
}

// ---------- 3. Poster ("Cartaz") ----------
// A street poster: the title as large as the space above the band allows, the date on a small
// sheet pinned beside the place and the organizations.

const POSTER = {
  width: 920, // 1080 − 2 × 80
  height: 1190, // 1350 − 2 × 80
  gap: 40, // least space between the title and the band
  sheetText: 292, // date sheet 340 − 2 × 24
  rowWidth: 466, // details 524 − slot 44 − gap 14
  details: 99, // the details column besides its rows: the signature 75 and 24 of air above it
};

// The steps of the place and organization rows: 44px while a row takes at most two lines, then
// 36px and 32px in more lines.
const POSTER_ROWS = [[44, 2], [36, 5], [32, 6]];
const POSTER_ROW_FONT = { face: 'barlow-600' };

function posterFlyer(ev) {
  const date = ev.date;
  const timeText = formatTimeRange(ev);
  const until = ev.endDate ? `até ${formatDayMonth(ev.endDate)}` : '';
  const time = timeText ? fitTime(timeText, { face: 'condensed-800' }, POSTER.sheetText, 84, 48, 3) : null;
  const typeFont = { face: 'condensed-600', size: 34 };
  const typeLines = ev.type ? setLines(ev.type, typeFont, POSTER.sheetText, 2) : [];
  // Without a time there is no bottom block: the type goes under the month.
  const typeOnDay = typeLines.length > 0 && !time;

  let sheet = 14 + 28 + 171.4 + 4 + 48.4 + 4 + 48.4 + 24 + (until ? 43.1 : 0) + (typeOnDay ? 4 + typeLines.length * 39.1 : 0);
  if (time) sheet += 1 + 18 + time.lines.length * time.size * (time.multi ? 1 : 0.92) + (typeLines.length ? 2 + typeLines.length * 39.1 : 0) + 26;

  // The rows take what the details column has beside the sheet, each at its largest step that
  // leaves room for the other: first as many organizations as fit (more than three name two,
  // "A, B e mais 2"), then the larger place, then the larger organizations. Only when even the
  // smallest steps run over does the band grow, leaving the title less room, and only past that
  // is the place cut, its city kept.
  const names = orgNames(ev);
  const place = [tidy(ev.local), ev.city].filter(Boolean).join(', ');
  const free = sheet - POSTER.details;
  const fitRow = (text, [size, maxLines]) => {
    const font = { ...POSTER_ROW_FONT, size };
    const lines = fitLines(text, font, POSTER.rowWidth, maxLines);
    return lines && { text, size, font, lines };
  };
  const rowsHeight = (...fits) => {
    const parts = fits.filter(Boolean);
    return sum(parts.map((fit) => fit.lines.length * fit.size * 1.2)) + 20 * Math.max(0, parts.length - 1);
  };
  const placeFits = place ? POSTER_ROWS.map((step) => fitRow(place, step)).filter(Boolean) : [null];
  let rows = null;
  let grown = null; // over even at the smallest steps: the band grows by as little as it can
  for (let shown = Math.min(names.length, names.length > 3 ? 2 : 3); shown >= (names.length ? 1 : 0) && !rows && placeFits.length; shown--) {
    const orgFits = shown ? POSTER_ROWS.map((step) => fitRow(listOrgs(names, shown), step)).filter(Boolean) : [null];
    if (!orgFits.length) continue;
    for (const where of placeFits) {
      for (const org of orgFits) if (!rows && rowsHeight(where, org) <= free) rows = { where, org };
    }
    grown ??= { where: placeFits[placeFits.length - 1], org: orgFits[orgFits.length - 1] };
  }
  rows ??= grown ?? {
    where: placeFits.length ? placeFits[placeFits.length - 1] : fitPlace(ev, POSTER_ROW_FONT, POSTER.rowWidth, POSTER_ROWS.slice(-1), 24),
    org: names.length ? fitOrgs(names, ORG_FONT, POSTER.rowWidth, POSTER_ROWS.slice(-1), 1, 24) : null,
  };
  const { where, org } = rows;
  const band = Math.max(sheet, rowsHeight(where, org) + POSTER.details);

  // The title: of the sizes from 200px down to 64px whose lines fit above the band with no word
  // broken, the largest, marked down for lines that read badly (a short word ending a line, a line
  // of short words or emoji alone): "CAMINHADA / ECOLÓGICA / DE / DOURADOS" gives way to
  // "… / DE DOURADOS".
  const measured = upper(tidy(ev.title));
  const room = POSTER.height - band - POSTER.gap;
  let title = null;
  for (let size = 200; size >= 64; size -= 4) {
    const font = { face: 'condensed-800', size };
    if (!wordsFit(measured, font, POSTER.width)) continue;
    const lines = planLines(measured, font, POSTER.width);
    if (lines.length * size * 0.95 > room) continue;
    const { weakEnds, weakLines } = badBreaks(lines);
    const score = size * (1 - 0.1 * weakEnds - 0.3 * weakLines);
    if (!title || score > title.score) title = { size, lines, score };
  }
  if (!title) {
    // Too long even at 64px: cut to the lines that fit (a word too wide breaks between letters).
    const font = { face: 'condensed-800', size: 64 };
    const force = !wordsFit(measured, font, POSTER.width);
    const text = cut(measured, font, POSTER.width, Math.max(1, Math.floor(room / (64 * 0.95))), '', force);
    title = { size: 64, lines: planLines(text, font, POSTER.width, { force }) };
  }

  const typeNode = typeLines.length > 0 && lined('div', 'po-type', typeLines);
  const dateSheet = h('div', 'po-sheet',
    sheetTop(),
    h('div', 'po-day',
      h('div', 'po-num', String(date.getDate()).padStart(2, '0')),
      h('div', 'po-weekday', upper(weekdayShort(date))),
      h('div', 'po-month', upper(monthName(date.getMonth()))),
      until && h('div', 'po-until', until),
      typeOnDay && typeNode),
    time && h('div', 'po-when', lined('div', `po-time${time.multi ? ' is-lines' : ''}`, time.lines, time.size), typeNode));

  const detailsCol = h('div', 'po-details',
    h('div', 'po-info', where && placeRow(ev, where), org && orgRow(org)),
    h('div', 'po-sign', fromHtml(brandMark(APP_NAME)), h('div', 'po-sign-text', h('div', 'po-sign-name', CITY), h('div', 'po-sign-line', FOOTER_LINE))));

  return [lined('div', 'po-title', title.lines, title.size), h('div', 'po-band', dateSheet, detailsCol)];
}

// The styles to pick from, in the picker's order. `id` names the root class (.fl--<id>) and is
// the choice js/app.js saves; `slug` ends the downloaded file's name, in pt-BR since people see
// it; `name` is what the picker shows.
export const FLYER_STYLES = [
  { id: 'day', slug: 'folha', name: 'Folha do dia', render: dayFlyer },
  { id: 'month', slug: 'mes', name: 'Calendário do mês', render: monthFlyer },
  { id: 'poster', slug: 'cartaz', name: 'Cartaz', render: posterFlyer },
];

// ---------- Cancellation notice ("Aviso de cancelamento") ----------
// Not one of the styles: every cancelled activity gets this notice, whatever style is picked.
// The day sheet struck out under a CANCELADA stamp, the reason, then the activity crossed out.

const NOTICE = {
  room: 1012, // 1350 − header 164 − body padding 44 − footer 102 − 28 of air above the footer
  width: 920,
  rowWidth: 870, // 920 − slot 36 − gap 14
  sheet: 918, // the sheet inside its borders, where the stamp is placed
  head: 838, // the row under the numeral: 918 − 2 × 40
};
const TURN = (8 * Math.PI) / 180; // the stamp's tilt

function noticeFlyer(ev) {
  const date = ev.date;
  const timeText = formatTimeRange(ev);
  const until = ev.endDate ? upper(`até ${formatDayMonth(ev.endDate)}`) : '';
  const typeInDate = Boolean(ev.type && !timeText);
  const reason = tidy(ev.cancelReason);
  const names = orgNames(ev);
  const numeral = String(date.getDate()).padStart(2, '0');
  const weekday = upper(weekdayName(date));
  const month = `${upper(monthName(date.getMonth()))} ${date.getFullYear()}`;
  const reasonStart = reason.length > 180 ? 34 : 40; // 34px once the reason runs long

  // The squeeze t goes from 0 (the design's sizes) to 1 (compact): the day sheet and its stamp
  // scale by k, the text steps down with them. The least squeeze that fits wins.
  let plan;
  for (let i = 0; i <= 20; i++) {
    const t = i / 20;
    const k = between(1, 0.62, t);
    const scaled = (n) => Math.round(n * k);
    // The row under the numeral: the date (one line each, never wrapping), then with a time a rule
    // and the time over the type, in what the date leaves of the row.
    const dateFont = (size, track) => ({ face: 'condensed-700', size: scaled(size), track });
    const typeFont = { face: 'condensed-600', size: scaled(32) };
    const typeLine = (width) => setLines(ev.type, typeFont, width, 1)[0];
    const typeDate = typeInDate ? typeLine(NOTICE.head) : '';
    const dateWidth = Math.max(textWidth(weekday, dateFont(56, 0.054)), textWidth(month, dateFont(36, 0.056)), until ? textWidth(until, dateFont(36, 0.056)) : 0, typeDate ? textWidth(typeDate, typeFont) : 0);
    const dateCol = scaled(56) * 1.05 + 2 + scaled(36) * 1.1 + (until ? 2 + scaled(36) * 1.1 : 0) + (typeDate ? 2 + typeFont.size * 1.2 : 0);
    let time = null;
    let typeTime = '';
    let timeCol = 0;
    if (timeText) {
      const timeWidth = NOTICE.head - dateWidth - 2 * 32 * k - 1;
      time = fitTime(timeText, { face: 'condensed-800' }, timeWidth, scaled(64), scaled(40), 2);
      typeTime = ev.type ? typeLine(timeWidth) : '';
      timeCol = Math.max(88 * k, time.lines.length * time.size * (time.multi ? 1 : 0.95) + (typeTime ? 2 + typeFont.size * 1.2 : 0));
    }
    const sheet = 2 + 10 + 28 + 0.84 * scaled(290) + (52 + 30) * k + Math.max(dateCol, timeCol);

    const reasonSize = Math.round(between(reasonStart, 30, t));
    const rowSize = Math.round(between(36, 32, t));
    // Two lines each, until the organizations and then the place go down to one.
    const orgLines = t < 0.55 ? 2 : 1;
    const placeLines = t < 0.85 ? 2 : 1;
    // The title: 64px in two lines, 52px from three (both shrinking with the squeeze), its first
    // lines kept full as in the design; the reason below fills its lines as a paragraph.
    const title = pickSize(tidy(ev.title), { face: 'barlow-700' }, NOTICE.width, [[Math.round(between(64, 44, t)), 2], [Math.round(between(52, 44, t)), 3]], { floor: 32, ragged: true });
    const where = hasPlace(ev) ? fitPlace(ev, PLACE_FONT, NOTICE.rowWidth, [[rowSize, placeLines]], 28) : null;
    const org = names.length ? fitOrgs(names, ORG_FONT, NOTICE.rowWidth, [[rowSize, orgLines]], names.length, 28) : null;
    const record = title.lines.length * title.size * 1.08 + (where ? 14 + where.lines.length * where.size * 1.28 : 0) + (org ? 14 + org.lines.length * org.size * 1.28 : 0);
    const font = { face: 'barlow-500', size: reasonSize };
    const lineHeight = reasonSize * 1.3;
    const free = NOTICE.room - sheet - 36 - record - (reason ? 36 + lineHeight + 4 : 0);
    const force = Boolean(reason) && !wordsFit(reason, font, NOTICE.width);
    let reasonLines = reason ? planLines(reason, font, NOTICE.width, { greedy: true, force }) : [];
    plan = { k, scaled, typeDate, time, typeTime, typeFont, font, reasonLines, title, where, org };
    if (reason ? reasonLines.length * lineHeight <= free : free >= 0) break;
    // Fully squeezed and still too long: the reason is cut to the lines left.
    if (i === 20 && reason) {
      const shown = cut(reason, font, NOTICE.width, Math.max(1, Math.floor(free / lineHeight)), '', force);
      reasonLines = planLines(shown, font, NOTICE.width, { greedy: true, force });
      plan.reasonLines = reasonLines;
    }
  }
  const { k, scaled, typeDate, time, typeTime, typeFont, title, where, org } = plan;

  // The stamp sits over the right digit and the empty right half, never on the weekday row, and
  // never past the sheet's right edge (a wide "4" would push it there).
  const numeralSize = scaled(290);
  const numeralWidth = textWidth(numeral, { face: 'condensed-800', size: numeralSize, track: -0.01 });
  const stampSize = scaled(140);
  const stampWidth = textWidth('CANCELADA', { face: 'condensed-800', size: stampSize, track: 0.057 }) + stampSize * (0.164 + 0.221 + 2 * 0.0714);
  const stampHeight = stampSize * (0.965 + 0.15 + 2 * 0.0714);
  const reach = stampWidth * Math.cos(TURN) + stampHeight * Math.sin(TURN); // from its left edge to its rightmost corner
  const stamp = sized(h('div', 'nt-stamp', 'CANCELADA'), stampSize);
  stamp.style.left = px(Math.min(40 + numeralWidth * 0.44 - 5, NOTICE.sheet - reach - 6));
  stamp.style.top = px(38 + 116 * k - 5);

  const typeNode = (text) => text && sized(h('div', 'nt-type', text), typeFont.size);
  const head = h('div', 'nt-head',
    sized(h('div', 'nt-num', numeral, h('span', 'nt-strike')), numeralSize),
    h('div', 'nt-row',
      h('div', 'nt-date',
        sized(h('div', 'nt-weekday', weekday), scaled(56)),
        sized(h('div', 'nt-month', month), scaled(36)),
        until && sized(h('div', 'nt-month', until), scaled(36)),
        typeNode(typeDate)),
      time && h('span', 'nt-rule'),
      time && h('div', 'nt-time-col',
        lined('div', `nt-time${time.multi ? ' is-lines' : ''}`, time.lines.map((line) => [line, h('span', 'nt-strike')]), time.size),
        typeNode(typeTime))));

  const sheet = h('div', 'nt-sheet', h('div', 'nt-binding'), h('div', 'nt-perf'), head, stamp);
  sheet.style.setProperty('--k', k.toFixed(4));

  const body = h('div', 'nt-body',
    sheet,
    plan.reasonLines.length > 0 && sized(h('div', 'nt-reason', h('div', 'nt-reason-label', 'Motivo:'), lined('p', 'nt-reason-text', plan.reasonLines)), plan.font.size),
    h('div', 'nt-record',
      lined('div', 'nt-title', title.lines, title.size),
      where && placeRow(ev, where),
      org && orgRow(org)));

  return [masthead(), body, h('div', 'nt-foot', h('div', 'nt-foot-rule'), h('div', 'nt-foot-line', FOOTER_LINE))];
}

export const NOTICE_STYLE = { id: 'notice', slug: 'cancelada', name: 'Aviso de cancelamento', render: noticeFlyer };

const styleFor = (event, styleId) =>
  event.cancelled ? NOTICE_STYLE : FLYER_STYLES.find((s) => s.id === styleId) || FLYER_STYLES[0];

// The flyer is a picture: the panel around it already says all of it in text, so assistive tech
// skips it (aria-hidden), and it holds no headings of its own.
export function renderFlyer(event, styleId = FLYER_STYLES[0].id) {
  const style = styleFor(event, styleId);
  const node = h('div', `fl fl--${style.id}`, style.render(event));
  node.setAttribute('aria-hidden', 'true');
  paintSector(node, event.sector);
  return node;
}

export function flyerFilename(event, styleId) {
  const parts = [event.dateKey, slugify(event.title), styleFor(event, styleId).slug].filter(Boolean);
  return `${parts.join('-')}.png`;
}

async function renderBlob(node) {
  if (!window.htmlToImage) throw new Error('Image generator unavailable: html-to-image is not loaded.');
  await document.fonts.ready;
  return window.htmlToImage.toBlob(node, { width: FLYER_WIDTH, height: FLYER_HEIGHT, pixelRatio: 1 });
}

export async function downloadFlyer(node, filename) {
  const blob = await renderBlob(node);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Native share sheet with the PNG attached (phones), so it goes straight to WhatsApp.
export function canShareFiles() {
  try {
    const probe = new File([new Blob()], 'x.png', { type: 'image/png' });
    return Boolean(navigator.canShare && navigator.canShare({ files: [probe] }));
  } catch {
    return false;
  }
}

export async function shareFlyer(node, filename, title) {
  const blob = await renderBlob(node);
  const file = new File([blob], filename, { type: 'image/png' });
  await navigator.share({ files: [file], title });
}
