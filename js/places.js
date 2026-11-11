// Turns the Mapa's sheets (one CSV per layer, MAP_LAYERS in js/config.js) into places. Every layer has
// the same columns, matched without accents, case or spacing: Nome, Lugar, Endereço, Bairro,
// Coordenadas ("lat, lon": where the point goes; street addresses alone land too far off), Quando,
// Descrição, Contato, Instagram, Link, Fonte (the post or profile the place comes from), Última revisão
// (dd/mm/aaaa), Visível and Notas internas (ignored). The capoeira layer is the Mapa da Capoeira's sheet
// (COMAFRO Dourados) with its own columns, read through the aliases below: Grupo, Nome do Endereço,
// Nome do Responsável, Horários de Treino, Telefone de Contato, Plus Code, Última revisão em, Mostrar
// no Mapa.

import { MAP_REVIEW_MONTHS } from './config.js';
import { instagramUrl, phonesIn, readInstagram } from './businesses.js';
import { isHidden, normalizeKey, slugify } from './events.js';
import { isStale, reviewDay } from './review.js';

const ALIASES = {
  name: ['nome', 'grupo', 'organizacao', 'name'],
  place: ['lugar', 'nome_do_endereco', 'local', 'place'],
  address: ['endereco', 'address'],
  bairro: ['bairro'],
  coords: ['coordenadas', 'coordenada', 'coords'],
  plusCode: ['plus_code'],
  when: ['quando', 'horarios', 'horarios_de_treino', 'horario', 'when'],
  who: ['responsavel', 'nome_do_responsavel', 'quem'],
  description: ['descricao', 'description'],
  contact: ['contato', 'telefone', 'telefone_de_contato', 'whatsapp', 'contact'],
  instagram: ['instagram'],
  link: ['link', 'site'],
  source: ['fonte', 'source'],
  reviewed: ['ultima_revisao', 'ultima_revisao_em', 'revisao', 'revisado_em'],
  visible: ['visivel', 'mostrar_no_mapa', 'mostrar', 'visible'],
};

function columnMap(headers) {
  const map = {};
  for (const header of headers) {
    const key = normalizeKey(header);
    for (const [field, aliases] of Object.entries(ALIASES)) if (!map[field] && aliases.includes(key)) map[field] = header;
  }
  return map;
}

// "-22.2158, -54.8353": [lon, lat], as the map takes them, or null.
function readCoords(text) {
  const m = (text || '').match(/^\s*(-?\d{1,2}(?:\.\d+)?)\s*[,;]\s*(-?\d{1,3}(?:\.\d+)?)\s*$/);
  if (!m) return null;
  const lat = Number(m[1]);
  const lon = Number(m[2]);
  return Math.abs(lat) <= 90 && Math.abs(lon) <= 180 ? [lon, lat] : null;
}

// The Mapa da Capoeira's addresses carry the neighbourhood and the city: "R. Independência, 285 -
// Jardim Italia, Dourados - MS, 79814-470" → the street and "Jardim Italia".
function splitAddress(address) {
  const text = (address || '').replace(/\s+/g, ' ').trim();
  const m = text.match(/^(.*?)\s+-\s+([^,]+?)\.?(?:,.*)?$/);
  if (!m) return { street: text.replace(/,\s*Dourados\b.*$/i, ''), bairro: '' };
  const bairro = /^dourados\b/i.test(m[2]) ? '' : m[2].trim();
  return { street: m[1].trim(), bairro };
}

// Its Plus Code names the neighbourhood when the address doesn't: "Q6R7+7P Jardim dos Estados, Dourados - MS".
function bairroOfPlusCode(code) {
  const m = (code || '').match(/^[23456789CFGHJMPQRVWX]{4,8}\+[23456789CFGHJMPQRVWX]{2,3}\s+(.+?),\s*Dourados\b/i);
  return m && !/^-/.test(m[1]) ? m[1].trim() : '';
}

// The way schedules are typed ("Seg, Quar e Sex 19:30h-21h", "Dom 9:30h") read as the agenda writes
// times: "Seg, Qua e Sex 19h30 às 21h", "Dom 9h30". Only these marks change; the words stay.
export function tidyTimes(text) {
  return text
    .replace(/(\d{1,2}):(\d{2})\s*h?/g, (_, h, m) => `${Number(h)}h${m === '00' ? '' : m}`)
    .replace(/(\d{1,2}h\d{0,2})\s*-\s*(\d{1,2}h\d{0,2})/g, '$1 às $2')
    .replace(/(^|\s)às (\d{1,2}h\d{0,2}) às (\d{1,2}h\d{0,2})/g, '$1das $2 às $3')
    .replace(/\bQuar\b/g, 'Qua')
    .replace(/\bSext\b/g, 'Sex')
    .replace(/\bSab\b/g, 'Sáb');
}

// Returns { places, invalid, stale, missing } for one layer's rows. Hidden rows (Visível or Mostrar no
// Mapa false) are left out silently; rows without a name, without coordinates or without a review date
// are reported (invalid: { line, reason: 'name' | 'coords' | 'review' }); a row whose last review is
// older than MAP_REVIEW_MONTHS is left out and listed in `stale` ({ line, name, reviewed }), for the
// team. `missing` names the required columns the sheet lacks.
export function buildPlaces(layer, headers, records, lines = [], now = new Date()) {
  const col = columnMap(headers);
  const missing = [['name', 'Nome'], ['coords', 'Coordenadas']].filter(([field]) => !col[field]).map(([, name]) => name);
  if (missing.length) return { places: [], invalid: [], stale: [], missing };
  const get = (record, field) => (col[field] ? (record[col[field]] || '').trim() : '');
  const taken = new Map();
  const places = [];
  const invalid = [];
  const stale = [];

  records.forEach((record, index) => {
    if (isHidden(get(record, 'visible'))) return;
    const line = lines[index] ?? index + 2;
    const name = get(record, 'name').replace(/\s+/g, ' ');
    if (!name) return void invalid.push({ line, reason: 'name' });
    const lngLat = readCoords(get(record, 'coords'));
    if (!lngLat) return void invalid.push({ line, reason: 'coords' });
    const reviewed = reviewDay(get(record, 'reviewed'));
    if (!reviewed) return void invalid.push({ line, reason: 'review' });
    if (isStale(reviewed, MAP_REVIEW_MONTHS, now)) return void stale.push({ line, name, reviewed });

    const { street, bairro } = splitAddress(get(record, 'address'));
    const place = get(record, 'place').replace(/\s+/g, ' ');
    const contact = get(record, 'contact');
    const phones = phonesIn(contact);
    const instagram = readInstagram(get(record, 'instagram'));
    const when = get(record, 'when').split(';').map((s) => tidyTimes(s.trim())).filter(Boolean);
    // The id names the place for links (mapa.html#<id>): the layer, the name and the place, without
    // saying the name twice when the place starts with it ("UFGD – Unidade I", "UFGD Unidade I (CEUD)").
    const nameSlug = slugify(name);
    const placeSlug = slugify(place);
    const tail = !placeSlug || placeSlug === nameSlug ? nameSlug : placeSlug.startsWith(nameSlug) ? placeSlug : `${nameSlug}-${placeSlug}`;
    const base = `${layer.id}-${tail || 'lugar'}`;
    const n = (taken.get(base) || 0) + 1;
    taken.set(base, n);

    places.push({
      id: n === 1 ? base : `${base}-${n}`,
      layer,
      line,
      name,
      place: place && place !== name ? place : '',
      address: street,
      bairro: get(record, 'bairro') || bairro || bairroOfPlusCode(get(record, 'plusCode')),
      lngLat,
      when,
      who: get(record, 'who'),
      description: get(record, 'description'),
      phones,
      // A number the site can't dial (no area code, an old 8-digit mobile) stays as it was typed.
      contactNote: !phones.length && contact ? contact : '',
      instagram,
      instagramHref: instagram ? instagramUrl(instagram) : '',
      link: get(record, 'link'),
      source: get(record, 'source'),
      reviewed,
    });
  });
  return { places, invalid, stale, missing: [] };
}
