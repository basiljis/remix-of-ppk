import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import LandingFooter from "@/components/LandingFooter";
import { PublicNavbar } from "@/components/PublicNavbar";
import { RelatedLinks, SITE_LINKS } from "@/components/seo/RelatedLinks";
import { useSeoMeta } from "@/hooks/useSeoMeta";
import { ArrowRight, CheckCircle2, AlertTriangle, FileText, Download } from "lucide-react";

const structure = [
  {
    title: "1. Шапка документа",
    text: "Полное наименование образовательной организации, номер и дата заседания ППк, фамилия, имя, отчество ребёнка, дата рождения, класс или группа.",
  },
  {
    title: "2. Причина обращения",
    text: "Кто инициировал консилиум (родитель, педагог, администрация) и какие трудности стали основанием: освоение программы, поведение, речь, адаптация.",
  },
  {
    title: "3. Результаты обследования специалистов",
    text: "Краткие выводы педагога-психолога, учителя-логопеда, учителя-дефектолога, социального педагога. Без диагнозов — только педагогическая и психологическая квалификация трудностей.",
  },
  {
    title: "4. Коллегиальное заключение",
    text: "Согласованный вывод участников консилиума: характер трудностей, ресурсы ребёнка, необходимость адаптации условий обучения или направления на ПМПК.",
  },
  {
    title: "5. Рекомендации",
    text: "Конкретные, проверяемые меры: направления коррекционной работы, частота и длительность занятий, приёмы для учителя, рекомендации семье, сроки повторного рассмотрения.",
  },
  {
    title: "6. Подписи и ознакомление",
    text: "Подписи председателя и членов ППк, отметка родителя (законного представителя) об ознакомлении с датой и подписью. Один экземпляр остаётся в организации, копия выдаётся родителю.",
  },
];

const mistakes = [
  "Указание медицинских диагнозов — ППк не является медицинским органом и не ставит диагноз.",
  "Формулировка «рекомендовано направить на ПМПК» без описания уже принятых внутри организации мер.",
  "Общие рекомендации вида «развивать внимание» без указания направлений, частоты и ответственных.",
  "Отсутствие подписи родителя об ознакомлении — нарушает порядок и делает документ уязвимым при проверке.",
  "Хранение заключения вне защищённого контура: специальные персональные данные требуют защиты по ФЗ-152.",
  "Отсутствие срока повторного рассмотрения динамики — консилиум обязан отслеживать результат.",
];

const faq = [
  {
    q: "Кто подписывает заключение ППк?",
    a: "Председатель консилиума и все специалисты, участвовавшие в заседании. Родитель (законный представитель) ставит подпись об ознакомлении — это не согласие с содержанием, а подтверждение, что он получил информацию и копию документа.",
  },
  {
    q: "Можно ли писать диагноз в заключении ППк?",
    a: "Нет. ППк работает по Распоряжению Минпросвещения России № Р-93 от 09.09.2019 и описывает трудности в педагогических и психологических терминах. Медицинские диагнозы ставит врач, статус ОВЗ устанавливает ПМПК.",
  },
  {
    q: "Обязательно ли согласие родителя на проведение ППк?",
    a: "Да. Обследование ребёнка специалистами консилиума проводится с письменного согласия родителей (законных представителей). Кроме того, требуется согласие на обработку персональных данных, включая данные о состоянии здоровья.",
  },
  {
    q: "Сколько хранится заключение ППк?",
    a: "Документы консилиума хранятся в образовательной организации в течение срока, установленного её номенклатурой дел и локальными актами; для московских организаций ориентируются на требования Приказа ДОНМ № 666 — не менее 5 лет.",
  },
  {
    q: "Чем заключение ППк отличается от заключения ПМПК?",
    a: "Заключение ППк — внутренний документ организации с рекомендациями по адаптации обучения. Заключение ПМПК — документ государственной комиссии, который устанавливает статус «ребёнок с ОВЗ» и обязателен к исполнению образовательной организацией.",
  },
  {
    q: "Как быстро оформляется заключение после заседания?",
    a: "Коллегиальное заключение оформляется в день заседания или в срок, установленный положением о ППк организации (как правило, в течение 3 рабочих дней), и в этот же срок доводится до сведения родителей.",
  },
];

export default function PpkConclusion() {
  useSeoMeta({
    title: "Как оформить заключение ППк: структура, образец, ошибки 2026 — universum.",
    description:
      "Пошаговая инструкция по оформлению коллегиального заключения психолого-педагогического консилиума: обязательные разделы, формулировки рекомендаций, типовые ошибки и бланк для скачивания.",
    canonical: "/guides/ppk-conclusion",
    keywords:
      "заключение ппк, как оформить заключение ппк, коллегиальное заключение консилиума, образец заключения ппк, ппк в школе, распоряжение р-93",
    ogType: "article",
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "HowTo",
        name: "Как оформить коллегиальное заключение ППк",
        description:
          "Структура коллегиального заключения психолого-педагогического консилиума образовательной организации.",
        step: structure.map((s, i) => ({
          "@type": "HowToStep",
          position: i + 1,
          name: s.title,
          text: s.text,
        })),
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
          {
            "@type": "ListItem",
            position: 3,
            name: "Заключение ППк",
            item: "https://unvrsm.ru/guides/ppk-conclusion",
          },
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
              <span className="text-foreground">Заключение ППк</span>
            </nav>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
              Как оформить <span className="text-primary">заключение ППк</span>: структура и образец
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8">
              Коллегиальное заключение — итоговый документ психолого-педагогического консилиума. Разбираем
              обязательные разделы, корректные формулировки рекомендаций и ошибки, из-за которых документ
              возвращают на доработку.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="#structure">
                <Button size="lg">
                  Структура документа <ArrowRight className="ml-2 h-4 w-4" />
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
            <h2 className="text-2xl md:text-3xl font-bold mb-6">На каком основании оформляется заключение</h2>
            <div className="prose prose-slate max-w-none dark:prose-invert">
              <p>
                Порядок работы психолого-педагогического консилиума определяет{" "}
                <strong>Распоряжение Минпросвещения России № Р-93 от 09.09.2019</strong> «Об утверждении
                примерного Положения о психолого-педагогическом консилиуме образовательной организации».
                Конкретную форму документа организация закрепляет собственным локальным актом — положением о
                ППк, поэтому единого федерального бланка не существует.
              </p>
              <p>
                Заключение содержит специальные категории персональных данных (сведения о состоянии здоровья и
                развитии ребёнка), поэтому его оформление, передача и хранение подчиняются{" "}
                <strong>ФЗ-152 «О персональных данных»</strong>.
              </p>
            </div>
          </div>
        </section>

        <section id="structure" className="py-12 md:py-16 px-4 scroll-mt-24">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-2xl md:text-3xl font-bold mb-8">6 обязательных разделов заключения</h2>
            <div className="space-y-4">
              {structure.map((s) => (
                <Card key={s.title}>
                  <CardContent className="pt-6 flex gap-4">
                    <div className="h-11 w-11 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{s.title}</h3>
                      <p className="text-sm text-muted-foreground">{s.text}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-12 md:py-16 px-4 bg-muted/30">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-2xl md:text-3xl font-bold mb-6">Как формулировать рекомендации</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Так не стоит</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>• «Развивать внимание и память»</p>
                  <p>• «Заниматься с логопедом»</p>
                  <p>• «Родителям больше времени уделять ребёнку»</p>
                  <p>• «Наблюдать динамику»</p>
                </CardContent>
              </Card>
              <Card className="border-primary/40">
                <CardHeader>
                  <CardTitle className="text-lg">Так корректно</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>• «Коррекция произвольного внимания, 2 занятия в неделю по 30 минут, педагог-психолог»</p>
                  <p>• «Коррекция звукопроизношения и фонематического восприятия, 3 занятия в неделю, учитель-логопед»</p>
                  <p>• «Единый режим дня, выполнение домашних заданий блоками по 15 минут с перерывом»</p>
                  <p>• «Повторное рассмотрение динамики — через 3 месяца, ответственный — председатель ППк»</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-12 md:py-16 px-4">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-2xl md:text-3xl font-bold mb-6">6 типовых ошибок</h2>
            <Card>
              <CardContent className="pt-6">
                <ul className="space-y-3">
                  {mistakes.map((m) => (
                    <li key={m} className="flex gap-3">
                      <AlertTriangle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">{m}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="py-12 md:py-16 px-4 bg-muted/30">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-2xl md:text-3xl font-bold mb-6">Чек-лист перед подписанием</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                "Есть письменное согласие родителя на обследование",
                "Указаны дата, номер заседания и состав участников",
                "Нет медицинских диагнозов и оценочных суждений",
                "Рекомендации конкретны: направление, частота, ответственный",
                "Определён срок повторного рассмотрения динамики",
                "Родитель ознакомлен под подпись и получил копию",
              ].map((item) => (
                <Card key={item}>
                  <CardContent className="pt-6 flex gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
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
          links={[SITE_LINKS.protocol, SITE_LINKS.pmpk, SITE_LINKS.templates, SITE_LINKS.legal]}
        />

        <section className="py-16 px-4 bg-primary/5">
          <div className="container mx-auto max-w-3xl text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Заключение ППк за несколько минут вместо часа
            </h2>
            <p className="text-muted-foreground mb-6">
              universum. собирает результаты диагностики специалистов в карточке ребёнка и формирует
              коллегиальное заключение по готовой структуре — с историей изменений и защищённым хранением.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link to="/for-specialists">
                <Button size="lg">Попробовать специалисту</Button>
              </Link>
              <Link to="/for-organizations">
                <Button size="lg" variant="outline">Решение для организации</Button>
              </Link>
            </div>
          </div>
        </section>
      </div>

      <LandingFooter />
    </div>
  );
}
