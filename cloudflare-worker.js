/**
 * Cloudflare Worker version of server.py's HLS proxy.
 *
 * Deploy this on Cloudflare Workers (free tier) to make proxied channels
 * (like Channel 1/2, stream 1548700 & 440523) work when the site itself is
 * hosted on a static host with no backend, e.g. GitHub Pages or Cloudflare
 * Pages. The worker fetches the upstream IPTV stream server-side, which
 * fixes both mixed-content blocking and missing CORS headers, and rewrites
 * .m3u8 playlists so every segment/sub-playlist keeps flowing through this
 * same worker.
 *
 * Deploy steps (no local tooling needed):
 *   1. https://dash.cloudflare.com -> Workers & Pages -> Create -> Create Worker.
 *   2. Delete the default code, paste this whole file, click Deploy.
 *   3. Copy the worker's URL, e.g. https://your-worker.YOURSUBDOMAIN.workers.dev
 *   4. In channels.js, set PROXY_BASE_URL to that URL (see comment there).
 *
 * Security: only hostnames in ALLOWED_HOSTS are proxied; everything else is
 * rejected, mirroring server.py's allowlist.
 */

const ALLOWED_HOSTS = new Set([
  "204.52.191.254",
  "185.245.1.107",
]);

const MIME_MAP = {
  ".ts": "video/mp2t",
  ".m3u8": "application/vnd.apple.mpegurl",
  ".mpd": "application/dash+xml",
  ".mp4": "video/mp4",
  ".aac": "audio/aac",
  ".mp3": "audio/mpeg",
};

function guessMime(url, fallback) {
  const path = new URL(url).pathname.toLowerCase();
  for (const [ext, mime] of Object.entries(MIME_MAP)) {
    if (path.endsWith(ext)) return mime;
  }
  return fallback || "application/octet-stream";
}

function isPrivateHost(hostname) {
  // Cloudflare Workers can't do DNS resolution checks like server.py does;
  // block obviously-private literal hosts as a best-effort safeguard. The
  // real security boundary here is ALLOWED_HOSTS.
  return (
    hostname === "localhost" ||
    /^127\./.test(hostname) ||
    /^10\./.test(hostname) ||
    /^192\.168\./.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(hostname) ||
    /^169\.254\./.test(hostname) ||
    hostname === "::1"
  );
}

function validateUrl(raw) {
  let u;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return null;
  const host = u.hostname.toLowerCase();
  if (!ALLOWED_HOSTS.has(host)) return null;
  if (isPrivateHost(host)) return null;
  return u.toString();
}

function proxify(absoluteUrl) {
  return "/proxy?url=" + encodeURIComponent(absoluteUrl);
}

function absolutize(uri, origin, baseUrl) {
  if (/^https?:\/\//i.test(uri)) return uri;
  if (uri.startsWith("/")) return origin + uri;
  return new URL(uri, baseUrl).toString();
}

const TAG_URI_RE = /URI="([^"]+)"/g;

function rewriteM3u8(text, baseUrl) {
  const base = new URL(baseUrl);
  const origin = `${base.protocol}//${base.host}`;
  const lines = text.split(/\r?\n/);
  const out = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      out.push(line);
      continue;
    }
    if (line.startsWith("#")) {
      out.push(
        line.replace(TAG_URI_RE, (_m, uri) => {
          const absUri = absolutize(uri, origin, baseUrl);
          return `URI="${proxify(absUri)}"`;
        })
      );
    } else {
      const absUri = absolutize(line, origin, baseUrl);
      out.push(proxify(absUri));
    }
  }
  return out.join("\n");
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "Access-Control-Allow-Headers": "*",
};

async function handleProxy(targetUrl) {
  const safeUrl = validateUrl(targetUrl);
  if (!safeUrl) {
    return new Response("Forbidden", { status: 403, headers: CORS_HEADERS });
  }

  let upstream;
  try {
    upstream = await fetch(safeUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
          "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "*/*",
      },
      redirect: "follow",
    });
  } catch (err) {
    return new Response(`Upstream fetch failed: ${err}`, {
      status: 502,
      headers: CORS_HEADERS,
    });
  }

  const finalUrl = upstream.url || safeUrl;

  if (!upstream.ok) {
    return new Response(await upstream.text().catch(() => ""), {
      status: upstream.status,
      headers: CORS_HEADERS,
    });
  }

  // Stream .ts segments straight through without buffering.
  if (finalUrl.split("?")[0].toLowerCase().endsWith(".ts")) {
    const headers = new Headers(CORS_HEADERS);
    headers.set("Content-Type", "video/mp2t");
    const len = upstream.headers.get("Content-Length");
    if (len) headers.set("Content-Length", len);
    return new Response(upstream.body, { status: 200, headers });
  }

  // Everything else (playlists, keys, etc.) — buffer, sniff, rewrite if m3u8.
  const bodyText = await upstream.text();
  const headers = new Headers(CORS_HEADERS);
  if (bodyText.trimStart().startsWith("#EXTM3U")) {
    headers.set("Content-Type", "application/vnd.apple.mpegurl");
    return new Response(rewriteM3u8(bodyText, finalUrl), { status: 200, headers });
  }

  headers.set(
    "Content-Type",
    guessMime(finalUrl, upstream.headers.get("Content-Type") || "")
  );
  return new Response(bodyText, { status: 200, headers });
}

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (url.pathname === "/proxy") {
      const target = url.searchParams.get("url");
      if (!target) {
        return new Response("Missing url param", {
          status: 400,
          headers: CORS_HEADERS,
        });
      }
      return handleProxy(target);
    }

    return new Response("Not found. Use /proxy?url=<encoded-url>", {
      status: 404,
      headers: CORS_HEADERS,
    });
  },
};
