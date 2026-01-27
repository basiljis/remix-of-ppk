import { useState } from "react";
import { Menu, ClipboardList, Database, BarChart3, BookOpen, Settings, ChevronDown, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface MobileMenuProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isAdmin?: boolean;
}

const menuItems = [
  { id: "protocol", label: "Протокол ППк", icon: ClipboardList },
  { id: "list", label: "Список ППк", icon: Database },
  { id: "dashboard", label: "Дашборд", icon: BarChart3 },
  { id: "child-card", label: "Карточка ребенка", icon: Users },
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

export const MobileMenu = ({ activeTab, onTabChange, isAdmin = true }: MobileMenuProps) => {
  const [open, setOpen] = useState(false);

  const handleTabClick = (tabId: string) => {
    onTabChange(tabId);
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80">
        <SheetHeader>
          <SheetTitle>Меню</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-2">
          {menuItems.map((item) => {
            if (item.id === "administration" && !isAdmin) return null;
            
            const Icon = item.icon;
            const isActive = activeTab === item.id || activeTab.startsWith(item.id + "-");
            const hasSubItems = 'subItems' in item && item.subItems;
            
            if (hasSubItems) {
              return (
                <Collapsible
                  key={item.id}
                  defaultOpen={isActive}
                  className="space-y-1"
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      className="w-full justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </div>
                      <ChevronDown className="h-4 w-4 transition-transform duration-200 data-[state=open]:rotate-180" />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-1 pl-4">
                    {item.subItems.map((subItem) => {
                      const isSubActive = activeTab === subItem.id;
                      return (
                        <Button
                          key={subItem.id}
                          variant={isSubActive ? "secondary" : "ghost"}
                          className="w-full justify-start text-sm"
                          onClick={() => handleTabClick(subItem.id)}
                        >
                          {subItem.label}
                        </Button>
                      );
                    })}
                  </CollapsibleContent>
                </Collapsible>
              );
            }
            
            return (
              <Button
                key={item.id}
                variant={activeTab === item.id ? "default" : "ghost"}
                className="w-full justify-start gap-3"
                onClick={() => handleTabClick(item.id)}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Button>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
};