import { useState } from "react";
import { Menu, X, ClipboardList, Users, Database, BarChart3, BookOpen, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

interface MobileMenuProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const menuItems = [
  { id: "protocol", label: "Протокол ППк", icon: ClipboardList },
  { id: "checklists", label: "Чеклисты", icon: Users },
  { id: "list", label: "Список ППк", icon: Database },
  { id: "dashboard", label: "Дашборд", icon: BarChart3 },
  { id: "instructions", label: "Инструкции", icon: BookOpen },
  { id: "administration", label: "Администрирование", icon: Settings },
];

export const MobileMenu = ({ activeTab, onTabChange }: MobileMenuProps) => {
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
            const Icon = item.icon;
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