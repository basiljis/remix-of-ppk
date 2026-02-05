import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Archive
} from "lucide-react";

interface FlowNode {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  type: "start" | "step" | "decision" | "end";
  children?: FlowNode[];
}

interface BusinessProcessFlowchartProps {
  title: string;
  description: string;
  nodes: FlowNode[];
}

const FlowNodeComponent = ({ 
  node, 
  isStart = false,
  level = 0 
}: { 
  node: FlowNode; 
  isStart?: boolean;
  level?: number;
}) => {
  const Icon = node.icon;
  
  const getNodeStyles = () => {
    switch (node.type) {
      case "start":
        return "w-16 h-16 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30";
      case "end":
        return "w-16 h-16 rounded-full bg-muted text-muted-foreground border-2 border-dashed";
      case "decision":
        return "w-32 h-12 rounded-lg bg-accent text-accent-foreground border border-accent-foreground/20";
      default:
        return "min-w-[120px] h-12 rounded-lg bg-card text-card-foreground border-2 border-border shadow-sm hover:border-primary/50 transition-colors";
    }
  };

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
      
      {/* Main node */}
      <div className={`flex items-center justify-center gap-2 px-4 ${getNodeStyles()}`}>
        <Icon className={`${node.type === "start" || node.type === "end" ? "h-6 w-6" : "h-4 w-4"} flex-shrink-0`} />
        {node.type !== "start" && node.type !== "end" && (
          <span className="text-sm font-medium whitespace-nowrap">{node.label}</span>
        )}
      </div>
      
      {/* Label for start/end nodes */}
      {(node.type === "start" || node.type === "end") && (
        <span className="mt-2 text-xs font-medium text-muted-foreground">{node.label}</span>
      )}

      {/* Children */}
      {node.children && node.children.length > 0 && (
        <>
          {/* Connector line down */}
          <div className="w-0.5 h-6 bg-gradient-to-b from-primary/30 to-primary/60 mt-2" />
          <div className="w-2 h-2 rounded-full bg-primary" />
          
          {node.children.length === 1 ? (
            // Single child - just render vertically
            <FlowNodeComponent node={node.children[0]} level={level + 1} />
          ) : (
            // Multiple children - render horizontally with branches
            <div className="flex flex-col items-center">
              {/* Horizontal line container */}
              <div className="relative flex items-start justify-center mt-2">
                {/* Horizontal connecting line */}
                <div 
                  className="absolute top-0 h-0.5 bg-primary/40"
                  style={{
                    width: `${(node.children.length - 1) * 140}px`,
                    left: '50%',
                    transform: 'translateX(-50%)'
                  }}
                />
                
                {/* Child nodes */}
                <div className="flex gap-6">
                  {node.children.map((child, index) => (
                    <div key={child.id} className="flex flex-col items-center">
                      {/* Vertical connector to horizontal line */}
                      <div className="w-0.5 h-4 bg-primary/40" />
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      
                      {/* Child node */}
                      <div className={`flex items-center justify-center gap-2 px-4 mt-2 ${
                        child.type === "end" 
                          ? "min-w-[100px] h-10 rounded-lg bg-muted text-muted-foreground border border-dashed"
                          : "min-w-[100px] h-10 rounded-lg bg-card text-card-foreground border-2 border-border shadow-sm hover:border-primary/50 transition-colors"
                      }`}>
                        <child.icon className="h-4 w-4 flex-shrink-0" />
                        <span className="text-xs font-medium whitespace-nowrap">{child.label}</span>
                      </div>
                      
                      {/* Nested children */}
                      {child.children && child.children.length > 0 && (
                        <div className="flex flex-col items-center">
                          {child.children.map((grandchild) => (
                            <FlowNodeComponent key={grandchild.id} node={grandchild} level={level + 2} />
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

export const BusinessProcessFlowchart = ({ title, description, nodes }: BusinessProcessFlowchartProps) => {
  return (
    <Card className="overflow-hidden border-2">
      <CardHeader className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 text-white">
        <CardTitle className="text-lg">{title}</CardTitle>
        <p className="text-sm text-slate-300">{description}</p>
      </CardHeader>
      <CardContent className="pt-8 pb-8 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 overflow-x-auto">
        <div className="flex flex-col items-center min-w-fit px-4">
          {nodes.map((node, index) => (
            <FlowNodeComponent 
              key={node.id} 
              node={node} 
              isStart={index === 0 && node.type === "start"} 
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Predefined business process flows
export const businessProcessFlows = {
  // Путь пользователя (специалиста) в системе
  userJourney: {
    title: "Путь пользователя в системе",
    description: "Схема взаимодействия специалиста с основными модулями платформы",
    nodes: [
      {
        id: "start",
        label: "Старт",
        icon: Play,
        type: "start" as const,
        children: [
          {
            id: "auth",
            label: "Авторизация",
            icon: LogIn,
            type: "step" as const,
            children: [
              {
                id: "dashboard",
                label: "Главная",
                icon: Home,
                type: "step" as const,
                children: [
                  {
                    id: "ppk",
                    label: "ППк",
                    icon: ClipboardList,
                    type: "step" as const,
                  },
                  {
                    id: "schedule",
                    label: "Расписание",
                    icon: Calendar,
                    type: "step" as const,
                  },
                  {
                    id: "children",
                    label: "Дети",
                    icon: Users,
                    type: "step" as const,
                  },
                  {
                    id: "organization",
                    label: "Организация",
                    icon: Building,
                    type: "step" as const,
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
    nodes: [
      {
        id: "start",
        label: "Начало",
        icon: Play,
        type: "start" as const,
        children: [
          {
            id: "select-child",
            label: "Выбор ребёнка",
            icon: Search,
            type: "step" as const,
            children: [
              {
                id: "fill-data",
                label: "Заполнение данных",
                icon: PenTool,
                type: "step" as const,
                children: [
                  {
                    id: "checklist",
                    label: "Чеклисты",
                    icon: ClipboardList,
                    type: "step" as const,
                    children: [
                      {
                        id: "conclusion",
                        label: "Заключение",
                        icon: FileText,
                        type: "step" as const,
                        children: [
                          {
                            id: "save-draft",
                            label: "Черновик",
                            icon: Archive,
                            type: "step" as const,
                          },
                          {
                            id: "save-final",
                            label: "Утверждение",
                            icon: CheckCircle,
                            type: "step" as const,
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
    nodes: [
      {
        id: "start",
        label: "Старт",
        icon: Play,
        type: "start" as const,
        children: [
          {
            id: "create-slot",
            label: "Создание слота",
            icon: Calendar,
            type: "step" as const,
            children: [
              {
                id: "publish",
                label: "Публикация",
                icon: Send,
                type: "step" as const,
                children: [
                  {
                    id: "parent-view",
                    label: "Каталог",
                    icon: Search,
                    type: "step" as const,
                    children: [
                      {
                        id: "parent-book",
                        label: "Запись",
                        icon: UserCheck,
                        type: "step" as const,
                        children: [
                          {
                            id: "notification",
                            label: "Уведомление",
                            icon: Bell,
                            type: "step" as const,
                          },
                          {
                            id: "session",
                            label: "Занятие",
                            icon: Calendar,
                            type: "step" as const,
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
    nodes: [
      {
        id: "start",
        label: "Вход",
        icon: Shield,
        type: "start" as const,
        children: [
          {
            id: "admin-panel",
            label: "Админ-панель",
            icon: LayoutDashboard,
            type: "step" as const,
            children: [
              {
                id: "users",
                label: "Пользователи",
                icon: Users,
                type: "step" as const,
              },
              {
                id: "orgs",
                label: "Организации",
                icon: Building,
                type: "step" as const,
              },
              {
                id: "stats",
                label: "Статистика",
                icon: TrendingUp,
                type: "step" as const,
              },
              {
                id: "settings",
                label: "Настройки",
                icon: Settings,
                type: "step" as const,
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
    nodes: [
      {
        id: "start",
        label: "Вход",
        icon: Play,
        type: "start" as const,
        children: [
          {
            id: "auth",
            label: "Авторизация",
            icon: LogIn,
            type: "step" as const,
            children: [
              {
                id: "dashboard",
                label: "Личный кабинет",
                icon: Home,
                type: "step" as const,
                children: [
                  {
                    id: "children",
                    label: "Мои дети",
                    icon: Users,
                    type: "step" as const,
                  },
                  {
                    id: "tests",
                    label: "Тесты",
                    icon: ClipboardList,
                    type: "step" as const,
                  },
                  {
                    id: "calendar",
                    label: "Календарь",
                    icon: Calendar,
                    type: "step" as const,
                  },
                  {
                    id: "notifications",
                    label: "Уведомления",
                    icon: Bell,
                    type: "step" as const,
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
