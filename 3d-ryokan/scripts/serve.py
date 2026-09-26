"""Serve the offline 3D prototype. Run from any directory with Python 3."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import argparse
import threading
import webbrowser

parser = argparse.ArgumentParser()
parser.add_argument('--no-browser', action='store_true')
parser.add_argument('--port', type=int, default=8317)
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
url = f'http://127.0.0.1:{args.port}/'
handler = partial(SimpleHTTPRequestHandler, directory=str(root))
try:
    server = ThreadingHTTPServer(('127.0.0.1', args.port), handler)
except OSError as exc:
    print(f'Could not start the server: {exc}\nIf already running, open {url}\nOr try: python scripts/serve.py --port 8318')
    raise SystemExit(1)
print(f'Kuraberu Lab: {url}\nKeep this window open. Press Ctrl+C to stop.')
if not args.no_browser:
    threading.Timer(.5, lambda: webbrowser.open(url)).start()
try:
    server.serve_forever()
except KeyboardInterrupt:
    pass
finally:
    server.server_close()
