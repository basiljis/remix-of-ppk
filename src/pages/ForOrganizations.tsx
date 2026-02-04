import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import LandingFooter from "@/components/LandingFooter";
import { PublicNavbar } from "@/components/PublicNavbar";
import { 
  Building2, Users, ClipboardList, Calendar, BarChart3, 
  Shield, FileText, UserCheck, CheckCircle, ArrowRight,
  Settings, Bell, ChevronLeft
} from "lucide-react";

const features = [
  {
    icon: ClipboardList,
    title: "Протоколы ППк",
    description: "Автоматизированное ведение психолого-педагогических консилиумов. Генерация заключений по чек-листам, соответствующим приказу ДОНМ №666."
  },
  {
    icon: Calendar,
    title: "Журнал учёта занятий",
    description: "Полный контроль расписания специалистов. Учёт посещаемости, групповые и индивидуальные занятия."
  },
  {
    icon: Users,
    title: "Управление сотрудниками",
    description: "Гибкая система ролей: директор, администратор организации, специалисты. Настройка прав доступа."
  },
  {
    icon: BarChart3,
    title: "Аналитика и отчёты",
    description: "Статистика по организации, нагрузка специалистов, динамика показателей. Экспорт в Excel."
  },
  {
    icon: FileText,
    title: "Карты детей",
    description: "Централизованное хранение информации о развитии детей. История протоколов и рекомендаций."
  },
  {
    icon: UserCheck,
    title: "Контроль качества",
    description: "KPI специалистов, отслеживание выполнения рекомендаций, контроль сроков."
  },
  {
    icon: Bell,
    title: "Уведомления",
    description: "Автоматические напоминания о занятиях, истекающих подписках и важных событиях."
  },
  {
    icon: Shield,
    title: "Безопасность",
    description: "Соответствие ФЗ-152. Шифрование данных, хранение в РФ, регулярное резервное копирование."
  }
];

const benefits = [
  "Сокращение времени на документооборот в 3-5 раз",
  "Единая база данных по всем детям организации",
  "Прозрачность работы психолого-педагогической службы",
  "Автоматические отчёты для проверяющих органов",
  "Интеграция с личными кабинетами родителей"
];

const pricing = [
  {
    title: "Ежемесячная",
    price: "2 500 ₽",
    period: "/ месяц",
    description: "Оплата помесячно"
  },
  {
    title: "Годовая",
    price: "25 500 ₽",
    period: "/ год",
    description: "Экономия 15%",
    badge: "Выгодно"
  }
];

export default function ForOrganizations() {
  return (
    <div className="min-h-screen bg-background">
      <PublicNavbar currentPage="organizations" />

      {/* Hero */}
      <section className="pt-40 pb-16 px-4 bg-gradient-to-br from-blue-500/10 to-blue-600/5">
        <div className="container mx-auto max-w-4xl">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
            <ChevronLeft className="h-4 w-4" />
            На главную
          </Link>
          
          <div className="flex items-center gap-4 mb-6">
            <div className="h-16 w-16 rounded-2xl bg-blue-500/20 flex items-center justify-center">
              <Building2 className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <Badge variant="secondary" className="mb-2">Для организаций</Badge>
              <h1 className="text-3xl md:text-4xl font-bold">
                Автоматизация ППС в образовательной организации
              </h1>
            </div>
          </div>
          
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl">
            Школы, детские сады и ППМС-центры используют universum. для ведения протоколов ППк, 
            учёта занятий и управления психолого-педагогической службой.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/auth">
              <Button size="lg" className="gap-2">
                Начать бесплатно
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="#pricing">
              <Button size="lg" variant="outline">
                Стоимость
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold mb-8">Преимущества для организации</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {benefits.map((benefit) => (
              <div key={benefit} className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-2xl font-bold mb-8 text-center">Функции для организаций</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <Card key={feature.title}>
                <CardHeader>
                  <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center mb-2">
                    <feature.icon className="h-5 w-5 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-16 px-4">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold mb-8 text-center">Стоимость подписки</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {pricing.map((plan) => (
              <Card key={plan.title} className={`relative ${plan.badge ? "border-blue-500 border-2" : ""}`}>
                {plan.badge && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600">
                    {plan.badge}
                  </Badge>
                )}
                <CardHeader className="text-center">
                  <CardTitle>{plan.title}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="pt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <Link to="/auth">
                    <Button className="w-full" variant={plan.badge ? "default" : "outline"}>
                      Попробовать 7 дней бесплатно
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground mt-6">
            Подписка распространяется на всех сотрудников организации
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-blue-500/5">
        <div className="container mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold mb-4">Остались вопросы?</h2>
          <p className="text-muted-foreground mb-6">
            Свяжитесь с нами для получения коммерческого предложения или демонстрации системы
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg">Зарегистрировать организацию</Button>
            </Link>
            <a href="mailto:info@profilaktika.site">
              <Button size="lg" variant="outline">Написать нам</Button>
            </a>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
