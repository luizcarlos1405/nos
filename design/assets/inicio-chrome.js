// The site's own chrome for the home proposals of 12/11/2026 (design/inicio-*.html), copied from
// index.html as it was that day: the bar on the sky (the NOS mark and "Dourados", the pages' links, the
// theme button), the sky's drawings (the sun, or the moon and the stars at night) and the footer. The five
// proposals change what the home puts under the bar, never the bar: an artboard marks the places with
// data-site-bar, data-sky-art and data-site-foot and calls fillChrome().
// The theme and the sky come from the address, in a classic script in each artboard's <head> (before the
// first paint): ?tema=escuro is the dark theme under the night sky, ?ceu=amanhecer|dia|entardecer|noite
// another hour.

const BAR = `<div class="site-bar">
        <a class="brand" href="./" aria-current="page">
          <span class="brand-mark" id="brand-mark"><svg class="mark" viewBox="0 -799 1493 902" aria-hidden="true" focusable="false"><path class="mark-letters" d="M300 -700H440Q445 -700 448.5 -696.5Q452 -693 452 -688V-12Q452 -7 448.5 -3.5Q445 0 440 0H281Q270 0 267 -10L168 -358Q167 -361 164.5 -361.5Q162 -362 162 -358L164 -12Q164 -7 160.5 -3.5Q157 0 152 0H12Q7 0 3.5 -3.5Q0 -7 0 -12V-688Q0 -693 3.5 -696.5Q7 -700 12 -700H169Q180 -700 183 -690L283 -340Q284 -337 286.5 -337Q289 -337 289 -341L288 -688Q288 -693 291.5 -696.5Q295 -700 300 -700ZM1084 -178V-209Q1084 -214 1087.5 -217.5Q1091 -221 1096 -221H1236Q1241 -221 1244.5 -217.5Q1248 -214 1248 -209V-186Q1248 -162 1259.5 -148Q1271 -134 1289 -134Q1307 -134 1318.5 -147.5Q1330 -161 1330 -182Q1330 -205 1312 -223.5Q1294 -242 1240 -281Q1190 -317 1158 -345.5Q1126 -374 1103 -416.5Q1080 -459 1080 -515Q1080 -572 1105.5 -616Q1131 -660 1177.5 -684Q1224 -708 1284 -708Q1345 -708 1391.5 -683.5Q1438 -659 1463.5 -614.5Q1489 -570 1489 -512V-488Q1489 -483 1485.5 -479.5Q1482 -476 1477 -476H1338Q1333 -476 1329.5 -479.5Q1326 -483 1326 -488V-516Q1326 -538 1314 -552Q1302 -566 1284 -566Q1266 -566 1255 -552Q1244 -538 1244 -515Q1244 -490 1261 -470Q1278 -450 1330 -412Q1393 -365 1425 -336Q1457 -307 1475 -271.5Q1493 -236 1493 -188Q1493 -98 1436.5 -45Q1380 8 1288 8Q1227 8 1181 -15.5Q1135 -39 1109.5 -81.5Q1084 -124 1084 -178Z"/><path class="mark-loop" d="M894 -663l-7 -8l-8 -8l-7 -8l-8 -8l-7 -7l-7 -8l-8 -8l-8 -7l-8 -7l-8 -6l-9 -6l-9 -6l-9 -5l-9 -4l-10 -3l-10 -3l-11 -2l-10 -1l-10 -1l-10 0l-11 0l-10 0l-11 1l-10 2l-10 2l-11 3l-10 4l-10 4l-10 4l-10 5l-9 6l-10 6l-9 7l-9 8l-8 8l-9 8l-8 9l-7 9l-8 10l-7 11l-7 10l-6 12l-6 11l-5 12l-6 12l-5 13l-4 13l-4 13l-4 13l-4 14l-3 14l-2 14l-2 15l-2 14l-2 15l-1 14l-1 15l0 15l0 15l0 15l1 15l1 15l1 15l2 15l2 15l2 15l2 15l3 15l4 14l3 15l4 14l4 14l4 15l5 14l5 13l5 14l6 13l5 14l6 13l7 13l6 12l7 12l7 13l7 11l8 12l8 11l8 11l8 11l9 10l9 10l9 9l9 9l9 9l10 8l10 8l10 8l10 7l11 6l10 6l11 5l11 5l11 4l11 4l12 3l11 3l12 2l11 1l12 0l11 0l12 0l11 -2l11 -2l11 -3l11 -3l11 -4l10 -4l11 -5l10 -6l9 -6l10 -6l9 -7l9 -8l9 -8l8 -8l8 -9l8 -9l8 -9l7 -10l7 -11l7 -10l6 -11l6 -12l6 -12l5 -12l6 -12l4 -13l5 -13l4 -13l4 -14l4 -13l3 -15l3 -14l3 -14l2 -15l2 -15l1 -15l1 -16l1 -15l1 -16l0 -15l-1 -16l-1 -16l-1 -16l-1 -16l-2 -16l-2 -16l-3 -16l-3 -15l-3 -16l-4 -16l-4 -15l-5 -15l-5 -15l-5 -15l-5 -15l-6 -14l-6 -14l-7 -14l-6 -14l-7 -13l-8 -13l-7 -12l-8 -12l-8 -12l-8 -12l-9 -11l-9 -10l-9 -10l-9 -10l-10 -9l-9 -8l-10 -9l-10 -7l-10 -8l-10 -7l-10 -6l-11 -6l-10 -5l-11 -5l-10 -4l-11 -4l-11 -4l-11 -3l-10 -2l-11 -2l-11 -2l-10 -1l-11 0l-11 0l-10 1l-10 1l-11 1l-10 3l-10 2l-10 4l-10 3l-9 4l-10 5l-9 5l-9 6l-9 6l-8 7l-9 7l-8 8l-8 8l-8 9l-7 9l-7 9l-7 10l-7 10l2 -2l3 -1l3 0l2 1l2 2l1 3l0 3l-1 3l7 -10l7 -10l7 -8l7 -9l8 -7l8 -7l8 -7l8 -5l9 -6l8 -4l9 -4l8 -4l9 -3l9 -2l9 -2l8 -1l9 -1l9 0l8 0l9 0l9 1l8 2l9 2l8 2l9 3l8 3l8 3l8 4l9 4l8 5l8 5l8 5l8 5l8 6l8 6l8 7l7 7l8 7l8 8l7 8l8 8l7 8l7 9l8 10l7 9l7 10l7 10l6 11l7 11l6 11l6 12l6 12l6 12l5 12l6 13l4 13l5 13l4 14l4 13l4 14l3 14l3 14l3 14l2 15l2 14l1 14l2 14l0 15l1 14l0 14l0 14l-1 14l-1 13l-1 14l-1 13l-2 13l-3 13l-2 13l-3 12l-3 12l-3 12l-4 12l-4 11l-4 11l-4 10l-5 10l-5 10l-5 9l-5 10l-5 8l-6 8l-6 8l-6 8l-5 7l-7 6l-6 7l-6 5l-6 6l-7 5l-6 4l-7 4l-6 4l-7 3l-6 3l-7 2l-6 2l-7 2l-7 1l-6 1l-7 1l-7 0l-6 -1l-7 0l-7 -1l-7 -1l-7 -2l-7 -2l-7 -3l-7 -3l-7 -3l-7 -4l-7 -4l-7 -5l-7 -5l-8 -6l-7 -6l-7 -6l-7 -7l-7 -7l-7 -7l-7 -8l-6 -9l-7 -8l-6 -9l-7 -10l-6 -9l-6 -10l-6 -10l-5 -11l-6 -10l-5 -11l-5 -12l-5 -11l-5 -12l-5 -11l-4 -12l-4 -13l-4 -12l-3 -12l-4 -13l-3 -13l-3 -12l-3 -13l-2 -13l-2 -13l-2 -13l-1 -13l-2 -13l-1 -13l-1 -13l0 -13l0 -13l0 -13l0 -13l1 -12l1 -13l2 -12l1 -12l2 -12l2 -11l3 -11l3 -11l3 -11l3 -10l4 -11l3 -9l4 -9l5 -9l4 -9l5 -8l5 -8l5 -7l5 -6l5 -7l5 -6l6 -5l5 -5l6 -5l6 -4l6 -4l5 -3l6 -4l6 -2l6 -3l7 -2l6 -1l6 -2l7 -1l6 0l6 -1l7 0l7 1l7 0l6 1l7 2l7 1l8 1l7 1l8 1l8 2l8 1l9 2l9 3l8 3l9 3l8 5l9 4l8 6l8 6l8 7l-3 -4l-1 -5l1 -6l2 -4l5 -3l5 -1l5 1z"/></svg></span>
          <span class="sr-only" id="brand-name-sr">NOS </span>
          <span class="brand-place" id="app-city">Dourados</span>
          <span class="sr-only">(página inicial)</span>
        </a>
        <nav class="site-nav" aria-label="Páginas">
          <a class="nav-link" href="./" aria-current="page"><span class="nav-icon"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg></span><span class="nav-label">Início</span></a>
          <a class="nav-link" href="agenda.html"><span class="nav-icon"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M8 2v4M16 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/></svg></span><span class="nav-label">Agenda</span></a>
          <a class="nav-link" href="noticias.html"><span class="nav-icon"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M15 18h-5"/><path d="M18 14h-8"/><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-4 0v-9a2 2 0 0 1 2-2h2"/><rect width="8" height="4" x="10" y="6" rx="1"/></svg></span><span class="nav-label">Notícias</span></a>
          <a class="nav-link" href="mapa.html"><span class="nav-icon"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z"/><path d="M15 5.764v15"/><path d="M9 3.236v15"/></svg></span><span class="nav-label">Mapa</span></a>
          <a class="nav-link" href="comercio.html"><span class="nav-icon"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M15 21v-5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v5"/><path d="M17.774 10.31a1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.451 0 1.12 1.12 0 0 0-1.548 0 2.5 2.5 0 0 1-3.452 0 1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.77-3.248l2.889-4.184A2 2 0 0 1 7 2h10a2 2 0 0 1 1.653.873l2.895 4.192a2.5 2.5 0 0 1-3.774 3.244"/><path d="M4 10.95V19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8.05"/></svg></span><span class="nav-label">Comércio</span></a>
        </nav>
        <button class="icon-button theme-toggle" type="button" data-theme-toggle aria-pressed="false"><svg class="icon icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401"/></svg><svg class="icon icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2m-7.07-17.07 1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg><span class="sr-only">Tema escuro</span></button>
      </div>`;

const SKY_ART = `<div class="sky-art" aria-hidden="true">
      <svg class="astro" viewBox="0 0 120 120" focusable="false"><circle cx="58" cy="60" r="49"/><path vector-effect="non-scaling-stroke" d="M78 9C56 4 22 12 12 38C3 64 20 104 56 108C92 112 116 88 112 56C109 28 92 7 66 5.5C54 5 40 10 28 19"/></svg>
      <svg class="stars" focusable="false"><circle cx="62%" cy="14%" r="1.2"/><circle cx="70%" cy="40%" r="1.4"/><circle cx="77%" cy="22%" r="1.1"/><circle cx="85%" cy="52%" r="1.6"/><circle cx="93%" cy="30%" r="1.2"/><circle cx="80%" cy="70%" r="1.5"/><circle cx="73%" cy="86%" r="1.2"/><circle cx="97%" cy="9%" r="1.1"/><circle cx="58%" cy="52%" r="1"/><circle cx="89%" cy="78%" r="1.3"/><circle cx="12%" cy="6%" r="1.1"/><circle cx="30%" cy="8%" r="1"/><circle cx="46%" cy="5%" r="1.2"/><circle cx="81%" cy="8%" r="1"/></svg>
    </div>`;

const FOOT = `<footer class="site-foot">
    <p id="app-full-name">NOS Dourados · Núcleo de Organização Social</p>
    <p class="foot-credit">Faixa: arte provisória. A definitiva será criada e assinada por artistas da Reserva Indígena de Dourados.</p>
  </footer>`;

const inner = (html) => html.replace(/^<[^>]+>/, '').replace(/<\/[^>]+>$/, '');

export function fillChrome(root = document) {
  for (const node of root.querySelectorAll('[data-site-bar]')) {
    node.classList.add('site-bar');
    node.innerHTML = inner(BAR);
  }
  for (const node of root.querySelectorAll('[data-sky-art]')) {
    node.classList.add('sky-art');
    node.setAttribute('aria-hidden', 'true');
    node.innerHTML = inner(SKY_ART);
  }
  for (const node of root.querySelectorAll('[data-site-foot]')) {
    node.classList.add('site-foot');
    node.innerHTML = inner(FOOT);
  }
}
