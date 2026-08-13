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
import { Rss, Search, ChevronLeft, ChevronRight, Clock, Eye, Users, FileText, ThumbsUp, Newspaper, X, CheckCircle2 } from "lucide-react";
import { useBlogViewStats } from "@/hooks/useBlogViews";
import { useBlogPostLikeStats } from "@/hooks/useBlogPostLikes";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

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
  const [readNewsIds, setReadNewsIds] = useState<Set<string>>(new Set());
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();
  const { stats } = useBlogViewStats();
  const { likes: postLikes } = useBlogPostLikeStats();
  const [likesTotal, setLikesTotal] = useState<number>(0);
  const [uniqueVisitors, setUniqueVisitors] = useState<number>(0);
  const [viewsTotal, setViewsTotal] = useState<number>(0);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        const { data: readData } = await supabase
          .from("user_read_news")
          .select("news_id")
          .eq("user_id", user.id);
        
        if (readData) {
          setReadNewsIds(new Set(readData.map(r => r.news_id)));
        }
      }
    })();

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

  const markAsRead = async (newsId: string) => {
    if (!user) return;
    if (readNewsIds.has(newsId)) return;

    const { error } = await supabase
      .from("user_read_news")
      .insert({ user_id: user.id, news_id: newsId });

    if (!error) {
      setReadNewsIds(prev => new Set(prev).add(newsId));
    }
  };

  const handleNewsClick = (news: BlogPost) => {
    setSelectedNews(news);
    markAsRead(news.id);
  };

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
            {BLOG_CATEGORIES.filter(c => c.value !== "news").map((c) => (
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

        <div className="lg:hidden mb-6 overflow-x-auto pb-2 scrollbar-none">
          <div className="flex gap-4 min-w-max">
            {newsPosts.slice(0, 5).map((n) => (
              <div 
                key={n.id} 
                onClick={() => handleNewsClick(n)}
                className={`bg-card border rounded-lg p-3 w-64 shrink-0 cursor-pointer hover:border-primary transition-colors shadow-sm relative ${readNewsIds.has(n.id) ? "opacity-75" : ""}`}
              >
                {!readNewsIds.has(n.id) && user && (
                  <span className="absolute top-2 right-2 h-2 w-2 bg-primary rounded-full" />
                )}
                {readNewsIds.has(n.id) && user && (
                  <CheckCircle2 className="absolute top-2 right-2 h-3.5 w-3.5 text-muted-foreground/40" />
                )}
                <div className="text-xs text-muted-foreground mb-1">
                  {new Date(n.published_at || "").toLocaleDateString(isEn ? "en-US" : "ru-RU")}
                </div>
                <h4 className="font-medium text-sm line-clamp-2 leading-snug">{n.title}</h4>
              </div>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_300px] gap-8 items-start">
          <div className="min-w-0">


          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-56 w-full" />
              ))}
            </div>
          ) : paged.length === 0 ? (
            <p className="text-muted-foreground text-center py-12">{t("blogPage.notFound")}</p>
          ) : (
            <>
              <div className="grid md:grid-cols-2 gap-6">
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
          </div>

          <aside className="hidden lg:block space-y-6 sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
            <div className="flex items-center justify-between font-semibold text-lg border-b pb-2 sticky top-0 bg-background z-10">
              <div className="flex items-center gap-2">
                <Newspaper className="h-5 w-5 text-primary" />
                {isEn ? "News" : "Новости"}
                {unreadCount > 0 && user && (
                  <Badge variant="destructive" className="ml-2 animate-pulse rounded-full px-2 py-0.5 text-[10px]">
                    +{unreadCount}
                  </Badge>
                )}
              </div>
              <Badge variant="secondary" className="lg:hidden">
                {newsPosts.length}
              </Badge>
            </div>
            {newsPosts.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                {isEn ? "No news yet" : "Новостей пока нет"}
              </p>
            ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                {newsPosts.slice(0, 10).map((n) => {
                  const loc = localizedPost(n, lang);
                  return (
                    <button
                      key={n.id}
                      onClick={() => handleNewsClick(n)}
                      className="w-full text-left group"
                    >
                      <Card className={`hover:border-primary/50 transition-colors bg-accent/5 relative ${readNewsIds.has(n.id) ? "opacity-75" : ""}`}>
                        {!readNewsIds.has(n.id) && user && (
                          <span className="absolute top-3 right-3 h-2 w-2 bg-primary rounded-full" />
                        )}
                        {readNewsIds.has(n.id) && user && (
                          <CheckCircle2 className="absolute top-3 right-3 h-3.5 w-3.5 text-muted-foreground/40" />
                        )}
                        <CardContent className="p-4">
                          <div className="text-xs text-muted-foreground mb-1">
                            {new Date(n.published_at).toLocaleDateString(dateLocale)}
                          </div>
                          <h4 className="font-medium text-sm leading-snug group-hover:text-primary transition-colors line-clamp-2">
                            {loc.title}
                          </h4>
                        </CardContent>
                      </Card>
                    </button>
                  );
                })}
              </div>
            )}
          </aside>
        </div>

        <Dialog open={!!selectedNews} onOpenChange={(open) => !open && setSelectedNews(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="font-normal">
                  {isEn ? "News" : "Новости"}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {selectedNews && new Date(selectedNews.published_at).toLocaleDateString(dateLocale, {
                    day: "numeric", month: "long", year: "numeric",
                  })}
                </span>
              </div>
              <DialogTitle className="text-2xl font-bold">
                {selectedNews && localizedPost(selectedNews, lang).title}
              </DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              {selectedNews && (
                <div 
                  className="prose prose-sm dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: localizedPost(selectedNews, lang).content }}
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </main>
      <LandingFooter />
    </div>
  );
}
