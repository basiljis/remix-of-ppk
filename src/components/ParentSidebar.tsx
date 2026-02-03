import { Baby, ClipboardList, CalendarDays, User, BookOpen, Gamepad2, Library } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface ParentSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  childrenCount?: number;
}

const menuItems = [
  { id: "children", label: "Мои дети", icon: Baby },
  { id: "tests", label: "Тесты", icon: ClipboardList },
  { id: "calendar", label: "Календарь занятий", icon: CalendarDays },
  { id: "instructions", label: "Инструкции", icon: BookOpen },
];

const developmentItems = [
  { id: "materials", label: "Материалы", icon: Library, route: "/parent/materials" },
  { id: "playground", label: "Игровая ребёнка", icon: Gamepad2, route: "/child-playground" },
];

export function ParentSidebar({ activeTab, onTabChange, childrenCount = 0 }: ParentSidebarProps) {
  const { state } = useSidebar();
  const navigate = useNavigate();

  return (
    <TooltipProvider>
      <Sidebar className={`${state === "collapsed" ? "w-14" : "w-60"} pt-16`} collapsible="icon">
        <SidebarContent>
          {/* Main menu items */}
          <SidebarGroup>
            <SidebarGroupLabel className="flex items-center gap-2">
              Личный кабинет
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-600 dark:text-pink-400">
                Родитель
              </span>
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  
                  return (
                    <SidebarMenuItem key={item.id}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SidebarMenuButton
                            onClick={() => onTabChange(item.id)}
                            className={`w-full justify-start gap-3 ${
                              isActive 
                                ? "bg-pink-500 text-white" 
                                : "hover:bg-pink-50 hover:text-pink-700 dark:hover:bg-pink-950 dark:hover:text-pink-300"
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                            {state !== "collapsed" && (
                              <div className="flex items-center justify-between flex-1">
                                <span>{item.label}</span>
                                {item.id === "children" && childrenCount > 0 && (
                                  <Badge 
                                    variant="secondary" 
                                    className={`ml-2 ${isActive ? "bg-white/20 text-white" : "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300"}`}
                                  >
                                    {childrenCount}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </SidebarMenuButton>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <p>{item.label}</p>
                          {item.id === "children" && childrenCount > 0 && (
                            <p className="text-xs text-muted-foreground">{childrenCount} детей</p>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <Separator className="my-2" />

          {/* Development section */}
          <SidebarGroup>
            <SidebarGroupLabel className="flex items-center gap-2">
              Развитие
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                Материалы
              </span>
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {developmentItems.map((item) => {
                  const Icon = item.icon;
                  
                  return (
                    <SidebarMenuItem key={item.id}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SidebarMenuButton
                            onClick={() => navigate(item.route)}
                            className="w-full justify-start gap-3 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950 dark:hover:text-emerald-300"
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

          <Separator className="my-2" />

          {/* Profile section */}
          <SidebarGroup>
            <SidebarGroupLabel className="flex items-center gap-2">
              <User className="h-3 w-3" />
              Настройки
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton
                        onClick={() => onTabChange("profile")}
                        className={`w-full justify-start gap-3 ${
                          activeTab === "profile" 
                            ? "bg-primary text-primary-foreground" 
                            : "hover:bg-accent hover:text-accent-foreground"
                        }`}
                      >
                        <User className="h-4 w-4" />
                        {state !== "collapsed" && <span>Профиль</span>}
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>Профиль</p>
                    </TooltipContent>
                  </Tooltip>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </TooltipProvider>
  );
}
