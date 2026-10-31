// "Salvar na minha agenda" (one activity) and "Salvar tudo na agenda" (the whole agenda as a
// calendar that keeps itself up to date): the options, in the <dialog id="save-menu"> of
// agenda.html, a bottom sheet on phones and a popover under its button on the desk. The calendar
// this device most likely uses comes first; the person confirms in their own calendar.

import { APP_NAME, HOME_CITY, SITE_URL } from './config.js';
import { formatDateRange, formatTimeRange } from './events.js';
import { androidIntent, buildCalendar, eventPage, googleEventUrl, googleSubscribeUrl, icsFilename, outlookEventUrl, outlookSubscribeUrl, feedUrl, webcalUrl } from './ics.js';
import { icon } from './icons.js';
import { whatsAppShareUrl } from './whatsapp.js';
import { $, copyText, el } from './page.js';

// Keep in step with the 1100px media queries in css/style.css (and `desktop` in js/app.js).
const desk = window.matchMedia('(min-width: 1100px)');

// Which calendar comes first: Google Agenda on Android and on computers, the iPhone's (or iPad's) own
// on Apple devices. Inside an app's browser (Instagram, Facebook) or in another browser than
// Safari, an iPhone opens neither calendar files nor subscriptions: those options ask for Safari.
const ua = navigator.userAgent;
const ipad = /iPad/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
const inApp = /; ?wv\)|Instagram|FBAN|FBAV|(?:iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/i.test(ua);
const safari = /^(?:(?!chrome|android|crios|fxios|edgios).)*safari/i.test(ua);
const device = ipad || /iPhone|iPod/.test(ua) ? (safari && !inApp ? 'apple' : 'apple-elsewhere') : /android/i.test(ua) ? 'android' : 'desk';
const appleName = ipad ? 'iPad' : 'iPhone';
const phone = device !== 'desk';

// The address that opens "Salvar tudo na agenda" (agenda.html reads it after the #): sent to the
// person's WhatsApp to open on a computer, or copied to open in Safari.
const SAVE_ALL_PAGE = `${SITE_URL}/agenda.html#salvar-tudo`;

let dialog;
let body;
let trigger = null;

export function initSaveMenu() {
  dialog = $('save-menu');
  body = $('save-menu-body');
  // A click on the backdrop lands on the dialog itself (its content fills it).
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => {
    trigger?.setAttribute('aria-expanded', 'false');
    // Back to the button that opened it, or its twin if the list was drawn again meanwhile.
    const key = trigger?.dataset.focus;
    const target = trigger?.isConnected ? trigger : key ? document.querySelector(`[data-focus="${CSS.escape(key)}"]`) : null;
    target?.focus({ preventScroll: true });
    trigger = null;
    body.replaceChildren();
  });
  wireDrag();
  addEventListener('resize', place);
  addEventListener('scroll', place, { passive: true });
  desk.addEventListener('change', place);
}

// `what`: { ev } for one activity, { all: true } for the whole agenda. `from` is the button that
// opened it: the popover hangs from it, and focus goes back to it.
export function openSaveMenu(what, from) {
  if (!dialog || (!what.all && !what.ev)) return;
  if (from !== trigger) trigger?.setAttribute('aria-expanded', 'false');
  trigger = from || null;
  trigger?.setAttribute('aria-expanded', 'true');
  render(what);
  if (!dialog.open) dialog.showModal();
  place();
  dialog.querySelector('[autofocus]')?.focus();
}

function render(what) {
  dialog.dataset.kind = what.all ? 'all' : 'event';
  const title = what.all ? 'Salvar tudo na agenda' : 'Salvar na sua agenda';
  const grabber = el('span', 'grabber');
  grabber.setAttribute('aria-hidden', 'true');
  body.replaceChildren(grabber, head(title), ...(what.all ? everything() : activity(what.ev)));
}

// ---------- One activity ----------

function activity(ev) {
  const parts = [];
  // On the desk the panel beside its own button already shows the activity.
  if (!(desk.matches && trigger?.closest('.bench'))) parts.push(summary(ev));
  const ics = () => saveFile(ev);
  const google = (newTab) => ({ name: 'Google Agenda', hint: 'Abre o site do Google Agenda', href: googleEventUrl(ev, { phone }), newTab, trail: 'external' });
  const outlook = { name: 'Outlook', hint: 'Conta Microsoft (Hotmail, Outlook)', href: outlookEventUrl(ev, { phone }), newTab: !phone, trail: 'external' };
  const file = { name: 'Outro aplicativo', hint: 'Baixar o arquivo da atividade (.ics)', onClick: ics, trail: 'download' };

  if (device === 'android') {
    const url = googleEventUrl(ev, { phone: true });
    parts.push(primary({ label: 'Salvar no Google Agenda', glyph: 'calendar-plus', href: inApp ? url : androidIntent(url), note: 'Abre o Google Agenda com tudo preenchido. É só tocar em Salvar.' }));
    parts.push(...others([{ name: 'iPhone, iPad e Mac', hint: 'App Calendário da Apple', onClick: ics, trail: 'right' }, outlook, file]));
  } else if (device === 'apple') {
    parts.push(primary({ label: `Salvar no ${appleName}`, glyph: 'calendar-plus', onClick: ics, note: `O ${appleName} mostra a atividade com tudo preenchido: é só confirmar.` }));
    parts.push(...others([google(false), outlook, file]));
  } else if (device === 'apple-elsewhere') {
    parts.push(away({
      glyph: 'compass',
      title: `Para salvar no ${appleName}, abra no Safari`,
      text: `Dentro do Instagram (e no Chrome) o ${appleName} não abre a sua agenda. Copie o link, cole no Safari e salve por lá.`,
      actions: [copyButton('Copiar o link da atividade', eventPage(ev), 'btn-accent', true)],
    }));
    parts.push(...others([google(false), outlook, file]));
  } else {
    parts.push(primary({ label: 'Salvar no Google Agenda', glyph: 'calendar-plus', href: googleEventUrl(ev), newTab: true, note: 'Abre o Google Agenda numa nova aba, com tudo preenchido.' }));
    parts.push(...others([{ name: 'Apple', hint: 'App Calendário, no Mac ou no iPhone', onClick: ics, trail: 'right' }, outlook, file]));
  }

  const all = el('button', 'save-all-link');
  all.type = 'button';
  all.innerHTML = `<span class="save-all-icon">${icon('calendar-sync')}</span>`;
  all.append(optionText('Salvar tudo na agenda', 'Todas as atividades, e as novas entram sozinhas'));
  all.insertAdjacentHTML('beforeend', icon('right'));
  all.addEventListener('click', () => {
    render({ all: true });
    place();
    dialog.querySelector('[autofocus]')?.focus();
  });
  parts.push(all);
  return parts;
}

// What is being saved: the title, the day and the time, the place.
function summary(ev) {
  const box = el('div', 'save-event');
  box.append(el('p', 'save-event-title', ev.title));
  const when = el('span', 'meta meta-when');
  when.innerHTML = icon('clock');
  when.append(el('span', 'meta-text', `${formatDateRange(ev).replace('-feira', '')} · ${formatTimeRange(ev) || 'Horário a confirmar'}`));
  box.append(when);
  const place = ev.city && ev.local ? `${ev.local}, ${ev.city}` : ev.local || ev.city;
  if (place) {
    const where = el('span', 'meta');
    where.innerHTML = icon(ev.online ? 'globe' : 'pin');
    where.append(el('span', 'meta-text', place));
    box.append(where);
  }
  return box;
}

// The activity as a calendar file: a data: address, which Safari on an iPhone opens as "add to
// Calendar" (in the same tab) and other browsers save.
function saveFile(ev) {
  const link = document.createElement('a');
  link.href = `data:text/calendar;charset=utf-8,${encodeURIComponent(buildCalendar([ev]))}`;
  link.download = icsFilename(ev);
  link.target = phone ? '_self' : '_blank';
  link.rel = 'noopener';
  document.body.append(link);
  link.click();
  link.remove();
  dialog.close();
}

// ---------- Everything ----------

function everything() {
  const parts = [el('p', 'save-lead', 'Sua agenda passa a mostrar todas as atividades do NOS e se atualiza sozinha: as novas aparecem, e as mudanças e os cancelamentos também.')];
  const message = `Abra no computador para salvar todas as atividades do ${APP_NAME} ${HOME_CITY} na sua agenda: ${SAVE_ALL_PAGE}`;
  const apple = { name: 'iPhone, iPad e Mac', hint: 'Um toque: o aparelho pergunta se você quer assinar', href: webcalUrl(), trail: 'right' };
  const googleLater = { name: 'Google Agenda', hint: 'Só pelo computador: mandamos o link para o seu WhatsApp', href: whatsAppShareUrl(message), newTab: true, trail: 'right' };
  const outlook = { name: 'Outlook', hint: 'Conta Microsoft (Hotmail, Outlook)', href: outlookSubscribeUrl(), newTab: true, trail: 'external' };
  const address = { name: 'Outro aplicativo', hint: 'Copiar o endereço da agenda', copy: feedUrl(), trail: 'copy' };

  if (device === 'android') {
    // Google lets people subscribe only from a computer browser.
    parts.push(away({
      glyph: 'laptop',
      title: 'No Google Agenda, só pelo computador',
      text: 'O Google não deixa fazer isso pelo celular. Faça uma vez no computador e as atividades aparecem também no seu celular.',
      actions: [primaryLink('Mandar o link para o meu WhatsApp', 'message', whatsAppShareUrl(message)), copyButton('Copiar o link', SAVE_ALL_PAGE, 'btn-line')],
    }));
    parts.push(...others([apple, outlook, address]));
  } else if (device === 'apple') {
    parts.push(primary({ label: `Salvar tudo no ${appleName}`, glyph: 'calendar-sync', href: webcalUrl(), note: `O ${appleName} pergunta se você quer assinar a agenda: é só confirmar.` }));
    parts.push(...others([googleLater, outlook, address]));
  } else if (device === 'apple-elsewhere') {
    parts.push(away({
      glyph: 'compass',
      title: `Para salvar no ${appleName}, abra no Safari`,
      text: `Dentro do Instagram (e no Chrome) o ${appleName} não assina agendas. Copie o link, cole no Safari e salve por lá.`,
      actions: [copyButton('Copiar o link', SAVE_ALL_PAGE, 'btn-accent', true)],
    }));
    parts.push(...others([googleLater, outlook, address]));
  } else {
    parts.push(primary({ label: 'Salvar tudo no Google Agenda', glyph: 'calendar-sync', href: googleSubscribeUrl(), newTab: true, note: 'O Google pergunta se você quer adicionar a agenda: é só confirmar.' }));
    parts.push(...others([{ ...apple, name: 'Apple', hint: 'O Calendário do Mac pergunta se você quer assinar' }, outlook, address]));
  }

  const foot = el('div', 'save-foot');
  foot.append(
    el('p', null, `Ela aparece como “${APP_NAME} ${HOME_CITY}” na sua lista de agendas. Para parar de receber, é só removê-la.`),
    el('p', null, 'Já salvou alguma atividade uma por uma? Ela vai aparecer duas vezes: pode apagar a sua cópia.'),
  );
  parts.push(foot);
  return parts;
}

// ---------- Pieces ----------

function head(text) {
  const row = el('div', 'save-head');
  const title = el('h2', 'save-title', text);
  title.id = 'save-menu-title';
  const close = el('button', 'icon-button save-close');
  close.type = 'button';
  close.setAttribute('aria-label', 'Fechar');
  close.innerHTML = icon('close');
  close.addEventListener('click', () => dialog.close());
  row.append(title, close);
  return row;
}

const optionText = (name, hint) => {
  const text = el('span', 'save-option-text');
  text.append(el('span', 'save-option-name', name), el('span', 'save-option-hint', hint));
  return text;
};

// A link leaves for the calendar (in a new tab on the desk) and the options close behind it.
function linkTo(node, href, newTab) {
  node.href = href;
  if (newTab) {
    node.target = '_blank';
    node.rel = 'noopener';
  }
  node.addEventListener('click', () => setTimeout(() => dialog.close()));
  return node;
}

// The calendar this device most likely uses, as the primary button, and what happens next.
function primary({ label, glyph, href, newTab, onClick, note }) {
  const box = el('div', 'save-primary');
  const action = el(href ? 'a' : 'button', 'btn btn-accent save-go');
  action.innerHTML = `${icon(glyph)}<span>${label}</span>`;
  action.autofocus = true;
  if (href) linkTo(action, href, newTab);
  else {
    action.type = 'button';
    action.addEventListener('click', onClick);
  }
  box.append(action, el('p', 'save-note', note));
  return box;
}

function primaryLink(label, glyph, href) {
  const action = linkTo(el('a', 'btn btn-accent'), href, true);
  action.innerHTML = `${icon(glyph)}<span>${label}</span>`;
  action.autofocus = true;
  return action;
}

// A copy button says it copied, for a moment, like "Copiar texto" in the panel.
function copyButton(label, value, kind, first = false) {
  const button = el('button', `btn ${kind}`);
  button.type = 'button';
  button.autofocus = first;
  const show = (glyph, text) => {
    button.innerHTML = `${icon(glyph)}<span>${text}</span>`;
  };
  show('copy', label);
  button.addEventListener('click', async () => {
    const copied = await copyText(value);
    show(copied ? 'check' : 'alert', copied ? 'Link copiado' : 'Não deu certo, tente de novo');
    clearTimeout(button._timer);
    button._timer = setTimeout(() => show('copy', label), 2000);
  });
  return button;
}

// A calendar that can't be reached from here, what to do instead, and the buttons to do it.
function away({ glyph, title, text, actions }) {
  const box = el('div', 'save-away');
  const top = el('div', 'save-away-head');
  top.innerHTML = icon(glyph);
  top.append(el('p', 'save-away-title', title));
  const buttons = el('div', 'save-away-actions');
  buttons.append(...actions);
  box.append(top, el('p', 'save-away-text', text), buttons);
  return box;
}

// The other calendars, one row each.
function others(options) {
  const list = el('ul', 'save-options');
  for (const { name, hint, href, newTab, onClick, copy, trail } of options) {
    const item = el('li');
    const row = el(href ? 'a' : 'button', 'save-option');
    row.append(optionText(name, hint));
    row.insertAdjacentHTML('beforeend', icon(trail));
    if (href) linkTo(row, href, newTab);
    else {
      row.type = 'button';
      row.addEventListener('click', copy ? () => copyRow(row, copy, hint) : onClick);
    }
    item.append(row);
    list.append(item);
  }
  return [el('p', 'save-more', 'Ou salve em outra agenda'), list];
}

async function copyRow(row, value, hint) {
  const copied = await copyText(value);
  row.querySelector('.save-option-hint').textContent = copied ? 'Endereço copiado' : 'Não deu certo, tente de novo';
  clearTimeout(row._timer);
  row._timer = setTimeout(() => {
    row.querySelector('.save-option-hint').textContent = hint;
  }, 2000);
}

// ---------- Where it sits ----------

// On the desk the popover hangs under its button, or above it when there is no room below: from the
// panel it lines up with the button's left edge, over the list with its right edge, so it covers the
// column it came from. With no room either way (a card in the middle of the screen) it stands beside
// the button, so the button stays in sight. On phones it is a bottom sheet the stylesheet places.
function place() {
  if (!dialog?.open) return;
  if (!desk.matches || !trigger?.isConnected) {
    dialog.style.removeProperty('top');
    dialog.style.removeProperty('left');
    return;
  }
  const box = trigger.getBoundingClientRect();
  const { offsetWidth: width, offsetHeight: height } = dialog;
  const margin = 16;
  let left = trigger.closest('.bench') ? box.left : box.right - width;
  let top = box.bottom + 8;
  if (top + height > innerHeight - margin) {
    if (box.top - 8 - height >= margin) {
      top = box.top - 8 - height;
    } else {
      top = box.top + box.height / 2 - height / 2;
      left = box.left - 8 - width >= margin ? box.left - 8 - width : box.right + 8;
    }
  }
  dialog.style.left = `${Math.min(Math.max(margin, left), innerWidth - width - margin)}px`;
  dialog.style.top = `${Math.max(margin, Math.min(top, innerHeight - height - margin))}px`;
}

// Phones: the sheet follows a finger pulling its head down and closes past 90px, as the panel does.
function wireDrag() {
  let startY = null;
  let dy = 0;
  dialog.addEventListener('pointerdown', (e) => {
    if (desk.matches || !e.target.closest('.grabber, .save-head') || e.target.closest('button')) return;
    startY = e.clientY;
    dy = 0;
    dialog.setPointerCapture(e.pointerId);
    dialog.classList.add('is-dragging');
  });
  dialog.addEventListener('pointermove', (e) => {
    if (startY == null) return;
    dy = Math.max(0, e.clientY - startY);
    dialog.style.setProperty('--drag', `${dy}px`);
  });
  const end = () => {
    if (startY == null) return;
    startY = null;
    dialog.classList.remove('is-dragging');
    dialog.style.removeProperty('--drag');
    if (dy > 90) dialog.close();
  };
  dialog.addEventListener('pointerup', end);
  dialog.addEventListener('pointercancel', end);
}
