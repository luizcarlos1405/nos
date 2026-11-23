#!/usr/bin/env python3
"""The site on this computer, answered the way GitHub Pages answers it.

    python3 tools/serve.py [PORT]    # PORT 8000 by default; then open http://localhost:8000

The pages link to each other by their addresses without the extension (`agenda`, `noticias#nt-…`),
as GitHub Pages serves them: an address with no extension that names no file gets the page of the
same name (`/agenda` answers with `agenda.html`, `/agenda/` stays a 404). `python3 -m http.server`
doesn't, so the bar's links would lead to 404s there. Everything else is http.server's: the folder of
this repository whatever the current one, every network interface (a phone on the same network opens
http://<this computer's address>:PORT), no cache rules.
"""
import functools
import http.server
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class PagesHandler(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path):
        file = super().translate_path(path)
        page = file + '.html'
        if not os.path.exists(file) and not os.path.splitext(file)[1] and os.path.isfile(page):
            return page
        return file


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    handler = functools.partial(PagesHandler, directory=ROOT)
    with http.server.ThreadingHTTPServer(('', port), handler) as server:
        print(f'Serving {ROOT} at http://localhost:{port}/ (Ctrl+C stops it)', flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass


if __name__ == '__main__':
    main()
