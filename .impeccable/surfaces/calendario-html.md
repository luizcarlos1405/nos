---
version: 1
slug: "calendario-html"
primary_target: "calendario.html"
related_targets: []
---

# Surface: Agenda (calendario.html)

Scope: the agenda of the organizations (the page was called Calendário; the approved design names it Agenda; the address stays calendario.html): the list view and the month view, filters by group and organization, past days on request, the activity panel (WhatsApp message + flyer), and the 1080×1350 flyer PNGs. Visitor mode: **Operate**. Phone-first; desktop is the production bench. Responsive at every width in between. Only current features.

Audience/job: militants of Dourados' movements find what the other organizations are doing and forward it to their WhatsApp groups in two taps; people from the city find an activity, understand who organizes it, what it is and where, and show up.

## Direction contract

THESIS: The agenda lives on the land under the sky of Dourados: a strip of the hour's sky and the woven horizon on top, and below, on the clay (terra roxa at night), each day's activities as clear cards, the next one circled by hand in urucum. Refuses the grey list with thin dividers and coloured pills, the dashboard, and the folhinha's torn-off sheets.

OWN-WORLD: Two layers, sky and land, meeting at the woven band. Sky: flat bands, no gradients — light theme follows the clock (amanhecer 5–9h in Terra's golden bands #93C1E6 #BED6E8 #F0D5C6 #F8C095 #FBD789, then dia, entardecer, noite derived in the same warm register), dark theme is always night (#140D26 #1C1233 #271740 #361C48 #47214A with small stars #F6E6C6). The sun (#F4A11E disc inside an urucum hand loop) rises big from behind the band and runs off the edge; the moon (#F4DDB0) is small (about a fifth of the sun) and sits high among the stars. The horizon is the provisional woven band (taquara twill with urucum selvage, never a copied grafismo), credited as provisional; the real band is made, signed and paid for by artists of the Reserva Indígena de Dourados (design/faixa-pesquisa.html). Land: light clay #F2E3D7 with cards #FFFBF7 and warm ink #221714 / soft #6A4E44 by day; terra roxa #231311 with cards #301B17, ink #F7EBE3 / soft #CFB5A9 at night. Urucum (#C2410C light, #FF8A5C dark) is the one marking colour: the hand loop circles the next activity, a hand stroke underlines today, the primary button, the open tab. Sections take landscape colours (Agenda urucum, Comércio ipê-rosa #C03A73); organization groups are coloured dots, never shapes. Bricolage Grotesque (800 greeting, dates, page titles; 700–750 headings) and Inter for reading; rounded cards, standard controls.

STORY: The visitor sees today (underlined by hand) and the next activity (its time circled, "a próxima"), reads who organizes it, where and when, and sends it to WhatsApp (message or flyer) in two taps; filters by group or organization; switches to the month to plan; past days come back on request.

FIRST VIEWPORT: Phone 390: the top bar ("Agenda" in Bricolage, the count) on a 36px sky strip where the sun (or the small moon) rises behind the thin 16px band; Lista | Mês; the organization filter and the group chips with dots; then the days on the land: "Hoje · terça, 27/10" with the hand stroke under Hoje, the activities as cards (title, share button, time with the next one circled + "a próxima", organization with dot and full name, place), holidays as day lines. The panel opens as a bottom sheet with Mensagem | Panfleto. Month view: the month grid in the same world (Sunday first, holidays marked, multi-day bars in group colours, the next activity circled). Desktop 1440: the sky strip and the band under the top nav; filters, Lista | Mês and the list or month on the left; the persistent panel for the selected activity on the right.

FORM: Céu · Terra (see the Início brief), applied to the agenda's existing features; the approved artboard is design/direcao-ceu-terra-celular-agenda.html; the month view, the panel and the flyers follow its world.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved
- The flyers keep their layout engine (js/flyer.js plans line breaks from Barlow's glyph widths); a full flyer redesign in the new world is a follow-up.
- Name and mark are provisional (NOS = Núcleo de Organização Social).
