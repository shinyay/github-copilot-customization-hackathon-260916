(() => {
  const root = document.documentElement;
  const currentLanguage = root.dataset.currentLanguage;
  const supportedLanguages = new Set(["ja", "en"]);
  const storageKey = "copilot-scenarios-language";

  const readPreference = () => {
    try {
      return window.localStorage.getItem(storageKey);
    } catch {
      return null;
    }
  };

  const writePreference = (language) => {
    try {
      window.localStorage.setItem(storageKey, language);
      return true;
    } catch {
      return false;
    }
  };

  const requestedLanguage = new URLSearchParams(window.location.search).get("lang");
  if (supportedLanguages.has(requestedLanguage)) {
    writePreference(requestedLanguage);
  }

  const preferredLanguage = supportedLanguages.has(requestedLanguage)
    ? requestedLanguage
    : readPreference();

  if (!preferredLanguage || preferredLanguage === currentLanguage) {
    if (supportedLanguages.has(requestedLanguage)) {
      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete("lang");
      window.history.replaceState(null, "", cleanUrl);
    }
  } else {
    const target =
      preferredLanguage === "en" ? root.dataset.englishUrl : root.dataset.japaneseUrl;

    if (target) {
      const targetUrl = new URL(target, window.location.origin);
      targetUrl.search = window.location.search;
      targetUrl.searchParams.delete("lang");
      window.location.replace(targetUrl);
      return;
    }
  }

  const bindLanguageLinks = () => {
    const languageLinks = document.querySelectorAll(
      "[data-language-link], .markdown-body > p:first-of-type a",
    );

    languageLinks.forEach((link) => {
      link.addEventListener("click", () => {
        const label = link.textContent.trim();
        const language =
          link.dataset.languageLink ||
          (label === "日本語" ? "ja" : label === "English" ? "en" : null);

        if (supportedLanguages.has(language)) {
          const stored = writePreference(language);
          if (!stored) {
            const targetUrl = new URL(link.href, window.location.origin);
            targetUrl.searchParams.set("lang", language);
            link.href = targetUrl.toString();
          }
        }
      });
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindLanguageLinks, { once: true });
  } else {
    bindLanguageLinks();
  }
})();
