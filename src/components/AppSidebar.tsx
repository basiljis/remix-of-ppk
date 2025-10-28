import { ClipboardList, Users, Database, BarChart3, BookOpen, Settings, User } from "lucide-react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { NotificationsDialog } from "@/components/NotificationsDialog";

interface AppSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isAdmin?: boolean;
  onNavigateToProfile?: () => void;
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
      { id: "administration-users", label: "Пользователи" },
      { id: "administration-organizations", label: "Организации" },
      { id: "administration-checklist", label: "Чеклист" },
      { id: "administration-instructions", label: "Инструкции" },
      { id: "administration-statistics", label: "Статистика" },
    ]
  },
];

export function AppSidebar({ activeTab, onTabChange, isAdmin = true, onNavigateToProfile }: AppSidebarProps) {
  const { state } = useSidebar();
  const { profile } = useAuth();
  const notificationCount = 0;

  return (
    <TooltipProvider>
      <Sidebar className={state === "collapsed" ? "w-14" : "w-60"} collapsible="icon">
        <SidebarHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => onTabChange("protocol")}
              className={`text-lg font-semibold hover:text-primary transition-colors ${state === "collapsed" ? "hidden" : ""}`}
            >
              ППК Система
            </button>
            <div className="flex items-center gap-2">
              <NotificationsDialog notificationCount={notificationCount} />
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={onNavigateToProfile}
                    className="flex items-center gap-2 p-2 hover:bg-accent rounded-md transition-colors"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile?.avatar_url || ""} />
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Профиль</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </SidebarHeader>
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
                          <TooltipContent side="right">
                            <p>{item.label}</p>
                          </TooltipContent>
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