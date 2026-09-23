import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import LandingFooter from "@/components/LandingFooter";
import { PublicNavbar } from "@/components/PublicNavbar";
import { RelatedLinks, SITE_LINKS } from "@/components/seo/RelatedLinks";
import { useSeoMeta } from "@/hooks/useSeoMeta";
import { ArrowRight, AlertCircle } from "lucide-react";

const lessonNorms = [
  { age: "Дети 1,5–3 лет", duration: "до 10 минут", note: "Индивидуально или в микрогруппе" },
  { age: "Дети 3–4 лет", duration: "до 15 минут", note: "Игровая форма, частая смена деятельности" },
  { age: "Дети 4–5 лет", duration: "до 20 минут", note: "Подгруппа до 6 человек" },
  { age: "Дети 5–6 лет", duration: "до 25 минут", note: "Подгруппа до 6 человек" },
  { age: "Дети 6–7 лет", duration: "до 30 минут", note: "Подготовка к школьному формату" },
  { age: "Школьники 1–4 классов", duration: "20–35 минут", note: "С учётом режима учебного дня" },
  { age: "Школьники 5–11 классов", duration: "30–45 минут", note: "Индивидуально или в группе" },
];

const workloadRoles = [
  {
    role: "Педагог-психолог",
    rate: "36 часов в неделю на ставку",
    split: "Ориентировочно половина времени — непосредственная работа с участниками образовательных отношений, остальное — подготовка, обработка результатов, документация, методическая и организационная работа.",
  },
  {
    role: "Учитель-логопед",
    rate: "20 часов в неделю на ставку",
    split: "Норма часов учебной (коррекционно-развивающей) работы; подготовка и ведение документации — сверх этой нормы в пределах рабочего времени.",
  },
  {
    role: "Учитель-дефектолог",
    rate: "20 часов в неделю на ставку",
    split: "Аналогично учителю-логопеду: норма относится к непосредственной коррекционно-развивающей работе с обучающимися.",
  },
  {
    role: "Социальный педагог",
    rate: "36 часов в неделю на ставку",
    split: "Профилактическая, посредническая и сопровождающая работа, взаимодействие с семьями и внешними организациями.",
  },
];

const faq = [
  {
    q: "Сколько длится занятие с педагогом-психологом в детском саду?",
    a: "Длительность привязана к возрастной норме непрерывной образовательной деятельности по СанПиН 1.2.3685-21: от 10 минут в раннем возрасте до 30 минут в подготовительной группе. Для индивидуальной работы длительность может быть меньше — по состоянию ребёнка.",
  },
  {
    q: "Какая норма часов у учителя-логопеда?",
    a: "Норма часов коррекционно-развивающей работы, за которую выплачивается ставка заработной платы, составляет 20 часов в неделю. Она установлена Приказом Минобрнауки России № 1601 от 22.12.2014.",
  },
  {
    q: "Сколько часов в неделю у педагога-психолога?",
    a: "Продолжительность рабочего времени педагога-психолога — 36 часов в неделю (Приказ Минобрнауки № 1601). Распределение между непосредственной работой с детьми и иной работой закрепляется локальным актом организации.",
  },
  {
    q: "Сколько детей может быть в коррекционной подгруппе?",
    a: "Обычно 2–6 человек в зависимости от возраста и характера нарушений. Точная численность закрепляется локальными актами и рекомендациями по реализации адаптированных программ.",
  },
  {
    q: "Кто утверждает график и циклограмму специалиста?",
    a: "Циклограмму рабочего времени и расписание занятий утверждает руководитель образовательной организации. Документ должен учитывать нормы СанПиН, режим дня и расписание уроков.",
  },
  {
    q: "Как считать нагрузку при работе в нескольких организациях?",
    a: "Каждая организация ведёт учёт рабочего времени отдельно; совместительство оформляется трудовым договором. Общая нагрузка не должна нарушать требования Трудового кодекса к режиму труда и отдыха.",
  },
];

export default function WorkloadNorms() {
  useSeoMeta({
    title: "Нормы часов и длительность занятий специалистов 2026: СанПиН и приказы — universum.",
    description:
      "Нормы рабочего времени педагога-психолога, учителя-логопеда и дефектолога, длительность занятий по возрастам, состав подгрупп и документация. Ссылки на действующие приказы и СанПиН.",
    canonical: "/guides/workload-norms",
    keywords:
      "нормы часов педагога-психолога, нагрузка учителя-логопеда, длительность занятий санпин, ставка дефектолога, приказ 1601, санпин 1.2.3685-21",
    ogType: "article",
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: "Нормы часов и длительность занятий специалистов сопровождения",
        description:
          "Нормы рабочего времени и длительности занятий педагога-психолога, логопеда и дефектолога.",
        author: { "@type": "Organization", name: "universum." },
        publisher: {
          "@type": "Organization",
          name: "universum.",
          logo: { "@type": "ImageObject", url: "https://unvrsm.ru/og-image.png" },
        },
        mainEntityOfPage: "https://unvrsm.ru/guides/workload-norms",
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
          { "@type": "ListItem", position: 3, name: "Нормы часов", item: "https://unvrsm.ru/guides/workload-norms" },
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
              <span className="text-foreground">Нормы часов</span>
            </nav>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
              <span className="text-primary">Нормы часов</span> и длительность занятий специалистов
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8">
              Сколько длится занятие в каждом возрасте, какая норма часов у педагога-психолога, логопеда и
              дефектолога, как распределяется рабочее время и что закрепляется локальными актами организации.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="#lesson-norms">
                <Button size="lg">
                  Длительность занятий <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </a>
              <Link to="/legal">
                <Button size="lg" variant="outline">Нормативная база</Button>
              </Link>
            </div>
          </div>
        </section>

        <section id="lesson-norms" className="py-12 md:py-16 px-4 bg-muted/30 scroll-mt-24">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Длительность занятий по возрастам</h2>
            <p className="text-muted-foreground mb-6">
              Ориентиры основаны на требованиях СанПиН 1.2.3685-21 к продолжительности непрерывной
              образовательной деятельности. Для индивидуальных коррекционных занятий длительность может быть
              сокращена с учётом состояния ребёнка.
            </p>
            <Card>
              <CardContent className="pt-6 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Возраст</TableHead>
                      <TableHead>Длительность</TableHead>
                      <TableHead className="hidden sm:table-cell">Комментарий</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lessonNorms.map((n) => (
                      <TableRow key={n.age}>
                        <TableCell className="font-medium">{n.age}</TableCell>
                        <TableCell>{n.duration}</TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground">{n.note}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="py-12 md:py-16 px-4">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-2xl md:text-3xl font-bold mb-6">Норма часов по должностям</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {workloadRoles.map((r) => (
                <Card key={r.role}>
                  <CardHeader>
                    <CardTitle className="text-lg">{r.role}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm font-medium text-primary">{r.rate}</p>
                    <p className="text-sm text-muted-foreground">{r.split}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Card className="mt-6 border-primary/40 bg-primary/5">
              <CardContent className="pt-6 flex gap-3">
                <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <p className="text-sm">
                  Нормы рабочего времени установлены Приказом Минобрнауки России № 1601 от 22.12.2014.
                  Конкретное распределение часов внутри ставки закрепляется локальным актом организации —
                  циклограммой рабочего времени. Перед применением сверяйтесь с действующей редакцией документа.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="py-12 md:py-16 px-4 bg-muted/30">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-2xl md:text-3xl font-bold mb-6">Что входит в рабочее время помимо занятий</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                "Диагностика и обработка результатов обследования",
                "Подготовка коллегиальных заключений и протоколов ППк",
                "Консультирование родителей и педагогов",
                "Участие в заседаниях консилиума и педсоветах",
                "Ведение журналов учёта работы и отчётности",
                "Методическая работа и повышение квалификации",
              ].map((item) => (
                <Card key={item}>
                  <CardContent className="pt-6">
                    <p className="text-sm">{item}</p>
                  </CardContent>
                </Card>
              ))}
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
          links={[SITE_LINKS.templates, SITE_LINKS.conclusion, SITE_LINKS.protocol, SITE_LINKS.forSpecialists]}
        />

        <section className="py-16 px-4 bg-primary/5">
          <div className="container mx-auto max-w-3xl text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Учёт занятий и нагрузки — автоматически</h2>
            <p className="text-muted-foreground mb-6">
              universum. ведёт журнал занятий, считает часы по каждому специалисту и формирует отчётность за
              период без ручных таблиц.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link to="/for-specialists">
                <Button size="lg">Специалистам</Button>
              </Link>
              <Link to="/pricing">
                <Button size="lg" variant="outline">Тарифы</Button>
              </Link>
            </div>
          </div>
        </section>
      </div>

      <LandingFooter />
    </div>
  );
}
