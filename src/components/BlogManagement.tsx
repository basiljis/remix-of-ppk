import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { BlogPost, BlogCategory } from "@/types/blog";
import { BLOG_CATEGORIES, blogCategoryLabel, postToZenText, postToZenHtml } from "@/types/blog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Copy, ExternalLink, Rss, ImageDown, BarChart3, MessageSquare, CalendarClock, Map, Languages, Share, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { downloadZenCover } from "@/lib/zen-cover";
import {
  PUBLISH_STEP_DAYS, nextPublishSlot, rebuildQueue, toLocalInput, seoCompleteness, buildSitemap,
} from "@/lib/blog-schedule";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BlogAnalyticsDashboard } from "@/components/BlogAnalyticsDashboard";
import { BlogCommentsModeration } from "@/components/BlogCommentsModeration";
import { getZenSettings, saveZenSettings, publishToZen, ZenSettings } from "@/lib/zen-api";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History } from "lucide-react";

const empty = {
  slug: "",
  title: "",
  excerpt: "",
  content: "",
  category: "news" as BlogCategory,
  keywords: "",
  cover_url: "",
  author: "Команда universum.",
  reading_minutes: 5,
  published: true,
  published_at: "",
  seo_title: "",
  seo_description: "",
  og_image: "",
  seo_title_en: "",
  seo_description_en: "",
  og_image_en: "",
};

function slugify(s: string): string {
  const map: Record<string, string> = {
    а:"a",б:"b",в:"v",г:"g",д:"d",е:"e",ё:"e",ж:"zh",з:"z",и:"i",й:"i",
    к:"k",л:"l",м:"m",н:"n",о:"o",п:"p",р:"r",с:"s",т:"t",у:"u",ф:"f",
    х:"h",ц:"ts",ч:"ch",ш:"sh",щ:"sch",ъ:"",ы:"y",ь:"",э:"e",ю:"yu",я:"ya",
  };
  return s.toLowerCase().split("").map((c) => map[c] ?? c).join("")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

export function BlogManagement() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [form, setForm] = useState(empty);
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();
  const [zenSettings, setZenSettings] = useState<ZenSettings | null>(null);
  const [zenDialogOpen, setZenDialogOpen] = useState(false);
  const [zenTokenInput, setZenTokenInput] = useState("");
  const [zenChannelInput, setZenChannelInput] = useState("");
  const [publishingZenId, setPublishingZenId] = useState<string | null>(null);
  const [zenLogs, setZenLogs] = useState<any[]>([]);
  const [showLogsDialog, setShowLogsDialog] = useState(false);
  const [selectedPosts, setSelectedPosts] = useState<Set<string>>(new Set());
  const [publishingBatch, setPublishingBatch] = useState(false);

  const loadZenLogs = async () => {
    // Используем dynamic cast через any, чтобы избежать ошибок типизации до обновления types.ts
    const { data } = await (supabase
      .from("zen_publication_logs" as any) as any)
      .select("*, blog_posts(title)")
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) setZenLogs(data);
  };

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .order("published_at", { ascending: false });
    if (error) {
      toast({ title: "Ошибка загрузки", description: error.message, variant: "destructive" });
    } else {
      setPosts((data ?? []) as BlogPost[]);
    }
    setLoading(false);
  };

  useEffect(() => { 
    load(); 
    getZenSettings().then(s => {
      if (s) {
        setZenSettings(s);
        setZenTokenInput(s.token);
        setZenChannelInput(s.channelId || "");
      }
    });
  }, []);

  const openCreate = () => {
    setEditing(null);
    // Автокадансация: следующая статья выходит через 2 дня после последней запланированной.
    setForm({ ...empty, published_at: toLocalInput(nextPublishSlot(posts)) });
    setOpenDialog(true);
  };

  const openEdit = (p: BlogPost) => {
    setEditing(p);
    setForm({
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt,
      content: p.content,
      category: p.category,
      keywords: p.keywords.join(", "),
      cover_url: p.cover_url ?? "",
      author: p.author,
      reading_minutes: p.reading_minutes,
      published: p.published,
      published_at: toLocalInput(p.published_at),
      seo_title: p.seo_title ?? "",
      seo_description: p.seo_description ?? "",
      og_image: p.og_image ?? "",
      seo_title_en: p.seo_title_en ?? "",
      seo_description_en: p.seo_description_en ?? "",
      og_image_en: p.og_image_en ?? "",
    });
    setOpenDialog(true);
  };

  const save = async () => {
    if (!form.title.trim()) {
      toast({ title: "Введите заголовок", variant: "destructive" });
      return;
    }
    const payload = {
      slug: form.slug.trim() || slugify(form.title),
      title: form.title.trim(),
      excerpt: form.excerpt.trim(),
      content: form.content,
      category: form.category,
      keywords: form.keywords.split(",").map((s) => s.trim()).filter(Boolean),
      cover_url: form.cover_url.trim() || null,
      author: form.author.trim() || "Команда universum.",
      reading_minutes: Number(form.reading_minutes) || 5,
      published: form.published,
      published_at: form.published_at
        ? new Date(form.published_at).toISOString()
        : nextPublishSlot(posts).toISOString(),
      // SEO-поля не оставляем пустыми: подставляем заголовок/описание статьи.
      seo_title: form.seo_title.trim() || form.title.trim(),
      seo_description: form.seo_description.trim() || form.excerpt.trim() || null,
      og_image: form.og_image.trim() || null,
      seo_title_en: form.seo_title_en.trim() || null,
      seo_description_en: form.seo_description_en.trim() || null,
      og_image_en: form.og_image_en.trim() || null,
    };

    const { error } = editing
      ? await supabase.from("blog_posts").update(payload).eq("id", editing.id)
      : await supabase.from("blog_posts").insert(payload);

    if (error) {
      toast({ title: "Не удалось сохранить", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: editing ? "Статья обновлена" : "Статья создана" });
    setOpenDialog(false);
    load();
  };

  const remove = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("blog_posts").delete().eq("id", deleteId);
    if (error) {
      toast({ title: "Не удалось удалить", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Статья удалена" });
      load();
    }
    setDeleteId(null);
  };

  const copyForZen = async (p: BlogPost) => {
    const html = postToZenHtml(p);
    const text = postToZenText(p);
    try {
      // Богатая вставка: Дзен.Редактор сохранит заголовки, абзацы, списки и картинку.
      if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/html": new Blob([html], { type: "text/html" }),
            "text/plain": new Blob([text], { type: "text/plain" }),
          }),
        ]);
      } else {
        await navigator.clipboard.writeText(text);
      }
      toast({
        title: "Скопировано для Яндекс Дзен",
        description:
          "Вставьте в Дзен.Редактор (Ctrl+V / ⌘+V) — заголовки, абзацы, списки и ссылки сохранятся. Обложку загрузите отдельно кнопкой 🖼️ ниже.",
      });
    } catch {
      try {
        await navigator.clipboard.writeText(text);
        toast({ title: "Скопирован текст", description: "HTML недоступен — вставлен обычный текст." });
      } catch {
        toast({ title: "Не удалось скопировать", variant: "destructive" });
      }
    }
  };

  const handlePublishToZen = async (p: BlogPost) => {
    if (!zenSettings?.token) {
      setZenDialogOpen(true);
      return;
    }

    setPublishingZenId(p.id);
    try {
      await publishToZen(p, zenSettings);
      toast({ title: "Статья отправлена в Дзен", description: "Проверьте черновики в кабинете Дзена." });
      loadZenLogs();
    } catch (e) {
      toast({ 
        title: "Ошибка публикации в Дзен", 
        description: e instanceof Error ? e.message : "Убедитесь, что Edge Function 'publish-to-zen' развернута.",
        variant: "destructive" 
      });
      loadZenLogs();
    } finally {
      setPublishingZenId(null);
    }
  };

  const handleBatchPublishToZen = async () => {
    if (!zenSettings?.token) {
      setZenDialogOpen(true);
      return;
    }

    if (selectedPosts.size === 0) {
      toast({ title: "Выберите статьи", description: "Нужно выбрать хотя бы одну статью для публикации." });
      return;
    }

    if (selectedPosts.size > 5) {
      toast({ title: "Слишком много статей", description: "Максимум 5 статей за один раз.", variant: "destructive" });
      return;
    }

    setPublishingBatch(true);
    const selectedList = posts.filter(p => selectedPosts.has(p.id));
    let successCount = 0;
    let failCount = 0;

    for (const p of selectedList) {
      try {
        await publishToZen(p, zenSettings);
        successCount++;
      } catch (e) {
        failCount++;
        console.error(`Error publishing ${p.title} to Zen:`, e);
      }
    }

    toast({
      title: "Пакетная публикация завершена",
      description: `Успешно: ${successCount}, Ошибок: ${failCount}.`,
      variant: failCount > 0 ? "destructive" : "default"
    });

    setSelectedPosts(new Set());
    loadZenLogs();
    setPublishingBatch(false);
  };

  const togglePostSelection = (id: string) => {
    setSelectedPosts(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (next.size >= 5) {
          toast({ title: "Лимит выбора", description: "Можно выбрать не более 5 статей.", variant: "destructive" });
          return prev;
        }
        next.add(id);
      }
      return next;
    });
  };

  const saveZenConfig = async () => {
    try {
      const s = { token: zenTokenInput, channelId: zenChannelInput };
      await saveZenSettings(s);
      setZenSettings(s);
      setZenDialogOpen(false);
      toast({ title: "Настройки Дзена сохранены" });
    } catch (e) {
      toast({ title: "Ошибка сохранения", description: String(e), variant: "destructive" });
    }
  };

  const downloadCover = async (p: BlogPost) => {
    try {
      await downloadZenCover(p);
      toast({
        title: "Обложка сгенерирована",
        description: "JPEG 1200×630 скачан. Перетащите файл в блок обложки Дзен.Редактора.",
      });
    } catch (e) {
      toast({
        title: "Не удалось создать обложку",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    }
  };

  const applyQueue = async () => {
    const plan = rebuildQueue(posts);
    if (plan.length === 0) {
      toast({ title: "Нет запланированных статей", description: "Очередь выстраивается по будущим публикациям." });
      return;
    }
    const changed = plan.filter((x) => new Date(x.from).toISOString() !== x.to);
    if (changed.length === 0) {
      toast({ title: "Очередь уже с шагом в 2 дня" });
      return;
    }
    for (const item of changed) {
      const { error } = await supabase
        .from("blog_posts")
        .update({ published_at: item.to })
        .eq("id", item.id);
      if (error) {
        toast({ title: "Не удалось обновить очередь", description: error.message, variant: "destructive" });
        return;
      }
    }
    toast({
      title: `Очередь выстроена: каждые ${PUBLISH_STEP_DAYS} дня`,
      description: `Обновлено статей: ${changed.length}.`,
    });
    load();
  };

  const downloadSitemap = () => {
    const published = posts.filter(
      (p) => p.published && new Date(p.published_at) <= new Date()
    );
    const xml = buildSitemap(published);
    const url = URL.createObjectURL(new Blob([xml], { type: "application/xml" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "sitemap.xml";
    a.click();
    URL.revokeObjectURL(url);
    toast({
      title: "sitemap.xml сгенерирован",
      description: `Маршрутов со статьями: ${published.length}. Замените файл в public/ или используйте динамический /sitemap.xml.`,
    });
  };

  const copyRss = async () => {
    const url = `https://unvrsm.ru/rss.xml`;
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "Ссылка на RSS скопирована", description: url });
    } catch {
      toast({ title: "Не удалось скопировать", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="posts" className="space-y-6">
        <TabsList>
          <TabsTrigger value="posts">Статьи</TabsTrigger>
          <TabsTrigger value="comments"><MessageSquare className="h-4 w-4 mr-1.5" />Комментарии</TabsTrigger>
          <TabsTrigger value="analytics"><BarChart3 className="h-4 w-4 mr-1.5" />Аналитика</TabsTrigger>
        </TabsList>
        <TabsContent value="comments" className="mt-0">
          <BlogCommentsModeration />
        </TabsContent>
        <TabsContent value="analytics" className="mt-0">
          <BlogAnalyticsDashboard />
        </TabsContent>
        <TabsContent value="posts" className="mt-0 space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Управление статьями блога</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Создание, редактирование, публикация. Копия для Яндекс Дзен — одной кнопкой.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={applyQueue} title={`Выстроить будущие публикации с шагом в ${PUBLISH_STEP_DAYS} дня`}>
              <CalendarClock className="h-4 w-4 mr-2" /> Очередь 2 дня
            </Button>
            <Button variant="outline" size="sm" onClick={downloadSitemap} title="Сгенерировать sitemap.xml со всеми статьями и hreflang">
              <Map className="h-4 w-4 mr-2" /> sitemap.xml
            </Button>
            <Button variant="outline" size="sm" onClick={copyRss}>
              <Rss className="h-4 w-4 mr-2" /> RSS
            </Button>
            <Button variant="outline" size="sm" onClick={() => setZenDialogOpen(true)} title="Настроить интеграцию с Яндекс Дзен">
              <Settings className="h-4 w-4 mr-2" /> Дзен API
            </Button>
            <Button variant="outline" size="sm" onClick={() => { loadZenLogs(); setShowLogsDialog(true); }} title="История публикаций в Дзен">
              <History className="h-4 w-4 mr-2" /> Логи Дзен
            </Button>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" /> Новая статья
            </Button>
          </div>
        </CardHeader>
        
        {selectedPosts.size > 0 && (
          <div className="px-6 py-2 bg-primary/5 border-b flex items-center justify-between">
            <div className="text-sm font-medium">
              Выбрано для Дзена: {selectedPosts.size} из 5
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => setSelectedPosts(new Set())}>
                Сбросить
              </Button>
              <Button 
                size="sm" 
                onClick={handleBatchPublishToZen} 
                disabled={publishingBatch}
              >
                {publishingBatch ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Share className="h-4 w-4 mr-2" />}
                Опубликовать {selectedPosts.size} в Дзен
              </Button>
            </div>
          </div>
        )}
        
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Загрузка…</p>
          ) : posts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Пока нет статей.</p>
          ) : (
            <div className="space-y-3">
              {posts.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-4 p-3 border rounded-md">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge variant="secondary">{blogCategoryLabel(p.category)}</Badge>
                      {!p.published && <Badge variant="outline">Черновик</Badge>}
                      {p.published && new Date(p.published_at) > new Date() && (
                        <Badge className="bg-amber-500 hover:bg-amber-600">
                          Запланирована на {new Date(p.published_at).toLocaleDateString("ru-RU")}
                        </Badge>
                      )}
                      {(() => {
                        const seo = seoCompleteness(p);
                        return (
                          <Badge
                            variant="outline"
                            className={seo.ru && seo.en ? "border-primary/40 text-primary" : "border-destructive/40 text-destructive"}
                            title={seo.ru && seo.en ? "SEO заполнено на RU и EN" : `Не хватает: ${seo.missing.join(", ")}`}
                          >
                            <Languages className="h-3 w-3 mr-1" />
                            SEO {seo.ru ? "RU" : "—"}/{seo.en ? "EN" : "—"}
                          </Badge>
                        );
                      })()}
                      <span className="text-xs text-muted-foreground">
                        {new Date(p.published_at).toLocaleDateString("ru-RU")}
                      </span>
                      <span className="text-xs text-muted-foreground">/{p.slug}</span>
                    </div>
                    <p className="font-medium truncate">{p.title}</p>
                    <p className="text-sm text-muted-foreground line-clamp-1">{p.excerpt}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button size="sm" variant="ghost" asChild title="Открыть">
                      <Link to={`/blog/${p.slug}`} target="_blank" rel="noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => copyForZen(p)} title="Копировать для Яндекс Дзен (HTML + текст со ссылками)">
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => handlePublishToZen(p)} 
                      disabled={publishingZenId === p.id}
                      title="Опубликовать напрямую в Яндекс Дзен"
                    >
                      <Share className={`h-4 w-4 ${publishingZenId === p.id ? "animate-spin" : ""}`} />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => downloadCover(p)} title="Сгенерировать и скачать обложку для Дзена (1200×630)">
                      <ImageDown className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => openEdit(p)} title="Редактировать">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setDeleteId(p.id)} title="Удалить">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Редактирование статьи" : "Новая статья"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Заголовок *</Label>
              <Input
                id="title" value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="slug">Слаг (URL)</Label>
                <Input
                  id="slug" value={form.slug} placeholder="сгенерируется автоматически"
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Категория</Label>
                <Select
                  value={form.category}
                  onValueChange={(v: BlogCategory) => setForm({ ...form, category: v })}
                >
                  <SelectTrigger id="category"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BLOG_CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="excerpt">Краткое описание (для SEO и превью)</Label>
              <Textarea
                id="excerpt" rows={2} value={form.excerpt}
                onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="content">Содержимое (HTML)</Label>
              <Textarea
                id="content" rows={14} value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                className="font-mono text-xs"
                placeholder="<h2>Подзаголовок</h2><p>Текст…</p>"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="keywords">Ключевые слова (через запятую)</Label>
                <Input
                  id="keywords" value={form.keywords}
                  onChange={(e) => setForm({ ...form, keywords: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cover">Обложка (URL, опционально)</Label>
                <Input
                  id="cover" value={form.cover_url}
                  onChange={(e) => setForm({ ...form, cover_url: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 items-end">
              <div className="grid gap-2">
                <Label htmlFor="author">Автор</Label>
                <Input
                  id="author" value={form.author}
                  onChange={(e) => setForm({ ...form, author: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="minutes">Время чтения (мин)</Label>
                <Input
                  id="minutes" type="number" min={1} value={form.reading_minutes}
                  onChange={(e) => setForm({ ...form, reading_minutes: Number(e.target.value) })}
                />
              </div>
              <div className="flex items-center gap-2 pb-2">
                <Switch
                  id="published" checked={form.published}
                  onCheckedChange={(v) => setForm({ ...form, published: v })}
                />
                <Label htmlFor="published">Опубликовать</Label>
              </div>
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="published_at">Дата и время публикации</Label>
                <Button
                  type="button" variant="ghost" size="sm"
                  onClick={() => setForm({ ...form, published_at: toLocalInput(nextPublishSlot(posts)) })}
                >
                  <CalendarClock className="h-4 w-4 mr-1.5" /> Следующий слот (+{PUBLISH_STEP_DAYS} дня)
                </Button>
              </div>
              <Input
                id="published_at" type="datetime-local" value={form.published_at}
                onChange={(e) => setForm({ ...form, published_at: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Новая статья по умолчанию встаёт в очередь через {PUBLISH_STEP_DAYS} дня после последней публикации
                и появится в блоге автоматически в указанное время.
              </p>
            </div>

            <div className="border-t pt-4 mt-2 space-y-4">
              <div>
                <h4 className="text-sm font-semibold">SEO и социальные превью</h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Переопределяют &lt;title&gt;, meta description и og:image. Если пусто — используются заголовок и описание статьи.
                </p>
              </div>

              <div className="grid gap-3">
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="seo_title">SEO title (RU)</Label>
                    <span className="text-xs text-muted-foreground tabular-nums">{form.seo_title.length}/60</span>
                  </div>
                  <Input
                    id="seo_title" maxLength={80} value={form.seo_title}
                    placeholder="Оптимально 50–60 символов"
                    onChange={(e) => setForm({ ...form, seo_title: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="seo_description">Meta description (RU)</Label>
                    <span className="text-xs text-muted-foreground tabular-nums">{form.seo_description.length}/160</span>
                  </div>
                  <Textarea
                    id="seo_description" rows={2} maxLength={200} value={form.seo_description}
                    placeholder="До 160 символов, с ключевыми словами"
                    onChange={(e) => setForm({ ...form, seo_description: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="og_image">og:image URL (RU)</Label>
                  <Input
                    id="og_image" value={form.og_image}
                    placeholder="https://… или /blog/xxx.jpg (1200×630)"
                    onChange={(e) => setForm({ ...form, og_image: e.target.value })}
                  />
                </div>
              </div>

              <details className="rounded-md border p-3">
                <summary className="text-sm font-medium cursor-pointer select-none">SEO для английской версии</summary>
                <div className="grid gap-3 mt-3">
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="seo_title_en">SEO title (EN)</Label>
                      <span className="text-xs text-muted-foreground tabular-nums">{form.seo_title_en.length}/60</span>
                    </div>
                    <Input
                      id="seo_title_en" maxLength={80} value={form.seo_title_en}
                      onChange={(e) => setForm({ ...form, seo_title_en: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="seo_description_en">Meta description (EN)</Label>
                      <span className="text-xs text-muted-foreground tabular-nums">{form.seo_description_en.length}/160</span>
                    </div>
                    <Textarea
                      id="seo_description_en" rows={2} maxLength={200} value={form.seo_description_en}
                      onChange={(e) => setForm({ ...form, seo_description_en: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="og_image_en">og:image URL (EN)</Label>
                    <Input
                      id="og_image_en" value={form.og_image_en}
                      onChange={(e) => setForm({ ...form, og_image_en: e.target.value })}
                    />
                  </div>
                </div>
              </details>

              {(form.seo_title || form.title) && (
                <div className="rounded-md border bg-muted/30 p-3">
                  <div className="text-xs text-muted-foreground mb-1">Превью в поиске</div>
                  <div className="text-[13px] text-emerald-700 truncate">unvrsm.ru › blog › {form.slug || "…"}</div>
                  <div className="text-[17px] leading-snug text-primary truncate">
                    {form.seo_title || form.title}
                  </div>
                  <div className="text-sm text-muted-foreground line-clamp-2">
                    {form.seo_description || form.excerpt}
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(false)}>Отмена</Button>
            <Button onClick={save}>{editing ? "Сохранить" : "Создать"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showLogsDialog} onOpenChange={setShowLogsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Лог попыток публикации в Дзен</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[400px] mt-4 rounded-md border p-4">
            <div className="space-y-4">
              {zenLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">История пуста</p>
              ) : (
                zenLogs.map((log) => (
                  <div key={log.id} className="text-sm border-b pb-3 last:border-0">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium truncate max-w-[300px]" title={log.blog_posts?.title}>
                        {log.blog_posts?.title || "Удаленная статья"}
                      </span>
                      <Badge variant={log.status === 'success' ? 'default' : log.status === 'error' ? 'destructive' : 'secondary'}>
                        {log.status === 'success' ? 'Успех' : log.status === 'error' ? 'Ошибка' : 'В процессе'}
                      </Badge>
                    </div>
                    <div className="flex gap-2 text-xs text-muted-foreground mb-1">
                      <span>{format(new Date(log.created_at), "dd MMMM yyyy, HH:mm", { locale: ru })}</span>
                    </div>
                    {log.error_message && (
                      <p className="text-xs text-destructive bg-destructive/5 p-2 rounded mt-1 font-mono">
                        {log.error_message}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>


      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить статью?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие необратимо. Статья исчезнет из блога, RSS и sitemap.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={remove}>Удалить</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Dialog open={zenDialogOpen} onOpenChange={setZenDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Интеграция с Яндекс Дзен</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="zenToken">Access Token (API Ключ)</Label>
              <Input 
                id="zenToken" 
                type="password" 
                value={zenTokenInput} 
                onChange={(e) => setZenTokenInput(e.target.value)} 
                placeholder="Введите ваш токен доступа Дзен"
              />
              <p className="text-xs text-muted-foreground">
                Получить токен можно в личном кабинете Дзена (раздел для разработчиков).
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="zenChannel">ID канала (Channel ID)</Label>
              <Input 
                id="zenChannel" 
                value={zenChannelInput} 
                onChange={(e) => setZenChannelInput(e.target.value)} 
                placeholder="ID вашего канала"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setZenDialogOpen(false)}>Отмена</Button>
            <Button onClick={saveZenConfig}>Сохранить настройки</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
