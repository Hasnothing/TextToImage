import http from "node:http";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serviceRoot = path.resolve(__dirname, "..");

function parseDotEnv(text) {
  const env = {};
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

async function loadEnvFile(filePath) {
  const raw = await fs.readFile(filePath, "utf8").catch(() => "");
  if (!raw) return;
  const parsed = parseDotEnv(raw);
  for (const [k, v] of Object.entries(parsed)) {
    if (process.env[k] == null) process.env[k] = v;
  }
}

function readJsonBody(req, maxBytes = 2_000_000) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let bytes = 0;
    req.on("data", (chunk) => {
      bytes += chunk.length;
      if (bytes > maxBytes) {
        reject(new Error("Request body too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      const text = Buffer.concat(chunks).toString("utf8");
      try {
        resolve(JSON.parse(text || "{}"));
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

function sendJson(res, statusCode, data) {
  const body = Buffer.from(JSON.stringify(data, null, 2), "utf8");
  res.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "content-length": String(body.length),
    "cache-control": "no-store",
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "content-type",
    "access-control-allow-methods": "GET,POST,OPTIONS",
  });
  res.end(body);
}

function sendText(res, statusCode, text) {
  const body = Buffer.from(text, "utf8");
  res.writeHead(statusCode, {
    "content-type": "text/plain; charset=utf-8",
    "content-length": String(body.length),
    "cache-control": "no-store",
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "content-type",
    "access-control-allow-methods": "GET,POST,OPTIONS",
  });
  res.end(body);
}

function clampNumber(value, { min, max, fallback }) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function normalizeWhitespace(text) {
  return String(text || "").replace(/\s+/g, " ").trim();
}

function joinPrompt(selectedText, extraPrompt) {
  const selected = normalizeWhitespace(selectedText);
  const extra = normalizeWhitespace(extraPrompt);
  if (!extra) return selected;
  return `${selected}\n\nStyle: ${extra}`;
}

function createMockSvgBase64({ title, lines }) {
  const safeLines = lines
    .slice(0, 8)
    .map((l) => normalizeWhitespace(l).slice(0, 110))
    .filter(Boolean);

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="768" height="768" viewBox="0 0 768 768">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0b0f17"/>
      <stop offset="1" stop-color="#141a2a"/>
    </linearGradient>
  </defs>
  <rect width="768" height="768" fill="url(#bg)"/>
  <rect x="44" y="44" width="680" height="680" rx="24" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.18)"/>
  <text x="84" y="118" fill="rgba(255,255,255,0.92)" font-family="ui-sans-serif, system-ui" font-size="28" font-weight="700">${escapeXml(
    title
  )}</text>
  ${safeLines
    .map((line, i) => {
      const y = 170 + i * 42;
      return `<text x="84" y="${y}" fill="rgba(255,255,255,0.78)" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="18">${escapeXml(
        line
      )}</text>`;
    })
    .join("\n")}
  <text x="84" y="708" fill="rgba(110,168,255,0.85)" font-family="ui-sans-serif, system-ui" font-size="14">Mock image (set SD_BASE_URL to generate real images)</text>
</svg>`;

  return Buffer.from(svg, "utf8").toString("base64");
}

function escapeXml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

async function callStableDiffusionTxt2Img({ sdBaseUrl, prompt, width, height, steps }) {
  const url = new URL("/sdapi/v1/txt2img", sdBaseUrl);
  const payload = {
    prompt,
    steps,
    width,
    height,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Stable Diffusion error: HTTP ${res.status} ${text}`);
  }

  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error("Stable Diffusion returned non-JSON response");
  }

  const images = Array.isArray(json.images) ? json.images : [];
  return {
    images,
    info: json.info,
  };
}

function normalizeSdImageBase64(value) {
  const raw = String(value || "");
  if (!raw) return "";
  const commaIdx = raw.indexOf(",");
  if (commaIdx !== -1 && raw.slice(0, commaIdx).includes("base64")) {
    return raw.slice(commaIdx + 1);
  }
  return raw;
}

await loadEnvFile(path.join(serviceRoot, ".env"));

const port = clampNumber(process.env.PORT, { min: 1, max: 65535, fallback: 8787 });
const host = process.env.HOST || "127.0.0.1";
const sdBaseUrl = process.env.SD_BASE_URL || "";
const mockMode = String(process.env.MOCK_MODE || "0") === "1";

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || host}`);
  const pathname = url.pathname;

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "content-type",
      "access-control-allow-methods": "GET,POST,OPTIONS",
      "cache-control": "no-store",
    });
    return res.end();
  }

  if (req.method === "GET" && pathname === "/health") {
    return sendJson(res, 200, {
      ok: true,
      providerConfigured: Boolean(sdBaseUrl) && !mockMode,
      sdBaseUrl: sdBaseUrl || null,
    });
  }

  if (req.method === "POST" && pathname === "/generate") {
    try {
      const body = await readJsonBody(req);
      const selectedText = String(body.selectedText || "");
      const promptExtra = String(body.prompt || "");

      const prompt = joinPrompt(selectedText, promptExtra);
      if (!prompt) {
        return sendJson(res, 400, { error: "selectedText is required" });
      }

      const width = clampNumber(body.width, { min: 256, max: 2048, fallback: 768 });
      const height = clampNumber(body.height, { min: 256, max: 2048, fallback: 768 });
      const steps = clampNumber(body.steps, { min: 5, max: 80, fallback: 25 });

      if (mockMode || !sdBaseUrl) {
        const base64 = createMockSvgBase64({
          title: "TextToImage",
          lines: [prompt.slice(0, 360)],
        });
        return sendJson(res, 200, {
          provider: "mock",
          images: [{ mime: "image/svg+xml", base64 }],
        });
      }

      const result = await callStableDiffusionTxt2Img({
        sdBaseUrl,
        prompt,
        width,
        height,
        steps,
      });

      const images = result.images
        .map((img) => normalizeSdImageBase64(img))
        .filter(Boolean)
        .map((base64) => ({ mime: "image/png", base64 }));

      if (images.length === 0) {
        return sendJson(res, 502, { error: "Stable Diffusion returned no images" });
      }

      return sendJson(res, 200, {
        provider: "stable-diffusion-webui",
        images,
      });
    } catch (err) {
      return sendJson(res, 500, { error: String(err?.message || err || "Unknown error") });
    }
  }

  return sendText(res, 404, "Not found");
});

server.listen(port, host, () => {
  // eslint-disable-next-line no-console
  console.log(`API server listening on http://${host}:${port}`);
  // eslint-disable-next-line no-console
  console.log(sdBaseUrl && !mockMode ? `SD provider: ${sdBaseUrl}` : "SD provider: (mock mode)");
});

