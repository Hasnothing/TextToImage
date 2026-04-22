import { loadBookFromFile } from "./readers/index.js";
import { createReaderController } from "./reader/controller.js";
import { createGeneratorController } from "./generator/controller.js";
import { loadSettings, saveSettings, applySettingsToDocument } from "./settings/settings.js";

const DEFAULT_API_BASE_URL = "http://localhost:8787";

const ui = {
  bookFile: document.getElementById("bookFile"),
  bookMeta: document.getElementById("bookMeta"),

  tocPanel: document.getElementById("tocPanel"),
  tocList: document.getElementById("tocList"),
  toggleToc: document.getElementById("toggleToc"),
  closeToc: document.getElementById("closeToc"),

  settingsDialog: document.getElementById("settingsDialog"),
  toggleSettings: document.getElementById("toggleSettings"),
  fontSize: document.getElementById("fontSize"),
  lineHeight: document.getElementById("lineHeight"),
  theme: document.getElementById("theme"),
  pageWidth: document.getElementById("pageWidth"),

  readerContent: document.getElementById("readerContent"),
  readerViewport: document.getElementById("readerViewport"),
  pdfFrame: document.getElementById("pdfFrame"),
  emptyState: document.getElementById("emptyState"),
  readerStatus: document.getElementById("readerStatus"),
  chapterSlider: document.getElementById("chapterSlider"),
  progressText: document.getElementById("progressText"),
  prevChapter: document.getElementById("prevChapter"),
  nextChapter: document.getElementById("nextChapter"),

  genPanel: document.getElementById("genPanel"),
  toggleGenerate: document.getElementById("toggleGenerate"),
  closeGenerate: document.getElementById("closeGenerate"),
  apiBaseUrl: document.getElementById("apiBaseUrl"),
  useSelection: document.getElementById("useSelection"),
  pasteClipboard: document.getElementById("pasteClipboard"),
  clearSelection: document.getElementById("clearSelection"),
  selectedText: document.getElementById("selectedText"),
  prompt: document.getElementById("prompt"),
  width: document.getElementById("width"),
  height: document.getElementById("height"),
  steps: document.getElementById("steps"),
  generateBtn: document.getElementById("generateBtn"),
  status: document.getElementById("status"),
  results: document.getElementById("results"),
};

ui.apiBaseUrl.value = DEFAULT_API_BASE_URL;

const settings = loadSettings();
applySettingsToDocument(settings);
ui.fontSize.value = String(settings.fontSize);
ui.lineHeight.value = String(settings.lineHeight);
ui.theme.value = settings.theme;
ui.pageWidth.value = settings.pageWidth;

const reader = createReaderController({
  bookMetaEl: ui.bookMeta,
  tocPanelEl: ui.tocPanel,
  tocListEl: ui.tocList,
  viewportEl: ui.readerViewport,
  readerContentEl: ui.readerContent,
  pdfFrameEl: ui.pdfFrame,
  emptyStateEl: ui.emptyState,
  readerStatusEl: ui.readerStatus,
  chapterSliderEl: ui.chapterSlider,
  progressTextEl: ui.progressText,
  prevChapterEl: ui.prevChapter,
  nextChapterEl: ui.nextChapter,
});

const generator = createGeneratorController({
  apiBaseUrlEl: ui.apiBaseUrl,
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
  getSelectionText: () => reader.getSelectionText(),
  clearSelection: () => reader.clearSelection(),
});

function setPanels({ tocOpen, genOpen }) {
  ui.tocPanel.dataset.open = tocOpen ? "true" : "false";
  ui.genPanel.hidden = !genOpen;
}

setPanels({ tocOpen: false, genOpen: true });

ui.toggleToc.addEventListener("click", () => {
  const next = ui.tocPanel.dataset.open !== "true";
  setPanels({ tocOpen: next, genOpen: !ui.genPanel.hidden });
});

ui.closeToc.addEventListener("click", () => setPanels({ tocOpen: false, genOpen: !ui.genPanel.hidden }));

ui.toggleGenerate.addEventListener("click", () => {
  setPanels({ tocOpen: ui.tocPanel.dataset.open === "true", genOpen: ui.genPanel.hidden });
});

ui.closeGenerate.addEventListener("click", () => {
  setPanels({ tocOpen: ui.tocPanel.dataset.open === "true", genOpen: false });
});

ui.toggleSettings.addEventListener("click", () => {
  ui.settingsDialog.showModal();
});

function persistAndApplySettings(next) {
  const merged = { ...settings, ...next };
  saveSettings(merged);
  Object.assign(settings, merged);
  applySettingsToDocument(settings);
}

ui.fontSize.addEventListener("input", () => persistAndApplySettings({ fontSize: Number(ui.fontSize.value) }));
ui.lineHeight.addEventListener("input", () => persistAndApplySettings({ lineHeight: Number(ui.lineHeight.value) }));
ui.theme.addEventListener("change", () => persistAndApplySettings({ theme: ui.theme.value }));
ui.pageWidth.addEventListener("change", () => persistAndApplySettings({ pageWidth: ui.pageWidth.value }));

ui.bookFile.addEventListener("change", async () => {
  const file = ui.bookFile.files?.[0];
  if (!file) return;

  try {
    reader.setStatus(`Importing ${file.name}…`, "busy");
    const book = await loadBookFromFile(file);
    await reader.setBook(book);
    generator.onBookChanged(book);
  } catch (err) {
    reader.setStatus(String(err?.message || err || "Import failed"), "error");
  } finally {
    ui.bookFile.value = "";
  }
});

reader.onSelectionChanged(() => generator.updateButtons());
generator.updateButtons();
reader.setStatus("Ready. Import a TXT / EPUB / PDF book.", "info");
