export function createReaderController({
  bookMetaEl,
  tocPanelEl,
  tocListEl,
  viewportEl,
  readerContentEl,
  pdfFrameEl,
  emptyStateEl,
  readerStatusEl,
  chapterSliderEl,
  progressTextEl,
  prevChapterEl,
  nextChapterEl,
}) {
  let currentBook = null;
  let currentChapterIndex = 0;
  const selectionListeners = new Set();

  function setStatus(message, kind = "info") {
    readerStatusEl.textContent = message;
    readerStatusEl.dataset.kind = kind;
  }

  function renderToc() {
    tocListEl.innerHTML = "";
    const chapters = currentBook?.chapters || [];

    if (!currentBook) {
      tocListEl.innerHTML = `<div class="hint">No book loaded.</div>`;
      return;
    }

    if (currentBook.type === "pdf") {
      tocListEl.innerHTML = `<div class="hint">PDF: no table of contents yet (viewer mode).</div>`;
      return;
    }

    if (chapters.length === 0) {
      tocListEl.innerHTML = `<div class="hint">No chapters detected.</div>`;
      return;
    }

    chapters.forEach((ch, idx) => {
      const row = document.createElement("div");
      row.className = "toc__item";
      row.dataset.active = idx === currentChapterIndex ? "true" : "false";
      row.addEventListener("click", () => goToChapter(idx));

      const n = document.createElement("div");
      n.className = "toc__idx";
      n.textContent = String(idx + 1);

      const t = document.createElement("div");
      t.className = "toc__title";
      t.textContent = ch.title || `Chapter ${idx + 1}`;

      row.appendChild(n);
      row.appendChild(t);
      tocListEl.appendChild(row);
    });
  }

  function updateNav() {
    const chapters = currentBook?.chapters || [];
    const canNav = currentBook && currentBook.type !== "pdf" && chapters.length > 0;

    prevChapterEl.disabled = !canNav || currentChapterIndex <= 0;
    nextChapterEl.disabled = !canNav || currentChapterIndex >= chapters.length - 1;

    chapterSliderEl.disabled = !canNav;
    chapterSliderEl.min = "0";
    chapterSliderEl.max = String(Math.max(0, chapters.length - 1));
    chapterSliderEl.value = String(currentChapterIndex);

    if (!currentBook) {
      progressTextEl.textContent = "—";
      return;
    }

    if (currentBook.type === "pdf") {
      progressTextEl.textContent = "PDF viewer";
      return;
    }

    progressTextEl.textContent = `Chapter ${currentChapterIndex + 1} / ${Math.max(1, chapters.length)}`;
  }

  async function renderChapter(index) {
    if (!currentBook) return;
    if (currentBook.type === "pdf") return;

    const chapters = currentBook.chapters || [];
    const ch = chapters[index];
    if (!ch) return;

    setStatus("Loading…", "busy");

    const loaded = await ch.loadHtml();
    if (typeof loaded === "string") {
      readerContentEl.innerHTML = loaded;
    } else {
      readerContentEl.innerHTML = loaded.html;
      if (loaded.title) currentBook.chapters[index].title = loaded.title;
    }

    setStatus(`${currentBook.title} • ${currentBook.chapters[index].title || `Chapter ${index + 1}`}`, "ok");
    viewportEl.scrollTop = 0;
    readerContentEl.focus?.();
  }

  async function setBook(book) {
    cleanupBookResources();
    currentBook = book;
    currentChapterIndex = 0;

    bookMetaEl.textContent = `${book.title} • ${book.type.toUpperCase()}`;

    emptyStateEl.hidden = true;

    if (book.type === "pdf") {
      pdfFrameEl.hidden = false;
      readerContentEl.hidden = true;
      pdfFrameEl.src = book.pdfUrl;
      setStatus("PDF loaded. Select text in the PDF viewer, copy it, then use “Paste clipboard”.", "ok");
      renderToc();
      updateNav();
      notifySelectionChanged();
      return;
    }

    pdfFrameEl.hidden = true;
    pdfFrameEl.src = "about:blank";
    readerContentEl.hidden = false;
    await renderChapter(0);
    renderToc();
    updateNav();
    notifySelectionChanged();
  }

  function cleanupBookResources() {
    if (currentBook?.type === "pdf" && currentBook.pdfUrl) {
      try {
        URL.revokeObjectURL(currentBook.pdfUrl);
      } catch {
        // ignore
      }
    }
  }

  async function goToChapter(index) {
    if (!currentBook) return;
    const chapters = currentBook.chapters || [];
    const next = Math.min(chapters.length - 1, Math.max(0, index));
    if (next === currentChapterIndex) return;
    currentChapterIndex = next;
    await renderChapter(currentChapterIndex);
    renderToc();
    updateNav();
    notifySelectionChanged();
  }

  function getSelectionText() {
    if (!currentBook || currentBook.type === "pdf") return "";
    const sel = window.getSelection?.();
    if (!sel) return "";
    const raw = String(sel.toString() || "").trim();
    if (!raw) return "";

    // Only accept selection that intersects the reader content.
    const anchorNode = sel.anchorNode;
    const focusNode = sel.focusNode;
    const within =
      (anchorNode && readerContentEl.contains(anchorNode)) || (focusNode && readerContentEl.contains(focusNode)) || false;
    return within ? raw : "";
  }

  function clearSelection() {
    const sel = window.getSelection?.();
    sel?.removeAllRanges?.();
    notifySelectionChanged();
  }

  function notifySelectionChanged() {
    for (const cb of selectionListeners) cb();
  }

  function onSelectionChanged(cb) {
    selectionListeners.add(cb);
    return () => selectionListeners.delete(cb);
  }

  prevChapterEl.addEventListener("click", () => goToChapter(currentChapterIndex - 1));
  nextChapterEl.addEventListener("click", () => goToChapter(currentChapterIndex + 1));
  chapterSliderEl.addEventListener("input", () => goToChapter(Number(chapterSliderEl.value)));

  document.addEventListener("selectionchange", () => {
    notifySelectionChanged();
  });

  // Initial empty UI state.
  emptyStateEl.hidden = false;
  readerContentEl.hidden = true;
  pdfFrameEl.hidden = true;
  setStatus("Ready.", "info");

  return {
    setBook,
    setStatus,
    getSelectionText,
    clearSelection,
    onSelectionChanged,
  };
}
