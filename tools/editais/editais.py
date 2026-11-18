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
abertos.md (the calls of data/editais.csv still open or coming, read again on their official pages: a
deadline moved, a correction, a result) and diario/, the text of every edition of the Diário Oficial read, to
search in. Turning a dump into rows is a separate step: see "Editais scan" in CLAUDE.md.

Three kinds of source:
- gazette: the Diário Oficial de Dourados, a WordPress feed of editions, each a PDF read with pdftotext
  (poppler-utils); the passages that name a call (edital, chamamento, resultado…) near a subject of the page
  (cultura, esporte, lazer…: settings.topics) are kept, with their page number;
- wordpress: a site's news searched through its REST API for each of settings.terms, newest first; the posts
  on the subject come first, the others are only listed;
- listing: a page that lists calls (the MinC's open calls, Funarte's calls of the year); the links not seen
  before are opened and their dates and amounts kept. Such a page can keep calls that already closed: the
  dates are what count.

No browser and no login: plain web requests, one at a time, about a second apart. A source is read from a day
before its lastRead (posts dated late on a day aren't lost; the agent finds the repeats in the sheet).
fontes.json gets a source's new lastRead, and for a listing the links it has seen, as soon as that source is
done, so a run that stops can simply be started again; a source that failed keeps its old one. Standard
library only; run it with python3 -I.
"""

import argparse
import csv
import html
import json
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
TZ = ZoneInfo('America/Campo_Grande')
PACE = 1.0  # seconds between requests
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
    markup = re.sub(r'(?i)<br\s*/?>|</(p|div|li|h[1-6]|tr|section|article|dd|dt)>', '\n', markup)
    text = html.unescape(re.sub(r'<[^>]+>', ' ', markup))
    lines = [re.sub(r'[ \t ]+', ' ', line).strip() for line in text.split('\n')]
    return '\n'.join(line for line in lines if line)


KEY_LINES = re.compile(r'inscri|prazo|\bate\b.{0,30}\d{1,2}(/| de )|r\$|valor|podem participar|podem ser proponentes|quem pode|resultado|prorrog|retific|cronograma|atualizado em', re.I)


def key_lines(text, limit=12):
    """The lines that carry dates, amounts and who can apply, at most `limit`, each at most 300 characters."""
    out = []
    lines = text.split('\n')
    # gov.br sets "Atualizado em" and its date apart: put them back on one line.
    lines = [f'{line} {lines[i + 1]}' if re.fullmatch(r'(Atualizado|Publicado) em', line) and i + 1 < len(lines) else line for i, line in enumerate(lines)]
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


def fetch(url, binary=False, timeout=40):
    """GET `url`, about a second after the last request; the body as text (or bytes)."""
    global _last_request
    wait = PACE - (time.monotonic() - _last_request)
    if wait > 0:
        time.sleep(wait)
    request = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept-Language': 'pt-BR,pt;q=0.9'})
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            body = response.read()
            charset = response.headers.get_content_charset() or 'utf-8'
    finally:
        _last_request = time.monotonic()
    return body if binary else body.decode(charset, errors='replace')


# ---------- The sources ----------

def since_of(source, settings, asked):
    """The first day to read: --since, else a day before the last reading, else settings.firstRead."""
    if asked:
        return asked
    if source.get('lastRead'):
        return datetime.fromisoformat(source['lastRead']).astimezone(TZ).date() - timedelta(days=1)
    return date.fromisoformat(settings['firstRead'])


def read_gazette(source, since, settings, run, read_pdf):
    """The editions of the Diário Oficial since `since`: each PDF read, the passages about calls kept."""
    editions = []
    for page in range(1, 8):
        url = source['feed'] + (f'?paged={page}' if page > 1 else '')
        try:
            root = ET.fromstring(fetch(url))
        except urllib.error.HTTPError as err:
            if err.code == 404 and page > 1:
                break
            raise
        items = root.findall('./channel/item')
        if not items:
            break
        older = False
        for item in items:
            published = parsedate_to_datetime(item.findtext('pubDate')).astimezone(TZ)
            if published.date() < since:
                older = True
                continue
            editions.append({'title': (item.findtext('title') or '').strip(), 'link': (item.findtext('link') or '').strip(), 'day': published.date()})
        if older:
            break
    else:
        print('  o feed não chegou até o primeiro dia pedido; as edições mais antigas ficaram de fora')
    editions.sort(key=lambda e: e['day'])

    pdf_link = re.compile(source['pdf'])
    calls = word_pattern(settings['callWords'])
    topics = word_pattern(settings['topics'])
    skip = word_pattern(settings.get('skip', [])) if settings.get('skip') else None
    strip = [re.compile(p, re.S) for p in source.get('strip', [])]
    texts = run / 'diario'
    hits, read = [], 0
    for edition in editions:
        page_html = fetch(edition['link'])
        edition['pdfs'] = list(dict.fromkeys(pdf_link.findall(page_html)))
        if not read_pdf or not edition['pdfs']:
            continue
        pages = []
        for pdf in edition['pdfs']:
            pages += pdf_pages(fetch(pdf, binary=True))
        read += 1
        texts.mkdir(parents=True, exist_ok=True)
        slug = re.sub(r'[^a-z0-9]+', '-', norm(edition['title'])).strip('-')[:80]
        (texts / f'{slug}.txt').write_text('\f'.join(pages), encoding='utf-8')
        found_here = []
        for number, text in enumerate(pages, 1):
            for pattern in strip:  # the masthead the gazette repeats (it names every public body)
                text = pattern.sub(' ', text)
            for excerpt, subjects in passages(text, calls, topics, skip):
                found_here.append({'page': number, 'excerpt': excerpt, 'subjects': subjects})
        hits += [{**edition, **group, 'file': f'diario/{slug}.txt'} for group in page_groups(found_here)]
    return {'editions': editions, 'read': read, 'hits': hits}


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


def passages(text, calls, topics, skip=None, before=3, after=22):
    """The stretches of a page where a call word (edital, chamamento, resultado…) has a subject of the page
    (cultura, esporte…) near it, unless the act's heading is a purchase, an auction, a hiring or a
    credenciamento (settings.skip): merged when they overlap, each at most 1500 characters."""
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
        if spans and lo <= spans[-1][1]:
            spans[-1][1] = max(spans[-1][1], hi)
        else:
            spans.append([lo, hi])
    out = []
    for lo, hi in spans:
        excerpt = ' '.join(lines[lo:hi])
        out.append((excerpt if len(excerpt) <= 1500 else excerpt[:1497] + '…', found(topics, excerpt)))
    return out


def read_wordpress(source, since, settings):
    """The site's posts since `since` that match any of settings.terms, newest first."""
    topics = word_pattern(settings['topics'])
    posts = {}
    for term in settings['terms']:
        query = urllib.parse.urlencode({'search': term, 'after': f'{since.isoformat()}T00:00:00', 'per_page': 50, 'orderby': 'date', 'order': 'desc', '_fields': 'id,date,link,title,excerpt'})
        for post in json.loads(fetch(f"{source['api']}?{query}")):
            if post['link'] not in posts:
                title = html.unescape(re.sub(r'<[^>]+>', '', post['title']['rendered'])).strip()
                excerpt = html.unescape(re.sub(r'<[^>]+>', ' ', post.get('excerpt', {}).get('rendered', '')))
                excerpt = re.sub(r'\s+', ' ', excerpt).strip()
                posts[post['link']] = {'id': post['id'], 'day': datetime.fromisoformat(post['date']).date(), 'title': title, 'link': post['link'], 'excerpt': excerpt, 'terms': []}
            posts[post['link']]['terms'].append(term)
    found_posts = sorted(posts.values(), key=lambda p: p['day'], reverse=True)
    for post in found_posts:
        post['subjects'] = found(topics, f"{post['title']} {post['excerpt']}")
        if post['subjects']:
            content = json.loads(fetch(f"{source['api']}/{post['id']}?_fields=content"))['content']['rendered']
            post['lines'] = key_lines(html_text(content))
    return {'posts': found_posts}


def read_listing(source):
    """The calls a listing page links to: the ones not seen before opened, their dates and amounts kept."""
    page = fetch(source['url'])
    prefix = re.escape(source['prefix'])
    links = {}
    for href, label in re.findall(rf'<a[^>]+href="({prefix}[^"#?]+)"[^>]*>(.*?)</a>', page, re.S):
        label = re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', '', label))).strip()
        href = href.rstrip('/')
        if len(label) > 6 and label.lower() != 'gov.br' and href not in links and not href.endswith(('.pdf', '/view')):
            links[href] = label
    seen = set(source.get('seen', []))
    new = []
    for href, label in links.items():
        if href in seen:
            continue
        text = html_text(fetch(href))
        new.append({'link': href, 'title': label, 'lines': key_lines(text, 14)})
    return {'links': links, 'new': new}


def read_sheet_open(today):
    """The calls of data/editais.csv still open, opening or coming, read again on their official page."""
    with open(SHEET, encoding='utf-8-sig', newline='') as f:
        rows = list(csv.DictReader(f, delimiter=';'))
    out = []
    for row in rows:
        if (row.get('Visível') or '').strip().upper() in ('FALSE', 'FALSO', 'NÃO', 'NAO', '0'):
            continue
        until = (row.get('Inscrições até') or '').strip()
        try:
            last = datetime.strptime(until, '%d/%m/%Y').date() if until else None
        except ValueError:
            last = None
        if last and last < today:
            continue
        page = (row.get('Página oficial') or '').strip()
        item = {'title': row.get('Título', ''), 'until': until or 'sem data', 'page': page, 'checked': row.get('Conferido em', ''), 'lines': [], 'error': ''}
        if page.startswith('http') and not page.lower().endswith('.pdf'):
            try:
                item['lines'] = key_lines(html_text(fetch(page)), 12)
            except Exception as err:  # noqa: BLE001 — a page that fails is reported, the others go on
                item['error'] = str(err)
        out.append(item)
    return out


# ---------- The dump ----------

def gazette_md(source, since, result, read_pdf):
    lines = [f"# {source['name']}", '', f"Edições publicadas desde {day_text(since)}: {len(result['editions'])}; lidas: {result['read']}.", '']
    if not read_pdf:
        lines += ['Os PDFs não foram lidos (sem pdftotext, ou com --no-pdf): abra as edições abaixo.', '']
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
    return '\n'.join(lines) + '\n'


def listing_md(source, result):
    lines = [f"# {source['name']}", '', f"{source['url']}", '', f"{len(result['links'])} editais na página; {len(result['new'])} novos desde a última leitura. A página pode listar editais que já fecharam: confira as datas.", '']
    for item in result['new']:
        lines += [f"## {item['title']}", '', f"- {item['link']}", ''] + [f'- {line}' for line in item['lines']] + ['']
    if not result['new']:
        lines += ['Nada novo.', '']
    return '\n'.join(lines) + '\n'


def open_md(items, today):
    lines = ['# Os editais abertos da planilha, lidos de novo', '', f"Os editais de `data/editais.csv` com inscrições até {day_text(today)} ou depois (e os sem data), lidos de novo na página oficial: compare com a planilha (um prazo prorrogado, uma retificação, um resultado).", '']
    for item in items:
        lines += [f"## {item['title']}", '', f"- Na planilha: inscrições até {item['until']}; conferido em {item['checked'] or '(vazio)'}", f"- Página oficial: {item['page'] or '(vazia)'}"]
        if item['error']:
            lines.append(f"- Não deu para ler a página: {item['error']}")
        lines += [''] + [f'- {line}' for line in item['lines']] + ['']
    if not items:
        lines += ['Nenhum edital aberto na planilha.', '']
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
    SOURCES.write_text('\n'.join(out) + '\n', encoding='utf-8')


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
        try:
            if source['kind'] == 'gazette':
                result = read_gazette(source, since, settings, run, read_pdf)
                (run / name).write_text(gazette_md(source, since, result, read_pdf), encoding='utf-8')
                found_text = f"{len(result['hits'])} trechos em {len({h['link'] for h in result['hits']})} edições (de {len(result['editions'])}{'' if read_pdf else ', não lidas'})"
                done = read_pdf or not result['editions']
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
            else:
                raise ValueError(f"tipo de fonte desconhecido: {source['kind']}")
        except Exception as err:  # noqa: BLE001 — a source that fails is reported and keeps its lastRead
            print(f'  não deu para ler: {err}', file=sys.stderr)
            summary.append((source, since, f'não deu para ler: {err}', ''))
            continue
        if done:
            source['lastRead'] = started.isoformat(timespec='seconds')
            save_sources(data)
        print(f'  {found_text}', flush=True)
        summary.append((source, since, found_text, name))

    print('Os editais abertos da planilha…', flush=True)
    still_open = read_sheet_open(today)
    (run / 'abertos.md').write_text(open_md(still_open, today), encoding='utf-8')

    readme = [f"# Varredura dos editais: {started.strftime('%d/%m/%Y %H:%M')}", '', f"{len(summary)} fontes; {len(still_open)} editais abertos da planilha lidos de novo (`abertos.md`).", '', '| Fonte | Desde | Achados | Arquivo |', '|---|---|---|---|']
    readme += [f"| {s['name']} | {day_text(since)} | {text} | {f'`{name}`' if name else ''} |" for s, since, text, name in summary]
    readme += ['', 'Próximo passo: "Editais scan" no CLAUDE.md do nos-app. Conferir cada achado no edital ou na página oficial, atualizar `data/editais.csv` e escrever aqui `editais-candidatos.md` para a equipe escolher.', '']
    (run / 'README.md').write_text('\n'.join(readme), encoding='utf-8')
    print(f'Pronto: {run}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
