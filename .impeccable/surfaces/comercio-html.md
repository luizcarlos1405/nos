---
version: 1
slug: "comercio-html"
primary_target: "comercio.html"
related_targets: []
---

# Surface: Comércio (comercio.html)

Scope: the directory of the network's businesses, read from a public sheet (the answers of the registration form, plus an optional `Categoria` column kept by the NOS team): search, category chips, the A–Z sheets with each business and its contacts, the "Indicar no WhatsApp" message, the loading, empty, error and offline states, and the invitation to the form. Visitor mode: **Operate**. Phone-first; desktop is the same pad with the contacts in their own column and an information sheet beside it.

Audience/job: people from the network and from the city looking for someone who makes, sells or fixes something in Dourados (a cake, an electrician, a phone repair). They find the business, read what it offers and talk to it directly on WhatsApp or Instagram, or pass it on to a WhatsApp group. Business owners find how to get in.

Content truth: names, offers and contacts are what each business sent through the form, shown only when the consent answer is "Sim". The site cleans the form's noise (yes/no answers, repeated handles), formats phone numbers and links what it recognizes. No invented ratings, prices, photos or logos.

## Direction contract

THESIS: The network's businesses as the caderneta de telefones, the A–Z phone book every Brazilian home kept next to the folhinha: one sheet per letter, each business printed on its letter's sheet with its numbers in a label column, ready to call or pass on. Refuses the category default (a grid of same-size business cards with logos and star ratings) and the marketplace costume (carousels, banners, prices).

OWN-WORLD: The folhinha's world unchanged: red header card, white sheets bound by a red strip and a perforation row on the pale wall, 1px seams, 6px corners; the giant Barlow Condensed 800 letter in the folio column where the calendar prints its day; business names in Barlow Condensed 800 capitals like a shop's printed card; channel labels (WhatsApp, Instagram) in the folio column in the calendar's type-label voice; phone numbers in Barlow Condensed 700 tabular figures; graphite "on" states; no sector colours and no yellow.

STORY: The visitor types what they need or taps a category, scans the letter sheets, reads what each business offers, taps the number to open WhatsApp (or the phone glyph to call, or the handle to open Instagram), or taps the share glyph to send the business to a group; a business owner finds the form invitation.

FIRST VIEWPORT: Phone 390: the red header card with the brand and the folder tabs, Comércio cut into the wall; a search pill ("Buscar: bolo, eletricista, celular…"); the category chips; "17 negócios cadastrados na rede"; then sheet A: the giant A beside "4 negócios", and the first businesses with name, offer and their WhatsApp and Instagram rows. Desktop 1440: the same header with the tabs at its right; search and chips over one pad of letter sheets whose rows give the contacts their own column; at the right a sticky information sheet (what this list is, how to talk to a business, the form invitation). Signature move: the letter sheet, the giant letter in the folio column over channel labels and tabular numbers that read down the pad like a phone book.

FORM: Caderneta A–Z (alphabetical letter sheets under search and category chips), position 3 of seven on the ordered list, dealt by the roll with category shelves (position 7, the lead) and the business-card wall (position 5). Locked by the agent on the user's delegation ("decide yourself"): it is the only dealt structure whose grouping key every form answer carries (the shelves need a category the form doesn't ask). Seed key f9e673c9.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved
- The form's public link (for "Cadastrar meu negócio") is unknown: `COMMERCE_FORM_URL` in js/config.js stays empty and the invitation hides until it is set.
- `Categoria` is not a form question: the NOS team fills it in a column added to the right of the answers (or adds the question to the form).
- Some answers need a look in the sheet: an accented Instagram handle, a name typed in the Instagram field, a phone with DDD 66.
