import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Play, 
  LogIn, 
  Home, 
  LayoutDashboard, 
  Users, 
  FileText, 
  Calendar, 
  Settings, 
  Bell,
  ClipboardList,
  Building,
  UserCheck,
  Shield,
  TrendingUp,
  Search,
  PenTool,
  CheckCircle,
  Send,
  Archive,
  ChevronDown,
  ChevronRight,
  Info,
  BookOpen,
  Eye
} from "lucide-react";

interface FlowNode {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  type: "start" | "step" | "decision" | "end";
  tooltip?: string;
  description?: string;
  children?: FlowNode[];
}

interface ProcessDetails {
  title: string;
  description: string;
  steps: {
    title: string;
    description: string;
    details?: string[];
  }[];
  notes?: string[];
}

interface BusinessProcessFlowchartProps {
  title: string;
  description: string;
  nodes: FlowNode[];
  processDetails?: ProcessDetails;
}

const FlowNodeComponent = ({ 
  node, 
  isStart = false,
  level = 0,
  onNodeClick
}: { 
  node: FlowNode; 
  isStart?: boolean;
  level?: number;
  onNodeClick?: (node: FlowNode) => void;
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const Icon = node.icon;
  const hasChildren = node.children && node.children.length > 0;
  
  const getNodeStyles = () => {
    switch (node.type) {
      case "start":
        return "w-16 h-16 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 cursor-pointer hover:scale-105 transition-transform";
      case "end":
        return "w-16 h-16 rounded-full bg-muted text-muted-foreground border-2 border-dashed cursor-pointer hover:scale-105 transition-transform";
      case "decision":
        return "w-32 h-12 rounded-lg bg-accent text-accent-foreground border border-accent-foreground/20 cursor-pointer hover:scale-105 transition-all";
      default:
        return "min-w-[120px] h-12 rounded-lg bg-card text-card-foreground border-2 border-border shadow-sm hover:border-primary hover:shadow-md transition-all cursor-pointer";
    }
  };

  const handleClick = () => {
    if (onNodeClick && node.description) {
      onNodeClick(node);
    }
  };

  const nodeContent = (
    <div 
      className={`flex items-center justify-center gap-2 px-4 ${getNodeStyles()}`}
      onClick={handleClick}
    >
      <Icon className={`${node.type === "start" || node.type === "end" ? "h-6 w-6" : "h-4 w-4"} flex-shrink-0`} />
      {node.type !== "start" && node.type !== "end" && (
        <span className="text-sm font-medium whitespace-nowrap">{node.label}</span>
      )}
      {hasChildren && node.type !== "start" && node.type !== "end" && (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="ml-1 p-0.5 hover:bg-muted rounded"
        >
          {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </button>
      )}
    </div>
  );

  return (
    <div className="flex flex-col items-center">
      {/* Vertical connector from parent */}
      {!isStart && (
        <div className="w-0.5 h-6 bg-gradient-to-b from-primary/60 to-primary/30" />
      )}
      
      {/* Node circle at connection point */}
      {!isStart && (
        <div className="w-2 h-2 rounded-full bg-primary mb-2" />
      )}
      
      {/* Main node with tooltip */}
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            {nodeContent}
          </TooltipTrigger>
          {node.tooltip && (
            <TooltipContent side="right" className="max-w-[250px]">
              <p className="text-sm">{node.tooltip}</p>
              {node.description && (
                <p className="text-xs text-muted-foreground mt-1">Нажмите для подробностей</p>
              )}
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
      
      {/* Label for start/end nodes */}
      {(node.type === "start" || node.type === "end") && (
        <span className="mt-2 text-xs font-medium text-muted-foreground">{node.label}</span>
      )}

      {/* Children - collapsible */}
      {hasChildren && isExpanded && (
        <>
          {/* Connector line down */}
          <div className="w-0.5 h-6 bg-gradient-to-b from-primary/30 to-primary/60 mt-2" />
          <div className="w-2 h-2 rounded-full bg-primary" />
          
          {node.children!.length === 1 ? (
            // Single child - just render vertically
            <FlowNodeComponent node={node.children![0]} level={level + 1} onNodeClick={onNodeClick} />
          ) : (
            // Multiple children - render horizontally with branches
            <div className="flex flex-col items-center">
              {/* Horizontal line container */}
              <div className="relative flex items-start justify-center mt-2">
                {/* Horizontal connecting line */}
                <div 
                  className="absolute top-0 h-0.5 bg-primary/40"
                  style={{
                    width: `${(node.children!.length - 1) * 140}px`,
                    left: '50%',
                    transform: 'translateX(-50%)'
                  }}
                />
                
                {/* Child nodes */}
                <div className="flex gap-6">
                  {node.children!.map((child) => (
                    <div key={child.id} className="flex flex-col items-center">
                      {/* Vertical connector to horizontal line */}
                      <div className="w-0.5 h-4 bg-primary/40" />
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      
                      {/* Child node with tooltip */}
                      <TooltipProvider delayDuration={200}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div 
                              className={`flex items-center justify-center gap-2 px-4 mt-2 cursor-pointer hover:scale-105 transition-all ${
                                child.type === "end" 
                                  ? "min-w-[100px] h-10 rounded-lg bg-muted text-muted-foreground border border-dashed"
                                  : "min-w-[100px] h-10 rounded-lg bg-card text-card-foreground border-2 border-border shadow-sm hover:border-primary hover:shadow-md"
                              }`}
                              onClick={() => child.description && onNodeClick?.(child)}
                            >
                              <child.icon className="h-4 w-4 flex-shrink-0" />
                              <span className="text-xs font-medium whitespace-nowrap">{child.label}</span>
                            </div>
                          </TooltipTrigger>
                          {child.tooltip && (
                            <TooltipContent side="bottom" className="max-w-[250px]">
                              <p className="text-sm">{child.tooltip}</p>
                              {child.description && (
                                <p className="text-xs text-muted-foreground mt-1">Нажмите для подробностей</p>
                              )}
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                      
                      {/* Nested children */}
                      {child.children && child.children.length > 0 && (
                        <div className="flex flex-col items-center">
                          {child.children.map((grandchild) => (
                            <FlowNodeComponent key={grandchild.id} node={grandchild} level={level + 2} onNodeClick={onNodeClick} />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export const BusinessProcessFlowchart = ({ title, description, nodes, processDetails }: BusinessProcessFlowchartProps) => {
  const [selectedNode, setSelectedNode] = useState<FlowNode | null>(null);
  const [showProcessDetails, setShowProcessDetails] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set([0]));

  const toggleStep = (index: number) => {
    setExpandedSteps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const expandAll = () => {
    if (processDetails) {
      setExpandedSteps(new Set(processDetails.steps.map((_, i) => i)));
    }
  };

  const collapseAll = () => {
    setExpandedSteps(new Set());
  };

  return (
    <>
      <Card className="overflow-hidden border-2">
        <CardHeader className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 text-white">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              <p className="text-sm text-slate-300">{description}</p>
            </div>
            {processDetails && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowProcessDetails(true)}
                className="gap-2"
              >
                <BookOpen className="h-4 w-4" />
                Описание процесса
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-8 pb-8 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 overflow-x-auto">
          <div className="flex flex-col items-center min-w-fit px-4">
            {nodes.map((node, index) => (
              <FlowNodeComponent 
                key={node.id} 
                node={node} 
                isStart={index === 0 && node.type === "start"}
                onNodeClick={setSelectedNode}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Node details modal */}
      <Dialog open={!!selectedNode} onOpenChange={() => setSelectedNode(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedNode && <selectedNode.icon className="h-5 w-5 text-primary" />}
              {selectedNode?.label}
            </DialogTitle>
            {selectedNode?.tooltip && (
              <DialogDescription>{selectedNode.tooltip}</DialogDescription>
            )}
          </DialogHeader>
          {selectedNode?.description && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                {selectedNode.description}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Process details modal */}
      <Dialog open={showProcessDetails} onOpenChange={setShowProcessDetails}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              {processDetails?.title}
            </DialogTitle>
            <DialogDescription>{processDetails?.description}</DialogDescription>
          </DialogHeader>
          
          <div className="flex items-center gap-2 mb-4">
            <Button variant="outline" size="sm" onClick={expandAll}>
              Развернуть все
            </Button>
            <Button variant="outline" size="sm" onClick={collapseAll}>
              Свернуть все
            </Button>
          </div>

          <ScrollArea className="max-h-[50vh] pr-4">
            <div className="space-y-3">
              {processDetails?.steps.map((step, index) => (
                <Collapsible 
                  key={index} 
                  open={expandedSteps.has(index)}
                  onOpenChange={() => toggleStep(index)}
                >
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                      <Badge variant="secondary" className="w-7 h-7 rounded-full flex items-center justify-center p-0">
                        {index + 1}
                      </Badge>
                      <span className="font-medium text-left flex-1">{step.title}</span>
                      {expandedSteps.has(index) ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="ml-10 mt-2 p-3 bg-muted/30 rounded-lg border-l-2 border-primary/30">
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                      {step.details && step.details.length > 0 && (
                        <ul className="mt-2 space-y-1">
                          {step.details.map((detail, detailIndex) => (
                            <li key={detailIndex} className="text-sm text-muted-foreground flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                              {detail}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>

            {processDetails?.notes && processDetails.notes.length > 0 && (
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="h-4 w-4 text-blue-500" />
                  <span className="font-medium text-sm">Примечания</span>
                </div>
                <ul className="space-y-1">
                  {processDetails.notes.map((note, index) => (
                    <li key={index} className="text-sm text-muted-foreground">• {note}</li>
                  ))}
                </ul>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Компонент с табами для переключения между процессами
export const BusinessProcessTabs = () => {
  const [activeTab, setActiveTab] = useState("user-journey");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <LayoutDashboard className="h-6 w-6 text-primary" />
            Бизнес-процессы
          </h2>
          <p className="text-muted-foreground">Визуальные схемы основных процессов системы</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 h-auto gap-1 bg-muted p-1">
          <TabsTrigger value="user-journey" className="text-xs sm:text-sm py-2">
            Путь специалиста
          </TabsTrigger>
          <TabsTrigger value="protocol" className="text-xs sm:text-sm py-2">
            Создание ППк
          </TabsTrigger>
          <TabsTrigger value="consultation" className="text-xs sm:text-sm py-2">
            Консультации
          </TabsTrigger>
          <TabsTrigger value="admin" className="text-xs sm:text-sm py-2">
            Администратор
          </TabsTrigger>
          <TabsTrigger value="parent" className="text-xs sm:text-sm py-2">
            Путь родителя
          </TabsTrigger>
        </TabsList>

        <TabsContent value="user-journey" className="mt-6">
          <BusinessProcessFlowchart {...businessProcessFlows.userJourney} />
        </TabsContent>

        <TabsContent value="protocol" className="mt-6">
          <BusinessProcessFlowchart {...businessProcessFlows.protocolCreation} />
        </TabsContent>

        <TabsContent value="consultation" className="mt-6">
          <BusinessProcessFlowchart {...businessProcessFlows.consultationBooking} />
        </TabsContent>

        <TabsContent value="admin" className="mt-6">
          <BusinessProcessFlowchart {...businessProcessFlows.adminWorkflow} />
        </TabsContent>

        <TabsContent value="parent" className="mt-6">
          <BusinessProcessFlowchart {...businessProcessFlows.parentJourney} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Predefined business process flows with enhanced data
export const businessProcessFlows = {
  // Путь пользователя (специалиста) в системе
  userJourney: {
    title: "Путь пользователя в системе",
    description: "Схема взаимодействия специалиста с основными модулями платформы",
    processDetails: {
      title: "Путь специалиста в системе",
      description: "Детальное описание основных этапов работы специалиста на платформе",
      steps: [
        {
          title: "Авторизация в системе",
          description: "Специалист входит в систему, используя корпоративные учётные данные или данные, полученные от администратора организации.",
          details: [
            "Ввод email и пароля",
            "Автоматическое определение роли пользователя",
            "Перенаправление на главную страницу кабинета"
          ]
        },
        {
          title: "Главная страница",
          description: "Обзорная панель с ключевыми метриками, уведомлениями и быстрым доступом к основным функциям.",
          details: [
            "Статистика по занятиям за период",
            "Ближайшие запланированные занятия",
            "Непрочитанные уведомления",
            "Быстрые действия (создать занятие, открыть ППк)"
          ]
        },
        {
          title: "Работа с модулями",
          description: "Специалист переходит к нужному разделу: ППк, Расписание, Дети или Организация.",
          details: [
            "ППк — создание и просмотр протоколов консилиума",
            "Расписание — управление занятиями и слотами",
            "Дети — база детей организации",
            "Организация — настройки и сотрудники"
          ]
        }
      ],
      notes: [
        "Доступ к модулям зависит от прав, назначенных администратором",
        "Все действия фиксируются в журнале изменений"
      ]
    },
    nodes: [
      {
        id: "start",
        label: "Старт",
        icon: Play,
        type: "start" as const,
        tooltip: "Начало работы в системе",
        children: [
          {
            id: "auth",
            label: "Авторизация",
            icon: LogIn,
            type: "step" as const,
            tooltip: "Вход в личный кабинет специалиста",
            description: "Авторизация происходит по email и паролю. После входа система автоматически определяет роль пользователя и перенаправляет на соответствующую главную страницу.",
            children: [
              {
                id: "dashboard",
                label: "Главная",
                icon: Home,
                type: "step" as const,
                tooltip: "Обзорная панель с метриками и уведомлениями",
                description: "На главной странице отображается статистика занятий, ближайшее расписание, уведомления и быстрые действия. Специалист может быстро перейти к любому модулю.",
                children: [
                  {
                    id: "ppk",
                    label: "ППк",
                    icon: ClipboardList,
                    type: "step" as const,
                    tooltip: "Протоколы психолого-педагогического консилиума",
                    description: "Раздел для создания, просмотра и редактирования протоколов ППк. Включает чеклисты оценки, рекомендации и заключения специалистов."
                  },
                  {
                    id: "schedule",
                    label: "Расписание",
                    icon: Calendar,
                    type: "step" as const,
                    tooltip: "Управление занятиями и слотами консультаций",
                    description: "Календарь занятий с возможностью создания, редактирования и отмены. Поддерживает групповые и индивидуальные занятия, регулярные сессии."
                  },
                  {
                    id: "children",
                    label: "Дети",
                    icon: Users,
                    type: "step" as const,
                    tooltip: "База детей организации",
                    description: "Список всех детей, закреплённых за организацией. Доступен просмотр карточек, история занятий и результаты протоколов."
                  },
                  {
                    id: "organization",
                    label: "Организация",
                    icon: Building,
                    type: "step" as const,
                    tooltip: "Настройки и данные организации",
                    description: "Информация об организации, управление сотрудниками, настройки расписания и публичного профиля."
                  },
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  
  // Процесс создания протокола ППк
  protocolCreation: {
    title: "Создание протокола ППк",
    description: "Пошаговый процесс заполнения и утверждения протокола консилиума",
    processDetails: {
      title: "Создание протокола ППк",
      description: "Детальная инструкция по созданию и утверждению протокола психолого-педагогического консилиума",
      steps: [
        {
          title: "Выбор ребёнка",
          description: "Специалист выбирает ребёнка из базы данных организации или добавляет нового ребёнка в систему.",
          details: [
            "Поиск по ФИО или идентификатору",
            "Фильтрация по классу/группе",
            "Просмотр предыдущих протоколов ребёнка"
          ]
        },
        {
          title: "Заполнение основных данных",
          description: "Внесение информации о дате проведения консилиума, присутствующих специалистах и цели обследования.",
          details: [
            "Дата и время проведения",
            "Состав консилиума",
            "Повод обращения / цель обследования"
          ]
        },
        {
          title: "Заполнение чеклистов",
          description: "Пошаговое заполнение диагностических чеклистов по различным сферам развития.",
          details: [
            "Речевое развитие",
            "Когнитивные функции",
            "Социально-эмоциональная сфера",
            "Моторика и физическое развитие"
          ]
        },
        {
          title: "Формирование заключения",
          description: "На основе результатов чеклистов система автоматически формирует рекомендации. Специалист дополняет и редактирует заключение.",
          details: [
            "Автоматические рекомендации по направлениям помощи",
            "Ручное редактирование заключения",
            "Указание сроков реализации рекомендаций"
          ]
        },
        {
          title: "Сохранение и утверждение",
          description: "Протокол можно сохранить как черновик для дальнейшего редактирования или сразу утвердить как финальную версию.",
          details: [
            "Черновик — можно редактировать в любое время",
            "Утверждённый — финальная версия, доступная для просмотра родителями"
          ]
        }
      ],
      notes: [
        "Утверждённый протокол нельзя редактировать без создания нового",
        "Родители получают уведомление о готовности протокола",
        "Протоколы хранятся в системе не менее 5 лет"
      ]
    },
    nodes: [
      {
        id: "start",
        label: "Начало",
        icon: Play,
        type: "start" as const,
        tooltip: "Начало создания протокола",
        children: [
          {
            id: "select-child",
            label: "Выбор ребёнка",
            icon: Search,
            type: "step" as const,
            tooltip: "Поиск и выбор ребёнка из базы",
            description: "Используйте поиск по ФИО или ID для выбора ребёнка. Можно также добавить нового ребёнка, если он ещё не зарегистрирован в системе.",
            children: [
              {
                id: "fill-data",
                label: "Заполнение данных",
                icon: PenTool,
                type: "step" as const,
                tooltip: "Внесение основной информации о консилиуме",
                description: "Укажите дату проведения, состав участников консилиума, повод обращения и цель обследования.",
                children: [
                  {
                    id: "checklist",
                    label: "Чеклисты",
                    icon: ClipboardList,
                    type: "step" as const,
                    tooltip: "Заполнение диагностических чеклистов",
                    description: "Последовательно заполните чеклисты по всем сферам развития. Система подсветит требующие внимания области.",
                    children: [
                      {
                        id: "conclusion",
                        label: "Заключение",
                        icon: FileText,
                        type: "step" as const,
                        tooltip: "Формирование итогового заключения",
                        description: "Просмотрите автоматически сформированные рекомендации и отредактируйте заключение при необходимости.",
                        children: [
                          {
                            id: "save-draft",
                            label: "Черновик",
                            icon: Archive,
                            type: "step" as const,
                            tooltip: "Сохранение для последующего редактирования",
                            description: "Сохраните протокол как черновик, чтобы вернуться к нему позже. Черновики не видны родителям."
                          },
                          {
                            id: "save-final",
                            label: "Утверждение",
                            icon: CheckCircle,
                            type: "step" as const,
                            tooltip: "Финальное утверждение протокола",
                            description: "Утвердите протокол как финальную версию. После утверждения он становится доступен для просмотра родителями."
                          },
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },

  // Процесс записи на консультацию
  consultationBooking: {
    title: "Запись на консультацию",
    description: "Процесс записи родителя на консультацию к специалисту",
    processDetails: {
      title: "Запись на консультацию",
      description: "Описание процесса записи родителя к специалисту через публичный каталог",
      steps: [
        {
          title: "Создание слота специалистом",
          description: "Специалист создаёт доступные слоты для записи в своём расписании.",
          details: [
            "Выбор даты и времени",
            "Указание формата (очно/онлайн)",
            "Установка длительности консультации"
          ]
        },
        {
          title: "Публикация слота",
          description: "После создания слот становится видимым в публичном каталоге для родителей.",
          details: [
            "Автоматическая публикация при включённой настройке",
            "Ручная публикация через кнопку"
          ]
        },
        {
          title: "Поиск в каталоге",
          description: "Родитель находит специалиста или организацию через публичный каталог.",
          details: [
            "Фильтрация по специальности",
            "Фильтрация по округу (для Москвы)",
            "Просмотр профиля специалиста"
          ]
        },
        {
          title: "Запись на консультацию",
          description: "Родитель выбирает удобный слот и оформляет запись.",
          details: [
            "Выбор ребёнка для записи",
            "Добавление комментария о причине обращения",
            "Подтверждение записи"
          ]
        },
        {
          title: "Уведомления",
          description: "Система отправляет уведомления всем участникам.",
          details: [
            "Специалист получает уведомление о новой записи",
            "Родитель получает подтверждение записи",
            "Напоминание за день до консультации"
          ]
        },
        {
          title: "Проведение занятия",
          description: "В назначенное время проводится консультация. После неё специалист может отметить статус занятия.",
          details: [
            "Отметка о проведении",
            "Возможность отмены с указанием причины"
          ]
        }
      ],
      notes: [
        "Родитель может отменить запись заранее",
        "Слоты автоматически скрываются после записи"
      ]
    },
    nodes: [
      {
        id: "start",
        label: "Старт",
        icon: Play,
        type: "start" as const,
        tooltip: "Начало процесса записи",
        children: [
          {
            id: "create-slot",
            label: "Создание слота",
            icon: Calendar,
            type: "step" as const,
            tooltip: "Специалист создаёт доступный слот в расписании",
            description: "В разделе «Расписание» специалист создаёт слот для консультации, указывая дату, время, формат и длительность.",
            children: [
              {
                id: "publish",
                label: "Публикация",
                icon: Send,
                type: "step" as const,
                tooltip: "Слот становится видимым для родителей",
                description: "После публикации слот отображается в каталоге. Родители могут найти его через поиск по специалисту или организации.",
                children: [
                  {
                    id: "parent-view",
                    label: "Каталог",
                    icon: Search,
                    type: "step" as const,
                    tooltip: "Родитель находит специалиста в каталоге",
                    description: "Родитель использует публичный каталог для поиска. Доступны фильтры по специальности и округу.",
                    children: [
                      {
                        id: "parent-book",
                        label: "Запись",
                        icon: UserCheck,
                        type: "step" as const,
                        tooltip: "Родитель выбирает слот и записывается",
                        description: "Родитель выбирает удобное время, указывает ребёнка и причину обращения, затем подтверждает запись.",
                        children: [
                          {
                            id: "notification",
                            label: "Уведомление",
                            icon: Bell,
                            type: "step" as const,
                            tooltip: "Отправка уведомлений участникам",
                            description: "Система отправляет email-уведомления специалисту о новой записи и родителю о подтверждении."
                          },
                          {
                            id: "session",
                            label: "Занятие",
                            icon: Calendar,
                            type: "step" as const,
                            tooltip: "Проведение консультации",
                            description: "В назначенное время проводится консультация. Специалист отмечает статус занятия после его завершения."
                          },
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },

  // Административный цикл управления
  adminWorkflow: {
    title: "Административное управление",
    description: "Основные функции администратора системы",
    processDetails: {
      title: "Административное управление",
      description: "Описание возможностей и функций администратора платформы",
      steps: [
        {
          title: "Вход в админ-панель",
          description: "Администратор авторизуется и получает доступ к расширенным функциям управления.",
          details: [
            "Доступ только для пользователей с ролью admin",
            "Расширенное меню с административными разделами"
          ]
        },
        {
          title: "Управление пользователями",
          description: "Создание, редактирование и блокировка учётных записей пользователей.",
          details: [
            "Создание новых пользователей",
            "Сброс паролей",
            "Назначение ролей и прав",
            "Блокировка/разблокировка аккаунтов"
          ]
        },
        {
          title: "Управление организациями",
          description: "Модерация и настройка организаций в системе.",
          details: [
            "Одобрение заявок организаций",
            "Редактирование данных организаций",
            "Управление подписками"
          ]
        },
        {
          title: "Просмотр статистики",
          description: "Аналитика использования платформы и ключевые метрики.",
          details: [
            "Количество активных пользователей",
            "Статистика по занятиям",
            "Отчёты по организациям"
          ]
        },
        {
          title: "Системные настройки",
          description: "Конфигурация глобальных параметров системы.",
          details: [
            "Управление инструкциями",
            "Настройка email-шаблонов",
            "Логирование и мониторинг"
          ]
        }
      ],
      notes: [
        "Все действия администратора логируются",
        "Критичные операции требуют подтверждения"
      ]
    },
    nodes: [
      {
        id: "start",
        label: "Вход",
        icon: Shield,
        type: "start" as const,
        tooltip: "Авторизация администратора",
        children: [
          {
            id: "admin-panel",
            label: "Админ-панель",
            icon: LayoutDashboard,
            type: "step" as const,
            tooltip: "Главная страница администратора",
            description: "Обзорная панель с ключевыми метриками системы, последними действиями и быстрым доступом к основным разделам управления.",
            children: [
              {
                id: "users",
                label: "Пользователи",
                icon: Users,
                type: "step" as const,
                tooltip: "Управление учётными записями",
                description: "Создание, редактирование, блокировка пользователей. Сброс паролей и назначение ролей."
              },
              {
                id: "orgs",
                label: "Организации",
                icon: Building,
                type: "step" as const,
                tooltip: "Модерация организаций",
                description: "Просмотр и редактирование организаций, одобрение заявок, управление подписками."
              },
              {
                id: "stats",
                label: "Статистика",
                icon: TrendingUp,
                type: "step" as const,
                tooltip: "Аналитика и отчёты",
                description: "Ключевые метрики использования системы, графики и отчёты по различным разрезам."
              },
              {
                id: "settings",
                label: "Настройки",
                icon: Settings,
                type: "step" as const,
                tooltip: "Глобальные настройки системы",
                description: "Конфигурация инструкций, email-уведомлений, логирования и других системных параметров."
              },
            ]
          }
        ]
      }
    ]
  },

  // Путь родителя
  parentJourney: {
    title: "Путь родителя",
    description: "Основные действия родителя в личном кабинете",
    processDetails: {
      title: "Путь родителя в системе",
      description: "Описание возможностей личного кабинета родителя",
      steps: [
        {
          title: "Регистрация и авторизация",
          description: "Родитель создаёт аккаунт или входит в существующий.",
          details: [
            "Регистрация по email",
            "Подтверждение email-адреса",
            "Вход в личный кабинет"
          ]
        },
        {
          title: "Добавление ребёнка",
          description: "Родитель добавляет информацию о ребёнке в систему.",
          details: [
            "Заполнение данных ребёнка (ФИО, дата рождения, пол)",
            "Получение уникального идентификатора",
            "Передача ID специалисту для связи"
          ]
        },
        {
          title: "Прохождение тестов",
          description: "Доступные опросники и тесты для оценки развития ребёнка.",
          details: [
            "Тесты на развитие",
            "Опросник родительского стресса",
            "Просмотр результатов и рекомендаций"
          ]
        },
        {
          title: "Календарь занятий",
          description: "Просмотр расписания и запись на консультации.",
          details: [
            "Просмотр запланированных занятий",
            "Запись к специалисту через каталог",
            "Отмена записи при необходимости"
          ]
        },
        {
          title: "Уведомления",
          description: "Получение важных уведомлений о занятиях и результатах.",
          details: [
            "Напоминания о занятиях",
            "Уведомления о готовности протоколов",
            "Информация об изменениях в расписании"
          ]
        }
      ],
      notes: [
        "Данные ребёнка защищены и доступны только авторизованным специалистам",
        "Родитель может управлять доступом к данным ребёнка"
      ]
    },
    nodes: [
      {
        id: "start",
        label: "Вход",
        icon: Play,
        type: "start" as const,
        tooltip: "Начало работы родителя в системе",
        children: [
          {
            id: "auth",
            label: "Авторизация",
            icon: LogIn,
            type: "step" as const,
            tooltip: "Вход в личный кабинет родителя",
            description: "Родитель входит по email и паролю. При первом входе необходима регистрация и подтверждение email-адреса.",
            children: [
              {
                id: "dashboard",
                label: "Личный кабинет",
                icon: Home,
                type: "step" as const,
                tooltip: "Главная страница личного кабинета",
                description: "Обзорная страница с быстрым доступом к детям, тестам, календарю и уведомлениям.",
                children: [
                  {
                    id: "children",
                    label: "Мои дети",
                    icon: Users,
                    type: "step" as const,
                    tooltip: "Управление данными детей",
                    description: "Добавление, редактирование информации о детях. Просмотр уникальных идентификаторов для передачи специалистам."
                  },
                  {
                    id: "tests",
                    label: "Тесты",
                    icon: ClipboardList,
                    type: "step" as const,
                    tooltip: "Доступные опросники и тесты",
                    description: "Прохождение тестов для оценки развития ребёнка. Просмотр результатов и рекомендаций."
                  },
                  {
                    id: "calendar",
                    label: "Календарь",
                    icon: Calendar,
                    type: "step" as const,
                    tooltip: "Расписание занятий",
                    description: "Просмотр запланированных и прошедших занятий. Запись на новые консультации через каталог."
                  },
                  {
                    id: "notifications",
                    label: "Уведомления",
                    icon: Bell,
                    type: "step" as const,
                    tooltip: "Важные сообщения и напоминания",
                    description: "Уведомления о занятиях, изменениях в расписании, готовых протоколах и других событиях."
                  },
                ]
              }
            ]
          }
        ]
      }
    ]
  },
};

export default BusinessProcessFlowchart;
