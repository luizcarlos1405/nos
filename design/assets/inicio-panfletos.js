// The coming activities of the agenda on 12/11/2026, the day of the home proposals (design/inicio-*.html):
// the rows of data/agenda/2026-11.csv and 2026-12.csv from that day on, copied here (their columns the
// flyers read) so the artboards don't change when the agenda does, and read by the site's own code
// (js/csv.js, js/events.js), so they are what the agenda shows. The flyers are drawn by js/flyer.js
// itself: what the site exports. An artboard that shows flyers links ../css/flyers.css.

import { parseCSV } from '../../js/csv.js';
import { buildEvents } from '../../js/events.js';
import { renderFlyer } from '../../js/flyer.js';

const SHEET = `Título;Dia;Dia final;Horário;Término;Tipo;Organização;Setor;Local;Cidade;Visível;Cancelado;Motivo Cancelamento
Festa da Vitória em Dourados;13/11/2026;;;;Festa;PT Dourados;Partidos;;;TRUE;FALSE;
Batalha da 50: edição especial do projeto 50 em Cena;14/11/2026;;18h30;;Batalha;Batalha da Cinquenta;Outros;Praça do Cinquentenário;;TRUE;FALSE;
Dia de vivência em agroecologia e contra os agrotóxicos;14/11/2026;;7h;16h;Formação;MST;Rural, indígena, luta pela terra;Tekoha Guyra Kambi’y (saída da biblioteca da UFGD);;TRUE;FALSE;
Feira Batuque – 7ª edição;14/11/2026;;17h;;Feira;Feira Batuque;Outros;Centro de Convenções Antônio Tonani;;TRUE;FALSE;
Feira Badauê no Ateliê;14/11/2026;15/11/2026;16h;23h;Feira;Feira Badauê, Inspiratório Ateliê;Outros;Inspiratório Ateliê – Rua Pedro Rigotti, 414;;TRUE;FALSE;
Fim das inscrições de feirantes da Feira Criativa do Sucata Cultural;15/11/2026;;;;Prazo;Sucata Cultural;Outros;Online;;TRUE;FALSE;
7ª Feira Afro Zumbi Vive;20/11/2026;;;;Feira;Quintal de Palmares;Movimentos Sociais;Praça Antônio João;;TRUE;FALSE;
Festival Multicultural – Caminhos da Arte;20/11/2026;23/11/2026;;;Festival;Sucata Cultural;Outros;Sucata Cultural – Rua Onofre Pereira de Matos, 805, Centro;;TRUE;FALSE;
27º Congresso do DCE UEMS;20/11/2026;22/11/2026;;;Congresso;DCE UEMS;Academia e Movimento Estudantil;UEMS – Unidade de Mundo Novo;Mundo Novo;TRUE;FALSE;
Roda Oficial da Escola Matumbé de Capoeira Angola;27/11/2026;;19h;;Cultura;Escola Matumbé Capoeira Angola;Outros;Academia da Saúde – Parque do Lago;;TRUE;FALSE;
Feira Criativa do Festival Multicultural Caminhos da Arte;28/11/2026;29/11/2026;;;Feira;Sucata Cultural;Outros;Sucata Cultural – Rua Onofre Pereira de Matos, 805, Centro;;TRUE;FALSE;
6º Festival Nacional Malungo Capoeira;04/12/2026;05/12/2026;18h;;Festival;Instituto Cultural Malungo, Projeto Gingar para Educar;Terceiro Setor;SIMTED – Rua Maria da Glória, 670, Vila Industrial;;TRUE;FALSE;
Grande Natal das Bombshells;05/12/2026;;18h;;Festa;House of Bombshell, Ballroom Dourados;Outros;Casulo – Rua Reinaldo Bianchi, 398, Parque Alvorada;;TRUE;FALSE;
Plenária de Mulheres do PT Dourados;05/12/2026;;14h;17h;Plenária;PT Dourados;Partidos;Sede do PT Dourados – Rua dos Caiuás, 727;;TRUE;FALSE;
Feira Badauê no Ateliê;12/12/2026;13/12/2026;;;Feira;Feira Badauê;Outros;Inspiratório Ateliê – Rua Pedro Rigotti, 414;;FALSE;FALSE;
10ª Mostra Sucata Cultural – Castelo Rá-Tim-Bum;12/12/2026;13/12/2026;;;Espetáculo;Sucata Cultural;Outros;;;TRUE;FALSE;
Inscrições de novos estudantes na rede municipal de ensino;14/12/2026;10/01/2027;;;Prazo;Secretaria Municipal de Educação (SEMED);Órgãos do Estado;Online – Matrícula Digital, no portal da Prefeitura de Dourados;;FALSE;FALSE;`;

// Short keys for the artboards.
export const KEYS = {
  "festa": "Festa da Vitória em Dourados",
  "batalha": "Batalha da 50: edição especial do projeto 50 em Cena",
  "vivencia": "Dia de vivência em agroecologia e contra os agrotóxicos",
  "batuque": "Feira Batuque – 7ª edição",
  "badaue": "Feira Badauê no Ateliê",
  "prazo": "Fim das inscrições de feirantes da Feira Criativa do Sucata Cultural",
  "zumbi": "7ª Feira Afro Zumbi Vive",
  "festival": "Festival Multicultural – Caminhos da Arte",
  "congresso": "27º Congresso do DCE UEMS",
  "matumbe": "Roda Oficial da Escola Matumbé de Capoeira Angola",
  "criativa": "Feira Criativa do Festival Multicultural Caminhos da Arte",
  "malungo": "6º Festival Nacional Malungo Capoeira",
  "natal": "Grande Natal das Bombshells",
  "plenaria": "Plenária de Mulheres do PT Dourados",
  "mostra": "10ª Mostra Sucata Cultural – Castelo Rá-Tim-Bum"
};

const { headers, records } = parseCSV(SHEET);
export const { events } = buildEvents(headers, records);

export function activity(key) {
  const event = events.find((ev) => ev.title === KEYS[key]);
  if (!event) throw new Error(`No activity ${key}`);
  return event;
}

// The flyer `styleId` ('day' Folha do dia, 'poster' Cartaz, 'month' Agenda do mês) of an activity, drawn at
// its real size (1080×1350) and scaled to `width` px inside a box of that size (the box clips it).
export function flyer(key, styleId = 'poster', width = 216) {
  const scale = width / 1080;
  const box = document.createElement('div');
  box.className = 'flyer-box';
  box.style.cssText = `width:${width}px;height:${Math.round(1350 * scale)}px;overflow:hidden;position:relative;flex:none`;
  const node = renderFlyer(activity(key), styleId);
  node.style.transform = `scale(${scale})`;
  node.style.transformOrigin = '0 0';
  node.style.position = 'absolute';
  node.style.left = '0';
  node.style.top = '0';
  box.append(node);
  return box;
}

// Fills every [data-flyer="key"] (optionally data-style="day|poster|month", data-width="216") with its
// flyer, then marks the page ready once the fonts are in.
export async function fillFlyers(root = document) {
  for (const slot of root.querySelectorAll('[data-flyer]')) {
    const width = Number(slot.dataset.width) || slot.clientWidth || 216;
    slot.replaceChildren(flyer(slot.dataset.flyer, slot.dataset.style || 'poster', width));
  }
  await document.fonts.ready;
  document.documentElement.dataset.ready = '';
}
