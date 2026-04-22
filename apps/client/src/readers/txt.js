import { escapeHtml, slugify } from "../utils/text.js";

export async function loadTxtBook(file) {
  const text = await file.text();
  const title = stripExtension(file.name);
  const chapters = splitTxtIntoChapters(text).map((c, idx) => ({
    id: `txt-${idx}-${slugify(c.title)}`,
    title: c.title,
    loadHtml: async () => textToHtml(c.text),
  }));

  return {
    id: `txt-${Date.now()}`,
    type: "txt",
    title,
    fileName: file.name,
    chapters,
  };
}

function stripExtension(name) {
  const dot = name.lastIndexOf(".");
  return dot === -1 ? name : name.slice(0, dot);
}

function splitTxtIntoChapters(text) {
  const lines = String(text || "").replaceAll("\r\n", "\n").split("\n");
  const markers = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (/^(chapter|CHAPTER)\s+[\w\d]+/.test(line)) {
      markers.push({ idx: i, title: line });
      continue;
    }

    if (/^#{1,6}\s+/.test(line)) {
      markers.push({ idx: i, title: line.replace(/^#{1,6}\s+/, "") });
      continue;
    }

    if (/^(prologue|epilogue)$/i.test(line)) {
      markers.push({ idx: i, title: line });
      continue;
    }
  }

  if (markers.length === 0) {
    return [{ title: "Start", text }];
  }

  const chapters = [];
  for (let i = 0; i < markers.length; i++) {
    const startLine = markers[i].idx;
    const endLine = i + 1 < markers.length ? markers[i + 1].idx : lines.length;
    const title = markers[i].title;
    const body = lines.slice(startLine + 1, endLine).join("\n").trim();
    chapters.push({ title, text: body || "" });
  }

  return chapters.length > 0 ? chapters : [{ title: "Start", text }];
}

function textToHtml(text) {
  const normalized = String(text || "").replaceAll("\r\n", "\n").trim();
  if (!normalized) return `<p><em>(Empty chapter)</em></p>`;

  const chunks = normalized.split(/\n\s*\n+/g);
  const paragraphs = chunks.map((p) => {
    const safe = escapeHtml(p.trim()).replaceAll("\n", "<br />");
    return `<p>${safe}</p>`;
  });

  return paragraphs.join("\n");
}

