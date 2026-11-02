# Local preview server for site/: like `python3 -m http.server`, but tells the
# browser never to cache, so every reload shows the latest edits.
import functools
import http.server
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 5178


class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


handler = functools.partial(NoCache, directory='site')
http.server.ThreadingHTTPServer(('127.0.0.1', PORT), handler).serve_forever()
