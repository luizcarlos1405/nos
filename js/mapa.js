// Mapa (mapa.html): the city's map of culture and of the movements, by layers. Each layer of MAP_LAYERS
// (js/config.js) is a sheet of places (js/places.js) that turns on and off; each place is a point with
// its layer's drawing on the map painted in Céu · Terra (MapLibre over OpenFreeMap's tiles,
// js/map-style.js), points too close to tell apart merge into a count, and a place opens in a card with
// its times, contacts, the way there and a ready WhatsApp message. The same places are listed by layer
// in the panel (the rail on the desk, a sheet on phones): the list is the map for whoever doesn't use
// the map, and what is left when the map can't open (no WebGL, MapLibre not loaded, offline).

import { MAP_LAYERS, MAP_REVIEW_MONTHS, MAP_SUGGEST_URL } from './config.js';
import { buildPlaces } from './places.js';
import { buildStyle } from './map-style.js';
import { icon } from './icons.js';
import { buildPlaceMessage, directionsUrl, whatsAppShareUrl } from './whatsapp.js';
import { $, announce, el, escapeHtml, initPage, readSheet, registerWorker, safeUrl, showNotice, showOffline } from './page.js';

// From 1100px the panel is a rail at the left and a place opens in a card at the right; below, both are
// sheets over the map.
const desk = matchMedia('(min-width: 1100px)');
// Points closer than a point's size on screen merge into a count (30px, 26px on phones), as on the board.
const clusterGap = () => (desk.matches ? 30 : 26);
// The city's centre (Praça Antônio João): the map opens on the places around it, the far ones (the UFGD's
// campus, 13 km out) a zoom away; on phones the city's core, its edges a pinch away.
const CENTRE = [-54.811, -22.2285];
const openingRadiusKm = () => (desk.matches ? 6 : 3);
const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
// Places this close share an address (a group that trains in a union's seat, a fair in the city's
// convention centre): no zoom brings them apart, so each one's card names the others.
const SAME_SPOT_M = 30;

const state = {
  places: [],
  on: new Set(MAP_LAYERS.map((l) => l.id)), // the layers shown
  open: null, // the place in the card
  opener: null, // what opened it, for focus to go back to
};
let map = null;
const markers = new Map(); // place id → { marker, el }
let clusterMarkers = [];
let dropMarker = null;
let youMarker = null;

const countPlaces = (n) => `${n} ${n === 1 ? 'lugar' : 'lugares'}`;
const shownPlaces = () => state.places.filter((p) => state.on.has(p.layer.id));
const layersWithPlaces = () => MAP_LAYERS.filter((l) => state.places.some((p) => p.layer === l));
const byId = (id) => state.places.find((p) => p.id === id);
const dayText = (date) => date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

// ---------- Data ----------

async function loadLayer(layer) {
  const { headers, records, lines, savedAt } = await readSheet(layer.file);
  return { layer, savedAt, ...buildPlaces(layer, headers, records, lines) };
}

async function load() {
  const results = await Promise.allSettled(MAP_LAYERS.map(loadLayer));
  const failed = [];
  const problems = [];
  let savedAt = null;
  results.forEach((result, i) => {
    const layer = MAP_LAYERS[i];
    if (result.status === 'rejected') {
      console.error(result.reason);
      failed.push(layer.name);
      return;
    }
    const { places, invalid, stale, held, missing, savedAt: saved } = result.value;
    if (saved && (!savedAt || saved < savedAt)) savedAt = saved;
    if (missing.length) problems.push(`<li><code>${escapeHtml(layer.file)}</code>: falta a coluna ${missing.map((m) => `“${m}”`).join(' e ')}.</li>`);
    const why = { name: 'falta o nome', coords: 'faltam as coordenadas (latitude, longitude)', review: 'falta a data da última revisão (dd/mm/aaaa)' };
    for (const row of invalid) problems.push(`<li><code>${escapeHtml(layer.file)}</code>, linha ${row.line}: ${why[row.reason]}.</li>`);
    // Left out for want of a review (js/review.js): told to the team in the console, not to visitors.
    if (stale.length) console.info(`Mapa, ${layer.name}: ${stale.length} lugar(es) fora do mapa, sem revisão há mais de ${MAP_REVIEW_MONTHS} meses:`, stale.map((r) => `linha ${r.line}, ${r.name} (${dayText(r.reviewed)})`));
    // Held until something is recorded (MAP_HELD in js/config.js): the team's, in the console too.
    if (held.length) console.info(`Mapa, ${layer.name}: ${held.length} lugar(es) fora do mapa por enquanto:`, held.map((r) => `linha ${r.line}, ${r.name}: ${r.why}`));
    state.places.push(...places);
  });
  if (failed.length === MAP_LAYERS.length) {
    showNotice(`<strong>Não foi possível carregar o mapa.</strong> Confira a conexão e recarregue a página.`, 'error');
  } else if (failed.length) {
    showNotice(`<strong>Uma parte do mapa não carregou:</strong> ${escapeHtml(failed.join(', '))}. Recarregue a página para tentar de novo.`);
  } else if (problems.length) {
    showNotice(`<p><strong>${problems.length === 1 ? '1 linha ficou de fora do mapa' : `${problems.length} linhas ficaram de fora do mapa`}.</strong></p><details><summary>Ver as linhas para corrigir</summary><ul>${problems.join('')}</ul></details>`);
  }
  if (savedAt) showOffline(savedAt, 'os lugares salvos');
  renderSummary();
  startMap();
  renderLayers();
  renderChips();
  openFromAddress();
}

// ---------- The top line, the chips and the panel's list ----------

function renderSummary() {
  const layers = layersWithPlaces();
  $('page-sub').textContent = state.places.length
    ? `${countPlaces(state.places.length)} em ${layers.length} ${layers.length === 1 ? 'camada' : 'camadas'}`
    : 'Nenhum lugar por enquanto';
}

const glyph = (layer, className = 'glyph') => `<span class="${className}" aria-hidden="true">${icon(layer.icon)}</span>`;

// Phones: the layers as chips over the map (the panel holds the same switches and the lists).
function renderChips() {
  const bar = $('layer-chips');
  bar.replaceChildren(...layersWithPlaces().map((layer) => {
    const b = el('button', 'chip map-chip');
    b.type = 'button';
    b.dataset.layer = layer.id;
    const n = state.places.filter((p) => p.layer === layer).length;
    // The layer's drawing stays in both states: it is the key to the points (the fill says it is on).
    b.innerHTML = `${glyph(layer, 'chip-glyph')}${escapeHtml(layer.name)}<span class="chip-n">${n}</span>`;
    b.addEventListener('click', () => toggleLayer(layer.id));
    return b;
  }));
  syncSwitches();
}

// The panel: per layer a switch (its drawing, name and count) and a list of its places, folded. Without
// a map the list is the page: each layer a heading over its places, all open.
function renderLayers() {
  const list = $('layer-list');
  const layers = layersWithPlaces();
  const listOnly = !map;
  if (listOnly) $('side-sub').textContent = 'Todos os lugares, por camada';
  if (!layers.length) {
    list.replaceChildren(el('li', 'layer-empty', 'Ainda não há lugares no mapa.'));
    return;
  }
  list.replaceChildren(...layers.map((layer) => {
    const places = state.places.filter((p) => p.layer === layer).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    const li = el('li', 'layer');
    // The places by name: a group or an organization with several places (a capoeira group's
    // trainings around the city) is one entry with its places under it ("Por grupo" on the board).
    const placeList = () => {
      const ul = el('ul', 'layer-places');
      ul.id = `places-${layer.id}`;
      const byName = new Map();
      for (const place of places) {
        const key = place.name.toLocaleLowerCase('pt-BR');
        if (!byName.has(key)) byName.set(key, []);
        byName.get(key).push(place);
      }
      for (const group of byName.values()) {
        const item = el('li');
        if (group.length === 1) {
          item.append(placeLink(group[0]));
        } else {
          item.className = 'place-group';
          const head = el('p', 'place-group-name');
          head.innerHTML = `<span>${escapeHtml(group[0].name)}</span><span class="place-group-n">${countPlaces(group.length)}</span>`;
          const sub = el('ul');
          const spot = (p) => p.place || p.address || p.bairro;
          sub.append(...group.sort((a, b) => spot(a).localeCompare(spot(b), 'pt-BR')).map((p) => {
            const row = el('li');
            row.append(placeLink(p, true));
            return row;
          }));
          item.append(head, sub);
        }
        ul.append(item);
      }
      return ul;
    };
    if (listOnly) {
      const title = el('h3', 'layer-title');
      title.innerHTML = `${glyph(layer)}<span class="layer-name">${escapeHtml(layer.name)}</span><span class="layer-n">${places.length}</span>`;
      li.append(title, placeList());
      return li;
    }
    const head = el('div', 'layer-head');
    const toggle = el('button', 'layer-toggle');
    toggle.type = 'button';
    toggle.dataset.layer = layer.id;
    toggle.innerHTML = `<span class="check" aria-hidden="true">${icon('check')}</span>${glyph(layer)}<span class="layer-name">${escapeHtml(layer.name)}</span><span class="layer-n">${places.length}</span>`;
    toggle.addEventListener('click', () => toggleLayer(layer.id));
    const more = el('button', 'icon-button layer-more');
    more.type = 'button';
    more.setAttribute('aria-expanded', 'false');
    more.setAttribute('aria-controls', `places-${layer.id}`);
    more.setAttribute('aria-label', `Ver os lugares de ${layer.name}`);
    more.innerHTML = icon('down');
    head.append(toggle, more);
    const ul = placeList();
    ul.hidden = true;
    more.addEventListener('click', () => {
      const opening = ul.hidden;
      ul.hidden = !opening;
      more.setAttribute('aria-expanded', String(opening));
      more.setAttribute('aria-label', `${opening ? 'Esconder' : 'Ver'} os lugares de ${layer.name}`);
    });
    li.append(head, ul);
    return li;
  }));
  syncSwitches();
}

// A place in the panel's list: its name and where (inside its group: where only, its name for screen
// readers too).
function placeLink(place, inGroup = false) {
  const b = el('button', 'place-link');
  b.type = 'button';
  b.dataset.id = place.id;
  const where = [place.place, place.bairro].filter(Boolean).join(' · ') || place.address;
  if (inGroup) {
    b.innerHTML = `<span class="place-link-name">${escapeHtml(place.place || place.address || place.bairro)}</span>${place.place && place.bairro ? `<span class="place-link-where">${escapeHtml(place.bairro)}</span>` : ''}`;
    b.setAttribute('aria-label', `${place.name}: ${where}`);
  } else {
    b.innerHTML = `<span class="place-link-name">${escapeHtml(place.name)}</span><span class="place-link-where">${escapeHtml(where)}</span>`;
  }
  b.addEventListener('click', () => openPlace(place, { from: b, fly: true }));
  return b;
}

function syncSwitches() {
  for (const b of document.querySelectorAll('[data-layer]')) b.setAttribute('aria-pressed', String(state.on.has(b.dataset.layer)));
}

function toggleLayer(id) {
  if (state.on.has(id)) state.on.delete(id);
  else state.on.add(id);
  syncSwitches();
  if (state.open && !state.on.has(state.open.layer.id)) closePlace();
  drawPoints();
  const layer = MAP_LAYERS.find((l) => l.id === id);
  const n = shownPlaces().length;
  announce(`${layer.name} ${state.on.has(id) ? 'no mapa' : 'fora do mapa'}. ${countPlaces(n)} no mapa.`);
  $('map-empty').hidden = n > 0;
}

// ---------- The map ----------

function canDrawMap() {
  if (typeof maplibregl === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

// The stage starts under the band (the header's height changes with the width and the fonts).
function placeStage() {
  const band = document.querySelector('.band');
  if (band) document.documentElement.style.setProperty('--stage-top', `${Math.round(band.getBoundingClientRect().bottom)}px`);
}

// What covers the map, so points open clear of it: the chips on phones, the rail and the card on the desk.
function mapPadding() {
  if (desk.matches) {
    const rail = $('map-side').getBoundingClientRect();
    const card = state.open ? $('place').getBoundingClientRect().width + 48 : 48;
    return { top: 48, bottom: 48, left: rail.right + 48, right: card };
  }
  const chips = $('layer-bar').getBoundingClientRect();
  const sheet = state.open ? $('place').getBoundingClientRect().height : 0;
  return { top: chips.height + 28, bottom: Math.max(sheet, 0) + 32, left: 40, right: 40 };
}

const distanceKm = ([lon1, lat1], [lon2, lat2]) => {
  const k = Math.PI / 180;
  const x = (lon2 - lon1) * k * Math.cos(((lat1 + lat2) / 2) * k);
  return Math.hypot(x, (lat2 - lat1) * k) * 6371;
};
// Metres per pixel of the map at a zoom, at the city's latitude (MapLibre's world is 512px wide at zoom 0).
const metresPerPx = (zoom) => (40075016.686 * Math.cos((CENTRE[1] * Math.PI) / 180)) / (512 * 2 ** zoom);
const layerOrder = (place) => MAP_LAYERS.indexOf(place.layer);
const byLayerThenName = (a, b) => layerOrder(a) - layerOrder(b) || a.name.localeCompare(b.name, 'pt-BR');
// The other places at this one's address, in the layers' order.
const sameSpot = (place) => state.places
  .filter((p) => p !== place && distanceKm(p.lngLat, place.lngLat) * 1000 < SAME_SPOT_M)
  .sort(byLayerThenName);

function openingBounds() {
  const near = shownPlaces().filter((p) => distanceKm(p.lngLat, CENTRE) <= openingRadiusKm());
  const points = (near.length ? near : state.places).map((p) => p.lngLat);
  if (!points.length) return [[CENTRE[0] - 0.05, CENTRE[1] - 0.05], [CENTRE[0] + 0.05, CENTRE[1] + 0.05]];
  const lons = points.map((p) => p[0]);
  const lats = points.map((p) => p[1]);
  return [[Math.min(...lons), Math.min(...lats)], [Math.max(...lons), Math.max(...lats)]];
}

function startMap() {
  placeStage();
  if (!canDrawMap()) {
    document.body.classList.add('no-map');
    showNotice('<strong>O mapa não abriu neste aparelho.</strong> Todos os lugares estão na lista, por camada.');
    return;
  }
  try {
    map = new maplibregl.Map({
      container: 'map',
      style: buildStyle(),
      bounds: openingBounds(),
      fitBoundsOptions: { padding: mapPadding(), maxZoom: 14 },
      attributionControl: false,
      dragRotate: false,
      pitchWithRotate: false,
      touchPitch: false,
      maxZoom: 18,
      minZoom: 9,
      fadeDuration: 0,
    });
  } catch (err) {
    console.error(err);
    document.body.classList.add('no-map');
    showNotice('<strong>O mapa não abriu neste aparelho.</strong> Todos os lugares estão na lista, por camada.');
    return;
  }
  map.touchZoomRotate.disableRotation();
  map.keyboard.disableRotation();
  map.on('zoomend', drawClusters);
  map.on('load', drawPoints);
  map.on('error', (e) => console.warn('Mapa:', e.error?.message || e));
  // The theme decides the paint: a new theme, a new style (the points are page elements and stay).
  new MutationObserver(() => map.setStyle(buildStyle())).observe(document.documentElement, { attributes: true, attributeFilter: ['data-scheme'] });
  if (!navigator.onLine) showNotice('<strong>Sem conexão.</strong> O mapa precisa da internet para mostrar as ruas; os lugares estão na lista.');
}

// One point per place of the layers shown, with the layer's drawing; then the merging.
function drawPoints() {
  if (!map) return;
  for (const place of state.places) {
    let entry = markers.get(place.id);
    if (!entry) {
      const node = el('button', 'map-point');
      node.type = 'button';
      node.tabIndex = -1; // the list is the way in by keyboard
      node.setAttribute('aria-hidden', 'true');
      node.innerHTML = `<span class="pin-dot">${icon(place.layer.icon)}</span>`;
      node.title = place.name;
      node.addEventListener('click', (e) => {
        e.stopPropagation();
        openPlace(place, { fly: true });
      });
      const marker = new maplibregl.Marker({ element: node, anchor: 'center' }).setLngLat(place.lngLat);
      entry = { marker, node, added: false };
      markers.set(place.id, entry);
    }
    const show = state.on.has(place.layer.id);
    if (show && !entry.added) {
      entry.marker.addTo(map);
      entry.added = true;
    } else if (!show && entry.added) {
      entry.marker.remove();
      entry.added = false;
    }
  }
  drawClusters();
}

// Points closer than clusterGap() on screen become one count, whatever their layers (counts of different
// layers would pile up on each other); a tap brings them apart, and close up each point shows its layer's
// drawing again. Distances on screen depend only on the zoom, so this runs when the zoom ends and when
// layers change.
function drawClusters() {
  if (!map) return;
  for (const m of clusterMarkers) m.remove();
  clusterMarkers = [];
  // The open place and the places at its address stand under its drop (its card names them).
  const underDrop = state.open ? new Set([state.open, ...sameSpot(state.open)]) : new Set();
  for (const p of underDrop) markers.get(p.id)?.node.classList.add('is-merged');
  const items = shownPlaces()
    .filter((p) => !underDrop.has(p))
    .map((p) => ({ place: p, xy: map.project(p.lngLat) }));
  const groups = [];
  for (const item of items) {
    const near = groups.filter((g) => g.some((o) => Math.hypot(o.xy.x - item.xy.x, o.xy.y - item.xy.y) < clusterGap()));
    const merged = near.flat().concat(item);
    for (const g of near) groups.splice(groups.indexOf(g), 1);
    groups.push(merged);
  }
  for (const group of groups) {
    for (const { place } of group) markers.get(place.id)?.node.classList.toggle('is-merged', group.length > 1);
    if (group.length < 2) continue;
    const lons = group.map((i) => i.place.lngLat[0]);
    const lats = group.map((i) => i.place.lngLat[1]);
    const node = el('button', 'map-point');
    node.type = 'button';
    node.tabIndex = -1;
    node.setAttribute('aria-hidden', 'true');
    // Two places: both drawings, overlapping by half; from three up, their count.
    node.innerHTML = group.length === 2
      ? `<span class="pin-pair">${group.map((i) => i.place).sort((a, b) => a.lngLat[0] - b.lngLat[0] || byLayerThenName(a, b)).map((p) => `<span class="pin-dot">${icon(p.layer.icon)}</span>`).join('')}</span>`
      : `<span class="pin-count">${group.length}</span>`;
    node.title = group.map((i) => i.place.name).join(', ');
    // A tap brings them apart; places that no zoom can part (one address) open the first one's card,
    // which names the others.
    const places = group.map((i) => i.place);
    const spreadM = Math.max(...places.flatMap((a) => places.map((b) => distanceKm(a.lngLat, b.lngLat) * 1000)));
    const parts = spreadM >= clusterGap() * metresPerPx(map.getMaxZoom());
    node.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!parts) return openPlace(places.sort(byLayerThenName)[0], { fly: true });
      const pad = mapPadding();
      const padding = { top: pad.top + 40, bottom: pad.bottom + 40, left: pad.left + 40, right: pad.right + 40 };
      map.fitBounds([[Math.min(...lons), Math.min(...lats)], [Math.max(...lons), Math.max(...lats)]], { padding, maxZoom: map.getMaxZoom(), duration: reducedMotion() ? 0 : 600 });
    });
    const centre = [lons.reduce((a, b) => a + b, 0) / group.length, lats.reduce((a, b) => a + b, 0) / group.length];
    clusterMarkers.push(new maplibregl.Marker({ element: node, anchor: 'center' }).setLngLat(centre).addTo(map));
  }
  // The open place stands as a drop on its point.
  if (state.open && state.on.has(state.open.layer.id)) {
    if (!dropMarker) {
      const node = el('span', 'map-point pin-drop');
      node.setAttribute('aria-hidden', 'true');
      dropMarker = new maplibregl.Marker({ element: node, anchor: 'bottom' });
    }
    dropMarker.getElement().innerHTML = `<svg class="drop" viewBox="0 0 42 50"><path d="M21 48.5C15 41.5 4 30.5 4 19a17 17 0 1 1 34 0c0 11.5-11 22.5-17 29.5z"/></svg><span class="drop-glyph">${icon(state.open.layer.icon)}</span>`;
    dropMarker.setLngLat(state.open.lngLat).addTo(map);
  } else if (dropMarker) {
    dropMarker.remove();
  }
}

// The desk keeps the city in view: the map moves only when the place is under the rail or the card. On
// phones it comes close, the place above its sheet.
function flyTo(place) {
  if (!map) return;
  const padding = mapPadding();
  const duration = reducedMotion() ? 0 : 700;
  if (desk.matches) {
    const { x, y } = map.project(place.lngLat);
    const box = map.getContainer().getBoundingClientRect();
    const clear = x > padding.left && x < box.width - padding.right && y > padding.top + 40 && y < box.height - padding.bottom;
    if (!clear) map.easeTo({ center: place.lngLat, padding, duration });
    return;
  }
  map.easeTo({ center: place.lngLat, zoom: Math.max(map.getZoom(), 14.4), padding, duration });
}

// "Onde estou": the person's own position, only on this device (nothing is sent anywhere).
function locate() {
  if (!map || !('geolocation' in navigator)) return announce('Este aparelho não informa a localização.');
  navigator.geolocation.getCurrentPosition((pos) => {
    const lngLat = [pos.coords.longitude, pos.coords.latitude];
    if (!youMarker) {
      const node = el('span', 'map-you');
      node.setAttribute('aria-hidden', 'true');
      youMarker = new maplibregl.Marker({ element: node, anchor: 'center' });
    }
    youMarker.setLngLat(lngLat).addTo(map);
    map.easeTo({ center: lngLat, zoom: Math.max(map.getZoom(), 14), padding: mapPadding(), duration: reducedMotion() ? 0 : 700 });
    announce('O mapa está no lugar onde você está.');
  }, () => announce('Não foi possível saber onde você está. Confira se o aparelho permite a localização.'), { enableHighAccuracy: true, timeout: 15000 });
}

// ---------- A place ----------

function factRow(iconName, label, main, sub = '') {
  const row = el('div', 'fact');
  row.innerHTML = `<dt>${icon(iconName)}<span class="sr-only">${label}</span></dt><dd>${main}${sub ? `<span class="fact-sub">${sub}</span>` : ''}</dd>`;
  return row;
}

function renderPlace(place) {
  const card = $('place');
  $('place-title').textContent = place.name;
  // Under the name: the layer's drawing and name, then who leads it ("Capoeira · Mestre Guerreiro").
  $('place-meta').innerHTML = `${glyph(place.layer, 'glyph meta-glyph')}<span class="meta-layer">${escapeHtml(place.layer.one)}</span>${place.who ? `<span class="meta-who">${escapeHtml(place.who)}</span>` : ''}`;

  const times = $('place-times');
  times.hidden = !place.when.length;
  if (place.when.length) {
    $('place-times-head').lastChild.textContent = place.layer.id === 'capoeira' ? 'Treinos' : 'Quando';
    $('place-times-list').replaceChildren(...place.when.map((line) => {
      const li = el('li');
      const m = line.match(/^([^:]{2,40}):\s+(.+)$/);
      if (m) li.append(el('b', null, `${m[1]}:`), ` ${m[2]}`);
      else li.textContent = line;
      return li;
    }));
  }
  const text = $('place-text');
  text.textContent = place.description;
  text.hidden = !place.description;

  const facts = $('place-facts');
  const rows = [];
  const where = [place.address, place.bairro].filter(Boolean).map(escapeHtml).join(', ');
  rows.push(factRow('pin', 'Onde', escapeHtml(place.place || place.address || place.bairro || 'Endereço não informado'), place.place ? where : place.address ? escapeHtml(place.bairro) : ''));
  for (const phone of place.phones) {
    const href = phone.mobile ? `https://wa.me/55${phone.digits}` : `tel:+55${phone.digits}`;
    rows.push(factRow(phone.mobile ? 'message' : 'phone', 'Contato', `<a class="fact-link" href="${href}" target="_blank" rel="noopener">${phone.label}</a>`, phone.mobile ? 'WhatsApp' : 'Telefone'));
  }
  if (place.contactNote) rows.push(factRow('phone', 'Contato', escapeHtml(place.contactNote)));
  if (place.instagram) rows.push(factRow('instagram', 'Instagram', `<a class="fact-link" href="${place.instagramHref}" target="_blank" rel="noopener">@${escapeHtml(place.instagram)}</a>`));
  const link = safeUrl(place.link);
  if (link) rows.push(factRow('link', 'Link', `<a class="fact-link" href="${escapeHtml(link)}" target="_blank" rel="noopener">${escapeHtml(new URL(link).hostname.replace(/^www\./, ''))}</a>`));
  facts.replaceChildren(...rows);

  // The other places at this address (a group that trains in a union's seat…), one tap away.
  const also = sameSpot(place);
  $('place-also').hidden = !also.length;
  $('place-also-list').replaceChildren(...also.map((other) => {
    const li = el('li');
    const b = el('button', 'also-link');
    b.type = 'button';
    b.innerHTML = `${glyph(other.layer)}<span class="also-text"><span class="also-name">${escapeHtml(other.name)}</span><span class="also-layer">${escapeHtml(other.layer.one)}</span></span>`;
    b.addEventListener('click', () => {
      if (!state.on.has(other.layer.id)) {
        state.on.add(other.layer.id);
        syncSwitches();
        $('map-empty').hidden = true;
        drawPoints();
      }
      openPlace(other);
    });
    li.append(b);
    return li;
  }));

  // Who checked it and when: the review that keeps it on the map (js/review.js).
  const source = safeUrl(place.source);
  const note = $('place-review');
  const checked = place.layer.credit ? `Conferido pelo ${escapeHtml(place.layer.credit)} em ${dayText(place.reviewed)}.` : `Revisado em ${dayText(place.reviewed)}.`;
  note.innerHTML = `${icon('history')}<span>${checked}${source ? ` <a href="${escapeHtml(source)}" target="_blank" rel="noopener">Ver a fonte</a>` : ''}</span>`;

  $('place-send').href = whatsAppShareUrl(buildPlaceMessage(place));
  $('place-way').href = directionsUrl(place);
  card.dataset.layer = place.layer.id;
}

function openPlace(place, { from = null, fly = false } = {}) {
  const wasOpen = Boolean(state.open);
  state.open = place;
  state.opener = from || state.opener;
  renderPlace(place);
  const card = $('place');
  card.hidden = false;
  document.body.classList.add('has-place');
  for (const b of document.querySelectorAll('.place-link')) b.classList.toggle('is-open', b.dataset.id === place.id);
  // On phones the list's sheet gives way to the place.
  if (!desk.matches) hideSide();
  const url = `#${place.id}`;
  if (!desk.matches && !wasOpen && history.state?.mapaSheet !== true) history.pushState({ mapaSheet: true }, '', url);
  else history.replaceState(history.state, '', url);
  drawClusters();
  if (fly) requestAnimationFrame(() => flyTo(place));
  $('place-title').focus({ preventScroll: true });
}

function closePlace({ fromHistory = false } = {}) {
  if (!state.open) return;
  state.open = null;
  $('place').hidden = true;
  document.body.classList.remove('has-place');
  for (const b of document.querySelectorAll('.place-link.is-open')) b.classList.remove('is-open');
  drawClusters();
  if (!fromHistory && history.state?.mapaSheet) history.back();
  else history.replaceState(null, '', location.pathname + location.search);
  const back = state.opener;
  state.opener = null;
  if (back && document.contains(back) && back.offsetParent) back.focus();
}

// The panel as a sheet on phones: opened by "Camadas", closed by ✕, Escape, the scrim or Back.
function showSide() {
  document.body.classList.add('side-open');
  $('map-side').setAttribute('aria-modal', 'true');
  $('map-side').setAttribute('role', 'dialog');
  if (history.state?.mapaSheet !== true) history.pushState({ mapaSheet: true }, '');
  $('side-title').focus({ preventScroll: true });
}

function hideSide() {
  if (!document.body.classList.contains('side-open')) return;
  document.body.classList.remove('side-open');
  $('map-side').removeAttribute('aria-modal');
  $('map-side').removeAttribute('role');
}

function closeSide() {
  if (!document.body.classList.contains('side-open')) return;
  hideSide();
  if (history.state?.mapaSheet) history.back();
  $('layers-open').focus();
}

// mapa.html#<id> opens that place (the WhatsApp message links to it).
function openFromAddress() {
  const id = decodeURIComponent(location.hash.slice(1));
  const place = id && byId(id);
  if (!place) return;
  // The page's own entry goes back to its plain address: on phones the place gets an entry of its own,
  // so Back (or ✕) leaves it for the map.
  history.replaceState(null, '', location.pathname + location.search);
  state.on.add(place.layer.id);
  syncSwitches();
  drawPoints();
  const go = () => openPlace(place, { fly: true });
  if (map && !map.loaded()) map.once('load', go);
  else go();
}

// ---------- Wiring ----------

function wire() {
  $('layers-open').addEventListener('click', showSide);
  $('side-close').addEventListener('click', closeSide);
  $('side-scrim').addEventListener('click', closeSide);
  $('place-close').addEventListener('click', () => closePlace());
  $('map-zoom-in').addEventListener('click', () => map?.zoomIn());
  $('map-zoom-out').addEventListener('click', () => map?.zoomOut());
  $('map-locate').addEventListener('click', locate);
  // The skip link leads to the list: on phones it lives in the sheet.
  document.querySelector('.skip-link')?.addEventListener('click', (e) => {
    if (desk.matches) return;
    e.preventDefault();
    showSide();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (document.body.classList.contains('side-open')) closeSide();
    else if (state.open) closePlace();
  });
  // Phones: Back closes the sheet or the place (their history entry). The desk adds no entries.
  window.addEventListener('popstate', () => {
    if (history.state?.mapaSheet) return;
    hideSide();
    if (state.open && !desk.matches) closePlace({ fromHistory: true });
  });
  desk.addEventListener('change', () => {
    hideSide();
    placeStage();
    map?.resize();
  });
  window.addEventListener('resize', placeStage);
  document.fonts?.ready.then(() => {
    placeStage();
    map?.resize();
  });
}

// "Falta algum lugar?", once the team has a link for it.
const suggestUrl = safeUrl(MAP_SUGGEST_URL);
if (suggestUrl) {
  $('suggest').href = suggestUrl;
  $('suggest').hidden = false;
}

initPage('Mapa');
wire();
if (location.protocol !== 'file:') load();
registerWorker();
