---
name: NOS Dourados
description: "The shared agenda of Dourados' organizations under the sky of this hour: flat sky bands over a woven horizon, the land below, the next activity circled by hand in urucum."
colors:
  # The land by day
  clay: "#F2E3D7"
  clay-card: "#FFFBF7"
  clay-card-hover: "#FFF4EC"
  clay-fill: "#F4E4D9"
  clay-line: "#E9D5C8"
  clay-faded: "#D8C2B5"
  ink: "#221714"
  ink-soft: "#6A4E44"
  white: "#FFFFFF"
  earth-shadow: "#4A2212"
  # The land at night
  terra-roxa: "#231311"
  terra-roxa-card: "#301B17"
  terra-roxa-card-hover: "#37201B"
  terra-roxa-fill: "#40261F"
  terra-roxa-line: "#4A2F28"
  terra-roxa-faded: "#6B4A40"
  moonlit: "#F7EBE3"
  moonlit-soft: "#CFB5A9"
  night-shade: "#0E0706"
  # Urucum, the one marking colour
  urucum: "#C2410C"
  urucum-text: "#A3360A"
  urucum-tint: "#F9D9C8"
  urucum-door: "#F7CDB8"
  urucum-night: "#FF8A5C"
  urucum-night-tint: "#5A2A1E"
  # Ipê-rosa, Comércio's colour
  ipe-rosa: "#C03A73"
  ipe-rosa-text: "#A12E5F"
  ipe-rosa-tint: "#F3C8DA"
  ipe-rosa-night: "#F58AB3"
  ipe-rosa-night-tint: "#522036"
  # The sky, five bands from the top (1) to the horizon (5), at each hour
  dawn-1: "#93C1E6"
  dawn-2: "#BED6E8"
  dawn-3: "#F0D5C6"
  dawn-4: "#F8C095"
  dawn-5: "#FBD789"
  dawn-ink-soft: "#4B362D"
  day-1: "#6FAEE3"
  day-2: "#9DCAEE"
  day-3: "#CDE2EE"
  day-4: "#F1E3CF"
  day-5: "#F6D2A2"
  day-ink-soft: "#45312A"
  dusk-1: "#8C99D6"
  dusk-2: "#B8A2D4"
  dusk-3: "#EAABAA"
  dusk-4: "#F5A275"
  dusk-5: "#F7C460"
  dusk-ink-soft: "#3A2730"
  night-1: "#140D26"
  night-2: "#1C1233"
  night-3: "#271740"
  night-4: "#361C48"
  night-5: "#47214A"
  night-ink-soft: "#D8C6D3"
  sun: "#F4A11E"
  moon: "#F4DDB0"
  star: "#F6E6C6"
  # The eight groups of the organizations: by day, and lighter at night
  group-1: "#0455A1"
  group-2: "#00875A"
  group-3: "#9B3894"
  group-4: "#00808A"
  group-5: "#C25700"
  group-6: "#5E6A71"
  group-7: "#7A4E2D"
  group-8: "#C2185B"
  group-night-1: "#5B9BE6"
  group-night-2: "#3DBA8A"
  group-night-3: "#C77BC0"
  group-night-4: "#2DB3BC"
  group-night-5: "#E8873A"
  group-night-6: "#9AA7AF"
  group-night-7: "#B98A66"
  group-night-8: "#E9608F"
typography:
  display:
    fontFamily: "Bricolage Grotesque, Inter, system-ui, sans-serif"
    fontSize: "3.25rem"
    fontWeight: 800
    lineHeight: 0.923
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Bricolage Grotesque, Inter, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 800
    lineHeight: 1.13
    letterSpacing: "-0.025em"
  date:
    fontFamily: "Bricolage Grotesque, Inter, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.015em"
    fontFeature: "tnum"
  title:
    fontFamily: "Bricolage Grotesque, Inter, system-ui, sans-serif"
    fontSize: "1.1875rem"
    fontWeight: 750
    lineHeight: 1.26
    letterSpacing: "-0.015em"
    fontFeature: "tnum"
  activity-lead:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.015em"
  activity:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.45
  meta:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.36
  button:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 600
    lineHeight: 1.2
rounded:
  sm: "6px"
  default: "12px"
  card: "18px"
  sheet: "24px"
  pill: "999px"
  circle: "50%"
spacing:
  gutter-narrow: "12px"
  gutter: "16px"
  gutter-wide: "24px"
  gutter-desk: "32px"
  stack: "8px"
  days: "18px"
components:
  button-primary:
    backgroundColor: "{colors.urucum}"
    textColor: "{colors.white}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: "0 18px"
    height: "44px"
  button-primary-night:
    backgroundColor: "{colors.urucum-night}"
    textColor: "{colors.terra-roxa}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: "0 18px"
    height: "44px"
  button-outlined:
    backgroundColor: "{colors.clay-card}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: "0 18px"
    height: "44px"
  button-outlined-done:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.clay-card}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: "0 18px"
    height: "44px"
  icon-button:
    textColor: "{colors.ink}"
    rounded: "{rounded.circle}"
    size: "44px"
  share-circle:
    backgroundColor: "{colors.clay-fill}"
    textColor: "{colors.ink}"
    rounded: "{rounded.circle}"
    size: "40px"
  chip:
    backgroundColor: "{colors.clay-card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0 14px"
    height: "36px"
  chip-pressed:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.clay-card}"
    rounded: "{rounded.pill}"
    padding: "0 14px 0 10px"
    height: "36px"
  segment-chosen:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.clay-card}"
    rounded: "{rounded.pill}"
    padding: "0 12px"
    height: "42px"
  input-search:
    backgroundColor: "{colors.clay-card}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.pill}"
    padding: "0 48px 0 46px"
    height: "48px"
  tag:
    backgroundColor: "{colors.clay-card}"
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.pill}"
    padding: "0 8px"
    height: "22px"
  tag-cancelled:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.clay-card}"
    rounded: "{rounded.pill}"
    padding: "0 8px"
    height: "22px"
  group-dot:
    backgroundColor: "{colors.group-1}"
    rounded: "{rounded.circle}"
    size: "8px"
  card-activity:
    backgroundColor: "{colors.clay-card}"
    textColor: "{colors.ink}"
    typography: "{typography.activity}"
    rounded: "{rounded.card}"
    padding: "14px 14px 15px 16px"
  card-activity-night:
    backgroundColor: "{colors.terra-roxa-card}"
    textColor: "{colors.moonlit}"
    typography: "{typography.activity}"
    rounded: "{rounded.card}"
    padding: "14px 14px 15px 16px"
  door-agenda:
    backgroundColor: "{colors.urucum-door}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "12px 12px 14px 14px"
  door-agenda-night:
    backgroundColor: "{colors.urucum-night-tint}"
    textColor: "{colors.moonlit}"
    rounded: "{rounded.card}"
    padding: "12px 12px 14px 14px"
  door-commerce:
    backgroundColor: "{colors.ipe-rosa-tint}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "12px 12px 14px 14px"
  door-commerce-night:
    backgroundColor: "{colors.ipe-rosa-night-tint}"
    textColor: "{colors.moonlit}"
    rounded: "{rounded.card}"
    padding: "12px 12px 14px 14px"
  soon-panel:
    backgroundColor: "{colors.ipe-rosa-tint}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "24px 22px 26px"
  nav-bar:
    backgroundColor: "{colors.clay-card}"
    textColor: "{colors.ink-soft}"
    height: "64px"
  nav-pill-current:
    backgroundColor: "{colors.urucum-tint}"
    textColor: "{colors.urucum-text}"
    rounded: "{rounded.pill}"
    width: "56px"
    height: "32px"
  sheet:
    backgroundColor: "{colors.clay-card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sheet}"
---

# Design System: NOS Dourados

## Overview

**Creative North Star: "Céu · Terra"**

NOS opens on the sky over Dourados at this hour and the land beneath it. Every page stacks the same three layers: the header is the sky of this hour, painted in five flat bands (amanhecer, dia, entardecer and noite by the clock in the light theme, always the night in the dark theme); the woven band under it is the horizon; below lies the land, light clay by day and terra roxa at night, where the activities, the doors and the businesses rest as clear rounded cards. The sun, a disc inside an urucum loop drawn by hand, rises big from behind the band and runs off the edge; at night a small moon, about a fifth of the sun, sits high among the stars.

The hand is the system's signature. The same urucum pen that draws the sun's loop and the O of the NOS mark circles the next activity and underlines today: urucum is the one marking colour, and it marks rather than fills. Each page wears one colour of the landscape on its door and its own panel (Agenda urucum, Comércio ipê-rosa); the organizations' eight groups are coloured dots. Bricolage Grotesque is NOS's voice (the greeting, dates, page titles, day heads) and Inter the reading text and the controls. The density is calm and phone-first: lists of cards with 44px targets on the phone, a production bench on the desk, never a dashboard.

The world refuses the hero banner over icon tiles, the dashboard, the grey list with thin dividers and coloured pills, the marketplace (carousels, banners, prices, ratings), and the Folhinha's notepad and torn-off sheets; nothing of the old campaign interface (the metro line to election day, the countdown, the slogan) comes back, and nothing should read as a startup, a city hall or an election campaign. Light and dark are both finished themes. The approved artboards (`design/direcao-ceu-terra-*.html`) also draw sections and a search that were deliberately not built; where they and the build diverge, the build is the reference. The flyers carry the same world into a picture: the sky of the activity's hour over the band and the land (see Components).

**Key Characteristics:**
- Sky over land on every page, meeting at a woven horizon.
- The sky in flat bands by the hour: hard stops, never a soft gradient.
- One marking colour, urucum, drawn by hand: loops and strokes, not badges.
- Pages in colours of the landscape; the organizations' groups as dots.
- Bricolage Grotesque 800 for the voice, Inter for reading; tabular dates.
- Rounded cards and standard controls: pills, circles, 18px cards.
- A soft earth-tinted shadow by day, a 1px line at night.
- One authored motion: the home's sun rises.

## Colors

A palette taken from the place: clay and terra roxa for the land, urucum and ipê-rosa from its plants, and the sky of Dourados at four hours. Every colour is a palette value in `css/theme.css` (`--color-*`, named for what it is) and reaches the pages only through a role (`--role-*`, named for what it does); the light and dark themes and the hour's sky swap the roles, never the palette.

### Primary
- **Urucum** (#C2410C): the one marking colour. It fills the primary button (white text, 5.18:1) and strokes the hand marks on the land: the loop around the next activity, the stroke under today. On the sky it is the hand that draws the sun's loop, the O of the mark and the open page's 3px underline.
- **Deep Urucum** (#A3360A): urucum as words and as focus: "a próxima", the links to more of the agenda, the open page's label in the phone bar, the 2px focus ring (5.42:1 on clay, 6.60:1 on cards).
- **Urucum Tint** (#F9D9C8): text selection, the open page's pill in the phone bar, the error notice.
- **Agenda Urucum** (#F7CDB8): the Agenda's door on the home.
- **Night Urucum** (#FF8A5C): urucum in the dark theme and on the night sky: the button (with terra roxa text, 7.71:1), the hand marks, the focus ring.
- **Night Urucum Tint** (#5A2A1E): selection, the phone bar's pill and the Agenda's door at night.

### Secondary
- **Ipê-Rosa** (#C03A73): Comércio's colour of the landscape and the named source of its shades; the site paints only the deep and tint shades below.
- **Deep Ipê-Rosa** (#A12E5F): Comércio's icons, and the colour mixed into the text of its panel and door.
- **Ipê-Rosa Tint** (#F3C8DA): Comércio's door and its "Em breve" panel (ink on it: 11.73:1).
- **Night Ipê-Rosa** (#F58AB3) and **Night Ipê-Rosa Tint** (#522036): the same two jobs at night.

### Tertiary
The sky: five bands from the top (1) to the horizon (5) at each hour, and what shines in it.
- **Amanhecer** (#93C1E6, #BED6E8, #F0D5C6, #F8C095, #FBD789; 5–9h): morning blue warming to rose, apricot and gold; its soft ink is #4B362D. The icons and the link preview always show this sky.
- **Dia** (#6FAEE3, #9DCAEE, #CDE2EE, #F1E3CF, #F6D2A2; 9–16h): a clear deep blue over a warm, dusty horizon; soft ink #45312A. Its top band is the static light browser colour and the manifest's theme colour.
- **Entardecer** (#8C99D6, #B8A2D4, #EAABAA, #F5A275, #F7C460; 16–19h): dusk violet, lilac, rose, orange and gold; soft ink #3A2730.
- **Noite** (#140D26, #1C1233, #271740, #361C48, #47214A; 19–5h, and always in the dark theme): deep indigo warming to plum; soft ink #D8C6D3, ink Moonlit.
- **Sun** (#F4A11E), **Moon** (#F4DDB0) and **Star** (#F6E6C6): the astro's disc by day and at night, and the small stars of the night.

### Neutral
- **Clay** (#F2E3D7): the land by day, the page below the horizon; the manifest's background.
- **Warm White Card** (#FFFBF7): cards, fields, chips, the panel and the phone bar by day; the text on ink fills.
- **Card Hover** (#FFF4EC): hover on cards, chips and outlined controls.
- **Clay Fill** (#F4E4D9): the tonal fill: share circles, the chat behind the message, the month's days off, the city tag.
- **Clay Line** (#E9D5C8): hairlines: the outlines of chips, fields and outlined buttons, dividers, empty cards, the grabber.
- **Faded Clay** (#D8C2B5): the scrollbar.
- **Warm Ink** (#221714): text (13.95:1 on clay); the chosen segment and the pressed chips; the sky's ink in the three light skies.
- **Earth Soft Ink** (#6A4E44): secondary text and icons, tinted from the earth and never grey (6.01:1 on clay); the quiet selection ring.
- **White** (#FFFFFF): the text on the urucum button.
- **Earth Shadow** (#4A2212): the colour of every shadow by day.
- **Terra Roxa** (#231311): the land at night; the text on Night Urucum and on Moonlit fills.
- **Terra Roxa Card** (#301B17), **Card Hover** (#37201B), **Fill** (#40261F), **Line** (#4A2F28) and **Faded** (#6B4A40): the same jobs at night; the line also stands in for the cards' shadow.
- **Moonlit** (#F7EBE3) and **Moonlit Soft** (#CFB5A9): text and secondary text at night (15.30:1 and 8.37:1); Moonlit is also the night sky's ink.
- **Night Shade** (#0E0706): the scrim and the sheet's shadow at night.
- The washes are mixes, not palette values: the hover wash is the ink at 7% (Moonlit at 9% at night), the sky's wash the ink at 9% (Moonlit at 12%), the scrim the ink at 50% (Night Shade at 70%).

### Groups
The eight groups of the organizations, one series each, by day and lighter at night (`js/colors.js` sets the group's series as `--sector` on the node): azul (#0455A1 / #5B9BE6), verde (#00875A / #3DBA8A), lilás (#9B3894 / #C77BC0), turquesa (#00808A / #2DB3BC), laranja (#C25700 / #E8873A), prata (#5E6A71 / #9AA7AF), marrom (#7A4E2D / #B98A66), magenta (#C2185B / #E9608F). An activity without a group takes the soft ink. Comércio's categories carry no colour.

### Named Rules
**The One Marking Colour Rule.** Urucum marks; it never fills an area. At full strength it is only the hand (the loop around the next activity, the stroke under today, the sun's loop, the mark's O), the primary button and the open page; its tints may colour the Agenda's door, the phone bar's pill, selection and the error notice. If urucum covers a panel, a header or a card on the site, it is wrong.

**The Flat Sky Rule.** The sky is five flat bands with hard stops, coloured by the hour in the light theme and always the night in the dark theme: never a soft gradient, never a photo. Text on it uses only the sky's ink and soft ink, which hold 4.5:1 or more on every band of every hour (the lowest pair is 5.05:1, the dusk's soft ink); urucum on the sky is a drawn mark, never the only sign of a state.

**The Dots, Never Shapes Rule.** A group is a coloured dot (8px; 6px in the phone month), a thin bar in the phone month, or a tinted bar with its dot on the desk month: never a shape, an icon, a filled card or a coloured pill, and never the only place the group is named (the chips and the panel say it in words). A cancelled activity keeps its group's colour as an outline.

## Typography

**Display Font:** Bricolage Grotesque (variable, 500–800, with its optical-size axis; falls back to Inter, system-ui, sans-serif)
**Body Font:** Inter (variable, 400–700; falls back to system-ui, sans-serif)
**On the flyers:** the same two, Bricolage Grotesque (700, 800) with its optical size pinned at 96 and Inter (500 to 700), in px on a fixed canvas

**Character:** Bricolage Grotesque is the voice and Inter the reading text. Bricolage at its heaviest, with its optical sizes, gives the greeting and the dates a local, hand-set warmth; Inter keeps what the organizations announce plain and legible outdoors on cheap phones. Both are self-hosted in `fonts/`; no request goes to Google Fonts.

### Hierarchy
- **Display** (Bricolage 800, 3.25rem, line-height 0.923, -0.03em): the greeting on the home's sky, "Bom dia, Dourados", on two lines on phones; 4rem/1 on one line from 760px, 4.75rem/1.05 from 1100px, 2.625rem on narrow screens.
- **Headline** (Bricolage 800, 1.875rem, 1.13, -0.025em): the page's name on the sky ("Agenda", "Comércio"); 2.5rem/1.1 from 760px. The same weight sets "Em breve" (2rem/1.05; 2.75rem on the desk), the month's title (1.5rem/1.1; 1.75rem from 1280px) and Comércio's letters (1.75rem/1).
- **Date** (Bricolage 800, 1.25rem, 1.2, -0.015em, tabular figures): the dates in NOS's voice, such as the home's circled date (1.4375rem from 760px).
- **Title** (Bricolage 750, 1.1875rem, 1.26, -0.015em, tabular figures): the day heads ("Hoje · terça, 27/10"). At 750 too: the panel's day (1.25rem/1.2), business names (1.25rem/1.2), the information card's title (1.375rem/1.2), empty-state titles (1.1875rem/1.3), the month's numerals (1.0625rem/1) and "Dourados" beside the mark (1.375rem/1.27). At 700: the doors' names (1.125rem/1.33, -0.02em) and "Também na agenda".
- **Activity Lead** (Inter 700, 1.375rem, 1.25, -0.015em): an activity's title in the panel; 1.875rem/1.2 on the home's desk card.
- **Activity** (Inter 600, 1.0625rem, 1.3, -0.01em): an activity's title on its card and on the home's phone card.
- **Body** (Inter 400, 1rem, 1.45): reading text; descriptions at 0.9375rem/1.5; hints held to about 34–36ch.
- **Meta** (Inter 400, 0.875rem, 1.36, soft ink): the organization and the place under an activity; the time row above them is 600 at 0.9375rem in ink.
- **Button** (Inter 600, 0.9375rem, 1.2): buttons. Chips and segments are 500 at 0.9375rem (600 when chosen), the phone bar's labels and the tags 500 at 0.8125rem, and the month's weekday heads 600 at 0.75rem with 0.04em tracking in capitals, the site's only uppercase.

### Named Rules
**The Two Voices Rule.** Bricolage Grotesque is NOS speaking: the greeting, dates, page titles, day heads and the headings that file things (doors, letters, businesses). Inter is what the organizations announce and every control: an activity's title is the organization's own words and is never set in Bricolage.

**The Tabular Dates Rule.** Every date, time and count is set with tabular figures, so days and hours line up down a list.

**The Planned Flyer Rule.** A flyer sets only the faces, weights and optical size its layout engine measured (`.impeccable/flyer-metrics.html`), and every line is planned before it is drawn: the preview and the PNG are one picture. Its numerals stand alone, so they keep the font's proportional figures; dates and times in lists keep the tabular ones. A new face or weight means measuring again.

## Layout

Phone first: one column of cards on the land under a short sky. Gutters are 16px on phones, 24px from 600px, 32px from 1100px and 12px on narrow screens (under 22.4375em: 359px at the default size, which also catches 200% zoom and large default fonts); content is capped at 1344px and centred. Cards stack 8px apart and days 18px apart; the home's blocks sit 12px apart (24px by 32px on the desk). Text sizes, and the boxes that hold text, are in rem, so a larger default font grows them together; the media queries are in px except the two narrow ones, in em. Every edge pads with the safe-area insets, and phones may turn on their side.

- **Under 760px:** the pages' links are a bar fixed along the foot of the screen (the body keeps 64px for it); the page's name sits beside the theme button on a short sky strip.
- **600px:** wider gutters; the bottom sheet centres at 560px.
- **760px:** the links move onto the sky beside the mark in a 68px bar, with the page's name or the greeting under them; the home shows its actions and "Também na agenda"; Comércio's businesses become rows with the contacts in their own column.
- **1100px:** the agenda becomes two columns, the list or month (fluid) and the persistent panel (380px), 32px apart; the home sets its next activity beside the doors stacked in 380px; Comércio's information card takes the panel's place. The chips wrap instead of scrolling.
- **1280px:** the panel grows to 420px and the month writes its entries in.
- **Short and narrow screens:** under 700px tall, Panfleto scrolls its format bar to the top so the preview takes the title's room; phones on their side give the sheet nearly the whole height and stand the flyer beside its controls; under 16.1875em the send button drops its icon.

### Named Rules
**The Horizon Rule.** Every page stacks the same three layers: the sky, the band (full-bleed; 16px under the inner pages' sky, 18px from 760px; 40px on the home, 44px from 760px), and the land. Only the home's next activity crosses the line: it rests on the band, the land rising 14px onto it.

**The Calm Desk Rule.** The desk adds a column, never a dashboard: the agenda's list or month beside its panel, the home's next activity beside its two doors, Comércio's list beside its information card.

## Elevation & Depth

A hybrid that changes with the light. By day, cards rest on the clay with a soft two-layer shadow tinted from the earth, never grey; at night the shadow goes and a 1px terra roxa line draws the card's edge, so the dark theme has no shadows on the land. Only the bottom sheet, lifted over its scrim, keeps a shadow at night. Flat colour panels (the doors, "Em breve") carry no shadow: the colour is the card. State shows as a ring, never a lift: nothing moves up on hover.

### Shadow Vocabulary
- **Day rest** (`box-shadow: 0 1px 2px color-mix(in srgb, #4A2212 8%, transparent), 0 6px 16px color-mix(in srgb, #4A2212 7%, transparent)`): activity cards, the month, the home's next card, the desk panel, business and information cards, the message bubble.
- **Night rest** (`box-shadow: 0 0 0 0 transparent; border: 1px solid #4A2F28`): the same surfaces at night.
- **Sheet** (`box-shadow: 0 -8px 28px color-mix(in srgb, #4A2212 18%, transparent)`; at night `0 -8px 28px color-mix(in srgb, #0E0706 60%, transparent)`): the bottom sheet, over a scrim of the ink at 50% (Night Shade at 70%).
- **Selection ring** (`box-shadow: 0 0 0 1.5px` in the soft ink, added to the rest shadow; inset on the month's chosen day): the activity open in the panel, the chosen day.
- **Focus ring** (`outline: 2px solid` Deep Urucum, `outline-offset: 2px`; Night Urucum in the dark theme; the sky's ink on the sky): every focusable element.

### Named Rules
**The Day Shadow, Night Line Rule.** Cards rest on the earth shadow by day and on a 1px line at night: never a shadow on the land in the dark theme, never a hard offset shadow, never a lift on hover.

**The Quiet Selection Rule.** Selection is a 1.5px soft-ink ring; focus is the strong 2px urucum ring (the sky's ink on the sky). They never trade places, and a selected card that takes focus shows both.

## Shapes

Soft and round, with one freehand line. Every control is a pill (999px): buttons, chips, segmented controls, the faces of the selects, the search field, tags, the skip link, the phone bar's pill. Round buttons are circles: 44px icon buttons and the month's arrows, 40px share circles, 8px group dots. Containers are cards at 18px: activity cards, the month, the home's card and doors, empty states, business and information cards, the desk panel. The bottom sheet rounds its top corners at 24px; notices, the chat and the message bubble use 12px (the bubble's tail corner 4px); the city tag, inline code and the flyer's frame 6px. The sky, the band and the phone bar run full-bleed with square edges.

The woven band is a tile of strips with softened ends (a taquara twill in straw with urucum selvages, 48 by 32 units, repeated sideways at the band's height). The NOS mark is N and S traced from Barlow Condensed 800 with a marker loop for the O, its end running past its start.

### Named Rules
**The Hand Rule.** The only freehand forms are the hand's: two open pen loops (two drawings, so they don't look stamped) and a short underline on the land, in urucum at 2.5px with round caps that keep their width as they stretch to what they mark; the astro's loop on the sky, whose pen grows with the sun (3px to 6px); and the O of the mark. A loop circles only the next activity, the underline only today; never a perfect ring or a badge in their place.

**The Pills and Cards Rule.** Controls are pills or circles and containers are 18px cards (the sheet 24px at its top); no button, field or card on the land has sharp corners, except the day cells inside the month's grid.

## Components

### Buttons
- **Shape:** pill (999px), at least 44px tall (48px in the panel's action bar), 18px icons with an 8px gap.
- **Primary:** Urucum with white text, Inter 600 at 0.9375rem, padding 0 18px; at night Night Urucum with terra roxa text. It carries the main action, sending to WhatsApp ("Enviar no WhatsApp").
- **Hover / Focus:** hover mixes 14% of the ink into the urucum (16% at night) in 0.15s; focus is the 2px ring at 2px offset. No lift, no glow.
- **Outlined:** the card colour with a 1px line and ink text ("Copiar texto"); hover turns the line soft ink over the card hover; done ("Copiado") fills with ink. Under 600px the panel's outlined action becomes a 48px circle, its name kept for screen readers.
- **Text and round:** text buttons are ink, 600, underlined; round icon buttons are 44px circles, outlined on the land (the month's arrows) or bare on the sky (the theme button), with a wash on hover.

### Chips
- **Style:** 36px pills with a 44px tap area, the card colour, a 1px line, ink text at 500 0.9375rem, and the group's 8px dot before the name.
- **State:** pressed fills with ink (on-ink text, 600) and a check takes the dot's place; hover turns the line soft ink over the card hover. The organization filter is a native select under the same pill face, ink when active. Comércio's category chips are the same without dots.
- **Rows:** on phones the row scrolls sideways under a 24px fade at its right edge (a thin scrollbar with a mouse); on the desk the chips wrap.

### Segmented Controls
Lista | Mês and Mensagem | Panfleto: a pill of two equal 42px segments on the card colour, split by a 1px line; the chosen segment is ink with a check in place of its icon, and the focus ring sits 4px inside the segment (in the on-ink colour on the chosen one).

### Cards / Containers
- **Corner Style:** 18px.
- **Background:** Warm White Card by day, Terra Roxa Card at night; hover moves to the card hover and underlines an activity's title.
- **Shadow Strategy:** the day rest by day, the 1px line at night (see Elevation & Depth).
- **Border:** transparent by day, Terra Roxa Line at night; empty days and empty states are flat and outlined in the line colour instead.
- **Internal Padding:** 14px 14px 15px 16px for an activity card on phones, 16px 18px 17px 20px on the desk; 20px to 28px on larger containers.
- **The activity card:** the whole card is the button that opens the panel. Its title (Activity) sits beside a 40px share circle; under it come the time (600, tabular), the organization with its group's dot and full name, and the place, each a meta row with a 16px soft icon. The next activity's time is circled by hand, with "a próxima" in Deep Urucum beside it. A cancelled one is struck through in soft ink under an ink "Cancelada" tag.

### Inputs / Fields
- **Style:** the search field is a 48px pill on the card colour with a 1px line, a soft search icon inside its left edge and a 44px round clear button at its right; Inter 400 at 1rem (16px, so iOS doesn't zoom), 500 once typed; the placeholder in soft ink.
- **Focus:** the line turns Deep Urucum and the 2px ring sits flush (0 offset).
- **Selects:** native selects under pill faces (the organization filter; the flyer's style picker, with its count and a drawn chevron), so phones get their own pickers.

### Navigation
- **Phones (under 760px):** a bar fixed along the foot of the screen, on the card colour with a 1px top line: three equal links, a 22px icon over a 0.8125rem label in soft ink; the open page in Deep Urucum at 600, its icon in a 56 by 32px Urucum Tint pill; hover shows the fill pill.
- **From 760px:** the links sit on the sky beside the mark in a 68px bar, 1rem labels in the sky's soft ink; the open page in the sky's ink with a 3px urucum underline 12px below it (the sky's hand); hover is the sky's wash pill.
- **The brand and the theme button:** the NOS mark with "Dourados" in Bricolage 750, its letters in the sky's ink and its O in the sky's hand (on phones, shown on the home only); a 44px round theme button (a moon in the light theme, a sun in the dark) that flips light and dark.

### The Sky Header (signature)
The header of every page is the sky: flat bands counted up from the horizon (inner pages 9/18/27/36px on phones and 11/22/33/44px from 760px; the home 16/36/62/98px, and 18/40/66/100px from 1100px), band 1 taking the rest. One astro drawing (a disc inside the hand's loop, a little off register like a screen print) is the sun by day, big and running off the edge (inner pages 108px, 200px from 760px; the home 367px, 400px, 490px), and the moon at night, about a fifth of the sun and high among small stars. The page's name (Headline) with its line ("4 atividades até 20/11"), or the greeting (Display) with the date, sits on it in the sky's inks. The phone's browser bar takes the sky's top band.

### The Band (signature)
The horizon: `assets/faixa.svg` repeated sideways, full-bleed under the sky. It is an artwork and doesn't change with the theme or the hour. It is provisional, drawn only from the structure of a taquara twill with an urucum selvage, and every footer credits it: "Faixa: arte provisória. A definitiva será criada e assinada por artistas da Reserva Indígena de Dourados."

**The Real Band Rule.** The provisional band may only be replaced by the real one: made, signed and paid for by artists of the Reserva Indígena de Dourados (Kaiowá, Guarani Ñandeva and Terena), with their visible credit in place of the provisional one. Never imitate or adapt anyone's grafismo in the meantime, and never draw a new "Indigenous" pattern to fill the band.

### Doors (signature)
The home's way into each page: a flat 18px card in the page's landscape tint (Agenda Urucum or Ipê-Rosa Tint; the night tints in the dark theme), with a 22px icon in the page's deep colour, the page's name in Bricolage 700, its live line in ink at 600, and secondary text that mixes 55% of the page's deep colour into the ink. Hover deepens the tint with 12% of that colour. Two side by side on phones (one column on narrow screens), stacked at the right on the desk.

**The Landscape Doors Rule.** A page shows its landscape colour only as its door's tint and on its own panel ("Em breve"), with its deep shade for icons and mixed text; secondary text on a tint is the hue mixed into the ink, never a grey.

### The Activity Panel
A bottom sheet under 1100px (24px top corners, a grabber, the sheet shadow over the scrim; it drags down and closes with Back), centred at 560px from 600px, and a sticky 380px card on the desk (420px from 1280px). Its head gives the day in Bricolage 750 and the time at 600 with "a próxima"; the title is the Activity Lead; the facts are 44px rows (30px on the desk) with 18px soft icons, the organization with a 10px dot and its full name. Mensagem | Panfleto stick to its top; the message shows as WhatsApp will (a bubble on the chat fill), the flyer in a 6px-rounded frame. The action bar stays at its foot: the primary button and an outlined one.

### The Month
A card of week rows, Sunday first, under a Bricolage 800 title between 44px round arrows. Sundays and holidays are shaded in the fill as days off; the numerals are Bricolage 750; today's is underlined by hand, the next activity's circled, the chosen day ringed in soft ink. On phones one-day activities are 6px group dots and multi-day ones 4px bars in lanes at the week's foot (outlines when cancelled). From 1280px the month becomes a wall calendar: each day writes its entries (dot, time at 700, title; three lines at most, 0.8125rem), holidays are named under the numeral, and the bars are tinted with 22% of the group's colour over the card, with the group's dot and the title in ink.

### Comércio
Paused, it shows "Em breve": a flat Ipê-Rosa Tint panel (18px), a 56px circle in the card colour holding the store icon in Deep Ipê-Rosa, "Em breve" in Bricolage 800 and a sentence at 1.0625rem in the ipê-mixed ink, held to 34ch, beside an information card whose icons are Deep Ipê-Rosa. The list's code stays styled for its return: business cards with the name in Bricolage 750, the offer, a quiet category tag, and labelled contact rows with the numbers at 700 in tabular figures.

### Icons
Lucide (ISC) drawings on a 24px grid with a 2px round stroke in `currentColor`, inline SVG: 16px in meta rows, 18px in buttons, chips and facts, 20px by default, 22px in the header, the phone bar and the doors. No glyphs or emoji as interface icons (the emoji in the WhatsApp message preview are the message's text, as it will be sent).

### The NOS Mark
NOS with the O circled by hand, sized by font-size (a 3.807em by 2.3em box): the letters take the current colour and the loop `--mark-loop`, which falls back to it; on the sky the letters take the sky's ink and the loop the sky's hand. The app icons print the mark on the dawn sky over the band and the clay; the favicons are the sun in its loop alone on the sky; the link preview is the home's first view at poster scale on the dawn sky. Another app name prints as the word in Bricolage 800 until a mark is drawn for it.

### Flyers
The 1080 by 1350 PNG flyers ("Folha do dia", "Agenda do mês", "Cartaz", and "Aviso de cancelamento", which every cancelled activity gets) are small landscapes of the same world, read first as a 300px thumbnail in a WhatsApp chat, then full screen. Each is the sky of the hour its activity starts (amanhecer, dia, entardecer, noite; the day's sky when there is no time) in five flat bands over the woven band (64px), and the land below: the light clay under the three light skies, terra roxa under the night, whatever the page's theme. The sky carries the flyer's idea in NOS's voice; the land carries the activity in Inter.
- **Folha do dia:** the day's numeral (Bricolage 800, up to 600px, -0.03em) stands 40px above the band in front of the rising sun, a disc inside the hand's loop running off the right edge (at night the small moon high above it and the stars). At its left, from its top line, the weekday (Bricolage 800) and the month (700, soft ink); on its baseline the time (800, its end apart in 700) or "Horário a confirmar".
- **Agenda do mês:** the month's name (Bricolage 800, 104px) and its year, the weekday heads in Inter capitals, then the weeks as the sky's bands, from the first under the name to the last on the horizon. The activity's day is the sun or the moon inside the hand's loop, its numeral in ink; a period's other days are underlined by hand; Sundays and holidays take the soft ink.
- **Cartaz:** the title in Inter 700, as large as the sky allows (168px down to 56px, weighed against short words ending its lines), hanging from the top with the sun rising in the sky left under it; at night it stands on the horizon under the moon. On the land, the date circled by hand in urucum with the time beside it.
- **Aviso de cancelamento:** "Cancelada" (Bricolage 800, up to 220px) on the sky of the activity's hour without its sun or moon (the stars stay at night), over the date and time the hand struck out. On the land, the title struck by an urucum stroke, "Motivo:" and the reason, then who and where in the soft ink, the group's dot as an outline.
- **The land, on every flyer:** the title (Inter 700, -0.02em); the organizations, the group's dot before each name in 700 with its full name in 500 and soft ink where it is known; the place after a pin (a globe online), with its city outside Dourados; a holiday's name; and the signature at the foot: the NOS mark, "Dourados", "Agenda das organizações" and the site's address. No type, logos or slogans: only the activity's own fields.

**The Sky of the Hour Rule.** A flyer's sky is the hour its activity starts, never the hour it is made, and the day's when there is no time. Its text uses the sky's inks only, and the edges between its bands keep clear of the text's lines: never grazing a baseline, an x-height or a cap line.

## Do's and Don'ts

### Do:
- **Do** take every colour from a role (`--role-*` in `css/theme.css`); the only literals in the stylesheets are `transparent`, `currentColor`, the band's image and system colours under forced colours.
- **Do** finish every new surface in both themes and under all four skies, with any text on the sky in the sky's ink or soft ink (4.5:1 or more on every band).
- **Do** keep urucum for the hand, the primary button and the open page; give a new page its own colour of the landscape as a door tint, with its deep shade for icons and mixed text.
- **Do** show a group as its dot beside its name, so colour is never the only carrier of meaning.
- **Do** circle the next activity and underline today with the hand marks, and nothing else on the site; on a flyer the hand circles the activity's date or day and strikes out what was cancelled.
- **Do** set dates in Bricolage 800 with tabular figures, headings at 700–750, and what the organizations announce in Inter.
- **Do** rest cards on the day shadow and the night line from the roles, and mark selection with the quiet soft-ink ring.
- **Do** keep every target at 44px or more (the 36px chips carry a 44px tap area) and size text in rem.
- **Do** credit the band as provisional in every footer while `assets/faixa.svg` is the provisional art.

### Don't:
- **Don't** fill a panel, a header or a card with full-strength urucum on the site, or use it for anything but marking.
- **Don't** draw the sky with a soft gradient, a photo or a texture, or set text on it in anything but the sky's inks.
- **Don't** give the groups shapes, icons, filled cards or coloured pills, and don't colour Comércio's categories.
- **Don't** replace the band with an imitation or adaptation of any people's grafismo; the real band comes from artists of the Reserva Indígena de Dourados, signed, paid and credited.
- **Don't** put shadows on the land in the dark theme, use hard offset shadows, or lift elements on hover.
- **Don't** use the strong urucum ring for selection or the quiet ring for focus.
- **Don't** fetch fonts from Google Fonts, or set an activity's title in Bricolage, on the site or on a flyer.
- **Don't** add motion beyond the home's rising sun (1.6s, off under reduced motion); state changes are 0.15s colour transitions and the sheet's 0.3s slide.
- **Don't** bring the Folhinha's devices to the site (the red header card, bindings, perforations, a yellow "Próxima") or the old campaign interface (the metro line to election day, the countdown, the slogan); nothing should read as a startup, a city hall or an election campaign.
- **Don't** invent logos, photos, slogans, ratings or prices for the organizations or the businesses.
