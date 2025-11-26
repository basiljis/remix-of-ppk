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
  Clock
} from "lucide-react";
import { useInstructions } from "@/hooks/useInstructions";
import { Button } from "@/components/ui/button";

interface InstructionsSectionProps {
  activeSubTab?: string;
}

// Типы контента для визуальных подсказок
const contentTypes = {
  step: { icon: Target, color: "text-blue-500", bg: "bg-blue-50 border-blue-200" },
  tip: { icon: Lightbulb, color: "text-yellow-500", bg: "bg-yellow-50 border-yellow-200" },
  warning: { icon: AlertTriangle, color: "text-red-500", bg: "bg-red-50 border-red-200" },
  success: { icon: CheckCircle, color: "text-green-500", bg: "bg-green-50 border-green-200" },
  info: { icon: HelpCircle, color: "text-purple-500", bg: "bg-purple-50 border-purple-200" },
};

export const InstructionsSection = ({ activeSubTab = "work" }: InstructionsSectionProps) => {
  const { instructions: customInstructions, loading: customLoading } = useInstructions('custom');
  const { instructions: workInstructions, loading: workLoading } = useInstructions('work');
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Структурированные данные для инструкций
  const workInstructionsData = [
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
          note: "Чеклисты загружаются из базы данных Supabase и адаптируются под выбранный уровень.",
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
      id: "admin-guide",
      category: "Для администраторов",
      icon: Shield,
      items: [
        {
          title: "Управление доступом",
          type: "step",
          content: `В разделе "Администрирование" → "Заявки" рассматривайте заявки пользователей на доступ к системе. 
Вы можете одобрить заявку с назначением роли (Пользователь, Региональный оператор, Администратор) 
или отклонить с указанием причины. Используйте фильтры по ролям, статусам и организациям для быстрого поиска.`,
        },
        {
          title: "Управление пользователями",
          type: "step",
          content: `В разделе "Пользователи" вы можете редактировать данные пользователей, изменять их роли, 
блокировать и разблокировать аккаунты. Используйте фильтры по организациям, должностям и ролям 
для удобного управления большим количеством пользователей.`,
        },
        {
          title: "Мониторинг системы",
          type: "info",
          content: `В разделе "Панель администратора" доступна детальная статистика по авторизациям, заявкам, 
протоколам, организациям и должностям. Используйте эти данные для анализа активности 
и планирования развития системы.`,
        },
        {
          title: "Работа с организациями",
          type: "step",
          content: `Управляйте списком образовательных организаций через раздел "Организации". 
Вы можете экспортировать и импортировать данные через XLS файлы, 
синхронизировать с ЕКИС, добавлять новые организации вручную.`,
        },
        {
          title: "Управление подписками",
          type: "step",
          content: `В разделе "Администрирование" → "Подписки" отслеживайте активные подписки пользователей, 
сроки их действия и историю платежей. Вы можете одобрять заявки на подписку, 
просматривать детали платежей через ЮКасса, и отправлять уведомления о завершении подписки.`,
        },
      ]
    },
    {
      id: "subscriptions",
      category: "Подписки",
      icon: CreditCard,
      items: [
        {
          title: "Пробный период",
          type: "info",
          content: `Новые пользователи получают 7 дней бесплатного доступа к системе с момента одобрения 
их заявки на доступ. В течение пробного периода доступны все функции системы: 
создание протоколов, работа с чеклистами, экспорт документов.`,
        },
        {
          title: "Оформление подписки",
          type: "step",
          content: `После окончания пробного периода для продолжения работы необходимо оформить подписку:
• Перейдите в раздел "Профиль" → "Подписка"
• Выберите тип подписки (месячная или годовая)
• Заполните реквизиты организации
• Оплатите через ЮКасса`,
        },
        {
          title: "Управление подпиской",
          type: "info",
          content: `В личном кабинете вы можете:
• Просмотреть статус текущей подписки
• Продлить подписку до окончания срока действия
• Скачать историю платежей
• Получить закрывающие документы`,
        },
      ]
    },
  ];

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

  // Фильтрация по поисковому запросу
  const filterInstructions = (data: any[]) => {
    if (!searchQuery && selectedCategory === "all") return data;
    
    return data.filter(section => {
      // Фильтр по категории
      if (selectedCategory !== "all" && section.id !== selectedCategory) {
        return false;
      }

      // Фильтр по поисковому запросу
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

  const filteredWorkInstructions = useMemo(
    () => filterInstructions(workInstructionsData),
    [searchQuery, selectedCategory]
  );

  const filteredLegalInstructions = useMemo(
    () => filterInstructions(legalInstructionsData),
    [searchQuery, selectedCategory]
  );

  // Получение всех категорий для текущей вкладки
  const categories = activeSubTab === "work" 
    ? workInstructionsData.map(section => ({ id: section.id, name: section.category }))
    : legalInstructionsData.map(section => ({ id: section.id, name: section.category }));

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
                item.noteType === "warning" ? "bg-red-50 border-red-200 text-red-800" :
                item.noteType === "success" ? "bg-green-50 border-green-200 text-green-800" :
                "bg-blue-50 border-blue-200 text-blue-800"
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
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
          Инструкции по работе в системе
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Полное руководство по организации и проведению психолого-педагогического консилиума
        </p>
      </div>

      {/* Поиск и фильтры */}
      <Card className="border-2">
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Поисковая строка */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по инструкциям..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-base"
              />
            </div>

            {/* Категории */}
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
                  Найдено разделов: {
                    activeSubTab === "work" 
                      ? filteredWorkInstructions.length 
                      : filteredLegalInstructions.length
                  }
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

      {/* Инструкции по работе */}
      {activeSubTab === "work" && (
        <div className="space-y-6">
          {filteredWorkInstructions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  По вашему запросу ничего не найдено. Попробуйте изменить условия поиска.
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredWorkInstructions.map((section) => {
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
                      {section.items.map((item) => renderInstructionItem(item))}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}

          {/* Динамические инструкции из БД */}
          {workInstructions && workInstructions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookMarked className="h-5 w-5" />
                  Дополнительные инструкции
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {workInstructions.map((instruction, idx) => (
                    <AccordionItem key={instruction.id} value={`custom-${idx}`}>
                      <AccordionTrigger className="text-left hover:no-underline">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Дополнительно</Badge>
                          {instruction.title}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        {instruction.content && Array.isArray(instruction.content) && (
                          <div className="space-y-4">
                            {instruction.content.map((section: any, sectionIndex: number) => (
                              <div key={section.id} className="space-y-3">
                                <h4 className="font-semibold">{section.title}</h4>
                                {section.content && (
                                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                    {section.content}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Пользовательские инструкции */}
      {activeSubTab === "custom" && (
        <div className="space-y-6">
          {customLoading ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">Загрузка инструкций...</p>
              </CardContent>
            </Card>
          ) : !customInstructions || customInstructions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Пока нет пользовательских инструкций
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Администратор может добавить инструкции в разделе Администрирование → Инструкции
                </p>
              </CardContent>
            </Card>
          ) : (
            customInstructions.map((instruction) => (
              <Card key={instruction.id} className="overflow-hidden border-2">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <BookMarked className="h-6 w-6 text-primary" />
                    </div>
                    <span>{instruction.title}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <Accordion type="single" collapsible className="w-full">
                    {instruction.content && Array.isArray(instruction.content) && instruction.content.map((section: any, idx: number) => (
                      <AccordionItem key={section.id || idx} value={`section-${idx}`}>
                        <AccordionTrigger className="text-left hover:no-underline">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-primary" />
                            {section.title}
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-4">
                            {section.content && (
                              <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                                {section.content}
                              </p>
                            )}
                            {section.subsections && Array.isArray(section.subsections) && section.subsections.length > 0 && (
                              <div className="space-y-3 pl-4 border-l-2 border-primary/20">
                                {section.subsections.map((subsection: any, subIdx: number) => (
                                  <div key={subsection.id || subIdx} className="space-y-2">
                                    <h5 className="font-medium text-sm">{subsection.title}</h5>
                                    {subsection.content && (
                                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                        {subsection.content}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Нормативно-правовая база */}
      {activeSubTab === "legal" && (
        <div className="space-y-6">
          {filteredLegalInstructions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Scale className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  По вашему запросу ничего не найдено. Попробуйте изменить условия поиска.
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredLegalInstructions.map((section) => {
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
                      {section.items.map((item) => renderInstructionItem(item))}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};