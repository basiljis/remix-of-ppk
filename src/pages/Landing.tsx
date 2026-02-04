import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import CookieConsent from "@/components/CookieConsent";
import { 
  GraduationCap, Building2, Baby, 
  ClipboardList, Calendar, FileText, Shield, 
  CheckCircle, ArrowRight, Phone, Mail,
  BarChart3, UserCheck, Heart, Gamepad2, 
  BookOpen, CalendarCheck, Bell, Users, Target
} from "lucide-react";

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
      { text: "Сравнительная аналитика", isNew: true }
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
      { text: "Личный кабинет и расписание" },
      { text: "Протоколы и карты детей" },
      { text: "Онлайн-запись клиентов", isNew: true },
      { text: "Персональный KPI", isNew: true }
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
      { text: "Запись на консультацию", isNew: true },
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
            Полный набор инструментов для автоматизации работы психолого-педагогической службы
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
                  <Badge className="bg-green-500 hover:bg-green-600 text-white text-[10px] px-2">
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
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
              <Heart className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">universum.</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/for-organizations" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Организациям
            </Link>
            <Link to="/for-specialists" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Педагогам
            </Link>
            <Link to="/for-parents" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Родителям
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link to="/auth">
              <Button variant="outline" size="sm">Вход</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <Badge variant="secondary" className="mb-6">
            Развитие. Для каждого
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            universum.
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Экосистема для психолого-педагогического сопровождения детей в образовательных организациях и частной практике
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" className="gap-2">
                Начать работу
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/for-organizations#pricing">
              <Button size="lg" variant="outline">
                Узнать стоимость
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* User Types Section */}
      <section className="py-20 px-4 bg-muted/30">
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
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
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

      {/* Screenshots/Preview Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Как это работает</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Интуитивный интерфейс, адаптированный под потребности специалистов
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="overflow-hidden">
              <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <div className="text-center p-6">
                  <ClipboardList className="h-16 w-16 mx-auto mb-4 text-primary/60" />
                  <p className="text-lg font-medium">Протоколы ППк</p>
                  <p className="text-sm text-muted-foreground">Автоматизация документооборота</p>
                </div>
              </div>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">
                  Создание протоколов за минуты вместо часов. Автоматическое формирование заключений на основе чек-листов.
                </p>
              </CardContent>
            </Card>
            
            <Card className="overflow-hidden">
              <div className="aspect-video bg-gradient-to-br from-orange-500/20 to-orange-500/5 flex items-center justify-center">
                <div className="text-center p-6">
                  <Calendar className="h-16 w-16 mx-auto mb-4 text-orange-500/60" />
                  <p className="text-lg font-medium">Журнал занятий</p>
                  <p className="text-sm text-muted-foreground">Планирование и учёт</p>
                </div>
              </div>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">
                  Полный контроль расписания, учёт посещаемости и автоматическая статистика нагрузки специалистов.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>


      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary/5">
        <div className="container mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold mb-4">Готовы начать?</h2>
          <p className="text-muted-foreground mb-8">
            Зарегистрируйтесь и получите 7 дней бесплатного доступа ко всем функциям системы
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" className="gap-2">
                <Building2 className="h-4 w-4" />
                Для организаций
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

      {/* Footer */}
      <footer className="border-t py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <Link to="/" className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                  <Heart className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold">universum.</span>
              </Link>
              <p className="text-sm text-muted-foreground">
                Развитие. Для каждого.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-4">Продукт</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/for-organizations" className="hover:text-foreground transition-colors">Организациям</Link></li>
                <li><Link to="/for-specialists" className="hover:text-foreground transition-colors">Педагогам</Link></li>
                <li><Link to="/for-parents" className="hover:text-foreground transition-colors">Родителям</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-4">Контакты</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4 flex-shrink-0" />
                  info@profilaktika.site
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4 flex-shrink-0" />
                  Пн-Пт, 10:00-18:00 МСК
                </li>
              </ul>
              <div className="mt-4 pt-4 border-t border-border/50">
                <p className="text-xs text-muted-foreground">ИП Загладин В.С.</p>
                <p className="text-xs text-muted-foreground">ИНН: 770702169499</p>
                <p className="text-xs text-muted-foreground">ОГРНИП: 323774600132891</p>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-4">Документы</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link 
                    to="/privacy-policy" 
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
                  >
                    <FileText className="h-4 w-4 flex-shrink-0 group-hover:text-primary transition-colors" />
                    <span>Политика конфиденциальности</span>
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/partnership-offer" 
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
                  >
                    <FileText className="h-4 w-4 flex-shrink-0 group-hover:text-primary transition-colors" />
                    <span>Партнёрская программа</span>
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} universum. Все права защищены.</p>
            <div className="flex gap-4">
              <Link to="/privacy-policy" className="hover:text-foreground transition-colors">Конфиденциальность</Link>
              <Link to="/partnership-offer" className="hover:text-foreground transition-colors">Партнёрство</Link>
            </div>
          </div>
        </div>
      </footer>

      <CookieConsent />
    </div>
  );
}
