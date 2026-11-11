// Mapa (proposal of 11/11/2026): the data and the drawing helpers of the map's artboards.
//
// PLACES: the 18 places of the Mapa da Capoeira (COMAFRO Dourados' sheet, the rows shown on
// mapacapoeira.org on 11/11/2026: names, addresses, coordinates, contacts and training times as the
// sheet has them; the groups' names as the NOS survey writes them, ../coleta-instagram/), numbered
// from north to south for the Cartaz idea. Two more places show how the next layers would look, both
// from the survey with their source: the Batalha do Centrão (its bio: "Praça Antônio João") and the
// Feira dos Ipês (its posts: every Tuesday, 17h to 22h, at the Parque dos Ipês); their coordinates
// are those of the square and the park in OpenStreetMap.
//
// VIEWS: each artboard's map, as the box of points it must show and the room the page leaves it;
// tools/mapa-render.cjs photographs mapa-vivo.html at the same centre and zoom, so the pins drawn
// here in HTML land on their streets.

export const LAYERS = [
  { id: 'capoeira', name: 'Capoeira', plural: 'lugares de capoeira', icon: 'berimbau' },
  { id: 'batalha', name: 'Batalhas de rima', plural: 'batalhas de rima', icon: 'mic-vocal' },
  { id: 'feira', name: 'Feiras', plural: 'feiras', icon: 'shopping-basket' },
];

const D = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

// [weekday (0 = Sunday), start, end, who it is for]
export const PLACES = [
  { n: 1, id: 'consolata', layer: 'capoeira', group: 'Camará Capoeira', who: 'Instrutor Ramão',
    place: 'Congregação Irmãs Missionárias da Consolata', bairro: '', address: '',
    lat: -22.161384, lon: -54.810305, phone: '', instagram: '',
    sessions: [[6, '8h', '9h']], revised: '02/05/2026' },
  { n: 2, id: 'aji', layer: 'capoeira', group: 'Centro Cultural Grãos', who: 'Bruno Grãos',
    place: 'AJI – Ação dos Jovens Indígenas de Dourados', bairro: 'Aldeia Bororó', address: 'Aldeia Bororó',
    lat: -22.163122, lon: -54.86217, phone: '67 98187-9226', instagram: 'graoscapoeira_dourados',
    sessions: [[6, '9h']], revised: '06/05/2026' },
  { n: 3, id: 'loureiro', layer: 'capoeira', group: 'Camará Capoeira', who: 'Professor Ceará',
    place: 'Campo do Loureiro', bairro: 'Parque Res. Pelicano', address: 'R. Antônio Amaro de Mattos, 6008',
    lat: -22.207782, lon: -54.776524, phone: '67 99954-7818', instagram: '',
    sessions: [[2, '19h30', '20h30'], [5, '19h30', '20h30']], revised: '12/08/2026' },
  { n: 4, id: 'tribos', layer: 'capoeira', group: 'Tribos Capoeira', who: 'Professor Fininho',
    place: 'Campo Zé Tabela', bairro: 'Jardim dos Estados', address: 'R. Hiran Pereira de Matos, 582',
    lat: -22.209114, lon: -54.785677, phone: '67 99903-7033', instagram: 'fininho_triboscapoeiradourados',
    sessions: [[1, '19h30'], [3, '19h30'], [5, '19h30']], revised: '30/04/2026' },
  { n: 5, id: 'canaa', layer: 'capoeira', group: 'Caá puêra Semente Crioula', who: 'Monitor Tony Lima',
    place: 'Centro Comunitário do Canaã', bairro: 'Parque Res. Pelicano', address: 'R. Projetada B, 18',
    lat: -22.209946, lon: -54.770436, phone: '67 99126-9806', instagram: 'projetobioginga',
    sessions: [[1, '19h30', '20h30'], [4, '19h30', '20h30']], revised: '28/09/2026' },
  { n: 6, id: 'casulo', layer: 'capoeira', group: 'Camará Capoeira', who: 'Professor Ned',
    place: 'Casulo – Espaço de Cultura e Arte', bairro: 'Parque Alvorada', address: 'R. Reinaldo Bianchi, 398',
    lat: -22.215809, lon: -54.835341, phone: '', instagram: 'casulodourados',
    sessions: [[4, '19h30', '20h30', 'Infantil'], [4, '20h30', '21h30', 'Juvenil e adulto'],
      [6, '13h', '14h', 'Infantil'], [6, '14h', '15h', 'Juvenil e adulto']], revised: '12/08/2026' },
  { n: 7, id: 'abada', layer: 'capoeira', group: 'Abadá Capoeira', who: 'Professor Ricardo',
    place: 'Espaço do grupo', bairro: 'Vila Ubiratan', address: 'R. Cezário Domingues Perez, 6575',
    lat: -22.226134, lon: -54.764552, phone: '67 99905-6378', instagram: '',
    sessions: [], times: 'Combinar pelo telefone', revised: '27/04/2026' },
  { n: 8, id: 'seleta', layer: 'capoeira', group: 'Camará Capoeira', who: 'Instrutor Ramão',
    place: 'Seleta', bairro: 'Jardim Flórida', address: 'Av. José Roberto Teixeira, 132',
    lat: -22.226327, lon: -54.835338, phone: '67 98448-8619', instagram: '',
    sessions: [[2, '19h', '21h'], [4, '19h', '21h']], revised: '05/05/2026' },
  { n: 9, id: 'ceu-de-lona', layer: 'capoeira', group: 'Liberdade e Expressão', who: 'Professor Alemão',
    place: 'Circo das Artes Céu de Lona', bairro: 'Jardim Clímax', address: 'R. Eulália Pires, 2845',
    lat: -22.226695, lon: -54.826081, phone: '67 99625-1461', instagram: 'prof.alemao.capoeira',
    sessions: [[2, '19h', '20h30'], [4, '19h', '20h30']], revised: '22/10/2026' },
  { n: 10, id: 'quiosque', layer: 'capoeira', group: 'Centro Cultural Grãos', who: 'Bruno Grãos',
    place: 'Quiosque do Parque do Lago', bairro: 'Parque do Lago', address: 'Av. José Roberto Teixeira, 356',
    lat: -22.228743, lon: -54.833273, phone: '67 98187-9226', instagram: 'graoscapoeira_dourados',
    sessions: [[0, '9h']], revised: '12/08/2026' },
  { n: 11, id: 'matumbe', layer: 'capoeira', group: 'Escola Matumbé Capoeira Angola', who: 'André Soares (Charada)',
    place: 'Academia da Saúde do Parque do Lago', bairro: 'Vila Popular', address: 'R. Ver. Vitório José Pederiva',
    lat: -22.229693, lon: -54.835306, phone: '67 99875-4170', instagram: '',
    sessions: [[1, '19h', '20h'], [3, '19h', '20h'], [5, '19h', '20h']], revised: '28/07/2026' },
  { n: 12, id: 'malungo', layer: 'capoeira', group: 'Instituto Cultural Malungo', who: 'Mestre Macaúba',
    place: 'Instituto Cultural Malungo', bairro: 'Vila Industrial', address: 'R. Maria da Glória, 670',
    lat: -22.231009, lon: -54.78453, phone: '', instagram: 'instituto_cultural_malungo',
    sessions: [[2, '19h', '21h'], [4, '19h', '21h']], revised: '12/08/2026' },
  { n: 13, id: 'baiana', layer: 'capoeira', group: 'Associação de Capoeira Baiana', who: 'Mestre Guerreiro',
    place: 'Associação de Capoeira Baiana Mestre Guerreiro', bairro: 'Jardim Itália', address: 'R. Independência, 285',
    lat: -22.235669, lon: -54.815423, phone: '67 9849-4129', instagram: 'mestreguerreiroms',
    sessions: [[1, '19h30', '21h'], [3, '19h30', '21h'], [5, '19h30', '21h']], revised: '12/08/2026' },
  { n: 14, id: 'fuziy', layer: 'capoeira', group: 'Camará Capoeira', who: 'Instrutor Ramão',
    place: 'Instituto Fuziy', bairro: 'Vila São Braz', address: 'R. Ramão Osório, 485',
    lat: -22.237836, lon: -54.746136, phone: '', instagram: 'institutofuziy',
    sessions: [[2, '8h', '10h'], [4, '8h', '10h'], [2, '14h', '16h'], [4, '14h', '16h']], revised: '02/05/2026' },
  { n: 15, id: 'jamaica', layer: 'capoeira', group: 'Capoeira Filhos de Jamaica', who: 'Professora Líria',
    place: 'Associação e Centro Social dos Militares Estaduais (Regional de Dourados)', bairro: 'Izidro Pedroso',
    address: 'R. Antônio Luís Marra, 2375',
    lat: -22.239104, lon: -54.793531, phone: '67 99874-0791', instagram: '',
    sessions: [[2, '19h'], [4, '19h']], revised: '12/08/2026' },
  { n: 16, id: 'izidro', layer: 'capoeira', group: 'Capoarti', who: 'Mestre Cyborg',
    place: 'Praça Izidro Pedroso', bairro: 'Izidro Pedroso', address: 'R. Mozart Calheiros',
    lat: -22.240824, lon: -54.790502, phone: '67 98124-8862', instagram: '',
    sessions: [[0, '9h30']], revised: '12/08/2026' },
  { n: 17, id: 'rego', layer: 'capoeira', group: 'Centro Cultural Grãos', who: 'Bruno Grãos',
    place: 'Academia da Saúde do Parque Rego d’Água', bairro: '', address: 'R. Francisco Feitosa Sobreira, 75',
    lat: -22.248934, lon: -54.815905, phone: '67 98187-9226', instagram: 'graoscapoeira_dourados',
    sessions: [[2, '19h30'], [4, '19h30']], revised: '12/08/2026' },
  { n: 18, id: 'corpomente', layer: 'capoeira', group: 'Capoarti', who: 'Mestre Cyborg',
    place: 'CT Corpomente', bairro: 'Jardim Rasslem', address: 'R. Manoel Rasselem',
    lat: -22.254433, lon: -54.813373, phone: '67 98124-8862', instagram: '',
    sessions: [[2, '7h', '9h', 'Infantil'], [4, '7h', '9h', 'Infantil'], [2, '15h', '16h', '12 anos ou mais'],
      [4, '15h', '16h', '12 anos ou mais'], [2, '21h', '22h30', 'Adulto'], [4, '21h', '22h30', 'Adulto']],
    revised: '12/08/2026' },
  // The next layers, as they would look (not in the first version).
  { id: 'centrao', layer: 'batalha', group: 'Batalha do Centrão', who: '',
    place: 'Praça Antônio João', bairro: 'Centro', address: 'Praça Antônio João',
    lat: -22.228507, lon: -54.81103, phone: '', instagram: 'batalhadocentrao',
    sessions: [], times: 'Edições na praça; as últimas numa segunda, às 19h', revised: '' },
  { id: 'feira-ipes', layer: 'feira', group: 'Feira dos Ipês', who: '',
    place: 'Parque dos Ipês', bairro: 'Royal Barcelona', address: 'Parque dos Ipês',
    lat: -22.217443, lon: -54.812472, phone: '', instagram: 'feiradosipesddos',
    sessions: [[2, '17h', '22h']], revised: '' },
];

export const byId = (id) => PLACES.find((p) => p.id === id);
export const capoeira = PLACES.filter((p) => p.layer === 'capoeira');

// ---------- Times, in the agenda's words ----------
const join = (xs) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} e ${xs.at(-1)}`);
export const span = (s) => (s[2] ? `${s[1]} às ${s[2]}` : s[1]);

// "Ter e Qui, 19h às 21h" lines: the sessions grouped by time and who.
export function timeLines(p) {
  if (!p.sessions.length) return [p.times || 'Horário a confirmar'];
  const groups = new Map();
  for (const s of p.sessions) {
    const key = `${s[3] || ''}|${span(s)}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(s[0]);
  }
  return [...groups].map(([key, days]) => {
    const [who, when] = key.split('|');
    const dayText = join([...new Set(days)].sort().map((d) => D[d]));
    return `${who ? who + ': ' : ''}${dayText}, ${when}`;
  });
}
export const sessionsOn = (p, day) => p.sessions.filter((s) => s[0] === day);
export const minutes = (t) => { const m = /^(\d+)h(\d*)$/.exec(t); return m ? Number(m[1]) * 60 + Number(m[2] || 0) : 0; };

// ---------- Web Mercator, as MapLibre draws it (512px tiles) ----------
const R = Math.PI / 180;
const unitX = (lon) => (lon + 180) / 360;
const unitY = (lat) => (1 - Math.log(Math.tan(Math.PI / 4 + (lat * R) / 2)) / Math.PI) / 2;
const lonOf = (x) => x * 360 - 180;
const latOf = (y) => (2 * Math.atan(Math.exp(Math.PI * (1 - 2 * y))) - Math.PI / 2) / R;

// The centre and zoom that show `points` inside the box the page leaves (pad = what covers the map).
export function fitView(points, w, h, pad = {}, maxZoom = 15) {
  const p = { top: 24, right: 24, bottom: 24, left: 24, ...pad };
  const xs = points.map((q) => unitX(q.lon)), ys = points.map((q) => unitY(q.lat));
  const [x1, x2, y1, y2] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const zx = Math.log2((w - p.left - p.right) / Math.max((x2 - x1) * 512, 1e-9));
  const zy = Math.log2((h - p.top - p.bottom) / Math.max((y2 - y1) * 512, 1e-9));
  const z = Math.min(zx, zy, maxZoom);
  const W = 512 * 2 ** z;
  const cx = (x1 + x2) / 2 - (p.left - p.right) / 2 / W;
  const cy = (y1 + y2) / 2 - (p.top - p.bottom) / 2 / W;
  return { lat: latOf(cy), lon: lonOf(cx), z: Math.round(z * 1000) / 1000, w, h };
}
// A view with one point at (x, y) of the box.
export function viewAt(point, z, w, h, x, y) {
  const W = 512 * 2 ** z;
  return { lat: latOf(unitY(point.lat) + (h / 2 - y) / W), lon: lonOf(unitX(point.lon) + (w / 2 - x) / W), z, w, h };
}
export function project(view, lat, lon) {
  const W = 512 * 2 ** view.z;
  return { x: (unitX(lon) - unitX(view.lon)) * W + view.w / 2, y: (unitY(lat) - unitY(view.lat)) * W + view.h / 2 };
}

// ---------- The artboards' maps ----------
const all = PLACES;
export const VIEWS = {
  // Cartaz: the city whole above the legend's sheet (236px of it showing).
  'a-celular': fitView(capoeira, 390, 668, { top: 30, right: 26, bottom: 236 + 26, left: 26 }),
  // A place open: Casulo, under the sheet.
  'a-celular-lugar': viewAt(byId('casulo'), 14.4, 390, 668, 195, 128),
  'a-desktop': fitView(capoeira, 1440, 720, { top: 48, right: 444 + 56, bottom: 48, left: 72 }),
  // The poster: a 540×320 view photographed at twice its size (1080×640 on the 1080×1350 flyer).
  'a-cartaz': fitView(capoeira, 540, 252, { top: 16, right: 22, bottom: 12, left: 22 }),
  // Hoje: the map band under the days; the day's places lead.
  'b-celular': fitView(['matumbe', 'baiana', 'tribos'].map(byId), 390, 250, { top: 66, right: 56, bottom: 26, left: 40 }),
  'b-celular-lugar': viewAt(byId('matumbe'), 14.6, 390, 668, 195, 138),
  'b-desktop': fitView(capoeira, 1440, 720, { top: 56, right: 56, bottom: 48, left: 444 + 64 }),
  // Camadas: every layer on, the chips over the map.
  'c-celular': fitView(all, 390, 668, { top: 76, right: 26, bottom: 28, left: 26 }),
  'c-celular-lugar': viewAt(byId('baiana'), 14.4, 390, 668, 195, 150),
  'c-desktop': fitView(all, 1440, 720, { top: 48, right: 404 + 48, bottom: 40, left: 324 + 48 }),
};

// The photograph of a view, for the page's theme.
export function viewImage(name) {
  const dark = typeof document !== 'undefined' && document.documentElement.dataset.scheme === 'dark';
  return new URL(`mapa/${name}-${dark ? 'escuro' : 'claro'}.webp`, import.meta.url).href;
}

// ---------- On the page: the stage under the band, the pins on their streets ----------
// <div class="map-view" data-view="a-celular" [data-scale="2"] [data-cluster="nums|count"]> holds the
// photographs (img.map-img.is-claro / .is-escuro) and the pins (.pin[data-place="<id>"]). Pins closer
// than their size are merged: a pill of their numbers (Cartaz) or a count (Camadas).
function cluster(items, gap) {
  const groups = [];
  for (const it of items) {
    const near = groups.filter((g) => g.some((o) => Math.hypot(o.x - it.x, o.y - it.y) < gap));
    const merged = near.flat().concat(it);
    for (const g of near) groups.splice(groups.indexOf(g), 1);
    groups.push(merged);
  }
  return groups;
}

export function placePins(root = document) {
  const band = root.querySelector('.band');
  if (band) document.documentElement.style.setProperty('--stage-top', `${Math.round(band.getBoundingClientRect().bottom)}px`);
  for (const el of root.querySelectorAll('.map-view[data-view]')) {
    const view = VIEWS[el.dataset.view];
    const scale = Number(el.dataset.scale || 1);
    el.style.width = `${view.w * scale}px`;
    el.style.height = `${view.h * scale}px`;
    const items = [...el.querySelectorAll('.pin[data-place]')].map((pin) => {
      const p = byId(pin.dataset.place);
      const { x, y } = project(view, p.lat, p.lon);
      pin.style.left = `${x * scale}px`;
      pin.style.top = `${y * scale}px`;
      // Off the photograph (a zoomed view): not drawn.
      if (x < -30 || y < -30 || x > view.w + 30 || y > view.h + 30) pin.hidden = true;
      return { pin, x: x * scale, y: y * scale };
    });
    const mode = el.dataset.cluster;
    if (!mode) continue;
    const gap = Number(el.dataset.gap || 30) * scale;
    // Only points of the same layer merge, so each layer keeps its drawing on the map.
    const free = items.filter((i) => !i.pin.hidden && !i.pin.matches('.pin-drop, .pin-quiet'));
    const layers = [...new Set(free.map((i) => i.pin.dataset.layer || ''))];
    for (const g of layers.flatMap((l) => cluster(free.filter((i) => (i.pin.dataset.layer || '') === l), gap))) {
      if (g.length < 2) continue;
      g.sort((a, b) => Number(a.pin.textContent) - Number(b.pin.textContent));
      const c = document.createElement('span');
      c.className = `pin ${mode === 'nums' ? 'pin-nums' : 'pin-count'}`;
      c.setAttribute('aria-hidden', 'true');
      if (mode === 'nums') c.innerHTML = g.map((i) => `<span>${i.pin.textContent}</span>`).join('');
      else c.textContent = String(g.length);
      c.style.left = `${g.reduce((s, i) => s + i.x, 0) / g.length}px`;
      c.style.top = `${g.reduce((s, i) => s + i.y, 0) / g.length}px`;
      for (const i of g) i.pin.hidden = true;
      el.append(c);
    }
  }
}
