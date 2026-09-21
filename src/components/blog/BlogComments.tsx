import { useEffect, useMemo, useState, FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, ShieldCheck, ThumbsUp, Trophy } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

interface Comment {
  id: string;
  post_id: string;
  parent_id: string | null;
  author_name: string;
  content: string;
  is_author_reply: boolean;
  created_at: string;
}

const commentSchema = z.object({
  author_name: z.string().trim().min(1, "min").max(100, "max"),
  author_email: z.string().trim().email("email").max(255).or(z.literal("")).optional(),
  content: z.string().trim().min(2, "min").max(4000, "max"),
});

interface Props {
  postId: string;
  isEn?: boolean;
}

const L = (isEn: boolean) => ({
  title: isEn ? "Comments" : "Комментарии",
  none: isEn ? "Be the first to comment." : "Будьте первым, кто оставит комментарий.",
  addTitle: isEn ? "Leave a comment" : "Оставить комментарий",
  name: isEn ? "Name" : "Имя",
  email: isEn ? "Email (optional, hidden)" : "Email (необязательно, скрыт)",
  message: isEn ? "Your comment" : "Ваш комментарий",
  submit: isEn ? "Send" : "Отправить",
  moderation: isEn
    ? "Comments are pre-moderated before publication."
    : "Комментарии проходят предварительную модерацию перед публикацией.",
  thanks: isEn
    ? "Thank you! Your comment was sent for moderation."
    : "Спасибо! Комментарий отправлен на модерацию.",
  error: isEn ? "Failed to send comment" : "Не удалось отправить комментарий",
  reply: isEn ? "Reply" : "Ответить",
  author: isEn ? "Author" : "Автор",
  cancel: isEn ? "Cancel" : "Отмена",
  helpful: isEn ? "Helpful" : "Полезно",
  topComments: isEn ? "Top comments" : "Лучшие комментарии",
  likeError: isEn ? "Failed to save vote" : "Не удалось сохранить оценку",
});

function getVisitorId(): string {
  const KEY = "blog_visitor_id";
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`);
    localStorage.setItem(KEY, id);
  }
  return id;
}

export default function BlogComments({ postId, isEn = false }: Props) {
  const labels = L(isEn);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [likedByMe, setLikedByMe] = useState<Set<string>>(new Set());
  const [likeBusy, setLikeBusy] = useState<string | null>(null);
  const visitorId = useMemo(() => (typeof window !== "undefined" ? getVisitorId() : ""), []);

  async function loadLikes(ids: string[]) {
    if (ids.length === 0) return;
    const { data } = await (supabase as any)
      .from("blog_comment_likes")
      .select("comment_id, visitor_id")
      .in("comment_id", ids);
    const counts: Record<string, number> = {};
    const mine = new Set<string>();
    (data || []).forEach((row: any) => {
      counts[row.comment_id] = (counts[row.comment_id] || 0) + 1;
      if (row.visitor_id === visitorId) mine.add(row.comment_id);
    });
    setLikeCounts(counts);
    setLikedByMe(mine);
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .rpc("get_approved_blog_comments", { p_post_id: postId });
      if (!cancelled) {
        if (!error && data) {
          setComments(data as Comment[]);
          loadLikes((data as Comment[]).map((c) => c.id));
        }
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [postId]);

  const roots = comments.filter((c) => !c.parent_id);
  const childrenOf = (id: string) => comments.filter((c) => c.parent_id === id);

  const topComments = useMemo(() => {
    return [...comments]
      .filter((c) => (likeCounts[c.id] || 0) > 0)
      .sort((a, b) => (likeCounts[b.id] || 0) - (likeCounts[a.id] || 0))
      .slice(0, 3);
  }, [comments, likeCounts]);

  async function toggleLike(commentId: string) {
    if (likeBusy) return;
    setLikeBusy(commentId);
    const alreadyLiked = likedByMe.has(commentId);
    // optimistic
    setLikeCounts((prev) => ({ ...prev, [commentId]: Math.max(0, (prev[commentId] || 0) + (alreadyLiked ? -1 : 1)) }));
    setLikedByMe((prev) => {
      const next = new Set(prev);
      if (alreadyLiked) next.delete(commentId); else next.add(commentId);
      return next;
    });

    const { data: sessionData } = await supabase.auth.getSession();
    const uid = sessionData.session?.user?.id ?? null;

    if (alreadyLiked) {
      const { error } = await (supabase as any)
        .from("blog_comment_likes")
        .delete()
        .eq("comment_id", commentId)
        .eq("visitor_id", visitorId);
      if (error) {
        toast.error(labels.likeError);
        loadLikes(comments.map((c) => c.id));
      }
    } else {
      const { error } = await (supabase as any)
        .from("blog_comment_likes")
        .insert({ comment_id: commentId, visitor_id: visitorId, user_id: uid });
      if (error) {
        toast.error(labels.likeError);
        loadLikes(comments.map((c) => c.id));
      }
    }
    setLikeBusy(null);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    const parsed = commentSchema.safeParse({ author_name: name, author_email: email, content });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message === "email"
        ? (isEn ? "Invalid email" : "Некорректный email")
        : (isEn ? "Please fill in name and comment" : "Заполните имя и текст"));
      return;
    }
    setSubmitting(true);
    const { data: sessionData } = await supabase.auth.getSession();
    const uid = sessionData.session?.user?.id ?? null;
    const { error } = await (supabase as any).from("blog_comments").insert({
      post_id: postId,
      parent_id: replyTo?.id ?? null,
      author_name: parsed.data.author_name,
      author_email: parsed.data.author_email || null,
      content: parsed.data.content,
      status: "pending",
      user_id: uid,
    });
    setSubmitting(false);
    if (error) {
      toast.error(labels.error);
      return;
    }
    toast.success(labels.thanks);
    setName(""); setEmail(""); setContent(""); setReplyTo(null);
  }

  const LikeButton = ({ c }: { c: Comment }) => {
    const count = likeCounts[c.id] || 0;
    const liked = likedByMe.has(c.id);
    return (
      <Button
        type="button"
        size="sm"
        variant={liked ? "secondary" : "ghost"}
        className="h-8 px-2 text-xs gap-1"
        disabled={likeBusy === c.id}
        onClick={() => toggleLike(c.id)}
        aria-pressed={liked}
      >
        <ThumbsUp className={`h-3.5 w-3.5 ${liked ? "fill-current" : ""}`} />
        {labels.helpful}
        {count > 0 && <span className="ml-1 font-semibold">{count}</span>}
      </Button>
    );
  };

  const renderOne = (c: Comment, depth = 0) => {
    const indentDepth = Math.min(depth, 4);
    return (
      <div
        key={c.id}
        className={depth ? "border-l pl-3 md:pl-4 mt-2" : ""}
        style={depth ? { marginLeft: `${indentDepth * (window.innerWidth < 768 ? 12 : 20)}px` } : undefined}
      >
        <Card className={c.is_author_reply ? "border-primary/40 bg-primary/5" : ""}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1.5 text-sm flex-wrap">
              <span className="font-semibold">{c.author_name}</span>
              {c.is_author_reply && (
                <Badge variant="secondary" className="gap-1"><ShieldCheck className="h-3 w-3" /> {labels.author}</Badge>
              )}
              {depth > 0 && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {isEn ? `Level ${depth + 1}` : `Уровень ${depth + 1}`}
                </Badge>
              )}
              <span className="text-xs text-muted-foreground ml-auto">
                {new Date(c.created_at).toLocaleDateString(isEn ? "en-US" : "ru-RU", {
                  year: "numeric", month: "short", day: "numeric",
                })}
              </span>
            </div>
            <div className="text-sm whitespace-pre-wrap leading-relaxed">{c.content}</div>
            <div className="mt-2 flex items-center gap-1 flex-wrap">
              <LikeButton c={c} />
              <Button
                size="sm" variant="ghost" className="h-8 px-2 text-xs"
                onClick={() => {
                  setReplyTo(c);
                  document.getElementById("blog-comment-form")?.scrollIntoView({ behavior: "smooth", block: "center" });
                }}
              >
                {labels.reply}
              </Button>
            </div>
          </CardContent>
        </Card>
        {childrenOf(c.id).map((ch) => renderOne(ch, depth + 1))}
      </div>
    );
  };

  return (
    <section className="mt-16 pt-10 border-t" id="comments">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <MessageSquare className="h-6 w-6" /> {labels.title}
        {comments.length > 0 && <span className="text-base font-normal text-muted-foreground">({comments.length})</span>}
      </h2>

      {topComments.length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-muted-foreground uppercase tracking-wide">
            <Trophy className="h-4 w-4 text-amber-500" /> {labels.topComments}
          </h3>
          <div className="grid gap-3 md:grid-cols-3">
            {topComments.map((c) => (
              <Card key={`top-${c.id}`} className="bg-amber-50/40 border-amber-200/60 dark:bg-amber-950/10">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1.5 text-xs">
                    <span className="font-semibold">{c.author_name}</span>
                    <span className="ml-auto flex items-center gap-1 text-amber-700 dark:text-amber-400 font-semibold">
                      <ThumbsUp className="h-3 w-3" /> {likeCounts[c.id] || 0}
                    </span>
                  </div>
                  <div className="text-sm line-clamp-4 whitespace-pre-wrap leading-relaxed">{c.content}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3 mb-8">
        {loading ? (
          <div className="text-sm text-muted-foreground">…</div>
        ) : roots.length === 0 ? (
          <div className="text-sm text-muted-foreground">{labels.none}</div>
        ) : (
          roots.map((c) => renderOne(c))
        )}
      </div>

      <Card id="blog-comment-form">
        <CardContent className="p-5 md:p-6">
          <h3 className="font-semibold mb-4">
            {labels.addTitle}
            {replyTo && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                → {replyTo.author_name}{" "}
                <button type="button" className="underline" onClick={() => setReplyTo(null)}>
                  ({labels.cancel})
                </button>
              </span>
            )}
          </h3>
          <form onSubmit={submit} className="space-y-3">
            <div className="grid md:grid-cols-2 gap-3">
              <Input
                placeholder={labels.name} value={name} onChange={(e) => setName(e.target.value)}
                maxLength={100} required
              />
              <Input
                type="email" placeholder={labels.email} value={email}
                onChange={(e) => setEmail(e.target.value)} maxLength={255}
              />
            </div>
            <Textarea
              placeholder={labels.message} value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4} maxLength={4000} required
            />
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="text-xs text-muted-foreground">{labels.moderation}</p>
              <Button type="submit" disabled={submitting} className="gap-2">
                <Send className="h-4 w-4" /> {labels.submit}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
