import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { ChevronRight, ChevronLeft, User, FileText, CheckCircle } from "lucide-react";

interface ChildData {
  fullName: string;
  birthDate: string;
  age: string;
  class: string;
  address: string;
  parentName: string;
  parentPhone: string;
  whobrought: string;
  relationship: string;
}

interface DocumentCheck {
  id: string;
  name: string;
  required: boolean;
  present: boolean;
}

interface ProtocolData {
  childData: ChildData;
  documents: DocumentCheck[];
  consultationType: "primary" | "secondary";
  consultationDate: string;
  reason: string;
  previousConsultations: string;
}

const initialDocuments: DocumentCheck[] = [
  { id: "representation", name: "Представление педагогического работника", required: true, present: false },
  { id: "psychologist", name: "Заключение педагога-психолога", required: true, present: false },
  { id: "logoped", name: "Заключение учителя-логопеда", required: false, present: false },
  { id: "defectologist", name: "Заключение учителя-дефектолога", required: false, present: false },
  { id: "social", name: "Заключение социального педагога", required: false, present: false },
  { id: "medical", name: "Справка о состоянии здоровья", required: false, present: false },
  { id: "characteristic", name: "Характеристика обучающегося", required: true, present: false },
  { id: "products", name: "Результаты продуктивной деятельности", required: false, present: false },
];

export const ProtocolForm = ({ onProtocolSave }: { onProtocolSave: (data: ProtocolData) => void }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<ProtocolData>({
    childData: {
      fullName: "",
      birthDate: "",
      age: "",
      class: "",
      address: "",
      parentName: "",
      parentPhone: "",
      whobrought: "",
      relationship: ""
    },
    documents: initialDocuments,
    consultationType: "primary",
    consultationDate: "",
    reason: "",
    previousConsultations: ""
  });

  const updateChildData = (field: keyof ChildData, value: string) => {
    setFormData(prev => ({
      ...prev,
      childData: { ...prev.childData, [field]: value }
    }));
  };

  const updateDocument = (id: string, present: boolean) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.map(doc => 
        doc.id === id ? { ...doc, present } : doc
      )
    }));
  };

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const saveProtocol = () => {
    const requiredDocs = formData.documents.filter(doc => doc.required);
    const missingRequired = requiredDocs.filter(doc => !doc.present);
    
    if (missingRequired.length > 0) {
      toast({
        title: "Отсутствуют обязательные документы",
        description: `Не хватает: ${missingRequired.map(doc => doc.name).join(", ")}`,
        variant: "destructive"
      });
      return;
    }

    onProtocolSave(formData);
    toast({
      title: "Протокол сохранен",
      description: "Данные успешно внесены в систему"
    });
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return "Данные ребенка и родителя";
      case 2: return "Проверка документов";
      case 3: return "Завершение протокола";
      default: return "";
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Заполнение протокола ППк - Шаг {currentStep} из 3
        </CardTitle>
        <p className="text-muted-foreground">{getStepTitle()}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Шаг 1: Данные ребенка и родителя */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <User className="h-5 w-5" />
                Информация о ребенке
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fullName">ФИО ребенка *</Label>
                  <Input
                    id="fullName"
                    value={formData.childData.fullName}
                    onChange={(e) => updateChildData("fullName", e.target.value)}
                    placeholder="Иванов Иван Иванович"
                  />
                </div>
                <div>
                  <Label htmlFor="birthDate">Дата рождения *</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={formData.childData.birthDate}
                    onChange={(e) => updateChildData("birthDate", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="age">Возраст *</Label>
                  <Input
                    id="age"
                    value={formData.childData.age}
                    onChange={(e) => updateChildData("age", e.target.value)}
                    placeholder="7 лет"
                  />
                </div>
                <div>
                  <Label htmlFor="class">Класс/группа *</Label>
                  <Input
                    id="class"
                    value={formData.childData.class}
                    onChange={(e) => updateChildData("class", e.target.value)}
                    placeholder="1А"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="address">Адрес проживания</Label>
                  <Input
                    id="address"
                    value={formData.childData.address}
                    onChange={(e) => updateChildData("address", e.target.value)}
                    placeholder="г. Москва, ул. Примерная, д. 1, кв. 1"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Информация о родителе/законном представителе</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="parentName">ФИО родителя/законного представителя *</Label>
                  <Input
                    id="parentName"
                    value={formData.childData.parentName}
                    onChange={(e) => updateChildData("parentName", e.target.value)}
                    placeholder="Иванова Мария Петровна"
                  />
                </div>
                <div>
                  <Label htmlFor="parentPhone">Контактный телефон *</Label>
                  <Input
                    id="parentPhone"
                    value={formData.childData.parentPhone}
                    onChange={(e) => updateChildData("parentPhone", e.target.value)}
                    placeholder="+7 (999) 123-45-67"
                  />
                </div>
                <div>
                  <Label htmlFor="whobrought">Кто привел ребенка *</Label>
                  <Select value={formData.childData.whobrought} onValueChange={(value) => updateChildData("whobrought", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mother">Мать</SelectItem>
                      <SelectItem value="father">Отец</SelectItem>
                      <SelectItem value="guardian">Опекун/попечитель</SelectItem>
                      <SelectItem value="grandmother">Бабушка</SelectItem>
                      <SelectItem value="grandfather">Дедушка</SelectItem>
                      <SelectItem value="relative">Другой родственник</SelectItem>
                      <SelectItem value="representative">Законный представитель</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="relationship">Степень родства</Label>
                  <Input
                    id="relationship"
                    value={formData.childData.relationship}
                    onChange={(e) => updateChildData("relationship", e.target.value)}
                    placeholder="мать, отец, опекун..."
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Шаг 2: Проверка документов */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Проверка наличия необходимых документов</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Отметьте документы, которые присутствуют. Документы с * являются обязательными.
              </p>
              <div className="space-y-3">
                {formData.documents.map((doc) => (
                  <div key={doc.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                    <Checkbox
                      id={doc.id}
                      checked={doc.present}
                      onCheckedChange={(checked) => updateDocument(doc.id, checked as boolean)}
                    />
                    <label htmlFor={doc.id} className="flex-1 cursor-pointer">
                      {doc.name}
                      {doc.required && <span className="text-destructive ml-1">*</span>}
                    </label>
                    {doc.present && <CheckCircle className="h-4 w-4 text-success" />}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Шаг 3: Завершение протокола */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="consultationType">Тип консультации *</Label>
                <Select value={formData.consultationType} onValueChange={(value: "primary" | "secondary") => setFormData(prev => ({ ...prev, consultationType: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="primary">Первичная консультация</SelectItem>
                    <SelectItem value="secondary">Вторичная консультация</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="consultationDate">Дата проведения ППк *</Label>
                <Input
                  id="consultationDate"
                  type="date"
                  value={formData.consultationDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, consultationDate: e.target.value }))}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="reason">Причина направления на ППк *</Label>
              <Textarea
                id="reason"
                value={formData.reason}
                onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Опишите причины направления ребенка на консилиум..."
                className="min-h-24"
              />
            </div>

            {formData.consultationType === "secondary" && (
              <div>
                <Label htmlFor="previousConsultations">История предыдущих консультаций</Label>
                <Textarea
                  id="previousConsultations"
                  value={formData.previousConsultations}
                  onChange={(e) => setFormData(prev => ({ ...prev, previousConsultations: e.target.value }))}
                  placeholder="Укажите даты и результаты предыдущих консилиумов..."
                  className="min-h-24"
                />
              </div>
            )}
            
            <div className="bg-accent/50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Сводка по протоколу:</h4>
              <ul className="text-sm space-y-1">
                <li>• Ребенок: {formData.childData.fullName || "Не указано"}</li>
                <li>• Тип консультации: {formData.consultationType === "primary" ? "Первичная" : "Вторичная"}</li>
                <li>• Документов предоставлено: {formData.documents.filter(d => d.present).length} из {formData.documents.length}</li>
                <li>• Обязательных документов: {formData.documents.filter(d => d.required && d.present).length} из {formData.documents.filter(d => d.required).length}</li>
              </ul>
            </div>
          </div>
        )}

        {/* Навигация */}
        <div className="flex justify-between pt-6 border-t">
          <Button 
            variant="outline" 
            onClick={prevStep} 
            disabled={currentStep === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Назад
          </Button>
          
          {currentStep < 3 ? (
            <Button onClick={nextStep}>
              Далее
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={saveProtocol}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Сохранить протокол
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};