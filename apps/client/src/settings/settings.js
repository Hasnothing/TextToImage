const STORAGE_KEY = "tti:readerSettings:v1";

export function loadSettings() {
  const defaults = {
    fontSize: 17,
    lineHeight: 1.65,
    theme: "dark",
    pageWidth: "normal",
    language: "en",
    apiBaseUrl: "http://localhost:8787",
    defaultWidth: 768,
    defaultHeight: 768,
    defaultSteps: 25,
  };

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);
    return {
      fontSize: clampNumber(parsed.fontSize, 14, 24, defaults.fontSize),
      lineHeight: clampNumber(parsed.lineHeight, 1.3, 2.0, defaults.lineHeight),
      theme: parsed.theme === "light" ? "light" : "dark",
      pageWidth: ["narrow", "normal", "wide"].includes(parsed.pageWidth) ? parsed.pageWidth : "normal",
      language: parsed.language === "zh" ? "zh" : "en",
      apiBaseUrl: typeof parsed.apiBaseUrl === "string" && parsed.apiBaseUrl.trim() ? parsed.apiBaseUrl.trim() : defaults.apiBaseUrl,
      defaultWidth: clampNumber(parsed.defaultWidth, 256, 2048, defaults.defaultWidth),
      defaultHeight: clampNumber(parsed.defaultHeight, 256, 2048, defaults.defaultHeight),
      defaultSteps: clampNumber(parsed.defaultSteps, 5, 80, defaults.defaultSteps),
    };
  } catch {
    return defaults;
  }
}

export function saveSettings(settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function applySettingsToDocument(settings) {
  document.documentElement.style.setProperty("--reader-font-size", `${settings.fontSize}px`);
  document.documentElement.style.setProperty("--reader-line-height", String(settings.lineHeight));
  document.documentElement.dataset.theme = settings.theme;
  document.documentElement.dataset.pageWidth = settings.pageWidth;
}

function clampNumber(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}
