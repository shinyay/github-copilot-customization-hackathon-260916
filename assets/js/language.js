"use strict";

(() => {
  const root = document.documentElement;
  const currentLanguage = root.dataset.currentLanguage;
  const SUPPORTED = new Set(["ja", "en"]);
  const STORAGE_KEY = "copilot-scenarios-language";

  const readPref = () => {
    try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
  };

  const writePref = (lang) => {
    try { localStorage.setItem(STORAGE_KEY, lang); return true; } catch { return false; }
  };

  const params = new URLSearchParams(location.search);
  const requested = params.get("lang");

  if (SUPPORTED.has(requested)) {
    writePref(requested);
  }

  const preferred = SUPPORTED.has(requested) ? requested : readPref();

  if (!preferred || preferred === currentLanguage) {
    if (SUPPORTED.has(requested)) {
      const clean = new URL(location.href);
      clean.searchParams.delete("lang");
      history.replaceState(null, "", clean);
    }
  } else {
    const target = preferred === "en" ? root.dataset.englishUrl : root.dataset.japaneseUrl;
    if (target) {
      const url = new URL(target, location.origin);
      url.search = location.search;
      url.searchParams.delete("lang");
      location.replace(url);
      return;
    }
  }

  for (const link of document.querySelectorAll("[data-language-link], .markdown-body > p:first-of-type a")) {
    link.addEventListener("click", () => {
      const label = link.textContent.trim();
      const lang = link.dataset.languageLink
        ?? (label === "日本語" ? "ja" : label === "English" ? "en" : null);

      if (SUPPORTED.has(lang) && !writePref(lang)) {
        const u = new URL(link.href, location.origin);
        u.searchParams.set("lang", lang);
        link.href = u.toString();
      }
    });
  }
})();
