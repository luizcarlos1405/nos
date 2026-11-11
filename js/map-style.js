// The map of Dourados painted in Céu · Terra: a MapLibre style over OpenFreeMap's vector tiles
// (OpenStreetMap's data; MAP_TILES and MAP_GLYPHS in js/config.js). The land is the page's land, clay by
// day and terra roxa at night; the built city a lighter shade of it; the parks a sage; the water the
// sky's blue (the night sky's indigo at night); the roads the cards' colour; the labels the soft ink.
// No point of interest of the tiles is drawn: the map's points are the Mapa's own (js/mapa.js).
//
// The colours are the --role-map-* roles of css/theme.css, read when the style is built, so the theme
// decides them as everywhere else (js/mapa.js builds it again when the theme changes). MapLibre reads no
// CSS: buildStyle() turns the roles into a plain style object.

import { MAP_GLYPHS, MAP_TILES } from './config.js';

const ROLES = ['land', 'city', 'green', 'water', 'river', 'road', 'road-casing', 'street', 'building',
  'label', 'label-strong', 'halo', 'indigena', 'indigena-line'];

export function mapColours(el = document.documentElement) {
  const css = getComputedStyle(el);
  return Object.fromEntries(ROLES.map((r) => [r, css.getPropertyValue(`--role-map-${r}`).trim()]));
}

const isPolygon = ['match', ['geometry-type'], ['MultiPolygon', 'Polygon'], true, false];
const isLine = ['match', ['geometry-type'], ['LineString', 'MultiLineString'], true, false];
const notTunnel = ['!=', ['get', 'brunnel'], 'tunnel'];
const name = ['coalesce', ['get', 'name:pt'], ['get', 'name']];
// The Indigenous lands come in the tiles' "park" layer, as nature reserves. They are where people live
// (the Reserva Indígena de Dourados: the Jaguapiru and Bororó villages, Kaiowá, Guarani Ñandeva and
// Terena), so they are drawn as inhabited land with their boundary and their name, never as a park.
const isIndigenous = ['in', 'Indígena', ['coalesce', ['get', 'name'], '']];

// A size by zoom: zoom, size, zoom, size…
const byZoom = (...stops) => ['interpolate', ['exponential', 1.6], ['zoom'], ...stops];
// Two kinds of road: [zoom, the major roads' width, the others'], …
const byZoomFor = (isMajor, ...stops) => ['interpolate', ['exponential', 1.6], ['zoom'],
  ...stops.flatMap(([z, a, b]) => [z, ['case', isMajor, a, b]])];

export function buildStyle(c = mapColours()) {
  const major = ['match', ['get', 'class'], ['primary', 'secondary', 'trunk', 'motorway'], true, false];
  const middle = ['match', ['get', 'class'], ['tertiary'], true, false];
  const minor = ['match', ['get', 'class'], ['minor', 'service', 'track'], true, false];
  const halo = (w) => ({ 'text-halo-color': c.halo, 'text-halo-width': w });
  return {
    version: 8,
    name: 'NOS Dourados · Céu · Terra',
    glyphs: MAP_GLYPHS,
    sources: { openmaptiles: { type: 'vector', url: MAP_TILES, attribution: '' } },
    layers: [
      { id: 'land', type: 'background', paint: { 'background-color': c.land } },
      { id: 'city', type: 'fill', source: 'openmaptiles', 'source-layer': 'landuse',
        filter: ['all', isPolygon, ['match', ['get', 'class'],
          ['residential', 'suburb', 'quarter', 'neighbourhood', 'commercial', 'retail', 'industrial', 'school',
           'university', 'college', 'hospital', 'railway', 'stadium', 'cemetery', 'garages', 'religious'], true, false]],
        paint: { 'fill-color': c.city } },
      { id: 'green', type: 'fill', source: 'openmaptiles', 'source-layer': 'landcover',
        filter: ['all', isPolygon, ['match', ['get', 'class'], ['wood', 'grass'], true, false]],
        paint: { 'fill-color': c.green, 'fill-opacity': ['match', ['get', 'class'], 'wood', 1, 0.7] } },
      { id: 'park', type: 'fill', source: 'openmaptiles', 'source-layer': 'park',
        filter: ['all', isPolygon, ['!', isIndigenous]], paint: { 'fill-color': c.green } },
      { id: 'indigena', type: 'fill', source: 'openmaptiles', 'source-layer': 'park',
        filter: ['all', isPolygon, isIndigenous], paint: { 'fill-color': c.indigena } },
      { id: 'indigena-line', type: 'line', source: 'openmaptiles', 'source-layer': 'park',
        filter: ['all', isPolygon, isIndigenous],
        paint: { 'line-color': c['indigena-line'], 'line-width': byZoom(10, 0.8, 14, 1.6), 'line-dasharray': [3, 2] } },
      { id: 'pitch', type: 'fill', source: 'openmaptiles', 'source-layer': 'landuse',
        filter: ['all', isPolygon, ['match', ['get', 'class'], ['pitch', 'playground'], true, false]],
        paint: { 'fill-color': c.green, 'fill-opacity': 0.8 } },
      { id: 'water', type: 'fill', source: 'openmaptiles', 'source-layer': 'water',
        filter: ['all', isPolygon, notTunnel], paint: { 'fill-color': c.water } },
      { id: 'river', type: 'line', source: 'openmaptiles', 'source-layer': 'waterway', filter: isLine,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': c.river, 'line-width': byZoom(10, 0.6, 14, 1.6, 17, 4) } },
      { id: 'building', type: 'fill', source: 'openmaptiles', 'source-layer': 'building', minzoom: 14.5,
        paint: { 'fill-color': c.building, 'fill-opacity': ['interpolate', ['linear'], ['zoom'], 14.5, 0, 15.5, 1] } },
      { id: 'runway', type: 'line', source: 'openmaptiles', 'source-layer': 'aeroway', minzoom: 11,
        filter: ['all', isLine, ['==', ['get', 'class'], 'runway']],
        paint: { 'line-color': c.street, 'line-width': byZoom(11, 2, 15, 18) } },
      // Streets: the city's grid as a texture from afar, real streets close up.
      { id: 'street', type: 'line', source: 'openmaptiles', 'source-layer': 'transportation', minzoom: 11,
        filter: ['all', isLine, minor, notTunnel],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': c.street, 'line-width': byZoom(11, 0.35, 13, 0.9, 15, 3.5, 17, 10),
          'line-opacity': ['interpolate', ['linear'], ['zoom'], 11, 0.6, 13, 1] } },
      { id: 'road-casing', type: 'line', source: 'openmaptiles', 'source-layer': 'transportation', minzoom: 11,
        filter: ['all', isLine, ['any', major, middle], notTunnel],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': c['road-casing'],
          'line-width': byZoomFor(major, [11, 2.2, 1.5], [13, 4, 2.8], [15, 10, 7], [17, 22, 15]) } },
      { id: 'road', type: 'line', source: 'openmaptiles', 'source-layer': 'transportation',
        filter: ['all', isLine, ['any', major, middle], notTunnel],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': c.road,
          'line-width': byZoomFor(major, [9, 0.6, 0.4], [11, 1.2, 0.8], [13, 2.6, 1.8], [15, 7.5, 5.2], [17, 18, 12.5]) } },
      { id: 'water-name', type: 'symbol', source: 'openmaptiles', 'source-layer': 'water_name', minzoom: 13,
        layout: { 'text-field': name, 'text-font': ['Noto Sans Italic'], 'text-size': 11 },
        paint: { 'text-color': c.label, ...halo(1.4) } },
      { id: 'road-name', type: 'symbol', source: 'openmaptiles', 'source-layer': 'transportation_name', minzoom: 13.5,
        filter: ['match', ['get', 'class'], ['primary', 'secondary', 'tertiary', 'trunk'], true, false],
        layout: { 'text-field': name, 'text-font': ['Noto Sans Regular'], 'symbol-placement': 'line',
          'text-size': byZoom(13.5, 10, 17, 13), 'text-letter-spacing': 0.02 },
        paint: { 'text-color': c.label, ...halo(1.6) } },
      { id: 'street-name', type: 'symbol', source: 'openmaptiles', 'source-layer': 'transportation_name', minzoom: 15.5,
        filter: ['match', ['get', 'class'], ['minor', 'service'], true, false],
        layout: { 'text-field': name, 'text-font': ['Noto Sans Regular'], 'symbol-placement': 'line', 'text-size': 11 },
        paint: { 'text-color': c.label, ...halo(1.4) } },
      { id: 'indigena-name', type: 'symbol', source: 'openmaptiles', 'source-layer': 'place',
        filter: ['==', ['get', 'class'], 'aboriginal_lands'],
        layout: { 'text-field': name, 'text-font': ['Noto Sans Italic'], 'text-size': byZoom(10, 11, 14, 14),
          'text-max-width': 9, 'text-letter-spacing': 0.02 },
        paint: { 'text-color': c['label-strong'], ...halo(1.8) } },
      // The neighbourhoods: how people in Dourados say where things are.
      { id: 'bairro', type: 'symbol', source: 'openmaptiles', 'source-layer': 'place', minzoom: 11.5,
        filter: ['match', ['get', 'class'], ['suburb', 'neighbourhood', 'quarter'], true, false],
        layout: { 'text-field': name, 'text-font': ['Noto Sans Regular'], 'text-size': byZoom(11.5, 10, 15, 13),
          'text-max-width': 7, 'text-letter-spacing': 0.01, 'text-padding': 6 },
        paint: { 'text-color': c.label, ...halo(1.6),
          'text-opacity': ['interpolate', ['linear'], ['zoom'], 11.5, 0.75, 13, 1] } },
    ],
  };
}
