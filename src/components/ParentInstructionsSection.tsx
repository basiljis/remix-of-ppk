import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  BookOpen, 
  Users, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  Search,
  Lightbulb,
  Target,
  HelpCircle,
  Calendar,
  ClipboardList,
  Phone,
  Baby,
  Shield,
  Heart,
  MessageCircle,
  Bell,
  Eye
} from "lucide-react";

// Типы контента для визуальных подсказок
const contentTypes = {
  step: { icon: Target, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800" },
  tip: { icon: Lightbulb, color: "text-yellow-500", bg: "bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800" },
  warning: { icon: AlertTriangle, color: "text-red-500", bg: "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800" },
  success: { icon: CheckCircle, color: "text-green-500", bg: "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800" },
  info: { icon: HelpCircle, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800" },
};

export function ParentInstructionsSection() {
  const [searchQuery, setSearchQuery] = useState("");

  // Инструкции для родителей
  const instructionsData = [
    {
      id: "children-section",
      category: "Раздел «Мои дети»",
      icon: Baby,
      items: [
        {
          title: "Добавление ребёнка",
          type: "step",
          content: `Чтобы добавить ребёнка в систему:
• Нажмите кнопку «Добавить ребёнка»
• Заполните ФИО ребёнка (обязательное поле)
• Укажите пол и дату рождения
• Выберите уровень образования и класс/группу
• Укажите образовательную организацию (если известна)`,
          note: "Каждому ребёнку присваивается уникальный идентификатор. Сообщите его специалисту для связи данных.",
          noteType: "info"
        },
        {
          title: "Редактирование данных",
          type: "step",
          content: `Для изменения информации о ребёнке:
• Нажмите на кнопку редактирования (карандаш) в карточке ребёнка
• Внесите необходимые изменения
• Сохраните данные`,
        },
        {
          title: "Уникальный идентификатор",
          type: "tip",
          content: `Каждому ребёнку присваивается уникальный ID. Он нужен для связи с организацией и специалистами. Скопируйте его и передайте специалисту при первом обращении.`,
        },
      ]
    },
    {
      id: "tests-section",
      category: "Раздел «Тесты»",
      icon: ClipboardList,
      items: [
        {
          title: "Прохождение тестов",
          type: "step",
          content: `Тесты помогают специалистам лучше понять ситуацию:
• Выберите ребёнка для прохождения теста
• Отвечайте на вопросы честно и внимательно
• После завершения вы увидите результаты
• Результаты сохраняются и доступны специалистам`,
        },
        {
          title: "Виды тестов",
          type: "info",
          content: `В системе доступны различные опросники:
• Опросник родительского стресса (PSI-SF)
• Тесты на выявление особенностей развития
• Анкеты для оценки готовности к школе`,
        },
        {
          title: "Рекомендации по результатам",
          type: "tip",
          content: `После прохождения теста система формирует предварительные рекомендации. Обсудите их со специалистом на консультации для получения профессиональной интерпретации.`,
          note: "Результаты тестов не являются диагнозом. Обязательно проконсультируйтесь со специалистом.",
          noteType: "warning"
        },
      ]
    },
    {
      id: "calendar-section",
      category: "Раздел «Календарь занятий»",
      icon: Calendar,
      items: [
        {
          title: "Просмотр расписания",
          type: "step",
          content: `В календаре отображаются все занятия ваших детей:
• Переключайтесь между видами: неделя или месяц
• Цветовая индикация показывает статус занятий
• Нажмите на занятие для просмотра деталей`,
        },
        {
          title: "Запись на консультацию",
          type: "step",
          content: `Чтобы записаться на консультацию:
• Нажмите кнопку «Записаться на консультацию»
• Выберите способ поиска: по организации или специалисту
• Выберите удобное время из доступных слотов
• Укажите ребёнка и при необходимости добавьте комментарий`,
        },
        {
          title: "Статусы занятий",
          type: "info",
          content: `Занятия имеют разные статусы:
• Зелёный — проведено
• Синий — запланировано
• Жёлтый — ожидает подтверждения
• Серый — отменено`,
        },
      ]
    },
    {
      id: "consultations",
      category: "Запись к специалисту",
      icon: Phone,
      items: [
        {
          title: "Поиск по организации",
          type: "step",
          content: `Если вы знаете организацию:
• Выберите вкладку «В организацию»
• Используйте поиск по названию или адресу
• Отфильтруйте по округу (для Москвы)
• Выберите организацию и доступное время`,
        },
        {
          title: "Поиск по специалисту",
          type: "step",
          content: `Для записи к конкретному специалисту:
• Выберите вкладку «К специалисту»
• Используйте фильтр по специальности
• Просмотрите карточки специалистов с фото
• Выберите подходящего специалиста и время`,
          note: "Доступны специалисты из организаций и частной практики.",
          noteType: "info"
        },
        {
          title: "Подтверждение записи",
          type: "success",
          content: `После выбора слота:
• Выберите ребёнка для записи
• При необходимости добавьте комментарий о причине обращения
• Нажмите «Записаться» для подтверждения
• Занятие появится в вашем календаре`,
        },
      ]
    },
    {
      id: "notifications",
      category: "Уведомления",
      icon: Bell,
      items: [
        {
          title: "Виды уведомлений",
          type: "info",
          content: `Система отправляет уведомления о:
• Напоминаниях о предстоящих занятиях
• Изменениях в расписании
• Результатах тестов
• Важных событиях`,
        },
        {
          title: "Настройка уведомлений",
          type: "step",
          content: `В разделе «Профиль» можно настроить:
• Включение/выключение email-уведомлений
• Предпочтительное время напоминаний`,
        },
      ]
    },
    {
      id: "privacy",
      category: "Конфиденциальность данных",
      icon: Shield,
      items: [
        {
          title: "Защита персональных данных",
          type: "info",
          content: `Система соответствует требованиям ФЗ-152:
• Все данные хранятся на защищённых серверах в России
• Доступ к данным имеют только авторизованные специалисты
• Передача данных осуществляется по защищённым каналам`,
        },
        {
          title: "Согласие на обработку",
          type: "warning",
          content: `При регистрации вы даёте согласие на обработку персональных данных. Вы можете:
• Просмотреть, какие данные хранятся
• Запросить изменение или удаление данных
• Отозвать согласие (с прекращением доступа к сервису)`,
        },
        {
          title: "Кто видит данные ребёнка",
          type: "info",
          content: `Данные вашего ребёнка доступны:
• Вам (родителю/законному представителю)
• Специалистам организаций, к которым вы обратились
• Только в рамках оказания психолого-педагогической помощи`,
        },
      ]
    },
    {
      id: "faq",
      category: "Частые вопросы",
      icon: HelpCircle,
      items: [
        {
          title: "Как изменить регион?",
          type: "step",
          content: `В разделе «Профиль» нажмите кнопку редактирования рядом с регионом. Выберите новый регион из списка и сохраните изменения. После этого обновится список доступных организаций.`,
        },
        {
          title: "Что делать, если не нашёл организацию?",
          type: "tip",
          content: `Проверьте правильность выбранного региона. Если организация всё равно не отображается, возможно, она ещё не зарегистрирована в системе. Свяжитесь с организацией напрямую.`,
        },
        {
          title: "Как отменить запись?",
          type: "step",
          content: `Для отмены записи на консультацию свяжитесь с организацией или специалистом напрямую. Функция самостоятельной отмены появится в ближайших обновлениях.`,
        },
        {
          title: "Кто может видеть результаты тестов?",
          type: "info",
          content: `Результаты тестов видны вам и специалистам организаций, с которыми связан ваш ребёнок. Вы можете управлять доступом в настройках каждого результата.`,
        },
      ]
    },
  ];

  // Фильтрация по поисковому запросу
  const filteredInstructions = useMemo(() => {
    if (!searchQuery.trim()) return instructionsData;

    const query = searchQuery.toLowerCase();
    return instructionsData
      .map(category => ({
        ...category,
        items: category.items.filter(item =>
          item.title.toLowerCase().includes(query) ||
          item.content.toLowerCase().includes(query) ||
          category.category.toLowerCase().includes(query)
        )
      }))
      .filter(category => category.items.length > 0);
  }, [searchQuery]);

  const renderContentItem = (item: any, index: number) => {
    const typeConfig = contentTypes[item.type as keyof typeof contentTypes] || contentTypes.info;
    const Icon = typeConfig.icon;

    return (
      <AccordionItem key={index} value={`item-${index}`} className="border-b last:border-b-0">
        <AccordionTrigger className="hover:no-underline py-3 px-4">
          <div className="flex items-center gap-3 text-left">
            <div className={`p-1.5 rounded-md ${typeConfig.bg}`}>
              <Icon className={`h-4 w-4 ${typeConfig.color}`} />
            </div>
            <span className="font-medium text-sm">{item.title}</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-4">
          <div className="space-y-3 pl-10">
            <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
              {item.content}
            </p>
            {item.note && (
              <div className={`p-3 rounded-lg border ${contentTypes[item.noteType as keyof typeof contentTypes]?.bg || 'bg-muted'}`}>
                <div className="flex items-start gap-2">
                  {item.noteType && (
                    <AlertTriangle className={`h-4 w-4 mt-0.5 flex-shrink-0 ${contentTypes[item.noteType as keyof typeof contentTypes]?.color || 'text-muted-foreground'}`} />
                  )}
                  <p className="text-sm">{item.note}</p>
                </div>
              </div>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-pink-600" />
            Инструкции
          </h2>
          <p className="text-muted-foreground">Справочная информация по работе с личным кабинетом</p>
        </div>
      </div>

      {/* Поиск */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Поиск по инструкциям..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Список инструкций */}
      <div className="grid gap-4 md:grid-cols-2">
        {filteredInstructions.map((category) => {
          const CategoryIcon = category.icon;
          return (
            <Card key={category.id} className="overflow-hidden">
              <CardHeader className="pb-3 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-950/20 dark:to-purple-950/20">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CategoryIcon className="h-5 w-5 text-pink-600" />
                  {category.category}
                  <Badge variant="secondary" className="ml-auto">
                    {category.items.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="max-h-[400px]">
                  <Accordion type="single" collapsible className="w-full">
                    {category.items.map((item, index) => renderContentItem(item, index))}
                  </Accordion>
                </ScrollArea>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredInstructions.length === 0 && (
        <Card className="p-8 text-center">
          <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">По запросу «{searchQuery}» ничего не найдено</p>
        </Card>
      )}
    </div>
  );
}
