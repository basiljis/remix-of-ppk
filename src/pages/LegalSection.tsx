import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { PublicNavbar } from "@/components/PublicNavbar";
import LandingFooter from "@/components/LandingFooter";
import { useSeoMeta } from "@/hooks/useSeoMeta";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ArrowLeft, ChevronDown, ChevronRight, ExternalLink, FileText, BookOpen, Eye, Users } from "lucide-react";
import { getLegalSection, legalSections } from "@/data/legalSections";
import { useLogLegalView, useLegalViewStats } from "@/hooks/useLegalViews";

export default function LegalSection() {
  const { sectionId = "" } = useParams<{ sectionId: string }>();
  const { hash } = useLocation();
  const section = getLegalSection(sectionId);
  useLogLegalView(section ? section.id : null);
  const { stats } = useLegalViewStats();
  const sectionStats = section ? stats[section.id] : undefined;

  useEffect(() => {
    if (!hash || !section) return;
    const target = document.getElementById(hash.slice(1));
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [hash, section]);

  useSeoMeta({
    title: section
      ? `${section.title} — нормативная база | universum.`
      : "Раздел не найден — нормативная база | universum.",
    description: section
      ? `${section.intro} Полный перечень документов раздела «${section.shortTitle}» со ссылками на официальные источники.`
      : "Запрошенный раздел нормативной базы не найден.",
    canonical: `/legal/${sectionId}`,
  });

  if (!section) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <PublicNavbar currentPage="legal" showSecondaryNav={false} />
        <main className="flex-1 pt-24 pb-16 px-4">
          <div className="container mx-auto max-w-4xl text-center py-16">
            <h1 className="text-2xl font-semibold mb-3">Раздел не найден</h1>
            <p className="text-muted-foreground mb-6">
              Возможно, ссылка устарела. Вернитесь к списку разделов нормативной базы.
            </p>
            <Button asChild>
              <Link to="/legal">
                <ArrowLeft className="h-4 w-4 mr-2" />
                К нормативной базе
              </Link>
            </Button>
          </div>
        </main>
        <LandingFooter />
      </div>
    );
  }

  const Icon = section.icon;
  const otherSections = legalSections.filter((s) => s.id !== section.id);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicNavbar currentPage="legal" showSecondaryNav={false} />

      <main className="flex-1 pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-4xl">
          {/* Breadcrumbs */}
          <nav className="text-sm text-muted-foreground mb-6 flex items-center gap-2 flex-wrap" aria-label="Хлебные крошки">
            <Link to="/legal" className="hover:text-primary inline-flex items-center gap-1">
              <ArrowLeft className="h-3.5 w-3.5" />
              Нормативная база
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-foreground">{section.shortTitle}</span>
          </nav>

          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <Icon className="h-6 w-6 text-primary" />
              <h1 className="text-3xl md:text-4xl font-bold">{section.title}</h1>
            </div>
            <p className="text-muted-foreground text-lg mb-4">{section.intro}</p>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Badge variant="outline" className="gap-1.5 font-normal">
                <Eye className="h-3.5 w-3.5 text-primary" />
                Просмотров: <span className="font-semibold">{(sectionStats?.total_views ?? 0).toLocaleString("ru-RU")}</span>
              </Badge>
              <Badge variant="outline" className="gap-1.5 font-normal">
                <Users className="h-3.5 w-3.5 text-primary" />
                Уникальных посетителей: <span className="font-semibold">{(sectionStats?.unique_views ?? 0).toLocaleString("ru-RU")}</span>
              </Badge>
            </div>
          </div>


          <div className="space-y-3 mb-12">
            {section.docs.map((doc, docIndex) => (
              <DocCard key={doc.title} doc={doc} id={`document-${docIndex + 1}`} />
            ))}
          </div>

          {/* Other sections */}
          <section aria-labelledby="other-sections" className="mt-12">
            <h2 id="other-sections" className="text-xl font-semibold mb-4">
              Другие разделы нормативной базы
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {otherSections.map((s) => {
                const SIcon = s.icon;
                return (
                  <Link
                    key={s.id}
                    to={`/legal/${s.id}`}
                    className="group block rounded-lg border border-border/60 bg-card p-4 hover:border-primary/60 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <SIcon className="h-4 w-4 text-primary" />
                      <span className="font-medium text-sm group-hover:text-primary">
                        {s.shortTitle}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{s.title}</p>
                  </Link>
                );
              })}
            </div>
          </section>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}

function DocCard({ doc, id }: { doc: import("@/data/legalSections").LegalDoc; id: string }) {
  const [open, setOpen] = useState(false);
  const hasExcerpts = !!doc.excerpts?.length;

  return (
    <Card id={id} className="border-border/60 scroll-mt-24">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <FileText className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
            <CardTitle className="text-base leading-snug">
              <a
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors inline-flex items-start gap-1"
              >
                <span>{doc.title}</span>
                <ExternalLink className="h-3.5 w-3.5 mt-1 flex-shrink-0 opacity-60" />
              </a>
            </CardTitle>
          </div>
          {doc.badge && (
            <Badge variant="secondary" className="flex-shrink-0 text-xs">
              {doc.badge}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0 pl-12">
        {doc.meta && <p className="text-xs text-muted-foreground mb-1">{doc.meta}</p>}
        <p className="text-sm text-muted-foreground">{doc.description}</p>

        <Button asChild variant="outline" size="sm" className="mt-3 h-8 gap-2 text-xs">
          <a href={doc.url} target="_blank" rel="noopener noreferrer">
            Исходник документа
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </Button>

        {hasExcerpts && (
          <Collapsible open={open} onOpenChange={setOpen} className="mt-3">
            <CollapsibleTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-2 text-xs"
                aria-expanded={open}
              >
                <BookOpen className="h-3.5 w-3.5" />
                {open ? "Скрыть выдержки" : "Показать выдержки, применимые к системе"}
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3 space-y-3">
              {doc.excerpts?.map((ex) => (
                <div
                  key={ex.label}
                  className="rounded-md border border-border/60 bg-muted/30 p-3"
                >
                  <p className="text-xs font-medium text-foreground mb-2">{ex.label}</p>
                  <blockquote className="text-sm text-muted-foreground italic border-l-2 border-primary/40 pl-3 mb-2">
                    {ex.text}
                  </blockquote>
                  <p className="text-xs text-foreground/80">
                    <span className="font-medium text-primary">Как применяется в universum.:</span>{" "}
                    {ex.applies}
                  </p>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
}
