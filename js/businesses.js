// Turns the answers of the registration form (one row per business, the sheet behind COMMERCE_CSV_URL)
// into business objects for Comércio. The form's questions are free text, so this reads them
// loosely: it finds the phone numbers in "Como podemos entrar em contato?", the Instagram handle in
// whatever was typed (a link, "@handle", "handle"), the links of "Sua empresa tem site ou outra rede
// social?", and drops the answers that only say yes or no. Nothing is invented: what can't be
// read is shown as the business wrote it.

import { CITY, COMMERCE_CATEGORIES, HOME_CITY } from './config.js';
import { isChecked, isHidden, matchKey, normalizeKey, slugify } from './events.js';

// The form's questions, matched by a word they contain (accents and case don't count), checked in
// this order: "Como podemos entrar em contato?" must reach contact before "podemos" means
// anything, and "Podemos incluir … compartilhar … com a rede?" must not read as "outra rede social".
const COLUMNS = [
  ['consent', /incluir|compartilh|autoriz|consent/],
  ['visible', /^(?:visivel|mostrar|publicar|visible)$/],
  ['notes', /^notas/],
  ['contact', /contato|whats|telefone|celular|fone|contact|phone/],
  ['instagram', /instagram/],
  ['other', /site|rede social|redes sociais|outras redes|other/],
  ['category', /categoria|ramo|segmento|setor|category/],
  ['address', /endereco|address/],
  ['city', /cidade|municipio|city/],
  ['offer', /oferece|produto|servico|descricao|o que|offer|description/],
  ['name', /nome|empresa|negocio|name/],
];

function buildColumnMap(headers) {
  const map = {};
  for (const header of headers) {
    const key = normalizeKey(header).replace(/_/g, ' ');
    if (!key) continue;
    const found = COLUMNS.find(([field, pattern]) => !map[field] && pattern.test(key));
    if (found) map[found[0]] = header;
  }
  return map;
}

// Accents, case and punctuation off, for comparisons and search.
const plain = (text) => normalizeKey(text || '').replace(/[^a-z0-9@.]+/g, ' ').trim();

// "Não", "nao!", "AINDA NÃO", "Por enquanto não", "Não. Apenas o app interno": the business has none.
const NO_ANSWER = /^(?:nao|ainda nao|por enquanto nao|nenhum|nenhuma|sem|n a|x)(?:\s|$)/;
const isNo = (text) => !plain(text) || NO_ANSWER.test(plain(text).replace(/[.!]/g, ' ').trim());

// A contact answer that says nothing: "Sim", "Não".
const isYesNo = (text) => /^(?:sim|nao|s|n|ok)$/.test(plain(text).replace(/[.!]/g, '').trim());

// ---------- Names ----------

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// "Sal da Terra - Mini Padaria Artesanal" → name and subtitle; "Luciana Gonçalves (Bolos e pães
// artesanais)" too. The name is printed in capitals, so its typed case doesn't matter there.
function splitName(raw) {
  const text = raw.replace(/\s+/g, ' ').trim();
  let match = text.match(/^(.+?)\s+[-–—]\s+(.+)$/);
  if (match) return { name: match[1], subtitle: capitalize(match[2]) };
  match = text.match(/^(.+?)\s*\(([^()]+)\)$/);
  if (match) return { name: match[1], subtitle: capitalize(match[2]) };
  return { name: text, subtitle: '' };
}

// The letter of the sheet a business goes on: its name's first letter without the accent ("Ébano" → E);
// names starting with a digit or a sign go on "#".
function letterOf(name) {
  const first = normalizeKey(name).replace(/[^a-z0-9]/g, '').charAt(0).toUpperCase();
  return /[A-Z]/.test(first) ? first : '#';
}

// A text typed all in capitals ("IMPRESSOS") reads as shouting in a paragraph: it gets sentence case.
function calmCase(text) {
  const t = text.replace(/\s+/g, ' ').trim();
  return t.length > 3 && /\p{Lu}/u.test(t) && !/\p{Ll}/u.test(t) ? capitalize(t.toLowerCase()) : t;
}

// ---------- City ----------

const STATES = new Set(['ac', 'al', 'ap', 'am', 'ba', 'ce', 'df', 'es', 'go', 'ma', 'mt', 'ms', 'mg', 'pa', 'pb', 'pr', 'pe', 'pi', 'rj', 'rn', 'rs', 'ro', 'rr', 'sc', 'sp', 'se', 'to']);
const SMALL_WORDS = new Set(['de', 'da', 'do', 'das', 'dos', 'e']);

// "Fátima do sul - ms" → "Fátima do Sul"; the home city (with or without its state) → '' (here).
// Another state stays written after the city: "Ponta Porã" in MS, "Guaíra/PR" outside it. Several
// cities ("Dourados- Ponta Porã") are joined with "e"; a state alone ("MS") stays as the state.
function cityOf(raw) {
  let text = (raw || '').replace(/\s+/g, ' ').trim();
  let state = '';
  const match = text.match(/^(.*?)[\s/,–-]+([A-Za-z]{2})\.?$/);
  if (match && STATES.has(match[2].toLowerCase())) {
    text = match[1].replace(/[\s/,–-]+$/, '');
    state = match[2].toUpperCase();
  } else if (STATES.has(text.replace(/\.$/, '').toLowerCase())) {
    return text.replace(/\.$/, '').toUpperCase();
  }
  const cities = text.split(/\s*[/,–-]\s*|\s+e\s+/).filter(Boolean);
  if (!cities.length || cities.every((city) => matchKey(city) === matchKey(HOME_CITY))) return '';
  const name = cities.map((city) => city.toLowerCase().split(' ').map((word, i) => (i > 0 && SMALL_WORDS.has(word) ? word : capitalize(word))).join(' ')).join(' e ');
  return state && state !== 'MS' ? `${name}/${state}` : name;
}

// A street address as a Google Maps search, in the business's city (or Dourados/MS).
const mapsUrl = (address, city) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${address}, ${city || CITY}`)}`;

// ---------- Phones ----------

// Runs of digits with the usual separators: "(67) 9 9321-8675", "67-98126-1500", "67 998442462".
const PHONE_RUN = /\+?\(?\d[\d\s().-]{6,}\d/g;

// Brazilian numbers with their area code: 11 digits for mobiles (DDD + 9 + 8), 10 for landlines.
// A number without the area code can't be dialled from WhatsApp, so it stays as text.
function readPhone(run) {
  let digits = run.replace(/\D/g, '');
  if (digits.length >= 12 && digits.startsWith('55')) digits = digits.slice(2);
  if (digits.length >= 11 && digits.startsWith('0')) digits = digits.slice(1);
  const ddd = digits.slice(0, 2);
  if (!/^[1-9][1-9]$/.test(ddd)) return null;
  if (digits.length === 11 && digits[2] === '9') return { digits, mobile: true, label: `(${ddd}) ${digits.slice(2, 7)}-${digits.slice(7)}` };
  if (digits.length === 10 && /[2-8]/.test(digits[2])) return { digits, mobile: false, label: `(${ddd}) ${digits.slice(2, 6)}-${digits.slice(6)}` };
  return null;
}

function phonesIn(text) {
  const phones = [];
  for (const [run] of (text || '').matchAll(PHONE_RUN)) {
    const phone = readPhone(run);
    if (phone && !phones.some((p) => p.digits === phone.digits)) phones.push(phone);
  }
  return phones;
}

// ---------- Instagram and links ----------

const HANDLE = /^[a-z0-9._]{1,30}$/;

// "@renatadeol", "apiarioboavistadouradosms", "https://www.instagram.com/arecosburger?vrfl=…".
// Instagram names have no accents, so "Katiaboticário67" is read as katiaboticario67. A bare word
// that answers the question instead of naming a profile ("Sim", "Instagram") is not a handle.
function readInstagram(raw) {
  const text = (raw || '').trim();
  const url = text.match(/instagram\.com\/([^/?#\s]+)/i);
  const candidate = (url ? url[1] : text.replace(/^@/, '')).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  if (!url && !text.startsWith('@') && CHANNEL_WORDS.has(candidate)) return null;
  return HANDLE.test(candidate) && /[a-z]/.test(candidate) ? candidate : null;
}

const instagramUrl = (handle) => `https://www.instagram.com/${handle}/`;

const URLS = /(?:https?:\/\/|www\.)[^\s,;]+/gi;

// What a link is, by its address: Google (a business profile or map), Facebook, TikTok, Instagram,
// WhatsApp, or a site, named by its domain.
function describeLink(url) {
  let parsed;
  try {
    parsed = new URL(/^https?:/i.test(url) ? url : `https://${url}`);
  } catch {
    return null;
  }
  if (!/^https?:$/.test(parsed.protocol)) return null;
  const host = parsed.hostname.replace(/^www\./, '');
  const href = parsed.href;
  if (/(?:^|\.)share\.google$|^g\.page$|^maps\.app\.goo\.gl$|^goo\.gl$|^g\.co$|^business\.google\.com$|^google\.[a-z.]+$/.test(host)) return { label: 'Google', text: 'Ver no Google', href };
  if (/(?:^|\.)(?:facebook|fb)\.com$|^fb\.me$/.test(host)) return { label: 'Facebook', text: 'Ver no Facebook', href };
  if (/(?:^|\.)tiktok\.com$/.test(host)) {
    const handle = parsed.pathname.match(/^\/@([^/]+)/);
    return { label: 'TikTok', text: handle ? `@${handle[1]}` : 'Ver no TikTok', href };
  }
  if (/(?:^|\.)instagram\.com$/.test(host)) return { label: 'Instagram', instagram: readInstagram(href), href };
  if (/^wa\.me$|(?:^|\.)whatsapp\.com$/.test(host)) return { label: 'WhatsApp', phone: readPhone(parsed.pathname + parsed.search), href };
  return { label: 'Site', text: host, href };
}

// Words that only name what is already shown (or say yes, no, only): "Instagram", "Apenas whatsapp e
// Instagram". An answer made only of them adds nothing to the contacts.
const CHANNEL_WORDS = new Set(['sim', 'nao', 'apenas', 'somente', 'so', 'e', 'ou', 'o', 'a', 'os', 'as', 'de', 'do', 'da', 'no', 'na', 'pelo', 'pela', 'por', 'mesmo', 'mesmos', 'mesma', 'mesmas', 'tem', 'temos', 'instagram', 'insta', 'ig', 'whatsapp', 'whats', 'watts', 'wpp', 'zap', 'zapzap', 'direct', 'dm', 'tambem', 'ate', 'agora', 'enquanto', 'ainda']);
const saysNothingNew = (text) => plain(text).replace(/[@.]/g, ' ').split(/\s+/).filter(Boolean).every((word) => CHANNEL_WORDS.has(word));

// "Sim, instagram e tiktok, mesmos @" → "Instagram e tiktok, mesmos @".
const withoutYes = (text) => capitalize(text.trim().replace(/^sim\b[\s,.:;!-]*/i, '').trim());

// ---------- Categories ----------

const CATEGORY_ORDER = COMMERCE_CATEGORIES.map(matchKey);
const CATEGORY_NAMES = new Map(COMMERCE_CATEGORIES.map((name) => [matchKey(name), name]));
const collator = new Intl.Collator('pt-BR', { sensitivity: 'base', numeric: true });

function categoryRank(category) {
  const i = CATEGORY_ORDER.indexOf(matchKey(category));
  return i === -1 ? CATEGORY_ORDER.length : i;
}

// The categories in use, once each: the suggested ones in their order, then the others alphabetically.
export function categoriesOf(businesses) {
  const seen = new Map();
  for (const biz of businesses) if (biz.category && !seen.has(matchKey(biz.category))) seen.set(matchKey(biz.category), biz.category);
  return [...seen.values()].sort((a, b) => categoryRank(a) - categoryRank(b) || collator.compare(a, b));
}

// ---------- Search ----------

// Every word typed must appear somewhere in the business (accents and case don't count).
export function matchesSearch(biz, query) {
  const words = plain(query).split(' ').filter(Boolean);
  return words.every((word) => biz.search.includes(word));
}

// ---------- Rows → businesses ----------

// Returns { businesses, invalid, missing }. Rows without the business's consent ("Podemos incluir…?"
// answered anything but yes) and rows marked not visible are left out silently; rows without a name
// are reported (invalid: { line }). `missing` names the required column when the sheet lacks it.
// Businesses come sorted by name, as the phone book prints them.
export function buildBusinesses(headers, records, lines = []) {
  const col = buildColumnMap(headers);
  if (!col.name) return { businesses: [], invalid: [], missing: ['Nome da empresa ou negócio'] };
  const get = (record, field) => (col[field] ? (record[col[field]] || '').trim() : '');
  const taken = new Map();
  const businesses = [];
  const invalid = [];

  records.forEach((record, index) => {
    if (col.consent && !isChecked(get(record, 'consent'))) return;
    if (isHidden(get(record, 'visible'))) return;
    const line = lines[index] ?? index + 2;
    const rawName = get(record, 'name');
    if (!rawName) {
      invalid.push({ line });
      return;
    }

    const { name, subtitle } = splitName(rawName);
    const base = `biz-${slugify(name) || 'negocio'}`;
    const n = (taken.get(base) || 0) + 1;
    taken.set(base, n);

    // Contact: its numbers become WhatsApp (mobile) or phone rows. Without a number, the answer is
    // printed as written ("99 food", "Instagram dm"), unless it only says yes or no.
    const contactRaw = get(record, 'contact');
    const phones = phonesIn(contactRaw);
    const contactNote = !phones.length && !isNo(contactRaw) && !isYesNo(contactRaw) ? contactRaw.replace(/\s+/g, ' ') : '';

    // Instagram: a readable handle becomes a link; anything else is printed as written.
    const instagramRaw = get(record, 'instagram');
    const instagram = isNo(instagramRaw) ? null : readInstagram(instagramRaw);
    const instagramNote = !instagram && !isNo(instagramRaw) ? instagramRaw.replace(/\s+/g, ' ') : '';

    // Other networks: links are read by their address; the rest is printed as written unless it
    // only names what is already shown ("Instagram", "Apenas whatsapp e Instagram") or says no.
    const otherRaw = get(record, 'other');
    const links = [];
    let otherNote = '';
    if (!isNo(otherRaw)) {
      for (const [url] of otherRaw.matchAll(URLS)) {
        const link = describeLink(url.replace(/[.)]+$/, ''));
        if (!link) continue;
        if (link.label === 'Instagram') {
          if (link.instagram && link.instagram !== instagram) links.push({ label: 'Instagram', text: `@${link.instagram}`, href: instagramUrl(link.instagram) });
        } else if (link.label === 'WhatsApp') {
          if (link.phone && !phones.some((p) => p.digits === link.phone.digits)) phones.push(link.phone);
        } else {
          links.push(link);
        }
      }
      const rest = otherRaw.replace(URLS, ' ').replace(/\s+/g, ' ').trim();
      const sameHandle = instagram && readInstagram(rest) === instagram;
      if (rest && !sameHandle && !saysNothingNew(rest)) otherNote = withoutYes(rest);
    }

    const category = CATEGORY_NAMES.get(matchKey(get(record, 'category'))) || get(record, 'category').replace(/\s+/g, ' ');
    const offer = calmCase(get(record, 'offer'));
    const city = cityOf(get(record, 'city'));
    const address = get(record, 'address').replace(/\s+/g, ' ');

    businesses.push({
      id: n === 1 ? base : `${base}-${n}`,
      line,
      name,
      subtitle,
      letter: letterOf(name),
      category,
      offer,
      city,
      phones,
      instagram,
      instagramHref: instagram ? instagramUrl(instagram) : '',
      instagramNote,
      links,
      contactNote,
      otherNote,
      address,
      addressHref: address ? mapsUrl(address, city) : '',
      search: plain([name, subtitle, category, offer, city, address, instagram, instagramNote, contactNote, otherNote].join(' ')),
    });
  });

  businesses.sort((a, b) => collator.compare(a.name, b.name) || a.line - b.line);
  return { businesses, invalid, missing: [] };
}
