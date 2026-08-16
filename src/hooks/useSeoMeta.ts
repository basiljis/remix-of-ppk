import { useEffect } from "react";
import { useTranslation } from "react-i18next";

interface SeoMeta {
  title: string;
  description: string;
  canonical?: string;
  keywords?: string;
  ogImage?: string;
  ogType?: "website" | "article";
  article?: {
    publishedTime?: string;
    modifiedTime?: string;
    author?: string;
    section?: string;
    tags?: string[];
  };
  noIndex?: boolean;
  jsonLd?: object | object[];
  locale?: "ru_RU" | "en_US" | "zh_CN";
}


const BASE_URL = "https://unvrsm.ru";
const DEFAULT_OG_IMAGE = `${BASE_URL}/og-image.png`;

export function useSeoMeta({
  title,
  description,
  canonical,
  keywords,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = "website",
  article,
  noIndex = false,
  jsonLd,
  locale,
}: SeoMeta) {
  const { i18n } = useTranslation();

  useEffect(() => {
    // Title
    document.title = title;

    const setMeta = (attr: string, key: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    const removeMeta = (attr: string, key: string) => {
      document.querySelectorAll(`meta[${attr}="${key}"]`).forEach(el => el.remove());
    };

    setMeta("name", "description", description);
    if (keywords) setMeta("name", "keywords", keywords);
    setMeta("name", "robots", noIndex ? "noindex, nofollow" : "index, follow");

    // Resolve canonical URL: support absolute URLs in `canonical` arg
    const resolvedUrl = canonical
      ? (canonical.startsWith("http") ? canonical : `${BASE_URL}${canonical}`)
      : window.location.href;
    const resolvedOgImage = ogImage.startsWith("http") ? ogImage : `${BASE_URL}${ogImage}`;

    // Open Graph
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", description);
    setMeta("property", "og:image", resolvedOgImage);
    setMeta("property", "og:image:alt", title);
    setMeta("property", "og:image:width", "1200");
    setMeta("property", "og:image:height", "630");
    setMeta("property", "og:url", resolvedUrl);
    setMeta("property", "og:type", ogType);
    setMeta("property", "og:site_name", "universum.");
    const resolvedLocale =
      locale ||
      (i18n.language === "zh" ? "zh_CN" : i18n.language === "en" ? "en_US" : "ru_RU");
    setMeta("property", "og:locale", resolvedLocale);

    // Twitter
    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:site", "@unvrsm_ru");
    setMeta("name", "twitter:creator", "@unvrsm_ru");


    // Article-specific OG tags — clean up when not an article
    const articleTagKeys = [
      "article:published_time",
      "article:modified_time",
      "article:author",
      "article:section",
    ];
    articleTagKeys.forEach(k => removeMeta("property", k));
    document.querySelectorAll('meta[property="article:tag"]').forEach(el => el.remove());

    if (ogType === "article" && article) {
      if (article.publishedTime) setMeta("property", "article:published_time", article.publishedTime);
      if (article.modifiedTime) setMeta("property", "article:modified_time", article.modifiedTime);
      if (article.author) setMeta("property", "article:author", article.author);
      if (article.section) setMeta("property", "article:section", article.section);
      (article.tags ?? []).forEach(tag => {
        const el = document.createElement("meta");
        el.setAttribute("property", "article:tag");
        el.setAttribute("content", tag);
        document.head.appendChild(el);
      });
    }

    // Twitter
    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", title);
    setMeta("name", "twitter:description", description);
    setMeta("name", "twitter:image", resolvedOgImage);
    setMeta("name", "twitter:image:alt", title);

    // Canonical
    let canonicalEl = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonicalEl) {
      canonicalEl = document.createElement("link");
      canonicalEl.setAttribute("rel", "canonical");
      document.head.appendChild(canonicalEl);
    }
    canonicalEl.setAttribute("href", resolvedUrl);

    // JSON-LD — remove all previous
    document.querySelectorAll('[id^="seo-json-ld"]').forEach(el => el.remove());

    if (jsonLd) {
      const items = Array.isArray(jsonLd) ? jsonLd : [jsonLd];
      items.forEach((item, idx) => {
        const script = document.createElement("script");
        script.id = `seo-json-ld-${idx}`;
        script.type = "application/ld+json";
        try {
          script.textContent = JSON.stringify(item);
        } catch {
          return;
        }
        document.head.appendChild(script);
      });
    }

    return () => {
      document.querySelectorAll('[id^="seo-json-ld"]').forEach(el => el.remove());
    };
  }, [title, description, canonical, keywords, ogImage, ogType, article, noIndex, jsonLd, locale]);
}
