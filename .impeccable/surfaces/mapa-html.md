---
version: 1
slug: "mapa-html"
primary_target: "mapa.html"
related_targets: ["index.html"]
---

# Surface: Mapa (mapa.html)

Scope: the city's map of culture and of the movements. Each subject is a layer that turns on and off (Capoeira, the Mapa da Capoeira of COMAFRO Dourados; Batalhas de rima, Feiras, Espaços culturais, Sindicatos, Universidades and Poder público, from the NOS survey); the places are points with their layer's drawing, merged into counts where they crowd; a place opens in a card with its times, contacts, who checked it and when, "Enviar no WhatsApp" and "Como chegar"; the list of places per layer is the way in by keyboard and screen reader, and the page itself when the map can't open; and the fourth door on Início. Visitor mode: **Operate**. Phone-first; the desk keeps the list as a rail at the left and the place as a card at the right. Only current features.

Audience/job: someone from the city or the network finds where to train capoeira, where the batalha is, which fair is on, where a union or a public body sits, and gets there or sends it to a WhatsApp group; COMAFRO's capoeira map lives on inside NOS.

Content truth: every place comes from its layer's sheet (`data/mapa/<layer>.csv`) with exact coordinates (the source's own, or IBGE's CNEFE 2022 address file); capoeira is COMAFRO's sheet, checked by them; the other layers name their source post. A place nobody has reviewed for 12 months (`MAP_REVIEW_MONTHS`) leaves the map by itself. Aldeias, retomadas, terreiros, the quilombo, camps and homes stay off the map unless their people agree.

## Direction contract

THESIS: The land under the hour's sky is the city's map: under the header and the woven band, Dourados drawn in the site's own clay and terra roxa, the places as ink points carrying their layer's drawing (the berimbau, the microphone, the basket…), the layers as switches. Refuses the stock web map (Google's colours, coloured category pins, popups, a search box first) and colour-coded layers: the eight colours belong to the organizations' groups.

OWN-WORLD: Céu · Terra. The sky strip and the band on top; the land is the map (clay ground, a lighter built city, sage parks, the sky's blue water; at night terra roxa, indigo water and moonlit points); points are ink discs with clay drawings ringed in the card colour, counts are card discs in a double ring, the open place is a drop standing on its point; the Reserva Indígena is inhabited land with a dashed edge and its name, never a park. The page's colour of the landscape is the erva-mate (#6E8B2E, deep #4A651A, tint #DCE6B9; at night #B5D46A and #2C3414), on Início's door and the invitation. Urucum stays the one marking colour.

STORY: The visitor sees the city with its points, turns a layer off or on, taps a count to bring it apart, taps a point or a name in the list, reads who, when ("Treinos", "Quando"), where, the contacts and who checked it when, then sends it to WhatsApp or opens the way there. Places at one address name each other.

FIRST VIEWPORT: Phone 390: "Mapa" in Bricolage on the sky with "44 lugares em 7 camadas", the band, then the map down to the bar at the foot: "Lugares" and the layer chips (drawing, name, count) along its top, the points and counts of the city's core, the locate button and the small print at the bottom. A place opens as a sheet over the map's lower half, its drop above it. Desktop 1440: the map under the band edge to edge, the rail "Camadas" at the left (switches, counts, the lists folded), the place card at the right, zoom and locate at the bottom right.

FORM: idea C · Camadas of the round (`design/mapa-c-*.html`, approved 2026-11-11 with the berimbau redrawn), position 7 of my seven ordered structures, dealt by the surface roll, seed 9e880976; A's poster and B's "Hoje" are kept for later.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved
- The user approved "the design" and asked for the build without naming an idea; C was built as the skeleton (the suggestion made on the board). A's 1080×1350 poster and B's "Hoje" (the day's trainings by time) are not built.
- "Falta algum lugar?" (on the board) is built but hidden until `MAP_SUGGEST_URL` has a link: there is no form or contact of the team for it yet.
- Rows kept hidden (`Visível` FALSE) until someone confirms them: Batalha da 50, Feira Afro Zumbi Vive, Templo Girassol, Chácara do SIMTED, Sindicato dos Comerciários (no exact coordinates). No Partidos layer: only the PT had an address.
- COMAFRO's sheet was copied verbatim into `data/mapa/capoeira.csv` on 2026-11-11; their later edits reach NOS by copying it again. The future of mapacapoeira.org is COMAFRO's decision.
- MapLibre (about 800 KB) is not in the offline shell and the tiles come from OpenFreeMap (no key): offline, or when the tiles or WebGL fail, the list is the map.
- Decided in the build where the artboards were silent: points merge across layers (34px apart, 29px on phones, whose points are 26px); phones open on the places within 6 km of the centre, the desk within 9 km; a count whose places no zoom can part (one address) opens the first one's card, in the layers' order, and the card lists the others under "Também neste endereço"; on phones Back closes the place or the list; without the map the list is the page, each layer a heading over its places.
- The review periods are 12 months for the Mapa and for Comércio (one yearly check; 6 months would already drop 6 of COMAFRO's 18 places); rows past it are listed in the console for the team, not shown to visitors.
