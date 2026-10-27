// Comércio (comercio.html): the network's businesses from A to Z, a heading per letter and a card per
// business. Reads the registration form's answers (COMMERCE_CSV_URL, through js/businesses.js),
// filters them by search and category, and prints each business with its ways to be reached and a
// ready "Indicar no WhatsApp" message. Paused for now: see the end of this file.

import { COMMERCE_CSV_URL, COMMERCE_FORM_URL } from './config.js';
import { buildBusinesses, categoriesOf, matchesSearch } from './businesses.js';
import { matchKey } from './events.js';
import { icon } from './icons.js';
import { buildBusinessMessage, whatsAppShareUrl } from './whatsapp.js';
import { $, announce, el, escapeHtml, initPage, readSheet, registerWorker, safeUrl, showNotice, showOffline } from './page.js';

const state = {
  businesses: [],
  query: '',
  categories: new Set(), // matchKey of the chosen categories; empty = every category
};

const count = (n) => (n === 0 ? 'Nenhum negócio' : `${n} ${n === 1 ? 'negócio' : 'negócios'}`);
const inCategories = (biz) => state.categories.size === 0 || state.categories.has(matchKey(biz.category));
const visible = () => state.businesses.filter((biz) => inCategories(biz) && matchesSearch(biz, state.query));
const chosenCategories = () => categoriesOf(state.businesses).filter((c) => state.categories.has(matchKey(c)));

// ---------- Data ----------

async function load() {
  try {
    const { headers, records, lines, savedAt } = await readSheet(COMMERCE_CSV_URL);
    const { businesses, invalid, missing } = buildBusinesses(headers, records, lines);
    if (missing.length) {
      showNotice(`<strong>A planilha não tem a coluna “${missing[0]}”.</strong> Confira se o link em <code>COMMERCE_CSV_URL</code> é o das respostas do formulário publicadas como CSV (<code>${escapeHtml(COMMERCE_CSV_URL)}</code>) e se a primeira linha tem os nomes das colunas.`, 'error');
      $('lista').replaceChildren();
      return;
    }
    state.businesses = businesses;
    $('page-sub').textContent = `${count(businesses.length)} da rede`;
    if (invalid.length) {
      const rows = invalid.map((r) => `<li>Linha ${r.line}: falta o nome do negócio.</li>`).join('');
      showNotice(`<p><strong>${invalid.length === 1 ? '1 linha da planilha ficou de fora' : `${invalid.length} linhas da planilha ficaram de fora`}.</strong></p><details><summary>Ver as linhas para corrigir</summary><ul>${rows}</ul></details>`);
    }
    // Set only on sw.js's saved copy, i.e. the live sheet couldn't be reached.
    if (savedAt) showOffline(savedAt, 'a lista salva');
  } catch (err) {
    console.error(err);
    showNotice(`<strong>Não foi possível carregar o comércio.</strong> Confira a conexão e recarregue a página. Se o problema continuar, avise quem cuida da planilha (<code>${escapeHtml(COMMERCE_CSV_URL)}</code>).`, 'error');
    $('lista').replaceChildren();
    return;
  }
  $('biz-tools').hidden = state.businesses.length === 0;
  renderChips();
  render();
}

// ---------- Filters ----------

// Built once: a click only flips aria-pressed, so focus stays on the chip.
function renderChips() {
  const categories = categoriesOf(state.businesses);
  const bar = $('category-filters');
  bar.hidden = categories.length === 0;
  const chips = $('category-chips');
  const chip = (label, key) => {
    const b = el('button', 'chip');
    b.type = 'button';
    b.dataset.key = key;
    const check = el('span', 'chip-check');
    check.innerHTML = icon('check');
    b.append(check, label);
    b.addEventListener('click', () => {
      if (!key) state.categories.clear();
      else if (state.categories.has(key)) state.categories.delete(key);
      else state.categories.add(key);
      render();
      announce(summary());
    });
    return b;
  };
  chips.replaceChildren(chip('Todos', ''), ...categories.map((c) => chip(c, matchKey(c))));
}

function syncChips() {
  for (const b of $('category-chips').children) {
    const key = b.dataset.key;
    b.setAttribute('aria-pressed', String(key ? state.categories.has(key) : state.categories.size === 0));
  }
}

// "17 negócios cadastrados na rede", "2 negócios para “celular”", "7 negócios em Comida".
function summary() {
  const n = visible().length;
  const query = state.query.trim();
  const cats = chosenCategories();
  if (!query && !cats.length) return `${count(n)} cadastrados na rede`;
  return [count(n), cats.length ? `em ${cats.join(', ')}` : '', query ? `para “${query}”` : ''].filter(Boolean).join(' ');
}

function setQuery(value) {
  state.query = value;
  $('search').value = value;
  $('search-clear').hidden = !value;
}

function clearAll() {
  setQuery('');
  state.categories.clear();
  render();
  $('search').focus();
  announce(summary());
}

// ---------- The list ----------

function render() {
  syncChips();
  $('biz-count').textContent = summary();
  const list = $('lista');
  const shown = visible();
  if (!shown.length) {
    list.replaceChildren(blankSheet());
    return;
  }
  const letters = new Map();
  for (const biz of shown) {
    if (!letters.has(biz.letter)) letters.set(biz.letter, []);
    letters.get(biz.letter).push(biz);
  }
  // Names starting with a digit or a sign ("#") close the book.
  const order = [...letters.keys()].sort((a, b) => (a === '#') - (b === '#') || a.localeCompare(b));
  list.replaceChildren(...order.map((letter) => letterSheet(letter, letters.get(letter))));
}

// One letter: its heading and count, then its businesses.
function letterSheet(letter, businesses) {
  const group = el('section', 'letter-group');
  const id = `letra-${letter === '#' ? 'outros' : letter.toLowerCase()}`;
  group.setAttribute('aria-labelledby', id);
  const head = el('div', 'letter-head');
  const title = el('h2', 'letter', letter);
  title.id = id;
  head.append(title, el('span', 'letter-count', count(businesses.length)));
  const list = el('ul', 'biz-list');
  list.append(...businesses.map(businessItem));
  group.append(head, list);
  return group;
}

function businessItem(biz) {
  const item = el('li');
  const card = el('article', 'biz');
  card.id = biz.id;
  card.setAttribute('aria-labelledby', `${biz.id}-name`);

  const main = el('div', 'biz-main');
  const name = el('h3', 'biz-name', biz.name);
  name.id = `${biz.id}-name`;
  main.append(name);
  if (biz.subtitle) main.append(el('p', 'biz-subtitle', biz.subtitle));
  if (biz.city) {
    const city = el('p', 'biz-city');
    city.append(el('span', 'city-tag', biz.city));
    main.append(city);
  }
  if (biz.offer) {
    const offer = el('p', 'biz-offer');
    offer.append(breakable(biz.offer));
    main.append(offer);
  }
  if (biz.category) main.append(el('p', 'biz-category tag', biz.category));
  card.append(main);

  // "Indicar": the business, ready to send to a WhatsApp group. A glyph on phones, written out on the desk.
  const share = el('a', 'biz-share');
  share.href = whatsAppShareUrl(buildBusinessMessage(biz));
  share.target = '_blank';
  share.rel = 'noopener';
  share.setAttribute('aria-label', `Indicar no WhatsApp: ${biz.name}`);
  share.innerHTML = `${icon('share')}<span class="biz-share-text" aria-hidden="true">Indicar no WhatsApp</span>`;
  card.append(share);

  const contacts = el('dl', 'biz-contacts');
  for (const phone of biz.phones) contacts.append(contact(phone.mobile ? 'WhatsApp' : 'Telefone', phoneValue(phone)));
  if (biz.instagram) contacts.append(contact('Instagram', linkValue(biz.instagramHref, `@${biz.instagram}`, `Instagram @${biz.instagram}`)));
  else if (biz.instagramNote) contacts.append(contact('Instagram', textValue(biz.instagramNote)));
  for (const link of biz.links) {
    const href = safeUrl(link.href);
    contacts.append(contact(link.label, href ? linkValue(href, link.text, `${link.label}: ${link.text}`) : textValue(link.text)));
  }
  if (biz.contactNote) contacts.append(contact('Contato', textValue(biz.contactNote)));
  if (biz.otherNote) contacts.append(contact('Outras redes', textValue(biz.otherNote)));
  if (contacts.childNodes.length) card.append(contacts);

  item.append(card);
  return item;
}

// One way to reach the business: its label, the value beside it.
function contact(label, value) {
  const row = el('div', 'contact');
  const dd = el('dd');
  dd.append(value);
  row.append(el('dt', null, label), dd);
  return row;
}

// A mobile opens the conversation in WhatsApp, and the glyph beside it calls; a landline calls.
function phoneValue(phone) {
  const out = document.createDocumentFragment();
  const tel = `tel:+55${phone.digits}`;
  if (phone.mobile) {
    out.append(linkValue(`https://wa.me/55${phone.digits}`, phone.label, `WhatsApp ${phone.label}`, 'is-number'));
    const call = el('a', 'contact-call');
    call.href = tel;
    call.setAttribute('aria-label', `Ligar para ${phone.label}`);
    call.innerHTML = icon('phone');
    out.append(call);
  } else {
    out.append(linkValue(tel, phone.label, `Ligar para ${phone.label}`, 'is-number'));
  }
  return out;
}

function linkValue(href, text, label, extra = '') {
  const a = el('a', `contact-value ${extra}`.trim(), text);
  a.href = href;
  if (/^https?:/.test(href)) {
    a.target = '_blank';
    a.rel = 'noopener';
  }
  if (label && label !== text) a.setAttribute('aria-label', label);
  return a;
}

const textValue = (text) => {
  const span = el('span', 'contact-text');
  span.append(breakable(text));
  return span;
};

// Text typed as "previdenciária/civel/assessoria" may wrap after its slashes, not inside a word.
function breakable(text) {
  const out = document.createDocumentFragment();
  text.split('/').forEach((part, i) => {
    if (i) out.append('/', document.createElement('wbr'));
    out.append(part);
  });
  return out;
}

// Nothing to show: say why, and offer the way back.
function blankSheet() {
  const box = el('div', 'empty-state');
  box.innerHTML = icon('search-x', 'icon empty-icon');
  const query = state.query.trim();
  const cats = chosenCategories().join(', ');
  const actions = el('div', 'empty-actions');
  const button = (label, className, onClick) => {
    const b = el('button', className, label);
    b.type = 'button';
    b.addEventListener('click', onClick);
    return b;
  };

  if (!state.businesses.length) {
    box.append(el('p', 'empty-title', 'Ainda não há negócios na lista'), el('p', 'empty-hint', 'Os negócios aparecem aqui quando se cadastram pelo formulário da rede.'));
  } else {
    const title = query && cats ? `Nenhum negócio de ${cats} com “${query}”` : query ? `Nenhum negócio com “${query}”` : `Nenhum negócio de ${cats}`;
    box.append(el('p', 'empty-title', title));
    if (query) box.append(el('p', 'empty-hint', 'Confira se a palavra está certa ou tente outra parecida.'));
    const elsewhere = query && state.categories.size > 0 && state.businesses.some((biz) => matchesSearch(biz, query));
    if (elsewhere) {
      actions.append(button('Buscar em todas as categorias', 'btn btn-line', () => {
        state.categories.clear();
        render();
        announce(summary());
        $('search').focus();
      }));
      actions.append(button('Ver todos os negócios', 'btn-text', clearAll));
    } else {
      actions.append(button('Ver todos os negócios', 'btn btn-line', clearAll));
    }
    box.append(actions);
  }
  return box;
}

// ---------- Wiring ----------

initPage('Comércio');

let announceTimer = null;
$('search').addEventListener('input', (e) => {
  setQuery(e.target.value);
  render();
  clearTimeout(announceTimer);
  announceTimer = setTimeout(() => announce(summary()), 700);
});
// The keyboard's search key closes the keyboard, so the results show.
$('search').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') e.target.blur();
});
$('search-clear').innerHTML = icon('close');
$('search-clear').addEventListener('click', () => {
  setQuery('');
  render();
  $('search').focus();
  announce(summary());
});

const formUrl = safeUrl(COMMERCE_FORM_URL);
if (formUrl) {
  $('join-link').href = formUrl;
  $('join').hidden = false;
}

// Paused while the businesses are collected and organized: comercio.html shows "Em breve" where the
// list goes. To bring the list back: call load() here again (as `if (location.protocol !== 'file:')
// load();`), put the "Carregando o comércio…" placeholder back in #lista in comercio.html, and on the
// home call renderCommerceDoor() (js/home.js) and give Comércio's door its own text in index.html.
registerWorker();
