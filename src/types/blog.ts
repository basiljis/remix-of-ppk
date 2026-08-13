export type BlogCategory = "specialists" | "admins" | "parents" | "product" | "news";

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  title_en?: string | null;
  excerpt_en?: string | null;
  content_en?: string | null;
  category: BlogCategory;
  keywords: string[];
  cover_url: string | null;
  author: string;
  reading_minutes: number;
  published: boolean;
  published_at: string;
  created_at: string;
  updated_at: string;
  seo_title?: string | null;
  seo_description?: string | null;
  og_image?: string | null;
  seo_title_en?: string | null;
  seo_description_en?: string | null;
  og_image_en?: string | null;
}

export const BLOG_CATEGORIES: { value: BlogCategory; label: string }[] = [
  { value: "specialists", label: "Для специалистов" },
  { value: "admins", label: "Для администраторов" },
  { value: "parents", label: "Для родителей" },
  { value: "news", label: "Новости" },
];

const BLOG_CATEGORIES_EN: Record<BlogCategory, string> = {
  specialists: "For specialists",
  admins: "For administrators",
  parents: "For parents",
  product: "About the product",
  news: "News",
};

export const blogCategoryLabel = (c: BlogCategory, lang?: string): string => {
  if (lang && lang.toLowerCase().startsWith("en")) return BLOG_CATEGORIES_EN[c] ?? c;
  return BLOG_CATEGORIES.find((x) => x.value === c)?.label ?? c;
};

/** Colour marker classes per audience (semantic tokens, theme-aware). */
const BLOG_CATEGORY_CLASSES: Record<BlogCategory, string> = {
  specialists: "bg-cat-specialists-soft text-cat-specialists border border-cat-specialists/25",
  admins: "bg-cat-admins-soft text-cat-admins border border-cat-admins/25",
  parents: "bg-cat-parents-soft text-cat-parents border border-cat-parents/25",
  product: "bg-cat-product-soft text-cat-product border border-cat-product/25",
  news: "bg-cat-news-soft text-cat-news border border-cat-news/25",
};

export const blogCategoryClass = (c: BlogCategory): string =>
  BLOG_CATEGORY_CLASSES[c] ?? "bg-muted text-muted-foreground border border-border";

/** Solid dot / accent-bar colour per audience. */
const BLOG_CATEGORY_DOTS: Record<BlogCategory, string> = {
  specialists: "bg-cat-specialists",
  admins: "bg-cat-admins",
  parents: "bg-cat-parents",
  product: "bg-cat-product",
  news: "bg-cat-news",
};

export const blogCategoryDot = (c: BlogCategory): string =>
  BLOG_CATEGORY_DOTS[c] ?? "bg-muted-foreground";

/** Pick title/excerpt/content in the active language, falling back to Russian. */
export function localizedPost<T extends Partial<BlogPost>>(
  post: T,
  lang?: string
): { title: string; excerpt: string; content: string } {
  const en = (lang || "").toLowerCase().startsWith("en");
  return {
    title: (en && post.title_en) || post.title || "",
    excerpt: (en && post.excerpt_en) || post.excerpt || "",
    content: (en && post.content_en) || post.content || "",
  };
}


/** Canonical origin for the site — required for Zen: only absolute links survive paste. */
export const SITE_ORIGIN = "https://unvrsm.ru";

/** Convert every href/src in HTML to an absolute URL against SITE_ORIGIN. */
function absolutizeUrls(html: string): string {
  const abs = (u: string): string => {
    const url = u.trim();
    if (!url) return url;
    if (/^(https?:|mailto:|tel:|#)/i.test(url)) return url;
    if (url.startsWith("//")) return "https:" + url;
    if (url.startsWith("/")) return SITE_ORIGIN + url;
    return SITE_ORIGIN + "/" + url;
  };
  return html
    .replace(/(<a\b[^>]*\shref=")([^"]+)(")/gi, (_, a, u, c) => a + abs(u) + c)
    .replace(/(<a\b[^>]*\shref=')([^']+)(')/gi, (_, a, u, c) => a + abs(u) + c)
    .replace(/(<img\b[^>]*\ssrc=")([^"]+)(")/gi, (_, a, u, c) => a + abs(u) + c)
    .replace(/(<img\b[^>]*\ssrc=')([^']+)(')/gi, (_, a, u, c) => a + abs(u) + c);
}

/** Strip HTML tags for plain-text uses (previews, meta descriptions). */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

/**
 * Единый источник тегов для статьи: категория + ключевые слова,
 * с дедупликацией и ограничением в 10 штук.
 * Используется и в SEO-мета странице, и в копии для Дзена.
 */
export function postTags(post: BlogPost, lang = "ru"): string[] {
  const raw = [blogCategoryLabel(post.category, lang), ...(post.keywords ?? [])];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of raw) {
    const tag = String(item ?? "").trim();
    if (!tag) continue;
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(tag);
    if (out.length >= 10) break;
  }
  return out;
}

/** Теги для Дзена: те же теги, но без пробелов и спецсимволов (хештеги). */
export function zenTags(post: BlogPost): string[] {
  return postTags(post, "ru")
    .map((t) =>
      t
        .replace(/[^\p{L}\p{N}\s-]/gu, "")
        .replace(/[\s-]+/g, "")
    )
    .filter(Boolean);
}



/**
 * Format a post as plain text (fallback for editors without HTML paste).
 * Сохраняем URL рядом с якорями: «текст (https://…)».
 */
export function postToZenText(post: BlogPost): string {
  let src = absolutizeUrls(post.content);
  // <a href="URL">text</a>  →  text (URL)
  src = src.replace(
    /<a\b[^>]*\shref=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi,
    (_, url, text) => `${stripHtml(text)} (${url})`
  );
  const withBreaks = src
    .replace(/<\/(h[1-6]|p|li|ul|ol|div|blockquote|figure)>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ");
  const text = stripHtml(withBreaks);
  const cover = post.cover_url ? `[Обложка: ${post.cover_url}]\n\n` : "";
  const tags = zenTags(post);
  const tagsLine = tags.length ? `\n\n${tags.map((k) => `#${k}`).join(" ")}` : "";
  return `${post.title}\n\n${cover}${post.excerpt}\n\n${text}${tagsLine}`
    .replace(/\n{3,}/g, "\n\n").trim();
}

/**
 * Format a post as rich HTML for Яндекс Дзен / Дзен.Редактор.
 * Требования Дзена: только абсолютные URL, чистая семантика (h2/h3/p/ul/ol/a),
 * без inline-стилей и скриптов. Обложку в Дзен загружают отдельно (см. кнопку «Скачать обложку»).
 */
export function postToZenHtml(post: BlogPost): string {
  // Normalise: h1 → h2 (в Дзене свой h1), гарантируем абзацы у голого текста.
  let body = post.content.trim();
  body = body.replace(/<h1(\s[^>]*)?>/gi, "<h2>").replace(/<\/h1>/gi, "</h2>");
  if (!/<(h[1-6]|p|ul|ol|figure|blockquote)[\s>]/i.test(body)) {
    body = body
      .split(/\n{2,}/)
      .map((chunk) => `<p>${chunk.replace(/\n/g, "<br/>")}</p>`)
      .join("\n");
  }
  // Абсолютизируем ссылки и добавляем target/rel — Дзен уважает href, если он абсолютный.
  body = absolutizeUrls(body).replace(
    /<a\b([^>]*)>/gi,
    (m, attrs) => (/target=/i.test(attrs) ? m : `<a${attrs} target="_blank" rel="noopener">`)
  );
  const lead = post.excerpt ? `<p><strong>${escapeHtml(post.excerpt)}</strong></p>` : "";
  const tags = zenTags(post);
  const tagsBlock = tags.length
    ? `<p>${tags.map((k) => `#${escapeHtml(k)}`).join(" ")}</p>`
    : "";
  return [
    `<h1>${escapeHtml(post.title)}</h1>`,
    lead,
    body,
    `<p><em>Источник: <a href="${SITE_ORIGIN}/blog/${post.slug}" target="_blank" rel="noopener">${SITE_ORIGIN}/blog/${post.slug}</a></em></p>`,
    tagsBlock,
  ].filter(Boolean).join("\n");
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]!));
}

