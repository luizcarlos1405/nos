---
version: 1
slug: "noticias-html"
primary_target: "noticias.html"
related_targets: ["index.html"]
---

# Surface: Notícias (noticias.html)

Scope: the news of the organizations: what they won, lost, warn about or report (Conquista, Perda, Alerta, Informe; public-service alerts too), picked by the NOS team from their posts and the survey reports; the story the team leads with, the weeks, filters by organization and kind, older months on asking, a story in the agenda's panel with its source post, its activity in the agenda and the WhatsApp message; and the third door on Início. Visitor mode: **Read**. Phone-first; the desk adds the panel as a column. Only current features.

Audience/job: people of the network and of the city learn what is at stake for the organizations of Dourados, see where each story came from, and pass it on to their WhatsApp groups.

Content truth: every story comes from a post (the link goes with it); claims and denunciations are attributed to whoever made them; nothing is supposed or invented; no photos or logos of the organizations (the post is where the images are). Losses and violence are told with respect, without sensationalism, victims named only as the organization published them.

## Direction contract

THESIS: The news lives on the same land under the sky of Dourados as the agenda: under the hour's sky strip and the woven horizon, the story the team leads with and then the weeks, each story a clear card whose headline is NOS speaking (Bricolage) and whose words of the organizations stay in Inter, attributed. Refuses the news portal (photos, carousels, "mais lidas", breaking banners), kickers above headlines, and colour coding wins and losses.

OWN-WORLD: Céu · Terra, as in the Agenda brief: the sky in flat bands by the hour (always the night in the dark theme), the provisional woven band as the horizon, the clay land (terra roxa at night). The page's colour of the landscape is the ipê-amarelo (#E0A40A, deep #7A5500, tint #F6DE9C; at night #F2C14E and #413010), shown only on Início's door and its icons. Urucum stays the one marking colour: the open page, the primary button; the hand marks keep their two jobs (the next activity, today) and never mark a story.

STORY: The visitor reads the lead story's headline and summary, scrolls the weeks, filters by an organization or a kind, opens a story to read it whole with who lived it and the source post, follows "Na agenda" to the activity it leads to, and sends it to WhatsApp; older months come with "Ver notícias de agosto".

FIRST VIEWPORT: Phone 390: "Notícias" in Bricolage on the sky strip with "N notícias · a mais recente de dd/mm", the band, the organization pill and the kind chips, then the lead card (headline Bricolage 800, summary, organization with its dot and full name, the kind as a quiet tag and the day), then "Semana passada" and its cards; the bar at the foot with four pages, Notícias open. A story opens as the bottom sheet. Desktop 1440: the list at left, the story open at right (the lead, until another is picked), as the agenda's panel.

FORM: the approved artboards design/noticias-*.html and design/inicio-noticias-*.html (approved 2026-11-05), over the site's own stylesheets.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, DESIGN.md, and the artboards kept as the reference.

## Unresolved
- Built on 2026-11-05 with 15 stories taken from the survey reports (quotes checked); new stories wait for the team's next scan (the flow is on the board: candidates in `checkup/<day>/noticias/`, the team chooses, a script writes them, the commit checks them). No merge script for the news yet.
- Decided in the build where the artboards were silent: the lead is the newest story marked Destaque among those the filters leave (none marked: no lead card); Início's door shows the same story (else the newest of the last two months); a day's stories keep the order the file has them; the window is the last three months; the kinds' chips are the kinds read, in NEWS_KINDS' order; the "Na agenda" link appears only when the activity is found in its month's agenda file.
- No share image (a flyer for a story) yet: the message is the share.
