# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Static HTML/CSS + vanilla JS (ES modules), no build step, inherited from the "Calendário de Luta" project this one was copied from. Two vendored dependencies in `js/vendor/`: `html-to-image` for PNG export and MapLibre GL JS (BSD-3) for the Mapa, whose vector tiles come from OpenFreeMap (OpenStreetMap's data, free, no key); self-hosted fonts. Must be served over HTTP (local: `python3 -m http.server`; production: any static host such as GitHub Pages/Netlify).

## Users

Two audiences, both phone-first:

- **The network:** people in Dourados' social movements, unions, student groups, Indigenous and quilombola organizations, cultural collectives, councils and parties. They check what the other organizations are doing and forward activities to their own WhatsApp groups. Coordinators and communication people also use it on desktop to produce material.
- **The city:** anyone in Dourados who wants to know what is happening and take part. They may not know the organizations, their acronyms or their jargon.
- **Capoeira groups** (since 2026-11-11): the Mapa's capoeira layer is the Mapa da Capoeira of COMAFRO Dourados, whose capoeira commission checks each group's places and training times; people looking for a group find where and when it trains near them.

## Product Purpose

NOS Dourados (NOS = Núcleo de Organização Social; provisional name) is one permanent calendar of the activities of many organizations in Dourados/MS: assemblies, acts, plenaries, fairs, parties, trainings, deadlines. Each organization announces on its own channels (mostly Instagram); NOS gathers them in one place and turns any activity into ready-to-share material: a formatted WhatsApp message and a PNG flyer.

The site has five pages, each a tab of the bar (the agenda from the start, Início since 2026-10-26, Notícias since 2026-11-05, Mapa since 2026-11-11, Editais since 2026-11-18, with a tab of its own since 2026-11-22): **Início** (`index.html`), the city's question, "O que está acontecendo em Dourados?", the very next activity, labelled as such, and what each page holds today; **Agenda** (`agenda.html`; called Calendário and served at `calendario.html` until 2026-10-27, an address that now forwards to `agenda.html`), the calendar above, as a list of days or a month; **Notícias** (`noticias.html`), what the organizations are living (wins, losses, alerts and reports, public-service alerts too), picked by the NOS team from their posts, each story with its source post, ready to send to WhatsApp; **Editais** (`editais.html`), the calls, prizes and grants with money for culture, sport and leisure, from Dourados, Mato Grosso do Sul and the country, by deadline, each with only the essentials (the deadline, how much, who can apply) and the links to the call and its official page, ready to send to WhatsApp; and **Mapa** (`mapa.html`), the city's map of culture and of the movements by layers that turn on and off (capoeira, batalhas de rima, feiras, cultural spaces, unions, universities, public bodies), each place with its times, contacts, the way there and a ready WhatsApp message. **Comércio** (`comercio.html`), the businesses that answered the network's registration form, was a page from 2026-10-26 to 2026-11-22: it left the site, and Editais took its tab; its page and the form's answers are only in git history.

Success:
- an activist goes from "what's on?" to "sent to my group" in a couple of taps;
- someone from the city finds an activity, understands who organizes it, what it is and where it happens, and shows up;
- someone looking for a capoeira class, a batalha de rima or a fair finds where and when it happens, and gets there (or sends it to a group) in one tap;
- someone from the network or the city learns what the organizations won, lost or are warning about, sees where it came from, and passes it on.
- a collective, an association, an artist or an athlete finds a call they can apply to before it closes, sees in one line whether it is for them and how much it gives, opens the call itself, and sends it to the group that should apply.

## Positioning

Not one movement's agenda: the shared calendar of many organizations in one city. It gives visibility to struggles that rarely reach each other's channels (unions, students, Guarani-Kaiowá assemblies and retomadas, the quilombo, Afro-Brazilian culture, councils) and shows who organizes each activity and where the information came from.

## Operating Context

- Data comes from CSV files committed with the site: the agenda is one file per month in `data/agenda/` (`AGENDA_DIR` in `js/config.js`), and a page reads only the months it shows, so a visit stays light however long the agenda grows. Editing a month's file and pushing updates the site; Google Sheets were dropped on 2026-11-05 (editing the files is simpler).
- Rows are curated by the NOS team from the organizations' own posts; the first batch came from a survey of the organizations' public Instagram profiles (15/10/2026, kept outside this repository). Each row keeps the link to its source post.
- Focus is the city of Dourados. Occasionally an activity elsewhere in Mato Grosso do Sul appears (the Grande Dourados region, or a march in Campo Grande with buses from Dourados); it is always labeled with its city.
- The Mapa reads one CSV per layer in `data/mapa/` (`MAP_LAYERS`): the capoeira layer is COMAFRO's own sheet, copied in as it is; the other layers come from the Instagram survey, each place with exact coordinates (the street address alone lands too far off; IBGE's census address file gives them) and its source post. Indigenous villages and retomadas, terreiros, the quilombo, camps and homes go on the map only by the NOS team's decision.
- The Mapa's places carry the date of their last review ("Última revisão"); one not reviewed for a year leaves the site by itself until someone confirms it. The agenda, the news and the calls age by their own dates.
- Permanent, not a campaign: no countdown, no election end date.
- Used on mid-range Android phones, often outdoors, and shared through WhatsApp.
- Development (code, identifiers, comments) is in English; content and UI are in Brazilian Portuguese.

## Capabilities and Constraints

- CSV is Brazilian-formatted: `;` separator, UTF-8 with BOM, dd/mm/aaaa dates. Headers match without accents/case/spacing; `,` separator and Windows-1252 files are also accepted.
- Columns: `Título` and `Dia` (required, a full date with the year); `Dia final` (multi-day activities), `Horário`, `Término`, `Tipo` (free text), `Organização` (free text, several separated by commas, main organizer first), `Setor` (also accepted as `Categoria`; free text with a suggested vocabulary, the nine groups of the organizations survey: Partidos, Academia e Movimento Estudantil, Rural, indígena, luta pela terra, Sindicatos, Terceiro Setor, Órgãos do Estado, Movimentos Sociais, Feiras, Outros), `Local`, `Cidade` (empty = Dourados), `Descrição`, `Contato`, `Link` (action link: sign-up, fundraiser, livestream), `Fonte` (the post the information came from), `Visível` (unchecked = draft, hidden), `Cancelado` + `Motivo Cancelamento` (stays on the calendar as cancelled; message and flyer become a notice).
- Views: the list of days (today and what comes; past days on request) and the month. Filters by group (sector) and by organization; acronyms come with the organization's full name where it is known (`ORG_NAMES` in `js/config.js`, taken from the organizations' own profiles). An activity without a time says "horário a confirmar", except periods of several days and deadlines, enrolment and consultation periods and campaigns (types Prazo and Campanha), which show none.
- Per activity: WhatsApp message (copy, open in WhatsApp via `wa.me`) and 1080×1350 PNG flyer in NOS styles; cancelled activities get a cancellation notice.
- Saving to the person's own calendar (since 2026-10-31): one activity ("Salvar na minha agenda": Google Agenda's filled-in form, the iPhone's own calendar, Outlook or an .ics file, the device's likely calendar first) or the whole agenda ("Salvar tudo na agenda": a subscription to the published `agenda.ics`, which keeps itself up to date and never duplicates itself). The site can't see anyone's calendar: it fills the entry in and the person confirms. Google allows subscriptions only from a computer; an iPhone opens calendars only from Safari.
- Notícias: one file per month in `data/noticias/` (like the agenda), each story with its headline (written by the team), day, kind (Conquista, Perda, Alerta, Informe), organizations, summary, story, source post and, when it has one, its activity in the agenda; the story the team leads with, then the weeks; filters by organization and kind; the last three months first, older ones on asking. Claims are attributed to whoever made them, and nothing goes in without its post.
- Mapa: the layers as switches (chips on phones, a rail on the desk), the places as points with their layer's drawing (never a colour: colours are the organizations' groups), counts where they crowd, a card per place (times, who, where, contacts, who checked it and when, "Enviar no WhatsApp", "Como chegar"), places at one address naming each other; the list of places per layer is the way in for keyboards and screen readers, and the page when the map can't open (no WebGL, offline).
- Navigation: one HTML file per page (Início, Agenda, Notícias, Mapa, Editais), linked from the header on the sky (a bar along the foot of the screen on phones), which stays at the top of the screen while the page scrolls (since 2026-11-06); it works on any static host (GitHub Pages). Only pages that exist get a link.
- Types, sectors and organizations are free text: any styling per value must work for unknown values.
- Invalid rows (no title / bad date) are skipped and reported in a notice; draft rows are skipped silently.
- Theming: every color is a CSS custom property in two layers (palette and roles), with a light and a dark theme (the system's by default, a button to switch, the choice remembered) and a sky that follows the hour.
- Offline support (service worker) and installable PWA.

## Brand Commitments

- Name: "NOS", for Núcleo de Organização Social; the site is "NOS Dourados". The name is provisional and the logo follows it: the mark (NOS with the O circled by hand, chosen on 2026-10-27) is a drawing of NOS in `js/icons.js`, so a new `APP_NAME` prints as text until a new mark is drawn; keep both easy to swap.
- The world: "Céu · Terra" (approved 2026-10-27): the sky of Dourados at this hour in flat bands, a woven band as the horizon, the land below (light clay by day, terra roxa at night). The palette of the Calendário de Luta is retired. Urucum (`#C2410C`, `#FF8A5C` at night) is the one marking color (the next activity, today, the primary action, the open page); the pages take colors of the landscape (Agenda urucum, Notícias ipê-amarelo, Mapa erva-mate, Editais ipê-rosa); the nine groups of the organizations are colored dots, never shapes; Bricolage Grotesque is the voice and Inter the reading text. Light and dark are both finished themes, not an afterthought. Nothing of the old campaign interface (the metro line to election day, the countdown, the slogan) comes back, and nothing should read as a startup, a city hall or an election campaign.
- The band: the woven band is provisional art, drawn only from the structure of a taquara twill, credited as provisional on every page. The real one will be made, signed and paid for by artists of the Reserva Indígena de Dourados (Kaiowá, Guarani Ñandeva and Terena), with their credit in the app. Never copy or imitate anyone's grafismo in the meantime.
- No fabricated official assets: no invented logos of the organizations, photos or slogans attributed to them.

## Evidence on Hand

- The Instagram survey (91 reports about the organizations by 18/11/2026, 21 at the first build on 15/10/2026, kept outside this repository, next to the project folder as `../coleta-instagram/`): their recent and upcoming activities and the source post URLs. The agenda's rows (`data/agenda/`) and the first stories of Notícias (`data/noticias/`, quotes checked on 2026-11-05) are built from them.
- COMAFRO Dourados' Mapa da Capoeira sheet (copied 2026-11-11: 20 rows of 11 groups, each with its last review; 18 shown) and the places of the other layers, found in the survey with IBGE's CNEFE 2022 address file (`data/mapa/`).
- No photos, no official visual identity. The domain is nos.dourados.social (GitHub Pages).

## Product Principles

1. Share in two taps: the path from seeing an activity to sending it is the shortest thing in the app.
2. Phone first; desktop is the production bench.
3. The CSV files are the source of truth: updating the agenda, the news, the calls or the map means editing a file and publishing, never touching the code.
4. Every activity, story and place says who it is about and where the information came from.
5. Dourados first: other cities are the exception and always labeled.

## Accessibility & Inclusion

Readable outdoors on cheap phones: strong contrast, large tap targets, works on slow connections and offline. Plain language for people outside the movements: acronyms come with the organization's name where possible, and nothing assumes insider knowledge.
