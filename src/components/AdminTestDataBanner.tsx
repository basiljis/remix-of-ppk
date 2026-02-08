import { Shield, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ViewMode } from "./AdminViewSwitcher";

interface AdminTestDataBannerProps {
  viewMode: ViewMode;
  onReset: () => void;
}

const viewModeLabels: Record<ViewMode, string> = {
  specialist: "Специалист организации",
  parent: "Родитель",
  private: "Частный специалист",
  org_admin: "Админ организации",
  director: "Руководитель",
};

export function AdminTestDataBanner({ viewMode, onReset }: AdminTestDataBannerProps) {
  if (viewMode === "specialist") return null; // Don't show banner for default view

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4">
      <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-primary/90 text-primary-foreground shadow-lg backdrop-blur-sm border border-primary">
        <Shield className="h-4 w-4" />
        <span className="text-sm font-medium">
          Режим просмотра: {viewModeLabels[viewMode]}
        </span>
        <Button
          variant="secondary"
          size="sm"
          className="h-6 px-2 text-xs rounded-full"
          onClick={onReset}
        >
          <X className="h-3 w-3 mr-1" />
          Сбросить
        </Button>
      </div>
    </div>
  );
}
