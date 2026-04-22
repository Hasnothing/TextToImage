import http from "node:http";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const port = Number(process.env.PORT || 5173);
const host = process.env.HOST || "127.0.0.1";

const mimeTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".webmanifest", "application/manifest+json; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".ico", "image/x-icon"],
  [".txt", "text/plain; charset=utf-8"],
]);

function send(res, status, headers, body) {
  res.writeHead(status, headers);
  res.end(body);
}

function safeDecodeUri(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${req.headers.host || host}`);
    let pathname = safeDecodeUri(url.pathname);
    if (pathname === "/") pathname = "/index.html";

    const absPath = path.join(rootDir, pathname);
    if (!absPath.startsWith(rootDir)) {
      return send(res, 403, { "content-type": "text/plain; charset=utf-8" }, "Forbidden");
    }

    const stat = await fs.stat(absPath).catch(() => null);
    if (!stat || !stat.isFile()) {
      return send(res, 404, { "content-type": "text/plain; charset=utf-8" }, "Not found");
    }

    const ext = path.extname(absPath).toLowerCase();
    const mime = mimeTypes.get(ext) || "application/octet-stream";
    const body = await fs.readFile(absPath);
    send(res, 200, { "content-type": mime, "cache-control": "no-store" }, body);
  } catch (err) {
    send(res, 500, { "content-type": "text/plain; charset=utf-8" }, String(err?.stack || err));
  }
});

server.listen(port, host, () => {
  // eslint-disable-next-line no-console
  console.log(`Client dev server: http://${host}:${port}`);
});
