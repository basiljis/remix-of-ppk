import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import LandingFooter from "@/components/LandingFooter";
import { PublicNavbar } from "@/components/PublicNavbar";
import { useSeoMeta } from "@/hooks/useSeoMeta";
import { CheckCircle, ArrowRight, HelpCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLocaleFormatter } from "@/hooks/useLocaleFormatter";

const getPlans = (t: any, formatCurrency: any) => [
  {
    name: t("pages:pricing.plans.free.name", "Бесплатный"),
    price: formatCurrency(0),
    period: "",
    description: t("pages:pricing.plans.free.description", "Для знакомства с платформой"),
    features: [
      t("translation:protocolForm.child.limit5", "До 5 детей"),
      t("translation:protocolForm.documents.ppk", "Протоколы ППк"),
      t("translation:protocolForm.child.card", "Карта ребёнка"),
      t("translation:protocolForm.specialist.count1", "1 специалист"),
    ],
    cta: t("pages:common.getStarted", "Начать бесплатно"),
    ctaVariant: "outline" as const,
    highlighted: false,
  },
  {
    name: t("pages:pricing.plans.specialist.name", "Специалист"),
    price: formatCurrency(330),
    period: t("pages:pricing.plans.specialist.period", "/ мес"),
    description: t("pages:pricing.plans.specialist.description", "Для частных практиков и педагогов"),
    features: [
      t("translation:protocolForm.child.unlimited", "Неограниченно детей"),
      t("translation:protocolForm.documents.ppk", "Протоколы ППк"),
      t("translation:protocolForm.documents.journal", "Журнал занятий"),
      t("translation:protocolForm.specialist.onlineBooking", "Онлайн-запись"),
      t("translation:protocolForm.specialist.publicProfile", "Публичный профиль"),
      t("translation:protocolForm.specialist.analytics", "Аналитика"),
    ],
    cta: t("pages:pricing.plans.specialist.cta", "Выбрать тариф"),
    ctaVariant: "outline" as const,
    highlighted: false,
  },
  {
    name: t("pages:pricing.plans.org.name", "Организация"),
    price: formatCurrency(2500),
    period: t("pages:pricing.plans.org.period", "/ мес"),
    description: t("pages:pricing.plans.org.description", "Для школ, ППМС-центров и ЦППМСП"),
    features: [
      t("translation:protocolForm.specialist.allFromSpecialist", "Всё из «Специалист»"),
      t("translation:protocolForm.specialist.count10", "До 10 сотрудников"),
      t("translation:protocolForm.specialist.roleManagement", "Управление ролями"),
      t("translation:protocolForm.specialist.kpi", "KPI и статистика"),
      t("translation:protocolForm.specialist.integration", "Интеграция с ЕКИС"),
      t("translation:protocolForm.specialist.prioritySupport", "Приоритетная поддержка"),
    ],
    cta: t("pages:pricing.plans.org.cta", "Подключить"),
    ctaVariant: "default" as const,
    highlighted: true,
  },
  {
    name: t("pages:pricing.plans.corporate.name", "Корпоративный"),
    price: t("pages:pricing.plans.corporate.price", "По запросу"),
    period: "",
    description: t("pages:pricing.plans.corporate.description", "Для сетей и региональных проектов"),
    features: [
      t("translation:protocolForm.specialist.allFromOrg", "Всё из «Организация»"),
      t("translation:protocolForm.specialist.unlimitedStaff", "Неограниченно сотрудников"),
      t("translation:protocolForm.specialist.sla", "SLA и выделенная поддержка"),
      t("translation:protocolForm.specialist.customization", "Кастомизация под процессы"),
      t("translation:protocolForm.specialist.onPremise", "Размещение на своём сервере"),
      t("translation:protocolForm.specialist.training", "Обучение персонала"),
    ],
    cta: t("pages:pricing.plans.corporate.cta", "Запросить КП"),
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
  const { t, i18n } = useTranslation(["pages", "translation"]);
  const { formatCurrency } = useLocaleFormatter();
  const plans = getPlans(t, formatCurrency);

  useSeoMeta({
    title: t("pages:pricing.seoTitle", "Тарифы — universum."),
    description: t("pages:pricing.seoDescription", "Тарифные планы платформы universum.: бесплатный, для специалистов, организаций и корпоративных клиентов. Попробуйте бесплатно."),
    canonical: "/pricing",
    keywords: t("pages:pricing.seoKeywords", "тарифы universum, цена ППк, стоимость подписки, тариф для организаций, тариф для специалистов"),
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: t("pages:pricing.seoTitle", "Тарифы universum."),
      url: "https://unvrsm.ru/pricing",
      mainEntity: {
        "@type": "SoftwareApplication",
        name: "universum.",
        applicationCategory: "EducationalApplication",
        operatingSystem: "Web",
        offers: plans.filter(p => typeof p.price === 'string' && !p.price.includes('запрос')).map(p => ({
          "@type": "Offer",
          name: p.name,
          price: (p.price as string).replace(/[^\d]/g, '') || "0",
          priceCurrency: "RUB",
          url: "https://unvrsm.ru/pricing"
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
        <section className="pb-16 px-4" aria-labelledby="pricing-plans-heading">
          <div className="container mx-auto max-w-6xl">
            <h2 id="pricing-plans-heading" className="sr-only">Тарифные планы universum.</h2>
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
                      {i18n.resolvedLanguage === "zh" ? (
                        <span className="text-2xl font-bold">{t("pages:pricing.plans.corporate.price", "按需报价")}</span>
                      ) : (
                        <>
                          <span className="text-3xl font-bold">{plan.price}</span>
                          {plan.period && (
                            <span className="text-muted-foreground text-sm">{plan.period}</span>
                          )}
                        </>
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
                    <Link to={plan.name === "Корпоративный" ? "/for-organizations" : (plan.name === "Организация" ? "/auth?mode=organization" : "/register")}>
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
