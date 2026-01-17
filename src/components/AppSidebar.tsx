import { ClipboardList, Database, BarChart3, BookOpen, Settings, Calendar } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronRight } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";

interface AppSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isAdmin?: boolean;
  isOrgAdmin?: boolean;
}

const menuItems = [
  { id: "protocol", label: "Протокол ППк", icon: ClipboardList },
  { id: "list", label: "Список ППк", icon: Database },
  { id: "dashboard", label: "Дашборд", icon: BarChart3 },
  { 
    id: "instructions", 
    label: "Инструкции", 
    icon: BookOpen,
    subItems: [
      { id: "instructions-work", label: "По работе" },
      { id: "instructions-custom", label: "Пользовательские" },
      { id: "instructions-legal", label: "НПБ" },
    ]
  },
];

// Separate schedule module - available with subscription
const scheduleItem = { 
  id: "schedule-module", 
  label: "Расписание", 
  icon: Calendar,
  isPremium: true,
};

const adminItems = [
  { 
    id: "administration", 
    label: "Администрирование", 
    icon: Settings,
    subItems: [
      { id: "administration-access-requests", label: "Заявки" },
      { id: "administration-commercial-offers", label: "КП заявки" },
      { id: "administration-users", label: "Пользователи" },
      { id: "administration-positions-roles", label: "Должности и роли" },
      { id: "administration-organizations", label: "Организации" },
      { id: "administration-schedule", label: "Настройки расписания" },
      { id: "administration-subscriptions", label: "Подписки" },
      { id: "administration-analytics", label: "Аналитика" },
      { id: "administration-payment-logs", label: "Логи платежей" },
      { id: "administration-checklist", label: "Чеклист" },
      { id: "administration-instructions", label: "Инструкции" },
      { id: "administration-statistics", label: "Статистика" },
      { id: "administration-school-years", label: "Учебные годы" },
      { id: "administration-email-logs", label: "Логи Email" },
      { id: "administration-auth-logs", label: "Логи авторизации" },
      { id: "administration-error-logs", label: "Логи ошибок" },
      { id: "administration-change-history", label: "История изменений" },
    ]
  },
];
export function AppSidebar({ activeTab, onTabChange, isAdmin = false, isOrgAdmin = false }: AppSidebarProps) {
  const { state } = useSidebar();

  const renderMenuItem = (item: typeof menuItems[0], isActive: boolean) => {
    const Icon = item.icon;
    const hasSubItems = 'subItems' in item && item.subItems;
    
    if (hasSubItems) {
      return (
        <Collapsible
          key={item.id}
          asChild
          defaultOpen={isActive}
          className="group/collapsible"
        >
          <SidebarMenuItem>
            <Tooltip>
              <TooltipTrigger asChild>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    className={`w-full justify-start gap-3 ${
                      isActive ? "bg-primary text-primary-foreground" : "hover:bg-accent hover:text-accent-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {state !== "collapsed" && (
                      <>
                        <span>{item.label}</span>
                        <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </>
                    )}
                  </SidebarMenuButton>
                </CollapsibleTrigger>
              </TooltipTrigger>
              {state === "collapsed" && (
                <TooltipContent side="right" className="flex flex-col gap-1">
                  <p className="font-medium">{item.label}</p>
                  {item.subItems?.map((subItem) => (
                    <button
                      key={subItem.id}
                      onClick={() => onTabChange(subItem.id)}
                      className="text-left text-sm hover:text-primary transition-colors"
                    >
                      • {subItem.label}
                    </button>
                  ))}
                </TooltipContent>
              )}
            </Tooltip>
            <CollapsibleContent>
              <SidebarMenuSub>
                {item.subItems?.map((subItem) => {
                  const isSubActive = activeTab === subItem.id;
                  return (
                    <SidebarMenuSubItem key={subItem.id}>
                      <SidebarMenuSubButton
                        onClick={() => onTabChange(subItem.id)}
                        className={
                          isSubActive ? "bg-primary/10 text-primary font-medium" : ""
                        }
                      >
                        <span>{subItem.label}</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  );
                })}
              </SidebarMenuSub>
            </CollapsibleContent>
          </SidebarMenuItem>
        </Collapsible>
      );
    }
    
    return (
      <SidebarMenuItem key={item.id}>
        <Tooltip>
          <TooltipTrigger asChild>
            <SidebarMenuButton
              onClick={() => onTabChange(item.id)}
              className={`w-full justify-start gap-3 ${
                isActive ? "bg-primary text-primary-foreground" : "hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {state !== "collapsed" && <span>{item.label}</span>}
            </SidebarMenuButton>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>{item.label}</p>
          </TooltipContent>
        </Tooltip>
      </SidebarMenuItem>
    );
  };

  return (
    <TooltipProvider>
      <Sidebar className={`${state === "collapsed" ? "w-14" : "w-60"} pt-16`} collapsible="icon">
      <SidebarContent>
        {/* Main menu items */}
        <SidebarGroup>
          <SidebarGroupLabel>Система ППК</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = activeTab === item.id || activeTab.startsWith(item.id + "-");
                return renderMenuItem(item, isActive);
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Schedule module - separate section */}
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-2">
            Модули
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">
              Premium
            </span>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SidebarMenuButton
                      onClick={() => onTabChange(scheduleItem.id)}
                      className={`w-full justify-start gap-3 ${
                        activeTab === scheduleItem.id 
                          ? "bg-primary text-primary-foreground" 
                          : "hover:bg-accent hover:text-accent-foreground"
                      }`}
                    >
                      <scheduleItem.icon className="h-4 w-4" />
                      {state !== "collapsed" && <span>{scheduleItem.label}</span>}
                    </SidebarMenuButton>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{scheduleItem.label}</p>
                  </TooltipContent>
                </Tooltip>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin section */}
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Управление</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => {
                  const isActive = activeTab === item.id || activeTab.startsWith(item.id + "-");
                  return renderMenuItem(item, isActive);
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      </Sidebar>
    </TooltipProvider>
  );
}