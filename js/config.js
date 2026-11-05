// Site settings — the only file most people need to touch.

// Where the agenda is read from: a folder of the site with one CSV per month, AAAA-MM.csv, holding the
// activities that start in that month (by "Dia"; drafts still without a date wait, hidden, in
// sem-data.csv), and the index.json the pre-commit hook writes from them (tools/agenda-data.mjs). The
// pages read only the months they show (js/agenda-source.js).
export const AGENDA_DIR = 'data/agenda/';

// Where Comércio (comercio.html) reads the businesses from: the answers of the registration form,
// as they are, copied into the file by the NOS team, plus an optional "Categoria" column they keep.
// (No published Google Sheets: the site's CSVs are files of this repository.)
export const COMMERCE_CSV_URL = 'data/comercio.csv';

// The registration form's public link, for "Cadastrar meu negócio" on Comércio. Empty hides the
// invitation.
export const COMMERCE_FORM_URL = '';

// Suggested categories of the "Categoria" column, in the order of the chips; others follow in
// alphabetical order. Free text: any name the sheet uses becomes a chip.
export const COMMERCE_CATEGORIES = ['Comida', 'Serviços', 'Celular e informática', 'Beleza', 'Arte e presentes', 'Casa', 'Embalagens'];

// Provisional name: NOS = Núcleo de Organização Social.
export const APP_NAME = 'NOS';
export const APP_FULL_NAME = 'Núcleo de Organização Social';

// The city the calendar is about. Rows with an empty "Cidade" (or this city) happen here;
// any other city is shown next to the activity.
export const CITY = 'Dourados/MS';
export const HOME_CITY = 'Dourados';

// Public address of the site, added to the end of every WhatsApp message (with the page's file:
// agenda.html, comercio.html). The og:url/og:image/canonical tags of the three pages use the
// same address.
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
};

// Sector colours: each suggested "Setor" of the spreadsheet (the eight groups of the
// organizations survey) keeps the same colour, whatever else is in the sheet. The numbers point
// to --role-series-1 … 8 in css/theme.css; a sector not listed here borrows the series of a
// listed sector absent from the sheet (see js/colors.js).
export const SECTOR_SERIES = {
  'Sindicatos': 1,
  'Rural, indígena, luta pela terra': 2,
  'Movimentos Sociais': 3,
  'Academia e Movimento Estudantil': 4,
  'Órgãos do Estado': 5,
  'Partidos': 6,
  'Outros': 7,
  'Terceiro Setor': 8,
};
