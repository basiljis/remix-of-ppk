import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import LandingFooter from "@/components/LandingFooter";
import { PublicNavbar } from "@/components/PublicNavbar";
import { RelatedLinks, SITE_LINKS } from "@/components/seo/RelatedLinks";
import { useSeoMeta } from "@/hooks/useSeoMeta";
import { ArrowRight, CheckCircle2, Download, ListChecks, Clock } from "lucide-react";

const requisites = [
  "Наименование образовательной организации и номер протокола",
  "Дата, время и место проведения заседания",
  "Форма заседания: плановое или внеплановое",
  "Список присутствующих членов ППк с указанием должностей",
  "Сведения о приглашённых (родитель, классный руководитель, воспитатель)",
  "Повестка заседания с перечнем рассматриваемых вопросов",
  "Фамилия, имя, отчество ребёнка, дата рождения, класс или группа",
  "Краткое изложение выступлений специалистов",
  "Принятое решение по каждому вопросу повестки",
  "Сроки исполнения и ответственные за каждое решение",
  "Подписи председателя, секретаря и членов консилиума",
];

const agenda = [
  {
    icon: ListChecks,
    title: "Плановое заседание",
    text: "Проводится по графику (как правило, не реже одного раза в полугодие). Рассматривается динамика детей, находящихся на сопровождении, и итоги коррекционной работы за период.",
  },
  {
    icon: Clock,
    title: "Внеплановое заседание",
    text: "Созывается по запросу педагога, специалиста или родителя при появлении новых трудностей, резком изменении состояния или поведения ребёнка, а также при необходимости корректировки рекомендаций.",
  },
];

const faq = [
  {
    q: "Кто ведёт протокол заседания ППк?",
    a: "Протокол ведёт секретарь консилиума, назначенный приказом руководителя организации. Протокол подписывают председатель и секретарь, решения заверяются подписями членов ППк.",
  },
  {
    q: "Чем протокол отличается от заключения ППк?",
    a: "Протокол фиксирует ход заседания: кто присутствовал, что обсуждали, какие решения приняли. Заключение — итоговый документ по конкретному ребёнку с коллегиальными выводами и рекомендациями, копия которого выдаётся родителю.",
  },
  {
    q: "Нужно ли нумеровать протоколы?",
    a: "Да, протоколы нумеруются последовательно в пределах учебного года и подшиваются в отдельное дело согласно номенклатуре дел организации.",
  },
  {
    q: "Можно ли вести протокол в электронном виде?",
    a: "Можно, если это закреплено локальным актом организации и обеспечена защита персональных данных по ФЗ-152. При необходимости электронный протокол распечатывается и подписывается участниками.",
  },
  {
    q: "Сколько хранятся протоколы ППк?",
    a: "Срок хранения устанавливается номенклатурой дел организации. Для московских образовательных организаций ориентир — требования Приказа ДОНМ № 666: не менее 5 лет.",
  },
  {
    q: "Имеет ли родитель право получить копию протокола?",
    a: "Родителю выдаётся копия коллегиального заключения по его ребёнку. Протокол заседания содержит данные других детей, поэтому предоставляется только в виде выписки, касающейся его ребёнка.",
  },
];

export default function PpkProtocol() {
  useSeoMeta({
    title: "Протокол заседания ППк: образец и обязательные реквизиты 2026 — universum.",
    description:
      "Как правильно вести протокол психолого-педагогического консилиума: обязательные реквизиты, повестка, плановые и внеплановые заседания, хранение и бланк для скачивания.",
    canonical: "/guides/ppk-protocol",
    keywords:
      "протокол ппк, протокол ппк образец, протокол заседания консилиума, бланк протокола ппк, ведение документации ппк",
    ogType: "article",
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: "Протокол заседания ППк: образец и обязательные реквизиты",
        description:
          "Обязательные реквизиты протокола психолого-педагогического консилиума, порядок ведения и хранения.",
        author: { "@type": "Organization", name: "universum." },
        publisher: {
          "@type": "Organization",
          name: "universum.",
          logo: { "@type": "ImageObject", url: "https://unvrsm.ru/og-image.png" },
        },
        mainEntityOfPage: "https://unvrsm.ru/guides/ppk-protocol",
        inLanguage: "ru-RU",
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
          { "@type": "ListItem", position: 2, name: "Гайды", item: "https://unvrsm.ru/guides/pmpk-preparation" },
          { "@type": "ListItem", position: 3, name: "Протокол ППк", item: "https://unvrsm.ru/guides/ppk-protocol" },
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
              <span>Гайды</span>
              <span className="mx-2">/</span>
              <span className="text-foreground">Протокол ППк</span>
            </nav>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
              <span className="text-primary">Протокол заседания ППк</span>: образец и обязательные реквизиты
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8">
              Протокол — основной документ, подтверждающий, что консилиум состоялся и решения приняты
              коллегиально. Разбираем состав реквизитов, порядок ведения, отличие от заключения и правила
              хранения.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="#requisites">
                <Button size="lg">
                  Реквизиты протокола <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </a>
              <Link to="/templates">
                <Button size="lg" variant="outline">
                  <Download className="mr-2 h-4 w-4" /> Скачать бланк
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="py-12 md:py-16 px-4 bg-muted/30">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-2xl md:text-3xl font-bold mb-6">Два вида заседаний</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {agenda.map((a) => {
                const Icon = a.icon;
                return (
                  <Card key={a.title}>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Icon className="h-5 w-5 text-primary" />
                        {a.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">{a.text}</CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        <section id="requisites" className="py-12 md:py-16 px-4 scroll-mt-24">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Обязательные реквизиты протокола</h2>
            <p className="text-muted-foreground mb-6">
              Единой федеральной формы протокола нет: организация утверждает её локальным актом на основе
              Распоряжения Минпросвещения № Р-93. Ниже — набор реквизитов, который проверяют при контроле.
            </p>
            <Card>
              <CardContent className="pt-6">
                <ul className="space-y-3">
                  {requisites.map((r) => (
                    <li key={r} className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">{r}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="py-12 md:py-16 px-4 bg-muted/30">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-2xl md:text-3xl font-bold mb-6">Порядок ведения и хранения</h2>
            <div className="prose prose-slate max-w-none dark:prose-invert">
              <p>
                Протокол оформляется в течение нескольких рабочих дней после заседания — конкретный срок
                закрепляется положением о ППк. Протоколы нумеруются последовательно в пределах учебного года и
                формируются в отдельное дело.
              </p>
              <p>
                Протокол содержит специальные категории персональных данных, поэтому доступ к нему имеют только
                члены консилиума и уполномоченные сотрудники. Передача сведений третьим лицам возможна лишь с
                письменного согласия родителя (законного представителя) или по основаниям, прямо предусмотренным
                законом.
              </p>
            </div>
          </div>
        </section>

        <section id="faq" className="py-12 md:py-16 px-4 scroll-mt-24">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-2xl md:text-3xl font-bold mb-6">Частые вопросы</h2>
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
          links={[SITE_LINKS.conclusion, SITE_LINKS.workload, SITE_LINKS.templates, SITE_LINKS.legal]}
        />

        <section className="py-16 px-4 bg-primary/5">
          <div className="container mx-auto max-w-3xl text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Протоколы и заключения — в одном пространстве</h2>
            <p className="text-muted-foreground mb-6">
              universum. ведёт нумерацию протоколов, хранит историю заседаний по каждому ребёнку и напоминает о
              сроках повторного рассмотрения динамики.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link to="/for-organizations">
                <Button size="lg">Решение для школ и ППМС-центров</Button>
              </Link>
              <Link to="/blog">
                <Button size="lg" variant="outline">Читать блог</Button>
              </Link>
            </div>
          </div>
        </section>
      </div>

      <LandingFooter />
    </div>
  );
}
