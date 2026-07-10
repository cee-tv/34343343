# ceeplay

A static IPTV/streaming-style web app (plain HTML/CSS/JS, no build step, no backend). Uses JW Player for video playback and a local `channels.js` channel list.

## Running the project

- Workflow: `Start application` runs `python3 -m http.server 5000` to serve the static files.
- No package.json, framework, or database — just `index.html`, `styles.css`, `scripts.js`, `channels.js`.

## Notes

- `index.html` references a favicon `bisdaktv.png` that isn't present in the project (harmless 404, cosmetic only).
- Two leftover zip files (`April242026-main.zip`, `zipFile.zip`) are present at the project root from the import; left in place since removal wasn't requested.
