import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import LandingFooter from "@/components/LandingFooter";
import { PublicNavbar } from "@/components/PublicNavbar";
import { useSeoMeta } from "@/hooks/useSeoMeta";
import {
  Heart, Shield, Users, Target, Award, BookOpen, ArrowRight
} from "lucide-react";

const values = [
  {
    icon: Heart,
    title: "Забота о каждом ребёнке",
    description: "Мы создаём инструменты, которые помогают специалистам уделять больше внимания детям, а не бумагам."
  },
  {
    icon: Shield,
    title: "Безопасность данных",
    description: "Соответствие ФЗ-152, хранение в РФ, шифрование и строгий контроль доступа к персональным данным."
  },
  {
    icon: Users,
    title: "Командная работа",
    description: "Объединяем специалистов, организации и родителей в единое пространство для эффективного взаимодействия."
  },
  {
    icon: Target,
    title: "Доказательный подход",
    description: "Методики Минздрава РФ, соответствие Приказу ДОНМ №666, научно обоснованные инструменты оценки."
  }
];

const milestones = [
  { year: "2023", text: "Запуск платформы и первые пилотные организации" },
  { year: "2024", text: "Подключение ППМС-центров Москвы, модуль для родителей" },
  { year: "2025", text: "Интеграция с ЕКИС, журнал занятий, онлайн-запись" },
  { year: "2026", text: "Игровая для детей, расширение на регионы РФ" },
];

export default function About() {
  useSeoMeta({
    title: "О платформе — universum.",
    description: "universum. — платформа для комплексной поддержки развития детей. Автоматизация ППк, карты развития, аналитика для специалистов, организаций и родителей.",
    canonical: "/about",
    keywords: "universum, о платформе, ППк автоматизация, поддержка развития детей, ЦППМСП",
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "universum.",
        url: "https://ppk.lovable.app",
        logo: "https://ppk.lovable.app/og-image.png",
        description: "Платформа для комплексной поддержки и развития детей",
        foundingDate: "2023",
        address: {
          "@type": "PostalAddress",
          addressCountry: "RU",
          addressLocality: "Москва"
        }
      },
      {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "О платформе universum.",
        url: "https://ppk.lovable.app/about",
        description: "Информация о платформе universum. для поддержки развития детей"
      }
    ]
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicNavbar currentPage="other" />

      <div className="pt-20">
        {/* Hero */}
        <section className="py-16 md:py-24 px-4">
          <div className="container mx-auto max-w-4xl text-center">
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
              Технологии на благо <span className="text-primary">каждого ребёнка</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              universum. — платформа, которая объединяет специалистов, организации и родителей
              для комплексной поддержки развития детей.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link to="/for-organizations">
                <Button size="lg">
                  Подробнее <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/features">
                <Button variant="outline" size="lg">Возможности</Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Mission */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-12">
              <Award className="h-10 w-10 text-primary mx-auto mb-4" />
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Наша миссия</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Сделать качественную помощь в развитии доступной каждому ребёнку в России,
                освободив специалистов от рутины документооборота.
              </p>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-5xl">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">Наши ценности</h2>
            <div className="grid sm:grid-cols-2 gap-6">
              {values.map((v) => (
                <Card key={v.title} className="border-border/50">
                  <CardContent className="pt-6">
                    <div className="flex gap-4">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <v.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">{v.title}</h3>
                        <p className="text-sm text-muted-foreground">{v.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Timeline */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="container mx-auto max-w-3xl">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">
              <BookOpen className="inline h-7 w-7 mr-2 text-primary" />
              Этапы развития
            </h2>
            <div className="space-y-6">
              {milestones.map((m, i) => (
                <div key={m.year} className="flex gap-4 items-start">
                  <div className="flex flex-col items-center">
                    <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                      {m.year.slice(2)}
                    </div>
                    {i < milestones.length - 1 && <div className="w-px h-8 bg-border mt-1" />}
                  </div>
                  <div className="pt-2">
                    <span className="font-semibold text-sm text-primary">{m.year}</span>
                    <p className="text-muted-foreground">{m.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-2xl text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Присоединяйтесь</h2>
            <p className="text-muted-foreground mb-6">
              Начните использовать universum. для вашей организации уже сегодня.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link to="/auth">
                <Button size="lg">Начать работу</Button>
              </Link>
              <Link to="/pricing">
                <Button variant="outline" size="lg">Тарифы</Button>
              </Link>
            </div>
          </div>
        </section>
      </div>

      <LandingFooter />
    </div>
  );
}
