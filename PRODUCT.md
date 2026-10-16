# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Static HTML/CSS + vanilla JS (ES modules), no build step, inherited from the "Calendário de Luta" project this one was copied from. One vendored dependency (`html-to-image`, in `js/vendor/`) for PNG export; self-hosted fonts. Must be served over HTTP (local: `python3 -m http.server`; production: any static host such as GitHub Pages/Netlify).

## Users

Two audiences, both phone-first:

- **The network:** people in Dourados' social movements, unions, student groups, Indigenous and quilombola organizations, cultural collectives, councils and parties. They check what the other organizations are doing and forward activities to their own WhatsApp groups. Coordinators and communication people also use it on desktop to produce material.
- **The city:** anyone in Dourados who wants to know what is happening and take part. They may not know the organizations, their acronyms or their jargon.

## Product Purpose

NOS Dourados (NOS = Núcleo de Organização Social; provisional name) is one permanent calendar of the activities of many organizations in Dourados/MS: assemblies, acts, plenaries, fairs, parties, trainings, deadlines. Each organization announces on its own channels (mostly Instagram); NOS gathers them in one place and turns any activity into ready-to-share material: a formatted WhatsApp message and a PNG flyer.

Success:
- an activist goes from "what's on?" to "sent to my group" in a couple of taps;
- someone from the city finds an activity, understands who organizes it, what it is and where it happens, and shows up.

## Positioning

Not one movement's agenda: the shared calendar of many organizations in one city. It gives visibility to struggles that rarely reach each other's channels (unions, students, Guarani-Kaiowá assemblies and retomadas, the quilombo, Afro-Brazilian culture, councils) and shows who organizes each activity and where the information came from.

## Operating Context

- Data comes from a CSV: `data/agenda.csv` during development; later a public Google Sheet published as CSV (`CSV_URL` in `js/config.js`). Editing the sheet updates the site.
- Rows are curated by the NOS team from the organizations' own posts; the first batch came from a survey of the organizations' public Instagram profiles (15/10/2026, kept outside this repository). Each row keeps the link to its source post.
- Focus is the city of Dourados. Occasionally an activity elsewhere in Mato Grosso do Sul appears (the Grande Dourados region, or a march in Campo Grande with buses from Dourados); it is always labeled with its city.
- Permanent, not a campaign: no countdown, no election end date.
- Used on mid-range Android phones, often outdoors, and shared through WhatsApp.
- Development (code, identifiers, comments) is in English; content and UI are in Brazilian Portuguese.

## Capabilities and Constraints

- CSV is Brazilian-formatted: `;` separator, UTF-8 with BOM, dd/mm/aaaa dates. Headers match without accents/case/spacing; `,` separator and Windows-1252 files are also accepted.
- Columns: `Título` and `Dia` (required, a full date with the year); `Dia final` (multi-day activities), `Horário`, `Término`, `Tipo` (free text), `Organização` (free text, several separated by commas, main organizer first), `Setor` (also accepted as `Categoria`; free text with a suggested vocabulary, the eight groups of the organizations survey: Partidos, Academia e Movimento Estudantil, Rural, indígena, luta pela terra, Sindicatos, Terceiro Setor, Órgãos do Estado, Movimentos Sociais, Outros), `Local`, `Cidade` (empty = Dourados), `Descrição`, `Contato`, `Link` (action link: sign-up, fundraiser, livestream), `Fonte` (the post the information came from), `Visível` (unchecked = draft, hidden), `Cancelado` + `Motivo Cancelamento` (stays on the calendar as cancelled; message and flyer become a notice).
- Views: upcoming agenda and month. Filters by sector and by organization; acronyms come with the organization's full name where it is known (`ORG_NAMES` in `js/config.js`, taken from the organizations' own profiles).
- Per activity: WhatsApp message (copy, open in WhatsApp via `wa.me`) and 1080×1350 PNG flyer in NOS styles; cancelled activities get a cancellation notice.
- Types, sectors and organizations are free text: any styling per value must work for unknown values.
- Invalid rows (no title / bad date) are skipped and reported in a notice; draft rows are skipped silently.
- Theming: every color is a CSS custom property, so other themes can be tried by swapping variables.
- Offline support (service worker) and installable PWA.

## Brand Commitments

- Name: "NOS", for Núcleo de Organização Social; the site is "NOS Dourados". Name and logo are provisional: keep both easy to swap (`APP_NAME` in `js/config.js`, the mark in `js/icons.js`).
- Colors: the palette of the Calendário de Luta is kept on purpose (red `#E4002B` as the dominant color without overwhelming, yellow `#FFC20E` reserved for the next activity, graphite `#1C1C1E`, the `#EFEFEC` ground, white paper, and eight series colors for the sectors). Everything else in the old interface (the metro line to election day, the countdown, the campaign slogan) is retired.
- No fabricated official assets: no invented logos of the organizations, photos or slogans attributed to them.

## Evidence on Hand

- The Instagram survey (21 reports about the organizations, 15/10/2026, kept outside this repository, next to the project folder as `../coleta-instagram/`): their recent and upcoming activities and the source post URLs. The provisional `data/agenda.csv` is built from them.
- No photos, no official visual identity, no domain yet.

## Product Principles

1. Share in two taps: the path from seeing an activity to sending it is the shortest thing in the app.
2. Phone first; desktop is the production bench.
3. The spreadsheet is the source of truth; nobody touches code to update the agenda.
4. Every activity says who organizes it and where the information came from.
5. Dourados first: other cities are the exception and always labeled.

## Accessibility & Inclusion

Readable outdoors on cheap phones: strong contrast, large tap targets, works on slow connections and offline. Plain language for people outside the movements: acronyms come with the organization's name where possible, and nothing assumes insider knowledge.
