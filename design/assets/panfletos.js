// The activities the flyer artboards (design/panfleto-*.html) are drawn with: real rows of
// data/agenda.csv, copied here so the designs don't change when the sheet does, and read by the
// site's own code (js/csv.js, js/events.js), so they are what the agenda would show. Each artboard
// draws its flyer with js/flyer.js; ?atividade=<key> picks the activity, and with it the sky of its
// hour: caminhada and eleicao (no time: the day's sky), feira (a holiday, no time), oficina (8h,
// amanhecer), forum (18h, entardecer), baile (21h, noite), conselho (cancelled, 15h).

import { parseCSV } from '../../js/csv.js';
import { buildEvents } from '../../js/events.js';
import { renderFlyer } from '../../js/flyer.js';

const SHEET = `Título;Dia;Dia final;Horário;Término;Tipo;Organização;Setor;Local;Cidade;Cancelado;Motivo Cancelamento
Caminhada Ecológica de Dourados;31/10/2026;;;;Caminhada;SINTEF;Sindicatos;AGECOLD (largada e exposição) e Parque Arnulpho Fioravante;;FALSE;
Oficina de cartazes do Grito dos Excluídos e Excluídas;05/09/2026;;8h;;Oficina;Comitê de Defesa Popular, DCE UFGD, ADUF Dourados, SINTEF;Movimentos Sociais;UFGD – Quadra do CEUD, Unidade 1 (R. João Rosa Góes, 1761, Vila Progresso);;FALSE;
Baile dos Educadores – Festa Tropical;31/10/2026;;21h;;Festa;SIMTED;Sindicatos;Chácara do SIMTED;;FALSE;
7ª Feira Afro Zumbi Vive;20/11/2026;;;;Feira;Quintal de Palmares;Movimentos Sociais;Praça Antônio João;;FALSE;
Eleição da Direção e do Conselho Fiscal do SIMTED;04/11/2026;;;;Eleição;SIMTED;Sindicatos;;;FALSE;
Assembleia e eleição da nova gestão do Fórum de Cultura;07/10/2026;;18h;;Assembleia;Fórum de Cultura de Dourados;Outros;Circo das Artes: Céu de Lona – Rua Eulália Pires, 2845 (ao lado do Bar do Lau);;FALSE;
Conselho de Entidades de Base extraordinário;09/10/2026;;15h;;Plenária;DCE UFGD;Academia e Movimento Estudantil;UFGD – CineLab da FALE;;TRUE;O DCE cancelou todas as suas atividades de 09/10 em luto pelo falecimento de uma estudante de Medicina da UFGD.`;

const KEYS = {
  caminhada: 'Caminhada Ecológica de Dourados',
  oficina: 'Oficina de cartazes do Grito dos Excluídos e Excluídas',
  baile: 'Baile dos Educadores – Festa Tropical',
  feira: '7ª Feira Afro Zumbi Vive',
  eleicao: 'Eleição da Direção e do Conselho Fiscal do SIMTED',
  forum: 'Assembleia e eleição da nova gestão do Fórum de Cultura',
  conselho: 'Conselho de Entidades de Base extraordinário',
};

const { headers, records } = parseCSV(SHEET);
const { events } = buildEvents(headers, records);

// Draws the flyer `styleId` of the activity the address asks for (else `fallback`) into the
// artboard, and marks the page ready once its fonts are in.
export async function drawFlyer(styleId, fallback) {
  const key = new URLSearchParams(location.search).get('atividade');
  const title = KEYS[key] || KEYS[fallback];
  const event = events.find((ev) => ev.title === title);
  document.querySelector('.panfleto').replaceChildren(renderFlyer(event, styleId));
  await document.fonts.ready;
  document.documentElement.dataset.ready = '';
}
