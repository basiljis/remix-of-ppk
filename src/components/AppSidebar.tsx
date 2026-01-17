import { ClipboardList, Database, BarChart3, BookOpen, Settings } from "lucide-react";
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

interface AppSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isAdmin?: boolean;
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
  { 
    id: "administration", 
    label: "Администрирование", 
    icon: Settings,
    subItems: [
      { id: "administration-access-requests", label: "Заявки" },
      { id: "administration-commercial-offers", label: "КП заявки" },
      { id: "administration-users", label: "Пользователи" },
      { id: "administration-organizations", label: "Организации" },
      { id: "administration-schedule", label: "Расписание" },
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

export function AppSidebar({ activeTab, onTabChange, isAdmin = true }: AppSidebarProps) {
  const { state } = useSidebar();

  return (
    <TooltipProvider>
      <Sidebar className={`${state === "collapsed" ? "w-14" : "w-60"} pt-16`} collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Система ППК</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                if (item.id === "administration" && !isAdmin) return null;
                
                const Icon = item.icon;
                const isActive = activeTab === item.id || activeTab.startsWith(item.id + "-");
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
                              {item.subItems.map((subItem) => (
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
                            {item.subItems.map((subItem) => {
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
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      </Sidebar>
    </TooltipProvider>
  );
}