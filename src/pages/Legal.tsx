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
  Clock,
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
  type LegalAudience,
} from "@/data/legalSections";
import { useLogLegalView, useLegalViewStats } from "@/hooks/useLegalViews";
import { LegalSubscriptionForm } from "@/components/LegalSubscriptionForm";
import { LegalUpdatesHistory } from "@/components/LegalUpdatesHistory";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function matchesQuery(doc: LegalDoc, q: string, audience: string): boolean {
  const term = q.trim().toLowerCase();
  const audienceMatch = audience === "all" || (doc.audiences?.includes(audience as LegalAudience) ?? true);
  
  if (!audienceMatch) return false;

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
  const [activeAudience, setActiveAudience] = useState<"all" | LegalAudience>("all");
  useLogLegalView(null);
  const { stats, totals } = useLegalViewStats();

  useSeoMeta({
    title: "Нормативно-правовая база — законы и стандарты | universum.",
    description:
      "Перечень нормативных документов, на основании которых работает платформа universum.: ФЗ-273, ФЗ-152, Приказ ДОНМ № 666, ФГОС, СанПиН, требования ФСТЭК и ФСБ. Ссылки на официальные источники.",
    canonical: "/legal",
    keywords:
      "нормативно-правовая база, ФЗ-152, ФЗ-273, Приказ 666 ДОНМ, ППк, ПМПК, ФГОС ОВЗ, СанПиН, ФСТЭК, защита персональных данных",
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Главная",
            "item": "https://unvrsm.ru/"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Нормативная база",
            "item": "https://unvrsm.ru/legal"
          }
        ]
      }
    ]
  });

  const filteredSections = useMemo(() => {
    const q = query.trim().toLowerCase();
    
    let base = legalSections;
    if (activeTab !== "all" && activeTab !== "history") {
      base = legalSections.filter(s => s.id === activeTab);
    }

    return base
      .map((section) => {
        const matchedDocs = section.docs.filter((doc) => matchesQuery(doc, q, activeAudience));

        if (matchedDocs.length > 0) return { ...section, docs: matchedDocs };
        return null;
      })
      .filter((s): s is LegalSection => s !== null);
  }, [query, activeTab, activeAudience]);

  const totalDocs = filteredSections.reduce((sum, s) => sum + s.docs.length, 0);
  const hasQuery = query.trim().length > 0;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicNavbar currentPage="legal" showSecondaryNav={false} />

      <main className="flex-1 pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div className="max-w-2xl">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">
                Нормативная база
              </h1>
              <p className="text-muted-foreground text-sm md:text-base">
                Регламенты, законы и стандарты платформы universum., соответствующие ФЗ-152, ФЗ-273 и приказам ДОНМ.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Визиты</span>
                <span className="text-lg font-mono font-bold text-primary leading-none">
                  {totals.total.toLocaleString("ru-RU")}
                </span>
              </div>
              <Separator orientation="vertical" className="h-8" />
              <div className="flex flex-col items-end">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Уникальные</span>
                <span className="text-lg font-mono font-bold text-primary leading-none">
                  {totals.unique.toLocaleString("ru-RU")}
                </span>
              </div>
            </div>
          </div>

          <div className="max-w-xl mx-auto">
            <LegalSubscriptionForm />
          </div>
          
          <Separator className="my-8 opacity-50" />

          <div className="flex flex-col gap-6">
            {/* Toolbar: Tabs, Filters, Search */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <Tabs 
                defaultValue="all" 
                value={activeTab} 
                onValueChange={setActiveTab} 
                className="w-full lg:w-auto"
              >
                <TabsList className="h-9 p-0.5 bg-muted/40 w-full lg:w-auto overflow-x-auto overflow-y-hidden flex-nowrap whitespace-nowrap justify-start lg:justify-center">
                  <TabsTrigger value="all" className="text-xs h-8 px-3">Все</TabsTrigger>
                  <TabsTrigger value="federal" className="text-xs h-8 px-3 gap-1.5">
                    <Scale className="h-3 w-3" /> Законы
                  </TabsTrigger>
                  <TabsTrigger value="donm" className="text-xs h-8 px-3 gap-1.5">
                    <BookOpen className="h-3 w-3" /> Приказы
                  </TabsTrigger>
                  <TabsTrigger value="recommendations" className="text-xs h-8 px-3 gap-1.5">
                    <Clock className="h-3 w-3" /> Нормы
                  </TabsTrigger>
                  <TabsTrigger value="history" className="text-xs h-8 px-3 gap-1.5">
                    <History className="h-3 w-3" /> Журнал
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                <div className="flex p-0.5 bg-muted/40 rounded-lg w-full sm:w-auto overflow-x-auto whitespace-nowrap scrollbar-none">
                  {[
                    { id: "all", label: "Все" },
                    { id: "parents", label: "Родителям" },
                    { id: "admin", label: "Админ" },
                    { id: "specialists", label: "Педагогам" }
                  ].map((aud) => (
                    <button
                      key={aud.id}
                      onClick={() => setActiveAudience(aud.id as any)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                        activeAudience === aud.id 
                          ? "bg-primary text-primary-foreground shadow-sm" 
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                      }`}
                    >
                      {aud.label}
                    </button>
                  ))}
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                  <Input
                    type="text"
                    placeholder="Поиск..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="pl-8 pr-8 h-9 text-sm rounded-lg"
                  />
                  {hasQuery && (
                    <button
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setQuery("")}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>

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
                        <section key={section.id} id={section.id} className="mb-10 scroll-mt-24">
                          <div className="flex items-center justify-between gap-3 mb-6 border-b border-border/40 pb-2">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 rounded-md bg-primary/10">
                                <Icon className="h-4 w-4 text-primary" />
                              </div>
                              <h2 className="text-xl font-bold">{section.title}</h2>
                              <Badge variant="outline" className="ml-2 h-5 text-[10px] font-medium border-primary/20 bg-primary/5">
                                {section.docs.length}
                              </Badge>
                            </div>
                            <Button asChild variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground hover:text-primary">
                              <Link to={`/legal/${section.id}`}>
                                Подробнее <ChevronRight className="h-3 w-3 ml-1" />
                              </Link>
                            </Button>
                          </div>
                          {/* section.intro excluded for brevity as requested by "loconic" look */}

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {section.docs.map((doc) => (
                              <Card key={doc.title} className="group border-border/40 hover:border-primary/30 transition-all shadow-sm hover:shadow-md bg-card/50">
                                <CardHeader className="p-4 pb-2">
                                  <div className="flex flex-col gap-2">
                                    <div className="flex justify-between items-start">
                                      {doc.badge ? (
                                        <Badge variant="secondary" className="text-[10px] h-4 px-1.5 uppercase tracking-wider font-bold">
                                          {doc.badge}
                                        </Badge>
                                      ) : <div className="h-4" />}
                                      <a
                                        href={doc.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-muted-foreground hover:text-primary transition-colors p-1"
                                      >
                                        <ExternalLink className="h-3.5 w-3.5" />
                                      </a>
                                    </div>
                                    <CardTitle className="text-sm font-semibold leading-tight group-hover:text-primary transition-colors line-clamp-2 min-h-[2.5rem]">
                                      {doc.title}
                                    </CardTitle>
                                  </div>
                                </CardHeader>
                                <CardContent className="p-4 pt-0 space-y-3">
                                  <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                                    {doc.description}
                                  </p>
                                  
                                  <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-border/40 mt-auto">
                                    {doc.audiences && (
                                      <div className="flex -space-x-1">
                                        {doc.audiences.includes("parents") && (
                                          <div title="Родителям" className="w-5 h-5 rounded-full bg-orange-100 border border-background flex items-center justify-center"><Users className="w-2.5 h-2.5 text-orange-600" /></div>
                                        )}
                                        {doc.audiences.includes("admin") && (
                                          <div title="Администрации" className="w-5 h-5 rounded-full bg-blue-100 border border-background flex items-center justify-center"><Shield className="w-2.5 h-2.5 text-blue-600" /></div>
                                        )}
                                        {doc.audiences.includes("specialists") && (
                                          <div title="Педагогам" className="w-5 h-5 rounded-full bg-green-100 border border-background flex items-center justify-center"><GraduationCap className="w-2.5 h-2.5 text-green-600" /></div>
                                        )}
                                      </div>
                                    )}
                                    {doc.meta && (
                                      <span className="text-[10px] text-muted-foreground font-medium uppercase truncate max-w-[100px]">
                                        {doc.meta}
                                      </span>
                                    )}
                                  </div>
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
        </div>

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
