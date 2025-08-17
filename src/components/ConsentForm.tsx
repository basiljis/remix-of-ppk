import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { FileText, Download } from "lucide-react";
import jsPDF from "jspdf";

interface ConsentFormData {
  childName: string;
  childAge: string;
  childClass: string;
  parentName: string;
  parentPhone: string;
  consultationDate: string;
  consultationReason: string;
  additionalInfo: string;
}

export const ConsentForm = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<ConsentFormData>({
    childName: "",
    childAge: "",
    childClass: "",
    parentName: "",
    parentPhone: "",
    consultationDate: "",
    consultationReason: "",
    additionalInfo: ""
  });

  const handleInputChange = (field: keyof ConsentFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Настройка шрифта для корректного отображения кириллицы
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    
    // Заголовок
    doc.setFontSize(16);
    doc.text("СОГЛАСИЕ РОДИТЕЛЯ (ЗАКОННОГО ПРЕДСТАВИТЕЛЯ)", 105, 30, { align: "center" });
    doc.text("НА ПРОВЕДЕНИЕ ПСИХОЛОГО-ПЕДАГОГИЧЕСКОГО", 105, 40, { align: "center" });
    doc.text("ОБСЛЕДОВАНИЯ РЕБЕНКА", 105, 50, { align: "center" });
    
    doc.setFontSize(12);
    doc.text("Дата: " + new Date().toLocaleDateString(), 20, 70);
    
    // Основной текст
    const mainText = `Я, ${formData.parentName || "___________________"}, являясь родителем (законным представителем) ребенка ${formData.childName || "___________________"}, ${formData.childAge || "__"} лет, обучающегося в ${formData.childClass || "____"} классе, даю согласие на проведение психолого-педагогического обследования моего ребенка в рамках деятельности психолого-педагогического консилиума образовательной организации.`;
    
    const splitText = doc.splitTextToSize(mainText, 170);
    doc.text(splitText, 20, 90);
    
    // Дополнительные разделы
    doc.text("Цель обследования:", 20, 130);
    const reasonText = formData.consultationReason || "Определение особых образовательных потребностей обучающегося и выработка рекомендаций по организации психолого-педагогического сопровождения.";
    const splitReason = doc.splitTextToSize(reasonText, 170);
    doc.text(splitReason, 20, 140);
    
    doc.text("Дата проведения консилиума: " + (formData.consultationDate || "___________________"), 20, 170);
    
    // Права родителей
    const rightsText = `Я ознакомлен(а) с тем, что:
- имею право получить информацию о результатах обследования;
- имею право присутствовать при обследовании;
- данное согласие действует до окончания обследования;
- согласие может быть отозвано мною в письменной форме.`;
    
    const splitRights = doc.splitTextToSize(rightsText, 170);
    doc.text(splitRights, 20, 190);
    
    // Подпись
    doc.text("Родитель (законный представитель): _________________ / " + (formData.parentName || "___________________") + " /", 20, 240);
    doc.text("Телефон: " + (formData.parentPhone || "___________________"), 20, 250);
    doc.text("Дата: ___________________", 20, 260);
    
    // Сохранение файла
    doc.save(`Согласие_${formData.childName || 'ребенок'}_${new Date().toLocaleDateString()}.pdf`);
    
    toast({
      title: "PDF сгенерирован",
      description: "Согласие родителя успешно создано и загружено",
    });
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Генерация согласия родителей
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="childName">ФИО ребенка</Label>
            <Input
              id="childName"
              value={formData.childName}
              onChange={(e) => handleInputChange("childName", e.target.value)}
              placeholder="Иванов Иван Иванович"
            />
          </div>
          <div>
            <Label htmlFor="childAge">Возраст</Label>
            <Input
              id="childAge"
              value={formData.childAge}
              onChange={(e) => handleInputChange("childAge", e.target.value)}
              placeholder="7"
            />
          </div>
          <div>
            <Label htmlFor="childClass">Класс/группа</Label>
            <Input
              id="childClass"
              value={formData.childClass}
              onChange={(e) => handleInputChange("childClass", e.target.value)}
              placeholder="1А"
            />
          </div>
          <div>
            <Label htmlFor="parentName">ФИО родителя</Label>
            <Input
              id="parentName"
              value={formData.parentName}
              onChange={(e) => handleInputChange("parentName", e.target.value)}
              placeholder="Иванова Мария Петровна"
            />
          </div>
          <div>
            <Label htmlFor="parentPhone">Телефон родителя</Label>
            <Input
              id="parentPhone"
              value={formData.parentPhone}
              onChange={(e) => handleInputChange("parentPhone", e.target.value)}
              placeholder="+7 (999) 123-45-67"
            />
          </div>
          <div>
            <Label htmlFor="consultationDate">Дата консилиума</Label>
            <Input
              id="consultationDate"
              type="date"
              value={formData.consultationDate}
              onChange={(e) => handleInputChange("consultationDate", e.target.value)}
            />
          </div>
        </div>
        
        <div>
          <Label htmlFor="consultationReason">Цель обследования</Label>
          <Textarea
            id="consultationReason"
            value={formData.consultationReason}
            onChange={(e) => handleInputChange("consultationReason", e.target.value)}
            placeholder="Определение особых образовательных потребностей..."
            className="min-h-20"
          />
        </div>

        <div>
          <Label htmlFor="additionalInfo">Дополнительная информация</Label>
          <Textarea
            id="additionalInfo"
            value={formData.additionalInfo}
            onChange={(e) => handleInputChange("additionalInfo", e.target.value)}
            placeholder="Особенности развития, медицинские показания..."
            className="min-h-20"
          />
        </div>

        <Button onClick={generatePDF} className="w-full">
          <Download className="h-4 w-4 mr-2" />
          Сгенерировать PDF согласие
        </Button>
      </CardContent>
    </Card>
  );
};