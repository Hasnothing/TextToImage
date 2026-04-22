import { openDb, promisifyRequest } from "./db.js";
import { sha256HexFromBlob } from "../utils/crypto.js";
import { reflowTxtText, splitTxtIntoChapters } from "../readers/txt.js";

export async function listBooks() {
  const db = await openDb();
  const tx = db.transaction("books", "readonly");
  const store = tx.objectStore("books");
  const all = await promisifyRequest(store.getAll());
  db.close();
  return all.sort((a, b) => (b.lastOpenedAt || 0) - (a.lastOpenedAt || 0) || (b.addedAt || 0) - (a.addedAt || 0));
}

export async function getBookRecord(id) {
  const db = await openDb();
  const tx = db.transaction("books", "readonly");
  const store = tx.objectStore("books");
  const rec = await promisifyRequest(store.get(id));
  db.close();
  return rec || null;
}

export async function putBookRecord(record) {
  const db = await openDb();
  const tx = db.transaction("books", "readwrite");
  const store = tx.objectStore("books");
  await promisifyRequest(store.put(record));
  await promisifyTx(tx);
  db.close();
}

export async function deleteBookRecord(id) {
  const db = await openDb();
  const tx = db.transaction("books", "readwrite");
  const store = tx.objectStore("books");
  await promisifyRequest(store.delete(id));
  await promisifyTx(tx);
  db.close();
}

export async function updateBookRecord(id, patch) {
  const current = await getBookRecord(id);
  if (!current) return;
  await putBookRecord({ ...current, ...patch });
}

export async function upsertFromImportedFile(file) {
  const name = String(file?.name || "book");
  const ext = getFileExtension(name);
  const type = ext || "unknown";

  if (!crypto?.subtle) {
    throw new Error("This browser does not support crypto.subtle (needed for library IDs).");
  }

  const hash = await sha256HexFromBlob(file);
  const id = `${type}:${hash}`;

  const existing = await getBookRecord(id);
  if (existing) {
    await updateBookRecord(id, { lastOpenedAt: Date.now() });
    return existing;
  }

  const addedAt = Date.now();
  const title = stripExtension(name);

  const record = {
    id,
    type,
    fileName: name,
    title,
    addedAt,
    lastOpenedAt: addedAt,
    position: null,
    content: await buildContent(type, file),
  };

  await putBookRecord(record);
  return record;
}

async function buildContent(type, file) {
  if (type === "txt") {
    const text = await file.text();
    const chapters = splitTxtIntoChapters(text).map((c) => ({
      title: c.title,
      text: reflowTxtText(c.text),
    }));
    return { kind: "txt-chapters", chapters };
  }

  if (type === "epub" || type === "pdf") {
    return { kind: "blob", blob: file };
  }

  // Keep the raw blob for other formats; we may support them later.
  return { kind: "blob", blob: file };
}

export function getLastOpenedBookId() {
  try {
    return localStorage.getItem("tti:lastOpenedBookId") || "";
  } catch {
    return "";
  }
}

export function setLastOpenedBookId(id) {
  try {
    localStorage.setItem("tti:lastOpenedBookId", id);
  } catch {
    // ignore
  }
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

function promisifyTx(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error("IndexedDB transaction failed"));
    tx.onabort = () => reject(tx.error || new Error("IndexedDB transaction aborted"));
  });
}
