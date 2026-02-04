import { useState } from "react";
import { Menu, ClipboardList, Database, BarChart3, BookOpen, Settings, ChevronDown, Users, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";

interface MobileMenuProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isAdmin?: boolean;
  canAccessPublication?: boolean;
}

// Core feature - separate highlighted item
const childCardItem = { id: "child-card", label: "Карточка ребенка", icon: Users };

const menuItems = [
  { id: "protocol", label: "Протокол ППк", icon: ClipboardList },
  { id: "list", label: "Список ППк", icon: Database },
  { id: "dashboard", label: "Дашборд", icon: BarChart3 },
];

// Instructions module - separate section
const instructionsItem = { 
  id: "instructions", 
  label: "Инструкции", 
  icon: BookOpen,
  subItems: [
    { id: "instructions-ppk", label: "ППк" },
    { id: "instructions-schedule", label: "Расписание" },
    { id: "instructions-organization", label: "Организация" },
    { id: "instructions-legal", label: "НПБ" },
  ]
};

// Publication item
const publicationItem = { id: "public-profile", label: "Публичный профиль", icon: Globe };

const adminItems = { 
  id: "administration", 
  label: "Администрирование", 
  icon: Settings,
  subItems: [
    { id: "administration-access-requests", label: "Заявки" },
    { id: "administration-commercial-offers", label: "КП заявки" },
    { id: "administration-users", label: "Пользователи" },
    { id: "administration-parent-children", label: "Родители и дети" },
    { id: "administration-organizations", label: "Организации" },
    { id: "administration-subscriptions", label: "Подписки" },
    { id: "administration-analytics", label: "Аналитика" },
    { id: "administration-site-analytics", label: "SMM аналитика" },
    { id: "administration-payment-logs", label: "Логи платежей" },
    { id: "administration-checklist", label: "Чеклист" },
    { id: "administration-parent-tests", label: "Тесты родителей" },
    { id: "administration-instructions", label: "Инструкции" },
    { id: "administration-statistics", label: "Статистика" },
    { id: "administration-school-years", label: "Учебные годы" },
    { id: "administration-email-logs", label: "Логи Email" },
    { id: "administration-auth-logs", label: "Логи авторизации" },
    { id: "administration-error-logs", label: "Логи ошибок" },
    { id: "administration-change-history", label: "История изменений" },
  ]
};

export const MobileMenu = ({ activeTab, onTabChange, isAdmin = true, canAccessPublication = true }: MobileMenuProps) => {
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
          {/* Core Feature - Child Card - Highlighted separately */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground px-3 flex items-center gap-2">
              Ядро системы
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-600">
                Core
              </span>
            </p>
            <Button
              variant={activeTab === childCardItem.id ? "default" : "outline"}
              className={`w-full justify-start gap-3 ${
                activeTab === childCardItem.id 
                  ? "bg-orange-500 text-white hover:bg-orange-600" 
                  : "border-orange-200 hover:bg-orange-50 hover:text-orange-700"
              }`}
              onClick={() => handleTabClick(childCardItem.id)}
            >
              <childCardItem.icon className="h-4 w-4" />
              {childCardItem.label}
            </Button>
          </div>

          <Separator className="my-3" />

          <p className="text-xs font-medium text-muted-foreground px-3">Система ППК</p>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <Button
                key={item.id}
                variant={isActive ? "default" : "ghost"}
                className="w-full justify-start gap-3"
                onClick={() => handleTabClick(item.id)}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Button>
            );
          })}

          <Separator className="my-3" />

          {/* Instructions section */}
          <p className="text-xs font-medium text-muted-foreground px-3">Справка</p>
          <Collapsible
            defaultOpen={activeTab.startsWith("instructions-")}
            className="space-y-1"
          >
            <CollapsibleTrigger asChild>
              <Button
                variant={activeTab.startsWith("instructions-") ? "default" : "ghost"}
                className="w-full justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <instructionsItem.icon className="h-4 w-4" />
                  {instructionsItem.label}
                </div>
                <ChevronDown className="h-4 w-4 transition-transform duration-200 data-[state=open]:rotate-180" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1 pl-4">
              {instructionsItem.subItems.map((subItem) => {
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

          {/* Publication section */}
          {canAccessPublication && (
            <>
              <Separator className="my-3" />
              <p className="text-xs font-medium text-muted-foreground px-3">Публикация</p>
              <Button
                variant={activeTab === publicationItem.id ? "default" : "ghost"}
                className="w-full justify-start gap-3"
                onClick={() => handleTabClick(publicationItem.id)}
              >
                <publicationItem.icon className="h-4 w-4" />
                {publicationItem.label}
              </Button>
            </>
          )}

          {/* Admin section */}
          {isAdmin && (
            <>
              <Separator className="my-3" />
              <p className="text-xs font-medium text-muted-foreground px-3">Администрирование</p>
              <Collapsible
                defaultOpen={activeTab.startsWith("administration-")}
                className="space-y-1"
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant={activeTab.startsWith("administration-") ? "default" : "ghost"}
                    className="w-full justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <adminItems.icon className="h-4 w-4" />
                      {adminItems.label}
                    </div>
                    <ChevronDown className="h-4 w-4 transition-transform duration-200 data-[state=open]:rotate-180" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-1 pl-4">
                  {adminItems.subItems.map((subItem) => {
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
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};