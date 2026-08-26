#!/usr/bin/env python3
"""Local static server for the frontend, with caching disabled.

Plain `python3 -m http.server` lets browsers cache JS/CSS indefinitely
with no way to bust it short of a hard-refresh, which caused real
confusion while iterating on this demo. This sends Cache-Control:
no-store on every response instead.
"""
import http.server
import sys


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
        super().end_headers()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 3000
    http.server.test(HandlerClass=NoCacheHandler, port=port)
