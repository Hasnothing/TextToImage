# TextToImage
Cross-platform (Windows + Android) “novel → selected text → AI image” starter structure.

This repo uses a **reading-app style PWA** as the shared UI so you can:

- Run it on **Windows** (browser now, Electron later if you want a native EXE)
- Run it on **Android** (browser now, Capacitor later if you want an APK)

It also includes a small **local API proxy** so your Stable Diffusion / image provider credentials don’t have to live in the client.

## Repo layout

- `apps/client` — reader UI (load `.txt`, select text, generate image, view history)
- Supported book formats in the client:
  - **TXT**: fully supported
  - **EPUB**: supported in modern Chromium browsers via `DecompressionStream`
  - **PDF**: supported in viewer mode (copy text → paste)
  - **AZW3 / MOBI**: not supported yet (convert to EPUB)
- Client features:
  - Local **library + history** (books persist in browser storage via IndexedDB)
  - Reader settings + app settings (API base URL, language)
  - English / Chinese UI
- `services/api` — HTTP API proxy that can call a Stable Diffusion WebUI-compatible endpoint (`/sdapi/v1/txt2img`)
- `apps/desktop` — placeholder docs for Electron wrapper
- `apps/mobile` — placeholder docs for Capacitor wrapper

## Quick start (local dev)

Prereq: Node.js 18+ (Node 20 is fine).

1) Start the API server (Terminal 1)

```powershell
cd TextToImage
npm --workspace services/api run dev
```

2) Start the client dev server (Terminal 2)

```powershell
cd TextToImage
npm --workspace apps/client run dev
```

3) Open the client URL printed in the terminal (usually `http://localhost:5173`).

## Configure Stable Diffusion

By default, the API server runs in a **mock mode** (it returns a placeholder SVG image) until you point it at a provider.

To use a local Stable Diffusion WebUI (AUTOMATIC1111, Forge, etc):

1) Copy `services/api/.env.example` to `services/api/.env`
2) Set `SD_BASE_URL` (example: `http://127.0.0.1:7860`)
3) Restart the API server

## Next steps

- Add EPUB support (parse `.epub`, preserve chapters, better typography)
- Add prompt templates (character sheet, scene, style)
- Add login + cloud library sync (if needed)
- Wrap with Electron / Capacitor when you’re ready (`apps/desktop`, `apps/mobile`)
