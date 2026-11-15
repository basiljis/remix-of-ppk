import { Link, useParams, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import LandingFooter from "@/components/LandingFooter";
import { PublicNavbar } from "@/components/PublicNavbar";
import { RelatedLinks, SITE_LINKS } from "@/components/seo/RelatedLinks";
import { useSeoMeta } from "@/hooks/useSeoMeta";
import { AlertTriangle, FileText, Scale, CalendarCheck } from "lucide-react";
import { EXTRA_GUIDES } from "@/data/extraGuides";

export default function GuidePage() {
  const { slug } = useParams();
  const g = EXTRA_GUIDES.find((x) => x.slug === slug);
  const url = `https://unvrsm.ru/guides/${slug}`;
  useSeoMeta({
    title: g?.seoTitle ?? "Руководство — universum.",
    description: g?.description ?? "",
    canonical: `/guides/${slug}`,
    keywords: g?.keywords,
    ogType: "article",
    jsonLd: g
      ? [
          { "@context": "https://schema.org", "@type": "Article", headline: g.h1, description: g.description, dateModified: g.reviewed, inLanguage: "ru-RU", mainEntityOfPage: url, author: { "@type": "Organization", name: "Редакция universum." } },
          { "@context": "https://schema.org", "@type": "HowTo", name: g.h1, step: g.steps.map((s, i) => ({ "@type": "HowToStep", position: i + 1, name: s.title, text: s.text })) },
          { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: g.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
          { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
            { "@type": "ListItem", position: 1, name: "Главная", item: "https://unvrsm.ru/" },
            { "@type": "ListItem", position: 2, name: "Блог", item: "https://unvrsm.ru/blog" },
            { "@type": "ListItem", position: 3, name: g.title, item: url },
          ] },
        ]
      : undefined,
  });
  if (!g) return <Navigate to="/blog" replace />;
  const reviewed = new Date(g.reviewed).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicNavbar currentPage="other" />
      <main className="pt-20">
        <section className="py-14 px-4">
          <div className="container mx-auto max-w-4xl">
            <nav className="text-sm text-muted-foreground mb-6" aria-label="Хлебные крошки">
              <Link to="/" className="hover:text-foreground">Главная</Link> / <Link to="/blog" className="hover:text-foreground">Блог</Link> / <span>{g.title}</span>
            </nav>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">{g.h1}</h1>
            <p className="text-lg text-muted-foreground mb-4">{g.lead}</p>
            <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarCheck className="h-4 w-4" /> Актуально на 2026/2027 учебный год · проверено редакцией {reviewed}
            </p>
          </div>
        </section>
        <section className="py-10 px-4 bg-muted/30">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><Scale className="h-6 w-6 text-primary" /> Правовое основание</h2>
            <ul className="space-y-3">{g.basis.map((b) => <li key={b} className="text-sm">{b}</li>)}</ul>
            <Link to="/legal" className="text-sm text-primary underline mt-4 inline-block">Открыть нормативно-правовую базу для специалистов</Link>
          </div>
        </section>
        <section className="py-10 px-4">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-2xl font-bold mb-6">Пошагово</h2>
            <div className="space-y-4">
              {g.steps.map((s) => (
                <Card key={s.title}><CardContent className="pt-6 flex gap-4">
                  <FileText className="h-5 w-5 text-primary shrink-0 mt-1" />
                  <div><h3 className="font-semibold mb-1">{s.title}</h3><p className="text-sm text-muted-foreground">{s.text}</p></div>
                </CardContent></Card>
              ))}
            </div>
          </div>
        </section>
        <section className="py-10 px-4 bg-muted/30">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-2xl font-bold mb-4">Типовые ошибки</h2>
            <ul className="space-y-3">{g.mistakes.map((m) => <li key={m} className="flex gap-3 text-sm"><AlertTriangle className="h-5 w-5 text-primary shrink-0" />{m}</li>)}</ul>
          </div>
        </section>
        <section className="py-10 px-4">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-2xl font-bold mb-4">Частые вопросы</h2>
            <Accordion type="single" collapsible>
              {g.faq.map((f, i) => (
                <AccordionItem key={i} value={`f${i}`}><AccordionTrigger className="text-left">{f.q}</AccordionTrigger><AccordionContent className="text-muted-foreground">{f.a}</AccordionContent></AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
        <RelatedLinks links={[SITE_LINKS.conclusion, SITE_LINKS.pmpk, SITE_LINKS.templates, SITE_LINKS.legal]} />
        <section className="py-14 px-4 bg-primary/5 text-center">
          <h2 className="text-2xl font-bold mb-4">Ведите документы ребёнка в одной карточке</h2>
          <Link to="/for-specialists"><Button size="lg">Попробовать universum. специалисту</Button></Link>
        </section>
      </main>
      <LandingFooter />
    </div>
  );
}
