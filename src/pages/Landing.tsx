import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CookieConsent from "@/components/CookieConsent";
import LandingFooter from "@/components/LandingFooter";
import { PublicNavbar } from "@/components/PublicNavbar";
import { useSeoMeta } from "@/hooks/useSeoMeta";
import { 
  GraduationCap, Building2, Baby, 
  ClipboardList, Calendar, FileText, Shield, 
  CheckCircle, ArrowRight,
  BarChart3, UserCheck, Gamepad2, 
  BookOpen, CalendarCheck, Bell, Users, Target
} from "lucide-react";

const howItWorks = [
  {
    icon: FileText,
    title: "Карточка ребёнка",
    description: "Единый профиль с полной историей развития, тестами и рекомендациями"
  },
  {
    icon: ClipboardList,
    title: "Протоколы и заключения",
    description: "Автоматизация ППк с генерацией документов по результатам обследования"
  },
  {
    icon: Calendar,
    title: "Планирование занятий",
    description: "Гибкое расписание с учётом нагрузки специалистов и онлайн-записью"
  },
  {
    icon: BarChart3,
    title: "Аналитика результатов",
    description: "Отслеживание динамики развития и эффективности коррекционной работы"
  }
];

const features = [
  {
    icon: ClipboardList,
    title: "Протоколы ППк",
    description: "Автоматизация психолого-педагогических консилиумов с генерацией заключений и рекомендаций",
    audience: ["org", "specialist"]
  },
  {
    icon: Calendar,
    title: "Журнал учёта занятий",
    description: "Индивидуальные и групповые занятия, серии сессий, учёт посещаемости",
    isNew: true,
    audience: ["org", "specialist", "private"]
  },
  {
    icon: FileText,
    title: "Карта ребёнка",
    description: "Централизованное хранение истории развития, синхронизация с родителями",
    audience: ["org", "specialist", "private", "parent"]
  },
  {
    icon: Gamepad2,
    title: "Игровая ребёнка",
    description: "Интерактивные развивающие игры и упражнения для детей с отслеживанием прогресса",
    isNew: true,
    audience: ["parent"]
  },
  {
    icon: CalendarCheck,
    title: "Онлайн-запись",
    description: "Родители записываются к специалистам напрямую, управление слотами",
    isNew: true,
    audience: ["org", "specialist", "private", "parent"]
  },
  {
    icon: Target,
    title: "Направления работы",
    description: "Педагоги указывают специализации, система подбирает специалистов под проблематику ребёнка",
    isNew: true,
    audience: ["specialist", "private", "parent"]
  },
  {
    icon: UserCheck,
    title: "Подбор специалиста",
    description: "Рекомендации специалистов на основе результатов ППк и тестов развития ребёнка",
    isNew: true,
    audience: ["parent"]
  },
  {
    icon: BookOpen,
    title: "Библиотека материалов",
    description: "Рекомендации по развитию на основе результатов тестирования",
    isNew: true,
    audience: ["parent"]
  },
  {
    icon: BarChart3,
    title: "Аналитика и KPI",
    description: "Сравнительная статистика, отслеживание KPI специалистов организации",
    isNew: true,
    audience: ["org"]
  },
  {
    icon: Bell,
    title: "Уведомления",
    description: "Автоматические напоминания о занятиях, email и push-уведомления",
    isNew: true,
    audience: ["org", "specialist", "private", "parent"]
  },
  {
    icon: Shield,
    title: "Безопасность данных",
    description: "Соответствие ФЗ-152, шифрование и хранение в РФ",
    audience: ["org", "specialist", "private", "parent"]
  }
];

const audienceLabels: Record<string, { label: string; color: string }> = {
  org: { label: "Организации", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  specialist: { label: "Педагоги", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
  private: { label: "Частная практика", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  parent: { label: "Родители", color: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400" }
};

const userTypes = [
  {
    icon: Building2,
    title: "Для организаций",
    description: "Школы, детские сады, ППМС-центры",
    features: [
      { text: "Управление сотрудниками и KPI", isNew: true },
      { text: "Протоколы ППк" },
      { text: "Групповые и серийные занятия", isNew: true },
      { text: "Управление видимостью стоимости услуг", isNew: true }
    ],
    link: "/for-organizations",
    authLink: "/auth",
    color: "from-blue-500/20 to-blue-600/10",
    borderColor: "border-blue-500/30"
  },
  {
    icon: GraduationCap,
    title: "Для педагогов",
    description: "Психологи, логопеды, дефектологи, частная практика",
    features: [
      { text: "Публичный профиль с портфолио", isNew: true },
      { text: "Направления работы и специализации", isNew: true },
      { text: "Онлайн-запись клиентов", isNew: true },
      { text: "Протоколы и карты детей" }
    ],
    link: "/for-specialists",
    authLink: "/auth",
    color: "from-orange-500/20 to-orange-600/10",
    borderColor: "border-orange-500/30"
  },
  {
    icon: Baby,
    title: "Для родителей",
    description: "Личный кабинет законного представителя",
    features: [
      { text: "Подбор специалиста по проблеме", isNew: true },
      { text: "Тесты развития и результаты ППк" },
      { text: "Игровая ребёнка", isNew: true },
      { text: "Персональные рекомендации", isNew: true }
    ],
    link: "/for-parents",
    authLink: "/parent-auth",
    color: "from-pink-500/20 to-pink-600/10",
    borderColor: "border-pink-500/30"
  }
];

interface PricingPlan {
  name: string;
  subtitle: string;
  monthlyPrice: number | null;
  yearlyPrice: number | null;
  yearlySaving?: string;
  freeLabel?: string;
  highlight: boolean;
  badge?: string;
  features: string[];
  cta: string;
  ctaLink: string;
}

const pricingPlans: Record<string, PricingPlan[]> = {
  org: [
    {
      name: "АИС ППк",
      subtitle: "Психолого-педагогические консилиумы",
      monthlyPrice: 2500,
      yearlyPrice: 25500,
      yearlySaving: "скидка 15%",
      highlight: false,
      features: [
        "Протоколы ППк и заключения",
        "Карточки детей (неограниченно)",
        "Управление сотрудниками",
        "KPI специалистов",
        "Аналитика и отчёты",
        "Хранение данных по ФЗ-152",
        "Email-уведомления",
        "Поддержка по email",
      ],
      cta: "Начать 7 дней бесплатно",
      ctaLink: "/auth"
    },
    {
      name: "АИС СПТ",
      subtitle: "Расписание и сопровождение",
      monthlyPrice: 2500,
      yearlyPrice: 25500,
      yearlySaving: "скидка 15%",
      highlight: true,
      badge: "Популярный",
      features: [
        "Всё из АИС ППк",
        "Журнал учёта занятий",
        "Групповые и серийные сессии",
        "Онлайн-запись родителей",
        "Праздничные дни организации",
        "Пуш-уведомления",
        "Публичный профиль организации",
        "Приоритетная поддержка",
      ],
      cta: "Начать 7 дней бесплатно",
      ctaLink: "/auth"
    }
  ],
  specialist: [
    {
      name: "Базовый",
      subtitle: "Для начала практики",
      monthlyPrice: null,
      yearlyPrice: null,
      freeLabel: "Бесплатно",
      highlight: false,
      features: [
        "Карточки до 5 детей",
        "Протоколы ППк (в составе организации)",
        "Личный профиль",
        "Email-уведомления",
      ],
      cta: "Зарегистрироваться",
      ctaLink: "/auth"
    },
    {
      name: "Профессиональный",
      subtitle: "Полный функционал для частной практики",
      monthlyPrice: 2500,
      yearlyPrice: 25500,
      yearlySaving: "скидка 15%",
      highlight: true,
      badge: "Рекомендуем",
      features: [
        "Карточки детей (неограниченно)",
        "Публичный профиль с портфолио",
        "Направления работы",
        "Онлайн-запись клиентов",
        "Журнал занятий",
        "Аналитика загруженности",
        "Финансовые отчёты",
        "Приоритетная поддержка",
      ],
      cta: "Начать 7 дней бесплатно",
      ctaLink: "/auth"
    }
  ],
  parent: [
    {
      name: "Для родителей",
      subtitle: "Всё для развития вашего ребёнка",
      monthlyPrice: null,
      yearlyPrice: null,
      freeLabel: "Бесплатно",
      highlight: true,
      badge: "Без оплаты",
      features: [
        "Личный кабинет родителя",
        "Профили детей",
        "Тесты развития",
        "Результаты ППк и заключения",
        "Игровая комната ребёнка",
        "Подбор специалиста",
        "Библиотека рекомендаций",
        "Онлайн-запись к специалисту",
      ],
      cta: "Создать аккаунт",
      ctaLink: "/parent-auth"
    }
  ]
};

function PricingCard({ plan, billingPeriod }: { plan: typeof pricingPlans.org[0]; billingPeriod: "monthly" | "yearly" }) {
  const price = billingPeriod === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
  const priceLabel = billingPeriod === "yearly" ? "год" : "месяц";

  return (
    <Card className={`relative flex flex-col transition-all hover:shadow-lg ${plan.highlight ? "border-primary border-2 shadow-md" : ""}`}>
      {plan.badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="px-3 py-1 text-xs">{plan.badge}</Badge>
        </div>
      )}
      <CardHeader className="pb-4">
        <CardTitle className="text-xl">{plan.name}</CardTitle>
        <CardDescription className="text-sm">{plan.subtitle}</CardDescription>
        <div className="mt-4">
          {"freeLabel" in plan && plan.freeLabel ? (
            <div className="text-3xl font-bold text-primary">{plan.freeLabel}</div>
          ) : price !== null ? (
            <div>
              <span className="text-3xl font-bold">{price.toLocaleString("ru-RU")}₽</span>
              <span className="text-muted-foreground text-sm ml-1">/ {priceLabel}</span>
              {"yearlySaving" in plan && plan.yearlySaving && billingPeriod === "yearly" && (
                <div className="text-xs text-green-600 dark:text-green-400 mt-1">{plan.yearlySaving}</div>
              )}
            </div>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4">
        <ul className="space-y-2 flex-1">
          {plan.features.map((f) => (
            <li key={f} className="flex items-start gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
        <Link to={plan.ctaLink} className="mt-4">
          <Button className="w-full" variant={plan.highlight ? "default" : "outline"}>
            {plan.cta}
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

function PricingSection() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");

  return (
    <section className="py-20 px-4" id="pricing">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-10">
          <Badge variant="secondary" className="mb-3">Тарифы</Badge>
          <h2 className="text-3xl font-bold mb-4">Прозрачные цены</h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-6">
            7 дней бесплатного доступа ко всем функциям — без привязки карты
          </p>
          {/* Billing toggle */}
          <div className="inline-flex items-center gap-2 bg-muted rounded-full px-2 py-1">
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${billingPeriod === "monthly" ? "bg-background shadow-sm" : "text-muted-foreground"}`}
            >
              Помесячно
            </button>
            <button
              onClick={() => setBillingPeriod("yearly")}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${billingPeriod === "yearly" ? "bg-background shadow-sm" : "text-muted-foreground"}`}
            >
              Годовая
              <span className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-1.5 py-0.5 rounded-full">−15%</span>
            </button>
          </div>
        </div>

        <Tabs defaultValue="org" className="w-full">
          <TabsList className="mb-8 max-w-md mx-auto">
            <TabsTrigger value="org" className="flex items-center gap-1.5 flex-1">
              <Building2 className="h-4 w-4" />
              Организации
            </TabsTrigger>
            <TabsTrigger value="specialist" className="flex items-center gap-1.5 flex-1">
              <GraduationCap className="h-4 w-4" />
              Педагоги
            </TabsTrigger>
            <TabsTrigger value="parent" className="flex items-center gap-1.5 flex-1">
              <Baby className="h-4 w-4" />
              Родители
            </TabsTrigger>
          </TabsList>

          <TabsContent value="org">
            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {pricingPlans.org.map((plan) => (
                <PricingCard key={plan.name} plan={plan} billingPeriod={billingPeriod} />
              ))}
            </div>
            <p className="text-center text-xs text-muted-foreground mt-6">
              Для государственных учреждений — оплата по счёту, 44-ФЗ и 223-ФЗ. <Link to="/for-organizations" className="underline">Подробнее →</Link>
            </p>
          </TabsContent>

          <TabsContent value="specialist">
            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {pricingPlans.specialist.map((plan) => (
                <PricingCard key={plan.name} plan={plan} billingPeriod={billingPeriod} />
              ))}
            </div>
            <p className="text-center text-xs text-muted-foreground mt-6">
              При работе в составе организации с подпиской — функционал уже включён. <Link to="/for-specialists" className="underline">Подробнее →</Link>
            </p>
          </TabsContent>

          <TabsContent value="parent">
            <div className="flex justify-center">
              <div className="w-full max-w-sm">
                {pricingPlans.parent.map((plan) => (
                  <PricingCard key={plan.name} plan={plan} billingPeriod={billingPeriod} />
                ))}
              </div>
            </div>
            <p className="text-center text-xs text-muted-foreground mt-6">
              Для родителей кабинет всегда бесплатен. Доступ к заключениям и рекомендациям — без подписки. <Link to="/for-parents" className="underline">Подробнее →</Link>
            </p>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  
  const filteredFeatures = activeFilter 
    ? features.filter(f => f.audience.includes(activeFilter))
    : features;

  const filterButtons = [
    { key: null, label: "Все" },
    { key: "org", label: "Организации", icon: Building2 },
    { key: "specialist", label: "Педагоги", icon: GraduationCap },
    { key: "private", label: "Частная практика", icon: Users },
    { key: "parent", label: "Родители", icon: Baby }
  ];

  return (
    <section className="py-20 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4">Возможности системы</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Инструменты для организаций, специалистов частной практики и родителей
          </p>
        </div>
        
        {/* Filter buttons */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {filterButtons.map((btn) => (
            <button
              key={btn.key ?? "all"}
              onClick={() => setActiveFilter(btn.key)}
              className={`
                flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all
                ${activeFilter === btn.key 
                  ? "bg-primary text-primary-foreground shadow-md" 
                  : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground"
                }
              `}
            >
              {btn.icon && <btn.icon className="h-4 w-4" />}
              {btn.label}
              <span className={`
                ml-1 text-xs px-1.5 py-0.5 rounded-full
                ${activeFilter === btn.key 
                  ? "bg-primary-foreground/20 text-primary-foreground" 
                  : "bg-background text-muted-foreground"
                }
              `}>
                {btn.key === null 
                  ? features.length 
                  : features.filter(f => f.audience.includes(btn.key!)).length
                }
              </span>
            </button>
          ))}
        </div>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFeatures.map((feature) => (
            <Card key={feature.title} className="hover:shadow-md transition-all relative overflow-hidden animate-in fade-in-0 duration-300">
              {feature.isNew && (
                <div className="absolute top-3 right-3">
                  <Badge variant="success" className="text-[10px] px-2">
                    NEW
                  </Badge>
                </div>
              )}
              <CardHeader className="pb-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg flex items-center gap-2">
                  {feature.title}
                </CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-1">
                  {feature.audience.map((aud) => (
                    <span 
                      key={aud} 
                      className={`text-[10px] px-1.5 py-0.5 rounded cursor-pointer transition-all hover:scale-105 ${audienceLabels[aud].color}`}
                      onClick={() => setActiveFilter(aud)}
                    >
                      {audienceLabels[aud].label}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {filteredFeatures.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            Нет функций для выбранной категории
          </div>
        )}
      </div>
    </section>
  );
}

export default function Landing() {
  useSeoMeta({
    title: "universum. — Автоматизация ППк, расписание и сопровождение детей",
    description: "Платформа для психолого-педагогических консилиумов, специалистов (психолог, логопед, дефектолог) и родителей. Протоколы ППк, расписание занятий, карты детей — в одном месте. Соответствие ФЗ-152.",
    canonical: "/landing",
    keywords: "ППк, психолого-педагогический консилиум, ЦППМСП, ППМС-центр, протоколы ППк, психолог школы, логопед, дефектолог, расписание занятий, сопровождение детей",
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "universum.",
        "applicationCategory": "EducationalApplication",
        "operatingSystem": "Web",
        "url": "https://ppk.lovable.app",
        "description": "Платформа комплексной поддержки и развития детей: автоматизация ППк, расписание специалистов, карты детей, тесты развития.",
        "publisher": {
          "@type": "Organization",
          "name": "universum.",
          "url": "https://ppk.lovable.app"
        }
      }
    ]
  });

  return (
    <div className="min-h-screen bg-background">
      <PublicNavbar currentPage="landing" />

      {/* Hero Section */}
      <section className="pt-24 md:pt-40 pb-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <Badge variant="secondary" className="mb-6">
            Развитие. Для каждого
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            universum.
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Инновационная платформа для комплексной поддержки и развития детей. Технологии, которые работают на благо каждого ребенка.
          </p>
          <Button 
            size="lg" 
            className="gap-2"
            onClick={() => document.getElementById('user-types')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Начать работу
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* User Types Section */}
      <section id="user-types" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Выберите свой кабинет</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Три типа пользователей — три специализированных интерфейса для эффективной работы
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {userTypes.map((type) => (
              <Card 
                key={type.title} 
                className={`relative overflow-hidden border-2 ${type.borderColor} hover:shadow-lg transition-all group`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${type.color} opacity-50`} />
                <CardHeader className="relative">
                  <div className="h-12 w-12 rounded-xl bg-background/80 backdrop-blur flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <type.icon className="h-6 w-6" />
                  </div>
                  <CardTitle>{type.title}</CardTitle>
                  <CardDescription>{type.description}</CardDescription>
                </CardHeader>
                <CardContent className="relative space-y-4">
                  <ul className="space-y-2">
                    {type.features.map((feature) => (
                      <li key={typeof feature === 'string' ? feature : feature.text} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <span className="flex items-center gap-1.5">
                          {typeof feature === 'string' ? feature : feature.text}
                          {typeof feature === 'object' && feature.isNew && (
                            <Badge variant="success" className="text-[10px] px-1.5 py-0">
                              NEW
                            </Badge>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex gap-2 pt-4">
                    <Link to={type.link} className="flex-1">
                      <Button variant="outline" className="w-full" size="sm">
                        Подробнее
                      </Button>
                    </Link>
                    <Link to={type.authLink} className="flex-1">
                      <Button className="w-full" size="sm">
                        Войти
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <FeaturesSection />

      {/* How It Works Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Как это работает</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Четыре ключевых модуля для комплексного сопровождения развития ребёнка
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {howItWorks.map((item, index) => (
              <Card key={item.title} className="relative overflow-hidden hover:shadow-lg transition-all group text-center">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/60 to-primary/20" />
                <CardHeader className="pb-2">
                  <div className="mx-auto h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <item.icon className="h-7 w-7 text-primary" />
                  </div>
                  <div className="absolute top-4 right-4 h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground">
                    {index + 1}
                  </div>
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">
                    {item.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <PricingSection />

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary/5">
        <div className="container mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold mb-4">Готовы начать?</h2>
          <p className="text-muted-foreground mb-8">
            Зарегистрируйтесь и получите 7 дней бесплатного доступа ко всем функциям системы
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center flex-wrap">
            <Link to="/auth">
              <Button size="lg" className="gap-2">
                <Building2 className="h-4 w-4" />
                Для организаций
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="lg" variant="secondary" className="gap-2">
                <GraduationCap className="h-4 w-4" />
                Для педагогов
              </Button>
            </Link>
            <Link to="/parent-auth">
              <Button size="lg" variant="outline" className="gap-2">
                <Baby className="h-4 w-4" />
                Для родителей
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Partners Section */}
      <section className="py-10 px-4 border-t">
        <div className="container mx-auto max-w-4xl">
          <p className="text-center text-sm text-muted-foreground mb-6">Наши партнёры</p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
            <a 
              href="https://info.youcanread.ru" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group transition-all hover:scale-105"
            >
              <img 
                src="/assets/partners/youcanread-logo.svg" 
                alt="Читай сам" 
                className="h-6 md:h-8 w-auto opacity-60 group-hover:opacity-100 transition-opacity dark:invert"
              />
            </a>
            <a 
              href="https://лабсс.рф" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group transition-all hover:scale-105"
            >
              <img 
                src="/assets/partners/labss-logo.png" 
                alt="ЛАБСС" 
                className="h-8 md:h-10 w-auto opacity-60 group-hover:opacity-100 transition-opacity"
              />
            </a>
          </div>
        </div>
      </section>

      <LandingFooter />

      <CookieConsent />
    </div>
  );
}
