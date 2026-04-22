# Client (Reader UI)

This is a dependency-free web UI (HTML/CSS/JS) that runs as a simple PWA-style app.

## Run

```powershell
cd TextToImage
npm --workspace apps/client run dev
```

Then open the URL printed in the terminal.

## What it does

- Import a book from disk:
  - **TXT**: fully supported (in-app selection works)
  - **EPUB**: supported via in-browser ZIP decompression (`DecompressionStream` in Chrome/Edge/Android Chrome)
  - **PDF**: supported in viewer mode (copy text in PDF viewer → “Paste clipboard” in Generate panel)
  - **AZW3 / MOBI**: not supported yet (convert to EPUB with Calibre)
- Reading-app style UI: contents panel, chapter navigation, reader settings (font size / line height / theme)
- Select text (TXT/EPUB) or paste from clipboard (PDF)
- Send selected text to the local API (`services/api`) to generate an image
- Show result images + a small history
