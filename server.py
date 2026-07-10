#!/usr/bin/env python3
"""
Static file server + restricted HLS proxy.

The /proxy?url=<encoded-url> endpoint fetches a URL through the server so
the browser never contacts the upstream IPTV servers directly.  This fixes:
  1. Mixed-content blocking  (everything goes through the same HTTP origin)
  2. Missing CORS headers on the upstream redirect target

Security: only URLs whose hostname exactly matches ALLOWED_HOSTS are
proxied.  Private/loopback/link-local ranges are always blocked.
"""

import http.server
import ipaddress
import os
import re
import socket
import urllib.request
import urllib.parse
from urllib.parse import urlparse, urljoin

PORT = 5000
PROXY_TIMEOUT = 15   # seconds
STREAM_CHUNK  = 65536  # 64 KB chunks for streaming .ts segments

# ── Allowlist ────────────────────────────────────────────────────────────────
# Add every upstream hostname / IP that any proxied channel needs.
# The Stalker portal origin + the redirect-target CDN for stream 1548700.
ALLOWED_HOSTS: set[str] = {
    "204.52.191.254",
    "185.245.1.107",
}

# Private / reserved ranges — never proxy these regardless of allowlist.
_PRIVATE_NETS = [
    ipaddress.ip_network(r) for r in (
        "127.0.0.0/8",
        "10.0.0.0/8",
        "172.16.0.0/12",
        "192.168.0.0/16",
        "169.254.0.0/16",   # link-local
        "::1/128",
        "fc00::/7",
        "fe80::/10",
    )
]

def _is_private(host: str) -> bool:
    try:
        addr = ipaddress.ip_address(socket.gethostbyname(host))
        return any(addr in net for net in _PRIVATE_NETS)
    except Exception:
        return True   # block on resolution failure

def _validate_url(raw: str) -> str | None:
    """
    Return the URL if it is safe to proxy, else None.
    Accepts http/https only, hostname must be in ALLOWED_HOSTS, and must not
    resolve to a private/reserved IP.
    """
    try:
        p = urlparse(raw)
    except Exception:
        return None
    if p.scheme not in ("http", "https"):
        return None
    host = (p.hostname or "").lower()
    if host not in ALLOWED_HOSTS:
        return None
    if _is_private(host):
        return None
    return raw

# ── MIME helpers ─────────────────────────────────────────────────────────────
MIME_MAP = {
    ".ts":   "video/mp2t",
    ".m3u8": "application/vnd.apple.mpegurl",
    ".mpd":  "application/dash+xml",
    ".mp4":  "video/mp4",
    ".aac":  "audio/aac",
    ".mp3":  "audio/mpeg",
}

def _guess_mime(url: str, fallback: str) -> str:
    path = urlparse(url).path.lower()
    for ext, mime in MIME_MAP.items():
        if path.endswith(ext):
            return mime
    return fallback or "application/octet-stream"

# ── Playlist rewriting ───────────────────────────────────────────────────────
# Matches URI="..." attributes inside HLS tags (e.g. #EXT-X-KEY, #EXT-X-MAP)
_TAG_URI_RE = re.compile(r'URI="([^"]+)"')

def _abs(uri: str, origin: str, base_url: str) -> str:
    if uri.startswith(("http://", "https://")):
        return uri
    if uri.startswith("/"):
        return origin + uri
    return urljoin(base_url, uri)

def _proxy(uri: str) -> str:
    return "/proxy?url=" + urllib.parse.quote(uri, safe="")

def _rewrite_m3u8(raw: bytes, base_url: str) -> bytes:
    """
    Rewrite every URI in an HLS playlist so segments/sub-playlists are fetched
    via our /proxy endpoint.  Handles both bare URI lines AND URI="..." attrs
    inside HLS tags (#EXT-X-KEY, #EXT-X-MAP, #EXT-X-MEDIA, etc.).
    """
    p      = urlparse(base_url)
    origin = f"{p.scheme}://{p.netloc}"
    out    = []

    for raw_line in raw.decode("utf-8", errors="replace").splitlines():
        line = raw_line.strip()

        if not line:
            out.append(line)
            continue

        if line.startswith("#"):
            # Rewrite URI="..." attributes inside HLS tags
            def _replace_tag_uri(m: re.Match) -> str:
                abs_uri = _abs(m.group(1), origin, base_url)
                return f'URI="{_proxy(abs_uri)}"'
            out.append(_TAG_URI_RE.sub(_replace_tag_uri, line))
        else:
            # Bare URI line (segment or sub-playlist)
            abs_uri = _abs(line, origin, base_url)
            out.append(_proxy(abs_uri))

    return "\n".join(out).encode("utf-8")

# ── Request handler ──────────────────────────────────────────────────────────
class Handler(http.server.SimpleHTTPRequestHandler):

    def do_GET(self):
        p  = urlparse(self.path)
        qs = urllib.parse.parse_qs(p.query)
        if p.path == "/proxy" and "url" in qs:
            self._handle_proxy(qs["url"][0])
        else:
            super().do_GET()

    def do_HEAD(self):
        p  = urlparse(self.path)
        qs = urllib.parse.parse_qs(p.query)
        if p.path == "/proxy" and "url" in qs:
            ct = _guess_mime(qs["url"][0], "application/vnd.apple.mpegurl")
            self._write_headers(200, ct)
        else:
            super().do_HEAD()

    def do_OPTIONS(self):
        self._send(204, "text/plain", b"")

    # ---------------------------------------------------------------- proxy

    def _handle_proxy(self, target_url: str):
        safe_url = _validate_url(target_url)
        if safe_url is None:
            self._send(403, "text/plain", b"Forbidden")
            return
        try:
            req = urllib.request.Request(
                safe_url,
                headers={
                    "User-Agent": (
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                        "AppleWebKit/537.36 (KHTML, like Gecko) "
                        "Chrome/124.0.0.0 Safari/537.36"
                    ),
                    "Accept": "*/*",
                },
            )
            with urllib.request.urlopen(req, timeout=PROXY_TIMEOUT) as resp:
                final_url = resp.url
                server_ct = resp.headers.get("Content-Type", "")

                # Stream .ts segments in chunks — they can be ~1 MB each and
                # the player fetches several in parallel, so we must not
                # buffer them fully before sending the first byte.
                if final_url.split("?")[0].lower().endswith(".ts"):
                    ct = "video/mp2t"
                    content_length = resp.headers.get("Content-Length")
                    self._write_headers(200, ct,
                                        int(content_length) if content_length else None)
                    try:
                        while True:
                            chunk = resp.read(STREAM_CHUNK)
                            if not chunk:
                                break
                            self.wfile.write(chunk)
                        self.wfile.flush()
                    except (BrokenPipeError, ConnectionResetError):
                        pass
                    return

                # Everything else (playlists, sub-playlists, keys) — buffer
                # and inspect.  m3u8 playlists are small and need URI rewriting
                # regardless of the serving URL's file extension or Content-Type
                # (some origins serve them from .php endpoints).
                body = resp.read()
                if body.lstrip().startswith(b"#EXTM3U"):
                    ct   = "application/vnd.apple.mpegurl"
                    body = _rewrite_m3u8(body, final_url)
                else:
                    ct = _guess_mime(final_url, server_ct)
                self._send(200, ct, body)
                return

        except urllib.error.HTTPError as exc:
            self._send(exc.code, "text/plain", str(exc).encode())
        except Exception as exc:
            self._send(502, "text/plain", str(exc).encode())

    # ----------------------------------------------------------- helpers

    def _write_headers(self, code: int, content_type: str, length: int | None = None):
        try:
            self.send_response(code)
            self.send_header("Content-Type", content_type)
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "*")
            if length is not None:
                self.send_header("Content-Length", str(length))
            self.end_headers()
        except (BrokenPipeError, ConnectionResetError):
            pass

    def _send(self, code: int, content_type: str, body: bytes):
        try:
            self._write_headers(code, content_type, len(body))
            self.wfile.write(body)
        except (BrokenPipeError, ConnectionResetError):
            pass

    def log_message(self, fmt, *args):
        print(fmt % args, flush=True)


# ── Entry point ──────────────────────────────────────────────────────────────
if __name__ == "__main__":
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    # ThreadingHTTPServer handles each request in its own thread so the
    # player can fetch multiple .ts segments concurrently instead of queuing.
    with http.server.ThreadingHTTPServer(("0.0.0.0", PORT), Handler) as httpd:
        print(f"Serving on http://0.0.0.0:{PORT}")
        httpd.serve_forever()
