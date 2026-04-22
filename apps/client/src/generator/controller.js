import { normalizeWhitespace } from "../utils/text.js";

export function createGeneratorController({
  useSelectionEl,
  pasteClipboardEl,
  clearSelectionEl,
  selectedTextEl,
  promptEl,
  widthEl,
  heightEl,
  stepsEl,
  generateBtnEl,
  statusEl,
  resultsEl,
  getApiBaseUrl,
  translate,
  getSelectionText,
  clearSelection,
}) {
  let currentBook = null;
  const tr = typeof translate === "function" ? translate : (s) => s;

  function setStatus(message, kind = "info") {
    statusEl.textContent = message;
    statusEl.dataset.kind = kind;
  }

  function safeJsonParse(value) {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }

  function readNumber(input, fallback) {
    const parsed = Number(input.value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function joinPrompt(selectedText, extraPrompt) {
    const selected = normalizeWhitespace(selectedText);
    const extra = normalizeWhitespace(extraPrompt);
    if (extra.length === 0) return selected;
    return `${selected}\n\nStyle: ${extra}`;
  }

  function renderImageCard({ title, subtitle, imageSrc }) {
    const card = document.createElement("div");
    card.className = "result";

    const header = document.createElement("div");
    header.className = "result__meta";

    const h = document.createElement("div");
    h.className = "result__title";
    h.textContent = title;

    const s = document.createElement("div");
    s.className = "result__subtitle";
    s.textContent = subtitle;

    header.appendChild(h);
    header.appendChild(s);

    const img = document.createElement("img");
    img.className = "result__img";
    img.src = imageSrc;
    img.alt = title;
    img.loading = "lazy";

    card.appendChild(header);
    card.appendChild(img);
    return card;
  }

  async function generateImage() {
    const selectionText = selectedTextEl.value.trim();
    if (selectionText.length === 0) return;

    const body = {
      selectedText: selectionText,
      prompt: promptEl.value || "",
      width: readNumber(widthEl, 768),
      height: readNumber(heightEl, 768),
      steps: readNumber(stepsEl, 25),
    };

    const apiBaseUrl = String(getApiBaseUrl?.() || "").trim();
    if (!apiBaseUrl) {
      setStatus(tr("status.missing_api"), "error");
      return;
    }
    setStatus(tr("status.generating"), "busy");
    generateBtnEl.disabled = true;

    try {
      const res = await fetch(`${apiBaseUrl}/generate`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });

      const text = await res.text();
      const json = safeJsonParse(text);
      if (!res.ok) {
        const message = json?.error || text || `HTTP ${res.status}`;
        throw new Error(message);
      }

      const images = json?.images || [];
      if (!Array.isArray(images) || images.length === 0) {
        throw new Error("No images returned by API");
      }

      const requestPrompt = joinPrompt(body.selectedText, body.prompt);
      const now = new Date();
      const title = "Generated";
      const subtitle = `${now.toLocaleString()} • ${json.provider || "api"}`;

      for (const image of images) {
        const mime = image?.mime || "image/png";
        const base64 = image?.base64 || "";
        if (!base64) continue;
        const imageSrc = `data:${mime};base64,${base64}`;
        const card = renderImageCard({
          title,
          subtitle,
          imageSrc,
        });
        resultsEl.prepend(card);
      }

      setStatus(tr("status.done", { n: requestPrompt.length }), "ok");
    } catch (err) {
      setStatus(String(err?.message || err || "Unknown error"), "error");
    } finally {
      generateBtnEl.disabled = false;
      updateButtons();
    }
  }

  async function pasteClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      if (!text || !text.trim()) {
        setStatus(tr("status.clipboard_empty"), "error");
        return;
      }
      selectedTextEl.value = text.trim();
      setStatus(tr("status.clipboard_pasted"), "ok");
      updateButtons();
    } catch {
      setStatus(tr("status.clipboard_failed"), "error");
    }
  }

  function updateButtons() {
    const selection = getSelectionText();
    const hasSelection = selection.length > 0;
    const hasSelectedTextBox = selectedTextEl.value.trim().length > 0;

    useSelectionEl.disabled = !hasSelection;
    clearSelectionEl.disabled = !hasSelection;
    generateBtnEl.disabled = !hasSelectedTextBox;
  }

  function onBookChanged(book) {
    currentBook = book;
    if (book?.type === "pdf") {
      setStatus(tr("status.pdf_hint"), "info");
    } else {
      setStatus(tr("status.select_hint"), "info");
    }
    updateButtons();
  }

  useSelectionEl.addEventListener("click", () => {
    const selected = getSelectionText();
    if (!selected) return;
    selectedTextEl.value = selected;
    updateButtons();
  });

  clearSelectionEl.addEventListener("click", () => {
    clearSelection();
    updateButtons();
  });

  pasteClipboardEl.addEventListener("click", () => pasteClipboard());

  selectedTextEl.addEventListener("input", () => updateButtons());
  generateBtnEl.addEventListener("click", () => generateImage());

  setStatus(tr("status.ready"), "info");
  updateButtons();

  return {
    updateButtons,
    onBookChanged,
  };
}
