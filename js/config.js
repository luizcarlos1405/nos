// Site settings — the only file most people need to touch.

// Where the agenda is read from: a folder of the site with one CSV per month, AAAA-MM.csv, holding the
// activities that start in that month (by "Dia"; drafts still without a date wait, hidden, in
// sem-data.csv), and the index.json the pre-commit hook writes from them (tools/month-files.mjs). The
// pages read only the months they show (js/month-files.js).
export const AGENDA_DIR = 'data/agenda/';

// Where the news (noticias.html) is read from: a folder like AGENDA_DIR, one CSV per month, AAAA-MM.csv,
// with the news of that month (by "Data"; drafts still without a date wait, hidden, in sem-data.csv),
// and its index.json, written by the same hook (tools/month-files.mjs). js/news.js reads the rows.
export const NEWS_DIR = 'data/noticias/';

// Every folder of month files the site has: the offline worker saves them (js/page.js registerWorker),
// and the hook checks them and writes their index (tools/month-files.mjs, which also needs each one's
// builder in tools/folders.mjs).
export const MONTH_FOLDERS = [AGENDA_DIR, NEWS_DIR];

// The kinds of news (the "Tipo" column), in the order of the chips, with the chips' plural. Another
// kind written in the sheet still shows, its chip after these. Accents and case don't matter.
export const NEWS_KINDS = [
  { name: 'Conquista', plural: 'Conquistas' },
  { name: 'Perda', plural: 'Perdas' },
  { name: 'Alerta', plural: 'Alertas' },
  { name: 'Informe', plural: 'Informes' },
];

// Editais (editais.html, a tab of its own since 2026-11-22): calls, prizes and grants with money for
// culture, sport and leisure, a row each in one file, with only the essentials (the deadline, how much,
// who can apply, the call and its official page). js/calls.js reads the rows and places each call by its dates:
// the open ones by deadline, the ones opening soon, the ones closed within CALLS_CLOSED_DAYS, and the
// announced ones still without a date.
export const CALLS_CSV_URL = 'data/editais.csv';

// How many days a call stays under "Fecharam há pouco" after its last day of registration. Past that it
// leaves the page by itself; its row stays in the file.
export const CALLS_CLOSED_DAYS = 30;

// The areas of the "Área" column, in the order of the chips. Another area written in the sheet still
// shows, its chip after these. Accents and case don't matter.
export const CALL_AREAS = ['Cultura', 'Esporte e lazer'];

// The link of "Mande para o NOS" under the list of calls (a form or a WhatsApp). Empty hides the
// invitation, as MAP_SUGGEST_URL does on the Mapa.
export const CALLS_SUGGEST_URL = '';

// How long, in months, a row of the Mapa stays on the site without a review: the date in its "Última
// revisão" column. Past that, the page leaves it out by itself (js/review.js) until someone confirms it
// with the place or its source and writes the new date. A year: the cycle groups and their schedules
// follow (classes restart, projects are funded by yearly calls), and the reviews of the Mapa da Capoeira
// are spread over the year (six months would drop six of its 18 places at once). The agenda, the news
// and the calls need none: their rows age by their own dates.
export const MAP_REVIEW_MONTHS = 12;

// The Mapa (mapa.html): one CSV per layer, in this order on the chips and in the list. `icon` names the
// layer's drawing (js/icons.js), the same on its points; `one`, a place of it ("Feira"); `credit`, who
// surveys and checks the layer, said with its places. The capoeira layer is the Mapa da Capoeira's sheet
// (COMAFRO Dourados) with its columns as they are; the other layers share the columns of js/places.js.
export const MAP_LAYERS = [
  { id: 'capoeira', name: 'Capoeira', one: 'Capoeira', file: 'data/mapa/capoeira.csv', icon: 'berimbau', credit: 'COMAFRO Dourados' },
  { id: 'batalhas', name: 'Batalhas de rima', one: 'Batalha de rima', file: 'data/mapa/batalhas.csv', icon: 'mic-vocal' },
  { id: 'feiras', name: 'Feiras', one: 'Feira', file: 'data/mapa/feiras.csv', icon: 'shopping-basket' },
  { id: 'cultura', name: 'Espaços culturais', one: 'Espaço cultural', file: 'data/mapa/cultura.csv', icon: 'drama' },
  { id: 'sindicatos', name: 'Sindicatos', one: 'Sindicato', file: 'data/mapa/sindicatos.csv', icon: 'megaphone' },
  { id: 'universidades', name: 'Universidades', one: 'Universidade', file: 'data/mapa/universidades.csv', icon: 'graduation-cap' },
  { id: 'poder-publico', name: 'Poder público', one: 'Poder público', file: 'data/mapa/poder-publico.csv', icon: 'landmark' },
];

// Places kept off the Mapa, by id (js/places.js), with the reason, without touching their sheet (COMAFRO's
// stays as they keep it): an aldeia, a retomada, a terreiro, the quilombo, a camp or a home goes on the
// map only by the NOS team's decision. Removing a line puts the place back. Empty since 2026-11-11, when
// the team kept the AJI's capoeira training in the Aldeia Bororó and the Templo Girassol on the map.
export const MAP_HELD = {};

// Where "Falta algum lugar?" leads, on the Mapa (a form or a contact of the NOS team for places missing
// from the map). Empty hides the invitation.
export const MAP_SUGGEST_URL = '';

// The map's tiles: OpenStreetMap's data as free vector tiles from OpenFreeMap (no key, no limit on
// views), and the letters of their labels. js/map-style.js paints them in the site's colours.
export const MAP_TILES = 'https://tiles.openfreemap.org/planet';
export const MAP_GLYPHS = 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf';

// Provisional name: NOS = Núcleo de Organização Social.
export const APP_NAME = 'NOS';
export const APP_FULL_NAME = 'Núcleo de Organização Social';

// The city the calendar is about. Rows with an empty "Cidade" (or this city) happen here;
// any other city is shown next to the activity.
export const CITY = 'Dourados/MS';
export const HOME_CITY = 'Dourados';

// Public address of the site, added to the end of every WhatsApp message (with the page's address, its
// file without the extension, as GitHub Pages serves it: /agenda, /noticias, /editais, /mapa#<id>). The
// og:url/og:image/canonical tags of every page use the same address.
export const SITE_URL = 'https://nos.dourados.social';

// The agenda's time zone (Dourados: UTC−4, no daylight saving): the hours an activity takes in the
// person's own calendar ("Salvar na minha agenda").
export const TIME_ZONE = 'America/Campo_Grande';

// The whole agenda as a calendar people subscribe to ("Salvar tudo na agenda"), published at
// SITE_URL/FEED_FILE. tools/agenda-ics.mjs writes it from every month of AGENDA_DIR, and the
// pre-commit hook runs it on every commit (.githooks/pre-commit).
export const FEED_FILE = 'agenda.ics';

// Types ("Tipo" column) that have no time of their own: a deadline, an enrolment or consultation
// period, a collection campaign. Without a time they show none, where any other one-day activity
// reads "Horário a confirmar" (a period of several days never does). Accents, case and punctuation
// don't matter.
export const UNTIMED_TYPES = ['Prazo', 'Campanha'];

// Local holidays printed in red besides the national ones (js/holidays.js),
// e.g. { month: 6, day: 24, name: 'São João', short: 'São João' }.
export const EXTRA_HOLIDAYS = [];

// Full names of the organizations, shown next to the acronyms in the activity panel and the
// organization filter so people outside the movements know who is who. Keys are written as in
// the spreadsheet's "Organização" column (accents, case and punctuation don't matter). Names come
// from the organizations' own profiles (the Instagram survey kept outside this repository); add new ones the same way.
export const ORG_NAMES = {
  'SIMTED': 'Sindicato Municipal dos Trabalhadores e Trabalhadoras em Educação de Dourados',
  'SINTEF': 'Sindicato dos Trabalhadores em Educação das Instituições Federais',
  'ADUF Dourados': 'Associação de Docentes da UFGD',
  'APG UFGD': 'Associação de Pós-Graduandos da UFGD',
  'DCE UFGD': 'Diretório Central dos e das Estudantes da UFGD',
  'COMAFRO': 'Conselho Municipal de Defesa e Desenvolvimento dos Direitos Afro-brasileiros de Dourados',
  'MST': 'Movimento dos Trabalhadores Rurais Sem Terra',
  'PCdoB': 'Partido Comunista do Brasil',
  'UP': 'Unidade Popular pelo Socialismo',
  'UDAM': 'União Douradense de Associação de Moradores',
  'Aty Guasu': 'Grande Assembleia do Povo Guarani e Kaiowá',
  'UFGD': 'Universidade Federal da Grande Dourados',
  'Kuñangue Aty Guasu': 'Grande Assembleia das Mulheres Kaiowá e Guarani',
  'NEAB UFGD': 'Núcleo de Estudos Afro-Brasileiros da UFGD',
  'DAC UFGD': 'Diretoria de Arte e Cultura da UFGD',
  'LADIP': 'Liga Acadêmica de Direitos dos Povos Indígenas e Políticos da UFGD',
  'ADUEMS': 'Sindicato dos Docentes da UEMS',
  'DCE UEMS': 'Diretório Central dos e das Estudantes da UEMS',
  'Seeb Dourados': 'Sindicato dos Bancários e Trabalhadores do Ramo Financeiro de Dourados e Região',
  'SEMC': 'Secretaria Municipal de Cultura de Dourados',
  'FUNED': 'Fundação de Esportes de Dourados',
  'FCMS': 'Fundação de Cultura de Mato Grosso do Sul',
  'Funarte': 'Fundação Nacional de Artes',
};

// Sector colours: each suggested "Setor" of the spreadsheet (the nine groups of the
// organizations survey; Feiras, the ninth, since 2026-11-18) keeps the same colour, whatever else
// is in the sheet. The numbers point to --role-series-1 … 9 in css/theme.css, and the keys' order
// is the chips' order; a sector not listed here borrows the series of a listed sector absent from
// the sheet (see js/colors.js).
export const SECTOR_SERIES = {
  'Sindicatos': 1,
  'Rural, indígena, luta pela terra': 2,
  'Movimentos Sociais': 3,
  'Academia e Movimento Estudantil': 4,
  'Órgãos do Estado': 5,
  'Partidos': 6,
  'Feiras': 9,
  'Outros': 7,
  'Terceiro Setor': 8,
};
