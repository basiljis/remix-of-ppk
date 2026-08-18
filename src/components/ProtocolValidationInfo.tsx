import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, FileText } from "lucide-react";
import { useTranslation } from "react-i18next";

export const ProtocolValidationInfo = () => {
  const { t, i18n } = useTranslation("pages");
  const isEn = i18n.resolvedLanguage?.startsWith("en");

  return (
    <Card className="border-none shadow-sm bg-accent/5 max-w-4xl mx-auto my-8 overflow-hidden">
      <CardContent className="p-8 md:p-10 text-center">
        <h3 className="text-xl md:text-2xl font-bold mb-4 text-foreground">
          {isEn ? "UNIVERSUM Validation Protocol" : "Протокол валидации UNIVERSUM"}
        </h3>
        <p className="text-muted-foreground text-sm md:text-base leading-relaxed mb-8 max-w-3xl mx-auto">
          {isEn 
            ? "Each device passes 4 stages of verification: metric mapping, correlation analysis (r ≥ 0.7), pilot study (n ≥ 20) and certification."
            : "Каждое устройство проходит 4 этапа проверки: маппинг на метрику, корреляционный анализ (r ≥ 0.7), пилотное исследование (n ≥ 20) и сертификацию."}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button className="bg-[#1e3a8a] hover:bg-[#1e3a8a]/90 text-white px-8 h-11 rounded-md text-sm font-medium w-full sm:w-auto">
            <FileText className="mr-2 h-4 w-4" />
            {isEn ? "Full Documentation (EN)" : "Полная документация (RU)"}
          </Button>
          <Button variant="outline" className="bg-white hover:bg-gray-50 text-foreground border-gray-200 px-8 h-11 rounded-md text-sm font-medium w-full sm:w-auto">
            {isEn ? "Research Methodology" : "Методология исследований"}
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
