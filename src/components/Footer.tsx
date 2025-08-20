import { ClipboardList, Users, Database, BarChart3, BookOpen, Settings } from "lucide-react";
interface FooterProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}
const menuItems = [{
  id: "protocol",
  label: "Протокол ППк",
  icon: ClipboardList
}, {
  id: "list",
  label: "Список ППк",
  icon: Database
}, {
  id: "dashboard",
  label: "Дашборд",
  icon: BarChart3
}, {
  id: "instructions",
  label: "Инструкции",
  icon: BookOpen
}, {
  id: "administration",
  label: "Администрирование",
  icon: Settings
}];
export const Footer = ({
  activeTab,
  onTabChange
}: FooterProps) => {
  return <footer className="bg-background border-t mt-12">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          {/* Logo and Copyright */}
          <div className="flex flex-col items-center lg:items-start gap-4">
            <span className="text-lg font-bold text-foreground">headquaters</span>
            <p className="text-sm text-muted-foreground">
              © 2023-2025 Все права защищены
            </p>
          </div>

          {/* Navigation Menu */}
          <nav className="flex flex-wrap justify-center gap-6">
            {menuItems.map(item => <button key={item.id} onClick={() => onTabChange(item.id)} className={`text-sm transition-colors hover:text-primary ${activeTab === item.id ? "text-primary font-medium" : "text-muted-foreground"}`}>
                {item.label}
              </button>)}
          </nav>
        </div>
      </div>
    </footer>;
};