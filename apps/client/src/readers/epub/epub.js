import { openZip } from "./zip.js";
import { slugify } from "../../utils/text.js";

export async function loadEpubBook(file) {
  const ab = await file.arrayBuffer();
  const zip = await openZip(ab);

  const containerXml = await zip.readText("META-INF/container.xml");
  const container = parseXml(containerXml, "container.xml");
  const rootfile = firstByLocalName(container, "rootfile");
  const opfPath = rootfile?.getAttribute("full-path");
  if (!opfPath) throw new Error("Invalid EPUB: missing package (OPF) path");

  const opfXml = await zip.readText(opfPath);
  const opfDoc = parseXml(opfXml, opfPath);

  const title = getEpubTitle(opfDoc) || stripExtension(file.name);

  const opfDir = dirName(opfPath);
  const manifest = new Map();
  const manifestEl = firstByLocalName(opfDoc, "manifest");
  for (const item of allByLocalName(manifestEl || opfDoc, "item")) {
    const id = item.getAttribute("id");
    const href = item.getAttribute("href");
    if (!id || !href) continue;
    manifest.set(id, href);
  }

  const spineIds = [];
  const spineEl = firstByLocalName(opfDoc, "spine");
  for (const itemref of allByLocalName(spineEl || opfDoc, "itemref")) {
    const idref = itemref.getAttribute("idref");
    if (idref) spineIds.push(idref);
  }

  if (spineIds.length === 0) {
    throw new Error("Invalid EPUB: empty spine");
  }

  const chapters = spineIds
    .map((idref, idx) => {
      const href = manifest.get(idref);
      if (!href) return null;
      const fullPath = resolvePath(opfDir, href);
      return {
        id: `epub-${idx}-${slugify(fullPath)}`,
        title: `Section ${idx + 1}`,
        loadHtml: async () => {
          const xhtml = await zip.readText(fullPath);
          const doc = parseHtml(xhtml);
          const { chapterTitle, text } = extractReadableText(doc, `Section ${idx + 1}`);
          return { title: chapterTitle, text };
        },
      };
    })
    .filter(Boolean);

  return {
    id: `epub-${Date.now()}`,
    type: "epub",
    title,
    fileName: file.name,
    chapters,
  };
}

function parseXml(xmlText, label) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, "application/xml");
  const err = doc.querySelector("parsererror");
  if (err) throw new Error(`EPUB: invalid XML in ${label}`);
  return doc;
}

function parseHtml(htmlText) {
  const parser = new DOMParser();
  return parser.parseFromString(htmlText, "text/html");
}

function extractReadableText(doc, fallbackTitle) {
  const body = doc.querySelector("body");
  const heading = body?.querySelector("h1,h2,h3");
  const chapterTitle = heading?.textContent?.trim() || doc.querySelector("title")?.textContent?.trim() || fallbackTitle;

  if (!body) {
    return { chapterTitle, text: chapterTitle };
  }

  // Fast, reading-app oriented extraction:
  // - keep paragraphs and headings
  // - ignore images/scripts/styles
  const parts = [];
  const candidates = body.querySelectorAll("h1,h2,h3,p,li,blockquote");
  for (const el of candidates) {
    const text = normalizeText(el.textContent || "");
    if (!text) continue;
    parts.push(text);
  }

  const text = parts.length ? parts.join("\n\n") : normalizeText(body.textContent || "");
  return { chapterTitle, text };
}

function normalizeText(text) {
  const s = String(text || "")
    .replaceAll("\r\n", "\n")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  // Many EPUBs contain hard line breaks; reflow within paragraphs by collapsing single newlines.
  const blocks = s.split(/\n\s*\n+/g);
  const out = blocks
    .map((b) => b.trim().replace(/\n+/g, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean);
  return out.join("\n\n");
}

function stripExtension(name) {
  const dot = name.lastIndexOf(".");
  return dot === -1 ? name : name.slice(0, dot);
}

function dirName(path) {
  const idx = path.lastIndexOf("/");
  return idx === -1 ? "" : path.slice(0, idx + 1);
}

function resolvePath(baseDir, href) {
  if (!baseDir) return normalizePath(href);
  return normalizePath(baseDir + href);
}

function normalizePath(p) {
  const parts = String(p).split("/");
  const out = [];
  for (const part of parts) {
    if (!part || part === ".") continue;
    if (part === "..") out.pop();
    else out.push(part);
  }
  return out.join("/");
}

function firstByLocalName(docOrEl, localName) {
  if (!docOrEl) return null;
  const list = docOrEl.getElementsByTagNameNS?.("*", localName);
  if (list && list.length) return list[0];
  const all = docOrEl.getElementsByTagName?.(localName);
  return all && all.length ? all[0] : null;
}

function allByLocalName(docOrEl, localName) {
  if (!docOrEl) return [];
  const list = docOrEl.getElementsByTagNameNS?.("*", localName);
  if (list && list.length) return Array.from(list);
  const all = docOrEl.getElementsByTagName?.(localName);
  return all && all.length ? Array.from(all) : [];
}

function getEpubTitle(opfDoc) {
  const candidates = allByLocalName(opfDoc, "title")
    .map((el) => el?.textContent?.trim())
    .filter(Boolean);
  return candidates[0] || "";
}

