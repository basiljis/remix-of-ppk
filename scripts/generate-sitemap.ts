/**
 * Генерация public/sitemap.xml.
 * Статические маршруты + все опубликованные статьи и новости блога из Supabase.
 * Запускается автоматически перед `vite dev` и `vite build` (predev/prebuild).
 */
import { writeFileSync } from "fs";
import { resolve } from "path";

const BASE_URL = "https://unvrsm.ru";
const LANGS = ["ru", "en", "zh"] as const;

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://oxyjmeslnmhewlpgzlmf.supabase.co";
const SUPABASE_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94eWptZXNsbm1oZXdscGd6bG1mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMjE2MjEsImV4cCI6MjA2OTg5NzYyMX0.zqNt8Zj0ktRLY1HBKelEYJ0gXaLkyIc4l6PAwMod7Co";

type Entry = {
  path: string;
  changefreq?: string;
  priority?: string;
  lastmod?: string;
  /** Страница переведена и имеет /en и /zh версии */
  localized?: boolean;
};

const staticEntries: Entry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0", localized: true },
  { path: "/about", changefreq: "monthly", priority: "0.9", localized: true },
  { path: "/features", changefreq: "monthly", priority: "0.9", localized: true },
  { path: "/pricing", changefreq: "monthly", priority: "0.8", localized: true },
  { path: "/for-specialists", changefreq: "monthly", priority: "0.9" },
  { path: "/for-organizations", changefreq: "monthly", priority: "0.9" },
  { path: "/blog", changefreq: "daily", priority: "0.9" },
  { path: "/legal", changefreq: "weekly", priority: "0.8" },
  { path: "/guides/pmpk-preparation", changefreq: "monthly", priority: "0.9" },
  { path: "/register", changefreq: "yearly", priority: "0.6" },
];

async function fetchPosts(): Promise<Entry[]> {
  const url =
    `${SUPABASE_URL}/rest/v1/blog_posts` +
    `?select=slug,category,published_at,updated_at&published=eq.true&order=published_at.desc&limit=1000`;
  try {
    const res = await fetch(url, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const rows = (await res.json()) as Array<{
      slug: string;
      category: string;
      published_at: string | null;
      updated_at: string | null;
    }>;
    const now = Date.now();
    return rows
      .filter((r) => r.slug && (!r.published_at || Date.parse(r.published_at) <= now))
      .map((r) => ({
        path: `/blog/${r.slug}`,
        changefreq: r.category === "news" ? "weekly" : "monthly",
        priority: r.category === "news" ? "0.7" : "0.8",
        lastmod: (r.updated_at || r.published_at || undefined)?.slice(0, 10),
      }));
  } catch (e) {
    console.warn("[sitemap] Не удалось получить статьи блога:", (e as Error).message);
    return [];
  }
}

function localizedPath(lang: string, path: string) {
  if (lang === "ru") return path === "/" ? "/" : path;
  return path === "/" ? `/${lang}/` : `/${lang}${path}`;
}

function renderUrl(e: Entry) {
  const lines: string[] = [];
  const variants = e.localized ? LANGS : (["ru"] as const);
  for (const lang of variants) {
    lines.push("  <url>");
    lines.push(`    <loc>${BASE_URL}${localizedPath(lang, e.path)}</loc>`);
    if (e.localized) {
      for (const alt of LANGS) {
        lines.push(
          `    <xhtml:link rel="alternate" hreflang="${alt}" href="${BASE_URL}${localizedPath(alt, e.path)}"/>`
        );
      }
    }
    if (e.lastmod) lines.push(`    <lastmod>${e.lastmod}</lastmod>`);
    if (e.changefreq) lines.push(`    <changefreq>${e.changefreq}</changefreq>`);
    if (e.priority) lines.push(`    <priority>${e.priority}</priority>`);
    lines.push("  </url>");
  }
  return lines.join("\n");
}

const posts = await fetchPosts();
const entries = [...staticEntries, ...posts];

const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
  ...entries.map(renderUrl),
  "</urlset>",
].join("\n");

writeFileSync(resolve("public/sitemap.xml"), xml + "\n");
console.log(`sitemap.xml обновлён: ${entries.length} записей (статей блога: ${posts.length})`);
