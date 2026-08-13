import type { BlogPost, BlogCategory } from "@/types/blog";
import { blogCategoryLabel } from "@/types/blog";

/**
 * Локальный генератор обложек для Яндекс Дзен.
 * 1200×630 — оптимальный размер для Дзена и OG-превью.
 * Работает полностью на canvas, без сетевых запросов — не зависит от CORS.
 */

const W = 1200;
const H = 630;

type Palette = { bgFrom: string; bgTo: string; accent: string; ink: string; sub: string };

const PALETTES: Record<BlogCategory, Palette> = {
  specialists: { bgFrom: "#0F2A44", bgTo: "#1E4C7A", accent: "#F59E0B", ink: "#FFFFFF", sub: "#BFD3E6" },
  admins:      { bgFrom: "#1B2432", bgTo: "#2E3D55", accent: "#38BDF8", ink: "#FFFFFF", sub: "#B7C4D6" },
  parents:     { bgFrom: "#2B1B3F", bgTo: "#4E2C6E", accent: "#FBBF24", ink: "#FFFFFF", sub: "#D5C4E4" },
  news:        { bgFrom: "#3B0A1E", bgTo: "#7A1436", accent: "#FDA4AF", ink: "#FFFFFF", sub: "#E7C3CE" },
};

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const w of words) {
    const test = current ? `${current} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = w;
      if (lines.length === maxLines - 1) break;
    } else {
      current = test;
    }
  }
  if (current && lines.length < maxLines) lines.push(current);
  // если ещё остались слова — добавим многоточие к последней строке
  if (lines.length === maxLines) {
    const joined = lines.join(" ");
    if (joined.split(/\s+/).length < words.length) {
      let last = lines[maxLines - 1];
      while (ctx.measureText(last + "…").width > maxWidth && last.length > 0) {
        last = last.slice(0, -1);
      }
      lines[maxLines - 1] = last + "…";
    }
  }
  return lines;
}

/** Рисует обложку и возвращает Blob (image/jpeg, качество 0.92). */
export async function renderZenCover(post: BlogPost): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context недоступен");

  const p = PALETTES[post.category] ?? PALETTES.news;

  // Фон: диагональный градиент
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, p.bgFrom);
  grad.addColorStop(1, p.bgTo);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Декоративные круги
  ctx.save();
  ctx.globalAlpha = 0.08;
  ctx.fillStyle = p.accent;
  ctx.beginPath(); ctx.arc(W - 120, 120, 220, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(W - 260, 260, 120, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 0.05;
  ctx.fillStyle = p.ink;
  ctx.beginPath(); ctx.arc(80, H - 80, 180, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // Акцентная полоса слева
  ctx.fillStyle = p.accent;
  ctx.fillRect(72, 96, 6, 96);

  // Категория (small caps)
  ctx.fillStyle = p.accent;
  ctx.font = "600 22px system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
  ctx.textBaseline = "top";
  ctx.fillText(blogCategoryLabel(post.category).toUpperCase(), 100, 100);

  // Wordmark universum.
  ctx.fillStyle = p.ink;
  ctx.font = "700 26px 'Georgia', 'Times New Roman', serif";
  ctx.textBaseline = "top";
  ctx.fillText("universum.", 100, 140);

  // Заголовок — крупно, до 4 строк
  ctx.fillStyle = p.ink;
  ctx.font = "800 64px 'Georgia', 'Times New Roman', serif";
  const titleLines = wrapText(ctx, post.title, W - 200, 4);
  const lineHeight = 76;
  let y = 240;
  for (const line of titleLines) {
    ctx.fillText(line, 100, y);
    y += lineHeight;
  }

  // Excerpt — до 2 строк, снизу
  if (post.excerpt) {
    ctx.fillStyle = p.sub;
    ctx.font = "400 24px system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
    const exLines = wrapText(ctx, post.excerpt, W - 260, 2);
    let ey = H - 130;
    for (const line of exLines) {
      ctx.fillText(line, 100, ey);
      ey += 32;
    }
  }

  // Правый нижний угол: домен
  ctx.fillStyle = p.accent;
  ctx.font = "600 20px system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
  const domain = "unvrsm.ru";
  const dw = ctx.measureText(domain).width;
  ctx.fillText(domain, W - 100 - dw, H - 60);

  // Тонкая рамка снизу
  ctx.strokeStyle = p.accent;
  ctx.globalAlpha = 0.4;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(100, H - 90);
  ctx.lineTo(W - 100, H - 90);
  ctx.stroke();
  ctx.globalAlpha = 1;

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("toBlob вернул null"))),
      "image/jpeg",
      0.92,
    );
  });
}

/** Инициирует скачивание сгенерированной обложки. */
export async function downloadZenCover(post: BlogPost): Promise<void> {
  const blob = await renderZenCover(post);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${post.slug}-cover.jpg`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
