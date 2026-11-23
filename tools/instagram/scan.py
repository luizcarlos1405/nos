#!/usr/bin/env python3
"""Reads the Instagram pages listed in pages.json, each from its last scan on, and dumps what is new.

    python3 tools/instagram/scan.py              # every page of the list
    python3 tools/instagram/scan.py HANDLE ...   # only these pages (they must be in the list)

The dump goes to tools/instagram/dumps/<date-time>/, which git ignores: README.md (the summary), one Markdown
file per page (its bio, then each new post with its date, caption, collaborators, tagged location, event
reminder, every image and the text tesseract read in them) and img/. Turning a dump into agenda and news rows
is a separate step: see "Instagram scan" in CLAUDE.md.

pages.json gets a page's new lastScan and lastPost as soon as that page is done, so a run that stops can simply
be started again. Needs playwright-cli (npm i -g @playwright/cli) and tesseract with the Portuguese data. The
first time, log in to Instagram in the window that opens; the script waits for you and never sees the password.
The window has its own browser profile, logged in to the scan's own Instagram account. That account is named in
~/.local/share/nos-dourados/instagram-account, outside this repository because the repository is public, and the
scan stops if the window is logged in to any other account.

Every wait between page loads is drawn at random (pause), and the scan stops at the first warning Instagram shows
(stop_if_warned), leaving the window open.

This file also holds the Instagram reading that scripts/ig.py, the survey tool one folder above this repository,
imports. Instagram's markup lives in the *_JS strings: probe a live page before changing them.
"""

import argparse
import contextlib
import datetime as dt
import json
import os
import pathlib
import random
import re
import shutil
import subprocess
import sys
import time
import urllib.request
from zoneinfo import ZoneInfo

HERE = pathlib.Path(__file__).resolve().parent
REPO = HERE.parent.parent
PAGES_FILE = HERE / 'pages.json'
DUMPS = HERE / 'dumps'
# These live outside the repository, which is public: a copy of the browser profile is a login to the scan's
# account. ACCOUNT_FILE holds that account's handle, and also its number once the scan has seen it logged in
# (check_account). LOCK_FILE exists while a program reads Instagram through the window (browser_lock).
DATA = pathlib.Path.home() / '.local/share/nos-dourados'
BROWSER_PROFILE = DATA / 'instagram-scan'
ACCOUNT_FILE = DATA / 'instagram-account'
LOCK_FILE = DATA / 'instagram-scan.lock'

TZ = ZoneInfo('America/Campo_Grande')
PAUSE = (3, 9)    # seconds between page loads, drawn anew each time (pause): a steady beat is what a script looks like
LOAD_WAIT = 4     # the least a page gets to render after goto; the wait is drawn from here to PAUSE's top
LATE_POST_DAYS = 30  # how long after its code's date a post can appear (see coded_time)
OCR_LANG = 'por'  # tesseract language data for the text in images (`tesseract --list-langs`)
LOGIN_WAIT_MINUTES = 15
UNREADABLE_IN_A_ROW = 3  # stops the run: Instagram is probably limiting the session
DEFAULTS = {'maxPostsPerPage': 50, 'newPageDays': 30}

# playwright-cli's default session is shared with every project on the machine, where another tool can navigate
# the window away or close it, so the scan has its own session and browser profile. scripts/ig.py uses the same
# ones, so the survey reads Instagram with the same account, one program at a time (browser_lock).
SESSION = 'nos-instagram'
CWD = DUMPS       # playwright-cli writes its snapshots to .playwright-cli/ in the folder it runs from
SHOW_FROM = REPO  # image paths in a dump are relative to this

# --- browser ---------------------------------------------------------------------------------


class BrowserGone(SystemExit):
    """The browser didn't answer. Uncaught, it ends the program with its message."""


class LoginWall(SystemExit):
    """Instagram asked for a login. Uncaught, it ends the program with its message."""


class WrongAccount(SystemExit):
    """The window is logged in to an account other than the scan's. Uncaught, it ends the program with its message."""


class Warned(SystemExit):
    """Instagram showed a warning or a limit (stop_if_warned). Uncaught, it ends the program with its message."""


def pause(low=PAUSE[0], high=PAUSE[1]):
    """Waits a random time between low and high seconds, so the reading keeps no steady beat."""
    time.sleep(random.uniform(low, high))


def pw(*args):
    """Runs playwright-cli in this tool's session."""
    session = [f'-s={SESSION}'] if SESSION else []
    try:
        res = subprocess.run(['playwright-cli', *session, *args], cwd=CWD, capture_output=True, encoding='utf-8', errors='replace')
    except FileNotFoundError:
        sys.exit('playwright-cli não encontrado (instale com: npm i -g @playwright/cli).')
    return res.stdout + res.stderr


def evaluate(js):
    out = pw('eval', js)
    lines = out.split('\n')  # not splitlines(): it also breaks on U+2028 and the like, which captions carry
    for i, line in enumerate(lines):
        if line.startswith('### Result') and i + 1 < len(lines):
            value = json.loads(lines[i + 1])
            return json.loads(value) if isinstance(value, str) else value
    raise BrowserGone('O navegador não respondeu. Ele está aberto?\n' + out[-500:])


def goto(url):
    pw('goto', url)
    pause(LOAD_WAIT)
    state = evaluate("() => JSON.stringify({url: location.href, login: !!document.querySelector('input[name=\"username\"]')})")
    if state['login'] or '/accounts/login' in state['url']:
        raise LoginWall('O Instagram pediu login. Entre na janela do navegador e rode de novo.')
    stop_if_warned()

# Instagram's ways of saying it is limiting the account: a dialog ("Tente novamente mais tarde", "Suspeitamos de
# comportamento automatizado na sua conta"), a page of its own (a challenge or checkpoint, a suspended or disabled
# account) or the bare page it serves for a 429 ("Aguarde alguns minutos antes de tentar novamente"). Only dialogs and
# short pages are searched, so a caption that happens to say "tente novamente mais tarde" is not taken for one.
WARNING_JS = r"""() => {
  const words = /tente novamente mais tarde|try again later|comportamento automatizado|automated behavior|restringimos (determinadas|algumas) atividades|we restrict certain activity|aguarde alguns minutos|please wait a few minutes|confirme que (é|e) você|confirm (that )?it'?s you|atividade (suspeita|incomum)|(suspicious|unusual) activity|conta (foi )?(suspensa|desativada)|account (has been |was )?(suspended|disabled)/i;
  const page = /^\/(challenge|checkpoint|accounts\/(suspended|disabled))\b/.test(location.pathname) ? location.pathname : '';
  const dialogs = [...document.querySelectorAll('[role=dialog], [role=alertdialog]')].map((d) => d.innerText).join('\n');
  const body = document.body?.innerText || '';
  const said = (dialogs.match(words) || (body.length < 600 ? body.match(words) : null) || [''])[0];
  return JSON.stringify({ page, said });
}"""


def stop_if_warned():
    """Raises Warned when the page shows one of Instagram's warnings (WARNING_JS), so a run stops at the first one,
    before it opens anything else. The window stays open for the person to deal with it."""
    seen = evaluate(WARNING_JS)
    if seen['page'] or seen['said']:
        what = f"«{seen['said']}»" if seen['said'] else f"a página {seen['page']}"
        raise Warned(f'O Instagram mostrou um aviso ({what}). Parei na hora, sem abrir mais nada. Resolva o aviso à mão '
                     'na janela, que fica aberta (se ele pedir para confirmar a conta, confirme), e espere alguns dias '
                     'antes de rodar de novo.')

# --- profile ---------------------------------------------------------------------------------

EXPAND_BIO_JS = r"""() => {
  const more = [...document.querySelectorAll('header span, header div')]
    .find((e) => e.innerText === 'mais' || e.innerText === 'more');
  if (more) more.click();
  return JSON.stringify(!!more);
}"""

PROFILE_JS = r"""() => {
  const header = document.querySelector('header')?.innerText || '';
  const og = document.querySelector('meta[property="og:description"]')?.content || '';
  const text = document.body.innerText;
  const privado = /Esta conta é privada|This account is private/.test(text);
  const missing = /Esta página não está disponível|Sorry, this page isn't available/.test(text);
  return JSON.stringify({ header, og, privado, missing });
}"""

# Grid tiles, newest first; pinned ones (up to 3, on top) carry an icon labelled
# "Ícone de post fixado" / "Pinned post icon".
LINKS_JS = r"""() => {
  window.scrollTo(0, document.body.scrollHeight);
  const tiles = [...document.querySelectorAll('main a[href*="/p/"], main a[href*="/reel/"]')];
  const url = (a) => a.href.split('?')[0];
  const pinned = tiles.filter((a) => [...a.querySelectorAll('svg[aria-label]')]
    .some((s) => /fixad|pinned/i.test(s.getAttribute('aria-label'))));
  return JSON.stringify({ links: [...new Set(tiles.map(url))], pinned: pinned.map(url) });
}"""

# A post's shortcode is its media id in base 64, and a media id keeps the instant it was created, in
# milliseconds since IG_EPOCH_MS, above its low 23 bits.
SHORTCODE_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
IG_EPOCH_MS = 1314220021721


def post_code(url):
    return url.rstrip('/').rsplit('/', 1)[-1]


def coded_time(url):
    """When a post's code was created, read from its link, so without opening the post. Instagram shows that
    date or a later one, when a post was prepared ahead: on 534 posts checked on 2026-11-09, 1.7% were more than
    a day later, at most 23 days. A link that doesn't hold a code reads as the far future, so the post gets opened
    and its real date decides."""
    code = post_code(url)
    if not re.fullmatch(r'[A-Za-z0-9_-]{11,}', code):
        return dt.datetime.max.replace(tzinfo=TZ)
    number = 0
    for char in code[:11]:
        number = number * 64 + SHORTCODE_ALPHABET.index(char)
    return dt.datetime.fromtimestamp(((number >> 23) + IG_EPOCH_MS) / 1000, TZ)


def coded_day(url):
    return coded_time(url).date()


def profile(handle, max_posts=30, since=None, last_post=None):
    goto(f'https://www.instagram.com/{handle}/')
    if evaluate(EXPAND_BIO_JS):
        pause(1, 2)
    info = evaluate(PROFILE_JS)
    links, pinned, stale = [], set(), 0
    while len(links) < max_posts and stale < 3 and not info['privado'] and not info['missing']:
        pause(2, 4)
        stop_if_warned()
        found = evaluate(LINKS_JS)
        new = [u for u in found['links'] if u not in links]
        pinned.update(found['pinned'])
        stale = 0 if new else stale + 1
        links += new
        if last_post and any(post_code(u) == last_post and u not in pinned for u in new):
            break  # the grid reached the post the last scan ended at
        if since and new and all(coded_day(u) < since for u in new if u not in pinned):
            break  # a whole batch from before `since`: further down the grid is only older
    info['links'] = links[:max_posts]
    info['pinned'] = [u for u in info['links'] if u in pinned]
    info['handle'] = handle
    return info


def profile_md(info):
    lines = [f"# @{info['handle']}", '', f"https://www.instagram.com/{info['handle']}/", '']
    if info['missing']:
        return '\n'.join(lines + ['**Perfil não encontrado** (página indisponível).', ''])
    if info['privado']:
        lines += ['**Perfil privado**: os posts não podem ser lidos.', '']
    lines += ['## Perfil', '', '```', info['header'].strip(), '```', '']
    return '\n'.join(lines)

# --- posts -----------------------------------------------------------------------------------

POST_JS = r"""() => {
  const meta = (p) => document.querySelector(`meta[property="${p}"]`)?.content || '';
  const when = document.querySelector('main time[datetime]')?.getAttribute('datetime') || '';
  const links = [...document.querySelectorAll('main a[href^="/"]')].slice(0, 20)
    .map((a) => [a.getAttribute('href'), a.innerText.trim()]);
  // The post's own images; the big ones inside links are the "more posts" grid below it. A reel
  // has none of its own (it is a video): its cover is og:image.
  const img = [...document.querySelectorAll('main img')]
    .find((i) => i.naturalWidth >= 500 && !i.closest('a[href*="/p/"], a[href*="/reel/"]'));
  const video = !!document.querySelector('main video');
  // Every slide of a carousel comes from the post's data embedded in the page (script tags of
  // type application/json; the DOM holds only the slides next to the one shown): the biggest image
  // of each, the cover for a video slide. The same data names the owner and carries the event
  // reminder ("upcoming_event") a post may have.
  const code = location.pathname.split('/').filter(Boolean).pop();
  let data = null;
  const walk = (o, depth) => {
    if (!o || typeof o !== 'object' || depth > 80) return;
    if (Array.isArray(o)) { for (const x of o) walk(x, depth + 1); return; }
    if (o.code === code && (o.carousel_media || o.image_versions2) && !(data && data.carousel_media)) data = o;
    for (const k in o) walk(o[k], depth + 1);
  };
  for (const s of document.querySelectorAll('script[type="application/json"]')) {
    const t = s.textContent;
    if (t.includes(code) && t.includes('image_versions2')) { try { walk(JSON.parse(t), 0); } catch (e) { /* not ours */ } }
  }
  const best = (m) => (m.image_versions2?.candidates || [])
    .reduce((a, c) => (!a || c.width * c.height > a.width * a.height ? c : a), null)?.url || '';
  const slides = !data ? [] : (data.carousel_media?.length ? data.carousel_media : [data])
    .map((m) => ({ src: best(m), video: m.media_type === 2 }));
  const ev = data?.upcoming_event;
  return JSON.stringify({ when, og: meta('og:description'), links, img: img?.src || (video ? meta('og:image') : ''),
    alt: img?.alt || '', video, slides, owner: data?.user?.username || '',
    coauthors: (data?.coauthor_producers || []).map((u) => u.username).filter(Boolean),
    event: ev ? { title: ev.title || '', start: ev.start_time || 0, end: ev.end_time || 0 } : null });
}"""


def parse_post(url, raw):
    caption = ''
    m = re.search(r':\s*"(.*)"\.?\s*$', raw['og'], re.S)
    if m:
        caption = m.group(1).strip()
    # The post header lists the authors (collaborators first, owner last), then the location;
    # the owner's handle shows up again right after, so stop at the first repeat. The people tagged in
    # the photos come before the header, though, so the authors are taken from the post's own data
    # when the page has it: its collaborators (coauthor_producers), then its owner.
    authors, location = [], ''
    for href, text in raw['links']:
        if href.startswith('/explore/locations/'):
            location = location or text
            continue
        m = re.fullmatch(r'/([^/]+)/', href)
        if not m or href.startswith('/explore/'):
            break
        if m.group(1) in authors:
            break
        authors.append(m.group(1))
    if raw.get('owner'):
        authors = list(dict.fromkeys([*raw.get('coauthors', []), raw['owner']]))
    when = None
    if raw['when']:
        when = dt.datetime.fromisoformat(raw['when'].replace('Z', '+00:00')).astimezone(TZ)
    # Without the embedded data, the image found in the page stands for the only slide.
    slides = raw.get('slides') or ([{'src': raw['img'], 'video': raw['video']}] if raw['img'] else [])
    return {'url': url, 'when': when, 'caption': caption, 'authors': authors, 'location': location,
            'img': raw['img'], 'alt': raw['alt'], 'video': raw['video'], 'slides': slides,
            'owner': raw.get('owner', ''), 'event': raw.get('event')}


def fetch_posts(info, since=None, max_posts=30, seen=(), last_post=None):
    """The posts of a profile from `since` on, opening only what may be new. Everything under `last_post` (the
    code of the newest post the last scan saw) is old, as is a tile from before `since` (by its code, coded_day)
    and one in `seen` (codes earlier scans read): they stay closed. The one exception is the first older tile
    under the new ones when `last_post` isn't there, opened once, because a post prepared ahead has an older code
    than its date. The scan ends at it. An older tile above a new one is pinned or late, so it doesn't end the
    scan, which also keeps a pinned post whose icon wasn't recognized from ending it."""
    posts = []
    info['older'] = None  # newest post from before `since`: dates the profile when nothing is new
    links, pinned = info['links'][:max_posts], set(info.get('pinned', []))
    known = next((i for i, url in enumerate(links) if post_code(url) == last_post and url not in pinned), None)
    # A newer code under it means that tile isn't in its chronological place (say, a pinned post whose icon wasn't
    # recognized), so it can't mark where the new posts end, and the dates decide instead.
    above_known = known is not None and not any(coded_time(u) > coded_time(links[known]) for u in links[known + 1:])
    if above_known:
        info['older'] = coded_day(links[known])
        links = links[:known]
    last_new = max((i for i, url in enumerate(links)
                    if since and coded_day(url) >= since and post_code(url) not in seen), default=-1)

    def older(day):
        if info['older'] is None or day > info['older']:
            info['older'] = day

    for i, url in enumerate(links):
        code_day, is_pinned = coded_day(url), url in pinned
        new_by_place = above_known and not is_pinned  # above the last known post it is new, even with an older code
        code_older = since and code_day < since and not new_by_place
        ends_scan = i > last_new and not is_pinned and not new_by_place
        if post_code(url) in seen or (code_older and (is_pinned or code_day < since - dt.timedelta(LATE_POST_DAYS))):
            if ends_scan:
                older(code_day)
                break
            continue
        goto(url)
        post = parse_post(url, evaluate(POST_JS))
        pause()
        if since and post['when'] and post['when'].date() < since:
            if ends_scan:
                older(post['when'].date())
                break
            continue
        posts.append(post)
    return posts


def download(src, dest):
    dest.parent.mkdir(parents=True, exist_ok=True)
    req = urllib.request.Request(src, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=30) as res:
        dest.write_bytes(res.read())

# Flyers often carry the date, time and place only in the image. Tesseract reads plain text well but
# misses big display fonts and much of the text over photos, and garbles some of what it reads, so its
# text is a lead to confirm in the image. The first pass (the default layout) keeps the reading order;
# the second (sparse text) finds scattered words, such as a date over a photo, and adds only new lines
# with a 4-letter word or a date/time. Chosen on the flyers of the 28-30/10 checkups.
OCR_PASSES = (('3', r'\w{2}'), ('11', r'[^\W\d_]{4}|\d{1,2}\s*(?:[/:h]|horas?\b)'))


def ocr(path, known=''):
    """Lines tesseract reads in an image, one list per pass, without repeats or lines already in
    `known` (the caption)."""
    words = lambda text: ' ' + re.sub(r'\W+', ' ', text.lower()).strip() + ' '
    seen, passes = [words(known)], []
    for psm, wanted in OCR_PASSES:
        try:
            res = subprocess.run(['tesseract', str(path), '-', '-l', OCR_LANG, '--psm', psm],
                                 capture_output=True, encoding='utf-8', errors='replace', timeout=120)
            text = res.stdout
        except subprocess.TimeoutExpired:
            text = ''
        lines = []
        for line in map(str.strip, text.splitlines()):
            key = words(line)
            if re.search(wanted, line, re.I) and not any(key in s for s in seen):
                lines.append(line)
                seen.append(key)
        passes.append(lines)
    return passes


def ocr_ready(no_ocr=False):
    """OCR runs unless no_ocr; without tesseract the images are saved without it."""
    if no_ocr:
        return False
    if not shutil.which('tesseract'):
        print('tesseract não encontrado: as imagens serão salvas sem OCR.', file=sys.stderr)
        return False
    return True


def chosen_slides(post, all_slides=False, all_images=False):
    """(number, slide) of the images to save: an image post's image, the first image of a carousel
    (all of them with all_slides), and a video's cover only without a caption or with all_images."""
    picked = [(n, s) for n, s in enumerate(post['slides'], 1)
              if s['src'] and (all_images or not post['caption'] or not s['video'])]
    return picked if all_slides else picked[:1]


def event_md(event):
    """An Instagram event reminder attached to a post: its title and times in Dourados time."""
    stamp = lambda t: dt.datetime.fromtimestamp(t, TZ).strftime('%d/%m/%Y %H:%M') if t else ''
    span = stamp(event['start']) + (f" até {stamp(event['end'])}" if event['end'] else '')
    return ' · '.join(x for x in (event['title'], span) if x) or 'sem detalhes'


def shown(path):
    return path.resolve().relative_to(SHOW_FROM) if path.resolve().is_relative_to(SHOW_FROM) else path


def posts_md(handle, posts, images=None, all_images=False, read_text=True, all_slides=False):
    """Markdown of the posts. With an images folder it saves the image of every image post (the first
    slide of a carousel, or every slide with all_slides; the cover of a reel only without a caption, or
    with all_images) and, with read_text, the text read in it."""
    out = []
    for post in posts:
        when = post['when'].strftime('%d/%m/%Y %H:%M') if post['when'] else 'data desconhecida'
        out += [f"## {when} · {post['url']}", '']
        others = [a for a in post['authors'] if a != handle]
        if others:
            out.append(f"- **Coautores:** {', '.join('@' + a for a in others)}")
        if post['location']:
            out.append(f"- **Local marcado:** {post['location']}")
        if post['video']:
            out.append('- **Vídeo/reel** (o áudio e o texto falado não são lidos)')
        count = len(post['slides'])
        if count > 1:
            out.append(f'- **Carrossel:** {count} slides')
        if post.get('event'):
            out.append(f"- **Lembrete de evento do Instagram:** {event_md(post['event'])}")
        texts, known = [], post['caption']  # (label, OCR lines per pass) of each image read
        for num, slide in chosen_slides(post, all_slides, all_images) if images else []:
            label = f' {num}/{count}' if count > 1 else ''
            slug = re.sub(r'\W+', '', post['url'].rstrip('/').split('/')[-1]) + (f'-{num}' if num > 1 else '')
            dest = pathlib.Path(images) / f'{handle}-{slug}.jpg'
            try:
                download(slide['src'], dest)
                out.append(f'- **Imagem{label}:** {shown(dest)}')
            except Exception as err:  # noqa: BLE001 — a failed image must not stop the dump
                out.append(f'- **Imagem{label}:** falhou ({err})')
            else:
                if read_text:  # a slide's lines already read in the caption or an earlier slide are left out
                    passes = ocr(dest, known)
                    known += '\n' + '\n'.join(line for lines in passes for line in lines)
                    texts.append((label, passes))
        if post['alt'] and post['alt'] != post['caption'] and not post['alt'].startswith('Foto do perfil'):
            out.append(f"- **Texto alternativo da imagem:** {post['alt']}")
        earlier = False
        for label, passes in texts:
            if not any(passes):
                seen = [w for w, yes in (('da legenda', post['caption']), ('dos slides anteriores', earlier)) if yes]
                out.append(f'- **Texto na imagem{label} (OCR):** ' + ('nada além ' + ' e '.join(seen) if seen else 'nenhum reconhecido'))
            earlier = earlier or any(passes)
        out += ['', post['caption'] or '_(sem legenda: veja a imagem)_', '']
        for label, passes in texts:
            blocks = ['\n'.join(lines) for lines in passes if lines]
            if blocks:  # the sparse pass's lines come after a blank line
                out += [f'**Texto na imagem{label} (OCR; confira datas, horários e locais na imagem):**', '', '```text',
                        '\n\n'.join(blocks).replace('`', "'"), '```', '']
    return '\n'.join(out)


def older_md(info, since_text):
    when = info.get('older')
    return f'Post mais recente antes de {since_text}: {when:%d/%m/%Y}.\n\n' if when else ''


def parse_date(text):
    return dt.datetime.strptime(text, '%d/%m/%Y').date() if text else None

# --- the scan --------------------------------------------------------------------------------

LOGIN_JS = r"""() => JSON.stringify({
  in: document.cookie.includes('ds_user_id=') && !document.querySelector('input[name="username"]')
})"""

# The account the window is logged in to: its number (the ds_user_id cookie) and its handle. The handle comes from
# the link to the account's own profile in the side bar, outside main. That link reads "Perfil"/"Profile", or, when
# the bar is folded to icons, holds the account's photo.
ACCOUNT_JS = r"""() => {
  const id = (document.cookie.match(/(?:^|;\s*)ds_user_id=(\d+)/) || [])[1] || '';
  const links = [...document.querySelectorAll('a[href^="/"]')]
    .filter((a) => !a.closest('main') && /^\/[A-Za-z0-9._]+\/$/.test(a.getAttribute('href')));
  const own = links.find((a) => /^(Perfil|Profile)$/i.test(a.innerText.trim()))
    || links.find((a) => /Foto do perfil de|profile picture/i.test(a.querySelector('img[alt]')?.alt || ''));
  return JSON.stringify({ id, handle: own ? own.getAttribute('href').split('/')[1].toLowerCase() : '' });
}"""


def pid_alive(pid):
    if os.name != 'posix':
        return True  # on Windows os.kill(pid, 0) would end the process
    try:
        os.kill(pid, 0)
    except ProcessLookupError:
        return False
    except PermissionError:
        return True
    return True


@contextlib.contextmanager
def browser_lock(who):
    """Holds LOCK_FILE while `who` reads Instagram. The scan and scripts/ig.py share one window, so only one of
    them may run at a time. A lock left behind by a program that has ended is taken over."""
    try:
        pid, holder = LOCK_FILE.read_text(encoding='utf-8').split(' ', 1)
        if int(pid) != os.getpid() and pid_alive(int(pid)):
            sys.exit(f'O navegador do Instagram está em uso por {holder.strip()} (processo {pid}). Espere terminar '
                     f'e rode de novo; se nada estiver rodando, apague {LOCK_FILE}.')
    except (OSError, ValueError):
        pass
    LOCK_FILE.parent.mkdir(parents=True, exist_ok=True)
    LOCK_FILE.write_text(f'{os.getpid()} {who}\n', encoding='utf-8')
    try:
        yield
    finally:
        with contextlib.suppress(OSError):
            if LOCK_FILE.read_text(encoding='utf-8').split(' ', 1)[0] == str(os.getpid()):
                LOCK_FILE.unlink()


def browser_is_open():
    block = re.search(rf'^- {re.escape(SESSION)}:\n((?:  - .*\n?)*)', pw('list'), re.M)
    return bool(block and 'status: open' in block[1])


def profile_in_use():
    """The process of a browser that holds the profile but isn't this session's, or None. Chromium's
    SingletonLock is a link to "<host>-<pid>"."""
    try:
        pid = os.readlink(BROWSER_PROFILE / 'SingletonLock').rsplit('-', 1)[-1]
    except OSError:
        return None
    return int(pid) if pid.isdigit() and pid_alive(int(pid)) else None


def open_browser():
    """Opens this tool's browser unless it is open already; True when it opened it."""
    if browser_is_open():
        return False
    holder = profile_in_use()
    if holder:
        sys.exit(f'O perfil do navegador ({BROWSER_PROFILE}) já está aberto em outra janela (processo {holder}). '
                 'Feche-a e rode de novo.')
    BROWSER_PROFILE.mkdir(parents=True, exist_ok=True)
    out = pw('open', '--headed', '--browser', 'chromium', '--persistent', f'--profile={BROWSER_PROFILE}', 'https://www.instagram.com/')
    if not browser_is_open():
        # The output ends with a stack trace; its "Error:" line says what went wrong.
        error = next((line for line in out.splitlines() if line.startswith('Error:')), out[-800:].strip())
        if 'install-browser' in error:  # an update of playwright-cli that needs a newer build of the browser
            error += '\n\nO playwright-cli foi atualizado e precisa baixar o navegador dele. Rode\n    playwright-cli install-browser chromium --no-shell\ne depois a varredura de novo.'
        sys.exit('Não consegui abrir o navegador:\n' + error)
    pause(LOAD_WAIT)
    return True


def wait_for_login():
    """Returns once the browser is logged in to the scan's account, waiting for the person to log in in the window."""
    deadline, told = time.monotonic() + LOGIN_WAIT_MINUTES * 60, False
    expected = read_account()[0]
    while True:
        try:
            if evaluate(LOGIN_JS)['in']:
                break
        except BrowserGone:
            if not browser_is_open():
                raise  # otherwise the page was just changing, while the person logs in
        if not told:
            account = f' com @{expected}' if expected else ''
            print(f'\nEntre no Instagram{account} na janela que abriu. Continuo sozinho assim que você entrar.', flush=True)
            told = True
        if time.monotonic() > deadline:
            raise BrowserGone(f'Esperei {LOGIN_WAIT_MINUTES} minutos pelo login e parei. Rode de novo quando quiser.')
        time.sleep(5)
    if told:
        print('Entrou. Continuando…', flush=True)
    check_account()


def read_account():
    """(handle, number) of the scan's account, from ACCOUNT_FILE; ('', '') without the file. The number stays
    empty until check_account has seen the account logged in."""
    try:
        words = ACCOUNT_FILE.read_text(encoding='utf-8').split()
    except OSError:
        return '', ''
    handle = words[0].lstrip('@').lower() if words else ''
    return handle, (words[1] if len(words) > 1 and words[1].isdigit() else '')


def check_account():
    """Checks the window's account against ACCOUNT_FILE and returns its handle. Without the file there is nothing
    to check, and it returns ''. Another account raises WrongAccount. The first time it sees the right account, it
    writes that account's number after the handle, so later checks still work if the side bar's markup changes."""
    expected, number = read_account()
    if not expected:
        return ''
    seen = evaluate(ACCOUNT_JS)
    if not seen['handle'] and not (number and seen['id'] == number):
        goto('https://www.instagram.com/')  # a page without the side bar, such as "save your login info?"
        seen = evaluate(ACCOUNT_JS)
    if number and seen['id'] == number:
        return expected
    if seen['handle'] == expected:
        if seen['id']:
            ACCOUNT_FILE.write_text(f"{expected} {seen['id']}\n", encoding='utf-8')
        return expected
    who = f"@{seen['handle']}" if seen['handle'] else 'uma conta que não consegui identificar'
    raise WrongAccount(f'A janela do navegador está logada em {who}, não em @{expected} (a conta da varredura, '
                       f'em {ACCOUNT_FILE}). Saia dessa conta na janela, entre com @{expected} e rode de novo.')


def read_config():
    try:
        config = json.loads(PAGES_FILE.read_text(encoding='utf-8'))
    except (OSError, ValueError) as err:
        sys.exit(f'Não consegui ler {PAGES_FILE}: {err}')
    handles = [str(p.get('handle') or '').lower() for p in config.get('pages', [])]
    if not handles or not all(handles) or len(set(handles)) != len(handles):
        sys.exit(f'{PAGES_FILE.name}: a lista está vazia, ou tem uma página sem "handle" ou repetida.')
    return config


def save_config(config):
    """Writes the list with one page per line, so its diffs stay readable, through a temporary file so that a
    stopped run can't leave it half written."""
    items = []
    for key, value in config.items():
        if key == 'pages':
            rows = ',\n'.join('    ' + json.dumps(page, ensure_ascii=False) for page in value)
            items.append(f'  "pages": [\n{rows}\n  ]')
        else:
            items.append(f'  {json.dumps(key)}: {json.dumps(value, ensure_ascii=False)}')
    temporary = PAGES_FILE.with_suffix('.json.tmp')
    temporary.write_text('{\n' + ',\n'.join(items) + '\n}\n', encoding='utf-8')
    os.replace(temporary, PAGES_FILE)


def last_scan_of(page):
    """The page's lastScan as a time in Dourados; a date alone counts from the start of that day."""
    text = page.get('lastScan')
    if not text:
        return None
    when = dt.datetime.fromisoformat(text)
    return when.replace(tzinfo=TZ) if when.tzinfo is None else when.astimezone(TZ)


def read_page(page, settings, run, read_text):
    """Reads one page and writes its dump. Returns what the summary needs; `readable` tells whether the page's
    posts could be seen, the only case in which its lastScan may move."""
    handle = page['handle']
    started = dt.datetime.now(TZ)
    last_scan = last_scan_of(page)
    since = last_scan.date() if last_scan else started.date() - dt.timedelta(days=settings['newPageDays'])
    limit = settings['maxPostsPerPage']
    info = profile(handle, limit, since, page.get('lastPost'))
    readable = bool(info['links']) and not info['privado'] and not info['missing']
    posts = fetch_posts(info, since, limit, last_post=page.get('lastPost')) if readable else []
    if last_scan:
        posts = [p for p in posts if not p['when'] or p['when'] >= last_scan]
    since_text = f'{since:%d/%m/%Y}'
    dump = (profile_md(info) + f'## Posts desde {since_text} ({len(posts)})\n\n' + older_md(info, since_text)
            + posts_md(handle, posts, run / 'img', all_images=True, read_text=read_text, all_slides=True))
    (run / f'{handle}.md').write_text(dump, encoding='utf-8')
    note = ('perfil privado' if info['privado'] else 'não encontrado' if info['missing'] else 'nenhum post visível' if not readable
            else f'limite de {limit} posts atingido: pode faltar algum' if len(posts) >= limit else '')
    tiles = [u for u in info['links'] if u not in info['pinned']]
    newest = post_code(max(tiles, key=coded_time)) if tiles else page.get('lastPost')
    return {'readable': readable, 'count': len(posts), 'since': since_text, 'note': note, 'started': started, 'newest': newest}


def write_summary(run, started, pages_done, total, stopped):
    posts = sum(r['count'] for r in pages_done)
    lines = [f'# Varredura do Instagram: {started:%d/%m/%Y %H:%M}', '',
             f'{len(pages_done)} de {total} páginas lidas, {posts} posts novos.', '']
    if stopped:
        lines += [f'**Parou antes do fim:** {stopped}', '']
    lines += ['| Página | Organização | Desde | Posts novos | Observação | Arquivo |', '|---|---|---|---|---|---|']
    lines += [f"| @{r['handle']} | {r['name']} | {r['since']} | {r['count']} | {r['note']} | {r['handle']}.md |" for r in pages_done]
    (run / 'README.md').write_text('\n'.join(lines) + '\n', encoding='utf-8')


def main():
    parser = argparse.ArgumentParser(description='Lê as páginas de Instagram de pages.json, cada uma desde a última varredura, e guarda tudo em dumps/.')
    parser.add_argument('handles', nargs='*', metavar='HANDLE', help='só estas páginas da lista (padrão: todas)')
    args = parser.parse_args()

    config = read_config()
    settings = {**DEFAULTS, **config.get('settings', {})}
    wanted = {h.lstrip('@').lower() for h in args.handles}
    outside = wanted - {p['handle'].lower() for p in config['pages']}
    if outside:
        sys.exit(f"Fora da lista: {', '.join(sorted(outside))}. Acrescente em {PAGES_FILE.name} primeiro.")
    pages = [p for p in config['pages'] if not wanted or p['handle'].lower() in wanted]
    with browser_lock('a varredura (scan.py)'):
        scan_pages(config, settings, pages)


def scan_pages(config, settings, pages):
    """Reads the pages into a new dump folder, writing each page's lastScan and lastPost to pages.json as it goes."""
    started = dt.datetime.now(TZ)
    read_text = ocr_ready()
    pages_done, stopped, unreadable = [], '', 0
    opened_here = open_browser()
    run = DUMPS / started.strftime('%Y-%m-%d-%H%M')
    (run / 'img').mkdir(parents=True, exist_ok=True)
    close_at_end = opened_here
    try:
        wait_for_login()
        for number, page in enumerate(pages, 1):
            print(f"[{number}/{len(pages)}] @{page['handle']}: ", end='', flush=True)
            try:
                while True:
                    try:
                        result = read_page(page, settings, run, read_text)
                        break
                    except LoginWall:
                        wait_for_login()
            except BrowserGone:
                if not browser_is_open():
                    raise
                result = {'readable': False, 'count': 0, 'since': '', 'note': 'o navegador não respondeu nesta página', 'newest': None, 'started': None}
            except Exception as err:  # noqa: BLE001 — one page's trouble must not lose the rest of the run
                result = {'readable': False, 'count': 0, 'since': '', 'note': f'erro: {err}'[:200], 'newest': None, 'started': None}
            pages_done.append({'handle': page['handle'], 'name': page.get('name', ''), **result})
            if result['readable']:
                page['lastScan'] = result['started'].isoformat(timespec='seconds')
                if result['newest']:
                    page['lastPost'] = result['newest']
                save_config(config)
                unreadable = 0
            else:
                unreadable += 1
            print(f"{result['count']} posts novos" + (f" ({result['note']})" if result['note'] else ''), flush=True)
            write_summary(run, started, pages_done, len(pages), stopped)
            if unreadable >= UNREADABLE_IN_A_ROW:
                stopped = f'{UNREADABLE_IN_A_ROW} páginas seguidas sem resposta; o Instagram pode estar limitando. Tente mais tarde.'
                break
            pause()
    except WrongAccount as err:
        stopped, close_at_end = str(err), False  # the window stays open, so the person can log in to the scan's account
    except Warned as err:
        stopped, close_at_end = str(err), False  # the window stays open, so the person can see and answer the warning
    except BrowserGone as err:
        stopped, close_at_end = str(err) or 'o navegador fechou.', False
    except KeyboardInterrupt:
        stopped = 'interrompida à mão.'
    finally:
        write_summary(run, started, pages_done, len(pages), stopped)
        if close_at_end:
            pw('close')

    total = sum(r['count'] for r in pages_done)
    print(f'\n{len(pages_done)} de {len(pages)} páginas lidas, {total} posts novos.')
    print(f'Tudo em {run.relative_to(REPO)}/ (comece pelo README.md).')
    if stopped:
        print(f'Parou antes do fim: {stopped}\nRode de novo para continuar: cada página retoma de onde parou.')
        sys.exit(1)


if __name__ == '__main__':
    main()
