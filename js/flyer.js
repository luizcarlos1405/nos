// Flyers: 1080 × 1350 PNGs in the site's world, Céu · Terra. Each flyer is a landscape: the sky of
// the hour the activity starts (js/sky.js's hours: amanhecer 5–9h, dia 9–16h, entardecer 16–19h,
// noite 19–5h; the day's sky when there is no time) in flat bands down to the woven band, the
// horizon, and the land below it (the clay; terra roxa under the night sky). The sky carries each
// flyer's idea (the day, the month, the title, the cancellation) with the sun rising behind the band,
// or the small moon among the stars, drawn round by the hand's urucum loop; the land carries the
// activity (what it is, who organizes it, where) and NOS's signature. Three layouts to pick from,
// plus the cancellation notice that every cancelled activity gets. Each layout turns an activity into
// a detached DOM node styled by css/flyers.css (.fl--<id>, data-sky for the hour).
//
// Everything that depends on the text is planned here, without measuring the DOM: the glyph widths
// of the self-hosted fonts (below) break each text into lines, each layout picks its sizes and places
// its blocks from those lines, and every text is set in exactly those lines, one block per line that
// never wraps, at whole-pixel sizes. So the preview and the exported PNG are always the same picture.
// The fixed measures each layout plans with (line heights, gaps, a row's slot) mirror
// css/flyers.css: change them together. Uses the global `htmlToImage` (js/vendor/html-to-image.js)
// for the export.

import { APP_NAME, CITY, SITE_URL } from './config.js';
import { capitalize, dateKey, dayKeys, formatDayMonth, formatTime, monthName, orgFullName, slugify, weekdayName } from './events.js';
import { holidayOn, isRedLetter } from './holidays.js';
import { paintSector } from './colors.js';
import { HAND, brandMark, icon } from './icons.js';
import { skyPeriod } from './sky.js';

export const FLYER_WIDTH = 1080;
export const FLYER_HEIGHT = 1350;

const HOME = CITY.split('/')[0];
const SITE = SITE_URL.replace(/^https?:\/\//, '').replace(/\/$/, '');
const FOOTER_LINE = 'Agenda das organizações';
const NBSP = ' ';

// ---------- Text metrics ----------

// Advance widths in thousandths of an em, measured in Chromium by .impeccable/flyer-metrics.html
// from the self-hosted fonts as css/flyers.css sets them, at 1000px with kerning off: Bricolage
// Grotesque (`display-*`, its optical size pinned at 96) and Inter (`text-*`), at the weights in
// their names. The printable ASCII range (space to tilde), then the signs of EXTRA_SIGNS. An accented
// letter counts as its base letter (as wide or a little wider). Kerning is left out: it makes real
// text a little narrower, so the estimates run wide, the safe side; the 3% margin of FIT covers the
// rare pair that kerns wider. After changing a font, a weight or the optical size, measure again.
const ADVANCES = {
  'display-800': [203, 268, 340, 613, 575, 948, 697, 174, 303, 303, 457, 486, 193, 313, 246, 349, 594, 310, 551, 565, 607, 565, 592, 498, 608, 603, 250, 235, 486, 486, 486, 396, 936, 659, 608, 631, 621, 540, 510, 649, 637, 243, 323, 623, 460, 822, 694, 661, 586, 659, 615, 585, 516, 627, 632, 915, 623, 595, 550, 295, 349, 295, 530, 527, 283, 543, 576, 539, 576, 537, 376, 549, 562, 234, 244, 541, 234, 860, 562, 567, 574, 574, 400, 517, 368, 557, 530, 799, 543, 539, 483, 321, 218, 321, 486],
  'display-700': [206, 252, 318, 603, 571, 936, 690, 165, 291, 292, 435, 486, 179, 309, 223, 342, 594, 294, 545, 562, 595, 560, 592, 489, 605, 599, 227, 216, 486, 486, 486, 397, 916, 646, 601, 629, 618, 537, 509, 648, 633, 231, 317, 613, 457, 809, 684, 660, 579, 658, 607, 581, 512, 625, 623, 909, 608, 582, 545, 289, 342, 289, 525, 547, 283, 533, 568, 534, 568, 533, 364, 548, 553, 222, 230, 529, 222, 850, 553, 564, 566, 566, 386, 510, 358, 548, 525, 791, 529, 533, 473, 322, 210, 324, 486],
  'text-700': [237, 338, 552, 649, 655, 1016, 672, 339, 377, 377, 559, 679, 334, 468, 334, 388, 674, 431, 630, 646, 676, 622, 649, 582, 651, 649, 334, 343, 679, 679, 679, 560, 1016, 747, 662, 740, 722, 607, 587, 751, 747, 281, 584, 719, 565, 932, 762, 771, 648, 777, 657, 655, 667, 732, 747, 1038, 738, 731, 664, 377, 388, 377, 487, 476, 365, 581, 630, 588, 630, 596, 398, 632, 623, 271, 271, 580, 271, 913, 623, 613, 630, 630, 407, 560, 366, 623, 600, 850, 580, 602, 573, 469, 372, 469, 679],
  'text-600': [252, 321, 523, 644, 650, 1004, 663, 326, 373, 373, 540, 673, 319, 465, 319, 379, 660, 423, 623, 636, 666, 612, 640, 576, 640, 640, 319, 329, 673, 673, 673, 543, 999, 728, 659, 737, 722, 605, 588, 749, 746, 277, 580, 703, 565, 922, 759, 769, 645, 773, 652, 650, 660, 736, 728, 1020, 720, 713, 652, 373, 379, 373, 481, 469, 351, 574, 624, 583, 624, 591, 389, 626, 612, 262, 262, 569, 262, 900, 612, 609, 624, 624, 397, 549, 353, 612, 587, 839, 569, 588, 566, 455, 359, 455, 673],
  'text-500': [267, 304, 494, 639, 646, 993, 653, 313, 369, 369, 521, 667, 303, 462, 303, 370, 646, 415, 616, 627, 656, 603, 630, 571, 629, 630, 303, 315, 667, 667, 667, 527, 982, 709, 657, 733, 722, 603, 589, 748, 745, 272, 575, 688, 565, 913, 756, 767, 642, 769, 648, 646, 653, 740, 709, 1003, 701, 696, 641, 369, 370, 369, 477, 463, 337, 568, 618, 577, 618, 587, 379, 620, 602, 252, 252, 559, 252, 888, 602, 604, 618, 618, 387, 539, 340, 602, 575, 829, 557, 575, 559, 440, 346, 440, 667],
};
const EXTRA_SIGNS = 'ªº–—…“”‘’·•°«»×÷±²³¹½¼¾§©®™€£¢¥¿¡µ¶″‹›¨´¸¯¬¦     ';
const EXTRA_ADVANCES = {
  'display-800': [350, 408, 500, 775, 757, 382, 382, 193, 193, 246, 349, 342, 466, 466, 486, 486, 486, 408, 400, 244, 851, 844, 980, 518, 914, 673, 944, 680, 687, 539, 583, 386, 268, 542, 649, 349, 269, 269, 434, 283, 318, 332, 486, 218, 203, 102, 100, 63, 594],
  'display-700': [343, 395, 491, 762, 710, 351, 351, 179, 179, 223, 316, 336, 442, 442, 486, 486, 486, 396, 391, 233, 815, 804, 944, 512, 896, 658, 926, 677, 686, 534, 570, 388, 252, 536, 629, 327, 254, 254, 407, 283, 306, 324, 486, 210, 206, 103, 102, 63, 594],
  'text-700': [464, 490, 500, 1000, 1002, 540, 532, 311, 311, 334, 474, 459, 660, 660, 679, 679, 679, 460, 472, 333, 881, 846, 920, 568, 914, 662, 640, 685, 639, 588, 570, 560, 338, 628, 599, 547, 431, 431, 623, 365, 364, 439, 679, 339, 237, 118, 157, 63, 674],
  'text-600': [460, 487, 500, 1000, 956, 507, 501, 294, 294, 319, 503, 458, 634, 634, 673, 673, 673, 454, 463, 324, 870, 831, 907, 568, 914, 664, 630, 679, 629, 583, 563, 543, 321, 614, 600, 512, 416, 416, 612, 351, 332, 452, 673, 316, 252, 126, 166, 63, 660],
  'text-500': [457, 485, 500, 1000, 910, 474, 471, 277, 277, 303, 533, 457, 608, 608, 667, 667, 667, 448, 455, 314, 858, 817, 895, 568, 914, 665, 621, 672, 620, 577, 557, 527, 304, 600, 601, 478, 400, 400, 602, 337, 300, 465, 667, 293, 267, 133, 173, 63, 646],
};
const EXTRA_INDEX = new Map([...EXTRA_SIGNS].map((sign, i) => [sign, i]));
// Drawn with no width of their own: combining accents (over their letter), zero-width spaces and
// joiners, the soft hyphen, variation selectors, the keycap mark and the skin tones and tags
// inside an emoji.
const ZERO_WIDTH = /[̀-ͯ­​-‏⁠⃣︀-️\u{1f3fb}-\u{1f3ff}\u{e0020}-\u{e007f}]/u;
const PICTOGRAPH = /\p{Extended_Pictographic}/u;
const FLAG_HALF = /\p{Regional_Indicator}/u;
// Colour emoji are 1.25em wide (Noto Color Emoji, measured): counted a little wider. Any other
// sign the fonts lack (other scripts, rare symbols) counts as a full em.
const EMOJI = 1300;
const UNKNOWN = 1000;

// Where the glyphs sit in a line box, in em, measured in Chromium with the optical size pinned as
// above: a line box `lh` em tall has its baseline lh / 2 + `base` below its top (the font's ascent
// and descent, centred in the box); flat capitals and figures rise `cap` above the baseline, the
// lowercase `x`, accented letters up to `accent`, and descenders (and parentheses) fall `descent` below it.
const DISPLAY = { base: 0.33, cap: 0.66, x: 0.528, accent: 0.75, descent: 0.24 };
const TEXT = { base: 0.3635, cap: 0.728, x: 0.546, accent: 0.78, descent: 0.22 };

// Lines are filled up to this share of their box, a margin for rounding in the browser.
const FIT = 0.97;

// The faces. Bricolage Grotesque is NOS's voice: the numerals, the dates, the times, the month,
// "Cancelada". Inter is what the organizations announce: titles, names, places, the reason.
const NUMERAL = { face: 'display-800', track: -0.03 };
const VOICE = { face: 'display-800', track: -0.02 };
const VOICE_SOFT = { face: 'display-700', track: -0.01 };
const TITLE = { face: 'text-700', track: -0.02 };
const NAME_FACE = 'text-700';
const FULL_FACE = 'text-500';
const PLACE = { face: 'text-500' };

// Line heights, as css/flyers.css sets them: titles, rows of facts, the when of the month, the reason.
const LH = { title: 1.06, row: 1.25, when: 1.2, reason: 1.3 };

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
    if (signs[i + 1] === '️' || signs[i + 1] === '⃣' || (PICTOGRAPH.test(sign) && !EXTRA_INDEX.has(sign))) units += EMOJI;
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

// A paragraph is a string in one face, or runs in several faces at one size: [{ text, face, kind }]
// (an organization's name in 700 before its full name in 500, "Motivo:" before the reason). The
// planned lines of runs are lists of segments { text, kind }.
const runsOf = (text, font) => (typeof text === 'string' ? [{ text, face: font.face, kind: '' }] : text);

// The space between two words: the widest of the paragraph's faces, the safe side.
const spaceOf = (text, font) => Math.max(...runsOf(text, font).map((run) => textWidth(' ', { ...font, face: run.face })));

// Spaces are the break points; a no-break space keeps its neighbours together.
const words = (text) => text.trim().split(/[ \t\r\n]+/).filter(Boolean);

// Where a word too wide for the line may break, as browsers do: after a slash or a hyphen (links,
// compounds) and before an emoji (unless a joiner ties it to the one before).
function breakPoints(word) {
  const signs = [...word];
  const pieces = [];
  let piece = '';
  signs.forEach((sign, i) => {
    if (piece && PICTOGRAPH.test(sign) && signs[i - 1] !== '‍' && !/[/-]$/.test(piece)) {
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

// The text as break units { text, width, glued, kind } (glued: no space before it, the rest of a
// word). A word wider than the line breaks at its break points; with `force`, a piece still too
// wide breaks between letters, the last resort once no smaller size is left to try.
function unitsOf(text, font, limit, force = false) {
  const units = [];
  for (const run of runsOf(text, font)) {
    const face = { ...font, face: run.face };
    for (const word of words(run.text)) {
      const pieces = textWidth(word, face) > limit ? breakPoints(word) : [word];
      pieces.forEach((piece, i) => {
        let glued = i > 0;
        for (const part of force && textWidth(piece, face) > limit ? splitLetters(piece, face, limit) : [piece]) {
          units.push({ text: part, width: textWidth(part, face), glued, kind: run.kind });
          glued = true;
        }
      });
    }
  }
  return units;
}

const joinUnits = (units) => units.map((unit, i) => (i > 0 && !unit.glued ? ' ' : '') + unit.text).join('');

// A line of runs as segments, one per change of kind.
function segmentsOf(units) {
  const segments = [];
  units.forEach((unit, i) => {
    const text = (i > 0 && !unit.glued ? ' ' : '') + unit.text;
    const last = segments[segments.length - 1];
    if (last && last.kind === unit.kind) last.text += text;
    else segments.push({ text, kind: unit.kind });
  });
  return segments;
}

// Short words that read badly at the end of a line ("Caminhada Ecológica de / Dourados"), the
// shorter the worse: "para a / Aldeia" hurts more than "de / Dourados", which hurts more than
// "para / a Aldeia".
const WEAK = new Set('a à ao aos as às o os e é de da do das dos em no na nos nas num numa com por pra pro para pelo pela pelos pelas um uma ou sem sob até que se'.split(' '));
const isWeak = (word) => WEAK.has(word.toLocaleLowerCase('pt-BR'));
const weakness = (word) => (!isWeak(word) ? 0 : word.length === 1 ? 1 : word.length <= 3 ? 0.6 : 0.3);
// Emoji alone on a line read as stray as short words alone ("FESTA DA PRIMAVERA / 🌸🎉 / …").
const EMOJI_ONLY = /^(?:\p{Extended_Pictographic}|[‍️⃣\u{1f3fb}-\u{1f3ff}])+$/u;
const isFiller = (word) => isWeak(word) || EMOJI_ONLY.test(word);

// What a line break costs, against 100 for a line left empty: after a short word (times its
// weakness), a line of nothing but short words, inside a word (after a slash or hyphen, or
// between letters); a break between clauses ("Baile dos Educadores –" over "Festa Tropical",
// "Dourados vem pra rua:" over "ato pela democracia", an address before its parenthesis) earns a
// little back.
const COST = { weakEnd: 90, weakLine: 200, inWord: 60, clause: -10, spareLine: 30 };
const CLAUSE_END = /[,;:.!?–—-]$/;

// Greedy fill, as a browser breaks: the fewest lines. Returns [start, end) unit ranges.
function fill(units, space, limit) {
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
function evenLines(units, space, limit, count, ragged) {
  const n = units.length;
  if (count <= 1 || n <= 1) return [[0, n]];
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
  if (best[count][n] === Infinity) return Object.assign(fill(units, space, limit), { cost: Infinity });
  const ranges = [];
  for (let k = count, j = n; k > 0; k--) {
    ranges.unshift([from[k][j], j]);
    j = from[k][j];
  }
  return Object.assign(ranges, { cost: best[count][n] });
}

// The text in the fewest lines no wider than `width` (less the FIT margin): evened out (titles,
// rows), `ragged` (the first lines kept full) or `greedy` (a paragraph, filled as a browser would).
// With `spare` (titles), one line more when it breaks better ("Eleição da Direção / e do Conselho
// Fiscal / do SIMTED" over "Eleição da Direção e do / Conselho Fiscal do SIMTED"), within `spare`
// lines. Lines of a string are strings; lines of runs are segments.
function planLines(text, font, width, { ragged = false, greedy = false, force = false, spare = 0 } = {}) {
  const limit = width * FIT;
  const units = unitsOf(text, font, limit, force);
  if (!units.length) return [];
  const space = spaceOf(text, font);
  const filled = fill(units, space, limit);
  let ranges = greedy ? filled : evenLines(units, space, limit, filled.length, ragged);
  if (!greedy && spare > filled.length && units.length > filled.length) {
    // A line more when it reads better, and always when it spares a line ending in a short word.
    const weakEnd = (list) => list.slice(0, -1).some(([, j]) => !units[j].glued && isWeak(units[j - 1].text));
    const more = evenLines(units, space, limit, filled.length + 1, ragged);
    if (more.cost < Infinity && (more.cost + COST.spareLine < ranges.cost || (weakEnd(ranges) && !weakEnd(more)))) ranges = more;
  }
  return ranges.map(([i, j]) => (typeof text === 'string' ? joinUnits(units.slice(i, j)) : segmentsOf(units.slice(i, j))));
}

// How many lines the text takes, at the fewest.
function lineCount(text, font, width, force = false) {
  const limit = width * FIT;
  return fill(unitsOf(text, font, limit, force), spaceOf(text, font), limit).length;
}

// True when every word fits on a line by itself (links and compounds may break after / and -).
function wordsFit(text, font, width) {
  const limit = width * FIT;
  return unitsOf(text, font, limit).every((unit) => unit.width <= limit);
}

// The planned lines at this size, or null when a word doesn't fit or they are more than maxLines.
function fitLines(text, font, width, maxLines, layout = {}) {
  if (!wordsFit(text, font, width) || lineCount(text, font, width) > maxLines) return null;
  return planLines(text, font, width, { ...layout, spare: layout.spare ? maxLines : 0 });
}

// How badly planned lines read: lines ending in a short word (summing their weakness), lines of
// nothing but short words or emoji, and lines of a single word in a title of more than three.
function badBreaks(lines) {
  const split = lines.map((line) => line.split(/[ \u00a0]/));
  const many = sum(split.map((list) => list.length)) > 3;
  return {
    weakEnds: sum(split.slice(0, -1).map((list) => weakness(list[list.length - 1]))),
    weakLines: lines.length > 1 ? split.filter((list) => list.every(isFiller)).length : 0,
    oneWord: many && lines.length > 1 ? split.filter((list) => list.length === 1).length : 0,
  };
}

// Runaway text cut to `maxLines` with an ellipsis (and `tail` after it: the city after a place;
// `wrap` puts the text back in its paragraph: the reason after "Motivo:"). It ends at the last
// clause that fits (before ; , a dash or a parenthesis) unless that keeps less than half of what
// ending at the last word that fits keeps; failing both, between letters.
function cut(text, font, width, maxLines, { tail = '', force = false, wrap = (t) => t } = {}) {
  const fits = (t) => lineCount(wrap(t), font, width, force) <= maxLines;
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
  if (tail) return cut(tail.replace(/^,\s*/, ''), font, width, maxLines, { force, wrap });
  let head = list[0] || '';
  while ([...head].length > 1 && !fits(close(head))) head = [...head].slice(0, -1).join('');
  return close(head);
}

// The first of `steps` ([size, maxLines], largest first) at which the text fits its lines with no
// word broken. Past the steps the size goes on down, 2px at a time to `floor`, while the longest
// word is wider than the line (and, for a title, `shrink`, while the text takes more lines than
// the last step allows); then the text is cut to the last step's lines, and at the floor a word
// still too wide breaks between letters. `tail` stays whole after a cut (the city of a place);
// `ragged` keeps the first lines full; `spare` lets a title take a line more where it breaks
// better. Returns { text, size, font, lines }.
function pickSize(text, font, width, steps, { floor, tail = '', ragged = false, shrink = false, spare = false } = {}) {
  for (const [size, maxLines] of steps) {
    const sized = { ...font, size };
    const lines = fitLines(text + tail, sized, width, maxLines, { ragged, spare });
    if (lines) return { text: text + tail, size, font: sized, lines };
  }
  const [last, maxLines] = steps[steps.length - 1];
  let size = last;
  const over = (sized) => !wordsFit(text + tail, sized, width) || (shrink && lineCount(text + tail, sized, width) > maxLines);
  while (size > (floor ?? last) && over({ ...font, size })) size -= 2;
  if (shrink && !over({ ...font, size })) {
    const sized = { ...font, size };
    return { text: text + tail, size, font: sized, lines: planLines(text + tail, sized, width, { ragged }) };
  }
  const sized = { ...font, size };
  const force = !wordsFit(text + tail, sized, width);
  const shown = cut(text, sized, width, maxLines, { tail, force });
  return { text: shown, size, font: sized, lines: planLines(shown, sized, width, { ragged, force }) };
}

// Text at a set size in at most `maxLines`: cut when longer, a word too wide broken between letters.
function setLines(text, font, width, maxLines) {
  const force = !wordsFit(text, font, width);
  return planLines(cut(text, font, width, maxLines, { force }), font, width, { force });
}

// ---------- Facts ----------

const sum = (values) => values.reduce((a, b) => a + b, 0);
const between = (from, to, t) => from + (to - from) * t;

// No-break spaces where a line must not break: before a spaced dash, so it ends a line and never
// starts one ("Baile dos Educadores –" over "Festa Tropical"), and after an abbreviation ("R.
// João"). Short words ("de", "com", "e") are kept with the next word by the line planning.
const tidy = (text) => text
  .replace(/ ([–—-]) /g, `${NBSP}$1 `)
  .replace(/(^|[\s(])(R|Av|Al|Pç|Rod|Dr|Dra|Prof|Profa|Sr|Sra|Sto|Sta|Vl|Jd|Pq)\. (?=\S)/g, `$1$2.${NBSP}`);

// "sexta", "sábado": the weekday without "-feira"; "sex", "sáb".
const weekdayShort = (date) => weekdayName(date).split('-')[0];
const weekdayTiny = (date) => weekdayName(date).slice(0, 3);

// The sky of the hour the activity starts (js/sky.js's hours); the day's when there is no time.
function skyOf(ev) {
  if (ev.time == null) return 'day';
  return skyPeriod(new Date(2000, 0, 1, Math.floor(ev.time / 60), ev.time % 60));
}

// The time as the flyers write it: the start, and the end apart ("19h30", "às 22h30"); an end
// alone ("até 12h"); a text from the sheet that isn't a time, as it is. Empty when there is none.
function timeParts(ev) {
  const start = ev.time != null ? formatTime(ev.time) : ev.timeRaw.trim();
  const end = ev.endTime != null ? formatTime(ev.endTime) : ev.endTimeRaw.trim();
  if (start && end) return { start, end: `às${NBSP}${end}` };
  if (end) return { start: `até${NBSP}${end}`, end: '' };
  return { start, end: '' };
}
const NO_TIME = 'Horário a confirmar';

const hasPlace = (ev) => Boolean(ev.local || ev.city);
const orgNames = (ev) => (ev.orgs.length ? ev.orgs : ev.org ? [ev.org] : []);

// "Chácara do SIMTED", "Praça Ary Coelho, Campo Grande" or just the city. A place cut short keeps
// its city: "Praça Ary Coelho (concentração)…, Campo Grande".
function fitPlace(ev, font, width, steps, floor) {
  const local = tidy(ev.local);
  if (local && ev.city) return pickSize(local, font, width, steps, { floor, tail: `, ${ev.city}` });
  return pickSize(local || ev.city, font, width, steps, { floor });
}

// Short names ("DCE UFGD") never break.
const keepName = (name) => (name.length <= 16 ? name.replace(/ /g, NBSP) : tidy(name));

// "A", "A e B", "A, B e C"; naming fewer, "A, B e mais 2".
function listOrgs(names, shown = names.length) {
  const list = names.map(keepName);
  if (shown < list.length) return `${list.slice(0, shown).join(', ')} e mais${NBSP}${list.length - shown}`;
  return list.length > 1 ? `${list.slice(0, -1).join(', ')} e ${list[list.length - 1]}` : list[0];
}

// The organizations as runs: each name (700, ink) with its full name where ORG_NAMES knows it (500,
// soft): "SIMTED · Sindicato Municipal…" for one, "SIMTED (Sindicato…) e ADUF Dourados
// (Associação…)" for several. `fulls`: how many of the known full names to give, from the first.
function orgRuns(names, shown, fulls) {
  const runs = [];
  const add = (text, kind) => {
    const face = kind === 'name' ? NAME_FACE : FULL_FACE;
    const last = runs[runs.length - 1];
    if (last && last.kind === kind) last.text += ` ${text}`;
    else runs.push({ text, face, kind });
  };
  const list = names.slice(0, shown);
  const more = names.length - shown;
  let given = 0;
  list.forEach((name, i) => {
    if (i > 0 && i === list.length - 1 && !more) add('e', 'sep');
    const full = given < fulls ? orgFullName(name) : '';
    if (full) given++;
    const comma = i < list.length - 1 && !(i === list.length - 2 && !more) ? ',' : '';
    if (!full) add(keepName(name) + comma, 'name');
    else if (names.length === 1) {
      add(keepName(name), 'name');
      add(`· ${tidy(full)}`, 'full');
    } else {
      add(keepName(name), 'name');
      add(`(${tidy(full)})${comma}`, 'full');
    }
  });
  if (more) add(`e mais${NBSP}${more}`, 'sep');
  return runs;
}

// The organizations, naming as many as fit (at most four, then "e mais N"), each count tried with
// every full name, then the first one's only, then none, at every step ([size, maxLines]) before a
// name is dropped. Returns what pickSize returns, its lines as segments.
function fitOrgs(names, width, steps, floor) {
  for (let shown = Math.min(4, names.length); shown >= 1; shown--) {
    const known = names.slice(0, shown).filter(orgFullName).length;
    for (const fulls of known > 1 ? [Infinity, 1, 0] : known ? [1, 0] : [0]) {
      const runs = orgRuns(names, shown, fulls);
      for (const [size, maxLines] of steps) {
        const font = { face: NAME_FACE, size };
        const lines = fitLines(runs, font, width, maxLines);
        if (lines) return { text: runs, size, font, lines };
      }
    }
  }
  const fit = pickSize(listOrgs(names, 1), { face: NAME_FACE }, width, steps.slice(-1), { floor });
  return { ...fit, lines: fit.lines.map((text) => [{ text, kind: 'name' }]) };
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

// Set at planned coordinates on the flyer (css/flyers.css: .fl-at is absolute).
function at(node, box) {
  node.classList.add('fl-at');
  for (const [side, value] of Object.entries(box)) if (value != null) node.style[side] = px(value);
  return node;
}

// One planned line: a string, a node, or segments ({ text, kind }: a kind gets its span, .fl-<kind>).
function lineNode(line) {
  if (!Array.isArray(line)) return h('span', 'fl-line', line);
  return h('span', 'fl-line', line.map((part) => (part instanceof Node || typeof part === 'string' ? part : part.kind ? h('span', `fl-${part.kind}`, part.text) : part.text)));
}

// Text set in the lines planned for it: one block per line that never wraps (css/flyers.css).
// The spaces between the blocks draw nothing; they only keep the node's text readable.
function lined(tag, className, lines, size) {
  const node = h(tag, className);
  lines.forEach((line, i) => {
    if (i > 0) node.append(' ');
    node.append(lineNode(line));
  });
  return size ? sized(node, size) : node;
}

// Lines of NOS's voice on the sky, placed by the baseline of the first (the next ones `lh` em apart).
function voice(className, lines, size, { left, right, baseline, lh = 1 }) {
  const node = lined('div', className, lines, size);
  node.style.lineHeight = String(lh);
  return at(node, { left, right, top: baseline - (lh / 2 + DISPLAY.base) * size });
}

// ---------- The world: sky, band, land ----------

const SIDE = 72; // the margins at the left and right
const WIDTH = FLYER_WIDTH - 2 * SIDE;
const BAND = 64; // the woven band, the horizon (.fl-band)
const SLOT = 52; // a row's dot or icon: its slot 38 and the gap 14 (.fl-row-mark)
const ROW_WIDTH = WIDTH - SLOT;
const ROW_GAP = 14; // between the rows (.fl-rows)
const LAND_TOP = 50; // the band → the land's first line box (.fl-land)
const SIGN_SPACE = 40 + 64 + 46; // the air over the signature, the signature, its margin to the foot (.fl-sign)

// The tops of sky bands 5 … 2 above the horizon, as shares of the sky's height (band 1 takes the
// rest): thinner near the horizon, as the pages' sky.
const BAND_TOPS = [0.075, 0.17, 0.29, 0.44];

// The sky over [0, horizon): five flat bands. `edges`: the tops of bands 2 … 5, from BAND_TOPS
// unless a layout sets them (the month's weeks).
function skyNode(horizon, edges = [...BAND_TOPS].reverse().map((share) => Math.round(horizon * (1 - share)))) {
  const sky = h('div', 'fl-sky');
  sky.style.height = px(horizon);
  const tops = [0, ...edges, horizon];
  for (let i = 0; i < 5; i++) {
    const band = h('div', `fl-sky-band is-${i + 1}`);
    band.style.top = px(tops[i]);
    band.style.height = px(tops[i + 1] - tops[i]);
    sky.append(band);
  }
  return sky;
}

// The sky's band edges kept clear of its type. An edge across a line of text splits its letters
// between two colours and, near their tops or their feet, reads as the text standing on it or hanging
// from it. So no edge crosses a line of text, from its capitals to its descenders with a margin of
// 0.15em (8px to 22px); display type of GIANT size and up (the numeral, the time, a poster's title,
// "Cancelada"), which the bands must cross, only keeps its cap line, its x-height line and its foot
// clear. An edge that would cross moves to the nearest clear place, the bands kept in order and at
// least MIN_BAND tall. `lines`: [{ baseline, size, metrics, digits }] (figures have no x-height).
const MIN_BAND = 18;
const GIANT = 120;
function clearEdges(horizon, lines, edges = [...BAND_TOPS].reverse().map((share) => Math.round(horizon * (1 - share)))) {
  const near = lines.flatMap(({ baseline, size, metrics = DISPLAY, digits = false }) => {
    const pad = Math.max(8, Math.min(22, 0.15 * size));
    const top = baseline - metrics.cap * size;
    const foot = [baseline - pad, baseline + (digits ? pad : Math.max(pad, metrics.descent * size + 6))];
    if (size < GIANT) return [[top - pad, foot[1]]];
    const x = baseline - metrics.x * size;
    return [[top - pad, top + pad], ...(digits ? [] : [[x - pad, x + pad]]), foot];
  });
  // Zones closer than MIN_BAND merge: an edge never squeezes between two lines of a block.
  const zones = near.sort((p, q) => p[0] - q[0]).reduce((list, zone) => {
    const last = list[list.length - 1];
    if (last && zone[0] - last[1] < MIN_BAND) last[1] = Math.max(last[1], zone[1]);
    else list.push([...zone]);
    return list;
  }, []);
  const clear = (y) => zones.every(([a, b]) => y <= a || y >= b);
  // Placed from the top down, and from the bottom up: the order that leaves fewer edges crossing
  // (then the one that moves them less) wins.
  const place = (order) => {
    const out = [...edges];
    const done = new Set();
    for (const i of order) {
      const above = [...done].filter((j) => j < i);
      const below = [...done].filter((j) => j > i);
      const low = above.length ? out[Math.max(...above)] + MIN_BAND * (i - Math.max(...above)) : MIN_BAND * (i + 1);
      const high = below.length ? out[Math.min(...below)] - MIN_BAND * (Math.min(...below) - i) : horizon - MIN_BAND * (out.length - i);
      const start = Math.max(low, Math.min(high, edges[i]));
      out[i] = start;
      for (let d = 0; start - d >= low || start + d <= high; d++) {
        if (start - d >= low && clear(start - d)) { out[i] = start - d; break; }
        if (start + d <= high && clear(start + d)) { out[i] = start + d; break; }
      }
      done.add(i);
    }
    return { out, crossing: out.filter((y) => !clear(y)).length, moved: sum(out.map((y, i) => Math.abs(y - edges[i]))) };
  };
  const indices = edges.map((_, i) => i);
  const [best] = [place(indices), place([...indices].reverse())].sort((a, b) => a.crossing - b.crossing || a.moved - b.moved);
  return best.out;
}

// The sun or the moon (HAND.astro): the hand's loop around a disc of radius `r` centred at (x, y),
// a little off register; the pen grows with it. css/flyers.css paints it from the sky's roles.
function astroNode(x, y, r) {
  const { viewBox, disc, d } = HAND.astro;
  const box = (r * 120) / disc.r;
  const node = fromHtml(`<svg class="fl-astro" viewBox="${viewBox}" aria-hidden="true"><circle cx="${disc.cx}" cy="${disc.cy}" r="${disc.r}"/><path vector-effect="non-scaling-stroke" d="${d}"/></svg>`);
  node.style.left = px(x - (disc.cx / 120) * box);
  node.style.top = px(y - (disc.cy / 120) * box);
  node.style.width = px(box);
  node.style.height = px(box);
  node.style.setProperty('--pen', px(Math.max(3, box * 0.011)));
  return node;
}

// Where the sun stands at each hour: the share of its disc above the horizon, rising at dawn,
// high by day, setting at dusk.
const SUN_UP = { dawn: 0.38, day: 0.5, dusk: 0.32 };

// The night's stars: a fixed field (the same every time), spread over `area` and kept off the
// boxes in `avoid` (the moon, the text), about one star per 9000px².
const STAR_FIELD = (() => {
  let seed = 11;
  const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  return Array.from({ length: 80 }, () => ({ x: random(), y: random(), r: 1.6 + random() * 2.2 }));
})();

function starsNode(area, avoid = []) {
  const width = area.right - area.left;
  const height = area.bottom - area.top;
  if (width <= 0 || height <= 0) return null;
  const count = Math.max(6, Math.min(STAR_FIELD.length, Math.round((width * height) / 9000)));
  const clear = (x, y) => avoid.every((box) => x < box.left - 20 || x > box.right + 20 || y < box.top - 20 || y > box.bottom + 20);
  const dots = STAR_FIELD.slice(0, count)
    .map(({ x, y, r }) => ({ x: area.left + x * width, y: area.top + y * height, r }))
    .filter(({ x, y }) => clear(x, y));
  return fromHtml(`<svg class="fl-stars" viewBox="0 0 ${FLYER_WIDTH} ${area.bottom}" width="${FLYER_WIDTH}" height="${area.bottom}" aria-hidden="true">${dots.map(({ x, y, r }) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}"/>`).join('')}</svg>`);
}

const bandNode = (horizon) => at(h('div', 'fl-band'), { top: horizon });

// The land under the band: the activity's blocks in a column from its top.
const landNode = (horizon, ...blocks) => at(h('div', 'fl-land', ...blocks), { top: horizon + BAND });

// NOS's signature at the foot of the land: the mark beside the city, the agenda and its address.
const signature = () =>
  h('div', 'fl-sign',
    h('div', 'fl-sign-brand', fromHtml(brandMark(APP_NAME)), h('span', 'fl-sign-city', HOME)),
    h('div', 'fl-sign-text', h('span', null, FOOTER_LINE), SITE && h('span', 'fl-sign-site', SITE)));

// A row of facts: a slot with the group's dot or the place's icon, then the text in its planned
// lines. `fit` comes from fitOrgs, fitPlace or pickSize.
function row(kind, mark, fit) {
  return sized(h('div', `fl-row is-${kind}`, h('span', 'fl-row-mark', mark), lined('span', 'fl-row-text', fit.lines)), fit.size);
}
const placeRow = (ev, fit) => fit && row('place', fromHtml(icon(ev.online ? 'globe' : 'pin', 'fl-icon')), fit);
const orgRow = (fit) => fit && row('org', h('span', 'fl-dot'), fit);
const rowsNode = (...rows) => (rows.some(Boolean) ? h('div', 'fl-rows', ...rows) : null);

const linesHeight = (fit, lh) => (fit ? fit.lines.length * fit.size * lh : 0);
function rowsHeight(...fits) {
  const parts = fits.filter(Boolean);
  return sum(parts.map((fit) => linesHeight(fit, LH.row))) + ROW_GAP * Math.max(0, parts.length - 1);
}

const titleNode = (title, className = 'fl-title') => lined('div', className, title.lines, title.size);

// ---------- 1. Folha do dia ----------
// The day is the hero: its numeral stands on the horizon in front of the rising sun (under the
// small moon at night), the weekday, the month and the time beside it on the sky; the land says
// what it is, who organizes it and where.

const DAY = {
  air: 40, // the numeral's baseline above the band
  topAir: 104, // least sky over the numeral, by day…
  moonAir: 236, // …and under the moon, at night
  maxNumeral: 600,
  minNumeral: 280,
  colGap: 40, // the column ↔ the numeral
  colMin: 320, // the column's least width
  titleGap: 30, // the title → the rows (.fl--day .fl-rows)
  holiday: 40, // a holiday's name under the title (.fl--day .dy-holiday)
  holidayGap: 8, // the title → the holiday (.fl--day .dy-holiday)
};

// Tighter and tighter land, until the sky holds a numeral of DAY.minNumeral; a title that doesn't
// fit a step's sizes (or the size its length allows) goes on to the next, and only the last cuts.
const DAY_STEPS = [
  { title: [[84, 2], [76, 3], [68, 3]], rows: [[40, 2], [36, 3]] },
  { title: [[72, 2], [64, 3], [56, 3]], rows: [[36, 2], [34, 3]] },
  { title: [[60, 2], [52, 3], [46, 3]], rows: [[34, 2], [32, 3]] },
  { title: [[48, 3], [42, 3]], rows: [[32, 2], [30, 2]] },
];

// A title at the first of `steps` it fits with no word broken, unless a later step spares it a
// line ending in a short word; or null. The last step shrinks it further and, past its floor, cuts
// it.
function fitTitle(text, steps, last) {
  let first = null;
  for (const [size, maxLines] of steps) {
    const font = { ...TITLE, size };
    const lines = fitLines(text, font, WIDTH, maxLines, { spare: true });
    if (!lines) continue;
    if (!badBreaks(lines).weakEnds) return { text, size, font, lines };
    first ??= { text, size, font, lines };
  }
  if (first || !last) return first;
  return pickSize(text, TITLE, WIDTH, steps, { floor: 34, shrink: true, spare: true });
}

// The column beside the numeral, scaled by k from the 560px numeral: the weekday and the month from
// the numeral's top (their capitals on its line), the time (or "Horário a confirmar") on its
// baseline. Returns its lines, or null when the two groups would meet.
function dayColumn(ev, k, width, capTop, baseline, timeScale) {
  const date = ev.date;
  const fit = (text, font, max, min) => sizeToWidth(text, font, width, Math.round(max * k), Math.round(min * k));
  const weekday = capitalize(weekdayShort(date));
  const month = monthName(date.getMonth());
  const sw = fit(weekday, VOICE, 100 * timeScale ** 0.5, 40);
  const sm = fit(month, VOICE_SOFT, 58 * timeScale ** 0.5, 28);

  // The bottom group, up from the baseline: the time (its end apart), or the words for no time;
  // over them "até 24/10" for a period.
  const { start, end } = timeParts(ev);
  const bottom = [];
  let y = baseline;
  if (start) {
    const se = end ? fit(end, VOICE_SOFT, 60 * timeScale, 26) : 0;
    if (end) {
      bottom.unshift({ cls: 'dy-end', lines: [end], size: se, baseline: y });
      y -= DISPLAY.accent * se + 0.32 * se;
    }
    const maxStart = 180 * timeScale;
    let st = fit(start, VOICE, maxStart, 1);
    let startLines = [start];
    if (st < Math.round(56 * k)) {
      // A text from the sheet ("manhã, tarde e noite"): in lines at a readable size, smaller
      // before it is cut.
      const sizes = [52, 44, 38].map((n) => Math.round(n * k * timeScale ** 0.5));
      const found = sizes.map((size) => ({ size, lines: fitLines(start, { ...VOICE, size }, width, 4) })).find((f) => f.lines);
      st = found ? found.size : sizes[sizes.length - 1];
      startLines = found ? found.lines : setLines(start, { ...VOICE, size: st }, width, 4);
    }
    startLines.slice().reverse().forEach((line, i) => {
      bottom.unshift({ cls: 'dy-time', lines: [line], size: st, baseline: y - i * 1.04 * st });
    });
    y -= (startLines.length - 1) * 1.04 * st + DISPLAY.accent * st;
  } else {
    const sc = Math.round(48 * k);
    const lines = setLines(NO_TIME, { ...VOICE_SOFT, size: sc }, width, 2);
    lines.slice().reverse().forEach((line, i) => bottom.unshift({ cls: 'dy-tbc', lines: [line], size: sc, baseline: y - i * 1.1 * sc }));
    y -= (lines.length - 1) * 1.1 * sc + DISPLAY.accent * sc;
  }
  if (ev.endDate) {
    const su = fit(`até ${formatDayMonth(ev.endDate)}`, VOICE_SOFT, 46, 26);
    const ub = y - 0.3 * su - DISPLAY.descent * su;
    bottom.unshift({ cls: 'dy-until', lines: [`até${NBSP}${formatDayMonth(ev.endDate)}`], size: su, baseline: ub });
    y = ub - DISPLAY.accent * su;
  }
  const bottomTop = y;

  // The top group, down from the numeral's top: the weekday's capitals on the numeral's top line.
  const weekdayBaseline = capTop + DISPLAY.cap * sw;
  const monthBaseline = weekdayBaseline + 0.22 * sw + 0.92 * sm;
  if (monthBaseline + DISPLAY.descent * sm + 24 * k > bottomTop) return null;
  const top = [
    { cls: 'dy-weekday', lines: [weekday], size: sw, baseline: weekdayBaseline },
    { cls: 'dy-month', lines: [month], size: sm, baseline: monthBaseline },
  ];
  return { items: [...top, ...bottom], top: weekdayBaseline - DISPLAY.accent * sw };
}

function dayFlyer(ev, sky) {
  const date = ev.date;
  const night = sky === 'night';
  const names = orgNames(ev);
  const tier = ev.title.length <= 28 ? 84 : ev.title.length <= 56 ? 76 : 64;
  const topAir = night ? DAY.moonAir : DAY.topAir;

  // A holiday is named on the land, under the title.
  const holiday = holidayOn(date);
  const holidayFont = { ...VOICE_SOFT, size: DAY.holiday };
  const holidayName = holiday ? setLines(textWidth(holiday.name, holidayFont) <= WIDTH * FIT ? holiday.name : holiday.short, holidayFont, WIDTH, 1)[0] : '';

  let plan;
  DAY_STEPS.forEach((step, i) => {
    if (plan && (plan.horizon - DAY.air - topAir) / DISPLAY.cap >= DAY.minNumeral) return;
    const last = i === DAY_STEPS.length - 1;
    const steps = step.title.filter(([s]) => s <= tier);
    const title = steps.length ? fitTitle(tidy(ev.title), steps, last) : null;
    if (!title) return;
    const org = names.length ? fitOrgs(names, ROW_WIDTH, step.rows, 26) : null;
    const where = hasPlace(ev) ? fitPlace(ev, PLACE, ROW_WIDTH, step.rows, 26) : null;
    const rows = rowsHeight(org, where);
    const land = LAND_TOP + linesHeight(title, LH.title) + (holidayName ? DAY.holidayGap + DAY.holiday * LH.when : 0) + (rows ? DAY.titleGap + rows : 0) + SIGN_SPACE;
    plan = { title, org, where, horizon: Math.round(FLYER_HEIGHT - BAND - land) };
  });
  const { title, org, where, horizon } = plan;

  // The numeral: as tall as the sky allows, leaving the column its width; then smaller while the
  // column doesn't fit beside it (its time a little smaller first).
  const baseline = horizon - DAY.air;
  const day = String(date.getDate());
  const numeralWidth = (size) => textWidth(day, { ...NUMERAL, size });
  let size = Math.max(DAY.minNumeral, Math.min(DAY.maxNumeral, Math.floor((baseline - topAir) / DISPLAY.cap)));
  while (size > DAY.minNumeral && numeralWidth(size) > WIDTH - DAY.colGap - DAY.colMin) size -= 4;
  const width = WIDTH - numeralWidth(size) - DAY.colGap;
  const capTop = baseline - DISPLAY.cap * size;
  let column = null;
  for (const scale of [1, 0.85, 0.72, 0.6, 0.5]) {
    column = dayColumn(ev, size / 560, width, capTop, baseline, scale);
    if (column) break;
  }
  column ??= { items: [], top: capTop };

  const lines = [{ baseline, size, digits: true }, ...column.items.map((item) => item.lines.map((line, i) => ({ baseline: item.baseline + i * item.size, size: item.size })))].flat();
  const skyEl = skyNode(horizon, clearEdges(horizon, lines));
  const nw = numeralWidth(size);
  if (night) {
    const r = Math.round(size * 0.11);
    const moon = { x: FLYER_WIDTH - SIDE - r - 6, y: Math.max(56 + r, capTop - r - 56), r };
    const moonBox = { left: moon.x - r * 1.25, right: moon.x + r * 1.25, top: moon.y - r * 1.25, bottom: moon.y + r * 1.25 };
    const textBox = { left: SIDE, right: SIDE + width, top: column.top - 20, bottom: baseline };
    skyEl.append(starsNode({ left: 36, right: FLYER_WIDTH - 36, top: 28, bottom: Math.min(capTop, column.top) - 24 }, [moonBox, textBox]) || '', astroNode(moon.x, moon.y, r));
  } else {
    // The sun rises behind the band at the right, running off the edge, the numeral in front of it.
    const r = Math.round(size * 0.62);
    const x = FLYER_WIDTH - SIDE - nw / 2 + r * 0.32;
    skyEl.append(astroNode(x, horizon - SUN_UP[sky] * 2 * r + r, r));
  }

  const numeral = voice('dy-num', [day], size, { right: SIDE, baseline, lh: 0.75 });
  const items = column.items.map((item) => voice(item.cls, item.lines, item.size, { left: SIDE, baseline: item.baseline }));

  return [
    skyEl,
    numeral,
    ...items,
    bandNode(horizon),
    landNode(horizon, titleNode(title), holidayName && sized(h('div', 'dy-holiday', holidayName), DAY.holiday), rowsNode(orgRow(org), placeRow(ev, where))),
    signature(),
  ];
}

// ---------- 2. Agenda do mês ----------
// The month on the sky: its weeks are the sky's bands, the first under the month's name and the last
// on the horizon, and the activity's day is the sun (the moon, for an evening) drawn round by the
// hand, the other days of a period underlined; the land says what, when, who and where.

const MONTH = {
  top: 50, // the sky's top → the month's line box
  name: 104, // the month's name (Bricolage 800; .mo-name)
  headsGap: 22, // the name's line box → the weekday heads' line box
  heads: 26, // the weekday heads (Inter 600 in capitals, line box 1.2; .mo-heads)
  weeksGap: 8, // the heads → the first week
  air: 12, // the last week → the band
  whenGap: 14, // the title → the when (.mo-when)
  rowsGap: 28, // the when → the rows (.fl--month .fl-rows)
  minWeek: { 4: 96, 5: 84, 6: 72 }, // least height of a week, by the weeks in the month
};

// Tighter and tighter land, until the weeks keep a readable height.
const MONTH_STEPS = [
  { title: [[76, 2], [68, 3]], line: 44, rows: [[38, 2], [34, 3]] },
  { title: [[68, 2], [60, 3]], line: 40, rows: [[36, 2], [32, 3]] },
  { title: [[60, 2], [52, 3]], line: 38, rows: [[34, 2], [30, 3]] },
  { title: [[52, 3], [44, 3]], line: 36, rows: [[32, 2], [30, 2]] },
  { title: [[44, 3], [40, 3]], line: 34, rows: [[30, 2], [30, 1]] },
  { title: [[40, 2]], line: 32, rows: [[28, 1]] },
];

const WEEK_HEAD = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

// "Sexta, 20 de novembro, 14h às 22h" or "De sexta, 16 de outubro a sábado, 24 de outubro, 19h",
// each date in one piece ("sábado, 24 de outubro"), the time too; "horário a confirmar" without one.
function longWhen(ev) {
  const day = (d) => `${weekdayShort(d)}, ${d.getDate()} de ${monthName(d.getMonth())}`.replace(/ /g, NBSP);
  const when = ev.endDate ? `De ${day(ev.date)} a ${day(ev.endDate)}` : capitalize(day(ev.date));
  const { start, end } = timeParts(ev);
  // A time stays in one piece; a text from the sheet that isn't one breaks as text.
  const time = !start ? 'horário a confirmar' : ev.time != null ? [start, end].filter(Boolean).join(' ').replace(/ /g, NBSP) : [start, end].filter(Boolean).join(' ');
  return `${when}, ${time}`;
}

// The date lines, then " · " and the holiday on the last one, or the holiday on a line of its own
// when it doesn't fit there. Returns lines of segments.
function whenLines(ev, holiday, font, width) {
  const lines = planLines(longWhen(ev), font, width).map((text) => [{ text, kind: '' }]);
  if (!holiday) return lines;
  const name = textWidth(holiday.name, font) <= width * FIT ? holiday.name : holiday.short;
  const last = lines[lines.length - 1];
  if (textWidth(`${last[0].text} · ${name}`, font) <= width * FIT) last.push({ text: ' · ', kind: '' }, { text: name, kind: 'holiday' });
  else lines.push([{ text: name, kind: 'holiday' }]);
  return lines;
}

function monthFlyer(ev, sky) {
  const date = ev.date;
  const night = sky === 'night';
  const year = date.getFullYear();
  const month = date.getMonth();
  const offset = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const weeks = Math.ceil((offset + days) / 7);
  const names = orgNames(ev);
  const holiday = holidayOn(date);
  const tier = ev.title.length <= 28 ? 76 : ev.title.length <= 56 ? 68 : 60;
  const weeksTop = MONTH.top + MONTH.name + MONTH.headsGap + MONTH.heads * 1.2 + MONTH.weeksGap;

  let plan;
  for (const [i, step] of MONTH_STEPS.entries()) {
    const steps = step.title.filter(([s]) => s <= tier);
    const title = steps.length ? fitTitle(tidy(ev.title), steps, i === MONTH_STEPS.length - 1) : null;
    if (!title) continue;
    const when = whenLines(ev, holiday, { ...VOICE, size: step.line }, WIDTH);
    const org = names.length ? fitOrgs(names, ROW_WIDTH, step.rows, 26) : null;
    const where = hasPlace(ev) ? fitPlace(ev, PLACE, ROW_WIDTH, step.rows, 26) : null;
    const rows = rowsHeight(org, where);
    const land = LAND_TOP + linesHeight(title, LH.title) + MONTH.whenGap + when.length * step.line * LH.when + (rows ? MONTH.rowsGap + rows : 0) + SIGN_SPACE;
    const horizon = Math.round(FLYER_HEIGHT - BAND - land);
    const week = (horizon - MONTH.air - weeksTop) / weeks;
    plan = { step, title, when, org, where, horizon, week };
    if (week >= MONTH.minWeek[weeks]) break;
  }
  const { step, title, when, org, where, horizon, week } = plan;

  // The weeks' rows are the sky's bands: band 5 the last week (down to the horizon), band 4 the one
  // before, …, band 1 the month's name, its heads and any first weeks.
  const rowTop = (i) => weeksTop + i * week;
  const edges = [4, 3, 2, 1].map((back) => Math.round(rowTop(Math.max(0, weeks - back))));
  const skyEl = skyNode(horizon, edges);

  const cell = WIDTH / 7;
  const numeral = Math.min(60, Math.round(week * 0.5));
  const covered = new Set(dayKeys(ev));
  const marks = [];
  const nums = [];
  for (let n = 1; n <= days; n++) {
    const i = offset + n - 1;
    const d = new Date(year, month, n);
    const key = dateKey(d);
    const x = SIDE + (i % 7) * cell;
    const y = rowTop(Math.floor(i / 7));
    const cx = x + cell / 2;
    const cy = y + week / 2;
    if (key === ev.dateKey) {
      skyEl.append(astroNode(cx, cy, Math.min(cell * 0.4, week * 0.5)));
    } else if (covered.has(key)) {
      const line = fromHtml(`<svg class="fl-hand mo-under" viewBox="${HAND.underline.viewBox}" preserveAspectRatio="none" aria-hidden="true"><path vector-effect="non-scaling-stroke" d="${HAND.underline.d}"/></svg>`);
      marks.push(at(line, { left: cx - cell * 0.3, top: cy + numeral * 0.42, width: cell * 0.6, height: numeral * 0.2 }));
    }
    // Sundays and holidays, the days off, in the soft ink.
    const kind = key === ev.dateKey ? ' is-day' : isRedLetter(d) ? ' is-off' : '';
    const num = at(sized(h('span', `mo-num${kind}`, String(n)), numeral), { left: x, top: cy - numeral / 2, width: cell, height: numeral });
    nums.push(num);
  }

  const nameText = capitalize(monthName(month));
  const nameNode = voice('mo-name', [nameText], MONTH.name, { left: SIDE, baseline: MONTH.top + (0.5 + DISPLAY.base) * MONTH.name });
  const yearSize = Math.round(MONTH.name * 0.46);
  const nameWidth = textWidth(nameText, { ...VOICE, size: MONTH.name });
  const yearNode = voice('mo-year', [String(year)], yearSize, { left: SIDE + nameWidth + 22, baseline: MONTH.top + (0.5 + DISPLAY.base) * MONTH.name });
  const heads = at(h('div', 'mo-heads', WEEK_HEAD.map((label) => h('span', null, label))), { left: SIDE, top: MONTH.top + MONTH.name + MONTH.headsGap, width: WIDTH });
  if (night) {
    const right = SIDE + nameWidth + 22 + textWidth(String(year), { ...VOICE_SOFT, size: yearSize });
    skyEl.append(starsNode({ left: right + 40, right: FLYER_WIDTH - 36, top: 24, bottom: MONTH.top + MONTH.name + MONTH.headsGap - 6 }) || '');
  }

  const whenNode = lined('div', 'mo-when', when, step.line);
  return [
    skyEl,
    nameNode,
    yearNode,
    heads,
    ...marks,
    ...nums,
    bandNode(horizon),
    landNode(horizon, titleNode(title), whenNode, rowsNode(orgRow(org), placeRow(ev, where))),
    signature(),
  ];
}

// ---------- 3. Cartaz ----------
// A poster: the title as large as the sky allows, the sun rising behind the band at the right (the
// small moon high among the stars at night); on the land, the date circled by hand with the time,
// then who organizes it and where.

const POSTER = {
  top: 76, // the sky's top → the title's first line box, by day…
  topNight: 228, // …and under the moon, at night
  air: 52, // the title's last line box → the band, at night
  sunRoom: 160, // by day, the least sky kept under the title for the sun to rise in
  sun: 320, // the sun's radius
  whenGap: 30, // the when → the rows (.fl--poster .fl-rows)
  loop: { x: 0.4, top: -0.02, height: 1.42 }, // the hand's loop around the date, in em of its line
};

// Tighter and tighter land, until the title keeps a poster's size.
const POSTER_STEPS = [
  { when: 84, rows: [[40, 2], [36, 3]] },
  { when: 76, rows: [[36, 2], [32, 3]] },
  { when: 68, rows: [[32, 2], [30, 3]] },
  { when: 60, rows: [[30, 2], [28, 2]] },
];

// The when: "sáb 31/10" circled, then the time ("21h", "19h30 às 22h30") or "horário a confirmar";
// a period goes on to its last day ("sex 16/10" circled, "a sáb 24/10, 19h"). What follows the
// date sits beside it while it fits, else on the next line. Returns the lines' heights and builder.
function posterWhen(ev, size) {
  const tiny = (d) => `${weekdayTiny(d)}${NBSP}${formatDayMonth(d)}`;
  const date = tiny(ev.date);
  const { start, end } = timeParts(ev);
  const time = start ? [start, end].filter(Boolean).join(' ') : '';
  const rest = [ev.endDate && `a ${tiny(ev.endDate)}`, time].filter(Boolean).join(', ');
  const soft = !time && !ev.endDate;
  const restText = soft ? 'horário a confirmar' : rest;
  const restFont = soft ? { ...VOICE_SOFT, size: Math.round(size * 0.6) } : { ...VOICE, size };
  const dateWidth = textWidth(date, { ...VOICE, size });
  const loopPad = POSTER.loop.x * size;
  const beside = WIDTH - dateWidth - loopPad - 0.22 * size;
  const restLines = textWidth(restText, restFont) <= beside * FIT ? [restText] : null;
  const under = restLines ? null : setLines(restText, restFont, WIDTH, 2);
  const holiday = holidayOn(ev.date);
  const holidaySize = Math.round(size * 0.4);
  const height = size * 1.3 + (under ? (0.2 + under.length * 1.1) * restFont.size : 0) + (holiday ? (0.3 + 1.4) * holidaySize : 0);
  return { date, dateWidth, restLines, under, restFont, soft, holiday, holidaySize, height };
}

function posterWhenNode(when, size) {
  const { date, dateWidth, restLines, under, restFont, soft, holiday, holidaySize } = when;
  const loop = fromHtml(`<svg class="fl-hand po-loop" viewBox="${HAND.loop.viewBox}" preserveAspectRatio="none" aria-hidden="true"><path vector-effect="non-scaling-stroke" d="${HAND.loop.d}"/></svg>`);
  // Around the glyphs, which stand between 0.23em and 1.18em of the 1.3em line (the descenders).
  loop.style.left = px(-POSTER.loop.x * size);
  loop.style.top = px(POSTER.loop.top * size);
  loop.style.width = px(dateWidth + 2 * POSTER.loop.x * size);
  loop.style.height = px(POSTER.loop.height * size);
  const dateNode = h('span', 'po-date', date, loop);
  const rest = restLines && sized(h('span', `po-rest${soft ? ' is-soft' : ''}`, restLines[0]), restFont.size);
  if (rest) rest.style.marginLeft = px(POSTER.loop.x * size + 0.22 * size); // clear of the loop
  const first = h('div', 'po-when-line', dateNode, rest);
  return sized(h('div', 'po-when',
    first,
    under && lined('div', `po-under${soft ? ' is-soft' : ''}`, under, restFont.size),
    holiday && sized(h('div', 'po-holiday', holiday.name), holidaySize)), size);
}

function posterFlyer(ev, sky) {
  const night = sky === 'night';
  const names = orgNames(ev);
  const top = night ? POSTER.topNight : POSTER.top;
  const measured = tidy(ev.title);

  let plan;
  for (const step of POSTER_STEPS) {
    const when = posterWhen(ev, step.when);
    const org = names.length ? fitOrgs(names, ROW_WIDTH, step.rows, 26) : null;
    const where = hasPlace(ev) ? fitPlace(ev, PLACE, ROW_WIDTH, step.rows, 26) : null;
    const rows = rowsHeight(org, where);
    const land = LAND_TOP + when.height + (rows ? POSTER.whenGap + rows : 0) + SIGN_SPACE;
    const horizon = Math.round(FLYER_HEIGHT - BAND - land);
    plan = { step, when, org, where, horizon };
    if (horizon - (night ? POSTER.air : POSTER.sunRoom) - top >= 2 * 1.02 * 96) break;
  }
  const { step, when, org, where, horizon } = plan;

  // The title: of the sizes from 168px down to 56px whose lines fit the sky with no word broken,
  // the largest, marked down for lines that read badly (a line of a single word, a line of short
  // words or emoji alone); and a line ending in a short word only when no size avoids one ("Baile /
  // dos Educadores –" over "Baile dos / Educadores –"). By day it hangs from the top and the sun
  // rises under it; at night it stands on the horizon under the moon.
  const room = horizon - (night ? POSTER.air : POSTER.sunRoom) - top;
  let title = null;
  for (let size = 168; size >= 56; size -= 4) {
    const font = { ...TITLE, size };
    if (!wordsFit(measured, font, WIDTH)) continue;
    const lines = planLines(measured, font, WIDTH, { spare: Math.floor(room / (size * 1.02)) });
    if (lines.length * size * 1.02 > room) continue;
    const { weakEnds, weakLines, oneWord } = badBreaks(lines);
    const clean = weakEnds === 0;
    const score = size * (1 - 0.5 * weakEnds - 0.3 * weakLines - 0.25 * oneWord);
    if (!title || (clean && !title.clean) || (clean === title.clean && score > title.score)) title = { size, lines, score, clean };
  }
  if (!title) {
    // Too long even at 56px: cut to the lines that fit (a word too wide breaks between letters).
    const font = { ...TITLE, size: 56 };
    const force = !wordsFit(measured, font, WIDTH);
    const text = cut(measured, font, WIDTH, Math.max(1, Math.floor(room / (56 * 1.02))), { force });
    title = { size: 56, lines: planLines(text, font, WIDTH, { force }) };
  }

  const titleHeight = title.lines.length * title.size * 1.02;
  const titleTop = night ? horizon - POSTER.air - titleHeight : top;
  const titleLines = title.lines.map((_, i) => ({ baseline: titleTop + i * title.size * 1.02 + (0.51 + TEXT.base) * title.size, size: title.size, metrics: TEXT }));
  const skyEl = skyNode(horizon, clearEdges(horizon, titleLines));
  if (night) {
    const r = 64;
    const moon = { x: FLYER_WIDTH - SIDE - r - 10, y: 56 + r + 18 };
    const stars = { left: 36, right: FLYER_WIDTH - 36, top: 28, bottom: horizon - POSTER.air - titleHeight - 24 };
    skyEl.append(starsNode(stars, [{ left: moon.x - r * 1.3, right: moon.x + r * 1.3, top: moon.y - r * 1.3, bottom: moon.y + r * 1.3 }]) || '', astroNode(moon.x, moon.y, r));
  }
  if (!night) {
    // As much of the sun as the sky under the title holds, up to its hour's height.
    const r = POSTER.sun;
    const up = Math.max(POSTER.sunRoom - 28, Math.min(SUN_UP[sky] * 2 * r, horizon - top - titleHeight - 28));
    skyEl.append(astroNode(FLYER_WIDTH - r * 0.62, horizon - up + r, r));
  }
  const titleEl = at(lined('div', 'po-title', title.lines, title.size), { left: SIDE, top: titleTop, width: WIDTH });

  return [
    skyEl,
    titleEl,
    bandNode(horizon),
    landNode(horizon, posterWhenNode(when, step.when), rowsNode(orgRow(org), placeRow(ev, where))),
    signature(),
  ];
}

// The styles to pick from, in the picker's order. `id` names the root class (.fl--<id>) and is
// the choice js/app.js saves; `slug` ends the downloaded file's name, in pt-BR since people see
// it; `name` is what the picker shows.
export const FLYER_STYLES = [
  { id: 'day', slug: 'folha', name: 'Folha do dia', render: dayFlyer },
  { id: 'month', slug: 'mes', name: 'Agenda do mês', render: monthFlyer },
  { id: 'poster', slug: 'cartaz', name: 'Cartaz', render: posterFlyer },
];

// ---------- Aviso de cancelamento ----------
// Not one of the styles: every cancelled activity gets this notice, whatever style is picked. The
// sky of its hour, without its sun or moon (the stars stay at night), says "Cancelada" over the date
// and time the hand struck out; the land names what was cancelled, struck by the same hand, then the
// reason, then who organized it and where.

const NOTICE = {
  minSky: 400,
  air: 58, // the struck date's last baseline → the band
  whenGap: 30, // "Cancelada" → the struck date
  reasonGap: 24, // the struck title → the reason (.nt-reason)
  rowsGap: 22, // what comes before → the rows (.fl--notice .fl-rows)
};

// The hand's stroke across a line of text (HAND.underline), placed by css/flyers.css (.nt-strike).
const strike = () => fromHtml(`<svg class="fl-hand nt-strike" viewBox="${HAND.underline.viewBox}" preserveAspectRatio="none" aria-hidden="true"><path vector-effect="non-scaling-stroke" d="${HAND.underline.d}"/></svg>`);

function noticeFlyer(ev, sky) {
  const night = sky === 'night';
  const names = orgNames(ev);
  const reason = tidy(ev.cancelReason);
  const label = { text: 'Motivo:', face: NAME_FACE, kind: 'label' };
  const reasonRuns = (text) => [label, { text, face: FULL_FACE, kind: '' }];
  const reasonStart = reason.length > 180 ? 36 : 40;

  // The squeeze t goes from 0 (the design's sizes) to 1 (compact): the title, the reason, the rows
  // and the date step down together, and the sky gives way down to NOTICE.minSky. The least that
  // fits wins.
  let plan;
  for (let i = 0; i <= 20; i++) {
    const t = i / 20;
    const whenSize = Math.round(between(60, 44, t));
    const when = planLines(longWhen(ev), { ...VOICE_SOFT, size: whenSize }, WIDTH);
    const wordSize = sizeToWidth('Cancelada', VOICE, WIDTH, Math.round(between(220, 170, t)), 120);
    const sky0 = 56 + wordSize * (DISPLAY.cap + DISPLAY.descent) + NOTICE.whenGap + DISPLAY.accent * whenSize + (when.length - 1) * whenSize * 1.12 + NOTICE.air;

    const reasonSize = Math.round(between(reasonStart, 30, t));
    const rowSize = Math.round(between(36, 30, t));
    const title = pickSize(tidy(ev.title), { ...TITLE, track: 0 }, WIDTH, [[Math.round(between(60, 44, t)), 2], [Math.round(between(52, 40, t)), 3]], { floor: 30, shrink: true, spare: true });
    const org = names.length ? fitOrgs(names, ROW_WIDTH, [[rowSize, t < 0.55 ? 2 : 1]], 26) : null;
    const where = hasPlace(ev) ? fitPlace(ev, PLACE, ROW_WIDTH, [[rowSize, t < 0.85 ? 2 : 1]], 26) : null;
    const rows = rowsHeight(org, where);
    const font = { face: FULL_FACE, size: reasonSize };
    const fixed = LAND_TOP + linesHeight(title, LH.title) + (reason ? NOTICE.reasonGap : 0) + (rows ? NOTICE.rowsGap + rows : 0) + SIGN_SPACE;
    const free = FLYER_HEIGHT - BAND - Math.max(NOTICE.minSky, Math.ceil(sky0)) - fixed;
    const force = Boolean(reason) && !wordsFit(reason, font, WIDTH);
    const reasonLines = reason ? planLines(reasonRuns(reason), font, WIDTH, { greedy: true, force }) : [];
    plan = { when, whenSize, wordSize, title, org, where, font, reasonLines, fixed };
    if (reasonLines.length * reasonSize * LH.reason <= free) break;
    // Fully squeezed and still too long: the reason is cut to the lines left.
    if (i === 20 && reason) {
      const keep = Math.max(1, Math.floor(free / (reasonSize * LH.reason)));
      const shown = cut(reason, font, WIDTH, keep, { force, wrap: reasonRuns });
      plan.reasonLines = planLines(reasonRuns(shown), font, WIDTH, { greedy: true, force });
    }
  }
  const { when, whenSize, wordSize, title, org, where, font, reasonLines, fixed } = plan;
  const land = fixed + reasonLines.length * font.size * LH.reason;
  const horizon = Math.round(FLYER_HEIGHT - BAND - land);

  // On the sky, up from the horizon: the struck date and time, then "Cancelada".
  const lastBaseline = horizon - NOTICE.air;
  const whenBaselines = when.map((_, i) => lastBaseline - (when.length - 1 - i) * whenSize * 1.12);
  const whenItems = when.map((line, i) => voice('nt-when', [[line, strike()]], whenSize, { left: SIDE, baseline: whenBaselines[i] }));
  const firstTop = whenBaselines[0] - DISPLAY.accent * whenSize;
  const wordBaseline = firstTop - NOTICE.whenGap - DISPLAY.descent * wordSize;
  const word = voice('nt-word', ['Cancelada'], wordSize, { left: SIDE, baseline: wordBaseline });

  const lines = [{ baseline: wordBaseline, size: wordSize }, ...whenBaselines.map((baseline) => ({ baseline, size: whenSize }))];
  const skyEl = skyNode(horizon, clearEdges(horizon, lines));
  if (night) skyEl.append(starsNode({ left: 36, right: FLYER_WIDTH - 36, top: 28, bottom: wordBaseline - DISPLAY.accent * wordSize - 24 }) || '');

  return [
    skyEl,
    word,
    ...whenItems,
    bandNode(horizon),
    landNode(horizon,
      lined('div', 'fl-title nt-title', title.lines.map((line) => [line, strike()]), title.size),
      reasonLines.length > 0 && lined('p', 'nt-reason', reasonLines, font.size),
      rowsNode(orgRow(org), placeRow(ev, where))),
    signature(),
  ];
}

export const NOTICE_STYLE = { id: 'notice', slug: 'cancelada', name: 'Aviso de cancelamento', render: noticeFlyer };

const styleFor = (event, styleId) =>
  event.cancelled ? NOTICE_STYLE : FLYER_STYLES.find((s) => s.id === styleId) || FLYER_STYLES[0];

// The flyer is a picture: the panel around it already says all of it in text, so assistive tech
// skips it (aria-hidden), and it holds no headings of its own.
export function renderFlyer(event, styleId = FLYER_STYLES[0].id) {
  const style = styleFor(event, styleId);
  const sky = skyOf(event);
  const node = h('div', `fl fl--${style.id}`, style.render(event, sky));
  node.dataset.sky = sky;
  node.setAttribute('aria-hidden', 'true');
  if (event.cancelled) node.classList.add('is-cancelled');
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
