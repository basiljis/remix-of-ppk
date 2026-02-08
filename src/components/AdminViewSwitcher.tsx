import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Eye,
  GraduationCap,
  Users,
  Building2,
  UserCircle,
  Briefcase,
  ChevronDown,
  Shield,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type ViewMode = "specialist" | "parent" | "private" | "org_admin" | "director";

interface AdminViewSwitcherProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

const viewModes: {
  id: ViewMode;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
}[] = [
  {
    id: "specialist",
    label: "Специалист организации",
    description: "Стандартный сотрудник (педагог-психолог, логопед)",
    icon: GraduationCap,
    color: "text-primary",
  },
  {
    id: "parent",
    label: "Родитель",
    description: "Родительский кабинет с детьми и тестами",
    icon: Users,
    color: "text-pink-500",
  },
  {
    id: "private",
    label: "Частный специалист",
    description: "Специалист без организации (частная практика)",
    icon: Briefcase,
    color: "text-amber-500",
  },
  {
    id: "org_admin",
    label: "Админ организации",
    description: "Управление сотрудниками и настройками",
    icon: Building2,
    color: "text-blue-500",
  },
  {
    id: "director",
    label: "Руководитель",
    description: "Директор организации (полный доступ)",
    icon: UserCircle,
    color: "text-orange-500",
  },
];

export function AdminViewSwitcher({ currentView, onViewChange }: AdminViewSwitcherProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const currentMode = viewModes.find((m) => m.id === currentView) || viewModes[0];
  const Icon = currentMode.icon;

  const handleViewChange = (view: ViewMode) => {
    if (view === "parent") {
      // Navigate to parent dashboard for parent view
      navigate("/parent");
    } else {
      onViewChange(view);
    }
    setOpen(false);
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="hidden md:flex items-center gap-2 border-dashed border-primary/30 bg-gradient-to-r from-primary/5 to-accent/5 hover:from-primary/10 hover:to-accent/10"
              >
                <Eye className="h-4 w-4 text-primary" />
                <Icon className={`h-4 w-4 ${currentMode.color}`} />
                <span className="text-xs font-medium max-w-[100px] truncate">
                  {currentMode.label.split(" ")[0]}
                </span>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <div>
                <p className="font-medium">Режим просмотра</p>
                <p className="text-xs text-muted-foreground">
                  Тестирование интерфейсов разных ролей
                </p>
              </div>
            </div>
          </TooltipContent>

          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <span>Режим просмотра</span>
              <Badge variant="outline" className="ml-auto text-[10px]">
                Тестирование
              </Badge>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            {viewModes.map((mode) => {
              const ModeIcon = mode.icon;
              const isActive = currentView === mode.id;

              return (
                <DropdownMenuItem
                  key={mode.id}
                  onClick={() => handleViewChange(mode.id)}
                  className={`flex items-start gap-3 p-3 cursor-pointer ${
                    isActive ? "bg-accent" : ""
                  }`}
                >
                  <ModeIcon className={`h-5 w-5 mt-0.5 ${mode.color}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{mode.label}</span>
                      {isActive && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          Активен
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {mode.description}
                    </p>
                  </div>
                </DropdownMenuItem>
              );
            })}

            <DropdownMenuSeparator />
            <div className="px-3 py-2 bg-muted/50 rounded-b-md">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Shield className="h-3 w-3" />
                Данные отображаются с тестовым наполнением
              </p>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </Tooltip>
    </TooltipProvider>
  );
}
