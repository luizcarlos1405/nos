# NOS Dourados

A agenda e as notícias das organizações e movimentos de Dourados/MS, o mapa dos seus lugares e o comércio da rede, em um só lugar. NOS = Núcleo de Organização Social (nome provisório).

O site tem cinco páginas, cada uma um arquivo HTML:

- **Início** (`index.html`): o bom-dia (ou boa-tarde, boa-noite) sob o céu desta hora, a próxima atividade pousada na faixa, pronta para mandar no WhatsApp, e uma porta para cada página.
- **Agenda** (`agenda.html`): as atividades das organizações, em lista de dias ou no mês. Até 26/10/2026 era o `index.html`; até 27/10/2026 se chamava Calendário e ficava em `calendario.html`, endereço que agora leva para `agenda.html` (assim os links já compartilhados continuam funcionando).
- **Notícias** (`noticias.html`): o que as organizações estão vivendo (conquistas, perdas, alertas e informes, também os de serviço público), escolhido pela equipe nos posts delas, com o link de cada post.
- **Mapa** (`mapa.html`): o mapa da cidade com os lugares da cultura e dos movimentos, por camadas que se acendem e apagam (capoeira, batalhas de rima, feiras, espaços culturais, sindicatos, universidades e poder público), cada lugar com seus horários, contatos, o caminho até lá e a mensagem pronta para o WhatsApp. A camada da capoeira é o Mapa da Capoeira do COMAFRO Dourados.
- **Comércio** (`comercio.html`): os negócios que se cadastraram pelo formulário da rede, de A a Z.

No celular, a barra no pé da tela leva de uma página à outra; no computador, os links ficam no alto, sobre o céu. A marca NOS leva ao Início. São links comuns, então funcionam em qualquer hospedagem estática.

O visual é o "Céu · Terra": no alto, o céu de Dourados desta hora (amanhecer, dia, entardecer ou noite), em faixas de cor; uma faixa tecida faz o horizonte; embaixo, a terra (barro claro de dia, terra roxa à noite). O site tem tema claro e escuro: segue o do celular e tem um botão para trocar. A faixa é arte provisória, feita só da técnica do trançado: a definitiva vai ser criada, assinada e paga a artistas da Reserva Indígena de Dourados (veja `design/faixa-pesquisa.html`).

Cada atividade mostra quem organiza, onde e quando, e de onde veio a informação; a próxima tem o horário circulado à mão. Para cada atividade o site gera:

- **Mensagem de WhatsApp** pronta para colar (com negrito, emojis e só os campos preenchidos);
- **Panfleto em PNG** (1080 × 1350 px) em três estilos (Folha do dia, Agenda do mês e Cartaz), com o céu da hora da atividade. Atividade cancelada vira um aviso de cancelamento.

E cada pessoa pode **salvar na própria agenda** (o círculo de agenda em cada cartão, ou "Salvar na minha agenda" no painel): o Google Agenda já preenchido no Android e no computador, a tela de "adicionar ao Calendário" no iPhone, o Outlook ou um arquivo .ics. **"Salvar tudo na agenda"** assina a agenda inteira (o arquivo `agenda.ics`, publicado junto com o site): ela aparece como "NOS Dourados" na agenda da pessoa e se atualiza sozinha, sem repetir atividades. No iPhone e no Mac é um toque; no Google Agenda só dá pelo computador (regra do Google), então no Android o site manda o link para o WhatsApp da própria pessoa abrir no computador.

Sem build, sem dependências para instalar: HTML, CSS e JavaScript puro. Nasceu de uma cópia do [Calendário de Luta](https://github.com/luizcarlos1405/calendario).

## Editando a agenda

A agenda fica na pasta `data/agenda/` (`AGENDA_DIR`, no arquivo `js/config.js`), **um arquivo por mês**: o `2026-11.csv` tem as atividades que começam em novembro de 2026, pela coluna `Dia`. Assim o site baixa só os meses que mostra, e não a agenda inteira a cada visita.

- **Atividade nova:** vai no arquivo do mês do seu `Dia` (o primeiro dia). Uma atividade de vários dias fica no mês em que começa, mesmo que termine no outro. Se o mês ainda não tem arquivo, crie-o com a primeira linha (os nomes das colunas) copiada de outro mês: todos os arquivos têm as mesmas colunas, na mesma ordem.
- **Mudou de data para outro mês:** a linha muda de arquivo.
- **Ainda sem data:** fica em `sem-data.csv`, oculta (`Visível` desmarcado), até ganhar a data e ir para o mês dela.
- **`index.json`:** a lista dos meses que o site lê, refeita sozinha a cada commit (veja "A agenda assinada", abaixo). Não edite à mão.
- **Linha no arquivo errado:** o commit é recusado e diz para onde ela vai. `node tools/month-files.mjs --fix` muda as linhas de arquivo sozinho, do jeito que estão escritas; `node tools/month-files.mjs --check` só confere (os dois valem para a agenda e para as notícias).

Os arquivos seguem o formato brasileiro: colunas separadas por ponto e vírgula (`;`), datas no formato dia/mês/ano e acentos em UTF-8. Eles abrem direto no Excel, no LibreOffice e no Google Planilhas.

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

**Setores.** O filtro do site usa a coluna `Setor`. Os setores sugeridos têm cor fixa: `Partidos`, `Academia e Movimento Estudantil`, `Rural, indígena, luta pela terra`, `Sindicatos`, `Terceiro Setor`, `Órgãos do Estado`, `Movimentos Sociais` e `Outros` (os mesmos oito grupos do levantamento das organizações). Maiúsculas, acentos e pontuação não contam. Dá para usar outro nome: ele pega emprestada a cor de um setor sugerido que não está na agenda.

**Organizações.** O filtro "Organização" lista todos os nomes da coluna `Organização`, agrupados pelo setor. Escreva sempre do mesmo jeito (`SINTEF`, não às vezes `Sintef`) para não aparecerem duas vezes. Use a coluna para quem organiza (movimentos, sindicatos, coletivos); parceiros institucionais (universidade, órgãos públicos) cabem melhor na `Descrição`. Para quem não conhece as siglas, o site mostra o nome por extenso das organizações listadas em `ORG_NAMES` (`js/config.js`): acrescente as novas lá, com o nome que a própria organização usa.

**Atividades de vários dias.** Preencha `Dia` e `Dia final`. A atividade aparece na folha do primeiro dia com "até sáb, 24/10" e, enquanto estiver em andamento, continua na folha de hoje. No mês ela vira uma barra.

**Coluna `Visível`:** serve para guardar atividades ainda incompletas (rascunhos, ou anunciadas sem data) sem mostrá-las no site. No Google Planilhas, selecione a coluna e use **Inserir → Caixa de seleção**. Atenção: ao inserir, todas as caixas começam desmarcadas, então marque as atividades que já devem aparecer. Célula vazia ou planilha sem essa coluna = atividade visível.

**Colunas `Cancelado` e `Motivo Cancelamento`:** marque `Cancelado` quando uma atividade não for mais acontecer. Ela continua no site com o carimbo "Cancelada" e o motivo, e deixa de ser a "próxima". A mensagem de WhatsApp e o panfleto viram um aviso de cancelamento, para avisar os grupos que já tinham sido convidados.

**Notas internas.** O site ignora a coluna, mas os arquivos são publicados junto com o site e qualquer pessoa consegue lê-los: não escreva nada que não possa ser público.

Ao salvar no Excel, use **"CSV UTF-8 (delimitado por vírgulas)"** ou **"CSV (separado por vírgulas)"**: o site entende os dois, com `;` ou `,` como separador, e não importa se os cabeçalhos estão com ou sem acento, em maiúsculas ou minúsculas.

Linhas visíveis sem título ou com data inválida (ou sem o ano) não entram no commit: ele é recusado e diz qual linha, de qual arquivo, corrigir. Se mesmo assim uma chegar ao site, ela é ignorada e aparece num aviso no topo da página, com o arquivo e o número da linha ("2026-11.csv, linha 5").

### De onde vieram as atividades

As linhas atuais (até 05/11/2026 num arquivo só, o `data/agenda.csv`) foram montadas a partir de um levantamento dos perfis públicos de Instagram das organizações (15/10/2026, mantido fora deste repositório), com foco em Dourados; cada linha guarda o link do post de origem na coluna `Fonte`. Algumas linhas estão ocultas (`Visível` desmarcado): atividades ainda sem data certa e atividades de outras cidades sem participação de organizações de Dourados. A coluna `Notas internas` diz o que ainda precisa ser confirmado em cada linha.

## Editando as notícias

As notícias ficam em `data/noticias/` (`NEWS_DIR`), do mesmo jeito que a agenda: **um arquivo por mês**, pela coluna `Data` (o `2026-10.csv` tem as notícias de outubro de 2026), rascunhos sem data no `sem-data.csv`, e o `index.json` refeito sozinho a cada commit. O commit confere se cada notícia está no mês da sua `Data`, como faz com a agenda, e `node tools/month-files.mjs --fix` muda as linhas de arquivo.

| coluna | obrigatória | o que é |
|---|---|---|
| `Título` | sim | a manchete, escrita pela equipe: quem e o quê, em palavras simples |
| `Data` | sim | o dia do fato (ou do post, quando o fato não tem dia): `28/10/2026` |
| `Tipo` | não | `Conquista`, `Perda`, `Alerta` ou `Informe` (os filtros da página; outro tipo também aparece) |
| `Organização` | não | quem viveu a notícia; mais de uma separadas por vírgula, a principal primeiro |
| `Setor` | não | o grupo da organização, os mesmos da agenda (a cor do ponto) |
| `Resumo` | não | uma ou duas frases: o cartão, o começo da notícia aberta e a mensagem do WhatsApp |
| `Texto` | não | a notícia, em parágrafos separados por uma linha em branco; o que é denúncia ou opinião vai atribuído ("segundo o SIMTED…") |
| `Fonte` | não | o link do post de onde veio |
| `Atividade` | não | o código de uma atividade da agenda ligada à notícia (o fim do link dela, `ev-2026-11-07-…`): aparece como "Na agenda" |
| `Destaque` | não | marcada, a notícia abre a página, maior, e aparece na porta do Início |
| `Visível` | não | desmarcada = rascunho, não aparece |
| `Notas internas` | não | anotações da equipe (de qual relatório veio, o que falta confirmar); o arquivo é público |

Toda notícia vem de um post da organização (ou de um órgão público), com o link junto; nada suposto nem inventado. As primeiras 15 vieram dos relatórios do levantamento, com as citações conferidas.

## Varredura do Instagram

A agenda e as notícias saem dos posts das páginas listadas em `tools/instagram/pages.json`. Para ler o que há de novo:

```sh
python3 tools/instagram/scan.py
```

O script abre uma janela do navegador e passa por todas as páginas da lista, uma a uma, lendo só o que saiu desde a última varredura de cada uma: data, legenda, coautores, local, lembrete de evento, todas as imagens de cada post e o texto escrito nelas. Vai devagar de propósito, para o Instagram não bloquear. Na primeira vez, ou se o Instagram pedir, entre na sua conta na janela que abriu: o script espera e continua sozinho. Deixe a janela aberta até ele terminar; ela fecha sozinha. Precisa do `playwright-cli` (`npm i -g @playwright/cli`) e do `tesseract` com o português.

**O que ele guarda.** Tudo vai para `tools/instagram/dumps/<dia-hora>/`, fora do git: um `README.md` com o resumo, um arquivo por página e as imagens em `img/`. Daí é só pedir a um agente (ou ler você mesmo) para transformar o que interessa em atividades e notícias. Se a varredura parar no meio, rode de novo: cada página continua de onde parou.

**A lista.** São as páginas que acompanhamos: todas as organizações do levantamento que têm Instagram, tenham ou não aparecido na agenda ou nas notícias, mais as que a equipe acrescentar. Em `pages.json`, cada página é uma linha:

| campo | o que é |
|---|---|
| `handle` | o @ da página, sem a arroba |
| `name` | o nome da organização como aparece na agenda (coluna `Organização`) |
| `sector` | o setor dela, um dos oito da agenda |
| `lastScan` | a última varredura; o script preenche. Também aceita só a data (`2026-11-01`) |
| `lastPost` | o código do post mais novo que a última varredura viu; o script preenche |

Para **acrescentar** uma página, adicione uma linha com `handle`, `name` e `sector`: sem `lastScan`, a primeira leitura pega os últimos `newPageDays` dias (em `settings`, no começo do arquivo, junto de `maxPostsPerPage`, o máximo de posts novos lidos por página). Para **parar** de ler uma, apague a linha. `python3 tools/instagram/scan.py simteddourados` lê só essa página.

Depois da varredura o `pages.json` fica alterado, com as datas novas: faça o commit dele junto com as atividades.

## Editando o mapa

A página Mapa lê um arquivo por camada em `data/mapa/` (a lista `MAP_LAYERS`, no `js/config.js`, dá a ordem, o nome e o desenho de cada camada). Cada lugar precisa das **coordenadas exatas**: só com o endereço, o ponto cairia longe do lugar.

| coluna | o que o site faz |
|---|---|
| `Nome` | obrigatória: o grupo, a feira, o espaço ("Camará", "Feira dos Ipês"). Um nome com vários lugares aparece agrupado na lista |
| `Lugar` | onde fica, quando o lugar tem nome ("Casulo – Espaço de Cultura e Arte") |
| `Endereço` e `Bairro` | o endereço por escrito, no cartão e na mensagem |
| `Coordenadas` | obrigatória: "latitude, longitude", como o Google Maps copia ("-22.2158, -54.8353") |
| `Quando` | os dias e horários; vários separados por `;` ("Infantil: Qui 19h30 às 20h30; Juvenil e adulto: …") |
| `Descrição` | uma ou duas frases sobre o lugar |
| `Contato` | celulares com DDD viram link de WhatsApp; fixos, de ligação. Sem DDD, o número aparece como veio |
| `Instagram` e `Link` | o perfil e um link de ação |
| `Fonte` | o post ou o perfil de onde veio o lugar ("Ver a fonte") |
| `Última revisão` | obrigatória: o dia (dd/mm/aaaa) em que alguém conferiu o lugar com a fonte. Passado um ano sem revisão (`MAP_REVIEW_MONTHS`), o lugar sai do mapa sozinho, até alguém conferir de novo e escrever a data nova |
| `Visível` | desmarcada esconde o lugar |
| `Notas internas` | o site ignora (mas ela fica pública, como o arquivo) |

A camada da capoeira (`data/mapa/capoeira.csv`) é a planilha do Mapa da Capoeira do COMAFRO Dourados, com as colunas dela (`Grupo`, `Nome do Endereço`, `Nome do Responsável`, `Horários de Treino`, `Telefone de Contato`, `Instagram`, `Endereço`, `Coordenadas`, `Plus Code`, `Última revisão em`, `Mostrar no Mapa`): quem confere os grupos é o COMAFRO. Para atualizar, copie de novo a planilha deles para esse arquivo.

As coordenadas de um endereço de Dourados saem do Cadastro de Endereços do Censo 2022 do IBGE (o script `scripts/coordenadas.py` da pasta do levantamento, fora deste repositório) ou do Google Maps (botão direito no lugar, e copiar os números). Aldeias, retomadas, terreiros, o quilombo, acampamentos e casas de pessoas só entram no mapa com a concordância de quem vive lá.

Lugares no mesmo endereço (um grupo que treina na sede de um sindicato) aparecem como um ponto só, e o cartão de cada um mostra os outros. Uma camada nova é um arquivo novo em `data/mapa/`, com as mesmas colunas, e uma linha em `MAP_LAYERS` (com o desenho dela em `js/icons.js`). Para mostrar o convite "Falta algum lugar?", coloque em `MAP_SUGGEST_URL` (`js/config.js`) o link de um formulário ou de um contato da equipe.

## Editando o comércio

A página Comércio lê `data/comercio.csv` (link em `COMMERCE_CSV_URL`, no `js/config.js`): as respostas do formulário de cadastro, do jeito que o Google Formulários grava, mais uma coluna `Categoria` preenchida pela equipe. As respostas novas entram copiadas da planilha de respostas do formulário para esse arquivo (o site não lê planilhas do Google).

| coluna (pergunta do formulário) | o que o site faz |
|---|---|
| `Carimbo de data/hora` | a data da resposta: vale como revisão enquanto `Última revisão` estiver vazia |
| `Nome da empresa ou negócio` | obrigatória. O nome vai em maiúsculas; o que vier depois de " - " ou entre parênteses no fim vira subtítulo ("Sal da Terra - Mini Padaria Artesanal") |
| `Cidade e estado` | Dourados (com ou sem o estado) não aparece; outra cidade ganha uma etiqueta ("Fátima do Sul") |
| `Qual o Instagram da empresa?` | link, "@nome" ou só o nome viram link para o perfil. O que não for um nome de perfil aparece escrito como veio |
| `O que sua empresa oferece?` | o texto do negócio (só maiúsculas vira texto normal) |
| `Como podemos entrar em contato?` | celulares com DDD viram link de WhatsApp, com um botão para ligar; fixos viram link de ligação. Sem número, a resposta aparece escrita como veio ("99 food"). "Sim" e "Não" somem |
| `Sua empresa tem site ou outra rede social?` | links viram botões (Google, Facebook, TikTok, site). O resto aparece como veio, menos "não" e respostas que só repetem Instagram e WhatsApp |
| `Podemos incluir sua empresa na nossa planilha e compartilhar suas informações com a rede?` | só aparece quem respondeu **Sim** |
| `Categoria` | coluna da equipe, à direita das respostas: vira os filtros da página. Sugeridas, nesta ordem: Comida, Serviços, Celular e informática, Beleza, Arte e presentes, Embalagens (lista `COMMERCE_CATEGORIES`); outro nome também funciona |
| `Última revisão` | coluna da equipe: o dia (dd/mm/aaaa) em que alguém confirmou os dados com o negócio (vazia, vale a data da resposta). Um negócio sem revisão há mais de um ano (`COMMERCE_REVIEW_MONTHS`) sai da lista sozinho, até ser confirmado de novo e ganhar a data nova |
| `Visível` | coluna da equipe, opcional: desmarcada esconde o negócio |
| `Notas internas` | coluna da equipe, opcional: o site ignora (mas ela fica pública, como o arquivo) |

Os nomes das colunas não precisam ser exatos: o site procura uma palavra-chave em cada uma ("nome", "instagram", "contato", "oferece", "site", "incluir", "categoria"…). O Google Formulários continua gravando as respostas novas nas colunas dele quando há colunas extras à direita; quem chega sem categoria aparece em "Todos" até a equipe preencher.

Corrija na planilha o que veio errado no formulário: o site mostra o que estiver lá. Na leva de 26/10/2026, por exemplo: o Instagram "Katiaboticário67" (o site lê katiaboticario67, sem acento; confirme o perfil), "Luciana Gonçalves (bolos)" no campo do Instagram (é o nome, não o perfil), o telefone "6699654-4029" (DDD 66) e "Fecebok".

Para mostrar o botão "Cadastrar meu negócio", coloque o link público do formulário em `COMMERCE_FORM_URL` (`js/config.js`).

## Rodando localmente

O navegador não deixa ler os CSVs abrindo as páginas direto do arquivo (`file://`), então suba um servidor simples:

```sh
python3 -m http.server 8000
```

e acesse <http://localhost:8000> (o Início; a agenda está em `/agenda.html`, o mapa em `/mapa.html` e o comércio em `/comercio.html`). Para ver o tema escuro ou outra hora do céu sem mexer no relógio, acrescente `?tema=escuro` (ou `claro`) e `?ceu=amanhecer` (ou `dia`, `entardecer`, `noite`) ao endereço.

## Publicando

Qualquer hospedagem estática serve (GitHub Pages, Netlify, Cloudflare Pages…): é só publicar a pasta inteira. No GitHub Pages: em *Settings → Pages*, escolha *Deploy from a branch*, o ramo `main` e a pasta `/ (root)`; o site fica em `https://<usuário>.github.io/<repositório>/` (ele funciona dentro de uma subpasta como essa).

### A agenda assinada (`agenda.ics`)

"Salvar tudo na agenda" assina o arquivo `agenda.ics`, na raiz do site. Os apps de agenda (Google, iPhone, Outlook) buscam esse arquivo sozinhos, de tempos em tempos, então ele precisa estar publicado junto com o site. Ele é gerado a partir da agenda (de todos os meses) e fica no repositório; um *hook* do git o refaz a cada commit, a partir do que vai no commit, e o põe no mesmo commit, junto com o `data/agenda/index.json`, a lista dos meses. O mesmo *hook* confere se cada linha está no arquivo do seu mês. Quem muda os arquivos de `data/agenda/` não precisa lembrar de mais nada.

Num clone novo, ative os hooks uma vez (eles estão em `.githooks/`):

```sh
git config core.hooksPath .githooks
```

- `node tools/agenda-ics.mjs --check` diz se o `agenda.ics` está em dia, e `node tools/month-files.mjs --check` se as linhas (da agenda e das notícias) estão nos meses certos e os `index.json` em dia; sem `--check`, os dois refazem os arquivos na mão. Precisam do Node 22 ou mais novo, como o hook.
- Não edite o `agenda.ics` nem o `index.json` à mão. Num conflito de merge neles, resolva os arquivos dos meses e refaça os dois (`node tools/month-files.mjs && node tools/agenda-ics.mjs`) em vez de juntar os textos.
- Se a agenda tiver um erro que impeça o site de lê-la (uma linha no mês errado, um arquivo sem a coluna `Título` ou `Dia`, colunas diferentes entre os meses, uma linha visível sem título ou sem data), o commit é recusado, com a explicação.

O site está em https://nos.dourados.social (GitHub Pages, domínio no arquivo `CNAME`). Se o endereço mudar:

- troque `SITE_URL` em `js/config.js` (ele entra no fim de cada mensagem de WhatsApp, com o nome da página: `agenda.html`, `comercio.html`);
- no `<head>` das cinco páginas (`index.html`, `agenda.html`, `noticias.html`, `mapa.html`, `comercio.html`), troque o endereço nas tags da prévia do link (`canonical`, `og:url`, `og:image`…). Os endereços precisam ser completos: sem eles, o WhatsApp e as redes mostram a prévia só com título e descrição, sem a imagem `assets/og-image.png`.

## Funcionando sem internet e instalando como app

O site funciona sem internet e pode ser instalado como app no celular e no computador (PWA).

- **Sem internet.** O service worker (`sw.js`) busca tudo primeiro na rede e só usa a cópia guardada quando a rede falha: quem está online vê as planilhas atuais e a versão publicada do site (com o cache normal do navegador, de alguns minutos). Já na primeira visita ele guarda o site inteiro (as cinco páginas e o que elas carregam, a lista `SHELL`, no `sw.js`), a agenda e as notícias dos últimos meses, a lista do comércio e os lugares do mapa; os meses mais antigos ficam guardados depois de abertos uma vez. Sem conexão, o site abre com a última cópia salva e avisa: "Sem conexão. Mostrando a agenda salva em…" (ou "a lista salva"); um mês nunca aberto diz que não deu para carregá-lo. O panfleto também é gerado sem internet. O desenho do mapa vem da internet (OpenFreeMap): sem conexão, o Mapa mostra a lista dos lugares por camada.
- **Arquivos novos.** Se a página passar a carregar um arquivo novo (um módulo em `js/`, uma folha de estilo, uma fonte, um ícone), acrescente-o à lista `SHELL` do `sw.js`; senão ele só fica disponível sem internet a partir da segunda visita. Não é preciso mudar versão a cada publicação: cada resposta da rede atualiza a cópia.
- **App instalável.** O `manifest.webmanifest` tem o nome, as cores, os ícones e as capturas de tela que aparecem na hora de instalar. O app abre com o celular em pé ou deitado.
- **Ícones, prévia do link e capturas de tela** são gerados a partir de HTML: `assets/icon.html` (ícones do app e do navegador), `assets/og-image.html` (prévia do link, 1200 × 630) e o próprio site, num dia fixo (capturas). Depois de mudar o nome, a marca ou as cores, refaça tudo com `node assets/render.cjs` (ou só `icons`, `og` ou `shots`). Ele precisa do Playwright com um Chromium: na pasta do projeto, `npm i --no-save playwright-core` e `npx playwright-core install chromium` (ou aponte `PLAYWRIGHT_CORE` e `CHROMIUM` para os que você já tem).

## Personalizando

Tudo que costuma mudar fica em `js/config.js`:

- `AGENDA_DIR`: a pasta da agenda, um arquivo por mês (`data/agenda/`).
- `NEWS_DIR` e `NEWS_KINDS`: a pasta das notícias (`data/noticias/`) e os tipos de notícia, na ordem dos filtros.
- `COMMERCE_CSV_URL`: de onde vem o comércio (as respostas do formulário).
- `COMMERCE_FORM_URL`: o link do formulário de cadastro, para o botão "Cadastrar meu negócio" (vazio esconde o convite).
- `COMMERCE_CATEGORIES`: as categorias sugeridas, na ordem dos filtros.
- `COMMERCE_REVIEW_MONTHS` e `MAP_REVIEW_MONTHS`: quantos meses um negócio e um lugar do mapa ficam no site sem revisão (12).
- `MAP_LAYERS`: as camadas do mapa, na ordem dos filtros, cada uma com seu arquivo e seu desenho.
- `MAP_SUGGEST_URL`: o link do convite "Falta algum lugar?" (vazio esconde o convite).
- `MAP_TILES` / `MAP_GLYPHS`: de onde vêm o desenho do mapa e as letras dos nomes de ruas (OpenFreeMap, sem chave).
- `APP_NAME` / `APP_FULL_NAME`: o nome (NOS) e o nome por extenso.
- `CITY` / `HOME_CITY`: a cidade da agenda; atividades com `Cidade` vazia ou igual a ela são "daqui".
- `SITE_URL`: endereço do site, colocado no fim das mensagens.
- `TIME_ZONE`: o fuso da agenda (Dourados), para os horários na agenda de cada pessoa.
- `FEED_FILE`: o nome do arquivo da agenda assinada (`agenda.ics`).
- `SECTOR_SERIES`: a cor fixa de cada setor sugerido.
- `EXTRA_HOLIDAYS`: feriados locais, marcados como os nacionais (`js/holidays.js`).
- `ORG_NAMES`: nomes por extenso das organizações.

**Cores, tema claro e escuro, o céu.** Todas as cores do site e dos panfletos ficam em `css/theme.css`, em duas camadas: a paleta (as cores: barro, terra roxa, urucum, ipê-rosa, ipê-amarelo, as faixas do céu de cada hora, as cores dos grupos) e os papéis (para que serve cada cor: o chão, os cartões, a tinta, o destaque, o céu…). O resto do CSS só usa os papéis. O tema escuro troca os papéis, não a paleta. Os panfletos não seguem o tema da página: cada um tem o céu da hora da atividade (amanhecer, dia, entardecer ou noite; sem horário, o dia), com o barro embaixo, ou a terra roxa à noite. As cores do `<meta name="theme-color">` das cinco páginas e `theme_color`/`background_color` no `manifest.webmanifest` não leem variáveis: se mudar o céu do dia ou o barro, troque-as à mão e refaça ícones, prévia do link e capturas com `node assets/render.cjs`.

Outros textos:

- Frase final das mensagens de WhatsApp: `CLOSING_LINE` (atividades), `NEWS_CLOSING_LINE` (notícias), `MAP_CLOSING_LINE` (lugares do mapa) e `COMMERCE_CLOSING_LINE` (negócios indicados) em `js/whatsapp.js` (usam `APP_NAME`, `HOME_CITY` e `SITE_URL`).
- Para trocar o nome do site, além de `APP_NAME`/`APP_FULL_NAME`, mude o `<title>`, a descrição e as tags `og:` no `<head>` das cinco páginas e o `<h1>` escondido logo abaixo do `<body>`; o nome do app instalável fica no `manifest.webmanifest` e no `apple-mobile-web-app-title` das páginas. A marca é um desenho de NOS (`MARK` em `js/icons.js`): com outro nome, o site escreve a palavra no lugar dela até que se desenhe uma marca nova. Depois refaça os ícones e a prévia com `node assets/render.cjs`.
- Estilos de panfleto: lista `FLYER_STYLES` em `js/flyer.js`, com o visual em `css/flyers.css`. Cada panfleto é uma paisagem do mundo Céu · Terra: o céu da hora da atividade, a faixa no horizonte e a terra com a atividade. O `js/flyer.js` planeja as quebras de linha pelas larguras medidas das fontes; se trocar fonte ou peso, meça de novo com `.impeccable/flyer-metrics.html`.
- A faixa do horizonte é a imagem `assets/faixa.svg` (provisória). Quando a faixa das artistas da Reserva chegar, ela entra no lugar desse arquivo e o crédito no rodapé das cinco páginas muda junto.

## Design

O design está na pasta `design/`, em HTML, um arquivo por tela: a direção Céu · Terra aprovada (que o site segue), as outras direções da rodada (Pipas, guardada para depois, e a base Céu), a pesquisa da faixa, a marca (e as cinco propostas de onde ela saiu), os quatro panfletos e as três ideias do Mapa (a C, Camadas, é a que foi construída). Para ver todos lado a lado, como numa página do Figma, use o [htmlboard](https://github.com/luizcarlos1405/htmlboard) (precisa do Node.js): na pasta do projeto, rode `npx htmlboard design --root .` e abra `http://localhost:3000`. Arraste ou role para andar, Ctrl + rolagem (ou pinça) para dar zoom, clique duas vezes num design para enquadrá-lo; `/` busca e `?` mostra os atalhos. A tela acompanha os arquivos: salvou, atualizou.

As cores, fontes e cantos vêm das variáveis do `css/theme.css` (as direções da rodada têm cada uma sua folha de estilo em `design/assets/`). Para acrescentar um design, copie o arquivo mais parecido, edite (o tamanho vai na tag `<meta name="htmlboard">` do próprio arquivo) e inclua o nome do arquivo na seção certa de `design/designs.json`. Uma proposta nova fica num arquivo próprio, ao lado do design atual, até ser aprovada.

## Estrutura

```
index.html          o Início
agenda.html         a agenda
calendario.html     o endereço antigo da agenda (leva para agenda.html)
noticias.html       as notícias
mapa.html           o mapa
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
js/page.js          o que as páginas compartilham (cabeçalho, avisos, área de transferência, leitura das planilhas, modo sem internet)
js/month-files.js   lê uma pasta de arquivos por mês (a agenda, as notícias): o índice e só os meses que a página mostra
js/sky.js           o céu desta hora e o tema claro ou escuro
js/head.js          o topo que fica na tela quando a página rola (e dobra no computador e no Início)
js/home.js          o Início
js/app.js           carrega a agenda e liga a interface da agenda
js/noticias.js      a página das notícias
js/news.js          lê as linhas das notícias
js/mapa.js          a página do mapa: o mapa, as camadas, a lista e o cartão de cada lugar
js/places.js        lê os arquivos do mapa (as colunas do COMAFRO também)
js/map-style.js     as cores do mapa (o Céu · Terra, claro e escuro) para o MapLibre
js/review.js        a data da última revisão e o prazo para revisar (comércio e mapa)
js/comercio.js      a página do comércio
js/businesses.js    lê as respostas do formulário (números, Instagram, links)
js/agenda.js        a lista: os dias e as atividades
js/month.js         o mês
js/flyer.js         estilos de panfleto e exportação PNG
js/save-menu.js     "Salvar na minha agenda" e "Salvar tudo na agenda": as opções de cada aparelho
js/ics.js           a atividade como arquivo de agenda (.ics) e nos formulários do Google Agenda e do Outlook; a agenda inteira para assinar
tools/month-files.mjs  confere os arquivos por mês (agenda e notícias) e gera o index.json de cada pasta (--check: tudo em dia?; --fix: põe cada linha no seu mês)
tools/folders.mjs   as pastas de arquivos por mês e como ler cada uma
tools/agenda-ics.mjs  gera o agenda.ics a partir de todos os meses (--check: ele está em dia?)
tools/instagram/    a varredura do Instagram: a lista de páginas (pages.json), o script (scan.py) e o que ele leu (dumps/, fora do git)
agenda.ics          a agenda assinada por "Salvar tudo na agenda" (gerado: não edite à mão)
.githooks/          conferem os meses e refazem os index.json e o agenda.ics a cada commit (ative com git config core.hooksPath .githooks)
js/whatsapp.js      montador das mensagens de WhatsApp (atividade, notícia e negócio)
js/colors.js        cores dos setores
js/holidays.js      feriados nacionais
js/icons.js         ícones, o desenho da marca NOS e os traços à mão
js/csv.js           leitor de CSV
js/events.js        normaliza linhas, datas e horários
js/vendor/          html-to-image, que gera o PNG, e MapLibre GL, que desenha o mapa (licenças ao lado)
data/agenda/        a agenda: um arquivo por mês (AAAA-MM.csv), o sem-data.csv (rascunhos sem data) e o index.json (gerado)
data/noticias/      as notícias, do mesmo jeito
data/mapa/          os lugares do mapa: um arquivo por camada (capoeira.csv é a planilha do COMAFRO)
data/comercio.csv   as respostas do formulário de cadastro (26/10/2026), com a categoria e a última revisão
design/             o design: uma página HTML por tela, agrupadas em design/designs.json
```

## Desenvolvimento

- `CLAUDE.md`: arquitetura, regras do código e decisões (em inglês, como todo o código).
- `PRODUCT.md`: para quem é o site e o que ele precisa fazer.
- `DESIGN.md` e `.impeccable/design.json`: o sistema visual ("Céu · Terra"); os desenhos estão em `design/`.
- `.impeccable/`: o resumo da direção visual, o laboratório de panfletos (`flyer-lab.html`), a medição das fontes dos panfletos (`flyer-metrics.html`) e o script de capturas para revisão (`capture.cjs`).
- `.claude/`: a skill [Impeccable](https://github.com/pbakaus/impeccable) para o Claude Code (Apache-2.0; licença e origem em `.claude/skills/impeccable/`), e `.mcp.json`, o MCP da Namecheap para quando o site tiver domínio.

