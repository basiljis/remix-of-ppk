import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import LandingFooter from "@/components/LandingFooter";
import { PublicNavbar } from "@/components/PublicNavbar";
import { useSeoMeta } from "@/hooks/useSeoMeta";
import { CheckCircle, ArrowRight, HelpCircle } from "lucide-react";

const plans = [
  {
    name: "Бесплатный",
    price: "0 ₽",
    period: "",
    description: "Для знакомства с платформой",
    features: [
      "До 5 детей",
      "Протоколы ППк",
      "Карта ребёнка",
      "1 специалист",
    ],
    cta: "Начать бесплатно",
    ctaVariant: "outline" as const,
    highlighted: false,
  },
  {
    name: "Специалист",
    price: "990 ₽",
    period: "/ мес",
    description: "Для частных практиков и педагогов",
    features: [
      "Неограниченно детей",
      "Протоколы ППк",
      "Журнал занятий",
      "Онлайн-запись",
      "Публичный профиль",
      "Аналитика",
    ],
    cta: "Выбрать тариф",
    ctaVariant: "outline" as const,
    highlighted: false,
  },
  {
    name: "Организация",
    price: "4 990 ₽",
    period: "/ мес",
    description: "Для школ, ППМС-центров и ЦППМСП",
    features: [
      "Всё из «Специалист»",
      "До 10 сотрудников",
      "Управление ролями",
      "KPI и статистика",
      "Интеграция с ЕКИС",
      "Приоритетная поддержка",
    ],
    cta: "Подключить",
    ctaVariant: "default" as const,
    highlighted: true,
  },
  {
    name: "Корпоративный",
    price: "По запросу",
    period: "",
    description: "Для сетей и региональных проектов",
    features: [
      "Всё из «Организация»",
      "Неограниченно сотрудников",
      "SLA и выделенная поддержка",
      "Кастомизация под процессы",
      "Размещение на своём сервере",
      "Обучение персонала",
    ],
    cta: "Запросить КП",
    ctaVariant: "outline" as const,
    highlighted: false,
  },
];

const faq = [
  {
    q: "Есть ли пробный период?",
    a: "Да, бесплатный тариф доступен без ограничений по времени. Платные тарифы можно попробовать 14 дней бесплатно."
  },
  {
    q: "Как происходит оплата?",
    a: "Оплата по безналичному расчёту для организаций или картой для частных специалистов. Доступна помесячная и годовая подписка."
  },
  {
    q: "Можно ли перейти на другой тариф?",
    a: "Да, тариф можно изменить в любой момент. При повышении тарифа разница рассчитывается автоматически."
  },
  {
    q: "Где хранятся данные?",
    a: "Все данные хранятся на серверах в России в соответствии с ФЗ-152. Мы используем шифрование и регулярное резервное копирование."
  },
];

export default function Pricing() {
  useSeoMeta({
    title: "Тарифы — universum.",
    description: "Тарифные планы платформы universum.: бесплатный, для специалистов, организаций и корпоративных клиентов. Попробуйте бесплатно.",
    canonical: "/pricing",
    keywords: "тарифы universum, цена ППк, стоимость подписки, тариф для организаций, тариф для специалистов",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Тарифы universum.",
      url: "https://ppk.lovable.app/pricing",
      mainEntity: {
        "@type": "SoftwareApplication",
        name: "universum.",
        applicationCategory: "EducationalApplication",
        operatingSystem: "Web",
        offers: plans.filter(p => p.price !== "По запросу").map(p => ({
          "@type": "Offer",
          name: p.name,
          price: p.price.replace(/[^\d]/g, '') || "0",
          priceCurrency: "RUB",
          url: "https://ppk.lovable.app/pricing"
        }))
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
              Простые и понятные <span className="text-primary">тарифы</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Выберите план, подходящий вашим задачам. Начните бесплатно — платите только когда будете готовы.
            </p>
          </div>
        </section>

        {/* Plans */}
        <section className="pb-16 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {plans.map((plan) => (
                <Card
                  key={plan.name}
                  className={`relative flex flex-col ${
                    plan.highlighted
                      ? 'border-primary shadow-lg ring-1 ring-primary/20'
                      : 'border-border/50'
                  }`}
                >
                  {plan.highlighted && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                      Популярный
                    </Badge>
                  )}
                  <CardHeader>
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                    <div className="pt-2">
                      <span className="text-3xl font-bold">{plan.price}</span>
                      {plan.period && (
                        <span className="text-muted-foreground text-sm">{plan.period}</span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <ul className="space-y-3 flex-1 mb-6">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <span className="text-muted-foreground">{f}</span>
                        </li>
                      ))}
                    </ul>
                    <Link to={plan.name === "Корпоративный" ? "/for-organizations" : "/auth"}>
                      <Button variant={plan.ctaVariant} className="w-full">
                        {plan.cta}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="container mx-auto max-w-3xl">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">
              <HelpCircle className="inline h-7 w-7 mr-2 text-primary" />
              Частые вопросы
            </h2>
            <div className="space-y-6">
              {faq.map((item) => (
                <div key={item.q} className="border-b border-border/50 pb-6 last:border-0">
                  <h3 className="font-semibold mb-2">{item.q}</h3>
                  <p className="text-sm text-muted-foreground">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <LandingFooter />
    </div>
  );
}
