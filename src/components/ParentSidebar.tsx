import { Baby, ClipboardList, CalendarDays, User, BookOpen, ChevronRight } from "lucide-react";
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
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
];

export function ParentSidebar({ activeTab, onTabChange, childrenCount = 0 }: ParentSidebarProps) {
  const { state } = useSidebar();

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
