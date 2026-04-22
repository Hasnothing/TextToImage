# Mobile wrapper (Android)

The current `apps/client` UI already runs on Android in a browser.

When you’re ready to ship an APK, the usual next step is to wrap the web UI with **Capacitor** (or a native WebView).

Suggested approach:

- Use Capacitor to package the `apps/client` static site as an Android app
- Configure the app to call:
  - a local API on your LAN (for development), or
  - a hosted API service (for production)

If you confirm you want Capacitor, I can scaffold the Android wrapper structure next.

