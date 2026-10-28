# NOS Dourados

A agenda das organizações e movimentos de Dourados/MS e o comércio da rede, em um só lugar. NOS = Núcleo de Organização Social (nome provisório).

O site tem três páginas, cada uma um arquivo HTML:

- **Início** (`index.html`): o bom-dia (ou boa-tarde, boa-noite) sob o céu desta hora, a próxima atividade pousada na faixa, pronta para mandar no WhatsApp, e uma porta para cada página.
- **Agenda** (`agenda.html`): as atividades das organizações, em lista de dias ou no mês. Até 26/10/2026 era o `index.html`; até 27/10/2026 se chamava Calendário e ficava em `calendario.html`, endereço que agora leva para `agenda.html` (assim os links já compartilhados continuam funcionando).
- **Comércio** (`comercio.html`): os negócios que se cadastraram pelo formulário da rede, de A a Z.

No celular, a barra no pé da tela leva de uma página à outra; no computador, os links ficam no alto, sobre o céu. A marca NOS leva ao Início. São links comuns, então funcionam em qualquer hospedagem estática.

O visual é o "Céu · Terra": no alto, o céu de Dourados desta hora (amanhecer, dia, entardecer ou noite), em faixas de cor; uma faixa tecida faz o horizonte; embaixo, a terra (barro claro de dia, terra roxa à noite). O site tem tema claro e escuro: segue o do celular e tem um botão para trocar. A faixa é arte provisória, feita só da técnica do trançado: a definitiva vai ser criada, assinada e paga a artistas da Reserva Indígena de Dourados (veja `design/faixa-pesquisa.html`).

Cada atividade mostra quem organiza, onde e quando, e de onde veio a informação; a próxima tem o horário circulado à mão. Para cada atividade o site gera:

- **Mensagem de WhatsApp** pronta para colar (com negrito, emojis e só os campos preenchidos);
- **Panfleto em PNG** (1080 × 1350 px) em três estilos (Folha do dia, Agenda do mês e Cartaz), com o céu da hora da atividade. Atividade cancelada vira um aviso de cancelamento.

Sem build, sem dependências para instalar: HTML, CSS e JavaScript puro. Nasceu de uma cópia do [Calendário de Luta](https://github.com/luizcarlos1405/calendario).

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

**Setores.** O filtro do site usa a coluna `Setor`. Os setores sugeridos têm cor fixa: `Partidos`, `Academia e Movimento Estudantil`, `Rural, indígena, luta pela terra`, `Sindicatos`, `Terceiro Setor`, `Órgãos do Estado`, `Movimentos Sociais` e `Outros` (os mesmos oito grupos do levantamento das organizações). Maiúsculas, acentos e pontuação não contam. Dá para usar outro nome: ele pega emprestada a cor de um setor sugerido que não está na planilha. Na planilha do Google, vale criar uma lista suspensa (Dados → Validação de dados) com esses nomes.

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

## Editando o comércio

A página Comércio lê `data/comercio.csv` (link em `COMMERCE_CSV_URL`, no `js/config.js`): as respostas do formulário de cadastro, do jeito que o Google Formulários grava, mais uma coluna `Categoria` preenchida pela equipe. Para ler direto da planilha de respostas, publique a aba como CSV (Arquivo → Compartilhar → Publicar na Web) e troque o link em `COMMERCE_CSV_URL`.

| coluna (pergunta do formulário) | o que o site faz |
|---|---|
| `Carimbo de data/hora` | nada |
| `Nome da empresa ou negócio` | obrigatória. O nome vai em maiúsculas; o que vier depois de " - " ou entre parênteses no fim vira subtítulo ("Sal da Terra - Mini Padaria Artesanal") |
| `Cidade e estado` | Dourados (com ou sem o estado) não aparece; outra cidade ganha uma etiqueta ("Fátima do Sul") |
| `Qual o Instagram da empresa?` | link, "@nome" ou só o nome viram link para o perfil. O que não for um nome de perfil aparece escrito como veio |
| `O que sua empresa oferece?` | o texto do negócio (só maiúsculas vira texto normal) |
| `Como podemos entrar em contato?` | celulares com DDD viram link de WhatsApp, com um botão para ligar; fixos viram link de ligação. Sem número, a resposta aparece escrita como veio ("99 food"). "Sim" e "Não" somem |
| `Sua empresa tem site ou outra rede social?` | links viram botões (Google, Facebook, TikTok, site). O resto aparece como veio, menos "não" e respostas que só repetem Instagram e WhatsApp |
| `Podemos incluir sua empresa na nossa planilha e compartilhar suas informações com a rede?` | só aparece quem respondeu **Sim** |
| `Categoria` | coluna da equipe, à direita das respostas: vira os filtros da página. Sugeridas, nesta ordem: Comida, Serviços, Celular e informática, Beleza, Arte e presentes, Embalagens (lista `COMMERCE_CATEGORIES`); outro nome também funciona |
| `Visível` | coluna da equipe, opcional: desmarcada esconde o negócio |
| `Notas internas` | coluna da equipe, opcional: o site ignora (mas ela fica pública no CSV publicado) |

Os nomes das colunas não precisam ser exatos: o site procura uma palavra-chave em cada uma ("nome", "instagram", "contato", "oferece", "site", "incluir", "categoria"…). O Google Formulários continua gravando as respostas novas nas colunas dele quando há colunas extras à direita; quem chega sem categoria aparece em "Todos" até a equipe preencher.

Corrija na planilha o que veio errado no formulário: o site mostra o que estiver lá. Na leva de 26/10/2026, por exemplo: o Instagram "Katiaboticário67" (o site lê katiaboticario67, sem acento; confirme o perfil), "Luciana Gonçalves (bolos)" no campo do Instagram (é o nome, não o perfil), o telefone "6699654-4029" (DDD 66) e "Fecebok".

Para mostrar o botão "Cadastrar meu negócio", coloque o link público do formulário em `COMMERCE_FORM_URL` (`js/config.js`).

## Rodando localmente

O navegador não deixa ler os CSVs abrindo as páginas direto do arquivo (`file://`), então suba um servidor simples:

```sh
python3 -m http.server 8000
```

e acesse <http://localhost:8000> (o Início; a agenda está em `/agenda.html` e o comércio em `/comercio.html`). Para ver o tema escuro ou outra hora do céu sem mexer no relógio, acrescente `?tema=escuro` (ou `claro`) e `?ceu=amanhecer` (ou `dia`, `entardecer`, `noite`) ao endereço.

## Publicando

Qualquer hospedagem estática serve (GitHub Pages, Netlify, Cloudflare Pages…): é só publicar a pasta inteira. No GitHub Pages: em *Settings → Pages*, escolha *Deploy from a branch*, o ramo `main` e a pasta `/ (root)`; o site fica em `https://<usuário>.github.io/<repositório>/` (ele funciona dentro de uma subpasta como essa).

O site está em https://nos.dourados.social (GitHub Pages, domínio no arquivo `CNAME`). Se o endereço mudar:

- troque `SITE_URL` em `js/config.js` (ele entra no fim de cada mensagem de WhatsApp, com o nome da página: `agenda.html`, `comercio.html`);
- no `<head>` das três páginas (`index.html`, `agenda.html`, `comercio.html`), troque o endereço nas tags da prévia do link (`canonical`, `og:url`, `og:image`…). Os endereços precisam ser completos: sem eles, o WhatsApp e as redes mostram a prévia só com título e descrição, sem a imagem `assets/og-image.png`.

## Funcionando sem internet e instalando como app

O site funciona sem internet e pode ser instalado como app no celular e no computador (PWA).

- **Sem internet.** O service worker (`sw.js`) busca tudo primeiro na rede e só usa a cópia guardada quando a rede falha: quem está online vê as planilhas atuais e a versão publicada do site (com o cache normal do navegador, de alguns minutos). Já na primeira visita ele guarda o site inteiro (as três páginas e o que elas carregam, a lista `SHELL`, no `sw.js`), a agenda e a lista do comércio. Sem conexão, o site abre com a última cópia salva e avisa: "Sem conexão. Mostrando a agenda salva em…" (ou "a lista salva"). O panfleto também é gerado sem internet.
- **Arquivos novos.** Se a página passar a carregar um arquivo novo (um módulo em `js/`, uma folha de estilo, uma fonte, um ícone), acrescente-o à lista `SHELL` do `sw.js`; senão ele só fica disponível sem internet a partir da segunda visita. Não é preciso mudar versão a cada publicação: cada resposta da rede atualiza a cópia.
- **App instalável.** O `manifest.webmanifest` tem o nome, as cores, os ícones e as capturas de tela que aparecem na hora de instalar. O app abre com o celular em pé ou deitado.
- **Ícones, prévia do link e capturas de tela** são gerados a partir de HTML: `assets/icon.html` (ícones do app e do navegador), `assets/og-image.html` (prévia do link, 1200 × 630) e o próprio site, num dia fixo (capturas). Depois de mudar o nome, a marca ou as cores, refaça tudo com `node assets/render.cjs` (ou só `icons`, `og` ou `shots`). Ele precisa do Playwright com um Chromium: na pasta do projeto, `npm i --no-save playwright-core` e `npx playwright-core install chromium` (ou aponte `PLAYWRIGHT_CORE` e `CHROMIUM` para os que você já tem).

## Personalizando

Tudo que costuma mudar fica em `js/config.js`:

- `CSV_URL`: de onde vem a agenda (arquivo local ou planilha publicada).
- `COMMERCE_CSV_URL`: de onde vem o comércio (as respostas do formulário).
- `COMMERCE_FORM_URL`: o link do formulário de cadastro, para o botão "Cadastrar meu negócio" (vazio esconde o convite).
- `COMMERCE_CATEGORIES`: as categorias sugeridas, na ordem dos filtros.
- `APP_NAME` / `APP_FULL_NAME`: o nome (NOS) e o nome por extenso.
- `CITY` / `HOME_CITY`: a cidade da agenda; atividades com `Cidade` vazia ou igual a ela são "daqui".
- `SITE_URL`: endereço do site, colocado no fim das mensagens.
- `SECTOR_SERIES`: a cor fixa de cada setor sugerido.
- `EXTRA_HOLIDAYS`: feriados locais, marcados como os nacionais (`js/holidays.js`).
- `ORG_NAMES`: nomes por extenso das organizações.

**Cores, tema claro e escuro, o céu.** Todas as cores do site e dos panfletos ficam em `css/theme.css`, em duas camadas: a paleta (as cores: barro, terra roxa, urucum, ipê-rosa, as faixas do céu de cada hora, as cores dos grupos) e os papéis (para que serve cada cor: o chão, os cartões, a tinta, o destaque, o céu…). O resto do CSS só usa os papéis. O tema escuro troca os papéis, não a paleta. Os panfletos não seguem o tema da página: cada um tem o céu da hora da atividade (amanhecer, dia, entardecer ou noite; sem horário, o dia), com o barro embaixo, ou a terra roxa à noite. As cores do `<meta name="theme-color">` das três páginas e `theme_color`/`background_color` no `manifest.webmanifest` não leem variáveis: se mudar o céu do dia ou o barro, troque-as à mão e refaça ícones, prévia do link e capturas com `node assets/render.cjs`.

Outros textos:

- Frase final das mensagens de WhatsApp: `CLOSING_LINE` (atividades) e `COMMERCE_CLOSING_LINE` (negócios indicados) em `js/whatsapp.js` (usam `APP_NAME`, `HOME_CITY` e `SITE_URL`).
- Para trocar o nome do site, além de `APP_NAME`/`APP_FULL_NAME`, mude o `<title>`, a descrição e as tags `og:` no `<head>` das três páginas e o `<h1>` escondido logo abaixo do `<body>`; o nome do app instalável fica no `manifest.webmanifest` e no `apple-mobile-web-app-title` das páginas. A marca é um desenho de NOS (`MARK` em `js/icons.js`): com outro nome, o site escreve a palavra no lugar dela até que se desenhe uma marca nova. Depois refaça os ícones e a prévia com `node assets/render.cjs`.
- Estilos de panfleto: lista `FLYER_STYLES` em `js/flyer.js`, com o visual em `css/flyers.css`. Cada panfleto é uma paisagem do mundo Céu · Terra: o céu da hora da atividade, a faixa no horizonte e a terra com a atividade. O `js/flyer.js` planeja as quebras de linha pelas larguras medidas das fontes; se trocar fonte ou peso, meça de novo com `.impeccable/flyer-metrics.html`.
- A faixa do horizonte é a imagem `assets/faixa.svg` (provisória). Quando a faixa das artistas da Reserva chegar, ela entra no lugar desse arquivo e o crédito no rodapé das três páginas muda junto.

## Design

O design está na pasta `design/`, em HTML, um arquivo por tela: a direção Céu · Terra aprovada (que o site segue), as outras direções da rodada (Pipas, guardada para depois, e a base Céu), a pesquisa da faixa, a marca (e as cinco propostas de onde ela saiu) e os quatro panfletos. Para ver todos lado a lado, como numa página do Figma, use o [htmlboard](https://github.com/luizcarlos1405/htmlboard) (precisa do Node.js): na pasta do projeto, rode `npx htmlboard design --root .` e abra `http://localhost:3000`. Arraste ou role para andar, Ctrl + rolagem (ou pinça) para dar zoom, clique duas vezes num design para enquadrá-lo; `/` busca e `?` mostra os atalhos. A tela acompanha os arquivos: salvou, atualizou.

As cores, fontes e cantos vêm das variáveis do `css/theme.css` (as direções da rodada têm cada uma sua folha de estilo em `design/assets/`). Para acrescentar um design, copie o arquivo mais parecido, edite e inclua uma linha em `design/designs.json`. Uma proposta nova fica num arquivo próprio, ao lado do design atual, até ser aprovada.

## Estrutura

```
index.html          o Início
agenda.html         a agenda
calendario.html     o endereço antigo da agenda (leva para agenda.html)
comercio.html       o comércio
css/theme.css       cores (paleta e papéis, claro e escuro, o céu de cada hora), fontes e cantos
css/style.css       estilos do site
css/flyers.css      os estilos de panfleto
manifest.webmanifest  o app instalável: nome, cores, ícones e capturas de tela
sw.js               o funcionamento sem internet
assets/icon.html    origem dos ícones do app e do navegador
assets/og-image.html  origem da prévia do link
assets/render.cjs   gera ícones, prévia do link e capturas de tela (e anota em cada PNG de onde ele vem)
assets/icons/       ícones e favicons
assets/faixa.svg    a faixa do horizonte (arte provisória)
assets/screenshots/ capturas de tela do app instalável
fonts/              fontes hospedadas no próprio site: Bricolage Grotesque e Inter (o site e os panfletos); licenças em fonts/OFL-*.txt (a da Barlow fica pela marca, desenhada a partir dela)
js/config.js        configurações (planilhas, nome, cidade, endereço do site, setores, feriados locais, nomes das organizações, categorias do comércio)
js/page.js          o que as três páginas compartilham (cabeçalho, avisos, leitura das planilhas, modo sem internet)
js/sky.js           o céu desta hora e o tema claro ou escuro
js/home.js          o Início
js/app.js           carrega a agenda e liga a interface da agenda
js/comercio.js      a página do comércio
js/businesses.js    lê as respostas do formulário (números, Instagram, links)
js/agenda.js        a lista: os dias e as atividades
js/month.js         o mês
js/flyer.js         estilos de panfleto e exportação PNG
js/whatsapp.js      montador das mensagens de WhatsApp (atividade e negócio)
js/colors.js        cores dos setores
js/holidays.js      feriados nacionais
js/icons.js         ícones, o desenho da marca NOS e os traços à mão
js/csv.js           leitor de CSV
js/events.js        normaliza linhas, datas e horários
js/vendor/          html-to-image, que gera o PNG (licença ao lado)
data/agenda.csv     a agenda provisória
data/comercio.csv   as respostas do formulário de cadastro (26/10/2026), com a categoria
design/             o design: uma página HTML por tela, listadas em design/designs.json
```

## Desenvolvimento

- `CLAUDE.md`: arquitetura, regras do código e decisões (em inglês, como todo o código).
- `PRODUCT.md`: para quem é o site e o que ele precisa fazer.
- `DESIGN.md` e `.impeccable/design.json`: o sistema visual ("Céu · Terra"); os desenhos estão em `design/`.
- `.impeccable/`: o resumo da direção visual, o laboratório de panfletos (`flyer-lab.html`), a medição das fontes dos panfletos (`flyer-metrics.html`) e o script de capturas para revisão (`capture.cjs`).
- `.claude/`: a skill [Impeccable](https://github.com/pbakaus/impeccable) para o Claude Code (Apache-2.0; licença e origem em `.claude/skills/impeccable/`), e `.mcp.json`, o MCP da Namecheap para quando o site tiver domínio.

