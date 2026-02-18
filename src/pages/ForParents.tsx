import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import LandingFooter from "@/components/LandingFooter";
import { PublicNavbar } from "@/components/PublicNavbar";
import { useSeoMeta } from "@/hooks/useSeoMeta";
import { 
  Baby, Calendar, ClipboardList, FileText, 
  Bell, CheckCircle, ArrowRight, ChevronLeft,
  Phone, Shield, BookOpen, BarChart3, Target, UserCheck, Gamepad2
} from "lucide-react";

const features = [
  {
    icon: Target,
    title: "Подбор специалиста",
    description: "Система рекомендует педагогов на основе результатов диагностики — точно по проблематике вашего ребёнка.",
    isNew: true
  },
  {
    icon: Calendar,
    title: "Запись на консультацию",
    description: "Выбирайте удобное время для встречи со специалистом. Поиск по организациям, направлениям работы или конкретным педагогам."
  },
  {
    icon: ClipboardList,
    title: "Тесты развития",
    description: "Проходите диагностические тесты для оценки развития ребёнка. Результаты доступны специалистам по вашему согласию."
  },
  {
    icon: Gamepad2,
    title: "Игровая ребёнка",
    description: "Развивающие игры и упражнения, подобранные под возраст ребёнка, с отслеживанием прогресса.",
    isNew: true
  },
  {
    icon: Bell,
    title: "Уведомления",
    description: "Получайте напоминания о предстоящих занятиях, готовых протоколах и рекомендациях."
  },
  {
    icon: BookOpen,
    title: "Библиотека материалов",
    description: "Статьи и рекомендации, подобранные для возраста и особенностей развития вашего ребёнка.",
    isNew: true
  },
  {
    icon: Shield,
    title: "Защита данных",
    description: "Вы контролируете, какую информацию видят специалисты. Полное соответствие ФЗ-152."
  }
];

const steps = [
  {
    number: "1",
    title: "Зарегистрируйтесь",
    description: "Укажите ФИО, email и телефон. Регистрация занимает 1 минуту."
  },
  {
    number: "2",
    title: "Добавьте ребёнка",
    description: "Укажите данные ребёнка: имя, дату рождения, класс или группу."
  },
  {
    number: "3",
    title: "Свяжитесь со специалистом",
    description: "Передайте код ребёнка в организацию или педагогу. При необходимости запишитесь на консультацию."
  },
  {
    number: "4",
    title: "Пользуйтесь",
    description: "Проходите тесты, заполняйте чек-листы, изучайте статьи и играйте в развивающие игры."
  }
];

export default function ForParents() {
  useSeoMeta({
    title: "Личный кабинет родителя — следите за развитием ребёнка | universum.",
    description: "Личный кабинет для родителей: подбор специалиста, запись на консультацию, тесты развития ребёнка, доступ к результатам ППк. Полностью бесплатно.",
    canonical: "/for-parents",
    keywords: "личный кабинет родителя, развитие ребёнка, запись к логопеду, тест развития дошкольника, психолог для ребёнка, ОВЗ родителям",
  });

  return (
    <div className="min-h-screen bg-background">
      <PublicNavbar currentPage="parents" />

      {/* Hero */}
      <section className="pt-40 pb-16 px-4 bg-gradient-to-br from-pink-500/10 to-pink-600/5">
        <div className="container mx-auto max-w-4xl">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
            <ChevronLeft className="h-4 w-4" />
            На главную
          </Link>
          
          <div className="flex items-center gap-4 mb-6">
            <div className="h-16 w-16 rounded-2xl bg-pink-500/20 flex items-center justify-center">
              <Baby className="h-8 w-8 text-pink-600" />
            </div>
            <div>
              <Badge variant="secondary" className="mb-2 bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300">
                Для родителей
              </Badge>
              <h1 className="text-3xl md:text-4xl font-bold">
                Личный кабинет родителя
              </h1>
            </div>
          </div>
          
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl">
            Следите за развитием ребёнка, записывайтесь на консультации к специалистам 
            и получайте рекомендации — всё в одном месте.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/parent-auth">
              <Button size="lg" className="gap-2 bg-pink-600 hover:bg-pink-700">
                Создать кабинет
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          
          <div className="mt-6 flex items-center gap-2">
            <Badge variant="outline" className="text-green-600 border-green-600">
              <CheckCircle className="h-3 w-3 mr-1" />
              Бесплатно
            </Badge>
            <span className="text-sm text-muted-foreground">
              Личный кабинет родителя полностью бесплатен
            </span>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold mb-8 text-center">Как это работает</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step) => (
              <div key={step.number} className="text-center">
                <div className="h-12 w-12 rounded-full bg-pink-500/20 flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold text-pink-600">{step.number}</span>
                </div>
                <h3 className="font-medium mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-2xl font-bold mb-8 text-center">Возможности личного кабинета</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="relative overflow-hidden">
                {(feature as any).isNew && (
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-green-500 hover:bg-green-600 text-white text-[10px] px-2">NEW</Badge>
                  </div>
                )}
                <CardHeader>
                  <div className="h-10 w-10 rounded-lg bg-pink-500/10 flex items-center justify-center mb-2">
                    <feature.icon className="h-5 w-5 text-pink-600" />
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

      {/* Consultation booking */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-2xl font-bold mb-4">Запись на консультацию</h2>
              <p className="text-muted-foreground mb-6">
                Найдите подходящего специалиста и запишитесь на удобное время. 
                Вы можете искать:
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium">По проблеме ребёнка</span>
                    <p className="text-sm text-muted-foreground">Система подберёт специалистов, работающих с выявленной проблематикой на основе ваших тестов и протоколов</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium">По организации</span>
                    <p className="text-sm text-muted-foreground">Выберите школу или центр и посмотрите доступных специалистов</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium">По специалисту</span>
                    <p className="text-sm text-muted-foreground">Откройте профиль педагога с описанием, образованием и направлениями работы</p>
                  </div>
                </li>
              </ul>
            </div>
            <Card className="bg-gradient-to-br from-pink-500/10 to-pink-600/5 border-pink-500/20">
              <CardContent className="p-8 text-center">
                <Phone className="h-12 w-12 mx-auto mb-4 text-pink-600" />
                <h3 className="text-lg font-medium mb-2">Онлайн-запись</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Выберите специалиста, дату и время — подтверждение придёт на email
                </p>
                <Link to="/parent-auth">
                  <Button className="bg-pink-600 hover:bg-pink-700">
                    Записаться
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Privacy */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-3xl text-center">
          <Shield className="h-12 w-12 mx-auto mb-4 text-primary" />
          <h2 className="text-2xl font-bold mb-4">Ваши данные защищены</h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Мы соблюдаем все требования ФЗ-152 о персональных данных. 
            Вы сами решаете, какую информацию предоставить специалистам.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Badge variant="outline" className="py-2 px-4">
              <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
              Шифрование данных
            </Badge>
            <Badge variant="outline" className="py-2 px-4">
              <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
              Хранение в РФ
            </Badge>
            <Badge variant="outline" className="py-2 px-4">
              <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
              Контроль доступа
            </Badge>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-pink-500/5">
        <div className="container mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold mb-4">Создайте личный кабинет</h2>
          <p className="text-muted-foreground mb-6">
            Регистрация занимает 1 минуту. Это бесплатно.
          </p>
          <Link to="/parent-auth">
            <Button size="lg" className="bg-pink-600 hover:bg-pink-700">
              Зарегистрироваться
            </Button>
          </Link>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
