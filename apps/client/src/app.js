import { loadBookFromRecord } from "./readers/index.js";
import { createReaderController } from "./reader/controller.js";
import { createGeneratorController } from "./generator/controller.js";
import { loadSettings, saveSettings, applySettingsToDocument } from "./settings/settings.js";
import { applyTranslations, t } from "./i18n/i18n.js";
import { reflowTxtText, splitTxtIntoChapters } from "./readers/txt.js";
import {
  deleteBookRecord,
  getBookRecord,
  getLastOpenedBookId,
  listBooks,
  setLastOpenedBookId,
  updateBookRecord,
  upsertFromImportedFile,
} from "./storage/library.js";

function getRequiredEl(id) {
  const el = document.getElementById(id);
  if (!el) {
    throw new Error(`Missing element with id="${id}" in apps/client/index.html`);
  }
  return el;
}

function openDialog(dialogEl) {
  if (typeof dialogEl.showModal === "function") {
    dialogEl.showModal();
    return;
  }
  dialogEl.setAttribute("open", "true");
}

function formatWhen(ts) {
  if (!ts) return "";
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return "";
  }
}

function main() {
  const ui = {
    bookFile: getRequiredEl("bookFile"),
    bookMeta: getRequiredEl("bookMeta"),

    openLibrary: getRequiredEl("openLibrary"),
    openContents: getRequiredEl("openContents"),

    tocPanel: getRequiredEl("tocPanel"),
    closeToc: getRequiredEl("closeToc"),
    tabLibrary: getRequiredEl("tabLibrary"),
    tabContents: getRequiredEl("tabContents"),
    libraryView: getRequiredEl("libraryView"),
    tocView: getRequiredEl("tocView"),
    librarySearch: getRequiredEl("librarySearch"),
    libraryList: getRequiredEl("libraryList"),
    libraryEmpty: getRequiredEl("libraryEmpty"),
    tocList: getRequiredEl("tocList"),

    settingsDialog: getRequiredEl("settingsDialog"),
    toggleSettings: getRequiredEl("toggleSettings"),
    language: getRequiredEl("language"),
    defaultApiBaseUrl: getRequiredEl("defaultApiBaseUrl"),
    defaultWidth: getRequiredEl("defaultWidth"),
    defaultHeight: getRequiredEl("defaultHeight"),
    defaultSteps: getRequiredEl("defaultSteps"),
    fontSize: getRequiredEl("fontSize"),
    lineHeight: getRequiredEl("lineHeight"),
    theme: getRequiredEl("theme"),
    pageWidth: getRequiredEl("pageWidth"),

    readerContent: getRequiredEl("readerContent"),
    readerText: getRequiredEl("readerText"),
    readerViewport: getRequiredEl("readerViewport"),
    pdfFrame: getRequiredEl("pdfFrame"),
    emptyState: getRequiredEl("emptyState"),
    readerStatus: getRequiredEl("readerStatus"),
    chapterSlider: getRequiredEl("chapterSlider"),
    progressText: getRequiredEl("progressText"),
    prevChapter: getRequiredEl("prevChapter"),
    nextChapter: getRequiredEl("nextChapter"),

    genPanel: getRequiredEl("genPanel"),
    toggleGenerate: getRequiredEl("toggleGenerate"),
    closeGenerate: getRequiredEl("closeGenerate"),
    useSelection: getRequiredEl("useSelection"),
    pasteClipboard: getRequiredEl("pasteClipboard"),
    clearSelection: getRequiredEl("clearSelection"),
    selectedText: getRequiredEl("selectedText"),
    prompt: getRequiredEl("prompt"),
    width: getRequiredEl("width"),
    height: getRequiredEl("height"),
    steps: getRequiredEl("steps"),
    generateBtn: getRequiredEl("generateBtn"),
    status: getRequiredEl("status"),
    results: getRequiredEl("results"),
  };

  const settings = loadSettings();

  function tr(key, vars) {
    return t(settings.language, key, vars);
  }

  applySettingsToDocument(settings);
  applyTranslations(settings.language);

  ui.language.value = settings.language;
  ui.defaultApiBaseUrl.value = settings.apiBaseUrl;
  ui.defaultWidth.value = String(settings.defaultWidth);
  ui.defaultHeight.value = String(settings.defaultHeight);
  ui.defaultSteps.value = String(settings.defaultSteps);

  ui.fontSize.value = String(settings.fontSize);
  ui.lineHeight.value = String(settings.lineHeight);
  ui.theme.value = settings.theme;
  ui.pageWidth.value = settings.pageWidth;

  ui.width.value = String(settings.defaultWidth);
  ui.height.value = String(settings.defaultHeight);
  ui.steps.value = String(settings.defaultSteps);

  const reader = createReaderController({
    bookMetaEl: ui.bookMeta,
    tocPanelEl: ui.tocPanel,
    tocListEl: ui.tocList,
    viewportEl: ui.readerViewport,
    readerContentEl: ui.readerContent,
    readerTextEl: ui.readerText,
    pdfFrameEl: ui.pdfFrame,
    emptyStateEl: ui.emptyState,
    readerStatusEl: ui.readerStatus,
    chapterSliderEl: ui.chapterSlider,
    progressTextEl: ui.progressText,
    prevChapterEl: ui.prevChapter,
    nextChapterEl: ui.nextChapter,
  });

  const generator = createGeneratorController({
    useSelectionEl: ui.useSelection,
    pasteClipboardEl: ui.pasteClipboard,
    clearSelectionEl: ui.clearSelection,
    selectedTextEl: ui.selectedText,
    promptEl: ui.prompt,
    widthEl: ui.width,
    heightEl: ui.height,
    stepsEl: ui.steps,
    generateBtnEl: ui.generateBtn,
    statusEl: ui.status,
    resultsEl: ui.results,
    getApiBaseUrl: () => settings.apiBaseUrl,
    translate: (key, vars) => tr(key, vars),
    getSelectionText: () => reader.getSelectionText(),
    clearSelection: () => reader.clearSelection(),
  });

  function setPanels({ navOpen, aiOpen }) {
    ui.tocPanel.dataset.open = navOpen ? "true" : "false";
    ui.genPanel.hidden = !aiOpen;
  }

  function setNavTab(tab) {
    const libraryActive = tab === "library";
    ui.tabLibrary.setAttribute("aria-selected", libraryActive ? "true" : "false");
    ui.tabContents.setAttribute("aria-selected", libraryActive ? "false" : "true");
    ui.libraryView.hidden = !libraryActive;
    ui.tocView.hidden = libraryActive;
  }

  // Default: reading app first; AI is folded.
  setPanels({ navOpen: false, aiOpen: false });
  setNavTab("library");

  ui.openLibrary.addEventListener("click", () => {
    setPanels({ navOpen: true, aiOpen: !ui.genPanel.hidden });
    setNavTab("library");
  });

  ui.openContents.addEventListener("click", () => {
    setPanels({ navOpen: true, aiOpen: !ui.genPanel.hidden });
    setNavTab("contents");
  });

  ui.closeToc.addEventListener("click", () => setPanels({ navOpen: false, aiOpen: !ui.genPanel.hidden }));

  ui.tabLibrary.addEventListener("click", () => setNavTab("library"));
  ui.tabContents.addEventListener("click", () => setNavTab("contents"));

  ui.toggleGenerate.addEventListener("click", () => {
    setPanels({ navOpen: ui.tocPanel.dataset.open === "true", aiOpen: ui.genPanel.hidden });
  });

  ui.closeGenerate.addEventListener("click", () => {
    setPanels({ navOpen: ui.tocPanel.dataset.open === "true", aiOpen: false });
  });

  ui.toggleSettings.addEventListener("click", () => {
    openDialog(ui.settingsDialog);
  });

  function persistAndApplySettings(next) {
    const merged = { ...settings, ...next };
    saveSettings(merged);
    Object.assign(settings, merged);
    applySettingsToDocument(settings);
    applyTranslations(settings.language);
  }

  ui.language.addEventListener("change", () => persistAndApplySettings({ language: ui.language.value }));
  ui.defaultApiBaseUrl.addEventListener("change", () => persistAndApplySettings({ apiBaseUrl: ui.defaultApiBaseUrl.value }));

  ui.defaultWidth.addEventListener("change", () => {
    persistAndApplySettings({ defaultWidth: Number(ui.defaultWidth.value) });
    ui.width.value = ui.defaultWidth.value;
  });
  ui.defaultHeight.addEventListener("change", () => {
    persistAndApplySettings({ defaultHeight: Number(ui.defaultHeight.value) });
    ui.height.value = ui.defaultHeight.value;
  });
  ui.defaultSteps.addEventListener("change", () => {
    persistAndApplySettings({ defaultSteps: Number(ui.defaultSteps.value) });
    ui.steps.value = ui.defaultSteps.value;
  });

  ui.fontSize.addEventListener("input", () => persistAndApplySettings({ fontSize: Number(ui.fontSize.value) }));
  ui.lineHeight.addEventListener("input", () => persistAndApplySettings({ lineHeight: Number(ui.lineHeight.value) }));
  ui.theme.addEventListener("change", () => persistAndApplySettings({ theme: ui.theme.value }));
  ui.pageWidth.addEventListener("change", () => persistAndApplySettings({ pageWidth: ui.pageWidth.value }));

  let libraryRecords = [];
  let currentBookId = "";

  function matchesQuery(rec, query) {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return String(rec.title || "").toLowerCase().includes(q) || String(rec.fileName || "").toLowerCase().includes(q);
  }

  function renderLibrary() {
    const query = ui.librarySearch.value || "";
    const shown = libraryRecords.filter((r) => matchesQuery(r, query));

    ui.libraryList.innerHTML = "";
    ui.libraryEmpty.hidden = shown.length > 0;

    for (const rec of shown) {
      const row = document.createElement("div");
      row.className = "book";
      row.dataset.id = rec.id;

      const left = document.createElement("div");
      const title = document.createElement("div");
      title.className = "book__title";
      title.textContent = rec.title || rec.fileName || rec.id;

      const meta = document.createElement("div");
      meta.className = "book__meta";
      const when = formatWhen(rec.lastOpenedAt || rec.addedAt);
      meta.textContent = `${String(rec.type || "").toUpperCase()} • ${when}`;

      left.appendChild(title);
      left.appendChild(meta);

      const actions = document.createElement("div");
      actions.className = "book__actions";

      const del = document.createElement("button");
      del.className = "chip";
      del.type = "button";
      del.textContent = tr("library.delete");
      del.addEventListener("click", async (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        const ok = confirm(tr("library.delete_confirm", { name: rec.title || rec.fileName || rec.id }));
        if (!ok) return;
        await deleteBookRecord(rec.id);
        if (currentBookId === rec.id) currentBookId = "";
        await refreshLibrary();
      });

      actions.appendChild(del);

      row.appendChild(left);
      row.appendChild(actions);

      row.addEventListener("click", () => openBookById(rec.id));

      ui.libraryList.appendChild(row);
    }
  }

  async function refreshLibrary() {
    libraryRecords = await listBooks();
    renderLibrary();
  }

  ui.librarySearch.addEventListener("input", () => renderLibrary());

  async function openBookById(id) {
    const rec = await getBookRecord(id);
    if (!rec) return;

    reader.setStatus(tr("status.loading_book", { name: rec.fileName || rec.title || "book" }), "busy");
    const book = await loadBookFromRecord(rec);

    // Use library id so positions/history map correctly.
    book.id = rec.id;
    currentBookId = rec.id;
    setLastOpenedBookId(rec.id);

    await reader.setBook(book);
    generator.onBookChanged(book);

    await updateBookRecord(rec.id, { lastOpenedAt: Date.now(), title: book.title || rec.title });
    await refreshLibrary();

    // Background migration: old TXT records stored as { kind: "text" } were slower to open
    // because we had to re-split into chapters every time. Convert once to txt-chapters.
    if (rec.type === "txt" && rec.content?.kind === "text" && typeof rec.content.text === "string") {
      setTimeout(async () => {
        try {
          const chapters = splitTxtIntoChapters(rec.content.text).map((c) => ({
            title: c.title,
            text: reflowTxtText(c.text),
          }));
          await updateBookRecord(rec.id, { content: { kind: "txt-chapters", chapters } });
          await refreshLibrary();
        } catch {
          // ignore migration errors
        }
      }, 0);
    }

    if (rec.position) {
      await reader.setPosition(rec.position);
    }
  }

  let posSaveTimer = null;
  let pendingPos = null;

  reader.onPositionChanged((pos) => {
    if (!currentBookId) return;
    pendingPos = pos;
    if (posSaveTimer) return;

    posSaveTimer = setTimeout(async () => {
      posSaveTimer = null;
      const toSave = pendingPos;
      pendingPos = null;
      if (!toSave || !currentBookId) return;
      await updateBookRecord(currentBookId, { position: toSave });
    }, 600);
  });

  ui.bookFile.addEventListener("change", async () => {
    const file = ui.bookFile.files?.[0];
    if (!file) return;

    try {
      reader.setStatus(tr("status.importing", { name: file.name }), "busy");
      const rec = await upsertFromImportedFile(file);
      await refreshLibrary();
      await openBookById(rec.id);
    } catch (err) {
      reader.setStatus(String(err?.message || err || tr("status.import_failed")), "error");
    } finally {
      ui.bookFile.value = "";
    }
  });

  reader.onSelectionChanged(() => generator.updateButtons());
  generator.updateButtons();
  reader.setStatus(tr("status.ready_import"), "info");

  refreshLibrary().then(async () => {
    const last = getLastOpenedBookId();
    if (last) {
      try {
        await openBookById(last);
      } catch {
        // ignore
      }
    }
  });
}

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", () => main(), { once: true });
} else {
  main();
}
