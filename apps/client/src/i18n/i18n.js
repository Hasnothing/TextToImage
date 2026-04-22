const DICTS = {
  en: {
    "top.import": "Import book",
    "top.library": "Library",
    "top.contents": "Contents",
    "top.settings": "Settings",
    "top.ai": "AI",
    "top.no_book": "No book loaded",

    "nav.title": "Library",
    "nav.tab_library": "Library",
    "nav.tab_contents": "Contents",
    "nav.hint": "TXT and EPUB support in-app selection. PDF uses viewer mode (copy text then paste).",

    "library.search": "Search",
    "library.search_placeholder": "Type to filter…",
    "library.empty": "No imported books yet.",
    "library.footer": "Tip: EPUB import works best in Chrome/Edge. AZW3/MOBI: convert to EPUB with Calibre.",
    "library.delete": "Delete",
    "library.delete_confirm": "Delete \"{name}\" from library?",

    "empty.title": "Import a book",
    "empty.subtitle": "TXT and EPUB allow in-app text selection. For PDF, copy text and paste into Selected text.",

    "ai.title": "AI Image",
    "ai.use_selection": "Use selection",
    "ai.paste_clipboard": "Paste clipboard",
    "ai.clear": "Clear",
    "ai.selected_label": "Selected text",
    "ai.selected_placeholder": "Select text in the reader (TXT/EPUB) then click Use selection, or paste from clipboard (PDF).",
    "ai.prompt_label": "Prompt (optional)",
    "ai.prompt_placeholder": "Style or details (e.g. cinematic lighting, watercolor, detailed).",
    "ai.width": "Width",
    "ai.height": "Height",
    "ai.steps": "Steps",
    "ai.generate": "Generate image",
    "ai.results": "Results",

    "settings.title": "Settings",
    "settings.section_app": "App",
    "settings.language": "Language",
    "settings.api_base": "API base URL",
    "settings.default_width": "Default width",
    "settings.default_height": "Default height",
    "settings.default_steps": "Default steps",

    "settings.section_reader": "Reader",
    "settings.font_size": "Font size",
    "settings.line_height": "Line height",
    "settings.theme": "Theme",
    "settings.theme_dark": "Dark",
    "settings.theme_light": "Light",
    "settings.page_width": "Page width",
    "settings.width_narrow": "Narrow",
    "settings.width_normal": "Normal",
    "settings.width_wide": "Wide",
    "settings.hint": "Tip: EPUB support uses in-browser ZIP decompression. If EPUB import fails, try Chrome/Edge on Windows or Chrome on Android.",

    "reader.prev": "Prev",
    "reader.next": "Next",

    "status.ready": "Ready.",
    "status.ready_import": "Ready. Import a TXT / EPUB / PDF book.",
    "status.importing": "Importing {name}…",
    "status.loading_book": "Loading {name}…",
    "status.import_failed": "Import failed",
    "status.missing_api": "Missing API base URL (set it in Settings).",
    "status.generating": "Generating…",
    "status.done": "Done • prompt length {n}",
    "status.clipboard_empty": "Clipboard is empty.",
    "status.clipboard_pasted": "Pasted from clipboard.",
    "status.clipboard_failed": "Clipboard read failed (permission denied). Paste manually instead.",
    "status.pdf_hint": "PDF mode: use Paste clipboard after copying text from the PDF.",
    "status.select_hint": "Select text in the reader, then click Use selection.",
  },
  zh: {
    "top.import": "导入书籍",
    "top.library": "书库",
    "top.contents": "目录",
    "top.settings": "设置",
    "top.ai": "AI",
    "top.no_book": "未加载书籍",

    "nav.title": "书库",
    "nav.tab_library": "书库",
    "nav.tab_contents": "目录",
    "nav.hint": "TXT/EPUB 支持应用内选中文本；PDF 为阅读器模式（复制文字后再粘贴）。",

    "library.search": "搜索",
    "library.search_placeholder": "输入以筛选…",
    "library.empty": "暂无已导入的书籍。",
    "library.footer": "提示：EPUB 在 Chrome/Edge 中导入更稳定。AZW3/MOBI：请用 Calibre 转为 EPUB。",
    "library.delete": "删除",
    "library.delete_confirm": "从书库删除“{name}”？",

    "empty.title": "导入一本书",
    "empty.subtitle": "TXT/EPUB 支持应用内选中；PDF 请先在阅读器中复制，再粘贴到“选中文本”。",

    "ai.title": "AI 生成图片",
    "ai.use_selection": "使用选中",
    "ai.paste_clipboard": "粘贴剪贴板",
    "ai.clear": "清除",
    "ai.selected_label": "选中文本",
    "ai.selected_placeholder": "在阅读区选中文本（TXT/EPUB）后点“使用选中”，或从剪贴板粘贴（PDF）。",
    "ai.prompt_label": "提示词（可选）",
    "ai.prompt_placeholder": "补充风格或细节（例如：电影感光影、水彩、精细）。",
    "ai.width": "宽度",
    "ai.height": "高度",
    "ai.steps": "步数",
    "ai.generate": "生成图片",
    "ai.results": "结果",

    "settings.title": "设置",
    "settings.section_app": "应用",
    "settings.language": "语言",
    "settings.api_base": "API 地址",
    "settings.default_width": "默认宽度",
    "settings.default_height": "默认高度",
    "settings.default_steps": "默认步数",

    "settings.section_reader": "阅读",
    "settings.font_size": "字号",
    "settings.line_height": "行距",
    "settings.theme": "主题",
    "settings.theme_dark": "深色",
    "settings.theme_light": "浅色",
    "settings.page_width": "页面宽度",
    "settings.width_narrow": "窄",
    "settings.width_normal": "标准",
    "settings.width_wide": "宽",
    "settings.hint": "提示：EPUB 依赖浏览器的 ZIP 解压能力；导入失败可尝试 Windows 的 Chrome/Edge 或 Android 的 Chrome。",

    "reader.prev": "上一章",
    "reader.next": "下一章",

    "status.ready": "就绪。",
    "status.ready_import": "就绪。请导入 TXT / EPUB / PDF 书籍。",
    "status.importing": "正在导入 {name}…",
    "status.loading_book": "正在加载 {name}…",
    "status.import_failed": "导入失败",
    "status.missing_api": "未设置 API 地址（请在设置中填写）。",
    "status.generating": "生成中…",
    "status.done": "完成 • 提示词长度 {n}",
    "status.clipboard_empty": "剪贴板为空。",
    "status.clipboard_pasted": "已从剪贴板粘贴。",
    "status.clipboard_failed": "读取剪贴板失败（可能是权限问题）。请手动粘贴。",
    "status.pdf_hint": "PDF 模式：请先在 PDF 中复制文字，然后点“粘贴剪贴板”。",
    "status.select_hint": "在阅读区选中文本后，点击“使用选中”。",
  },
};

export function t(lang, key, vars = {}) {
  const dict = DICTS[lang] || DICTS.en;
  let template = dict[key] || DICTS.en[key] || key;
  for (const [k, v] of Object.entries(vars)) {
    template = template.replaceAll(`{${k}}`, String(v));
  }
  return template;
}

export function applyTranslations(lang, root = document) {
  const nodes = root.querySelectorAll("[data-i18n]");
  for (const el of nodes) {
    const key = el.getAttribute("data-i18n");
    if (!key) continue;
    el.textContent = t(lang, key);
  }

  const placeholderNodes = root.querySelectorAll("[data-i18n-placeholder]");
  for (const el of placeholderNodes) {
    const key = el.getAttribute("data-i18n-placeholder");
    if (!key) continue;
    el.setAttribute("placeholder", t(lang, key));
  }
}
