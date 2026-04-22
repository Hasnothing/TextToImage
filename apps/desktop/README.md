# Desktop wrapper (Windows)

The current `apps/client` UI already runs on Windows in a browser.

When you’re ready to ship a native Windows app, the usual next step is to wrap the web UI with **Electron** (or a WebView2 app).

Suggested approach:

- Create an Electron app that loads either:
  - the static files from `apps/client` (simple)
  - or a bundled build if you later introduce a bundler
- Point it at the local API (`services/api`) or bundle the API into the same executable

If you tell me which packaging target you want (portable `.exe`, installer, auto-update), I can scaffold the wrapper.

