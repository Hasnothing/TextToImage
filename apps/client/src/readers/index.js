import { loadTxtBook } from "./txt.js";
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

function getFileExtension(fileName) {
  const dot = fileName.lastIndexOf(".");
  if (dot === -1) return "";
  return fileName.slice(dot + 1).toLowerCase();
}

