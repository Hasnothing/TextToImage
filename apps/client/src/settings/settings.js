const STORAGE_KEY = "tti:readerSettings:v1";

export function loadSettings() {
  const defaults = {
    fontSize: 17,
    lineHeight: 1.65,
    theme: "dark",
    pageWidth: "normal",
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

