---
name: NOS Dourados
description: The shared calendar of Dourados' organizations as a folhinha, a tear-off wall calendar whose day sheets carry each activity, ready to send to WhatsApp.
colors:
  brand: "#E4002B"
  brand-hover: "#C70026"
  brand-tint: "#FDEBEE"
  brand-ring: "#F2B8C3"
  next: "#FFC20E"
  ink: "#1C1C1E"
  ground: "#EFEFEC"
  surface: "#FFFFFF"
  surface-hover: "#F7F7F5"
  seam: "#D9D9D4"
  muted: "#5C5C61"
  faded: "#BDBDB8"
  on-ink: "#FFFFFF"
  series-1: "#0455A1"
  series-2: "#00875A"
  series-3: "#9B3894"
  series-4: "#00808A"
  series-5: "#C25700"
  series-6: "#5E6A71"
  series-7: "#7A4E2D"
  series-8: "#C2185B"
  ink-past: "color-mix(in srgb, #5C5C61 55%, #BDBDB8)"
  red-letter-past: "color-mix(in srgb, #E4002B 75%, #FFFFFF)"
  scrim: "color-mix(in srgb, #1C1C1E 55%, transparent)"
  shadow: "color-mix(in srgb, #1C1C1E 14%, transparent)"
  wash: "color-mix(in srgb, #1C1C1E 6%, transparent)"
typography:
  numeral:
    fontFamily: "Barlow Condensed, Barlow, system-ui, sans-serif"
    fontSize: "3.625rem"
    fontWeight: 800
    lineHeight: 0.9
    letterSpacing: "-0.01em"
  numeral-desk:
    fontFamily: "Barlow Condensed, Barlow, system-ui, sans-serif"
    fontSize: "4rem"
    fontWeight: 800
    lineHeight: 0.9
    letterSpacing: "-0.01em"
  numeral-panel:
    fontFamily: "Barlow Condensed, Barlow, system-ui, sans-serif"
    fontSize: "2.75rem"
    fontWeight: 800
    lineHeight: 0.9
  month-title:
    fontFamily: "Barlow Condensed, Barlow, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 800
    lineHeight: 1
  month-title-wall:
    fontFamily: "Barlow Condensed, Barlow, system-ui, sans-serif"
    fontSize: "2rem"
    fontWeight: 800
    lineHeight: 1
  masthead:
    fontFamily: "Barlow Condensed, Barlow, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 800
    lineHeight: 1.05
  masthead-desk:
    fontFamily: "Barlow Condensed, Barlow, system-ui, sans-serif"
    fontSize: "1.625rem"
    fontWeight: 800
    lineHeight: 1.05
  weekday:
    fontFamily: "Barlow Condensed, Barlow, system-ui, sans-serif"
    fontSize: "1.1875rem"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "0.06em"
  time:
    fontFamily: "Barlow Condensed, Barlow, system-ui, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 700
    lineHeight: 1.1
    fontFeature: "tnum"
  day-numeral:
    fontFamily: "Barlow Condensed, Barlow, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1
  badge:
    fontFamily: "Barlow Condensed, Barlow, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.02em"
  stamp:
    fontFamily: "Barlow Condensed, Barlow, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "0.11em"
  type-label:
    fontFamily: "Barlow Condensed, Barlow, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 600
    lineHeight: 1.15
  headline:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.2
  title:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 500
    lineHeight: 1.45
  meta:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 500
    lineHeight: 1.35
  caption:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.3
  button:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 700
    lineHeight: 1.15
  cell:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.3
  cell-holiday:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.15
  flyer-numeral:
    fontFamily: "Barlow Condensed, Barlow, system-ui, sans-serif"
    fontSize: "460px"
    fontWeight: 800
    lineHeight: 0.8
    letterSpacing: "-0.013em"
  flyer-display:
    fontFamily: "Barlow Condensed, Barlow, system-ui, sans-serif"
    fontSize: "168px"
    fontWeight: 800
    lineHeight: 0.95
  flyer-title:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "78px"
    fontWeight: 700
    lineHeight: 1.08
    letterSpacing: "-0.013em"
  flyer-stamp:
    fontFamily: "Barlow Condensed, Barlow, system-ui, sans-serif"
    fontSize: "140px"
    fontWeight: 800
    lineHeight: 0.965
    letterSpacing: "0.057em"
rounded:
  cell-mark: "1px"
  bound: "2px"
  plate: "3px"
  sm: "4px"
  md: "6px"
  lg: "8px"
  sheet: "14px"
  pill: "999px"
spacing:
  2xs: "4px"
  xs: "6px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  2xl: "32px"
components:
  button-accent:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.on-ink}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: "0 18px"
    height: "48px"
  button-accent-hover:
    backgroundColor: "{colors.brand-hover}"
  button-line:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: "0 18px"
    height: "48px"
  button-line-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.on-ink}"
  button-icon:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    size: "44px"
  chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.meta}"
    rounded: "{rounded.pill}"
    padding: "0 14px"
    height: "44px"
  chip-pressed:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.on-ink}"
  org-pill:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.meta}"
    rounded: "{rounded.pill}"
    padding: "8px 12px"
    height: "44px"
  org-pill-active:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.on-ink}"
  masthead:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.on-ink}"
    typography: "{typography.masthead}"
  view-tab:
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
    typography: "{typography.body}"
    padding: "0 12px 4px"
    height: "49px"
  view-tab-selected:
    textColor: "{colors.ink}"
  segment:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    height: "44px"
  segment-selected:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.on-ink}"
  day-sheet:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "2px 2px 6px 6px"
    padding: "4px 12px 12px 16px"
  badge-today:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.on-ink}"
    typography: "{typography.badge}"
    rounded: "{rounded.sm}"
    padding: "0 9px"
    height: "1.625em"
  badge-next:
    backgroundColor: "{colors.next}"
    textColor: "{colors.ink}"
    typography: "{typography.badge}"
    rounded: "{rounded.sm}"
    padding: "0 9px"
    height: "1.625em"
  activity-line:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.title}"
    padding: "14px 6px 14px 16px"
  activity-line-hover:
    backgroundColor: "{colors.surface-hover}"
  activity-line-selected:
    backgroundColor: "{colors.brand-tint}"
  time-plate-next:
    backgroundColor: "{colors.next}"
    textColor: "{colors.ink}"
    typography: "{typography.time}"
    rounded: "{rounded.plate}"
    padding: "1px 5px"
  city-tag:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.on-ink}"
    rounded: "{rounded.plate}"
    padding: "1px 7px 2px"
  sector-square:
    backgroundColor: "{colors.series-1}"
    rounded: "{rounded.bound}"
    size: "10px"
  stamp:
    backgroundColor: "transparent"
    textColor: "{colors.brand-hover}"
    typography: "{typography.stamp}"
    rounded: "{rounded.plate}"
    padding: "2px 7px"
  month-day:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.day-numeral}"
    height: "56px"
  month-day-selected:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.on-ink}"
    rounded: "{rounded.sm}"
  week-bar:
    backgroundColor: "{colors.series-1}"
    textColor: "{colors.on-ink}"
    rounded: "{rounded.plate}"
    height: "1.25rem"
  bottom-sheet:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.sheet}"
  notice:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "14px 16px"
  notice-error:
    backgroundColor: "{colors.brand-tint}"
  chat-bubble:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "12px"
  flyer-tag:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.on-ink}"
    rounded: "{rounded.md}"
    padding: "6px 16px"
---

# Design System: NOS Dourados

## Overview

**Creative North Star: "The Folhinha"**

NOS Dourados is drawn as a folhinha, the tear-off wall calendar of Brazilian homes and shops. A red printed header card hangs at the top; under it, on a pale wall, hangs a pad of white day sheets, each bound by a red strip and a row of perforation holes, each with a giant two-digit numeral and its weekday in condensed capitals, and every organization's activities are printed on the sheet of their day. Today's sheet is on top, past sheets are torn off until someone asks for them, the next activity carries the calendar's only yellow, Sundays and national holidays print in red, and a cancelled activity keeps its place under a red rubber stamp. The month view is the calendar's month page, Sunday first; the flyers are the same header card and sheets at poster size.

The system is printed, not decorated. One type family, Barlow and Barlow Condensed, with hierarchy carried by scale and width; flat paper on a wall, separated by 1px seams; corners that stay nearly square where a sheet is bound and soften where it hangs free; colour used the way a calendar printer uses it: red for the header, the binding and the red-letter days, graphite for everything printed, one yellow for "Próxima", eight sector inks as small printed squares. Density is set for mid-range phones used outdoors: big numerals, strong contrast, tap targets of 44px and more. Motion is minimal: state changes fade in 0.15s, the view tab underline moves in 0.2s and the phone's bottom sheet slides in 0.3s, all on one curve (`--ease`, `cubic-bezier(0.16, 1, 0.3, 1)`); with reduced motion every transition is instant.

It refuses the category default of event apps (a grey list with thin date dividers and coloured event pills) and the protest-poster costume. Only the palette comes from the Calendário de Luta this repository was copied from; its metro line, stations, countdown and slogan are retired.

**Key Characteristics:**
- Every day is a sheet: red binding strip, perforation row, two-digit numeral, weekday in condensed capitals.
- Sundays and national holidays print red on every calendar surface.
- Yellow means the next activity and nothing else.
- A sector is a small printed square beside the organization, never a fill behind content.
- One family, hierarchy by scale: Barlow Condensed prints the calendar, Barlow carries what people read.
- Flat sheets on a pale wall with 1px seams; shadows only on what floats.
- Every colour is a variable in two layers, palette then roles, so a theme is one block of variables.

## Colors

A calendar printer's palette: one red, graphite ink, white paper on a pale wall, a single reserved yellow and eight sector inks. Every value lives in `css/theme.css` as a palette variable (`--color-*`, the same names as the variables of `design.pen`) and reaches the interface and the flyers only through a role (`--role-*`).

### Primary
- **Folhinha Red** (#E4002B, `--color-brand`): the printed header card (`--role-header`), the binding strip on every sheet (`--role-binding`), Sundays and holidays (`--role-red-letter`), the panel's one primary action (`--role-accent`: "Enviar no WhatsApp", "Compartilhar imagem", or "Baixar PNG" when the device can't share files), the alarm on flyers (`--role-alert`: the "Cancelada" stamp, the strike through a cancelled date, also the day circled by hand on the month flyer), error icons, text selection and the caret. White on it, and it on paper, both reach 4.85:1.
- **Deep Red** (#C70026, `--color-brand-hover`): the accent's hover (`--role-accent-hover`) and every small red text of the alarm (`--role-alert-text`): the on-screen "Cancelada" stamp and "Motivo: …" (6.08:1 on paper).
- **Blush Tint** (#FDEBEE, `--color-brand-tint`): the activity open in the panel (`--role-selected`) and the error notice's ground (`--role-alert-soft`).
- **Rose Ring** (#F2B8C3, `--color-brand-ring`): the error notice's border (`--role-alert-ring`).

### Secondary
- **Próxima Yellow** (#FFC20E, `--color-next`): the next activity, nothing else (`--role-next`, with Graphite Ink on it as `--role-on-next`, 10.5:1): the "Próxima" badge on its start day's sheet and the plate behind its time.

### Tertiary
Sector inks. `js/colors.js` gives each sector a series and sets `--sector: var(--role-series-N)` on the node; the suggested sectors keep a fixed series (`SECTOR_SERIES` in `js/config.js`), the eight suggested sectors use all eight series, so another sector borrows the series of a suggested sector absent from the sheet and then falls back to a name hash. All eight carry white text at 4.5:1 or more.
- **Sector Blue** (#0455A1, `series-1`, azul): Sindicatos.
- **Sector Green** (#00875A, `series-2`, verde): Rural, indígena, luta pela terra.
- **Sector Lilac** (#9B3894, `series-3`, lilás): Movimentos Sociais.
- **Sector Teal** (#00808A, `series-4`, turquesa): Academia e Movimento Estudantil.
- **Sector Orange** (#C25700, `series-5`, laranja): Órgãos do Estado.
- **Sector Silver** (#5E6A71, `series-6`, prata): Partidos.
- **Sector Brown** (#7A4E2D, `series-7`, marrom): Outros.
- **Sector Magenta** (#C2185B, `series-8`, magenta): Terceiro Setor.

An activity without a sector gets Pencil Grey (`--role-no-sector`).

### Neutral
- **Graphite Ink** (#1C1C1E, `--color-ink`): all printed text (`--role-ink`, 17:1 on paper), the "on" fill of controls and badges and the chosen view tab's underline (`--role-strong`), the focus ring (`--role-focus`), the binding of the NOS mark (`--role-mark-binding`), the city tag and the flyer type tag.
- **Pale Wall** (#EFEFEC, `--color-ground`): the page behind the sheets (`--role-wall`), the flyers' ground, the chat ground of the WhatsApp preview (`--role-chat`).
- **Sheet White** (#FFFFFF, `--color-surface`): sheets, the panel, chips and pills (`--role-paper`), the message bubble (`--role-bubble`).
- **Paper Hover** (#F7F7F5, `--color-surface-hover`): an activity line under the pointer (`--role-paper-hover`).
- **Seam Grey** (#D9D9D4, `--color-seam`): 1px seams and sheet edges, the perforation dots on screen and on the day and month flyers, the grabber (`--role-line`).
- **Pencil Grey** (#5C5C61, `--color-muted`): secondary text and icons (`--role-ink-soft`, 6.65:1 on paper), the no-sector square.
- **Faded Grey** (#BDBDB8, `--color-faded`): the perforation of the NOS mark and of the Cartaz and Aviso flyers (`--role-ink-faded`), the scrollbar (`--role-scrollbar`).
- **Reverse White** (#FFFFFF, `--color-on-ink`): text and focus on red, graphite and sector colours (`--role-on-header`, `--role-on-strong`, `--role-on-accent`, `--role-on-series`, `--role-focus-on-color`).
- **Torn-off Grey** (`ink-past`, `--role-ink-past`): Pencil Grey mixed 55% into Faded Grey, for the numerals of past sheets and of days outside the month; still 3.54:1 on paper.
- **Faded Red-Letter** (`red-letter-past`, `--role-red-letter-past`): Folhinha Red mixed 75% into white, for red-letter numerals on past sheets and outside the month (3.86:1).
- **Graphite Scrim, Shadow and Wash** (`scrim`, `shadow`, `wash`: Graphite Ink at 55%, 14% and 6%): the backdrop behind the phone's bottom sheet (`--role-scrim`), the three soft shadows (`--role-shadow`), the hover wash of quiet controls and the inline `code` ground (`--role-wash`).

Themes are blocks of variables. A `:root[data-theme='name']` block at the end of `css/theme.css` overrides palette entries or roles; `data-theme` on `<html>` in `index.html` picks it (empty means the default), and `?tema=<name>` in the address tries one without editing a file (the inline script in `index.html`'s `<head>`). The bundled `exemplo` theme is a template: a graphite header card and binding, with a red binding on the mark. Two places can't read variables and change by hand: the `theme-color` meta (the red header, in `index.html`) and `theme_color`/`background_color` in the web manifest. The icons, the link preview and the screenshots are PNGs rendered from the theme: re-render them with `node assets/render.cjs`.

### Named Rules
**The Roles-Only Rule.** `css/style.css` and `css/flyers.css` name roles, never palette variables or colour literals; `transparent`, `currentColor` and, inside `@media (forced-colors: active)`, system colours are the only exceptions. A new colour enters `css/theme.css` as a palette entry plus a role, and a sector's colour arrives only as `var(--sector)`.

**The One Yellow Rule.** Próxima Yellow marks the next activity and nothing else: the "Próxima" badge on its start day's sheet and the plate behind its time (or its dash, when that day has several activities or is today). It never marks focus, warnings, the month grid or a flyer.

**The Red-Letter Rule.** Sundays and national holidays print in Folhinha Red wherever the calendar prints a date: the sheet's numeral and weekday, the holiday's name, the month page's Sunday column and numerals, the Folha do dia and the Calendário do mês. Red on a date means a Sunday or a holiday, never decoration. A torn-off sheet keeps its red numeral, faded to Faded Red-Letter; the month page fades it only outside the month.

**The Printed Square Rule.** A sector shows as a small square of its ink beside the organization: 10px with 2px corners on screen, 6px with 1px corners in month cells, 0.7em on flyers. The only larger sector fills are the multi-day bars of the month page. Sector colour never fills a card, a chip or a line, and never colours text.

## Typography

**Display Font:** Barlow Condensed (with Barlow, system-ui, sans-serif), self-hosted at 600, 700 and 800
**Body Font:** Barlow (with system-ui, sans-serif), self-hosted at 500, 600 and 700

**Character:** One superfamily in two widths. The condensed cut is the calendar's print, tall and tight: heavy numerals, tracked capitals for weekdays, tabular times. The normal width carries what people read: titles, organizations, places, descriptions, buttons. Hierarchy comes from scale: reading sizes sit in a tight 14 to 17px band, and the printed numerals jump to 44 to 64px.

### Hierarchy
- **Numeral** (Barlow Condensed 800, 3.625rem, 4rem from 1100px, line-height 0.9, -0.01em): the day on every sheet, two digits, in a fixed 4rem column (4.5rem from 1100px).
- **Panel Numeral** (Barlow Condensed 800, 2.75rem, line-height 0.9): the small sheet head at the top of the activity panel.
- **Month Title** (Barlow Condensed 800, 1.75rem, 2rem from 1280px, 1.375rem on very narrow screens, line-height 1): "Outubro 2026" over the month page.
- **Masthead** (Barlow Condensed 800, 1.5rem, 1.625rem from 1100px, line-height 1.05): "Dourados/MS" on the header card.
- **Weekday** (Barlow Condensed 700, 1.1875rem, line-height 1.1, 0.06em, capitals): "QUINTA-FEIRA" beside the numeral; 1rem in the panel head. The month page's column letters ("DOM", "SEG") speak the same voice at 0.8125rem and 0.05em.
- **Time** (Barlow Condensed 700, 1.375rem, line-height 1.1, tabular figures): an activity's start ("11h", "9h30") on its plate; 1.0625rem when only the end is known ("até 12h").
- **Day Numeral** (Barlow Condensed 700, 1.25rem, line-height 1): the month page's numerals, plain digits.
- **Badge** (Barlow Condensed 700, 1rem, line-height 1, 0.02em): "Hoje" and "Próxima".
- **Stamp** (Barlow Condensed 800, 0.875rem, line-height 1.2, 0.11em, capitals): "CANCELADA".
- **Type Label** (Barlow Condensed 600, 0.9375rem, line-height 1.15): the activity's type under its time ("Festa", "Plenária", "Prazo"). The city tag uses the same face at 700 and 0.875rem.
- **Headline** (Barlow 700, 1.5rem, line-height 1.2, balanced): the activity's title in the panel.
- **Title** (Barlow 600, 1.0625rem, line-height 1.3, pretty wrapping): the activity's title on its sheet.
- **Body** (Barlow 500, 1rem, line-height 1.45): base text.
- **Meta** (Barlow 500, 0.9375rem, line-height 1.35): organization (at 600), place, period, facts, chips, notices, the month name under the weekday; the description keeps line-height 1.45.
- **Caption** (Barlow 500, 0.875rem, line-height 1.3): "Núcleo de Organização Social" under the masthead, holiday names (600, red), organizations' full names in the panel, the flyer hint.
- **Button** (Barlow 700, 1rem, line-height 1.15): every button label.
- **Cell** (Barlow 500, 0.8125rem, line-height 1.3): the entries written into the wall-sized month page, each time at 700; the multi-day bars carry their titles at 600, and the page's column letters use Barlow Condensed 700 at this size.
- **Cell Holiday** (Barlow 600, 0.75rem, line-height 1.15): a holiday's short name under its numeral on the wall-sized month page, in red; a full cell's "+N" count uses the same size.

Every interface size is in rem, and so are the boxes that hold text (the numeral and time columns, the month page's bars and lanes), so a larger default font size grows them together.

Flyers have their own px scale on the 1080 × 1350 canvas. `css/flyers.css` holds the base sizes and `js/flyer.js` sets the planned size of each text inline:
- **Flyer Numeral** (Barlow Condensed 800, 460px, line-height 0.8, -0.013em): the Folha do dia's day. The Cartaz sheet sets its numeral at 204px, the Aviso at 290px.
- **Flyer Display** (Barlow Condensed 800, 168px, line-height 0.95, capitals): the Cartaz title.
- **Flyer Title** (Barlow 700, 78px, line-height 1.08, -0.013em): the title on the Folha do dia; 76px on the month flyer, 64px struck through on the Aviso.
- **Flyer Stamp** (Barlow Condensed 800, 140px, line-height 0.965, 0.057em): "CANCELADA" on the Aviso de cancelamento.

The flyer masthead sets "NOS Dourados" in Barlow Condensed 800 at 62px over "Núcleo de Organização Social" in Barlow 500 at 28px; the footer "Agenda das organizações de Dourados" is Barlow 500 at 26px in Pencil Grey.

### Named Rules
**The Two-Digit Numeral Rule.** A sheet prints its day with two digits ("09"), as printed folhinhas do: the agenda's sheets, the panel head, the Folha do dia, the Cartaz and the Aviso de cancelamento. The month page keeps plain numerals ("9"), as month pages do.

**The Printer and Reader Rule.** Barlow Condensed prints the calendar: numerals, weekdays, times, types, month names, badges, the stamp, the masthead. Barlow carries what people read: titles, organizations, places, descriptions, buttons. No third family, and no weight beyond the six that are self-hosted.

## Layout

Phone first, one column. The red header card runs edge to edge (16px gutter inside the safe area: the inset on top and, on a landscape iPhone, at the sides) and carries only the brand. Under it the filter row (the organization pill, a 1px by 24px seam divider, the sector chips) scrolls sideways under a 24px fade at the right edge; the filters serve both views, so they come first. Then the view tabs, directly on top of the list or the month page they switch, 12px above it. Then the pad: sheets stacked 12px apart, 16px from the screen's edges. Inside a sheet two aligned columns run from the head down through the activities: the folio column (the numeral, then each activity's time and type) and the text column (weekday and month, then titles, organization, place).

At 600px the gutters grow to 24px, the bottom sheet centres at 560px wide and month cells grow to 64px. From 1100px (the `desktop` media query in `js/app.js` must agree with `css/style.css`) the page becomes a desk inside a 1344px shell with 32px padding (1280px of content): the pad on the left, fluid, and the activity panel on the right at 380px (420px from 1280px), 32px apart. The header keeps only the brand, on the left; its right side stays free. The chips wrap beside the organization pill, the view tabs sit under the filters at the top of the left column (two 132px tabs on a seam that runs the column's width, 16px above the list or the month), and the panel sticks 24px from the top, never taller than the viewport minus 128px. From 1280px the month page grows into a wall calendar with the titles written in (see Month Page).

The two narrowest queries are in em, so a larger default font size brings them in sooner. Under 22.4375em (359px at 16px: small phones, 200% zoom) the sheet heads and lines reflow: the names drop under the numeral when they don't fit, the time takes its own row, the tab icons and the share glyph go. Under 16.1875em (259px) the panel's date stacks and the send button drops its icon. Height matters too: on phones under 700px tall Panfleto opens at the format bar when the panel is long enough to bring it to the top, desks under 865px tall fold the organization and the hint in flyer mode, and the flyer preview's width follows the viewport's height so the format bar and the buttons stay in view. Phones on their side (500px tall or less) give the sheet nearly the whole height and stand the flyer preview beside the format bar and the style picker; nothing locks the orientation.

Spacing rhythm: 8px between an icon and its label, chip and chip, button and button; 12px between stacked blocks (sheets in the pad, numeral and text column); 16px as the inset of sheets and the phone gutter (20px inside sheets from 1100px); 24px and 32px as the gutters at 600px and 1100px; 4px and 6px inside stacks of text. Media queries are in px except the two narrow ones.

Flyers are a fixed 1080 × 1350 canvas in px, with 60px margins on the Folha do dia and the Calendário do mês and 80px on the Cartaz and the Aviso. `js/flyer.js` plans every size and line break from embedded Barlow glyph widths, with no DOM measurement, so the preview and the PNG match.

### Named Rules
**The Folio Column Rule.** The numeral and the activity times share one fixed column (4rem; 4.5rem from 1100px), and the weekday, the month and the activity titles share the next, so every sheet head sits at the same scale and baseline and the times read down the pad like a split-flap board, in tabular figures. An empty day's line ("Nenhuma atividade hoje") starts in the text column too.

## Elevation & Depth

Flat. Sheets, the month page and the desktop panel hang flat on the wall; their edges are 1px Seam Grey lines, and depth comes from white paper against the pale wall and from the binding strip on top. Three soft shadows, all in Graphite Shadow (ink at 14%), mark the only things that float. States are drawn with inset strokes, never with elevation.

### Shadow Vocabulary
- **Mark lift** (`box-shadow: 0 0.05em 0.1em var(--role-shadow)`): the NOS mark's mini sheet standing off the red header card; the flyers drop it.
- **Sheet lift** (`box-shadow: 0 -8px 24px var(--role-shadow)`): the phone's bottom sheet, over the Graphite Scrim. The desktop panel has none.
- **Bubble** (`box-shadow: 0 1px 3px var(--role-shadow)`): the message bubble in the WhatsApp preview.
- **Strokes, not depth:** the selected activity's frame and the month page's today ring (`box-shadow: inset 0 0 0 2px var(--role-strong)`), the chosen view tab's underline (`inset 0 -4px 0 var(--role-strong)`), the hollow mark of a cancelled activity on the month page (`inset 0 0 0 1.5px var(--sector)`), the white ring round a pressed chip's square (`0 0 0 1.5px var(--role-on-strong)`).

### Named Rules
**The Flat Wall Rule.** Nothing printed casts a shadow. Sheets, the month page and the desktop panel are paper on the wall, edged by 1px seams; only the phone's bottom sheet, the chat bubble and the mark on the header float.

## Shapes

Paper shapes. The base corner is 6px (`--radius`): buttons, icon buttons, notices, the flyer preview, a sheet's free bottom edge. 4px (`--radius-sm`) for badges, the segmented control and the month page's numerals; 8px (`--radius-lg`) for the chat, its bubble and the desktop panel's bottom; 14px (`--radius-sheet`) only for the top of the phone's bottom sheet. Full pills (`--radius-pill`) belong to the filter controls (sector chips, the organization pill, the flyer style select) and to the today ring on the wall-sized month page. Smaller printed pieces use literal corners: 3px for the time plate, the city tag, the stamp and the ends of month bars; 2px for a sheet's bound top, sector squares, the grabber and the bubble's tail; 1px for the month page's 6px marks. Flyers keep their own px corners on the 1080 canvas: 4px bound tops over 12px bottoms (Folha do dia, Calendário do mês) or 6px bottoms (Cartaz, Aviso), 6px type tags, 4px squares.

The perforation is a row of dots drawn with a repeating radial gradient. On screen: 3px Seam Grey dots every 10px, under a 4px binding strip, 13px in all (`.sheet::before`). On the mark: Faded Grey dots every 0.25em. On flyers: 8px Seam Grey dots every 24px under a 12px strip (Folha do dia, Calendário do mês), or 6px Faded Grey dots every 22 to 25px (Cartaz, Aviso). Squares are the sectors' shape; circles appear only as the today ring from 1280px and the hand-drawn ring on the month flyer.

### Named Rules
**The Bound Top Rule.** Anything shown as a sheet is bound at the top and free at the bottom: a binding strip, a perforation row, nearly square top corners (2px) and softer bottom corners (6px; 8px on the desktop panel). The agenda's day sheets, the month page, the desktop panel, the flyer sheets and the NOS mark share this silhouette.

**The Hand-Applied Tilt Rule.** Only what a hand would add is tilted: the "Cancelada" stamp (-3° on screen, -8° on the Aviso), and on the month flyer the circled day (-7°) and the stroke under the other days of a long activity (-2°). Everything printed stays square to its sheet.

## Components

### Buttons
Plain printed blocks: a label on a 6px block, never a pill.
- **Shape:** gently squared corners (6px), at least 48px tall, padding 0 18px, a 2px border.
- **Primary (Accent):** Folhinha Red with a white Button label and a 20px icon 8px before it: "Enviar no WhatsApp" ("Avisar no WhatsApp" for a cancelled activity), "Compartilhar imagem", and "Baixar PNG" when the device can't share files (`canShareFiles` in `js/app.js`).
- **Hover / Focus:** the accent deepens to Deep Red; the line button fills graphite with a white label; background, colour and border change in 0.15s, and hover applies only where a pointer can hover. Focus is a 3px Graphite Ink outline 2px out, white on the red header and on the chosen segment, moved inside lines, days and tabs (-3px to -6px) so the selected frame can't hide it.
- **Line (secondary):** a 2px graphite border on transparent, graphite label: "Copiar texto", "Baixar PNG" beside "Compartilhar imagem", "Ver atividades anteriores". Once its action is done it fills graphite with a check for 2 seconds ("Copiado", "Imagem baixada", "Compartilhado"); while an image is made it reads "Gerando imagem…" at 70% opacity.
- **Text:** an underlined Button label, at least 44px tall: "Limpar filtros", "Voltar para hoje".
- **Icon button:** 44 × 44px, 1px seam border, 6px corners, paper, graphite icon; hover darkens the border to graphite. The month arrows, the flyer style arrows, the panel's close.
- **Action bar:** the primary takes the width and the secondary its own size; under 600px the secondary shrinks to a 48px square showing only its icon, its name kept in `aria-label`.

### Chips
- **Style:** pills, at least 44px tall, padding 0 14px, a 1px Seam Grey border on paper, Meta text; the sector's 10px square 8px before the label. "Todos" comes first, without a square.
- **State:** pressed (`aria-pressed="true"`) fills graphite with white 600 text and rings the square in white; hover darkens the border to graphite. Several sectors can be pressed at once.
- **Row:** the organization pill, a 1px by 24px seam divider, then the chips. On phones the row scrolls sideways under a 24px fade (with a mouse, a thin scrollbar shows); from 1100px the chips wrap beside the pill.

### Cards / Containers
- **Corner Style:** bound top (2px) and free bottom (6px); see The Bound Top Rule.
- **Background:** Sheet White on the Pale Wall.
- **Shadow Strategy:** none (The Flat Wall Rule).
- **Border:** 1px Seam Grey on the sides and the bottom; the top is the 4px Folhinha Red binding strip and the perforation row.
- **Internal Padding:** 16px from the left on phones (20px from 1100px), 12px between the folio and text columns (16px from 1100px).
- **Notices:** a paper card with a 1px seam, 6px corners, 14px 16px padding and an alert icon in Pencil Grey; an error turns Blush Tint with a Rose Ring border and a red icon, and the rows it skipped fold into a list naming each "Linha N".

### Inputs / Fields
- **Style:** the only fields are native selects dressed as pills. The organization filter: a 1.5px graphite border, Meta at 600, the users icon, the label (at most 15rem, then an ellipsis) and a chevron; the real `<select>` lies over it at zero opacity and 1rem so iOS doesn't zoom, and its options carry full names grouped by sector ("SIMTED – Sindicato Municipal dos Trabalhadores e Trabalhadoras em Educação de Dourados"). The flyer style picker: a 1px graphite border, the style's name ("Folha do dia", "Calendário do mês", "Cartaz"), a "1/3" count and a drawn chevron, between two 44px arrow buttons.
- **Focus:** the 3px graphite outline drawn on the pill's face (`:has(select:focus-visible)`).
- **Active:** while an organization is chosen, its pill fills graphite with white text and shows the short name.

### Navigation
- **View tabs** ("Agenda" and "Mês") sit on the wall directly on top of the list or the month page they switch, under the filters, never on the header card: Pencil Grey Body labels with 18px icons over a 1px Seam Grey baseline, 49px tall, each half the width on phones and 132px wide from 1100px. The chosen tab turns Graphite Ink at 700 over a 4px graphite underline drawn as an inset shadow, moving in 0.2s on `--ease`; hover darkens a label to Graphite Ink; focus is the graphite ring, inset 4px.
- **Segmented control** ("Mensagem" and "Panfleto") in the panel: a 1px graphite frame with 4px corners, split into two 44px halves by a graphite rule; the chosen half fills graphite with white 600 text. It sticks to the top of the panel while the message or the flyer scrolls under it.
- **Month header:** 44px arrow buttons round the Month Title; "Voltar para hoje" appears when another month is shown, centred under the title on phones and at the right of the row from 1280px.
- **Skip link:** "Pular para a agenda", a graphite block that appears on focus.

### Day Sheet (signature)
The pad's unit. Binding strip and perforation, then the head: the two-digit Numeral in its column; the Weekday in capitals with the month under it in Pencil Grey (and the year when it isn't this one); the holiday's name in red when there is one; and at the right a status, the graphite "Hoje" badge, the yellow "Próxima" badge, or how far the day is ("em 3 dias", "há 6 dias") in Pencil Grey. Red-letter sheets print numeral and weekday in red. Past sheets turn the numeral Torn-off Grey (Faded Red-Letter on red-letter days) and the weekday Pencil Grey. Today's sheet is printed even when empty ("Nenhuma atividade hoje"). Past sheets stay torn off behind "Ver N atividades anteriores"; an activity of several days that began earlier is printed on today's sheet ("Em andamento, até …"). With filters on and nothing ahead, a blank sheet says so ("Nenhuma atividade para COMAFRO de hoje em diante"), names when the last one was, and offers "Ver atividades anteriores" and "Limpar filtros".

### Activity Line (signature)
Each activity is one full-width button on its sheet, the lines parted by 1px seams. The folio column holds the Time on its plate and the Type Label under it ("—" when there is no time, "até 12h" when only the end is known). The text column holds the Title; the organization (600) after its sector square; the place after a 16px pin (a globe when online), with a graphite city tag in front when the activity is outside Dourados; and, for activities of several days, the period after a calendar icon ("até sáb, 24/10"). A 44px share glyph closes the row. Hover: Paper Hover and an underlined title. Selected (open in the panel): Blush Tint inside a 2px graphite frame. Next: the time sits on a Próxima Yellow plate with 3px corners.

### Cancellation Stamp
A rubber stamp: "CANCELADA" in Stamp type inside a 2px Deep Red border with 3px corners, tilted -3°, set above the struck title; the time is struck in Pencil Grey and the reason follows in Deep Red ("Motivo: …"). The panel repeats stamp and reason above its title and strikes the title and the date line; the message becomes a notice ("❌ ATIVIDADE CANCELADA"), and the flyer becomes the Aviso de cancelamento: the day's numeral struck in red under a 140px stamp at -8°.

### Month Page
The calendar's month page, printed on a sheet (binding and perforation on top). Weeks start on Sunday, the column letters head the page ("DOM" in red), and weeks are parted by 1px seams. Day Numerals are plain digits: red on Sundays and holidays; Pencil Grey on past days, where red stays red; Torn-off Grey, or Faded Red-Letter, outside the month. Today wears a 2px graphite ring (4px corners on phones, a circle from 1280px); the chosen day fills graphite on phones and, from 1280px, the whole cell takes a 2px graphite frame. On phones a one-day activity is a 6px sector square (three at most, then "+N") and an activity of several days is a 4px bar in a lane along the bottom of its week. From 1280px the page is a wall calendar with the titles written in: cells at least 7.625rem tall with seams between days, one-day entries as 0.8125rem text rows with a bold time, multi-day bars 1.25rem tall carrying their titles in white 600 under the numerals, and holiday short names ("Finados", "Consciência Negra") in red under the numeral, two lines at most, the whole week making room so its bars stay level. Cancelled entries turn hollow and struck through. The grid is one tab stop moved with the arrow keys; choosing a day prints its sheet under the page.

### Activity Panel
The production bench. On phones it is a bottom sheet: 14px top corners, the Sheet lift, a 36 × 4px grabber, the Graphite Scrim behind it, sliding in over 0.3s on `--ease` and following the finger when pulled down; from 600px it centres at 560px. From 1100px it is a sticky column printed as a sheet (binding and perforation, a 1px seam, 8px bottom corners, no shadow) that before any choice reads "Escolha uma atividade para ver os detalhes e montar a mensagem e o panfleto." Its head is a small sheet head (Panel Numeral, the weekday at 1rem, then "Outubro · até sáb, 24/10" with the time). Then the Headline; the facts, each after a 20px slot (the sector square for the organization, its full name under it in Caption, then period, place, type, contact, link and "Ver o post de origem"); the description; the segmented control; and the format. Mensagem shows the message as WhatsApp would, a white bubble with 8px corners and a 2px tail corner on a Pale Wall chat. Panfleto shows the style picker, the flyer scaled into a frame with a 1px seam and 6px corners, and the hint "Imagem 1080 × 1350, no formato do WhatsApp e do Instagram." The action bar sticks to the bottom under a 1px seam.

### Flyers
1080 × 1350 PNGs built from the same world (`css/flyers.css`, every rule scoped under `.fl`): the red header card with the mark and "NOS Dourados", sheets with binding and perforation on the Pale Wall, the footer "Agenda das organizações de Dourados". Four styles:
- **Folha do dia:** one giant sheet with the 460px numeral, the weekday and "OUTUBRO 2026" beside it and the time below; then, under a 2px seam, the title, the organization after its square and a graphite type tag.
- **Calendário do mês:** the month page on a sheet ("OUTUBRO 2026", the Sunday column in red), the activity's day circled by hand in red and a red stroke under the other days of a long activity; then title, date and time, place and organization.
- **Cartaz:** the header card at poster size: a Folhinha Red ground, the title in white capitals, a white sheet with a graphite binding (the 204px numeral, the weekday, the month, then the time and type), place and organization in white, and the NOS signature at the bottom right.
- **Aviso de cancelamento** (always, for a cancelled activity): the sheet with its numeral struck in red under the "CANCELADA" stamp, the struck time, "Motivo:", the struck title.

Flyers carry no yellow. Export waits for `document.fonts.ready`.

### The NOS Mark
A mini folhinha sheet (`brandMark` in `js/icons.js`, with a static copy in `index.html` so the name shows without JS): a graphite binding strip, a row of Faded Grey perforation and "NOS" in Barlow Condensed 800 on white, 2.2em by 2.5em with 0.15em top and 0.2em bottom corners, sized by font-size (1.25rem in the header, 1rem on very narrow screens, 42px and 30px on flyers). Beside it, "Dourados/MS" in Masthead type over "Núcleo de Organização Social" in Caption. The app icons, the favicons and the link preview draw the mark as the pad (`assets/pad.js`): today's sheet over the edges of two sheets under it, on the red card, NOS in the numeral's place. The name and the mark are provisional and stay easy to swap (`APP_NAME` in `js/config.js`, `brandMark`, then `node assets/render.cjs`).

### Icons
Lucide outlines (ISC license) at one stroke weight (2) on a 24px grid with round caps and joins, drawn in `currentColor` at 20px (18px in the view tabs and the organization pill, 16px beside places and periods, 40px on the blank sheet). Emoji exist only inside the WhatsApp message text, where WhatsApp shows them.

### Named Rules
**The Ink State Rule.** "On" is graphite: a graphite fill with white text for the pressed sector chip, the active organization pill, the chosen segment, the "Hoje" badge, the chosen day on the phone's month page and a line button once its action is done; graphite text over a 4px graphite underline for the chosen view tab. Only the activity open in the panel is tinted, Blush Tint inside a 2px graphite frame.

**The Stamp, Don't Erase Rule.** A cancelled activity is never removed, never hidden and never the next one: it stays on its sheet under the "Cancelada" stamp, struck through, with its reason in Deep Red; on the month page its mark or bar turns hollow, and its flyer becomes the Aviso de cancelamento.

## Do's and Don'ts

### Do:
- **Do** style every new surface with roles (`var(--role-*)`) from `css/theme.css`; when a colour is missing, add a palette entry and a role there.
- **Do** give anything presented as a sheet the folhinha's top: a 4px binding strip and a perforation row (13px together), 2px top corners, 6px bottom corners and a 1px Seam Grey edge.
- **Do** print a sheet's day with two digits in Barlow Condensed 800, in the folio column the times share (4rem; 4.5rem from 1100px), with tabular figures for times.
- **Do** print Sundays and national holidays in red on every calendar surface, and start month pages on Sunday.
- **Do** show "on" states with a graphite fill and white text, and keep every tap target at 44px or more (48px for the panel's actions).
- **Do** keep a cancelled activity on its sheet with the "Cancelada" stamp, the struck title and time, and "Motivo: …" in Deep Red.
- **Do** size interface text, and the boxes that hold text, in rem; keep flyers in px on the 1080 × 1350 canvas, with sizes planned by `js/flyer.js`.
- **Do** add a theme as a `:root[data-theme='name']` block that overrides palette entries or roles, try it with `?tema=<name>`, and update the `theme-color` meta by hand.

### Don't:
- **Don't** write a hex, rgb or named colour, or a `--color-*` palette variable, in `css/style.css` or `css/flyers.css`; `transparent`, `currentColor` and system colours inside `forced-colors` are the only exceptions.
- **Don't** use Próxima Yellow (#FFC20E) for anything but the next activity: not for focus rings, highlights or warnings, not on the month grid, not on flyers.
- **Don't** reduce the days to thin date dividers in one grey list, or print activities as coloured event pills: each day is a sheet, and a sector is a small square beside the organization.
- **Don't** fill cards, chips, lines or text with a sector colour; the only sector fills are the squares and the month page's multi-day bars.
- **Don't** put on the protest-poster costume: no raised fists, megaphones, stencil or distressed type, halftone or grunge textures. The Cartaz is the red header card at poster size with a day sheet on it.
- **Don't** bring back the retired Calendário de Luta devices: the metro line to election day, stations, countdowns, campaign slogans.
- **Don't** add a typeface outside the Barlow superfamily, or a weight that isn't self-hosted (Barlow 500, 600, 700; Barlow Condensed 600, 700, 800).
- **Don't** lift sheets, the month page or the desktop panel with shadows; shadows belong to what floats (the phone's bottom sheet, the chat bubble, the mark on the header).
- **Don't** tilt printed content; rotation belongs to hand-applied marks (the stamp, the circled day and its underline).
- **Don't** invent logos, photos or slogans for the organizations; they are named in text, with their full names where they are known.
