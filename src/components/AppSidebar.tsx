import { ClipboardList, Users, Database, BarChart3, BookOpen, Settings, Bell, User } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";

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
  { id: "instructions", label: "Инструкции", icon: BookOpen },
  { id: "administration", label: "Администрирование", icon: Settings },
];

export function AppSidebar({ activeTab, onTabChange, isAdmin = true, onNavigateToProfile }: AppSidebarProps) {
  const { state } = useSidebar();
  const { profile } = useAuth();
  const notificationCount = 0; // TODO: Implement notification count logic

  return (
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
            <button
              onClick={onNavigateToProfile}
              className="relative p-2 hover:bg-accent rounded-md transition-colors"
              title="Уведомления"
            >
              <Bell className="h-5 w-5" />
              {notificationCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {notificationCount}
                </Badge>
              )}
            </button>
            <button
              onClick={onNavigateToProfile}
              className="flex items-center gap-2 p-2 hover:bg-accent rounded-md transition-colors"
              title="Профиль"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile?.avatar_url || ""} />
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            </button>
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
                const isActive = activeTab === item.id;
                
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => onTabChange(item.id)}
                      className={`w-full justify-start gap-3 ${
                        isActive ? "bg-primary text-primary-foreground" : "hover:bg-accent hover:text-accent-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {state !== "collapsed" && <span>{item.label}</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}