import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import type { BlogPost, BlogCategory } from "@/types/blog";
import { BLOG_CATEGORIES, blogCategoryLabel, blogCategoryClass, blogCategoryDot, localizedPost } from "@/types/blog";
import { useSeoMeta } from "@/hooks/useSeoMeta";
import { PublicNavbar } from "@/components/PublicNavbar";
import LandingFooter from "@/components/LandingFooter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Rss, Search, ChevronLeft, ChevronRight, Clock, Eye, Users, FileText, ThumbsUp, Newspaper, X } from "lucide-react";
import { useBlogViewStats } from "@/hooks/useBlogViews";
import { useBlogPostLikeStats } from "@/hooks/useBlogPostLikes";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const PAGE_SIZE = 6;
const BASE_URL = "https://unvrsm.ru";

export default function Blog() {
  const { t, i18n } = useTranslation("pages");
  const lang = i18n.resolvedLanguage || i18n.language || "ru";
  const isEn = lang.toLowerCase().startsWith("en");
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<BlogCategory | "all">("all");
  const [page, setPage] = useState(1);
  const [selectedNews, setSelectedNews] = useState<BlogPost | null>(null);
  const { stats } = useBlogViewStats();
  const { likes: postLikes } = useBlogPostLikeStats();
  const [likesTotal, setLikesTotal] = useState<number>(0);
  const [uniqueVisitors, setUniqueVisitors] = useState<number>(0);
  const [viewsTotal, setViewsTotal] = useState<number>(0);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("published", true)
        .lte("published_at", new Date().toISOString())
        .order("published_at", { ascending: false });
      setPosts((data ?? []) as BlogPost[]);
      setLoading(false);
    })();

    // Единый источник сводных цифр — та же RPC, что и в админ-панели
    (async () => {
      const { data } = await (supabase as any).rpc("get_blog_totals");
      const t = Array.isArray(data) ? data[0] : data;
      if (!t) return;
      setViewsTotal(Number(t.total_views) || 0);
      setUniqueVisitors(Number(t.unique_visitors) || 0);
      // Считаем только оценки самих статей, без лайков комментариев
      setLikesTotal(Number(t.post_likes) || 0);
    })();
  }, []);

  const totalViews = viewsTotal;

  const { filtered, newsPosts } = useMemo(() => {
    const term = q.trim().toLowerCase();
    const articles = posts.filter(p => p.category !== "news");
    const news = posts.filter(p => p.category === "news");

    const filteredArticles = articles.filter((p) => {
      if (category !== "all" && p.category !== category) return false;
      if (!term) return true;
      const loc = localizedPost(p, lang);
      const hay = [loc.title, loc.excerpt, p.keywords.join(" ")].join(" ").toLowerCase();
      return hay.includes(term);
    });

    const filteredNews = news.filter(p => {
      if (!term) return true;
      const loc = localizedPost(p, lang);
      return loc.title.toLowerCase().includes(term) || loc.excerpt.toLowerCase().includes(term);
    });

    return { filtered: filteredArticles, newsPosts: filteredNews };
  }, [posts, q, category, lang]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useSeoMeta({
    title: t("blogPage.seoTitle"),
    description: t("blogPage.seoDescription"),
    canonical: `${BASE_URL}/blog`,
    keywords: "блог, психолог, логопед, дефектолог, ППк, ПМПК, школа, родители, blog, psychology",
    locale: isEn ? "en_US" : "ru_RU",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Blog",
      name: t("blogPage.seoTitle"),
      url: `${BASE_URL}/blog`,
      description: t("blogPage.seoDescription"),
      inLanguage: isEn ? "en-US" : "ru-RU",
    },
  });

  const dateLocale = isEn ? "en-US" : "ru-RU";

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavbar currentPage="blog" />
      <main className="flex-1 container mx-auto max-w-6xl px-4 pt-28 md:pt-32 pb-16">
        <header className="mb-10">
          <nav aria-label="breadcrumb" className="text-sm text-muted-foreground mb-3">
            <Link to="/" className="hover:text-foreground">{t("blogPage.breadcrumbHome")}</Link>
            <span className="mx-2">/</span>
            <span>{t("blogPage.breadcrumb")}</span>
          </nav>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">{t("blogPage.title")}</h1>
              <p className="text-muted-foreground mt-3 max-w-2xl">
                {t("blogPage.subtitle")}
              </p>
            </div>
            <a
              href="/rss.xml"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              aria-label={t("blogPage.rssAria")}
            >
              <Rss className="h-4 w-4" /> RSS
            </a>
          </div>
        </header>

        <div className="mb-8 grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: FileText, label: isEn ? "Articles" : "Статей", value: posts.length },
            { icon: Eye, label: isEn ? "Views" : "Просмотров", value: totalViews },
            { icon: Users, label: isEn ? "Unique visitors" : "Уникальных читателей", value: uniqueVisitors },
            { icon: ThumbsUp, label: isEn ? "Helpful votes" : "Оценок «полезно»", value: likesTotal },
          ].map(({ icon: Icon, label, value }) => (
            <Card key={label}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-2xl font-bold leading-tight tabular-nums">
                    {value.toLocaleString(isEn ? "en-US" : "ru-RU")}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">{label}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>



        <div className="mb-8 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
              placeholder={t("blogPage.searchPlaceholder")}
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={category === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => { setCategory("all"); setPage(1); }}
            >
              {t("blogPage.all")}
            </Button>
            {BLOG_CATEGORIES.map((c) => (
              <Button
                key={c.value}
                variant={category === c.value ? "default" : "outline"}
                size="sm"
                className="gap-1.5"
                onClick={() => { setCategory(c.value); setPage(1); }}
              >
                <span className={`h-2 w-2 rounded-full ${blogCategoryDot(c.value)}`} />
                {blogCategoryLabel(c.value, lang)}
              </Button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-56 w-full" />
            ))}
          </div>
        ) : paged.length === 0 ? (
          <p className="text-muted-foreground text-center py-12">{t("blogPage.notFound")}</p>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paged.map((p) => {
                const loc = localizedPost(p, lang);
                return (
                <Link key={p.id} to={`/blog/${p.slug}`} className="group">
                  <Card className="h-full transition-shadow group-hover:shadow-md overflow-hidden relative">
                    <span
                      aria-hidden
                      className={`absolute left-0 top-0 h-full w-1 ${blogCategoryDot(p.category)}`}
                    />
                    <CardHeader>
                      <div className="flex items-center justify-between mb-2">
                        <Badge className={`gap-1.5 hover:opacity-90 ${blogCategoryClass(p.category)}`}>
                          <span className={`h-2 w-2 rounded-full ${blogCategoryDot(p.category)}`} />
                          {blogCategoryLabel(p.category, lang)}
                        </Badge>
                        <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {p.reading_minutes} {t("blogPage.minutes")}
                        </span>
                      </div>
                      <CardTitle className="text-lg leading-snug group-hover:text-primary transition-colors">
                        {loc.title}
                      </CardTitle>
                      <CardDescription className="line-clamp-3">{loc.excerpt}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                        <span>
                          {new Date(p.published_at).toLocaleDateString(dateLocale, {
                            day: "numeric", month: "long", year: "numeric",
                          })}
                        </span>
                        <span className="inline-flex items-center gap-3">
                          <span className="inline-flex items-center gap-1" title={t("blogPage.totalViews")}>
                            <Eye className="h-3.5 w-3.5" /> {stats[p.slug]?.total_views ?? 0}
                          </span>
                          <span className="inline-flex items-center gap-1" title={t("blogPage.uniqueViews")}>
                            <Users className="h-3.5 w-3.5" /> {stats[p.slug]?.unique_views ?? 0}
                          </span>
                          <span className="inline-flex items-center gap-1" title={t("blogPage.helpfulVotes")}>
                            <ThumbsUp className="h-3.5 w-3.5" /> {postLikes[p.slug] ?? 0}
                          </span>
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <Button
                  variant="outline" size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setPage(currentPage - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline" size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setPage(currentPage + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </main>
      <LandingFooter />
    </div>
  );
}
