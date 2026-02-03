import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { 
  Users, GraduationCap, Building2, Baby, 
  ClipboardList, Calendar, FileText, Shield, 
  CheckCircle, Star, ArrowRight, Phone, Mail,
  BarChart3, UserCheck, BookOpen, Heart
} from "lucide-react";

const features = [
  {
    icon: ClipboardList,
    title: "Протоколы ППк",
    description: "Автоматизация психолого-педагогических консилиумов с генерацией заключений"
  },
  {
    icon: Calendar,
    title: "Журнал учёта занятий",
    description: "Планирование, учёт посещаемости и статистика работы специалистов"
  },
  {
    icon: FileText,
    title: "Карта ребёнка",
    description: "Централизованное хранение истории развития и рекомендаций"
  },
  {
    icon: BarChart3,
    title: "Аналитика и отчёты",
    description: "Статистика по организации, специалистам и результатам работы"
  },
  {
    icon: UserCheck,
    title: "Управление сотрудниками",
    description: "Контроль доступа, права и нагрузка специалистов"
  },
  {
    icon: Shield,
    title: "Безопасность данных",
    description: "Соответствие ФЗ-152, шифрование и хранение в РФ"
  }
];

const userTypes = [
  {
    icon: Building2,
    title: "Для организаций",
    description: "Школы, детские сады, ППМС-центры",
    features: ["Управление сотрудниками", "Протоколы ППк", "Журнал занятий", "Аналитика"],
    link: "/for-organizations",
    authLink: "/auth",
    color: "from-blue-500/20 to-blue-600/10",
    borderColor: "border-blue-500/30"
  },
  {
    icon: GraduationCap,
    title: "Для педагогов",
    description: "Психологи, логопеды, дефектологи",
    features: ["Личный кабинет", "Ведение документации", "Расписание", "Карты детей"],
    link: "/for-specialists",
    authLink: "/auth",
    color: "from-orange-500/20 to-orange-600/10",
    borderColor: "border-orange-500/30"
  },
  {
    icon: Baby,
    title: "Для родителей",
    description: "Личный кабинет законного представителя",
    features: ["Запись на консультацию", "Тесты развития", "Расписание занятий", "Рекомендации"],
    link: "/for-parents",
    authLink: "/parent-auth",
    color: "from-pink-500/20 to-pink-600/10",
    borderColor: "border-pink-500/30"
  }
];

const pricing = [
  {
    title: "Ежемесячная",
    price: "2 500 ₽",
    period: "/ месяц",
    description: "Гибкость оплаты",
    features: ["Полный функционал", "Техническая поддержка", "Обновления системы", "Хранение данных"]
  },
  {
    title: "Годовая",
    price: "25 500 ₽",
    period: "/ год",
    description: "Экономия 15%",
    badge: "Выгодно",
    features: ["Полный функционал", "Приоритетная поддержка", "Обновления системы", "Хранение данных", "Экономия ~4 500 ₽"]
  }
];

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
            <Link to="#pricing">
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
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        {feature}
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
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Возможности системы</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Полный набор инструментов для автоматизации работы психолого-педагогической службы
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

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

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Стоимость для организаций</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Прозрачное ценообразование. 7 дней бесплатного пробного периода для новых пользователей.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {pricing.map((plan) => (
              <Card key={plan.title} className={`relative ${plan.badge ? "border-primary border-2" : ""}`}>
                {plan.badge && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                    {plan.badge}
                  </Badge>
                )}
                <CardHeader className="text-center pb-2">
                  <CardTitle>{plan.title}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="pt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link to="/auth">
                    <Button className="w-full" variant={plan.badge ? "default" : "outline"}>
                      Начать бесплатно
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <p className="text-center text-sm text-muted-foreground mt-8">
            Для родителей — личный кабинет <span className="font-medium text-foreground">бесплатно</span>
          </p>
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
          <div className="grid md:grid-cols-4 gap-8">
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
                <li><Link to="/for-organizations" className="hover:text-foreground">Организациям</Link></li>
                <li><Link to="/for-specialists" className="hover:text-foreground">Педагогам</Link></li>
                <li><Link to="/for-parents" className="hover:text-foreground">Родителям</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-4">Компания</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>ИП Загладин В.С.</li>
                <li>ИНН: 770702169499</li>
                <li>ОГРНИП: 323774600132891</li>
                <li className="pt-2">
                  <Link to="/privacy-policy" className="hover:text-foreground underline underline-offset-4">
                    Политика конфиденциальности
                  </Link>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-4">Контакты</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  info@profilaktika.site
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Пн-Пт, 10:00-18:00 МСК
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} universum. Все права защищены.
          </div>
        </div>
      </footer>
    </div>
  );
}
