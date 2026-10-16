# NOS Dourados

Agenda das organizações e movimentos de Dourados/MS em um só lugar. NOS = Núcleo de Organização Social (nome provisório).

Cada dia da agenda é uma folha de folhinha. Cada atividade mostra quem organiza, onde e quando, e de onde veio a informação. Para cada atividade o site gera:

- **Mensagem de WhatsApp** pronta para colar (com negrito, emojis e só os campos preenchidos);
- **Panfleto em PNG** (1080 × 1350 px) em três estilos (Folha do dia, Calendário do mês e Cartaz). Atividade cancelada vira um aviso de cancelamento.

Sem build, sem dependências para instalar: HTML, CSS e JavaScript puro. Nasceu de uma cópia do [Calendário de Luta](https://github.com/luizcarlos1405/calendario), do qual só manteve as cores.

## Editando a agenda

Por enquanto a agenda vem do arquivo `data/agenda.csv` (link em `CSV_URL`, no arquivo `js/config.js`). Depois ele pode ser trocado pelo link de uma planilha do Google publicada como CSV: aí é só editar a planilha que o site se atualiza.

O arquivo segue o formato brasileiro: colunas separadas por ponto e vírgula (`;`), datas no formato dia/mês/ano e acentos em UTF-8. Ele abre direto no Excel, no LibreOffice e no Google Planilhas.

| coluna | obrigatória | exemplo |
|---|---|---|
| `Título` | sim | 6ª Assembleia Geral Extraordinária |
| `Dia` | sim | `09/10/2026` ou `2026-10-09` (primeiro dia; sempre com o ano) |
| `Dia final` | não | último dia de atividades de vários dias (encontros, inscrições): `11/10/2026` (sem o ano, vale o ano do `Dia`) |
| `Horário` | não | `9h`, `9h30`, `09:30` ou uma célula de hora da planilha (`14:00:00`) |
| `Término` | não | `12h` → aparece como "9h às 12h" (sem `Horário`, como "até 12h") |
| `Tipo` | não | Assembleia, Ato, Plenária, Reunião, Formação, Oficina, Feira, Festa, Cultura, Esporte, Audiência pública, Campanha, Prazo, Eleição, Caminhada… (texto livre) |
| `Organização` | não | quem organiza; mais de uma separadas por vírgula, a principal primeiro: `DCE UFGD, ADUF Dourados` |
| `Setor` | não | o setor de quem organiza (veja abaixo); a coluna também pode se chamar `Categoria` |
| `Local` | não | Praça Antônio João; `Online` para atividades virtuais |
| `Cidade` | não | vazia = Dourados. Preencha só quando for em outra cidade: `Campo Grande` |
| `Descrição` | não | uma ou duas frases simples: o que é e quem pode participar |
| `Contato` | não | Ana – (67) 90000-0000. Celulares viram link de WhatsApp no site |
| `Link` | não | inscrição, formulário, vaquinha, transmissão |
| `Fonte` | não | link do post de onde veio a informação (Instagram, site…) |
| `Visível` | não | caixa de seleção: desmarcada = rascunho, não aparece no site |
| `Cancelado` | não | caixa de seleção: marcada = aparece como cancelada |
| `Motivo Cancelamento` | não | Chuva, Remarcado, ou uma frase curta |
| `Notas internas` | não | anotações da equipe; o site ignora esta coluna |

**Setores.** O filtro do site usa a coluna `Setor`. Os setores sugeridos têm cor fixa: `Sindicatos`, `Indígena, rural e terra`, `Movimentos sociais`, `Estudantil e acadêmico`, `Conselhos e associações`, `Partidos` e `Outros`. Dá para usar outro nome: ele ganha uma cor livre. Na planilha do Google, vale criar uma lista suspensa (Dados → Validação de dados) com esses nomes.

**Organizações.** O filtro "Organização" lista todos os nomes da coluna `Organização`, agrupados pelo setor. Escreva sempre do mesmo jeito (`SINTEF`, não às vezes `Sintef`) para não aparecerem duas vezes. Use a coluna para quem organiza (movimentos, sindicatos, coletivos); parceiros institucionais (universidade, órgãos públicos) cabem melhor na `Descrição`. Para quem não conhece as siglas, o site mostra o nome por extenso das organizações listadas em `ORG_NAMES` (`js/config.js`): acrescente as novas lá, com o nome que a própria organização usa.

**Atividades de vários dias.** Preencha `Dia` e `Dia final`. A atividade aparece na folha do primeiro dia com "até sáb, 24/10" e, enquanto estiver em andamento, continua na folha de hoje. No mês ela vira uma barra.

**Coluna `Visível`:** serve para guardar atividades ainda incompletas (rascunhos, ou anunciadas sem data) sem mostrá-las no site. No Google Planilhas, selecione a coluna e use **Inserir → Caixa de seleção**. Atenção: ao inserir, todas as caixas começam desmarcadas, então marque as atividades que já devem aparecer. Célula vazia ou planilha sem essa coluna = atividade visível.

**Colunas `Cancelado` e `Motivo Cancelamento`:** marque `Cancelado` quando uma atividade não for mais acontecer. Ela continua no site com o carimbo "Cancelada" e o motivo, e deixa de ser a "próxima". A mensagem de WhatsApp e o panfleto viram um aviso de cancelamento, para avisar os grupos que já tinham sido convidados.

**Notas internas.** O site ignora a coluna, mas quem tiver o link do CSV publicado consegue lê-la: não escreva nada que não possa ser público.

Ao salvar no Excel, use **"CSV UTF-8 (delimitado por vírgulas)"** ou **"CSV (separado por vírgulas)"**: o site entende os dois, com `;` ou `,` como separador, e não importa se os cabeçalhos estão com ou sem acento, em maiúsculas ou minúsculas.

Linhas sem título ou com data inválida (ou sem o ano) são ignoradas e aparecem num aviso no topo da página, com o número da linha na planilha.

### O CSV provisório

O `data/agenda.csv` atual foi montado a partir de um levantamento dos perfis públicos de Instagram das organizações (15/10/2026, mantido fora deste repositório), com foco em Dourados; cada linha guarda o link do post de origem na coluna `Fonte`. Algumas linhas estão ocultas (`Visível` desmarcado): atividades ainda sem data certa e atividades de outras cidades sem participação de organizações de Dourados. A coluna `Notas internas` diz o que ainda precisa ser confirmado em cada linha.

### Usando uma planilha online

1. Na planilha: **Arquivo → Compartilhar → Publicar na Web**, escolha a aba e o formato **CSV (.csv)** e copie o link.
2. Em `js/config.js`, troque o valor de `CSV_URL` por esse link.

Assim, quem edita a planilha atualiza o site sem precisar publicar nada de novo (o Google pode levar alguns minutos para refletir as mudanças).

## Rodando localmente

O navegador não deixa ler o CSV abrindo o `index.html` direto (`file://`), então suba um servidor simples:

```sh
python3 -m http.server 8000
```

e acesse <http://localhost:8000>.

## Publicando

Qualquer hospedagem estática serve (GitHub Pages, Netlify, Cloudflare Pages…): é só publicar a pasta inteira. No GitHub Pages: em *Settings → Pages*, escolha *Deploy from a branch*, o ramo `main` e a pasta `/ (root)`; o site fica em `https://<usuário>.github.io/<repositório>/` (ele funciona dentro de uma subpasta como essa).

O site está em https://nos.dourados.social (GitHub Pages, domínio no arquivo `CNAME`). Se o endereço mudar:

- troque `SITE_URL` em `js/config.js` (ele entra no fim de cada mensagem de WhatsApp);
- no `<head>` do `index.html`, troque o endereço nas tags da prévia do link (`canonical`, `og:url`, `og:image`…). Os endereços precisam ser completos: sem eles, o WhatsApp e as redes mostram a prévia só com título e descrição, sem a imagem `assets/og-image.png`.

## Funcionando sem internet e instalando como app

O site funciona sem internet e pode ser instalado como app no celular e no computador (PWA).

- **Sem internet.** O service worker (`sw.js`) busca tudo primeiro na rede e só usa a cópia guardada quando a rede falha: quem está online vê a planilha atual e a versão publicada do site (com o cache normal do navegador, de alguns minutos). Já na primeira visita ele guarda o site inteiro (a lista `SHELL`, no `sw.js`) e a agenda. Sem conexão, o site abre com a última agenda salva e avisa: "Sem conexão. Mostrando a agenda salva em…". O panfleto também é gerado sem internet.
- **Arquivos novos.** Se a página passar a carregar um arquivo novo (um módulo em `js/`, uma folha de estilo, uma fonte, um ícone), acrescente-o à lista `SHELL` do `sw.js`; senão ele só fica disponível sem internet a partir da segunda visita. Não é preciso mudar versão a cada publicação: cada resposta da rede atualiza a cópia.
- **App instalável.** O `manifest.webmanifest` tem o nome, as cores, os ícones e as capturas de tela que aparecem na hora de instalar. O app abre com o celular em pé ou deitado.
- **Ícones, prévia do link e capturas de tela** são gerados a partir de HTML: `assets/icon.html` (ícones do app e do navegador), `assets/og-image.html` (prévia do link, 1200 × 630) e o próprio site, num dia fixo (capturas). Depois de mudar o nome, a marca ou as cores, refaça tudo com `node assets/render.cjs` (ou só `icons`, `og` ou `shots`). Ele precisa do Playwright com um Chromium: na pasta do projeto, `npm i --no-save playwright-core` e `npx playwright-core install chromium` (ou aponte `PLAYWRIGHT_CORE` e `CHROMIUM` para os que você já tem).

## Personalizando

Tudo que costuma mudar fica em `js/config.js`:

- `CSV_URL`: de onde vem a agenda (arquivo local ou planilha publicada).
- `APP_NAME` / `APP_FULL_NAME`: o nome (NOS) e o nome por extenso.
- `CITY` / `HOME_CITY`: a cidade da agenda; atividades com `Cidade` vazia ou igual a ela são "daqui".
- `SITE_URL`: endereço do site, colocado no fim das mensagens.
- `SECTOR_SERIES`: a cor fixa de cada setor sugerido.
- `EXTRA_HOLIDAYS`: feriados locais, impressos em vermelho como os nacionais (`js/holidays.js`).
- `ORG_NAMES`: nomes por extenso das organizações.

**Cores e temas.** Todas as cores do site e dos panfletos ficam em `css/theme.css`, em duas camadas: a paleta (as cores) e os papéis (para que serve cada cor: cabeçalho, papel, tinta, destaque, próxima atividade, setores…). O resto do CSS só usa os papéis. Para experimentar outro tema, copie o bloco de exemplo no fim do `theme.css`, dê um nome e mude as cores. Para ver sem editar nada, abra o site com `?tema=<nome>` no fim do endereço (por exemplo `http://localhost:8000/?tema=exemplo`). Para adotar o tema, coloque `data-theme="<nome>"` na tag `<html>` do `index.html`; troque à mão a cor do `<meta name="theme-color">` (a barra do navegador no celular) e `theme_color`/`background_color` no `manifest.webmanifest`, que não leem variáveis; e refaça ícones, prévia do link e capturas com `node assets/render.cjs`, que usa o tema do `index.html`.

Outros textos:

- Frase final da mensagem de WhatsApp: `CLOSING_LINE` em `js/whatsapp.js` (usa `APP_NAME` e `HOME_CITY`).
- Para trocar o nome do site, além de `APP_NAME`/`APP_FULL_NAME`, mude o `<title>`, a descrição e as tags `og:` no `<head>` do `index.html` e o `<h1>` escondido logo abaixo do `<body>`; o nome do app instalável fica no `manifest.webmanifest` e no `apple-mobile-web-app-title` do `index.html`. Depois refaça os ícones e a prévia com `node assets/render.cjs`.
- Estilos de panfleto: lista `FLYER_STYLES` em `js/flyer.js`, com o visual em `css/flyers.css`.

## Design

O design da interface e dos panfletos está em `design.pen` (aberto no Pencil): marca provisória, componentes, telas de celular e desktop e os quatro panfletos. As cores do arquivo são variáveis com os mesmos nomes da paleta do `css/theme.css`.

## Estrutura

```
index.html
css/theme.css       cores (paleta e papéis), fontes e cantos
css/style.css       estilos do site
css/flyers.css      os estilos de panfleto
manifest.webmanifest  o app instalável: nome, cores, ícones e capturas de tela
sw.js               o funcionamento sem internet
assets/icon.html    origem dos ícones do app e do navegador
assets/og-image.html  origem da prévia do link
assets/pad.js       o desenho da marca usado pelos dois acima
assets/render.cjs   gera ícones, prévia do link e capturas de tela
assets/icons/       ícones e favicons
assets/screenshots/ capturas de tela do app instalável
fonts/              fontes Barlow, hospedadas no próprio site (licença em fonts/OFL.txt)
js/config.js        configurações (planilha, nome, cidade, endereço do site, setores, feriados locais, nomes das organizações)
js/app.js           carrega a agenda e liga a interface
js/agenda.js        a agenda: uma folha por dia
js/month.js         a página do mês
js/flyer.js         estilos de panfleto e exportação PNG
js/whatsapp.js      montador da mensagem de WhatsApp
js/colors.js        cores dos setores
js/holidays.js      feriados nacionais
js/icons.js         ícones e a marca NOS
js/csv.js           leitor de CSV
js/events.js        normaliza linhas, datas e horários
js/vendor/          html-to-image, que gera o PNG (licença ao lado)
data/agenda.csv     a agenda provisória
design.pen          o design (Pencil)
```

## Desenvolvimento

- `CLAUDE.md`: arquitetura, regras do código e decisões (em inglês, como todo o código).
- `PRODUCT.md`: para quem é o site e o que ele precisa fazer.
- `DESIGN.md` e `.impeccable/design.json`: o sistema visual ("Folhinha"); a origem do design é o `design.pen` (Pencil).
- `.impeccable/`: o resumo da direção visual, o laboratório de panfletos (`flyer-lab.html`) e o script de capturas para revisão (`capture.cjs`).
- `.claude/`: a skill [Impeccable](https://github.com/pbakaus/impeccable) para o Claude Code (Apache-2.0; licença e origem em `.claude/skills/impeccable/`), e `.mcp.json`, o MCP da Namecheap para quando o site tiver domínio.

