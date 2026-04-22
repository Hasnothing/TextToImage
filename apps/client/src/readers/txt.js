import { slugify } from "../utils/text.js";

export async function loadTxtBook(file) {
  const text = await file.text();
  const title = stripExtension(file.name);
  return loadTxtBookFromChapters({
    id: `txt-${Date.now()}`,
    title,
    fileName: file.name,
    chapters: splitTxtIntoChapters(text).map((c) => ({
      title: c.title,
      text: reflowTxtText(c.text),
    })),
  });
}

export function loadTxtBookFromChapters({ id, title, fileName, chapters }) {
  const chapterObjs = (chapters || []).map((c, idx) => {
    const chapterTitle = String(c.title || `Chapter ${idx + 1}`);
    const chapterText = String(c.text || "");
    return {
      id: `txt-${idx}-${slugify(chapterTitle)}`,
      title: chapterTitle,
      loadHtml: async () => ({ title: chapterTitle, text: chapterText }),
    };
  });

  return {
    id: id || `txt-${Date.now()}`,
    type: "txt",
    title: title || "TXT",
    fileName: fileName || "book.txt",
    chapters: chapterObjs.length ? chapterObjs : [{ id: "txt-0-start", title: "Start", loadHtml: async () => ({ text: "" }) }],
  };
}

export function splitTxtIntoChapters(text) {
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
    return [{ title: "Start", text: String(text || "") }];
  }

  const chapters = [];
  for (let i = 0; i < markers.length; i++) {
    const startLine = markers[i].idx;
    const endLine = i + 1 < markers.length ? markers[i + 1].idx : lines.length;
    const title = markers[i].title;
    const body = lines.slice(startLine + 1, endLine).join("\n").trim();
    chapters.push({ title, text: body || "" });
  }

  return chapters.length > 0 ? chapters : [{ title: "Start", text: String(text || "") }];
}

export function reflowTxtText(text) {
  // Turn hard-wrapped lines into paragraphs:
  // - paragraph breaks are preserved as blank lines
  // - within a paragraph, newlines are collapsed to spaces
  const normalized = String(text || "").replaceAll("\r\n", "\n").trim();
  if (!normalized) return "";

  const blocks = normalized.split(/\n\s*\n+/g);
  const out = blocks
    .map((b) => b.trim().replace(/\n+/g, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean);
  return out.join("\n\n");
}

function stripExtension(name) {
  const dot = name.lastIndexOf(".");
  return dot === -1 ? name : name.slice(0, dot);
}

