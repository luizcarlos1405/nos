// Icon set (paths from Lucide, ISC license), drawn at one stroke weight.

const PATHS = {
  list: '<path d="M3 6h.01M3 12h.01M3 18h.01M8 6h13M8 12h13M8 18h13"/>',
  'calendar-days': '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M8 2v4M16 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/>',
  'calendar-range': '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M3 10h18M8 2v4M17 14h-6M13 18H7M7 14h.01M17 18h.01"/>',
  'calendar-x': '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M8 2v4M16 2v4M3 10h18m-8 4-4 4m0-4 4 4"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  pin: '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
  globe: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20M2 12h20"/>',
  tag: '<path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/>',
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
  instagram: '<rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37zM17.5 6.5h.01"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  message: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
  'message-text': '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M13 8H7M17 12H7"/>',
  copy: '<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5M12 15V3"/>',
  share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98"/>',
  image: '<rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>',
  history: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5M12 7v5l4 2"/>',
  close: '<path d="M18 6 6 18M6 6l12 12"/>',
  left: '<path d="m15 18-6-6 6-6"/>',
  right: '<path d="m9 18 6-6-6-6"/>',
  up: '<path d="m18 15-6-6-6 6"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  alert: '<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>',
  store: '<path d="M15 21v-5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v5"/><path d="M17.774 10.31a1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.451 0 1.12 1.12 0 0 0-1.548 0 2.5 2.5 0 0 1-3.452 0 1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.77-3.248l2.889-4.184A2 2 0 0 1 7 2h10a2 2 0 0 1 1.653.873l2.895 4.192a2.5 2.5 0 0 1-3.774 3.244"/><path d="M4 10.95V19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8.05"/>',
  search: '<path d="m21 21-4.34-4.34"/><circle cx="11" cy="11" r="8"/>',
  'search-x': '<path d="m13.5 8.5-5 5"/><path d="m8.5 8.5 5 5"/><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  'arrow-right': '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  external: '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  house: '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6h4"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2m-7.07-17.07 1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
  moon: '<path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401"/>',
};

export function icon(name, className = 'icon') {
  return `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${PATHS[name]}</svg>`;
}

// The NOS mark: N and S in Barlow Condensed 800 and, for the O, a circle drawn by hand, the way one
// circles a date on a calendar (on the sky the same hand draws the sun round: HAND.astro). Paths in
// font units (1000 = the font size, baseline at y=0), drawn once from the font's outlines; the loop is
// the outline of a marker stroke (its width varies, its end runs past its start), not an SVG stroke.
// assets/icon.html and assets/og-image.html draw it too.
export const MARK = {
  viewBox: '0 -799 1493 902',
  letters: 'M300 -700H440Q445 -700 448.5 -696.5Q452 -693 452 -688V-12Q452 -7 448.5 -3.5Q445 0 440 0H281Q270 0 267 -10L168 -358Q167 -361 164.5 -361.5Q162 -362 162 -358L164 -12Q164 -7 160.5 -3.5Q157 0 152 0H12Q7 0 3.5 -3.5Q0 -7 0 -12V-688Q0 -693 3.5 -696.5Q7 -700 12 -700H169Q180 -700 183 -690L283 -340Q284 -337 286.5 -337Q289 -337 289 -341L288 -688Q288 -693 291.5 -696.5Q295 -700 300 -700ZM1084 -178V-209Q1084 -214 1087.5 -217.5Q1091 -221 1096 -221H1236Q1241 -221 1244.5 -217.5Q1248 -214 1248 -209V-186Q1248 -162 1259.5 -148Q1271 -134 1289 -134Q1307 -134 1318.5 -147.5Q1330 -161 1330 -182Q1330 -205 1312 -223.5Q1294 -242 1240 -281Q1190 -317 1158 -345.5Q1126 -374 1103 -416.5Q1080 -459 1080 -515Q1080 -572 1105.5 -616Q1131 -660 1177.5 -684Q1224 -708 1284 -708Q1345 -708 1391.5 -683.5Q1438 -659 1463.5 -614.5Q1489 -570 1489 -512V-488Q1489 -483 1485.5 -479.5Q1482 -476 1477 -476H1338Q1333 -476 1329.5 -479.5Q1326 -483 1326 -488V-516Q1326 -538 1314 -552Q1302 -566 1284 -566Q1266 -566 1255 -552Q1244 -538 1244 -515Q1244 -490 1261 -470Q1278 -450 1330 -412Q1393 -365 1425 -336Q1457 -307 1475 -271.5Q1493 -236 1493 -188Q1493 -98 1436.5 -45Q1380 8 1288 8Q1227 8 1181 -15.5Q1135 -39 1109.5 -81.5Q1084 -124 1084 -178Z',
  loop: 'M894 -663l-7 -8l-8 -8l-7 -8l-8 -8l-7 -7l-7 -8l-8 -8l-8 -7l-8 -7l-8 -6l-9 -6l-9 -6l-9 -5l-9 -4l-10 -3l-10 -3l-11 -2l-10 -1l-10 -1l-10 0l-11 0l-10 0l-11 1l-10 2l-10 2l-11 3l-10 4l-10 4l-10 4l-10 5l-9 6l-10 6l-9 7l-9 8l-8 8l-9 8l-8 9l-7 9l-8 10l-7 11l-7 10l-6 12l-6 11l-5 12l-6 12l-5 13l-4 13l-4 13l-4 13l-4 14l-3 14l-2 14l-2 15l-2 14l-2 15l-1 14l-1 15l0 15l0 15l0 15l1 15l1 15l1 15l2 15l2 15l2 15l2 15l3 15l4 14l3 15l4 14l4 14l4 15l5 14l5 13l5 14l6 13l5 14l6 13l7 13l6 12l7 12l7 13l7 11l8 12l8 11l8 11l8 11l9 10l9 10l9 9l9 9l9 9l10 8l10 8l10 8l10 7l11 6l10 6l11 5l11 5l11 4l11 4l12 3l11 3l12 2l11 1l12 0l11 0l12 0l11 -2l11 -2l11 -3l11 -3l11 -4l10 -4l11 -5l10 -6l9 -6l10 -6l9 -7l9 -8l9 -8l8 -8l8 -9l8 -9l8 -9l7 -10l7 -11l7 -10l6 -11l6 -12l6 -12l5 -12l6 -12l4 -13l5 -13l4 -13l4 -14l4 -13l3 -15l3 -14l3 -14l2 -15l2 -15l1 -15l1 -16l1 -15l1 -16l0 -15l-1 -16l-1 -16l-1 -16l-1 -16l-2 -16l-2 -16l-3 -16l-3 -15l-3 -16l-4 -16l-4 -15l-5 -15l-5 -15l-5 -15l-5 -15l-6 -14l-6 -14l-7 -14l-6 -14l-7 -13l-8 -13l-7 -12l-8 -12l-8 -12l-8 -12l-9 -11l-9 -10l-9 -10l-9 -10l-10 -9l-9 -8l-10 -9l-10 -7l-10 -8l-10 -7l-10 -6l-11 -6l-10 -5l-11 -5l-10 -4l-11 -4l-11 -4l-11 -3l-10 -2l-11 -2l-11 -2l-10 -1l-11 0l-11 0l-10 1l-10 1l-11 1l-10 3l-10 2l-10 4l-10 3l-9 4l-10 5l-9 5l-9 6l-9 6l-8 7l-9 7l-8 8l-8 8l-8 9l-7 9l-7 9l-7 10l-7 10l2 -2l3 -1l3 0l2 1l2 2l1 3l0 3l-1 3l7 -10l7 -10l7 -8l7 -9l8 -7l8 -7l8 -7l8 -5l9 -6l8 -4l9 -4l8 -4l9 -3l9 -2l9 -2l8 -1l9 -1l9 0l8 0l9 0l9 1l8 2l9 2l8 2l9 3l8 3l8 3l8 4l9 4l8 5l8 5l8 5l8 5l8 6l8 6l8 7l7 7l8 7l8 8l7 8l8 8l7 8l7 9l8 10l7 9l7 10l7 10l6 11l7 11l6 11l6 12l6 12l6 12l5 12l6 13l4 13l5 13l4 14l4 13l4 14l3 14l3 14l3 14l2 15l2 14l1 14l2 14l0 15l1 14l0 14l0 14l-1 14l-1 13l-1 14l-1 13l-2 13l-3 13l-2 13l-3 12l-3 12l-3 12l-4 12l-4 11l-4 11l-4 10l-5 10l-5 10l-5 9l-5 10l-5 8l-6 8l-6 8l-6 8l-5 7l-7 6l-6 7l-6 5l-6 6l-7 5l-6 4l-7 4l-6 4l-7 3l-6 3l-7 2l-6 2l-7 2l-7 1l-6 1l-7 1l-7 0l-6 -1l-7 0l-7 -1l-7 -1l-7 -2l-7 -2l-7 -3l-7 -3l-7 -3l-7 -4l-7 -4l-7 -5l-7 -5l-8 -6l-7 -6l-7 -6l-7 -7l-7 -7l-7 -7l-7 -8l-6 -9l-7 -8l-6 -9l-7 -10l-6 -9l-6 -10l-6 -10l-5 -11l-6 -10l-5 -11l-5 -12l-5 -11l-5 -12l-5 -11l-4 -12l-4 -13l-4 -12l-3 -12l-4 -13l-3 -13l-3 -12l-3 -13l-2 -13l-2 -13l-2 -13l-1 -13l-2 -13l-1 -13l-1 -13l0 -13l0 -13l0 -13l0 -13l1 -12l1 -13l2 -12l1 -12l2 -12l2 -11l3 -11l3 -11l3 -11l3 -10l4 -11l3 -9l4 -9l5 -9l4 -9l5 -8l5 -8l5 -7l5 -6l5 -7l5 -6l6 -5l5 -5l6 -5l6 -4l6 -4l5 -3l6 -4l6 -2l6 -3l7 -2l6 -1l6 -2l7 -1l6 0l6 -1l7 0l7 1l7 0l6 1l7 2l7 1l8 1l7 1l8 1l8 2l8 1l9 2l9 3l8 3l9 3l8 5l9 4l8 6l8 6l8 7l-3 -4l-1 -5l1 -6l2 -4l5 -3l5 -1l5 1z',
};

// The mark as inline SVG, sized by font-size (.mark in css/style.css). The letters take the text
// colour, the loop takes --mark-loop (the text colour too, unless a page sets it: urucum on the sky). The
// drawing spells NOS; another APP_NAME prints the word instead, until a mark is drawn for it.
export function brandMark(word, className = 'mark') {
  if (word !== 'NOS') return `<span class="${className} mark-text" aria-hidden="true">${word}</span>`;
  return `<svg class="${className}" viewBox="${MARK.viewBox}" aria-hidden="true" focusable="false"><path class="mark-letters" d="${MARK.letters}"/><path class="mark-loop" d="${MARK.loop}"/></svg>`;
}

// The hand marks, in urucum (css/style.css .hand): an open pen loop that runs past its start circles
// the next activity (two drawings, so neighbours don't look stamped), and a short stroke underlines
// today. They stretch to the box they mark (preserveAspectRatio none) while the pen keeps its width.
// `astro` is the same hand drawing the sun or the moon: a disc and the loop around it, a little off
// register like a screen print; the pages print it on the sky (index.html, agenda.html, comercio.html).
export const HAND = {
  loop: { viewBox: '0 0 120 60', d: 'M84 7C62 2 28 4 12 15C1 23 2 41 22 50C42 59 88 58 108 46C122 37 119 17 98 9C84 4 66 4 47 9' },
  loopAlt: { viewBox: '0 0 120 60', d: 'M20 15C40 4 86 1 106 13C121 22 117 44 94 52C68 61 24 59 9 45C-2 34 6 15 30 9C46 5 66 5 80 8' },
  underline: { viewBox: '0 0 120 10', d: 'M2 7.5C22 5 46 4.6 70 5.2C88 5.6 104 4.4 118 2.5' },
  astro: { viewBox: '0 0 120 120', disc: { cx: 58, cy: 60, r: 49 }, d: 'M78 9C56 4 22 12 12 38C3 64 20 104 56 108C92 112 116 88 112 56C109 28 92 7 66 5.5C54 5 40 10 28 19' },
};

export function handMark(name) {
  const { viewBox, d } = HAND[name];
  return `<svg class="hand hand--${name === 'underline' ? 'underline' : 'loop'}" viewBox="${viewBox}" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path vector-effect="non-scaling-stroke" d="${d}"/></svg>`;
}
