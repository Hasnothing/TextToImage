# API (Stable Diffusion Proxy)

Small local HTTP server that:

- Accepts selected text + prompt parameters from the client
- Calls a Stable Diffusion WebUI-compatible API (`/sdapi/v1/txt2img`)
- Returns images as `{ mime, base64 }[]`

This keeps provider URLs / keys out of the client app.

## Run

```powershell
cd TextToImage
npm --workspace services/api run dev
```

## Configure

Copy `services/api/.env.example` to `services/api/.env` and set:

- `SD_BASE_URL` — example: `http://127.0.0.1:7860`

If `SD_BASE_URL` is not set, the server returns a **mock SVG image** so the UI flow still works.

