import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import LandingFooter from "@/components/LandingFooter";
import { PublicNavbar } from "@/components/PublicNavbar";
import { RelatedLinks, SITE_LINKS } from "@/components/seo/RelatedLinks";
import { useSeoMeta } from "@/hooks/useSeoMeta";
import { FileText, ClipboardList, Users, ShieldCheck, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";

const documents = [
  "Заявление законного представителя о проведении обследования на ПМПК",
  "Согласие на обработку персональных данных ребёнка и родителя",
  "Копия свидетельства о рождении ребёнка (для детей до 14 лет) или паспорта",
  "Копия паспорта родителя (законного представителя) с пропиской",
  "Направление медицинской организации (при наличии)",
  "Заключения врачей-специалистов: невролог, психиатр, офтальмолог, оториноларинголог (по показаниям)",
  "Выписка из истории развития ребёнка (форма 112/у) или амбулаторной карты",
  "Педагогическая характеристика от образовательной организации",
  "Психологическая характеристика (при наличии — от педагога-психолога)",
  "Логопедическая характеристика (для детей с речевыми нарушениями)",
  "Письменные работы по русскому языку, математике, рисунки, тетради",
  "Заключение ППк образовательной организации (если проводился консилиум)",
  "Предыдущие заключения ПМПК (при наличии)",
];

const stages = [
  {
    icon: Users,
    title: "1. Обращение в ППк школы или сада",
    text: "Родитель или педагог инициирует психолого-педагогический консилиум (ППк) в образовательной организации. ППк — внутренний орган, который анализирует трудности ребёнка и решает, нужны ли внешние обследования.",
  },
  {
    icon: ClipboardList,
    title: "2. Заключение ППк с рекомендацией направить на ПМПК",
    text: "Если внутренних ресурсов недостаточно, ППк оформляет коллегиальное заключение с рекомендацией пройти ПМПК. Родитель получает копию под подпись.",
  },
  {
    icon: FileText,
    title: "3. Сбор пакета документов",
    text: "Родитель собирает медицинские, педагогические и психологические документы (см. чек-лист ниже). Часть характеристик готовят специалисты школы.",
  },
  {
    icon: ShieldCheck,
    title: "4. Запись и обследование на ПМПК",
    text: "Запись — через ЦПМПК региона или территориальную ПМПК. Обследование длится 1–2 часа, ребёнка смотрят психолог, дефектолог, логопед, врач-психиатр.",
  },
  {
    icon: CheckCircle2,
    title: "5. Получение заключения ПМПК",
    text: "Комиссия выдаёт коллегиальное заключение с рекомендациями по образовательной программе (АООП), условиям обучения и специалистам сопровождения. Действует до окончания уровня образования (или 1 год для ДОО).",
  },
];

const faq = [
  {
    q: "Чем ПМПК отличается от ППк?",
    a: "ППк (психолого-педагогический консилиум) — внутренний орган школы или детского сада, работает по Распоряжению Минпросвещения № Р-93. Определяет трудности ребёнка и адаптирует обучение внутри организации. ПМПК (психолого-медико-педагогическая комиссия) — внешний государственный орган, единственный имеющий право установить статус «ребёнок с ОВЗ», определить АООП и специальные условия обучения. Работает по Приказу Минобрнауки № 1082.",
  },
  {
    q: "Обязательно ли проходить ПМПК?",
    a: "Нет. Прохождение ПМПК — добровольное решение родителей (законных представителей). Без заключения ПМПК школа не может официально перевести ребёнка на адаптированную программу или организовать специальные условия по ФГОС ОВЗ, но и заставить пройти комиссию тоже не имеет права.",
  },
  {
    q: "Что даёт заключение ПМПК?",
    a: "Статус «ребёнок с ОВЗ», право на обучение по АООП, бесплатные занятия с логопедом/дефектологом/психологом в школе, увеличенное время на экзаменах (ОГЭ/ЕГЭ), тьютора или ассистента при необходимости, специальные учебники и технические средства.",
  },
  {
    q: "Сколько действует заключение ПМПК?",
    a: "Для дошкольников — обычно 1 год или до перехода в школу. Для школьников — до окончания уровня образования (начального, основного или среднего). При смене программы или условий обучения нужно проходить комиссию повторно.",
  },
  {
    q: "Можно ли отказаться от рекомендаций ПМПК?",
    a: "Да. Заключение носит рекомендательный характер для родителей. Но для образовательной организации оно обязательно к исполнению, если родители дали согласие на реализацию рекомендаций.",
  },
  {
    q: "Как оспорить заключение ПМПК?",
    a: "Можно подать заявление в вышестоящую комиссию (ЦПМПК субъекта РФ, если проходили территориальную) или обратиться в суд. Также родитель имеет право присутствовать на обследовании и получить копию протокола.",
  },
  {
    q: "Как подготовить ребёнка к ПМПК психологически?",
    a: "Объясните простыми словами, что специалисты будут играть и разговаривать, чтобы помочь ему в учёбе. Не пугайте комиссией и не заставляйте «учить ответы». Хорошо выспаться, поесть, взять любимую игрушку. Родитель имеет право находиться рядом.",
  },
];

export default function PmpkPreparation() {
  useSeoMeta({
    title: "Подготовка к ПМПК: документы, этапы, чек-лист 2026 — universum.",
    description: "Пошаговый гайд по подготовке к ПМПК: полный список документов, отличие от ППк, этапы обследования, права родителей и ответы на частые вопросы.",
    canonical: "/guides/pmpk-preparation",
    keywords: "пмпк, пмпк это, комиссия пмпк, подготовка к пмпк, документы на пмпк, ппк и пмпк отличия, овз, заключение пмпк",
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: "Подготовка к ПМПК: полный гайд для родителей и специалистов",
        description:
          "Как подготовиться к психолого-медико-педагогической комиссии: документы, этапы, отличия от ППк, права родителей.",
        author: { "@type": "Organization", name: "universum." },
        publisher: {
          "@type": "Organization",
          name: "universum.",
          logo: { "@type": "ImageObject", url: "https://unvrsm.ru/og-image.png" },
        },
        mainEntityOfPage: "https://unvrsm.ru/guides/pmpk-preparation",
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
          { "@type": "ListItem", position: 2, name: "Гайды", item: "https://unvrsm.ru/guides" },
          {
            "@type": "ListItem",
            position: 3,
            name: "Подготовка к ПМПК",
            item: "https://unvrsm.ru/guides/pmpk-preparation",
          },
        ],
      },
    ],
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicNavbar currentPage="other" />

      <div className="pt-20">
        {/* Hero */}
        <section className="py-16 md:py-24 px-4">
          <div className="container mx-auto max-w-4xl">
            <nav className="text-sm text-muted-foreground mb-6" aria-label="Хлебные крошки">
              <Link to="/" className="hover:text-primary">Главная</Link>
              <span className="mx-2">/</span>
              <span>Гайды</span>
              <span className="mx-2">/</span>
              <span className="text-foreground">Подготовка к ПМПК</span>
            </nav>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
              Подготовка к <span className="text-primary">ПМПК</span>: пошаговый гайд для родителей и специалистов
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8">
              Психолого-медико-педагогическая комиссия (ПМПК) — единственный орган, который может официально
              определить статус «ребёнок с ОВЗ» и назначить адаптированную образовательную программу. Разбираем
              документы, этапы, отличия от ППк и права родителей.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="#checklist">
                <Button size="lg">
                  Чек-лист документов <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </a>
              <a href="#faq">
                <Button size="lg" variant="outline">Частые вопросы</Button>
              </a>
            </div>
          </div>
        </section>

        {/* Что такое ПМПК */}
        <section className="py-12 md:py-16 px-4 bg-muted/30">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-2xl md:text-3xl font-bold mb-6">Что такое ПМПК простыми словами</h2>
            <div className="prose prose-slate max-w-none dark:prose-invert">
              <p>
                <strong>ПМПК</strong> — психолого-медико-педагогическая комиссия. Это государственный орган,
                который проводит комплексное обследование ребёнка и выдаёт заключение о необходимости
                специальных условий обучения. ПМПК работает на основании{" "}
                <strong>Приказа Минобрнауки РФ от 20.09.2013 № 1082</strong>.
              </p>
              <p>
                На комиссии работают несколько специалистов: педагог-психолог, учитель-дефектолог,
                учитель-логопед, социальный педагог, врач-психиатр (или невролог), педиатр. Каждый проводит
                свою часть обследования, затем комиссия коллегиально принимает решение.
              </p>
              <Card className="not-prose my-6 border-primary/40 bg-primary/5">
                <CardContent className="pt-6 flex gap-3">
                  <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <p className="text-sm">
                    <strong>Важно:</strong> ни школа, ни поликлиника, ни ППк не могут сами присвоить статус
                    ОВЗ или назначить АООП — это делает <em>только</em> ПМПК.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* ППк vs ПМПК */}
        <section className="py-12 md:py-16 px-4">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-2xl md:text-3xl font-bold mb-6">ППк и ПМПК — в чём разница</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">ППк — консилиум школы</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>• Внутренний орган образовательной организации</p>
                  <p>• Распоряжение Минпросвещения № Р-93 от 09.09.2019</p>
                  <p>• Определяет трудности внутри школы/сада</p>
                  <p>• Не устанавливает статус ОВЗ</p>
                  <p>• Даёт рекомендации педагогам и родителям</p>
                  <p>• Может направить на ПМПК</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">ПМПК — государственная комиссия</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>• Внешний государственный орган</p>
                  <p>• Приказ Минобрнауки № 1082 от 20.09.2013</p>
                  <p>• Комплексно обследует ребёнка</p>
                  <p>• Устанавливает статус «ребёнок с ОВЗ»</p>
                  <p>• Определяет АООП и специальные условия</p>
                  <p>• Заключение обязательно для школы</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Этапы */}
        <section className="py-12 md:py-16 px-4 bg-muted/30">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-2xl md:text-3xl font-bold mb-8">5 этапов подготовки к ПМПК</h2>
            <div className="space-y-4">
              {stages.map((s) => {
                const Icon = s.icon;
                return (
                  <Card key={s.title}>
                    <CardContent className="pt-6 flex gap-4">
                      <div className="h-11 w-11 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">{s.title}</h3>
                        <p className="text-sm text-muted-foreground">{s.text}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Чек-лист */}
        <section id="checklist" className="py-12 md:py-16 px-4 scroll-mt-24">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Чек-лист документов для ПМПК</h2>
            <p className="text-muted-foreground mb-6">
              Точный список запрашивайте в вашей территориальной ПМПК — в регионах могут быть особенности.
              Ниже — типовой пакет.
            </p>
            <Card>
              <CardContent className="pt-6">
                <ul className="space-y-3">
                  {documents.map((doc) => (
                    <li key={doc} className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">{doc}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Права родителей */}
        <section className="py-12 md:py-16 px-4 bg-muted/30">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-2xl md:text-3xl font-bold mb-6">Права родителей на ПМПК</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                "Присутствовать при обследовании ребёнка",
                "Получить копию заключения и протокола",
                "Отказаться от прохождения комиссии",
                "Не выполнять рекомендации (для родителя они носят рекомендательный характер)",
                "Оспорить заключение в вышестоящей комиссии или суде",
                "Знать состав специалистов и методики обследования",
              ].map((item) => (
                <Card key={item}>
                  <CardContent className="pt-6 flex gap-3">
                    <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <p className="text-sm">{item}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="py-12 md:py-16 px-4 scroll-mt-24">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-2xl md:text-3xl font-bold mb-6">Частые вопросы о ПМПК</h2>
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
          links={[SITE_LINKS.conclusion, SITE_LINKS.protocol, SITE_LINKS.templates, SITE_LINKS.forParents]}
        />

        {/* CTA */}
        <section className="py-16 px-4 bg-primary/5">
          <div className="container mx-auto max-w-3xl text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Автоматизируйте подготовку заключений ППк с universum.
            </h2>
            <p className="text-muted-foreground mb-6">
              Готовые шаблоны по Приказу ДОНМ № 666, электронные протоколы, автоматическое формирование
              коллегиального заключения и уведомления родителям — всё в одном пространстве.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link to="/for-organizations">
                <Button size="lg">Решение для школ и ППМС-центров</Button>
              </Link>
              <Link to="/legal">
                <Button size="lg" variant="outline">Нормативная база</Button>
              </Link>
            </div>
          </div>
        </section>
      </div>

      <LandingFooter />
    </div>
  );
}
