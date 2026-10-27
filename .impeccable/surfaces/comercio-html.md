---
version: 1
slug: "comercio-html"
primary_target: "comercio.html"
related_targets: []
---

# Surface: Comércio (comercio.html)

Scope: the directory of the network's businesses (the answers of the registration form). Paused since 2026-10-27: the page shows "Em breve" ("Estamos coletando as informações e organizando antes de mostrá-las aqui") and doesn't read data/comercio.csv; the list code, the side sheet and the data stay for when it returns (reverting commit 29dcdeb). Visitor mode: **Operate**. Phone-first. Only current features.

Audience/job: people from the network and from the city looking for someone who makes, sells or fixes something in Dourados; business owners find how to get in. While paused: they learn the list is coming.

Content truth: names, offers and contacts are what each business sent through the form, shown only with consent. No invented ratings, prices, photos or logos.

## Direction contract

THESIS: Comércio lives on the same land under the sky: while paused, a calm "Em breve" on the clay under the hour's sky and the woven horizon; when it returns, the businesses as clear cards with their contacts ready to call or pass on. Refuses the marketplace (carousels, banners, prices, ratings) and the folhinha's phone-book sheets.

OWN-WORLD: Two layers, sky and land, meeting at the woven band. Sky: flat bands, no gradients — light theme follows the clock (amanhecer 5–9h in Terra's golden bands #93C1E6 #BED6E8 #F0D5C6 #F8C095 #FBD789, then dia, entardecer, noite derived in the same warm register), dark theme is always night (#140D26 #1C1233 #271740 #361C48 #47214A with small stars #F6E6C6). The sun (#F4A11E disc inside an urucum hand loop) rises big from behind the band and runs off the edge; the moon (#F4DDB0) is small (about a fifth of the sun) and sits high among the stars. The horizon is the provisional woven band (taquara twill with urucum selvage, never a copied grafismo), credited as provisional; the real band is made, signed and paid for by artists of the Reserva Indígena de Dourados (design/faixa-pesquisa.html). Land: light clay #F2E3D7 with cards #FFFBF7 and warm ink #221714 / soft #6A4E44 by day; terra roxa #231311 with cards #301B17, ink #F7EBE3 / soft #CFB5A9 at night. Urucum (#C2410C light, #FF8A5C dark) is the one marking colour: the hand loop circles the next activity, a hand stroke underlines today, the primary button, the open tab. Sections take landscape colours (Agenda urucum, Comércio ipê-rosa #C03A73); organization groups are coloured dots, never shapes. Bricolage Grotesque (800 greeting, dates, page titles; 700–750 headings) and Inter for reading; rounded cards, standard controls.

STORY: Today the visitor learns the list is coming and what it will be; when it returns, they search or pick a category, read what each business offers, open WhatsApp or Instagram, or pass a business on to a group.

FIRST VIEWPORT: Phone 390: the top bar ("Comércio" in Bricolage) on the sky strip with the thin band; on the land, the "Em breve" panel (the store icon, "Em breve", the sentence) and the side information (what this list is, how to talk to a business). Desktop 1440: the sky strip and band under the top nav; the "Em breve" panel with the information beside it. The paused list keeps working code styled in the same world (search field, category chips without colour, businesses as cards with name, offer and contact rows).

FORM: Céu · Terra (see the Início brief), applied to Comércio's existing (paused) state.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved
- The list is paused until the businesses are collected and organized (revert commit 29dcdeb to bring it back).
- The form's public link (COMMERCE_FORM_URL) is still empty, so the invitation stays hidden.
- `Categoria` is filled by the NOS team, not asked by the form.
