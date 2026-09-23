import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import LandingFooter from "@/components/LandingFooter";
import { PublicNavbar } from "@/components/PublicNavbar";
import { RelatedLinks, SITE_LINKS } from "@/components/seo/RelatedLinks";
import { useSeoMeta } from "@/hooks/useSeoMeta";
import { Download, FileText, ShieldCheck, ArrowRight } from "lucide-react";

interface TemplateItem {
  title: string;
  description: string;
  file: string;
  audience: string;
  guide?: { to: string; label: string };
}

const templates: TemplateItem[] = [
  {
    title: "Согласие родителя на обследование ППк",
    description:
      "Бланк письменного согласия законного представителя на психолого-педагогическое обследование ребёнка специалистами консилиума.",
    file: "/downloads/soglasie-na-obsledovanie-ppk.txt",
    audience: "Организациям",
  },
  {
    title: "Протокол заседания ППк",
    description:
      "Форма протокола с обязательными реквизитами: повестка, состав участников, ход заседания, решения, сроки и ответственные.",
    file: "/downloads/protokol-zasedaniya-ppk.txt",
    audience: "Организациям",
    guide: { to: "/guides/ppk-protocol", label: "Как вести протокол" },
  },
  {
    title: "Коллегиальное заключение ППк",
    description:
      "Шаблон итогового документа консилиума: причина обращения, результаты специалистов, коллегиальный вывод и рекомендации.",
    file: "/downloads/kollegialnoe-zaklyuchenie-ppk.txt",
    audience: "Специалистам",
    guide: { to: "/guides/ppk-conclusion", label: "Как оформить заключение" },
  },
  {
    title: "Представление специалиста на ППк",
    description:
      "Бланк представления педагога-психолога, логопеда или дефектолога: методики, актуальное состояние, вывод и направления работы.",
    file: "/downloads/predstavlenie-specialista-na-ppk.txt",
    audience: "Специалистам",
  },
  {
    title: "Чек-лист подготовки к ПМПК",
    description:
      "Полный перечень документов и шагов для прохождения комиссии, включая подготовку ребёнка и права родителя.",
    file: "/downloads/cheklist-podgotovki-k-pmpk.txt",
    audience: "Родителям",
    guide: { to: "/guides/pmpk-preparation", label: "Гайд по ПМПК" },
  },
];

const faq = [
  {
    q: "Можно ли использовать эти бланки в своей организации?",
    a: "Да, бланки бесплатны и не требуют указания источника. Это шаблоны: перед применением приведите их в соответствие с положением о ППк и номенклатурой дел вашей организации.",
  },
  {
    q: "Есть ли утверждённая федеральная форма заключения ППк?",
    a: "Единой обязательной федеральной формы нет. Организация утверждает формы документов собственным локальным актом на основе Распоряжения Минпросвещения России № Р-93 от 09.09.2019.",
  },
  {
    q: "В каком формате скачиваются шаблоны?",
    a: "Текстовый формат в кодировке UTF-8 — он открывается в любом редакторе (Word, Р7-Офис, МойОфис, Google Документы) и легко переносится на фирменный бланк организации.",
  },
  {
    q: "Как хранить заполненные документы?",
    a: "Заполненные бланки содержат специальные категории персональных данных. Хранение и передача должны соответствовать ФЗ-152: ограниченный доступ, защищённый контур, срок хранения по номенклатуре дел организации.",
  },
];

export default function Templates() {
  useSeoMeta({
    title: "Шаблоны документов ППк: бланки, протоколы, согласия — скачать бесплатно | universum.",
    description:
      "Бесплатные бланки для психолого-педагогического консилиума: согласие родителя, представление специалиста, протокол заседания, коллегиальное заключение, чек-лист ПМПК.",
    canonical: "/templates",
    keywords:
      "шаблоны документов ппк, бланк протокола ппк, образец заключения ппк, согласие на обследование ппк, представление специалиста на ппк, чек-лист пмпк скачать",
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "Шаблоны документов психолого-педагогического консилиума",
        itemListElement: templates.map((t, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: t.title,
          url: `https://unvrsm.ru${t.file}`,
        })),
      },
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faq.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
        })),
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Главная", item: "https://unvrsm.ru/" },
          { "@type": "ListItem", position: 2, name: "Шаблоны документов", item: "https://unvrsm.ru/templates" },
        ],
      },
    ],
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicNavbar currentPage="other" />

      <div className="pt-20">
        <section className="py-16 md:py-24 px-4">
          <div className="container mx-auto max-w-4xl">
            <nav className="text-sm text-muted-foreground mb-6" aria-label="Хлебные крошки">
              <Link to="/" className="hover:text-primary">Главная</Link>
              <span className="mx-2">/</span>
              <span className="text-foreground">Шаблоны документов</span>
            </nav>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
              <span className="text-primary">Шаблоны документов</span> ППк — скачать бесплатно
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8">
              Готовые бланки для работы психолого-педагогического консилиума: согласия, представления
              специалистов, протоколы заседаний, коллегиальные заключения и чек-лист подготовки к ПМПК.
              Без регистрации и оплаты.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="#templates">
                <Button size="lg">
                  Все бланки <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </a>
              <Link to="/legal">
                <Button size="lg" variant="outline">Нормативная база</Button>
              </Link>
            </div>
          </div>
        </section>

        <section id="templates" className="py-12 md:py-16 px-4 bg-muted/30 scroll-mt-24">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-2xl md:text-3xl font-bold mb-8">Бланки и чек-листы</h2>
            <div className="grid gap-4">
              {templates.map((t) => (
                <Card key={t.file}>
                  <CardHeader className="pb-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <CardTitle className="text-lg flex items-start gap-2">
                        <FileText className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        {t.title}
                      </CardTitle>
                      <Badge variant="secondary">{t.audience}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">{t.description}</p>
                    <div className="flex flex-wrap gap-2">
                      <a href={t.file} download>
                        <Button size="sm">
                          <Download className="mr-2 h-4 w-4" /> Скачать бланк
                        </Button>
                      </a>
                      {t.guide && (
                        <Link to={t.guide.to}>
                          <Button size="sm" variant="outline">
                            {t.guide.label}
                          </Button>
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-12 md:py-16 px-4">
          <div className="container mx-auto max-w-4xl">
            <Card className="border-primary/40 bg-primary/5">
              <CardContent className="pt-6 flex gap-3">
                <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <p className="text-sm">
                  Бланки носят шаблонный характер. Формы документов консилиума утверждаются локальным актом
                  образовательной организации на основе Распоряжения Минпросвещения России № Р-93 от 09.09.2019.
                  Заполненные документы содержат специальные категории персональных данных и защищаются по ФЗ-152.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="faq" className="py-12 md:py-16 px-4 bg-muted/30 scroll-mt-24">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-2xl md:text-3xl font-bold mb-6">Частые вопросы о бланках</h2>
            <Accordion type="single" collapsible className="w-full">
              {faq.map((item, i) => (
                <AccordionItem key={i} value={`item-${i}`}>
                  <AccordionTrigger className="text-left">{item.q}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        <RelatedLinks
          links={[SITE_LINKS.conclusion, SITE_LINKS.protocol, SITE_LINKS.pmpk, SITE_LINKS.workload]}
        />

        <section className="py-16 px-4 bg-primary/5">
          <div className="container mx-auto max-w-3xl text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Документы, которые заполняются сами</h2>
            <p className="text-muted-foreground mb-6">
              В universum. данные из карточки ребёнка автоматически подставляются в протоколы и заключения:
              меньше ручной работы, меньше ошибок, всё хранится в защищённом контуре.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link to="/for-organizations">
                <Button size="lg">Для школ и ППМС-центров</Button>
              </Link>
              <Link to="/for-specialists">
                <Button size="lg" variant="outline">Для специалистов</Button>
              </Link>
            </div>
          </div>
        </section>
      </div>

      <LandingFooter />
    </div>
  );
}
