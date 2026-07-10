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
import json
import os
import re
import socket
import urllib.request
import urllib.parse
from urllib.parse import urlparse, urljoin

PORT = 5000
PROXY_TIMEOUT = 15   # seconds
STREAM_CHUNK  = 65536  # 64 KB chunks for streaming .ts segments

# ── DRM keys ─────────────────────────────────────────────────────────────────
# Kept server-side only. Served one channel at a time via /api/drm/<number>
# so the full key set is never shipped to the browser as a static asset.
DRM_KEYS: dict[int, dict[str, str]] = {
    1: {"keyId": "2e7f9c518a424d30b2165c3e7a9d6041", "key": "8c8c0ef924c982bc1dd92348e024cd4c"},
    2: {"keyId": "b5d7a6219c434e188f026a3d7c5e9148", "key": "28e1244057ff6feae879c1e985ded0fb"},
    3: {"keyId": "8c4e9a516d724f30b2187a3c5e9d6041", "key": "e25c167573772b510ff8e5282560a349"},
    4: {"keyId": "24a8e6917c534d809f165b3e6a2d9047", "key": "183f05bcb80e9cfcb613b8c767777f27"},
    5: {"keyId": "d7f3c8215a944e068b176c9d2a5f3048", "key": "93c0a798243d6443864d1a7ff3e42c05"},
    6: {"keyId": "6a2d9f815c744e30b9168f3a7d2c5049", "key": "fb07ec8ca16ffdb8b8a045fa4c8aac74"},
    7: {"keyId": "c6e4b9218f534a709d165c3a7e2f8048", "key": "87c0e7cf73324aea32dada7b5f33063d"},
    8: {"keyId": "d7a9c5215e364b809f148c2d6a7e3045", "key": "c92a3b4a7fe9fab97c130468260b963f"},
    9: {"keyId": "e2c9a5748b314f60a9276d5e3c1f8042", "key": "c845cc41e3826b6d880b802911eb43f9"},
    10: {"keyId": "74d8f5916c234b80a9179e5d3c7a2046", "key": "f8d2753ff54579efc01d3373acf21f96"},
    11: {"keyId": "3e8c5a917d424f06b2196a5c9e2d8043", "key": "516c47ccef00a12421d9805c8c1c6c1d"},
    12: {"keyId": "e6c9a4215d734f608b197c3e2a5d9048", "key": "ec695ab203cb2258db220b3863e2a7ee"},
    13: {"keyId": "6f9c3a218d454b70a2187e5c3d6f9042", "key": "337ca7b74b462dd1ba7441553614538a"},
    14: {"keyId": "3a7f9c615d824e40a9168c5b2d7f3049", "key": "2bc91eced1660ecf88299a42e4c0cd91"},
    15: {"keyId": "27f6c4818a534d09b2169e5c7a3f6048", "key": "fbd8e319511ff5a1593f5b68da7b81cd"},
    16: {"keyId": "8f7a2c913d6b4e5a9f127c8d4e6a1b90", "key": "a73d3d1211fb23084c62572706f45397"},
    17: {"keyId": "e4b8d2916a534f709c187d3e5a2f6049", "key": "85d67d8b52caf380c82dc45b07f26f69"},
    18: {"keyId": "f2a7d6318c544b099e216d5f3a7c8042", "key": "1abff1626a5403fa2ea8964c2f3b9c1d"},
    19: {"keyId": "2f7c9a615d834e40b2188a6d3c7f9042", "key": "41d2ade5ff1798859420e925d5d2080d"},
    20: {"keyId": "9c3e7a516d824f04a9175b8c2e3d7040", "key": "524a9c2cec98272f71c347345a3fd12e"},
    21: {"keyId": "53c8e6914d724f30a9168b5e2c7d1043", "key": "1e17afbdfff786533796780f3f04aa67"},
    22: {"keyId": "1d9f6b828c454a17b2395e7d3f90a621", "key": "c5776d83cbf50c9354f27b1c830e1996"},
    23: {"keyId": "f3a8c9126e544d809b312c7f5a8e6140", "key": "43f5361983896b47ff01b4f77c5dbf3f"},
    24: {"keyId": "1f7c9a425d864e30b2198a3c6f7d5041", "key": "b392ee3cd42686a8cff3070eef614745"},
    25: {"keyId": "3c8e5a927d414b069f236a5c8e1d7049", "key": "a9b9198bf7b116b30492aea4dc471122"},
    26: {"keyId": "c5e8a3927d414b609f286a3c5e1d7049", "key": "7c5edbd3d090bb6de9a9c3685defa959"},
    27: {"keyId": "f8c2a6915d744b309e186a3f7c2d8049", "key": "1ad3243b38c60312caa6ba11f150c19c"},
    28: {"keyId": "91e4c6725a834d198f602c7b9e3a5148", "key": "4185d260443198690be03e294fdc1240"},
    29: {"keyId": "d9a4f5218c374b069e156f2d7a3c8049", "key": "72aa902f471adf15bef2710b6b689ed0"},
    30: {"keyId": "a6d4f8912c734b608e159f3a7d5c2046", "key": "ec647e6c500235352a8df03c518e9b23"},
    31: {"keyId": "4f9c6e217a354d80b9268e5c3f1a7042", "key": "41b33eebbacf91fe6c86bd28081bf3fd"},
    32: {"keyId": "e9c4f7312a854d69b0137f6e8c2a5490", "key": "1105fa92173b06885be336b887bc4d26"},
    33: {"keyId": "b2d8f6315c494e07a8129f6a3d5c2048", "key": "6b4247def21bbd0d08629a3cb4c62ee9"},
    34: {"keyId": "86e5c7921a434f60b9287d3c9e5a6041", "key": "fab817af24eab2a73ae89145797cf556"},
    35: {"keyId": "d5a7f8219c364e50b2147f6d3a8c9025", "key": "c77d5e56c52c4065c42594422ac85e2c"},
    36: {"keyId": "83e5c4917d624b00a2196f3c8a5e2047", "key": "d8fae6a24d5df3fa8e17a8f4a4854426"},
    37: {"keyId": "91a5e6327c844f09b2186d3a5e7c2041", "key": "984beb3aeff3554c1a5acc04d6044e55"},
    38: {"keyId": "7d4f9c216a834e508b165c3a7d9e2048", "key": "9d148906d890053a00f5e581185ac066"},
    39: {"keyId": "e8c5d2317a944f06b2186d3a9e7c5042", "key": "ce327be0871677eb1c480d10a73eac34"},
    40: {"keyId": "d5c8a2914e734b609f127a3d6c5e8048", "key": "11368a3b001407d65a85b4edb410ecdd"},
    41: {"keyId": "7f4a9c312e854d67b0198c6f5a3e7240", "key": "141f058ad1a6230e7c6f9d302ce378ef"},
    42: {"keyId": "b9e6a3214c754f908d165a3c7e2f6048", "key": "32300d9517f91a4acb747d360768dd00"},
    43: {"keyId": "f1a6e8329c574b048d216e5f3a7c9048", "key": "8106237b47f99be13f4e941ca5bd35c5"},
    44: {"keyId": "4e9a6c317d524f808b163c5a2e7d9048", "key": "5079e2288b584f47d4bbf8d149b2a986"},
    45: {"keyId": "b6c9f4218d734a059e165c3d7a2f8049", "key": "948aa5c0d0c15c70efb9257f5b75c379"},
    46: {"keyId": "18c6f9235b744d81a0397e2c9f6a5048", "key": "7974c1376447c563f5fdb41be0104ddf"},
    47: {"keyId": "72e4b9c13f864a52a9178d6c0e5b2394", "key": "9390c1edae5ecf680c168daf44bf6a03"},
    48: {"keyId": "d2e8c4715a634f09b2187c6d3e9a5042", "key": "8b11760042654021997fd07a8a0b7acc"},
    49: {"keyId": "73c5f8919d424b06a2186e7c3a5d9040", "key": "bf46e85e8fba9f0eae0931394d478d25"},
    50: {"keyId": "5e9a3c718d464f20b9157a6c2e4d8031", "key": "7bf8a7666a2d572fe111b5f829c99266"},
    51: {"keyId": "b1f4a8926c374d509e218a7c3f5d6049", "key": "15cde0b44b44f38ea936513a99606c1b"},
    52: {"keyId": "c1a5e8329d644f70b2187a3c6e5d2041", "key": "55979431f291f7dff35a43b73b3c2a36"},
    53: {"keyId": "f5c7a8219d464e30b2186a3f7c5d9041", "key": "dacc84b7010ca22f8c63a7c290461ed3"},
    54: {"keyId": "c8a4e6917f324d05b9186c5e3a2f7049", "key": "92b4ece8c84379145045267b47f183d2"},
    55: {"keyId": "35f8d6917a424b059e166c3a7d5f8049", "key": "76830e1bcb5819f76b7c515e9d65cc31"},
    56: {"keyId": "19f6c8325a744d90b2618e3f7c2a5049", "key": "784fffb38dc4fb6d5b74de822074feb4"},
    57: {"keyId": "a3d7f5916c824e09b2158a5c3f7d2046", "key": "32d760047f05c233d9dae35083fe0b30"},
    58: {"keyId": "f4b7c8219e364a058d295c6f3e7a1042", "key": "d10c7f2a37c1079e6b83837423c0d6b2"},
    59: {"keyId": "69f5a2318d744c609b125e3a7d8f2046", "key": "182523c0bae912e17e916dd4283280e9"},
    60: {"keyId": "ca7e5b318d624f099c246a3e7d5f8140", "key": "3175f0646c504fad87e97c7677a85393"},
    61: {"keyId": "c4a8d5319e624f078b156d3c7a5e2049", "key": "cee9422b4a40d85589f36f1d76fb144f"},
    62: {"keyId": "a7d3f5916c844b209e158f3a7d5c2046", "key": "021fe5515e7dfb1a00a98d51abd0cb7f"},
    63: {"keyId": "f4a8d6216c954e709b187d3a5f2c8049", "key": "34710df996a4089ee6f7e8deb7f46586"},
    64: {"keyId": "c7e5a2199d644b318f702a6c4e5d8139", "key": "300778996b5a71594db508982256f365"},
    65: {"keyId": "65d8c4912f734a90b8163e7c5d9a2041", "key": "fd495b984013da4e26f83b1a921c0a15"},
    66: {"keyId": "48e7d3219c564f80b2147a5d3e6c2048", "key": "23a7b41054c60983ad020652f7ffa06e"},
    67: {"keyId": "92d8f3416c754b09a2187e5d3a9c6042", "key": "4e668d238bc656b7d2c7535757aa9531"},
    68: {"keyId": "ab3d7e816f254c9490185d2a8f7e3640", "key": "a3bbc044cac690469a243c43f642c467"},
    69: {"keyId": "45c9e7328b614d059f247a6c3e5d1048", "key": "13ef5feae7c84eb06bcc655a225fb01d"},
    70: {"keyId": "56d8c4917a234e60b9159f3a6c7d2048", "key": "e6f0a100b6a2fcda66e8554f8c9b510b"},
    71: {"keyId": "b8c3d5906e424f17a9215d8c7a2e6043", "key": "02ce48f1b48f7cbdc3e2703a56e8fa31"},
    72: {"keyId": "e7a3d5916c824b459f105d8e2c7a3046", "key": "616f8ab0c416966e8de415cb60e9e6cf"},
    73: {"keyId": "c8b1d5f42a674e93b8016f2d9c7a5e34", "key": "168bbf02d7eca252a61a402e25cb33f5"},
    74: {"keyId": "84d2f6917b354c08a9163e5d8f2a7049", "key": "192c69ef479dd7e3fccc908d6c5dbb3a"},
    75: {"keyId": "e6b4c8217a954d309f165c8e2a3d7049", "key": "1acbc3a347d31fa2236f180574342e71"},
    76: {"keyId": "81f3e6924c754a08b9215d7e9c3f6048", "key": "094cd48e9729cb8bcb0e03e848fc8751"},
}

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

    # File extensions that must never be served as static files, even though
    # they live under the web root (source code, config, etc).
    _BLOCKED_EXT = (".py", ".pyc", ".log", ".env")

    def _is_blocked_static_path(self, path: str) -> bool:
        clean = path.split("?", 1)[0]
        return clean.lower().endswith(self._BLOCKED_EXT)

    def do_GET(self):
        p  = urlparse(self.path)
        qs = urllib.parse.parse_qs(p.query)
        if p.path == "/proxy" and "url" in qs:
            self._handle_proxy(qs["url"][0])
        elif p.path.startswith("/api/drm/"):
            self._handle_drm(p.path[len("/api/drm/"):])
        elif self._is_blocked_static_path(p.path):
            self._send(404, "text/plain", b"Not found")
        else:
            super().do_GET()

    def do_HEAD(self):
        p  = urlparse(self.path)
        qs = urllib.parse.parse_qs(p.query)
        if p.path == "/proxy" and "url" in qs:
            ct = _guess_mime(qs["url"][0], "application/vnd.apple.mpegurl")
            self._write_headers(200, ct)
        elif self._is_blocked_static_path(p.path):
            self._write_headers(404, "text/plain")
        else:
            super().do_HEAD()

    def do_OPTIONS(self):
        self._send(204, "text/plain", b"")

    # ------------------------------------------------------------------ drm

    def _handle_drm(self, number_str: str):
        try:
            number = int(number_str)
        except ValueError:
            self._send(400, "text/plain", b"Bad channel number")
            return
        entry = DRM_KEYS.get(number)
        if entry is None:
            self._send(404, "text/plain", b"Not found")
            return
        self._send(200, "application/json", json.dumps(entry).encode())

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
