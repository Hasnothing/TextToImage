import { loadTxtBook } from "./txt.js";
import { loadTxtBookFromChapters } from "./txt.js";
import { loadEpubBook } from "./epub/epub.js";
import { loadPdfBook } from "./pdf.js";

export async function loadBookFromFile(file) {
  const name = String(file?.name || "book");
  const ext = getFileExtension(name);

  if (ext === "txt") return loadTxtBook(file);
  if (ext === "epub") return loadEpubBook(file);
  if (ext === "pdf") return loadPdfBook(file);
  if (ext === "azw3" || ext === "mobi") {
    throw new Error(`${ext.toUpperCase()} is not supported yet. Convert it to EPUB (Calibre) and import again.`);
  }

  throw new Error(`Unsupported file type: .${ext || "(unknown)"}`);
}

export async function loadBookFromRecord(record) {
  const type = String(record?.type || "");
  const fileName = String(record?.fileName || `${record?.title || "book"}.${type || "txt"}`);
  const content = record?.content;

  if (!content) throw new Error("Library record is missing content");

  if (content.kind === "txt-chapters") {
    return loadTxtBookFromChapters({
      id: record.id,
      title: record.title || stripExtension(fileName),
      fileName,
      chapters: content.chapters || [],
    });
  }

  if (content.kind === "text") {
    const file = new File([content.text || ""], fileName, { type: "text/plain" });
    return loadTxtBook(file);
  }

  if (content.kind === "blob") {
    const blob = content.blob;
    const file = blob instanceof File ? blob : new File([blob], fileName, { type: blob?.type || "" });
    return loadBookFromFile(file);
  }

  throw new Error("Unsupported library record content");
}

function getFileExtension(fileName) {
  const dot = fileName.lastIndexOf(".");
  if (dot === -1) return "";
  return fileName.slice(dot + 1).toLowerCase();
}

function stripExtension(name) {
  const dot = name.lastIndexOf(".");
  return dot === -1 ? name : name.slice(0, dot);
}
