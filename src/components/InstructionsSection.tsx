import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BookOpen, 
  Scale, 
  Users, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  Download,
  Search,
  BookMarked,
  Lightbulb,
  Target,
  Shield,
  TrendingUp,
  HelpCircle,
  CreditCard,
  Building2,
  Clock,
  Calendar,
  ClipboardList,
  Building,
  GitBranch
} from "lucide-react";
import { useInstructions } from "@/hooks/useInstructions";
import { Button } from "@/components/ui/button";
import { BusinessProcessTabs } from "@/components/BusinessProcessFlowchart";

interface InstructionsSectionProps {
  activeSubTab?: string;
}

// Типы контента для визуальных подсказок
const contentTypes = {
  step: { icon: Target, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800" },
  tip: { icon: Lightbulb, color: "text-yellow-500", bg: "bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800" },
  warning: { icon: AlertTriangle, color: "text-red-500", bg: "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800" },
  success: { icon: CheckCircle, color: "text-green-500", bg: "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800" },
  info: { icon: HelpCircle, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800" },
};

export const InstructionsSection = ({ activeSubTab = "ppk" }: InstructionsSectionProps) => {
  const { instructions: customInstructions, loading: customLoading } = useInstructions('custom');
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Инструкции по ППк
  const ppkInstructionsData = [
    {
      id: "getting-started",
      category: "Начало работы",
      icon: BookMarked,
      items: [
        {
          title: "Заполнение протокола ППк",
          type: "step",
          content: `Начните работу с заполнения протокола психолого-педагогического консилиума:
• Образовательная организация - выберите из списка ЕКИС
• Данные обучающегося - заполните ФИО, дату рождения, класс
• Специалисты - укажите состав консилиума
• Цели консилиума - опишите задачи обследования`,
          note: "Поля, отмеченные красным, являются обязательными для заполнения.",
          noteType: "warning"
        },
        {
          title: "Работа с чеклистами",
          type: "step",
          content: `Используйте чеклисты из базы данных для систематизации работы:
• Выберите уровень образования в разделе "Чеклисты"
• Проверьте все пункты диагностических процедур
• Отметьте выполненные задачи
• Используйте статистику для контроля прогресса`,
          note: "Чеклисты загружаются из базы данных и адаптируются под выбранный уровень.",
          noteType: "success"
        },
        {
          title: "Работа с организациями ЕКИС",
          type: "step",
          content: `Используйте данные из системы ЕКИС для выбора образовательных организаций:
• В протоколе система автоматически подгружает организации из ЕКИС
• Фильтруйте организации по округу и типу
• Используйте поиск для быстрого нахождения нужной организации
• Просматривайте актуальную информацию об организациях`,
          note: "При недоступности API используются резервные данные для продолжения работы.",
          noteType: "info"
        },
      ]
    },
    {
      id: "best-practices",
      category: "Эффективное использование",
      icon: TrendingUp,
      items: [
        {
          title: "Отслеживание прогресса",
          type: "tip",
          content: "Используйте панель статистики для контроля выполнения задач и готовности к консилиуму.",
        },
        {
          title: "Адаптация под конкретные случаи",
          type: "tip",
          content: "Дополнительные задачи можно отмечать как выполненные, но основные требования остаются неизменными.",
        },
        {
          title: "Командная работа",
          type: "tip",
          content: "Система позволяет отслеживать готовность всех участников консилиума к проведению заседания.",
        },
      ]
    },
    {
      id: "export",
      category: "Экспорт и отчеты",
      icon: FileText,
      items: [
        {
          title: "Экспорт протоколов",
          type: "step",
          content: `Система поддерживает экспорт протоколов в различных форматах:
• PDF - для печати и архивирования
• XLS - для анализа данных
• Используйте кнопку "Экспорт" в списке протоколов`,
        },
        {
          title: "Формирование заключений",
          type: "step",
          content: `После заполнения чеклиста система автоматически формирует заключения и рекомендации на основе выбранных пунктов. Просмотрите и при необходимости отредактируйте текст перед финальным экспортом.`,
        },
      ]
    },
  ];

  // Инструкции по Расписанию
  const scheduleInstructionsData = [
    {
      id: "calendar-basics",
      category: "Основы работы с календарем",
      icon: Calendar,
      items: [
        {
          title: "Просмотр расписания",
          type: "step",
          content: `Календарь занятий отображает все запланированные сессии:
• Переключайте вид: день, неделя, месяц
• Используйте фильтры по типу занятий и статусу
• Кликните на занятие для просмотра деталей
• Цветовая кодировка помогает различать типы занятий`,
        },
        {
          title: "Создание занятий",
          type: "step",
          content: `Для создания нового занятия:
• Нажмите на свободный слот в календаре
• Или используйте кнопку "Новое занятие"
• Выберите ребенка, тип занятия, время
• Укажите тему и дополнительные заметки`,
          note: "Система автоматически проверяет пересечения с другими занятиями.",
          noteType: "info"
        },
        {
          title: "Перенос и отмена занятий",
          type: "step",
          content: `Управление существующими занятиями:
• Перетащите занятие на другой слот для переноса (drag-and-drop)
• Используйте контекстное меню для редактирования
• При отмене укажите причину для статистики
• Система отправит уведомление родителям`,
        },
      ]
    },
    {
      id: "consultation-slots",
      category: "Запись на консультации",
      icon: ClipboardList,
      items: [
        {
          title: "Создание слотов для записи",
          type: "step",
          content: `Для открытия записи родителям:
• В календаре нажмите кнопку "+" и выберите "Запись на консультацию"
• Выберите дату и время слота
• Укажите формат консультации: Очно, Онлайн или Оба варианта
• Сохраните слот — он появится в публичном каталоге`,
          note: "Ребенок не выбирается при создании слота — данные подтянутся автоматически при записи родителем.",
          noteType: "info"
        },
        {
          title: "Формат консультации",
          type: "info",
          content: `При создании слота выберите доступные форматы:
• Очно — родитель приходит в организацию
• Онлайн — консультация по видеосвязи
• Оба варианта — родитель выбирает при записи
Формат отображается в публичном каталоге и личном кабинете родителя для фильтрации.`,
        },
        {
          title: "Настройка записи в организации",
          type: "warning",
          content: `Доступность функции записи зависит от настроек организации:
• Для сотрудников организации: функция должна быть включена в разделе "Организация → Настройки → Разрешить запись через ЛК родителя"
• Для частных специалистов: функция доступна всегда без ограничений`,
          note: "Если вы не видите кнопку 'Запись на консультацию', обратитесь к руководителю организации.",
          noteType: "warning"
        },
        {
          title: "Управление записями",
          type: "step",
          content: `Когда родитель записывается на слот:
• Вы получите уведомление о новой записи
• Данные ребенка подтянутся из личного кабинета родителя
• Занятие появится в вашем расписании
• Родитель получит подтверждение с контактами`,
        },
      ]
    },
    {
      id: "recurring-sessions",
      category: "Повторяющиеся занятия",
      icon: Clock,
      items: [
        {
          title: "Создание серии занятий",
          type: "step",
          content: `Для регулярных занятий используйте функцию повторения:
• Выберите частоту: ежедневно, еженедельно, ежемесячно
• Укажите дни недели для еженедельных занятий
• Задайте период действия (начало и конец)
• Все занятия серии создадутся автоматически`,
        },
        {
          title: "Редактирование серии",
          type: "tip",
          content: `При изменении повторяющегося занятия вы можете:
• Изменить только это занятие
• Изменить все будущие занятия серии
• Изменить всю серию целиком`,
          note: "Будьте внимательны при массовых изменениях.",
          noteType: "warning"
        },
      ]
    },
    {
      id: "children-management",
      category: "Работа с детьми",
      icon: Users,
      items: [
        {
          title: "Добавление ребенка",
          type: "step",
          content: `В разделе "Дети" управляйте списком подопечных:
• Нажмите "Добавить ребенка"
• Заполните ФИО, дату рождения, контакты родителей
• Укажите уровень образования
• Добавьте заметки о особенностях работы`,
        },
        {
          title: "Привязка к протоколам",
          type: "info",
          content: `Дети из расписания автоматически связываются с протоколами ППк. Это позволяет отслеживать историю занятий и динамику развития каждого ребенка.`,
        },
        {
          title: "Статистика по ребенку",
          type: "tip",
          content: `Для каждого ребенка доступна статистика:
• Количество проведенных занятий
• Процент посещаемости
• Динамика показателей
• История изменений`,
        },
      ]
    },
    {
      id: "schedule-statistics",
      category: "Статистика и отчеты",
      icon: TrendingUp,
      items: [
        {
          title: "Личная статистика",
          type: "info",
          content: `Отслеживайте свои показатели:
• Количество занятий за период
• Выполнение плана по часам
• Распределение по типам занятий
• Сравнение с предыдущими периодами`,
        },
        {
          title: "KPI специалиста",
          type: "step",
          content: `Система автоматически считает ключевые показатели:
• Загрузка относительно ставки
• Средняя посещаемость
• Количество отмененных занятий
• Выполнение индивидуальных планов`,
        },
      ]
    },
  ];

  // Инструкции по Организации
  const organizationInstructionsData = [
    {
      id: "employees-management",
      category: "Управление сотрудниками",
      icon: Users,
      items: [
        {
          title: "Просмотр списка сотрудников",
          type: "step",
          content: `В разделе "Сотрудники" отображаются все специалисты организации:
• Фильтруйте по должностям и статусу
• Просматривайте контактную информацию
• Переходите к детальной карточке сотрудника
• Отслеживайте права доступа каждого`,
        },
        {
          title: "Настройка прав доступа",
          type: "step",
          content: `Для каждого сотрудника можно настроить права:
• Просмотр данных организации
• Редактирование расписания
• Доступ к статистике
• Управление детьми организации`,
          note: "Права можно изменить в карточке сотрудника.",
          noteType: "info"
        },
        {
          title: "Добавление нового сотрудника",
          type: "step",
          content: `Чтобы добавить сотрудника:
• Нажмите "Добавить сотрудника"
• Введите email и данные
• Выберите должность и роль
• Настройте начальные права доступа
• Сотрудник получит приглашение на email`,
        },
      ]
    },
    {
      id: "org-schedule",
      category: "Расписание организации",
      icon: Calendar,
      items: [
        {
          title: "Общий календарь",
          type: "info",
          content: `Директора и администраторы видят календарь всех сотрудников:
• Переключайтесь между специалистами
• Сравнивайте загрузку
• Выявляйте пересечения и конфликты
• Планируйте замены при необходимости`,
        },
        {
          title: "Нерабочие дни организации",
          type: "step",
          content: `В разделе "Нерабочие дни" управляйте выходными:
• Добавляйте праздничные дни
• Указывайте санитарные дни
• Отмечайте отпускные периоды
• Система автоматически блокирует эти дни для занятий`,
        },
        {
          title: "Запросы на согласование",
          type: "step",
          content: `Когда специалист хочет провести занятие в нерабочий день:
• Создается запрос на согласование
• Директор получает уведомление
• После одобрения занятие добавляется в расписание
• История запросов сохраняется`,
        },
      ]
    },
    {
      id: "specialist-rates",
      category: "Ставки специалистов",
      icon: CreditCard,
      items: [
        {
          title: "Просмотр ставок",
          type: "info",
          content: `В разделе "Ставки специалистов" отображаются:
• Текущая ставка каждого сотрудника
• Количество часов по ставке
• Загрузка относительно ставки
• История изменений ставок`,
        },
        {
          title: "Изменение ставки",
          type: "step",
          content: `Для изменения ставки сотрудника:
• Откройте карточку в разделе "Ставки"
• Укажите новое значение (0.25, 0.5, 0.75, 1.0, 1.25 и т.д.)
• Добавьте комментарий при необходимости
• Сохраните изменения`,
          note: "Изменение ставки влияет на расчет KPI и загрузки.",
          noteType: "warning"
        },
      ]
    },
    {
      id: "org-statistics",
      category: "Статистика организации",
      icon: TrendingUp,
      items: [
        {
          title: "Общие показатели",
          type: "info",
          content: `Статистика организации включает:
• Общее количество занятий за период
• Средняя посещаемость
• Загрузка по специалистам
• Распределение по типам занятий`,
        },
        {
          title: "KPI сотрудников",
          type: "step",
          content: `В разделе "KPI сотрудников" доступны:
• Выполнение плана каждым специалистом
• Сравнительный анализ
• Динамика показателей
• Экспорт отчетов для руководства`,
        },
        {
          title: "Отчеты для руководства",
          type: "tip",
          content: `Формируйте отчеты для учредителя:
• Выберите период отчета
• Укажите нужные показатели
• Экспортируйте в Excel или PDF
• Добавьте комментарии и пояснения`,
        },
      ]
    },
    {
      id: "org-settings",
      category: "Настройки организации",
      icon: Building,
      items: [
        {
          title: "Разрешить запись через ЛК родителя",
          type: "step",
          content: `Управление записью на консультации:
• Перейдите в "Организация → Настройки"
• Включите опцию "Разрешить запись через личный кабинет родителя"
• После включения сотрудники смогут создавать слоты для записи
• Родители увидят свободные слоты в публичном каталоге`,
          note: "При отключении этой настройки сотрудники не смогут создавать слоты для записи.",
          noteType: "warning"
        },
        {
          title: "Публикация в каталоге",
          type: "info",
          content: `Настройки публичного профиля организации:
• Включите публикацию для отображения в каталоге
• Разрешите сотрудникам публиковать свои профили
• Заполните описание и контактные данные
• Организация появится на странице /organizations`,
        },
        {
          title: "Данные организации",
          type: "tip",
          content: `Актуализируйте информацию:
• Адрес и контакты
• Станция метро и район
• Описание услуг
• Логотип организации`,
        },
      ]
    },
  ];

  // Нормативно-правовая база
  const legalInstructionsData = [
    {
      id: "federal-laws",
      category: "Федеральные законы",
      icon: Scale,
      items: [
        {
          title: 'Федеральный закон "Об образовании в Российской Федерации"',
          type: "info",
          content: `№ 273-ФЗ от 29.12.2012
Определяет правовые основы организации образовательного процесса и психолого-педагогического сопровождения обучающихся.`,
          link: "http://www.consultant.ru/document/cons_doc_LAW_140174/"
        },
        {
          title: 'Федеральный закон "О социальной защите инвалидов в РФ"',
          type: "info",
          content: `№ 181-ФЗ от 24.11.1995
Регулирует вопросы образования и реабилитации детей с ограниченными возможностями здоровья.`,
          link: "http://www.consultant.ru/document/cons_doc_LAW_8559/"
        },
      ]
    },
    {
      id: "ministry-orders",
      category: "Приказы Минобразования",
      icon: FileText,
      items: [
        {
          title: "Приказ об утверждении Положения о ППк",
          type: "info",
          content: `№ Р-93 от 09.09.2019
Устанавливает порядок создания и деятельности психолого-педагогических консилиумов в образовательных организациях.`,
          link: "https://docs.edu.gov.ru/document/6f205375c5b33320e8416ddb5a5704e3/"
        },
        {
          title: "Приказ Департамента образования г. Москвы № 666",
          type: "info",
          content: `От 12 мая 2023 г.
«Об утверждении Стандарта деятельности психолого-педагогических служб образовательных организаций, подведомственных Департаменту образования и науки города Москвы»`,
          link: "https://base.garant.ru/405280341/?ysclid=mhir5wgilx300004324"
        },
      ]
    },
    {
      id: "specialist-schedule-norms",
      category: "Нормативы рабочего времени специалистов",
      icon: Clock,
      items: [
        {
          title: "Постановление Правительства РФ № 678",
          type: "info",
          content: `От 14.05.2015 «О продолжительности рабочего времени педагогических работников»
Устанавливает нормы рабочего времени:
• Педагог-психолог — 36 часов в неделю
• Учитель-логопед, учитель-дефектолог — 20 часов учебной работы в неделю
• Социальный педагог — 36 часов в неделю`,
          link: "http://www.consultant.ru/document/cons_doc_LAW_179568/"
        },
        {
          title: "Приказ Минобрнауки № 1601",
          type: "info",
          content: `От 22.12.2014 «О продолжительности рабочего времени»
Определяет:
• Норму часов педагогической работы за ставку заработной платы
• Порядок определения учебной нагрузки
• Особенности работы в каникулярное время`,
          link: "http://www.consultant.ru/document/cons_doc_LAW_175797/"
        },
        {
          title: "Распределение рабочего времени педагога-психолога",
          type: "step",
          content: `Согласно инструктивному письму Минобразования РФ № 29/1886-6:
• 18 часов — работа с детьми, родителями, педагогами (индивидуальная и групповая диагностика, консультирование, коррекционно-развивающая работа)
• 18 часов — подготовительная работа (анализ результатов, разработка программ, ведение документации, самообразование)`,
          note: "Соотношение видов работ может корректироваться в зависимости от конкретных задач.",
          noteType: "info"
        },
        {
          title: "Распределение времени учителя-логопеда",
          type: "step",
          content: `На одну ставку (20 часов в неделю):
• Индивидуальные занятия — 15-20 минут
• Подгрупповые занятия (2-4 ребенка) — 20-25 минут
• Групповые занятия (до 12 детей) — 25-40 минут
• Количество детей на ставку: 15-25 человек (в зависимости от категории нарушений)`,
          note: "При работе с детьми с тяжёлыми нарушениями речи (ТНР) количество детей снижается.",
          noteType: "warning"
        },
        {
          title: "Распределение времени учителя-дефектолога",
          type: "step",
          content: `На одну ставку (20 часов в неделю):
• Индивидуальные занятия — 20-25 минут
• Подгрупповые занятия — 25-35 минут
• Документация и диагностика — вне часов учебной нагрузки
• Количество детей на ставку: 12-20 человек`,
        },
      ]
    },
    {
      id: "session-duration-norms",
      category: "Нормативы времени занятий с детьми",
      icon: Users,
      items: [
        {
          title: "СанПиН 1.2.3685-21",
          type: "info",
          content: `Гигиенические нормативы для организации обучения:
Непрерывная продолжительность занятий:
• Дети 3-4 лет — не более 15 минут
• Дети 4-5 лет — не более 20 минут  
• Дети 5-6 лет — не более 25 минут
• Дети 6-7 лет — не более 30 минут
• Обучающиеся 1 класса — 35-40 минут
• Обучающиеся 2-11 классов — не более 45 минут`,
          link: "http://www.consultant.ru/document/cons_doc_LAW_375839/"
        },
        {
          title: "Нормативы для детей с ЗПР",
          type: "warning",
          content: `Дети с задержкой психического развития:
• Индивидуальные занятия: 20-25 минут
• Подгрупповые занятия (2-4 ребенка): 25-30 минут
• Групповые занятия (5-8 детей): 30-35 минут
• Обязательные перерывы: каждые 10-15 минут
• Рекомендуется 2-3 занятия в неделю`,
          note: "При утомляемости ребенка время занятия сокращается.",
          noteType: "warning"
        },
        {
          title: "Нормативы для детей с РАС",
          type: "warning",
          content: `Дети с расстройствами аутистического спектра:
• Начальный этап: 10-15 минут индивидуально
• По мере адаптации: до 25-30 минут
• Групповые занятия: после индивидуальной подготовки
• Максимальный размер группы: 3-4 ребенка
• Присутствие тьютора обязательно`,
          note: "Время занятия подбирается индивидуально с учетом особенностей ребенка.",
          noteType: "info"
        },
        {
          title: "Нормативы для детей с ТНР",
          type: "warning",
          content: `Дети с тяжёлыми нарушениями речи:
• Индивидуальные занятия: 15-20 минут
• Подгрупповые занятия (2-4 ребенка): 20-25 минут
• Групповые (фронтальные): 25-35 минут
• Периодичность: 2-4 раза в неделю
• На одного логопеда: 12-15 детей с ТНР`,
        },
        {
          title: "Нормативы для детей с УО",
          type: "warning",
          content: `Дети с умственной отсталостью:
• Индивидуальные занятия: 15-25 минут
• Малые группы (2-3 ребенка): 20-30 минут
• Частая смена видов деятельности: каждые 5-7 минут
• Игровая форма занятий обязательна
• На одного дефектолога: 6-12 детей (в зависимости от степени УО)`,
          note: "При тяжелой и глубокой УО — только индивидуальные занятия.",
          noteType: "warning"
        },
        {
          title: "Нормативы для детей с нарушением слуха",
          type: "warning",
          content: `Слабослышащие и глухие дети:
• Индивидуальные занятия: 20-30 минут
• Групповые занятия: 30-40 минут
• Развитие слухового восприятия: ежедневно
• Формирование произношения: 2-3 раза в неделю
• На одного сурдопедагога: 8-12 детей`,
        },
        {
          title: "Нормативы для детей с нарушением зрения",
          type: "warning",
          content: `Слабовидящие и слепые дети:
• Индивидуальные занятия: 15-25 минут
• Зрительная нагрузка: не более 10-15 минут непрерывно
• Обязательные паузы для глаз
• Тактильные занятия: без ограничения времени
• На одного тифлопедагога: 8-12 детей`,
        },
        {
          title: "Нормативы для детей с НОДА",
          type: "warning",
          content: `Дети с нарушениями опорно-двигательного аппарата:
• Индивидуальные занятия: 20-30 минут
• С перерывами на двигательную активность
• Смена положения тела: каждые 15-20 минут
• Учет утомляемости при ДЦП
• Координация с физической реабилитацией`,
        },
      ]
    },
    {
      id: "documentation-norms",
      category: "Требования к документации",
      icon: FileText,
      items: [
        {
          title: "Документация педагога-психолога",
          type: "step",
          content: `Обязательные документы:
• Годовой план работы
• Журнал учёта видов работ
• Журнал консультаций
• Протоколы диагностических обследований
• Коррекционно-развивающие программы
• Аналитический отчёт за год`,
        },
        {
          title: "Документация учителя-логопеда",
          type: "step",
          content: `Обязательные документы:
• Речевые карты на каждого ребенка
• Журнал обследования речи
• Журнал посещаемости
• Перспективные планы работы
• Индивидуальные планы коррекции
• Отчёт о результатах работы`,
        },
        {
          title: "Сроки хранения документации",
          type: "info",
          content: `Согласно Приказу № 666:
• Протоколы ППк — 5 лет
• Журналы учёта работы — 3 года
• Речевые карты — до выпуска ребенка
• Согласия на обработку ПДн — 75 лет
• Аналитические отчёты — 5 лет`,
          note: "Хранение осуществляется с соблюдением ФЗ-152 о персональных данных.",
          noteType: "warning"
        },
      ]
    },
    {
      id: "key-principles",
      category: "Ключевые принципы",
      icon: Shield,
      items: [
        {
          title: "Принцип конфиденциальности",
          type: "warning",
          content: "Вся информация о ребенке и семье является конфиденциальной и не подлежит разглашению.",
        },
        {
          title: "Принцип добровольности",
          type: "info",
          content: "Участие в работе ППк возможно только с согласия родителей (законных представителей).",
        },
        {
          title: "Принцип комплексности",
          type: "success",
          content: "Обследование проводится командой специалистов различного профиля.",
        },
        {
          title: "Принцип индивидуализации",
          type: "tip",
          content: "Рекомендации разрабатываются с учетом индивидуальных особенностей ребенка.",
        },
      ]
    },
  ];

  // Выбор данных по текущей вкладке
  const getCurrentInstructionsData = () => {
    switch (activeSubTab) {
      case "ppk":
        return ppkInstructionsData;
      case "schedule":
        return scheduleInstructionsData;
      case "organization":
        return organizationInstructionsData;
      case "legal":
        return legalInstructionsData;
      case "business-processes":
        return []; // Business processes use flowcharts, not regular instructions
      default:
        return ppkInstructionsData;
    }
  };

  const currentData = getCurrentInstructionsData();

  // Фильтрация по поисковому запросу
  const filterInstructions = (data: any[]) => {
    if (!searchQuery && selectedCategory === "all") return data;
    
    return data.filter(section => {
      if (selectedCategory !== "all" && section.id !== selectedCategory) {
        return false;
      }

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const categoryMatch = section.category.toLowerCase().includes(query);
        const itemsMatch = section.items.some((item: any) => 
          item.title.toLowerCase().includes(query) || 
          item.content.toLowerCase().includes(query)
        );
        return categoryMatch || itemsMatch;
      }

      return true;
    });
  };

  const filteredInstructions = useMemo(
    () => filterInstructions(currentData),
    [searchQuery, selectedCategory, activeSubTab]
  );

  const categories = currentData.map(section => ({ id: section.id, name: section.category }));

  const getTabTitle = () => {
    switch (activeSubTab) {
      case "ppk":
        return "Инструкции по работе с ППк";
      case "schedule":
        return "Инструкции по модулю Расписание";
      case "organization":
        return "Инструкции по модулю Организация";
      case "legal":
        return "Нормативно-правовая база";
      case "business-processes":
        return "Бизнес-процессы системы";
      default:
        return "Инструкции";
    }
  };

  const getTabIcon = () => {
    switch (activeSubTab) {
      case "ppk":
        return ClipboardList;
      case "schedule":
        return Calendar;
      case "organization":
        return Building;
      case "legal":
        return Scale;
      case "business-processes":
        return GitBranch;
      default:
        return BookOpen;
    }
  };

  const TabIcon = getTabIcon();

  const renderInstructionItem = (item: any) => {
    const typeConfig = contentTypes[item.type as keyof typeof contentTypes] || contentTypes.info;
    const Icon = typeConfig.icon;

    return (
      <div key={item.title} className={`border rounded-lg p-4 ${typeConfig.bg}`}>
        <div className="flex items-start gap-3">
          <Icon className={`h-5 w-5 ${typeConfig.color} flex-shrink-0 mt-0.5`} />
          <div className="flex-1 space-y-2">
            <h4 className="font-semibold text-base">{item.title}</h4>
            <p className="text-sm whitespace-pre-line text-muted-foreground leading-relaxed">
              {item.content}
            </p>
            {item.note && (
              <div className={`mt-3 p-2 rounded text-sm border ${
                item.noteType === "warning" ? "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200" :
                item.noteType === "success" ? "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200" :
                "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200"
              }`}>
                {item.note}
              </div>
            )}
            {item.link && (
              <a 
                href={item.link} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-primary hover:underline text-sm inline-flex items-center gap-1 mt-2"
              >
                Открыть документ
                <Download className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center gap-4">
        <div className="p-3 bg-primary/10 rounded-xl">
          <TabIcon className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">{getTabTitle()}</h2>
          <p className="text-muted-foreground">
            {activeSubTab === "ppk" && "Руководство по организации психолого-педагогического консилиума"}
            {activeSubTab === "schedule" && "Управление занятиями, детьми и рабочим временем"}
            {activeSubTab === "organization" && "Управление сотрудниками и показателями организации"}
            {activeSubTab === "legal" && "Нормативные документы и правовые основы деятельности"}
            {activeSubTab === "business-processes" && "Визуальные схемы ключевых процессов платформы"}
          </p>
        </div>
      </div>

      {/* Бизнес-процессы - специальный рендеринг с табами */}
      {activeSubTab === "business-processes" ? (
        <BusinessProcessTabs />
      ) : (
        <>
          {/* Поиск и фильтры */}
      <Card className="border-2">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по инструкциям..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-base"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory("all")}
                className="rounded-full"
              >
                Все разделы
              </Button>
              {categories.map(cat => (
                <Button
                  key={cat.id}
                  variant={selectedCategory === cat.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(cat.id)}
                  className="rounded-full"
                >
                  {cat.name}
                </Button>
              ))}
            </div>

            {(searchQuery || selectedCategory !== "all") && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  Найдено разделов: {filteredInstructions.length}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("all");
                  }}
                >
                  Сбросить
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Контент */}
      <div className="space-y-6">
        {filteredInstructions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                По вашему запросу ничего не найдено. Попробуйте изменить условия поиска.
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredInstructions.map((section) => {
            const SectionIcon = section.icon;
            return (
              <Card key={section.id} className="overflow-hidden border-2">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <SectionIcon className="h-6 w-6 text-primary" />
                    </div>
                    <span>{section.category}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {section.items.map((item: any) => renderInstructionItem(item))}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
        </>
      )}
    </div>
  );
};
