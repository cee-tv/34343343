/**
 * Vercel Node.js Serverless Function version of server.py's HLS proxy.
 *
 * IMPORTANT: this must run on Vercel's Node.js runtime, NOT the Edge
 * runtime. Both Cloudflare Workers AND Vercel Edge Functions block
 * outbound requests to bare IP addresses (error: "Direct IP access is not
 * allowed"), because both route outbound fetch() through their global edge
 * network. Vercel's Node.js Serverless Functions run as plain Node/Lambda
 * processes instead, so they have no such restriction -- same as
 * server.py's plain `http.client` requests.
 *
 * Deploy steps (no local tooling needed):
 *   1. https://vercel.com -> Add New -> Project -> Import this GitHub repo.
 *   2. Framework preset: "Other". No build command needed. Deploy.
 *   3. Copy the resulting URL, e.g. https://your-project.vercel.app
 *   4. In channels.js, set STATIC_HOST_PROXY_BASE_URL to that URL.
 *
 * vercel.json rewrites "/proxy" -> "/api/proxy" so the site can call the
 * same "/proxy?url=..." path regardless of which backend serves it.
 *
 * Security: only hostnames in ALLOWED_HOSTS are proxied; everything else is
 * rejected, mirroring server.py's allowlist.
 */

const ALLOWED_HOSTS = new Set(["204.52.191.254", "185.245.1.107"]);

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

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");
}

module.exports = async (req, res) => {
  setCors(res);

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  const target = req.query.url;
  if (!target) {
    res.status(400).send("Missing url param");
    return;
  }

  const safeUrl = validateUrl(target);
  if (!safeUrl) {
    res.status(403).send("Forbidden");
    return;
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
    res.status(502).send(`Upstream fetch failed: ${err}`);
    return;
  }

  const finalUrl = upstream.url || safeUrl;

  if (!upstream.ok) {
    const text = await upstream.text().catch(() => "");
    res.status(upstream.status).send(text);
    return;
  }

  if (finalUrl.split("?")[0].toLowerCase().endsWith(".ts")) {
    res.setHeader("Content-Type", "video/mp2t");
    const len = upstream.headers.get("Content-Length");
    if (len) res.setHeader("Content-Length", len);
    const buf = Buffer.from(await upstream.arrayBuffer());
    res.status(200).send(buf);
    return;
  }

  const bodyText = await upstream.text();
  if (bodyText.trimStart().startsWith("#EXTM3U")) {
    res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
    res.status(200).send(rewriteM3u8(bodyText, finalUrl));
    return;
  }

  res.setHeader(
    "Content-Type",
    guessMime(finalUrl, upstream.headers.get("Content-Type") || "")
  );
  res.status(200).send(bodyText);
};
