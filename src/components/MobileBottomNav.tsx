import { useState } from "react";
import { ClipboardList, Users, BarChart3, BookOpen, Settings, Calendar, Globe, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

interface MobileBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isAdmin?: boolean;
  canAccessPublication?: boolean;
  isPrivateSpecialist?: boolean;
}

const primaryTabs = [
  { id: "child-card", label: "Дети", icon: Users },
  { id: "protocol", label: "ППк", icon: ClipboardList },
  { id: "schedule-module", label: "Расписание", icon: Calendar },
  { id: "dashboard", label: "Дашборд", icon: BarChart3 },
];

export const MobileBottomNav = ({
  activeTab,
  onTabChange,
  isAdmin = false,
  canAccessPublication = false,
  isPrivateSpecialist = false,
}: MobileBottomNavProps) => {
  const [moreOpen, setMoreOpen] = useState(false);

  const handleTabClick = (tabId: string) => {
    onTabChange(tabId);
    setMoreOpen(false);
  };

  const isTabActive = (id: string) => {
    if (id === "schedule-module") return activeTab.startsWith("schedule-");
    return activeTab === id;
  };

  const isMoreActive =
    activeTab.startsWith("instructions-") ||
    activeTab.startsWith("administration-") ||
    activeTab === "public-profile" ||
    activeTab === "payment-settings" ||
    activeTab === "organization-module" ||
    activeTab.startsWith("organization-");

  const moreItems = [
    { id: "instructions-ppk", label: "Инструкции", icon: BookOpen, group: "Справка" },
    ...(canAccessPublication
      ? [{ id: "public-profile", label: "Публичный профиль", icon: Globe, group: "Публикация" }]
      : []),
    ...(isAdmin
      ? [{ id: "administration-users", label: "Администрирование", icon: Settings, group: "Администрирование" }]
      : []),
  ];

  return (
    <>
      {/* Bottom nav bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border/60 pb-safe">
        <div className="flex items-center justify-around px-2 h-16">
          {primaryTabs.map((tab) => {
            const Icon = tab.icon;
            const active = isTabActive(tab.id);
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={cn(
                  "flex flex-col items-center gap-0.5 flex-1 py-2 px-1 rounded-xl transition-all duration-200",
                  active
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                <div
                  className={cn(
                    "flex items-center justify-center w-10 h-6 rounded-full transition-all duration-200",
                    active && "bg-primary/10"
                  )}
                >
                  <Icon className={cn("h-5 w-5 transition-transform duration-200", active && "scale-110")} />
                </div>
                <span className={cn("text-[10px] font-medium leading-none", active && "font-semibold")}>
                  {tab.label}
                </span>
              </button>
            );
          })}

          {/* More button */}
          <button
            onClick={() => setMoreOpen(true)}
            className={cn(
              "flex flex-col items-center gap-0.5 flex-1 py-2 px-1 rounded-xl transition-all duration-200",
              isMoreActive ? "text-primary" : "text-muted-foreground"
            )}
          >
            <div
              className={cn(
                "flex items-center justify-center w-10 h-6 rounded-full transition-all duration-200",
                isMoreActive && "bg-primary/10"
              )}
            >
              <MoreHorizontal className={cn("h-5 w-5", isMoreActive && "scale-110")} />
            </div>
            <span className={cn("text-[10px] font-medium leading-none", isMoreActive && "font-semibold")}>
              Ещё
            </span>
          </button>
        </div>
      </nav>

      {/* "More" sheet */}
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="md:hidden rounded-t-2xl pb-safe max-h-[60vh]">
          <SheetHeader className="pb-2">
            <SheetTitle className="text-sm text-muted-foreground font-normal">Дополнительно</SheetTitle>
          </SheetHeader>
          <div className="space-y-1 overflow-y-auto">
            {moreItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id || 
                (item.id === "instructions-ppk" && activeTab.startsWith("instructions-")) ||
                (item.id === "administration-users" && activeTab.startsWith("administration-"));
              return (
                <Button
                  key={item.id}
                  variant={active ? "secondary" : "ghost"}
                  className="w-full justify-start gap-3 h-12 text-base"
                  onClick={() => handleTabClick(item.id)}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
