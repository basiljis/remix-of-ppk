import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { PublicNavbar } from "@/components/PublicNavbar";
import LandingFooter from "@/components/LandingFooter";
import { useSeoMeta } from "@/hooks/useSeoMeta";
import {
  ExternalLink,
  FileText,
  Search,
  X,
  ChevronRight,
  Eye,
  Users,
  Filter,
  Scale,
  BookOpen,
  Shield,
  GraduationCap,
  History,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  legalSections,
  type LegalDoc,
  type LegalSection,
} from "@/data/legalSections";
import { useLogLegalView, useLegalViewStats } from "@/hooks/useLegalViews";
import { LegalSubscriptionForm } from "@/components/LegalSubscriptionForm";
import { LegalUpdatesHistory } from "@/components/LegalUpdatesHistory";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function matchesQuery(doc: LegalDoc, q: string): boolean {
  const term = q.trim().toLowerCase();
  return (
    doc.title.toLowerCase().includes(term) ||
    doc.description.toLowerCase().includes(term) ||
    (doc.meta?.toLowerCase().includes(term) ?? false) ||
    (doc.badge?.toLowerCase().includes(term) ?? false)
  );
}

export default function Legal() {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  useLogLegalView(null);
  const { stats, totals } = useLegalViewStats();

  useSeoMeta({
    title: "Нормативно-правовая база — законы и стандарты | universum.",
    description:
      "Перечень нормативных документов, на основании которых работает платформа universum.: ФЗ-273, ФЗ-152, Приказ ДОНМ № 666, ФГОС, СанПиН, требования ФСТЭК и ФСБ. Ссылки на официальные источники.",
    canonical: "/legal",
    keywords:
      "нормативно-правовая база, ФЗ-152, ФЗ-273, Приказ 666 ДОНМ, ППк, ПМПК, ФГОС ОВЗ, СанПиН, ФСТЭК, защита персональных данных",
  });

  const filteredSections = useMemo(() => {
    const q = query.trim().toLowerCase();
    
    let base = legalSections;
    if (activeTab !== "all" && activeTab !== "history") {
      base = legalSections.filter(s => s.id === activeTab);
    }

    if (!q) return base;

    return base
      .map((section) => {
        const sectionMatch =
          section.title.toLowerCase().includes(q) ||
          section.intro.toLowerCase().includes(q);
        const matchedDocs = section.docs.filter((doc) => matchesQuery(doc, q));

        if (sectionMatch) return section;
        if (matchedDocs.length > 0) return { ...section, docs: matchedDocs };
        return null;
      })
      .filter((s): s is LegalSection => s !== null);
  }, [query, activeTab]);

  const totalDocs = filteredSections.reduce((sum, s) => sum + s.docs.length, 0);
  const hasQuery = query.trim().length > 0;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicNavbar currentPage="legal" showSecondaryNav={false} />

      <main className="flex-1 pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-10">
            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              Нормативно-правовая база
            </h1>
            <p className="text-muted-foreground text-lg mb-4">
              Перечень федеральных законов, ведомственных приказов и стандартов,
              на основании которых разработана и эксплуатируется платформа universum.
            </p>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Badge variant="outline" className="gap-1.5 font-normal">
                <Eye className="h-3.5 w-3.5 text-primary" />
                Всего просмотров: <span className="font-semibold">{totals.total.toLocaleString("ru-RU")}</span>
              </Badge>
              <Badge variant="outline" className="gap-1.5 font-normal">
                <Users className="h-3.5 w-3.5 text-primary" />
                Уникальных: <span className="font-semibold">{totals.unique.toLocaleString("ru-RU")}</span>
              </Badge>
            </div>
          </div>

          <LegalSubscriptionForm />
          
          <Separator className="my-10" />

          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <TabsList className="h-auto p-1 flex-wrap justify-start bg-muted/50">
                <TabsTrigger value="all" className="py-2 px-4">Все документы</TabsTrigger>
                <TabsTrigger value="federal" className="py-2 px-4 gap-2">
                  <Scale className="h-3.5 w-3.5" /> Законы
                </TabsTrigger>
                <TabsTrigger value="donm" className="py-2 px-4 gap-2">
                  <BookOpen className="h-3.5 w-3.5" /> Приказы
                </TabsTrigger>
                <TabsTrigger value="history" className="py-2 px-4 gap-2">
                  <History className="h-3.5 w-3.5" /> Журнал изменений
                </TabsTrigger>
              </TabsList>

              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="text"
                  placeholder="Поиск по документам…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-9 pr-10 h-10"
                />
                {hasQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setQuery("")}
                    aria-label="Очистить поиск"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <TabsContent value="history" className="mt-0">
              <LegalUpdatesHistory />
            </TabsContent>

            <TabsContent value={activeTab} className="mt-0">
              {activeTab !== "history" && (
                <>
                  {hasQuery && (
                    <p className="mb-6 text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg flex items-center gap-2">
                      <Filter className="h-4 w-4 text-primary" />
                      Найдено {totalDocs}{" "}
                      {totalDocs === 1
                        ? "документ"
                        : totalDocs >= 2 && totalDocs <= 4
                        ? "документа"
                        : "документов"}{" "}
                      в {filteredSections.length}{" "}
                      {filteredSections.length === 1 ? "разделе" : "разделах"}
                    </p>
                  )}

                  {filteredSections.length === 0 ? (
                    <div className="text-center py-16">
                      <Search className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground text-lg mb-2">
                        По запросу «{query.trim()}» ничего не найдено
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Попробуйте изменить запрос или сбросить фильтр
                      </p>
                      <Button variant="outline" className="mt-4" onClick={() => { setQuery(""); setActiveTab("all"); }}>
                        Сбросить фильтры
                      </Button>
                    </div>
                  ) : (
                    filteredSections.map((section, idx) => {
                      const Icon = section.icon;
                      return (
                        <section key={section.id} id={section.id} className="mb-12 scroll-mt-24">
                          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                            <div className="flex items-center gap-2">
                              <Icon className="h-5 w-5 text-primary" />
                              <h2 className="text-2xl font-semibold">{section.title}</h2>
                            </div>
                            <Button asChild variant="outline" size="sm">
                              <Link to={`/legal/${section.id}`}>
                                Открыть раздел
                                <ChevronRight className="h-3.5 w-3.5 ml-1" />
                              </Link>
                            </Button>
                          </div>
                          <p className="text-muted-foreground mb-6">{section.intro}</p>

                          <div className="space-y-3">
                            {section.docs.map((doc) => (
                              <Card key={doc.title} className="border-border/60">
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
                                  {doc.meta && (
                                    <p className="text-xs text-muted-foreground mb-1">{doc.meta}</p>
                                  )}
                                  <p className="text-sm text-muted-foreground">{doc.description}</p>
                                </CardContent>
                              </Card>
                            ))}
                          </div>

                          {idx < filteredSections.length - 1 && <Separator className="mt-12" />}
                        </section>
                      );
                    })
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>

          <Card className="border-border/60 bg-muted/30 mt-8">
            <CardContent className="py-5 px-5">
              <p className="text-sm text-muted-foreground">
                Ссылки на нормативные документы ведут на официальные источники
                (КонсультантПлюс, Официальный интернет-портал правовой информации,
                сайты профильных ведомств). Актуальные редакции документов
                могут отличаться — пользуйтесь датой обращения и проверяйте
                действующую редакцию на момент применения.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
