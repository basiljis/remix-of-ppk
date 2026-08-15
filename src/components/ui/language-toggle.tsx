import { Languages } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function LanguageToggle() {
  const { i18n, t } = useTranslation();
  const current = (i18n.resolvedLanguage || i18n.language || "ru").slice(0, 2).toUpperCase();

  const change = (lng: "ru" | "en" | "zh") => {
    void i18n.changeLanguage(lng);
    document.documentElement.lang = lng;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5" aria-label={t("language.switchTo")}>
          <Languages className="h-4 w-4" />
          <span className="text-xs font-medium">{current}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => change("ru")}>
          🇷🇺 {t("language.ru")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => change("en")}>
          🇬🇧 {t("language.en")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => change("zh")}>
          🇨🇳 {t("language.zh")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
