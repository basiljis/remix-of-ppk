import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import ru from "./locales/ru.json";
import en from "./locales/en.json";
import zh from "./locales/zh.json";
import pagesRu from "./locales/pages.ru.json";
import pagesEn from "./locales/pages.en.json";
import pagesZh from "./locales/pages.zh.json";
import authRu from "./locales/auth.ru.json";
import authEn from "./locales/auth.en.json";
import authZh from "./locales/auth.zh.json";

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ru: { translation: ru, pages: pagesRu, auth: authRu },
      en: { translation: en, pages: pagesEn, auth: authEn },
      zh: { translation: zh, pages: pagesZh, auth: authZh },
    },
    ns: ["translation", "pages", "auth"],
    defaultNS: "translation",
    fallbackLng: "ru",
    supportedLngs: ["ru", "en", "zh"],
    interpolation: {
      escapeValue: false,
      // Note: Custom formatters should be registered via i18n.services.formatter.add
      // but simple interpolation format is supported in some versions.
      // We will handle specific formatting via a hook for better type safety.
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "i18nextLng",
    },
  })
  .then(async () => {
    const lng = i18n.resolvedLanguage || i18n.language || "ru";
    if (typeof document !== "undefined") {
      document.documentElement.lang = lng.slice(0, 2);
    }

    // Auto-detect Chinese based on GeoIP if no language is set in localStorage
    if (!localStorage.getItem("i18nextLng")) {
      try {
        const response = await fetch("https://ipapi.co/json/");
        const data = await response.json();
        if (data.country_code === "CN") {
          void i18n.changeLanguage("zh");
          if (typeof document !== "undefined") {
            document.documentElement.lang = "zh";
          }
        }
      } catch (error) {
        console.warn("Failed to detect language by IP", error);
      }
    }
  });

i18n.on("languageChanged", (lng) => {
  if (typeof document !== "undefined") {
    document.documentElement.lang = (lng || "ru").slice(0, 2);
  }
});

export default i18n;
