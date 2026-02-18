import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import LandingFooter from "@/components/LandingFooter";
import { PublicNavbar } from "@/components/PublicNavbar";
import { useSeoMeta } from "@/hooks/useSeoMeta";
import { 
  GraduationCap, ClipboardList, Calendar, FileText, 
  BarChart3, CheckCircle, ArrowRight, ChevronLeft,
  Users, Clock, BookOpen, Target
} from "lucide-react";

const features = [
  {
    icon: ClipboardList,
    title: "Протоколы ППк",
    description: "Создавайте протоколы психолого-педагогического консилиума за минуты. Автоматическое формирование заключений по чек-листам."
  },
  {
    icon: Calendar,
    title: "Личное расписание",
    description: "Управляйте своим графиком занятий. Индивидуальные и групповые сессии, учёт посещаемости."
  },
  {
    icon: FileText,
    title: "Карты детей",
    description: "Ведите историю развития каждого ребёнка. Все протоколы, рекомендации и динамика в одном месте."
  },
  {
    icon: Target,
    title: "Направления работы",
    description: "Укажите свои специализации (речь, когнитивное развитие, поведение и др.) — родители найдут вас по нужному направлению.",
    isNew: true
  },
  {
    icon: Users,
    title: "Публичный профиль",
    description: "Персональная страница с описанием, образованием и стоимостью услуг. Форматирование текста и множественные записи образования.",
    isNew: true
  },
  {
    icon: BarChart3,
    title: "Статистика и KPI",
    description: "Отслеживайте свою нагрузку, количество занятий и эффективность. Готовые отчёты за любой период."
  },
  {
    icon: BookOpen,
    title: "Инструкции и НПБ",
    description: "Методические материалы, нормативные документы и бизнес-процессы прямо в системе."
  },
  {
    icon: Target,
    title: "Рекомендации по результатам",
    description: "Система автоматически подбирает вас как специалиста родителям на основе выявленных проблем ребёнка.",
    isNew: true
  }
];

const roles = [
  {
    title: "Педагог-психолог",
    tasks: ["Диагностика", "Коррекционные занятия", "Консультирование", "Профилактика"]
  },
  {
    title: "Учитель-логопед",
    tasks: ["Речевая диагностика", "Коррекция звукопроизношения", "Развитие речи", "Логомассаж"]
  },
  {
    title: "Учитель-дефектолог",
    tasks: ["Дефектологическое обследование", "Коррекция ВПФ", "Сенсорное развитие", "Работа с ОВЗ"]
  },
  {
    title: "Социальный педагог",
    tasks: ["Сопровождение семей", "Профилактика", "Работа с документами", "Консультирование"]
  },
  {
    title: "Нейропсихолог",
    tasks: ["Нейропсихологическая диагностика", "Коррекция ВПФ", "Работа с вниманием и памятью", "Консультирование семей"]
  },
  {
    title: "Специалист АФК",
    tasks: ["Адаптивная физкультура", "Двигательная коррекция", "Работа с детьми с ОВЗ", "Сенсомоторное развитие"]
  }
];

export default function ForSpecialists() {
  useSeoMeta({
    title: "Для педагогов-психологов, логопедов и дефектологов — universum.",
    description: "Инструменты для специалистов ППС: протоколы ППк, журнал учёта занятий, карты детей, KPI и публичный профиль. Частная практика и работа в организации. Соответствие приказу ДОНМ №666.",
    canonical: "/for-specialists",
    keywords: "педагог-психолог, логопед, дефектолог, социальный педагог, протоколы ППк, журнал занятий, частная практика, ЦППМСП, ОВЗ",
  });

  return (
    <div className="min-h-screen bg-background">
      <PublicNavbar currentPage="specialists" />

      {/* Hero */}
      <section className="pt-40 pb-16 px-4 bg-gradient-to-br from-orange-500/10 to-orange-600/5">
        <div className="container mx-auto max-w-4xl">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
            <ChevronLeft className="h-4 w-4" />
            На главную
          </Link>
          
          <div className="flex items-center gap-4 mb-6">
            <div className="h-16 w-16 rounded-2xl bg-orange-500/20 flex items-center justify-center">
              <GraduationCap className="h-8 w-8 text-orange-600" />
            </div>
            <div>
              <Badge variant="secondary" className="mb-2">Для педагогов</Badge>
              <h1 className="text-3xl md:text-4xl font-bold">
                Платформа для педагогов и частных специалистов
              </h1>
            </div>
          </div>
          
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl">
            Для специалистов ППС в организациях и частных практиков — единая система ведения документации, расписания и карт развития детей.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/auth">
              <Button size="lg" className="gap-2 bg-orange-600 hover:bg-orange-700">
                Войти как специалист
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/auth?type=private">
              <Button size="lg" variant="outline" className="gap-2 border-orange-500/40 hover:bg-orange-500/10">
                Частная практика
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* For whom */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-2xl font-bold mb-8 text-center">Для кого создана система</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.map((role) => (
              <Card key={role.title}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{role.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {role.tasks.map((task) => (
                      <li key={task} className="text-sm text-muted-foreground flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        {task}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-2xl font-bold mb-8 text-center">Инструменты специалиста</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="relative overflow-hidden">
                {(feature as any).isNew && (
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-green-500 hover:bg-green-600 text-white text-[10px] px-2">NEW</Badge>
                  </div>
                )}
                <CardHeader>
                  <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center mb-2">
                    <feature.icon className="h-5 w-5 text-orange-600" />
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

      {/* Work modes */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold mb-8 text-center">Режимы работы</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-2 border-blue-500/30">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Users className="h-6 w-6 text-blue-600" />
                  <CardTitle>В составе организации</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Работайте в команде с коллегами. Доступ к общей базе детей, протоколам ППк и расписанию организации.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Совместная работа с детьми
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Участие в консилиумах
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Общий журнал занятий
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Стоимость услуг по решению администратора
                  </li>
                </ul>
              </CardContent>
            </Card>
            
            <Card className="border-2 border-orange-500/30">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Clock className="h-6 w-6 text-orange-600" />
                  <CardTitle>Частная практика</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Ведите собственную практику. Личный кабинет с расписанием, картами детей и публичным профилем.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Публичный профиль с описанием и образованием
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Направления работы и специализации
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Стоимость услуг на публичной странице
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Запись от родителей
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-orange-500/5">
        <div className="container mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold mb-4">Начните работу прямо сейчас</h2>
          <p className="text-muted-foreground mb-6">
            Регистрация занимает 2 минуты. После одобрения заявки вы получите полный доступ к системе.
          </p>
          <Link to="/auth">
            <Button size="lg" className="bg-orange-600 hover:bg-orange-700">
              Зарегистрироваться
            </Button>
          </Link>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
