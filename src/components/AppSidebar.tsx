import { ClipboardList, Database, BarChart3, BookOpen, Settings, Calendar, Users, Wallet, Cog, Info, FileText, Building } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { startOfDay, endOfDay, startOfWeek, endOfWeek } from "date-fns";

interface AppSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isAdmin?: boolean;
  isOrgAdmin?: boolean;
  isDirector?: boolean;
  hasOrganizationAccess?: boolean;
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
  subItems: [
    { id: "schedule-calendar", label: "Моё расписание" },
    { id: "schedule-children", label: "Дети" },
    { id: "schedule-statistics", label: "Статистика" },
  ]
};

// Organization module - for org admins and directors
const organizationItem = { 
  id: "organization-module", 
  label: "Организация", 
  icon: Building,
  subItems: [
    { id: "organization-employees", label: "Сотрудники" },
    { id: "organization-schedule", label: "Расписание организации" },
    { id: "organization-rates", label: "Ставки специалистов" },
    { id: "organization-statistics", label: "Статистика" },
    { id: "organization-kpi", label: "KPI сотрудников" },
    { id: "organization-holidays", label: "Нерабочие дни" },
    { id: "organization-requests", label: "Запросы на согласование" },
  ]
};

const adminItems = [
  { 
    id: "admin-users", 
    label: "Пользователи", 
    icon: Users,
    subItems: [
      { id: "administration-access-requests", label: "Заявки" },
      { id: "administration-users", label: "Пользователи" },
      { id: "administration-org-admins", label: "Админы организаций" },
    ]
  },
  { 
    id: "admin-finance", 
    label: "Финансы", 
    icon: Wallet,
    subItems: [
      { id: "administration-commercial-offers", label: "КП заявки" },
      { id: "administration-subscriptions", label: "Подписки" },
      { id: "administration-payment-logs", label: "Логи платежей" },
    ]
  },
  { 
    id: "admin-settings", 
    label: "Настройки", 
    icon: Cog,
    subItems: [
      { id: "administration-positions-roles", label: "Должности и роли" },
      { id: "administration-organizations", label: "Организации" },
      { id: "administration-checklist", label: "Чек-листы" },
      { id: "administration-schedule", label: "Настройки расписания" },
      { id: "administration-school-years", label: "Учебные годы" },
      { id: "administration-workload-report", label: "Загрузка специалистов" },
      { id: "administration-session-notifications", label: "Уведомления" },
      { id: "administration-instructions", label: "Инструкции" },
    ]
  },
  { 
    id: "admin-info", 
    label: "Инфо", 
    icon: Info,
    subItems: [
      { id: "administration-statistics", label: "Статистика" },
      { id: "administration-analytics", label: "Аналитика" },
    ]
  },
  { 
    id: "admin-logs", 
    label: "Логи", 
    icon: FileText,
    subItems: [
      { id: "administration-auth-logs", label: "Логи авторизации" },
      { id: "administration-error-logs", label: "Логи ошибок" },
      { id: "administration-change-history", label: "История изменений" },
      { id: "administration-email-logs", label: "Логи Email" },
    ]
  },
];

export function AppSidebar({ activeTab, onTabChange, isAdmin = false, isOrgAdmin = false, isDirector = false, hasOrganizationAccess = false }: AppSidebarProps) {
  const { state } = useSidebar();
  const { user, profile } = useAuth();
  const canSeeOrganization = isOrgAdmin || isDirector || isAdmin || hasOrganizationAccess;

  // Fetch session counts for sidebar badges
  const today = new Date();
  const todayStart = startOfDay(today).toISOString().split('T')[0];
  const weekStart = startOfWeek(today, { weekStartsOn: 1 }).toISOString().split('T')[0];
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 }).toISOString().split('T')[0];

  const { data: sessionCounts } = useQuery({
    queryKey: ["sidebar-session-counts", user?.id, todayStart],
    queryFn: async () => {
      if (!user?.id) return { today: 0, week: 0 };
      
      // Get today's sessions count (planned status)
      const { count: todayCount } = await supabase
        .from("sessions")
        .select("*", { count: "exact", head: true })
        .eq("specialist_id", user.id)
        .eq("scheduled_date", todayStart);

      // Get this week's sessions count
      const { count: weekCount } = await supabase
        .from("sessions")
        .select("*", { count: "exact", head: true })
        .eq("specialist_id", user.id)
        .gte("scheduled_date", weekStart)
        .lte("scheduled_date", weekEnd);

      return { 
        today: todayCount || 0, 
        week: weekCount || 0
      };
    },
    enabled: !!user?.id,
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch children count
  const { data: childrenCount } = useQuery({
    queryKey: ["sidebar-children-count", profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return 0;
      
      const { count } = await supabase
        .from("children")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", profile.organization_id)
        .eq("is_active", true);

      return count || 0;
    },
    enabled: !!profile?.organization_id,
  });

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
              {(() => {
                const hasSubItems = 'subItems' in scheduleItem && scheduleItem.subItems;
                const isActive = hasSubItems 
                  ? scheduleItem.subItems.some(sub => activeTab === sub.id)
                  : activeTab === scheduleItem.id;
                
                if (hasSubItems) {
                  return (
                    <Collapsible
                      key={scheduleItem.id}
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
                                <scheduleItem.icon className="h-4 w-4" />
                                {state !== "collapsed" && (
                                  <>
                                    <span>{scheduleItem.label}</span>
                                    <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                  </>
                                )}
                              </SidebarMenuButton>
                            </CollapsibleTrigger>
                          </TooltipTrigger>
                          {state === "collapsed" && (
                            <TooltipContent side="right" className="flex flex-col gap-1">
                              <p className="font-medium">{scheduleItem.label}</p>
                              {scheduleItem.subItems?.map((subItem) => (
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
                            {scheduleItem.subItems?.map((subItem) => {
                              const isSubActive = activeTab === subItem.id;
                              const badge = subItem.id === "schedule-calendar" 
                                ? sessionCounts?.today 
                                : subItem.id === "schedule-children" 
                                  ? childrenCount 
                                  : null;
                              return (
                                <SidebarMenuSubItem key={subItem.id}>
                                  <SidebarMenuSubButton
                                    onClick={() => onTabChange(subItem.id)}
                                    className={`justify-between ${
                                      isSubActive ? "bg-primary/10 text-primary font-medium" : ""
                                    }`}
                                  >
                                    <span>{subItem.label}</span>
                                    {badge !== null && badge > 0 && (
                                      <Badge 
                                        variant="secondary" 
                                        className="ml-auto h-5 min-w-5 px-1.5 text-[10px] font-medium"
                                      >
                                        {badge}
                                      </Badge>
                                    )}
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
                );
              })()}
              {canSeeOrganization && (() => {
                const hasSubItems = 'subItems' in organizationItem && organizationItem.subItems;
                const isActive = hasSubItems 
                  ? organizationItem.subItems.some(sub => activeTab === sub.id)
                  : activeTab === organizationItem.id;
                
                if (hasSubItems) {
                  return (
                    <Collapsible
                      key={organizationItem.id}
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
                                <organizationItem.icon className="h-4 w-4" />
                                {state !== "collapsed" && (
                                  <>
                                    <span>{organizationItem.label}</span>
                                    <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                  </>
                                )}
                              </SidebarMenuButton>
                            </CollapsibleTrigger>
                          </TooltipTrigger>
                          {state === "collapsed" && (
                            <TooltipContent side="right" className="flex flex-col gap-1">
                              <p className="font-medium">{organizationItem.label}</p>
                              {organizationItem.subItems?.map((subItem) => (
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
                            {organizationItem.subItems?.map((subItem) => {
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
                  <SidebarMenuItem>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SidebarMenuButton
                          onClick={() => onTabChange(organizationItem.id)}
                          className={`w-full justify-start gap-3 ${
                            activeTab === organizationItem.id 
                              ? "bg-primary text-primary-foreground" 
                              : "hover:bg-accent hover:text-accent-foreground"
                          }`}
                        >
                          <organizationItem.icon className="h-4 w-4" />
                          {state !== "collapsed" && <span>{organizationItem.label}</span>}
                        </SidebarMenuButton>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>{organizationItem.label}</p>
                      </TooltipContent>
                    </Tooltip>
                  </SidebarMenuItem>
                );
              })()}
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
                  const hasSubItems = 'subItems' in item && item.subItems;
                  const isActive = hasSubItems 
                    ? item.subItems.some(sub => activeTab === sub.id)
                    : activeTab === item.id;
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