import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import type { BlogPost as BlogPostType } from "@/types/blog";
import { blogCategoryLabel, blogCategoryClass, blogCategoryDot, stripHtml, localizedPost, postTags } from "@/types/blog";
import { useSeoMeta } from "@/hooks/useSeoMeta";
import { PublicNavbar } from "@/components/PublicNavbar";
import LandingFooter from "@/components/LandingFooter";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft, ArrowRight, Clock, Calendar, Eye, Users,
  Share2, Link2, ListOrdered, Check, ThumbsUp,
} from "lucide-react";
import { useLogBlogView, useBlogViewStats, useLogBlogClick } from "@/hooks/useBlogViews";
import { useBlogPostRating } from "@/hooks/useBlogPostLikes";
import { toast } from "sonner";
import DevelopmentBlocksComparison from "@/components/blog/DevelopmentBlocksComparison";
import BlogComments from "@/components/blog/BlogComments";
import SptCalendarExport from "@/components/blog/SptCalendarExport";

const INTERACTIVE_SLUGS = new Set(["5-blokov-razvitiya-rebenka"]);

const BASE_URL = "https://unvrsm.ru";

type Heading = { id: string; text: string; level: 2 | 3 };

/** Inject stable IDs into <h2>/<h3> and collect them for a table of contents. */
function withHeadingIds(html: string): { html: string; headings: Heading[] } {
  const headings: Heading[] = [];
  const used = new Set<string>();
  const slugify = (s: string) =>
    s.toLowerCase().replace(/<[^>]+>/g, "").trim()
      .replace(/[^\p{L}\p{N}\s-]/gu, "").replace(/\s+/g, "-").slice(0, 80) || "section";
  const out = html.replace(
    /<h([23])(\s[^>]*)?>([\s\S]*?)<\/h\1>/gi,
    (_m, lvl: string, attrs: string = "", inner: string) => {
      const text = stripHtml(inner);
      let id = slugify(text);
      let i = 2;
      while (used.has(id)) id = `${slugify(text)}-${i++}`;
      used.add(id);
      headings.push({ id, text, level: Number(lvl) as 2 | 3 });
      const hasId = /\sid=/i.test(attrs);
      const newAttrs = hasId ? attrs : `${attrs} id="${id}"`;
      return `<h${lvl}${newAttrs}>${inner}</h${lvl}>`;
    }
  );
  return { html: out, headings };
}

export default function BlogPost() {
  const { t, i18n } = useTranslation("pages");
  const lang = i18n.resolvedLanguage || i18n.language || "ru";
  const isEn = lang.toLowerCase().startsWith("en");
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPostType | null>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [related, setRelated] = useState<BlogPostType[]>([]);
  const [copied, setCopied] = useState(false);
  const articleRef = useRef<HTMLElement>(null);
  const { stats } = useBlogViewStats();
  useLogBlogView(post ? slug : undefined);
  const logClick = useLogBlogClick(post ? slug : undefined);
  const rating = useBlogPostRating(post ? slug : undefined);

  // Delegate clicks on links inside the rendered article HTML
  useEffect(() => {
    const el = articleRef.current;
    if (!el || !post) return;
    const handler = (e: MouseEvent) => {
      const target = (e.target as HTMLElement | null)?.closest("a");
      if (!target) return;
      const href = target.getAttribute("href");
      if (!href) return;
      const isExternal = /^https?:\/\//i.test(href) && !href.includes("unvrsm.ru");
      logClick(href, isExternal ? "external" : "internal");
    };
    el.addEventListener("click", handler);
    return () => el.removeEventListener("click", handler);
  }, [post, logClick]);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .eq("published", true)
        .lte("published_at", new Date().toISOString())
        .maybeSingle();
      setPost((data as BlogPostType | null) ?? null);
      setLoading(false);
    })();
  }, [slug]);

  useEffect(() => {
    if (!post) return;
    (async () => {
      const { data } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("published", true)
        .lte("published_at", new Date().toISOString())
        .eq("category", post.category)
        .neq("slug", post.slug)
        .order("published_at", { ascending: false })
        .limit(3);
      setRelated((data ?? []) as BlogPostType[]);
    })();
  }, [post]);

  useEffect(() => {
    const onScroll = () => {
      const el = articleRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = el.scrollHeight - window.innerHeight;
      const scrolled = Math.min(Math.max(-rect.top, 0), Math.max(total, 1));
      setProgress(total > 0 ? (scrolled / total) * 100 : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [post]);

  const localized = useMemo(
    () => (post ? localizedPost(post, lang) : { title: "", excerpt: "", content: "" }),
    [post, lang]
  );

  const { html: contentWithIds, headings } = useMemo(
    () => (post ? withHeadingIds(localized.content) : { html: "", headings: [] as Heading[] }),
    [post, localized.content]
  );

  const canonical = `${BASE_URL}/blog/${slug}`;
  const tags = useMemo(() => (post ? postTags(post, lang) : []), [post, lang]);
  const seoTitleOverride = post ? (isEn ? post.seo_title_en : post.seo_title) : null;
  const seoDescOverride = post ? (isEn ? post.seo_description_en : post.seo_description) : null;
  const ogImageOverride = post ? (isEn ? post.og_image_en : post.og_image) : null;
  const description = post
    ? ((seoDescOverride && seoDescOverride.trim()) ||
       localized.excerpt ||
       stripHtml(localized.content).slice(0, 160))
    : "";
  const resolvedCover = (ogImageOverride && ogImageOverride.trim()) || post?.cover_url || null;
  const ogImage = resolvedCover
    ? (resolvedCover.startsWith("http") ? resolvedCover : `${BASE_URL}${resolvedCover}`)
    : `${BASE_URL}/og-image.png`;

  useSeoMeta({
    title: post
      ? ((seoTitleOverride && seoTitleOverride.trim()) || `${localized.title}${t("blogPost.titleSuffix")}`)
      : t("blogPost.fallbackTitle"),
    description,
    canonical,
    keywords: tags.join(", "),
    ogImage,
    ogType: post ? "article" : "website",
    locale: isEn ? "en_US" : "ru_RU",
    article: post
      ? {
          publishedTime: post.published_at,
          modifiedTime: post.updated_at,
          author: post.author || "universum.",
          section: blogCategoryLabel(post.category, lang),
          tags,
        }
      : undefined,
    jsonLd: post
      ? [
          {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: localized.title,
            description,
            image: [ogImage],
            datePublished: post.published_at,
            dateModified: post.updated_at,
            author: {
              "@type": "Organization",
              name: post.author || "universum.",
              url: BASE_URL,
            },
            publisher: {
              "@type": "Organization",
              name: "universum.",
              url: BASE_URL,
              logo: {
                "@type": "ImageObject",
                url: `${BASE_URL}/og-image.png`,
              },
            },
            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": canonical,
            },
            keywords: tags.join(", "),
            articleSection: blogCategoryLabel(post.category, lang),
            inLanguage: isEn ? "en-US" : "ru-RU",
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: t("blogPage.breadcrumbHome"), item: BASE_URL },
              { "@type": "ListItem", position: 2, name: t("blogPage.breadcrumb"), item: `${BASE_URL}/blog` },
              { "@type": "ListItem", position: 3, name: localized.title, item: canonical },
            ],
          },
        ]
      : undefined,
  });

  const share = async () => {
    const url = canonical;
    if (navigator.share) {
      try { await navigator.share({ title: localized.title, url }); return; } catch { /* cancelled */ }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success(t("blogPost.linkCopied"));
    setTimeout(() => setCopied(false), 2000);
  };

  const dateLocale = isEn ? "en-US" : "ru-RU";

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavbar currentPage="blog" />

      {/* Reading progress */}
      <div
        aria-hidden
        className="fixed top-0 left-0 right-0 h-0.5 bg-primary/80 z-40 origin-left transition-transform duration-100"
        style={{ transform: `scaleX(${progress / 100})` }}
      />

      <main className="flex-1">
        {loading ? (
          <div className="container mx-auto max-w-3xl px-4 pt-28 md:pt-32 pb-16 space-y-4">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : !post ? (
          <div className="container mx-auto max-w-3xl px-4 pt-28 md:pt-32 pb-16 text-center py-16">
            <h1 className="text-2xl font-bold mb-4">{t("blogPost.notFoundTitle")}</h1>
            <Button onClick={() => navigate("/blog")}>{t("blogPost.notFoundBack")}</Button>
          </div>
        ) : (
          <>
            {/* HERO */}
            <header className="relative border-b border-border/60 bg-gradient-to-b from-accent/30 via-background to-background">
              <div className="container mx-auto max-w-3xl px-4 pt-28 md:pt-32 pb-10">
                <nav aria-label="breadcrumb" className="text-sm text-muted-foreground mb-6">
                  <Link to="/" className="hover:text-foreground">{t("blogPage.breadcrumbHome")}</Link>
                  <span className="mx-2">/</span>
                  <Link to="/blog" className="hover:text-foreground">{t("blogPage.breadcrumb")}</Link>
                  <span className="mx-2">/</span>
                  <span className="line-clamp-1 inline text-foreground/70">{localized.title}</span>
                </nav>

                <Link
                  to="/blog"
                  className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
                >
                  <ArrowLeft className="h-4 w-4" /> {t("blogPost.backToBlog")}
                </Link>

                <div className="flex flex-wrap items-center gap-2 mb-5">
                  <Badge className={`gap-1.5 hover:opacity-90 ${blogCategoryClass(post.category)}`}>
                    <span className={`h-2 w-2 rounded-full ${blogCategoryDot(post.category)}`} />
                    {blogCategoryLabel(post.category, lang)}
                  </Badge>
                  {post.keywords.slice(0, 2).map((k) => (
                    <Badge key={k} variant="outline" className="font-normal">{k}</Badge>
                  ))}
                </div>

                <h1 className="text-3xl md:text-5xl font-bold leading-[1.15] tracking-tight mb-5">
                  {localized.title}
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-6 max-w-2xl">
                  {localized.excerpt}
                </p>

                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    {new Date(post.published_at).toLocaleDateString(dateLocale, {
                      day: "numeric", month: "long", year: "numeric",
                    })}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-4 w-4" /> {post.reading_minutes} {t("blogPost.minutesRead")}
                  </span>
                  <span className="inline-flex items-center gap-1.5" title={t("blogPage.totalViews")}>
                    <Eye className="h-4 w-4" /> {stats[post.slug]?.total_views ?? 0}
                  </span>
                  <span className="inline-flex items-center gap-1.5" title={t("blogPage.uniqueViews")}>
                    <Users className="h-4 w-4" /> {stats[post.slug]?.unique_views ?? 0}
                  </span>
                  <Button
                    size="sm" variant="ghost"
                    className="h-8 ml-auto gap-1.5"
                    onClick={share}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                    {t("blogPost.share")}
                  </Button>
                </div>
              </div>
            </header>

            <div className="container mx-auto max-w-6xl px-4 py-12 md:py-16">
              <div className="grid lg:grid-cols-[minmax(0,1fr)_240px] gap-10">
                <article ref={articleRef} className="min-w-0">

                  <div
                    className="prose prose-slate dark:prose-invert max-w-none blog-prose"
                    dangerouslySetInnerHTML={{ __html: contentWithIds }}
                  />

                  {slug && INTERACTIVE_SLUGS.has(slug) && (
                    <DevelopmentBlocksComparison />
                  )}


                  {post.keywords.length > 0 && (
                    <div className="mt-12 pt-6 border-t flex flex-wrap gap-2">
                      {post.keywords.map((k) => (
                        <Badge key={k} variant="outline" className="font-normal">#{k}</Badge>
                      ))}
                    </div>
                  )}

                  {/* Rating */}
                  <Card className="mt-10">
                    <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">{t("blogPost.ratingQuestion")}</h3>
                        <p className="text-sm text-muted-foreground">
                          {rating.count > 0
                            ? t("blogPost.ratingCount", { count: rating.count })
                            : t("blogPost.ratingCount_zero")}
                        </p>
                      </div>
                      <Button
                        variant={rating.liked ? "default" : "outline"}
                        className="gap-2"
                        disabled={rating.loading || rating.saving}
                        onClick={rating.toggle}
                      >
                        <ThumbsUp className={`h-4 w-4 ${rating.liked ? "fill-current" : ""}`} />
                        {t("blogPost.ratingHelpful")}
                        <span className="tabular-nums">{rating.count}</span>
                      </Button>
                    </CardContent>
                  </Card>

                  {/* CTA */}
                  <Card className="mt-10 border-primary/30 bg-gradient-to-br from-primary/5 via-accent/30 to-transparent">
                    <CardContent className="p-6 md:p-8">
                      <h3 className="text-xl md:text-2xl font-semibold mb-2">
                        {t("blogPost.ctaTitle")}
                      </h3>
                      <p className="text-muted-foreground mb-5">
                        {t("blogPost.ctaText")}
                      </p>
                      <div className="flex flex-wrap gap-3">
                        <Button asChild onClick={() => logClick("/register", "cta")}>
                          <Link to="/register">{t("blogPost.ctaStart")} <ArrowRight className="h-4 w-4 ml-1" /></Link>
                        </Button>
                        <Button asChild variant="outline" onClick={() => logClick("/pricing", "cta")}>
                          <Link to="/pricing">{t("blogPost.ctaPricing")}</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </article>

                {/* Sidebar: TOC + share */}
                <aside className="hidden lg:block">
                  <div className="sticky top-28 space-y-6">
                    {headings.length > 1 && (
                      <div>
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                          <ListOrdered className="h-3.5 w-3.5" /> {t("blogPost.toc")}
                        </div>
                        <nav className="text-sm space-y-1.5 border-l border-border">
                          {headings.map((h) => (
                            <a
                              key={h.id}
                              href={`#${h.id}`}
                              className={`block hover:text-primary transition-colors text-muted-foreground -ml-px border-l-2 border-transparent hover:border-primary pl-3 ${
                                h.level === 3 ? "pl-6 text-xs" : ""
                              }`}
                            >
                              {h.text}
                            </a>
                          ))}
                        </nav>
                      </div>
                    )}
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                        {t("blogPost.shareLabel")}
                      </div>
                      <Button size="sm" variant="outline" className="w-full gap-2" onClick={share}>
                        {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
                        {copied ? t("blogPost.copied") : t("blogPost.copyLink")}
                      </Button>
                    </div>
                  </div>
                </aside>
              </div>

              {/* Comments */}
              <BlogComments postId={post.id} isEn={isEn} />

              {/* Related */}
              {related.length > 0 && (
                <section className="mt-16 pt-10 border-t">
                  <h2 className="text-2xl font-bold mb-6">{t("blogPost.related")}</h2>
                  <div className="grid md:grid-cols-3 gap-5">
                    {related.map((r) => {
                      const rloc = localizedPost(r, lang);
                      return (
                      <Link key={r.id} to={`/blog/${r.slug}`} className="group" onClick={() => logClick(`/blog/${r.slug}`, "related")}>
                        <Card className="h-full transition-shadow group-hover:shadow-md">
                          <CardContent className="p-5">
                            <Badge className={`mb-3 gap-1.5 hover:opacity-90 ${blogCategoryClass(r.category)}`}>
                              <span className={`h-2 w-2 rounded-full ${blogCategoryDot(r.category)}`} />
                              {blogCategoryLabel(r.category, lang)}
                            </Badge>
                            <h3 className="font-semibold leading-snug mb-2 group-hover:text-primary transition-colors line-clamp-3">
                              {rloc.title}
                            </h3>
                            <p className="text-xs text-muted-foreground inline-flex items-center gap-1">
                              <Clock className="h-3 w-3" /> {r.reading_minutes} {t("blogPage.minutes")}
                            </p>
                          </CardContent>
                        </Card>
                      </Link>
                      );
                    })}
                  </div>
                </section>
              )}
            </div>
          </>
        )}
      </main>
      <LandingFooter />
    </div>
  );
}
