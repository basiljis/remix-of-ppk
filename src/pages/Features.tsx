import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import LandingFooter from "@/components/LandingFooter";
import { PublicNavbar } from "@/components/PublicNavbar";
import { useSeoMeta } from "@/hooks/useSeoMeta";
import {
  ClipboardList, Calendar, FileText, BarChart3, Shield,
  Users, UserCheck, Bell, Gamepad2, CalendarCheck,
  Target, BookOpen, ArrowRight, CheckCircle
} from "lucide-react";

const featureGroups = [
  {
    title: "Для организаций",
    features: [
      {
        icon: ClipboardList,
        title: "Протоколы ППк",
        description: "Автоматизация психолого-педагогических консилиумов. Генерация заключений и рекомендаций по чек-листам, соответствующим Приказу ДОНМ №666.",
      },
      {
        icon: Users,
        title: "Управление сотрудниками",
        description: "Гибкая система ролей: директор, администратор, специалисты. Настройка прав доступа и отслеживание нагрузки.",
      },
      {
        icon: BarChart3,
        title: "Аналитика и отчёты",
        description: "Статистика по организации, динамика показателей, KPI специалистов. Экспорт в Excel.",
      },
      {
        icon: Shield,
        title: "Безопасность и ФЗ-152",
        description: "Шифрование, хранение в РФ, Row-Level Security, контроль по IP, двухфакторная аутентификация.",
      },
    ],
  },
  {
    title: "Для специалистов",
    features: [
      {
        icon: FileText,
        title: "Карта ребёнка",
        description: "Полная история развития: протоколы, рекомендации, результаты тестов, динамика в одном месте.",
      },
      {
        icon: Calendar,
        title: "Журнал учёта занятий",
        description: "Индивидуальные и групповые занятия, серии сессий, учёт посещаемости, автоматические напоминания.",
        isNew: true,
      },
      {
        icon: Target,
        title: "Направления работы",
        description: "Укажите специализации — система подберёт вас под проблематику ребёнка.",
        isNew: true,
      },
      {
        icon: UserCheck,
        title: "Публичный профиль",
        description: "Персональная страница с информацией о квалификации, направлениях работы и онлайн-записью.",
        isNew: true,
      },
    ],
  },
  {
    title: "Для родителей",
    features: [
      {
        icon: Gamepad2,
        title: "Игровая для ребёнка",
        description: "Интерактивные развивающие задания с отслеживанием прогресса и адаптацией под возраст.",
        isNew: true,
      },
      {
        icon: BookOpen,
        title: "Тесты развития",
        description: "Научно обоснованные методики для оценки развития ребёнка с рекомендациями.",
      },
      {
        icon: CalendarCheck,
        title: "Онлайн-запись",
        description: "Запишитесь к специалисту напрямую, выберите удобное время и формат консультации.",
        isNew: true,
      },
      {
        icon: Bell,
        title: "Уведомления",
        description: "Напоминания о занятиях, результаты обследований, рекомендации специалистов.",
      },
    ],
  },
];

export default function Features() {
  useSeoMeta({
    title: "Возможности платформы — universum.",
    description: "Протоколы ППк, карты развития, журнал занятий, аналитика, онлайн-запись, игровая для детей — все инструменты universum. для специалистов, организаций и родителей.",
    canonical: "/features",
    keywords: "возможности universum, протоколы ППк, карта ребёнка, журнал занятий, онлайн-запись, аналитика, игровая для детей",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Возможности платформы universum.",
      url: "https://ppk.lovable.app/features",
      description: "Полный список возможностей платформы universum. для поддержки развития детей",
      mainEntity: {
        "@type": "SoftwareApplication",
        name: "universum.",
        applicationCategory: "EducationalApplication",
        operatingSystem: "Web",
        offers: {
          "@type": "Offer",
          url: "https://ppk.lovable.app/pricing"
        }
      }
    }
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicNavbar currentPage="other" />

      <div className="pt-20">
        {/* Hero */}
        <section className="py-16 md:py-24 px-4">
          <div className="container mx-auto max-w-4xl text-center">
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
              Всё для <span className="text-primary">развития детей</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Полный набор инструментов для специалистов, организаций и родителей — 
              от протоколов ППк до интерактивных игр.
            </p>
          </div>
        </section>

        {/* Feature Groups */}
        {featureGroups.map((group, gi) => (
          <section key={group.title} className={`py-16 px-4 ${gi % 2 === 1 ? 'bg-muted/30' : ''}`}>
            <div className="container mx-auto max-w-5xl">
              <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">{group.title}</h2>
              <div className="grid sm:grid-cols-2 gap-6">
                {group.features.map((f) => (
                  <Card key={f.title} className="border-border/50 hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <f.icon className="h-5 w-5 text-primary" />
                        </div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {f.title}
                          {'isNew' in f && f.isNew && (
                            <Badge variant="secondary" className="text-xs">Новое</Badge>
                          )}
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{f.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        ))}

        {/* Highlights */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-3xl">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Почему universum.?</h2>
            <div className="space-y-4">
              {[
                "Сокращение времени на документооборот в 3–5 раз",
                "Соответствие ФЗ-152 и Приказу ДОНМ №666",
                "Единая база данных по всем детям организации",
                "Доступ с любого устройства — PWA-приложение",
                "Научно обоснованные методики оценки развития",
              ].map((text) => (
                <div key={text} className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-muted-foreground">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="container mx-auto max-w-2xl text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Готовы начать?</h2>
            <p className="text-muted-foreground mb-6">
              Выберите подходящий тариф или попробуйте бесплатно.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link to="/pricing">
                <Button size="lg">
                  Тарифы <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/auth">
                <Button variant="outline" size="lg">Попробовать бесплатно</Button>
              </Link>
            </div>
          </div>
        </section>
      </div>

      <LandingFooter />
    </div>
  );
}
