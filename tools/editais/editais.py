#!/usr/bin/env python3
"""Reads the official sources of calls (editais, prizes, grants) listed in fontes.json, each from its last
reading on, and dumps what is new, for an agent to turn into rows of data/editais.csv.

    python3 -I tools/editais/editais.py                     # every source of the list
    python3 -I tools/editais/editais.py ID ...              # only these sources (they must be in the list)
    python3 -I tools/editais/editais.py --since 01/11/2026  # from that day on, whatever the last reading
    python3 -I tools/editais/editais.py --no-pdf            # list the Diário Oficial's editions, don't read them
    python3 -I tools/editais/editais.py --list              # the sources and when each was read

The dump goes to tools/editais/dumps/<date-time>/, which git ignores: README.md (the summary), one Markdown
file per source with what it found (each item with its day, its title, its link and the lines that matter),
abertos.md (the calls of data/editais.csv still open or coming, and the ones closed within CALLS_CLOSED_DAYS,
read again on their official pages: a deadline moved, a correction, a result, a page that moved) and diario/,
the text of every gazette edition read, to search in. Turning a dump into rows is a separate step: see
"Editais scan" in CLAUDE.md.

The kinds of source:
- gazette: an official gazette whose editions are PDFs read with pdftotext (poppler-utils): the Diário Oficial
  de Dourados, a WordPress feed of editions (`feed`), and the state's DOE-MS, a page listing its latest PDFs
  (`index`); the passages that name a call (edital, chamamento, resultado…) near a subject of the page
  (cultura, esporte, lazer…: settings.topics) are kept, with their page number, and with `require` only those
  near one of its names (the DOE-MS prints every state body: only the FCMS's and the Fundesporte's acts);
- wordpress: a site's news searched through its REST API for each of settings.terms (or the source's own
  `terms`), newest first, and with `pages` its pages changed since then (the city and the state foundations
  keep their calls on pages); the items on the subject come first, the others are only listed;
- listing: a page that lists calls (the MinC's open calls, Funarte's calls of the year, the sponsors' pages);
  the links not seen before are opened and their dates and amounts kept. Such a page can keep calls that
  already closed: the dates are what count;
- feed: an RSS or Atom feed (gov.br's search_rss, news searched for "edital"), the items since the last
  reading, the ones that speak of a call first;
- plone: the news of a newer gov.br site through its search API (`++api++/@search`, no login), every item
  since the last reading, the ones that speak of a call first;
- page: a page that announces a yearly call in its text, without a link per call (Petrobras' cultural
  selections): its lines with dates and amounts that weren't there at the last reading.

No browser and no login: plain web requests, one at a time, about a second apart. A source is read from a day
before its lastRead (posts dated late on a day aren't lost; the agent finds the repeats in the sheet).
fontes.json gets a source's new lastRead, for a listing the links it has seen and for a page the lines, as
soon as that source is done, so a run that stops can simply be started again; a source that failed keeps its
old one. Standard library only; run it with python3 -I.
"""

import argparse
import csv
import hashlib
import html
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import date, datetime, timedelta
from email.utils import parsedate_to_datetime
from pathlib import Path
from zoneinfo import ZoneInfo

HERE = Path(__file__).resolve().parent
SOURCES = HERE / 'fontes.json'
DUMPS = HERE / 'dumps'
SHEET = HERE.parent.parent / 'data' / 'editais.csv'
CONFIG = HERE.parent.parent / 'js' / 'config.js'  # CALLS_CLOSED_DAYS: how long a closed call stays on the page
TZ = ZoneInfo('America/Campo_Grande')
PACE = 1.0  # seconds between requests
FEED_PAGES = 40  # the gazette feed's pages read at most (10 editions each): about four months of editions
UA = 'Mozilla/5.0 (X11; Linux x86_64; rv:130.0) Gecko/20100101 Firefox/130.0'


# ---------- Text ----------

def norm(text):
    """Lower case, no accents: what the word lists are matched against."""
    return unicodedata.normalize('NFD', text or '').encode('ascii', 'ignore').decode().lower()


def word_pattern(words):
    """A regex for a list like ["cultur*", "arte", "aldir blanc"]: a trailing * matches any ending."""
    parts = [re.escape(w[:-1]) + r'\w*' if w.endswith('*') else re.escape(w) for w in words]
    return re.compile(r'\b(?:' + '|'.join(parts) + r')\b')


def found(pattern, text):
    """The distinct words of `pattern` in `text`, in the order they first appear."""
    seen = []
    for m in pattern.finditer(norm(text)):
        if m.group(0) not in seen:
            seen.append(m.group(0))
    return seen


def html_text(markup):
    """The readable text of a page: its content region when it has one, one line per block."""
    for marker in ('id="content"', '<main', '<article'):
        i = markup.find(marker)
        if i >= 0:
            markup = markup[i:]
            break
    markup = re.sub(r'(?is)<(script|style|noscript|svg|nav|footer|form)\b.*?</\1>', ' ', markup)
    markup = re.sub(r'\[/?[a-z][a-z0-9_-]*(?:\s[^\[\]]*)?\]', ' ', markup)  # page builders' shortcodes ([et_pb_text …])
    markup = re.sub(r'(?i)<br\s*/?>|</(p|div|li|h[1-6]|tr|section|article|dd|dt)>', '\n', markup)
    text = html.unescape(re.sub(r'<[^>]+>', ' ', markup))
    lines = [re.sub(r'[ \t ]+', ' ', line).strip() for line in text.split('\n')]
    return '\n'.join(line for line in lines if line)


KEY_LINES = re.compile(r'inscri|prazo|\bate\b.{0,30}\d{1,2}(/| de )|r\$|valor|podem participar|podem ser proponentes|quem pode|resultado|prorrog|retific|cronograma|atualizado em', re.I)


def key_lines(text, limit=12):
    """The lines that carry dates, amounts and who can apply, at most `limit`, each at most 300 characters."""
    out = []
    lines = text.split('\n')
    # gov.br sets "Atualizado em" and its date apart, and a calendar laid out as a table (Itaipu's) a step
    # ("Inscrição") and its days: put each back on one line.
    def label_of_next(i, line):
        if i + 1 >= len(lines):
            return False
        if re.fullmatch(r'(Atualizado|Publicado) em', line):
            return True
        return len(line) <= 40 and bool(KEY_LINES.search(norm(line))) and bool(re.match(r'\s*(at[ée] )?\d{1,2}/\d{1,2}(/\d{2,4})?\b', lines[i + 1], re.I))
    joined, i = [], 0
    while i < len(lines):
        if label_of_next(i, lines[i]):
            joined.append(f'{lines[i]} {lines[i + 1]}')
            i += 2
        else:
            joined.append(lines[i])
            i += 1
    lines = joined
    for line in lines:
        if KEY_LINES.search(norm(line)) and len(line) > 12:
            line = line if len(line) <= 300 else line[:297] + '…'
            if line not in out:
                out.append(line)
        if len(out) >= limit:
            break
    return out


def day_text(d):
    return d.strftime('%d/%m/%Y')


# ---------- The web ----------

_last_request = 0.0
_pace = PACE


def set_pace(seconds):
    """The wait between requests while a source is read (its `pace`, when its robots.txt asks for more)."""
    global _pace
    _pace = seconds


def fetch(url, binary=False, timeout=40):
    """GET `url`, `pace` seconds (about one) after the last request; the body as text (or bytes)."""
    global _last_request
    wait = _pace - (time.monotonic() - _last_request)
    if wait > 0:
        time.sleep(wait)
    request = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept-Language': 'pt-BR,pt;q=0.9'})
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            body = response.read()
            charset = response.headers.get_content_charset() or 'utf-8'
    finally:
        _last_request = time.monotonic()
    return body if binary else body.decode(charset, errors='replace').removeprefix('\ufeff')  # Sesc's API starts with a BOM


# ---------- The sources ----------

def since_of(source, settings, asked):
    """The first day to read: --since, else a day before the last reading, else settings.firstRead."""
    if asked:
        return asked
    if source.get('lastRead'):
        return datetime.fromisoformat(source['lastRead']).astimezone(TZ).date() - timedelta(days=1)
    return date.fromisoformat(settings['firstRead'])


def gazette_feed(source, since):
    """The editions of a gazette published as a WordPress feed (the Diário Oficial de Dourados), since `since`;
    each edition's page links its PDF. With whether the feed went back that far."""
    editions = []
    reached = False  # the feed went back to the first day asked (else editions are missing)
    for page in range(1, FEED_PAGES + 1):
        url = source['feed'] + (f'?paged={page}' if page > 1 else '')
        try:
            root = ET.fromstring(fetch(url))
        except urllib.error.HTTPError as err:
            if err.code == 404 and page > 1:
                reached = True  # past its last page: the feed holds nothing older
                break
            raise
        items = root.findall('./channel/item')
        if not items:
            reached = True
            break
        for item in items:
            published = parsedate_to_datetime(item.findtext('pubDate')).astimezone(TZ)
            if published.date() < since:
                reached = True
                continue
            editions.append({'title': (item.findtext('title') or '').strip(), 'link': (item.findtext('link') or '').strip(), 'day': published.date()})
        if reached:
            break
    if not reached:
        print(f'  o feed não chegou até {day_text(since)} em {FEED_PAGES} páginas: as edições mais antigas ficaram de fora', file=sys.stderr)
    return editions, reached, None


def gazette_index(source, since):
    """The editions of a gazette listed as PDF links on a page (the DOE-MS lists its latest ten or so, extras
    and supplements included), since `since`: each PDF an edition, its day from the date in its address
    (…/2026/11/25/DO12339_25_11_2026.pdf). With whether the list went back that far: a gazette read too
    seldom loses the editions that left its page."""
    page = fetch(source['index'])
    days = {}
    for pdf in dict.fromkeys(re.findall(source['pdf'], page)):
        m = re.search(r'/(\d{4})/(\d{2})/(\d{2})/', pdf)
        if m:
            days[pdf] = date(int(m[1]), int(m[2]), int(m[3]))
    if not days:
        raise ValueError(f"nenhum PDF na página {source['index']}: o padrão \"pdf\" da fonte precisa de uma olhada")
    oldest = min(days.values())
    reached = oldest <= since
    if not reached:
        print(f'  a página só lista edições desde {day_text(oldest)}: as de {day_text(since)} até lá ficaram de fora', file=sys.stderr)
    editions = []
    for pdf, day in days.items():
        if day >= since:
            name = urllib.parse.unquote(pdf.rsplit('/', 1)[-1]).removesuffix('.pdf')
            editions.append({'title': f"{source.get('short', source['name'])} {name}", 'link': pdf, 'day': day, 'pdfs': [pdf]})
    return editions, reached, oldest


def read_gazette(source, since, settings, run, read_pdf):
    """The editions of a gazette since `since`: each PDF read, the passages about calls kept."""
    editions, reached, oldest = gazette_index(source, since) if source.get('index') else gazette_feed(source, since)
    editions.sort(key=lambda e: (e['day'], e['title']))

    pdf_link = re.compile(source['pdf'])
    calls = word_pattern(settings['callWords'])
    topics = word_pattern(settings['topics'])
    skip = word_pattern(settings.get('skip', [])) if settings.get('skip') else None
    require = word_pattern(source['require']) if source.get('require') else None
    strip = [re.compile(p, re.S) for p in source.get('strip', [])]
    texts = run / 'diario'
    hits, read, no_pdf = [], 0, []
    for edition in editions:
        if 'pdfs' not in edition:  # an edition's page links its PDF
            edition['pdfs'] = list(dict.fromkeys(pdf_link.findall(fetch(edition['link']))))
        if not edition['pdfs']:
            no_pdf.append(edition)  # its page changed, or the PDF moved: the source's "pdf" pattern needs a look
            continue
        if not read_pdf:
            continue
        pages = []
        for pdf in edition['pdfs']:
            pages += pdf_pages(fetch(pdf, binary=True, timeout=120))
        read += 1
        texts.mkdir(parents=True, exist_ok=True)
        slug = re.sub(r'[^a-z0-9]+', '-', norm(edition['title'])).strip('-')[:80]
        (texts / f'{slug}.txt').write_text('\f'.join(pages), encoding='utf-8')
        found_here = []
        for number, text in enumerate(pages, 1):
            for pattern in strip:  # the masthead the gazette repeats (it names every public body)
                text = pattern.sub(' ', text)
            for excerpt, subjects in passages(text, calls, topics, skip, require):
                found_here.append({'page': number, 'excerpt': excerpt, 'subjects': subjects})
        hits += [{**edition, **group, 'file': f'diario/{slug}.txt'} for group in page_groups(found_here)]
    return {'editions': editions, 'read': read, 'hits': hits, 'reached': reached, 'oldest': oldest, 'no_pdf': no_pdf}


def page_groups(found_here, gap=2):
    """One call usually runs over several pages: the passages of pages at most `gap` apart become one item,
    with the first passage, every subject and the range of pages."""
    groups = []
    for item in found_here:
        if groups and item['page'] - groups[-1]['last'] <= gap:
            group = groups[-1]
            group['last'] = item['page']
            group['count'] += 1
            group['subjects'] += [s for s in item['subjects'] if s not in group['subjects']]
        else:
            groups.append({'first': item['page'], 'last': item['page'], 'count': 1, 'excerpt': item['excerpt'], 'subjects': list(item['subjects'])})
    return groups


def pdf_pages(data):
    """The text of each page of a PDF, through pdftotext."""
    with tempfile.NamedTemporaryFile(suffix='.pdf') as tmp:
        tmp.write(data)
        tmp.flush()
        out = subprocess.run(['pdftotext', '-enc', 'UTF-8', tmp.name, '-'], capture_output=True, check=True).stdout
    return out.decode('utf-8', errors='replace').split('\f')


def passages(text, calls, topics, skip=None, require=None, before=3, after=22, heading=15):
    """The stretches of a page where a call word (edital, chamamento, resultado…) has a subject of the page
    (cultura, esporte…) near it, unless the act's heading is a purchase, an auction, a hiring or a
    credenciamento (settings.skip), and, with `require`, only where one of its names (a body's) is in the
    stretch or the `heading` lines above it: merged when they overlap, each at most 1500 characters."""
    lines = [re.sub(r'\s+', ' ', line).strip() for line in text.split('\n')]
    lines = [line for line in lines if line]
    spans = []
    for i, line in enumerate(lines):
        if not calls.search(norm(line)):
            continue
        if skip and skip.search(norm(' '.join(lines[max(0, i - 6):i + 4]))):
            continue
        lo, hi = max(0, i - before), min(len(lines), i + after)
        if not found(topics, ' '.join(lines[lo:hi])):
            continue
        if require and not require.search(norm(' '.join(lines[max(0, lo - heading):hi]))):
            continue
        if spans and lo <= spans[-1][1]:
            spans[-1][1] = max(spans[-1][1], hi)
        else:
            spans.append([lo, hi])
    out = []
    for lo, hi in spans:
        excerpt = ' '.join(lines[lo:hi])
        out.append((excerpt if len(excerpt) <= 1500 else excerpt[:1497] + '…', found(topics, excerpt)))
    return out


def search_pages(api, term, since, per_page=50, pages=10):
    """Every post of a WordPress search since `since`, page after page until one comes back short."""
    for page in range(1, pages + 1):
        query = urllib.parse.urlencode({'search': term, 'after': f'{since.isoformat()}T00:00:00', 'per_page': per_page, 'page': page, 'orderby': 'date', 'order': 'desc', '_fields': 'id,date,link,title,excerpt'})
        try:
            batch = json.loads(fetch(f'{api}?{query}'))
        except urllib.error.HTTPError as err:
            if err.code == 400 and page > 1:  # past the last page
                return
            raise
        yield from batch
        if len(batch) < per_page:
            return
    print(f'  a busca por “{term}” passou de {pages} páginas: os posts mais antigos ficaram de fora', file=sys.stderr)


def changed_pages(api, since, per_page=50, pages=4):
    """Every page of a WordPress site created or edited since `since`, the latest change first."""
    for page in range(1, pages + 1):
        query = urllib.parse.urlencode({'modified_after': f'{since.isoformat()}T00:00:00', 'per_page': per_page, 'page': page, 'orderby': 'modified', 'order': 'desc', '_fields': 'id,date,modified,link,title,excerpt'})
        try:
            batch = json.loads(fetch(f'{api}?{query}'))
        except urllib.error.HTTPError as err:
            if err.code == 400 and page > 1:  # past the last page
                return
            raise
        yield from batch
        if len(batch) < per_page:
            return
    print(f'  mais de {per_page * pages} páginas alteradas: as mais antigas ficaram de fora', file=sys.stderr)


def wp_item(raw):
    """A post or page of the REST API as the dump shows it: its title and excerpt as plain text."""
    title = html.unescape(re.sub(r'<[^>]+>', '', raw['title']['rendered'])).strip()
    excerpt = html.unescape(re.sub(r'<[^>]+>', ' ', raw.get('excerpt', {}).get('rendered', '')))
    return {'id': raw['id'], 'day': datetime.fromisoformat(raw['date']).date(), 'title': title, 'link': raw['link'], 'excerpt': re.sub(r'\s+', ' ', excerpt).strip(), 'terms': []}


def read_wordpress(source, since, settings):
    """The site's posts since `since` that match any of its terms (settings.terms unless the source has its
    own), newest first; with `pages`, also its pages created or edited since then (the city's SEMC and the
    state's foundations keep each call on a page of its own, and add results to it). The items whose title
    or excerpt names a subject of the page, or a page whose title names a call, get the lines of their text
    with dates and amounts."""
    topics = word_pattern(settings['topics'])
    posts = {}
    for term in source.get('terms', settings['terms']):
        for raw in search_pages(source['api'], term, since):
            if raw['link'] not in posts:
                posts[raw['link']] = wp_item(raw)
            posts[raw['link']]['terms'].append(term)
    found_posts = sorted(posts.values(), key=lambda p: p['day'], reverse=True)
    for post in found_posts:
        post['subjects'] = found(topics, f"{post['title']} {post['excerpt']}")
        if post['subjects']:
            content = json.loads(fetch(f"{source['api']}/{post['id']}?_fields=content"))['content']['rendered']
            post['lines'] = key_lines(html_text(content))
    found_pages = []
    if source.get('pages'):
        pages_api = re.sub(r'/posts/?$', '/pages', source['api'])
        for raw in changed_pages(pages_api, since):
            page = {**wp_item(raw), 'changed': datetime.fromisoformat(raw['modified']).date()}
            page['subjects'] = found(topics, f"{page['title']} {page['excerpt']}")
            if page['subjects'] or CALL_TITLE.search(norm(page['title'])):
                content = json.loads(fetch(f"{pages_api}/{page['id']}?_fields=content"))['content']['rendered']
                page['lines'] = key_lines(html_text(content), 14)
            found_pages.append(page)
    return {'posts': found_posts, 'pages': found_pages}


GENERIC_LABEL = re.compile(r'(ver|saiba|leia|clique|acesse|acessar|confira)( mais| aqui| o edital)?|mais informac\w*|inscreva-se|gov\.br')


def read_listing(source):
    """The calls a listing page links to: the ones not seen before opened, their dates and amounts kept.
    Relative links count too (Itaipu's page mixes both); a link labelled only "Ver mais" or the like takes
    the title of its own page."""
    page = fetch(source['url'])
    prefix = source['prefix']
    links = {}
    for href, label in re.findall(r'<a\s[^>]*?href="([^"]+)"[^>]*>(.*?)</a>', page, re.S):
        href = urllib.parse.urljoin(source['url'], html.unescape(href).strip())
        if not href.startswith(prefix) or len(href) == len(prefix) or re.search(r'[#?]|\$\{|\{\{', href[len(prefix):]):
            continue  # another site's link, a menu's anchor, or a template the page fills in with JavaScript
        href = href.rstrip('/')
        if href.endswith(('.pdf', '/view')):
            continue
        label = re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', '', label))).strip()
        generic = len(label) <= 6 or bool(GENERIC_LABEL.fullmatch(norm(label)))
        if href not in links or (links[href] is None and not generic):
            links[href] = None if generic else label
    every = len(links)
    if source.get('match'):  # a news list: only the links whose label names a call
        wanted = re.compile(source['match'])
        links = {href: label for href, label in links.items() if label and wanted.search(norm(label))}
    seen = set(source.get('seen', []))
    new = []
    for href, label in links.items():
        if href in seen:
            continue
        markup = fetch(href)
        if not label:  # only "Ver mais": the page's own title
            title = re.search(r'(?is)<title[^>]*>(.*?)</title>', markup)
            label = re.sub(r'\s+', ' ', html.unescape(title.group(1))).strip() if title else href.rsplit('/', 1)[-1]
            links[href] = label
        new.append({'link': href, 'title': label, 'lines': key_lines(html_text(markup), 14)})
    return {'links': {href: label or href.rsplit('/', 1)[-1] for href, label in links.items()}, 'new': new, 'every': every}


def feed_day(text):
    """The day of a feed item: RFC 822 (RSS 2.0), ISO 8601 (Atom) or gov.br's "2026/11/25 11:29:48 GMT-3"."""
    text = (text or '').strip()
    try:
        return parsedate_to_datetime(text).astimezone(TZ).date()
    except (TypeError, ValueError, IndexError):
        pass
    try:
        moment = datetime.fromisoformat(text.replace('Z', '+00:00'))
        return (moment.astimezone(TZ) if moment.tzinfo else moment).date()
    except ValueError:
        pass
    m = re.match(r'(\d{4})[/-](\d{2})[/-](\d{2})', text)
    return date(int(m[1]), int(m[2]), int(m[3])) if m else None


def plain(markup):
    return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', markup or ''))).strip()


def read_feed(source, since):
    """The items of an RSS 1.0, RSS 2.0 or Atom feed published since `since`, newest first, each link once
    (gov.br lists a file both bare and as its "/view" page, and re-dates old items when it moves them).
    gov.br's search_rss holds only the 15 newest items: when even the oldest is newer than `since`, the ones
    between were lost, and the dump says so."""
    root = ET.fromstring(fetch(source['url']))
    rss1, dc, atom = '{http://purl.org/rss/1.0/}', '{http://purl.org/dc/elements/1.1/}', '{http://www.w3.org/2005/Atom}'
    raw = []
    for item in root.iter():
        if item.tag == 'item':  # RSS 2.0
            raw.append((item.findtext('title'), item.findtext('link'), item.findtext('pubDate') or item.findtext(f'{dc}date'), item.findtext('description')))
        elif item.tag == f'{rss1}item':  # RSS 1.0 (gov.br)
            raw.append((item.findtext(f'{rss1}title'), item.findtext(f'{rss1}link'), item.findtext(f'{dc}date'), item.findtext(f'{rss1}description')))
        elif item.tag == f'{atom}entry':
            link = item.find(f'{atom}link')
            raw.append((item.findtext(f'{atom}title'), link.get('href') if link is not None else '', item.findtext(f'{atom}published') or item.findtext(f'{atom}updated'), item.findtext(f'{atom}summary')))
    items, oldest = {}, None
    for title, link, when, description in raw:
        day = feed_day(when)
        link = re.sub(r'/view$', '', (link or '').strip())
        if not day or not link:
            continue
        oldest = day if oldest is None or day < oldest else oldest
        if day < since or link in items:
            continue
        title = plain(title) or urllib.parse.unquote(link.rsplit('/', 1)[-1])  # a file with no title: its name
        items[link] = {'day': day, 'title': title, 'link': link, 'excerpt': plain(description)[:400]}
    found_items = sorted(items.values(), key=lambda i: i['day'], reverse=True)
    for item in found_items:
        item['call'] = bool(CALL_NEWS.search(norm(f"{item['title']} {item['excerpt']}")))
    return {'items': found_items, 'total': len(raw), 'reached': oldest is None or oldest < since, 'oldest': oldest}


def read_plone(source, since, per_page=50, pages=6):
    """The items of a newer gov.br site (Plone 6) published since `since`, through its search API, which
    answers without login: `api` is the site's `++api++/pt-br/@search`, `params` what to search (the news,
    portal_type "News Item"). The site searches only titles and descriptions, so every item since then is
    read and the ones that speak of a call (edital, chamada, prêmio, seleção, inscrições…) come first."""
    items = []
    for page in range(pages):
        query = urllib.parse.urlencode({**source.get('params', {}), 'effective.query': since.isoformat(), 'effective.range': 'min', 'sort_on': 'effective', 'sort_order': 'descending', 'metadata_fields': ['effective', 'description'], 'b_size': per_page, 'b_start': page * per_page}, doseq=True)
        batch = json.loads(fetch(f"{source['api']}?{query}"))
        for raw in batch.get('items', []):
            link = raw.get('@id', '').replace('/++api++', '')
            day = feed_day(raw.get('effective'))
            if day and day >= since:
                items.append({'day': day, 'title': plain(raw.get('title')), 'link': link, 'excerpt': plain(raw.get('description'))[:400]})
        if (page + 1) * per_page >= batch.get('items_total', 0):
            break
    else:
        print(f'  mais de {per_page * pages} itens: os mais antigos ficaram de fora', file=sys.stderr)
    for item in items:
        item['call'] = bool(CALL_NEWS.search(norm(f"{item['title']} {item['excerpt']}")))
    return {'items': items, 'total': len(items), 'reached': True, 'oldest': None}


def line_key(line):
    """A short fingerprint of a line, to know it again at the next reading without keeping its text."""
    return hashlib.sha1(norm(line).encode()).hexdigest()[:10]


def read_page(source):
    """A page that announces its calls in its own text, with no link per call (Petrobras' cultural
    selections, once a year): its lines with dates and amounts that weren't there at the last reading."""
    lines = key_lines(html_text(fetch(source['url'])), 80)
    seen = set(source.get('seenLines', []))
    return {'lines': lines, 'new': [line for line in lines if line_key(line) not in seen], 'keys': list(dict.fromkeys(line_key(line) for line in lines)), 'first': not seen}


def sheet_rows():
    """data/editais.csv as the site reads it: UTF-8 or the Windows-1252 Excel saves, `;` or `,`, the headers
    matched without accents, case or spacing ("Página oficial" is pagina_oficial)."""
    raw = SHEET.read_bytes()
    try:
        text = raw.decode('utf-8-sig')
    except UnicodeDecodeError:
        text = raw.decode('cp1252')
    first = next((line for line in text.splitlines() if line.strip()), '')
    reader = csv.reader(text.splitlines(keepends=True), delimiter=';' if first.count(';') > first.count(',') else ',')
    rows = [r for r in reader if any(cell.strip() for cell in r)]
    if not rows:
        return []
    keys = [re.sub(r'[\s-]+', '_', norm(h).strip()) for h in rows[0]]
    return [dict(zip(keys, (cell.strip() for cell in r))) for r in rows[1:]]


def closed_days():
    """CALLS_CLOSED_DAYS of js/config.js: how long a closed call stays on the page (30 when it can't be read)."""
    try:
        m = re.search(r'CALLS_CLOSED_DAYS\s*=\s*(\d+)', CONFIG.read_text(encoding='utf-8'))
        return int(m[1]) if m else 30
    except OSError:
        return 30


def read_sheet_open(today):
    """The calls of data/editais.csv still open, opening or coming, and the ones the page still shows as
    closed (within CALLS_CLOSED_DAYS: their results come out then), read again on their official page. A
    page that doesn't open is said so: gov.br moves a call's page when its registration closes."""
    out = []
    keep_from = today - timedelta(days=closed_days())
    for row in sheet_rows():
        if norm(row.get('visivel', '')) in ('false', 'falso', 'nao', 'n', 'no', '0', 'off'):
            continue
        until = row.get('inscricoes_ate', '')
        try:
            last = datetime.strptime(until, '%d/%m/%Y').date() if until else None
        except ValueError:
            last = None
        if last and last < keep_from:
            continue
        page = row.get('pagina_oficial', '')
        item = {'title': row.get('titulo', ''), 'until': until or 'sem data', 'closed': bool(last and last < today), 'result': row.get('resultado', ''), 'page': page, 'checked': row.get('conferido_em', ''), 'lines': [], 'error': ''}
        if page.startswith('http') and not page.lower().endswith('.pdf'):
            try:
                item['lines'] = key_lines(html_text(fetch(page)), 12)
            except urllib.error.HTTPError as err:
                item['error'] = f'a página respondeu {err.code}' + (': ela mudou de endereço ou saiu do ar; procure a nova no site' if err.code in (404, 410) else '')
            except Exception as err:  # noqa: BLE001 — a page that fails is reported, the others go on
                item['error'] = str(err)
        out.append(item)
    return out


# ---------- The dump ----------

def gazette_md(source, since, result, read_pdf):
    lines = [f"# {source['name']}", '', f"Edições publicadas desde {day_text(since)}: {len(result['editions'])}; lidas: {result['read']}.", '']
    if not read_pdf:
        lines += ['Os PDFs não foram lidos (sem pdftotext, ou com --no-pdf): abra as edições abaixo.', '']
    if not result['reached'] and source.get('index'):
        lines += [f"A página do diário só lista as edições desde {day_text(result['oldest'])}: as de {day_text(since)} até lá ficaram de fora, e não há como pegá-las por aqui (procure no site, se precisar). Leia esta fonte ao menos uma vez por semana.", '']
    elif not result['reached']:
        lines += [f"O feed não chegou até {day_text(since)}: as edições mais antigas ficaram de fora, e esta fonte não teve a data de leitura atualizada. Rode de novo com `--since`.", '']
    if result['no_pdf']:
        lines += ['Edições sem PDF encontrado (a página delas mudou, ou o PDF mudou de lugar: confira o padrão "pdf" da fonte em fontes.json):', ''] + [f"- {day_text(e['day'])}: [{e['title']}]({e['link']})" for e in result['no_pdf']] + ['']
    if result['hits']:
        lines += ['## Trechos sobre editais no assunto da página', '', 'Páginas seguidas com trechos são um item só (um edital costuma ocupar várias): o trecho é o da primeira, e o texto inteiro está no arquivo da edição.', '']
        for hit in result['hits']:
            pages = f"página {hit['first']}" if hit['first'] == hit['last'] else f"páginas {hit['first']} a {hit['last']}"
            lines += [f"### {hit['title']}, {pages}", '', f"- Edição: {hit['link']}", f"- PDF: {', '.join(hit['pdfs'])}", f"- Assunto: {', '.join(hit['subjects'])}", f"- Texto da edição: `{hit['file']}` (as páginas são separadas por \\f)", '', f"> {hit['excerpt']}", '']
    else:
        lines += ['Nenhum trecho sobre editais no assunto da página.', '']
    lines += ['## As edições lidas', ''] + [f"- {day_text(e['day'])}: [{e['title']}]({e['link']})" + (f" ({len(e.get('pdfs', []))} PDF)" if e.get('pdfs') else '') for e in result['editions']]
    return '\n'.join(lines) + '\n'


CALL_TITLE = re.compile(r'\b(edita\w*|chamament\w*|chamada\w*|premiac\w*|premio\w*|selec\w*|inscric\w*|bolsa\w*|resultado\w*|prorrog\w*)\b')
# A news item about a call: stricter than CALL_TITLE, because a ministry's news speak of the national team
# ("Seleção Brasileira") and of match results all the time.
CALL_NEWS = re.compile(r'\b(edita\w*|chamament\w*|chamadas? publica\w*|premiac\w*|premio\w*|selec\w* publica\w*|processo seletivo|inscric\w*|bolsa\w*|patrocin\w*|resultados? (final|preliminar|provisorio|definitivo)\w*|prorrog\w*)\b')


def wordpress_md(source, since, result):
    on = [p for p in result['posts'] if p['subjects']]
    off = [p for p in result['posts'] if not p['subjects']]
    calls = [p for p in on if CALL_TITLE.search(norm(f"{p['title']} {p['excerpt']}"))]
    other = [p for p in on if p not in calls]
    lines = [f"# {source['name']}", '', f"Posts desde {day_text(since)} com {', '.join(f'“{t}”' for t in sorted({t for p in result['posts'] for t in p['terms']}))}: {len(calls)} sobre editais e chamadas, {len(other)} outros no assunto, {len(off)} fora dele.", '']
    for heading, posts in (('## Editais e chamadas (o título ou o resumo fala em edital, inscrição, prêmio, seleção, resultado)', calls), ('## Outros no assunto (notícias de cultura, esporte ou lazer: confira se algum abre uma chamada)', other)):
        if not posts:
            continue
        lines += [heading, '']
        for post in posts:
            lines += [f"### {day_text(post['day'])}: {post['title']}", '', f"- {post['link']}", f"- Assunto: {', '.join(post['subjects'])}", f"- Achado com: {', '.join(post['terms'])}", '']
            if post['excerpt']:
                lines += [f"> {post['excerpt']}", '']
            lines += [f'- {line}' for line in post.get('lines', [])] + ['']
    if off:
        lines += ['## Fora do assunto (só o título: confira se algum é de cultura, esporte ou lazer)', '']
        lines += [f"- {day_text(p['day'])}: [{p['title']}]({p['link']})" for p in off] + ['']
    if source.get('pages'):
        read = [p for p in result['pages'] if 'lines' in p]
        rest = [p for p in result['pages'] if 'lines' not in p]
        lines += [f"## Páginas criadas ou alteradas desde {day_text(since)}: {len(result['pages'])}", '', 'O site guarda cada edital numa página, e acrescenta a ela as retificações e os resultados: uma página alterada pode ser um edital novo ou uma mudança num que já está na planilha.', '']
        for page in read:
            made = f"criada em {day_text(page['day'])}" + ('' if page['changed'] == page['day'] else f", alterada em {day_text(page['changed'])}")
            lines += [f"### {page['title']}", '', f"- {page['link']}", f"- {made}"] + ([f"- Assunto: {', '.join(page['subjects'])}"] if page['subjects'] else []) + ['']
            lines += [f'- {line}' for line in page['lines']] + ['']
        if rest:
            lines += ['Fora do assunto (só o título):', ''] + [f"- {day_text(p['changed'])}: [{p['title']}]({p['link']})" for p in rest] + ['']
    return '\n'.join(lines) + '\n'


def items_md(source, since, result, what):
    """A feed's or a gov.br site's items: the ones that speak of a call with their summary, the others by title."""
    calls = [i for i in result['items'] if i['call']]
    other = [i for i in result['items'] if not i['call']]
    lines = [f"# {source['name']}", '', f"{source.get('url') or source['api']}", '', f"{what} desde {day_text(since)}: {len(calls)} falam de edital, chamada, prêmio, bolsa, patrocínio, inscrição ou resultado; {len(other)} outros.", '']
    if not result['reached']:
        lines += [f"O feed só guarda os {result['total']} itens mais novos, e o mais antigo é de {day_text(result['oldest'])}: os de {day_text(since)} até lá podem ter ficado de fora. Confira o site, ou leia esta fonte com mais frequência.", '']
    if calls:
        lines += ['## Falam de editais e chamadas', '']
        for item in calls:
            lines += [f"### {day_text(item['day'])}: {item['title']}", '', f"- {item['link']}", ''] + ([f"> {item['excerpt']}", ''] if item['excerpt'] else [])
    if other:
        lines += ['## Outros (só o título)', ''] + [f"- {day_text(i['day'])}: [{i['title']}]({i['link']})" for i in other] + ['']
    return '\n'.join(lines) + '\n'


def page_md(source, result):
    lines = [f"# {source['name']}", '', f"{source['url']}", '']
    if result['first']:
        lines += ['Primeira leitura: as linhas com datas e valores da página, guardadas para comparar na próxima.', ''] + [f'- {line}' for line in result['lines']] + ['']
    elif result['new']:
        lines += [f"{len(result['new'])} linhas com datas e valores que não estavam na página na última leitura (pode ser uma seleção nova, ou só a página reescrita):", ''] + [f'- {line}' for line in result['new']] + ['']
    else:
        lines += ['Nada mudou nas linhas com datas e valores.', '']
    return '\n'.join(lines) + '\n'


def listing_md(source, result):
    count = f"{len(result['links'])} editais na página" if not source.get('match') else f"{result['every']} links na página, {len(result['links'])} com título de chamada (`{source['match']}`)"
    lines = [f"# {source['name']}", '', f"{source['url']}", '', f"{count}; {len(result['new'])} novos desde a última leitura. A página pode listar editais que já fecharam: confira as datas.", '']
    for item in result['new']:
        lines += [f"## {item['title']}", '', f"- {item['link']}", ''] + [f'- {line}' for line in item['lines']] + ['']
    if not result['new']:
        lines += ['Nada novo.', '']
    return '\n'.join(lines) + '\n'


def open_md(items, today):
    lines = ['# Os editais da planilha, lidos de novo', '', f"Os editais de `data/editais.csv` com inscrições até {day_text(today)} ou depois (e os sem data), e os que fecharam há menos de {closed_days()} dias (os que a página ainda mostra), lidos de novo na página oficial: compare com a planilha (um prazo prorrogado, uma retificação, um resultado, uma página que mudou de endereço).", '']
    for group, title in ((False, '## Abertos, a abrir e em preparação'), (True, '## Fecharam há pouco (confira se saiu o resultado)')):
        chosen = [item for item in items if item['closed'] == group]
        if not chosen:
            continue
        lines += [title, '']
        for item in chosen:
            lines += [f"### {item['title']}", '', f"- Na planilha: inscrições até {item['until']}; conferido em {item['checked'] or '(vazio)'}" + (f"; resultado: {item['result']}" if group and item['result'] else ''), f"- Página oficial: {item['page'] or '(vazia)'}"]
            if item['error']:
                lines.append(f"- Não deu para ler a página: {item['error']}")
            lines += [''] + [f'- {line}' for line in item['lines']] + ['']
    if not items:
        lines += ['Nenhum edital aberto ou fechado há pouco na planilha.', '']
    return '\n'.join(lines) + '\n'


# ---------- Running ----------

def load_sources():
    return json.loads(SOURCES.read_text(encoding='utf-8'))


def save_sources(data):
    """fontes.json as it was written: one line per source."""
    out = ['{', '  "settings": {']
    settings = list(data['settings'].items())
    for i, (key, value) in enumerate(settings):
        out.append(f'    "{key}": {json.dumps(value, ensure_ascii=False)}' + (',' if i < len(settings) - 1 else ''))
    out += ['  },', '  "sources": [']
    for i, source in enumerate(data['sources']):
        out.append('    ' + json.dumps(source, ensure_ascii=False) + (',' if i < len(data['sources']) - 1 else ''))
    out += ['  ]', '}']
    tmp = SOURCES.with_suffix('.json.tmp')
    tmp.write_text('\n'.join(out) + '\n', encoding='utf-8')
    os.replace(tmp, SOURCES)  # a run stopped mid-write never leaves fontes.json cut in half


def parse_day(text):
    try:
        return datetime.strptime(text, '%d/%m/%Y').date()
    except ValueError:
        raise argparse.ArgumentTypeError(f'data inválida: {text} (use dd/mm/aaaa)')


def main():
    parser = argparse.ArgumentParser(description='Lê as fontes de editais de fontes.json e guarda o que há de novo em tools/editais/dumps/.')
    parser.add_argument('ids', nargs='*', metavar='ID', help='só estas fontes da lista (padrão: todas)')
    parser.add_argument('--since', type=parse_day, help='ler desde este dia (dd/mm/aaaa), qualquer que seja a última leitura')
    parser.add_argument('--no-pdf', action='store_true', help='listar as edições do Diário Oficial sem ler os PDFs')
    parser.add_argument('--list', action='store_true', help='mostrar as fontes e quando cada uma foi lida')
    args = parser.parse_args()

    data = load_sources()
    settings = data['settings']
    if args.list:
        for s in data['sources']:
            print(f"{s['id']:<26} {s['kind']:<10} {s.get('lastRead') or 'nunca lida':<27} {s['name']}")
        return 0
    known = {s['id'] for s in data['sources']}
    unknown = [i for i in args.ids if i not in known]
    if unknown:
        print(f"Fora da lista: {', '.join(unknown)}. As fontes são: {', '.join(sorted(known))}.", file=sys.stderr)
        return 2
    chosen = [s for s in data['sources'] if not args.ids or s['id'] in args.ids]

    read_pdf = not args.no_pdf
    if read_pdf and not shutil.which('pdftotext'):
        print('pdftotext não está instalado (poppler-utils): as edições do Diário Oficial serão só listadas.', file=sys.stderr)
        read_pdf = False

    started = datetime.now(TZ)
    today = started.date()
    run = DUMPS / started.strftime('%Y-%m-%d-%H%M')
    run.mkdir(parents=True, exist_ok=True)
    summary = []
    for source in chosen:
        since = since_of(source, settings, args.since)
        print(f"{source['name']} (desde {day_text(since)})…", flush=True)
        name = f"{source['id']}.md"
        set_pace(max(PACE, source.get('pace', PACE)))  # a site's robots.txt can ask for a slower pace
        try:
            if source['kind'] == 'gazette':
                result = read_gazette(source, since, settings, run, read_pdf)
                (run / name).write_text(gazette_md(source, since, result, read_pdf), encoding='utf-8')
                found_text = f"{len(result['hits'])} trechos em {len({h['link'] for h in result['hits']})} edições (de {len(result['editions'])}{'' if read_pdf else ', não lidas'})"
                if not result['reached']:
                    found_text += (f"; a página só lista as edições mais recentes: as de {day_text(since)} em diante que saíram dela ficaram de fora (leia esta fonte toda semana)" if source.get('index') else f"; o feed não chegou até {day_text(since)}: rode de novo com --since para as edições mais antigas")
                if result['no_pdf']:
                    found_text += f"; {len(result['no_pdf'])} sem PDF encontrado"
                # A feed that didn't reach far enough can be read again further back; a page of the latest
                # editions can't: what left it is gone, and the reading moves on.
                done = (read_pdf or not result['editions']) and (result['reached'] or bool(source.get('index'))) and not result['no_pdf']
            elif source['kind'] == 'wordpress':
                result = read_wordpress(source, since, settings)
                (run / name).write_text(wordpress_md(source, since, result), encoding='utf-8')
                on = [p for p in result['posts'] if p['subjects']]
                calls = sum(1 for p in on if CALL_TITLE.search(norm(f"{p['title']} {p['excerpt']}")))
                found_text = f"{calls} sobre editais, {len(on) - calls} outros no assunto, {len(result['posts']) - len(on)} fora dele"
                done = True
            elif source['kind'] == 'listing':
                result = read_listing(source)
                (run / name).write_text(listing_md(source, result), encoding='utf-8')
                found_text = f"{len(result['new'])} novos (de {len(result['links'])} na página)"
                source['seen'] = sorted(set(source.get('seen', [])) | set(result['links']))
                done = True
            elif source['kind'] in ('feed', 'plone'):
                result = read_feed(source, since) if source['kind'] == 'feed' else read_plone(source, since)
                (run / name).write_text(items_md(source, since, result, 'Itens' if source['kind'] == 'feed' else 'Notícias'), encoding='utf-8')
                calls = sum(1 for i in result['items'] if i['call'])
                found_text = f"{calls} sobre editais, {len(result['items']) - calls} outros"
                if not result['reached']:
                    found_text += f"; o feed só vai até {day_text(result['oldest'])}: itens entre {day_text(since)} e essa data podem ter ficado de fora"
                done = True  # a feed holds only its newest items: reading it again wouldn't bring the lost ones
            elif source['kind'] == 'page':
                result = read_page(source)
                (run / name).write_text(page_md(source, result), encoding='utf-8')
                found_text = 'primeira leitura' if result['first'] else (f"{len(result['new'])} linhas novas" if result['new'] else 'nada mudou')
                source['seenLines'] = result['keys']
                done = True
            else:
                raise ValueError(f"tipo de fonte desconhecido: {source['kind']}")
        except Exception as err:  # noqa: BLE001 — a source that fails is reported and keeps its lastRead
            print(f'  não deu para ler: {err}', file=sys.stderr)
            summary.append((source, since, f'não deu para ler: {err}', ''))
            continue
        finally:
            set_pace(PACE)
        if done:
            source['lastRead'] = started.isoformat(timespec='seconds')
            save_sources(data)
        print(f'  {found_text}', flush=True)
        summary.append((source, since, found_text, name))

    print('Os editais abertos da planilha…', flush=True)
    try:
        still_open = read_sheet_open(today)
        (run / 'abertos.md').write_text(open_md(still_open, today), encoding='utf-8')
        sheet_note = f"{len(still_open)} editais abertos da planilha lidos de novo (`abertos.md`)"
    except Exception as err:  # noqa: BLE001 — the sources were read; the sheet's problem is said, not fatal
        still_open = []
        sheet_note = f"não deu para ler data/editais.csv ({err}): os editais abertos não foram lidos de novo"
        print(f'  {sheet_note}', file=sys.stderr)

    readme = [f"# Varredura dos editais: {started.strftime('%d/%m/%Y %H:%M')}", '', f"{len(summary)} fontes; {sheet_note}.", '', '| Fonte | Desde | Achados | Arquivo |', '|---|---|---|---|']
    readme += [f"| {s['name']} | {day_text(since)} | {text} | {f'`{name}`' if name else ''} |" for s, since, text, name in summary]
    readme += ['', 'Próximo passo: "Editais scan" no CLAUDE.md do nos-app. Conferir cada achado no edital ou na página oficial, atualizar `data/editais.csv` e escrever aqui `editais-candidatos.md` para a equipe escolher.', '']
    (run / 'README.md').write_text('\n'.join(readme), encoding='utf-8')
    print(f'Pronto: {run}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
