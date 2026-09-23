import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { localizedPost } from "@/types/blog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowRight } from "lucide-react";

const STORAGE_KEY = "seen-login-news";

/**
 * Показывает последнюю новость во всплывающем окне при входе в систему.
 * Каждая новость показывается один раз (запоминается в localStorage).
 */
export const LoginNewsDialog = () => {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);

  const { data: news } = useQuery({
    queryKey: ["login-news"],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("id, slug, title, title_en, excerpt, excerpt_en, published_at")
        .eq("category", "news")
        .eq("published", true)
        .lte("published_at", new Date().toISOString())
        .order("published_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!news?.id) return;
    try {
      const seen = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      if (Array.isArray(seen) && seen.includes(news.id)) return;
    } catch {
      /* ignore */
    }
    const timer = setTimeout(() => setOpen(true), 800);
    return () => clearTimeout(timer);
  }, [news?.id]);

  const dismiss = () => {
    setOpen(false);
    if (!news?.id) return;
    try {
      const seen = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      const list = Array.isArray(seen) ? seen : [];
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...list, news.id].slice(-20)));
    } catch {
      /* ignore */
    }
  };

  if (!news) return null;

  const isEn = (i18n.language || "").toLowerCase().startsWith("en");
  const loc = localizedPost(news as never, i18n.language);

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : dismiss())}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <Badge className="w-fit mb-2">{isEn ? "News" : "Новое"}</Badge>
          <DialogTitle className="text-left">{loc.title}</DialogTitle>
          <DialogDescription className="text-left">{loc.excerpt}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="ghost" onClick={dismiss}>
            {isEn ? "Later" : "Позже"}
          </Button>
          <Button asChild onClick={dismiss}>
            <Link to={`/blog/${news.slug}`}>
              {isEn ? "Read" : "Подробнее"}
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LoginNewsDialog;
