import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ChevronRight, ChevronLeft, User, FileText, CheckCircle, ClipboardList, Save } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { getProtocolChecklistData, ChecklistBlock, ChecklistItem, updateItemScore, calculateBlockScore } from "@/data/protocolChecklistData";
import { useProtocolStorage } from "@/hooks/useProtocolStorage";

interface ChildData {
  fullName: string;
  birthDate: string;
  age: string;
  class: string;
  address: string;
  registrationAddress: string;
  sameAsAddress: boolean;
  parentName: string;
  parentPhone: string;
  whobrought: string;
  relationship: string;
  educationalOrganization: string;
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

export const ProtocolForm = ({ onProtocolSave, editingProtocol }: { 
  onProtocolSave: (data: ProtocolData) => void;
  editingProtocol?: any;
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedLevel, setSelectedLevel] = useState<"preschool" | "elementary" | "middle" | "high">("elementary");
  const [checklistBlocks, setChecklistBlocks] = useState<ChecklistBlock[]>([]);
  const { saveProtocol, updateProtocol } = useProtocolStorage();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<ProtocolData>({
    childData: {
      fullName: "",
      birthDate: "",
      age: "",
      class: "",
      address: "",
      registrationAddress: "",
      sameAsAddress: false,
      parentName: "",
      parentPhone: "",
      whobrought: "",
      relationship: "",
      educationalOrganization: ""
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
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const saveProtocolData = (isDraft: boolean = false) => {
    const completionPercentage = calculateProgress();
    
    if (!isDraft && completionPercentage < 100) {
      toast({
        title: "Протокол не завершен",
        description: "Заполните все обязательные поля для финального сохранения",
        variant: "destructive"
      });
      return;
    }

    const checklistData = {
      level: selectedLevel,
      blocks: checklistBlocks
    };

    if (editingProtocol) {
      updateProtocol(editingProtocol.id, formData, checklistData, completionPercentage);
      toast({
        title: "Протокол обновлен",
        description: `Данные успешно обновлены (${completionPercentage}% готовности)`
      });
    } else {
      const protocolId = saveProtocol(formData, checklistData, completionPercentage);
      toast({
        title: isDraft ? "Черновик сохранен" : "Протокол завершен",
        description: isDraft 
          ? `Данные сохранены как черновик (${completionPercentage}% готовности)`
          : "Протокол успешно завершен и сохранен"
      });
    }

    onProtocolSave(formData);
  };

  const handleLevelChange = (level: "preschool" | "elementary" | "middle" | "high") => {
    setSelectedLevel(level);
    setChecklistBlocks(getProtocolChecklistData(level));
  };

  const handleChecklistItemChange = (itemId: string, value: 0 | 1) => {
    setChecklistBlocks(blocks => updateItemScore(blocks, itemId, value));
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return "Данные ребенка и родителя";
      case 2: return "Проверка документов";
      case 3: return "Завершение протокола";
      case 4: return "Чек-лист оценки";
      default: return "";
    }
  };

  const calculateProgress = () => {
    let progress = 0;
    
    // Шаг 1: проверка заполнения основных полей
    const requiredFields = [
      formData.childData.fullName,
      formData.childData.birthDate,
      formData.childData.age,
      formData.childData.class,
      formData.childData.parentName,
      formData.childData.parentPhone,
      formData.childData.whobrought
    ];
    const filledFields = requiredFields.filter(field => field.trim() !== "").length;
    progress += (filledFields / requiredFields.length) * 25;
    
    // Шаг 2: проверка документов
    const requiredDocs = formData.documents.filter(doc => doc.required);
    const presentRequiredDocs = requiredDocs.filter(doc => doc.present);
    progress += (presentRequiredDocs.length / requiredDocs.length) * 25;
    
    // Шаг 3: завершение протокола
    const protocolFields = [formData.consultationDate, formData.reason];
    const filledProtocolFields = protocolFields.filter(field => field.trim() !== "").length;
    progress += (filledProtocolFields / protocolFields.length) * 25;
    
    // Шаг 4: чек-лист
    const totalChecklistItems = checklistBlocks.reduce((sum, block) => sum + block.items.length, 0);
    const filledChecklistItems = checklistBlocks.reduce((sum, block) => 
      sum + block.items.filter(item => item.score !== undefined).length, 0);
    if (totalChecklistItems > 0) {
      progress += (filledChecklistItems / totalChecklistItems) * 25;
    }
    
    return Math.round(progress);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Заполнение протокола ППк - Шаг {currentStep} из 4
        </CardTitle>
        <p className="text-muted-foreground">{getStepTitle()}</p>
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">Прогресс заполнения</span>
            <span className="text-sm font-medium">{calculateProgress()}%</span>
          </div>
          <Progress value={calculateProgress()} className="w-full" />
        </div>
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
                  <Select value={formData.childData.age} onValueChange={(value) => {
                    updateChildData("age", value);
                    // Автоматическое определение уровня образования по возрасту
                    const ageNum = parseInt(value);
                    if (ageNum >= 3 && ageNum <= 6) {
                      setSelectedLevel("preschool");
                      setChecklistBlocks(getProtocolChecklistData("preschool"));
                    } else if (ageNum >= 7 && ageNum <= 10) {
                      setSelectedLevel("elementary");
                      setChecklistBlocks(getProtocolChecklistData("elementary"));
                    } else if (ageNum >= 11 && ageNum <= 15) {
                      setSelectedLevel("middle");
                      setChecklistBlocks(getProtocolChecklistData("middle"));
                    } else if (ageNum >= 16 && ageNum <= 18) {
                      setSelectedLevel("high");
                      setChecklistBlocks(getProtocolChecklistData("high"));
                    }
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите возраст" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 16 }, (_, i) => i + 3).map(age => (
                        <SelectItem key={age} value={age.toString()}>
                          {age} {age === 1 ? 'год' : age <= 4 ? 'года' : 'лет'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                <div>
                  <Label htmlFor="educationalOrganization">Образовательная организация</Label>
                  <Input
                    id="educationalOrganization"
                    value={formData.childData.educationalOrganization}
                    onChange={(e) => updateChildData("educationalOrganization", e.target.value)}
                    placeholder="МБОУ СОШ №1"
                  />
                </div>
                <div>
                  <Label htmlFor="address">Адрес проживания</Label>
                  <Input
                    id="address"
                    value={formData.childData.address}
                    onChange={(e) => updateChildData("address", e.target.value)}
                    placeholder="г. Москва, ул. Примерная, д. 1, кв. 1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="registrationAddress">Место регистрации</Label>
                  <Input
                    id="registrationAddress"
                    value={formData.childData.registrationAddress}
                    onChange={(e) => updateChildData("registrationAddress", e.target.value)}
                    placeholder="г. Москва, ул. Примерная, д. 1, кв. 1"
                    disabled={formData.childData.sameAsAddress}
                  />
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="sameAsAddress"
                      checked={formData.childData.sameAsAddress}
                      onCheckedChange={(checked) => {
                        const isChecked = checked as boolean;
                        setFormData(prev => ({
                          ...prev,
                          childData: {
                            ...prev.childData,
                            sameAsAddress: isChecked,
                            registrationAddress: isChecked ? prev.childData.address : prev.childData.registrationAddress
                          }
                        }));
                      }}
                    />
                    <Label htmlFor="sameAsAddress" className="text-sm cursor-pointer">
                      Совпадает с местом проживания
                    </Label>
                  </div>
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
                  <Select value={formData.childData.relationship} onValueChange={(value) => updateChildData("relationship", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите степень родства" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mother">Мать</SelectItem>
                      <SelectItem value="father">Отец</SelectItem>
                      <SelectItem value="guardian">Опекун</SelectItem>
                      <SelectItem value="trustee">Попечитель</SelectItem>
                      <SelectItem value="grandmother">Бабушка</SelectItem>
                      <SelectItem value="grandfather">Дедушка</SelectItem>
                      <SelectItem value="aunt">Тетя</SelectItem>
                      <SelectItem value="uncle">Дядя</SelectItem>
                      <SelectItem value="sister">Сестра</SelectItem>
                      <SelectItem value="brother">Брат</SelectItem>
                      <SelectItem value="other">Другой родственник</SelectItem>
                    </SelectContent>
                  </Select>
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
            {/* Генерация документов */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Генерация документов
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="w-full">
                  <FileText className="h-4 w-4 mr-2" />
                  Согласие родителя
                </Button>
                <Button variant="outline" className="w-full">
                  <FileText className="h-4 w-4 mr-2" />
                  Протокол ППк
                </Button>
                <Button variant="outline" className="w-full">
                  <FileText className="h-4 w-4 mr-2" />
                  Заключение ППк
                </Button>
                <Button variant="outline" className="w-full">
                  <FileText className="h-4 w-4 mr-2" />
                  Представление педагога
                </Button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Данные протокола</h3>
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
                  <li>• Возраст: {formData.childData.age || "Не указано"}</li>
                  <li>• Уровень образования: {
                    selectedLevel === "preschool" ? "Дошкольное" :
                    selectedLevel === "elementary" ? "Начальное" :
                    selectedLevel === "middle" ? "Основное" : "Среднее"
                  }</li>
                  <li>• Тип консультации: {formData.consultationType === "primary" ? "Первичная" : "Вторичная"}</li>
                  <li>• Документов предоставлено: {formData.documents.filter(d => d.present).length} из {formData.documents.length}</li>
                  <li>• Обязательных документов: {formData.documents.filter(d => d.required && d.present).length} из {formData.documents.filter(d => d.required).length}</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Шаг 4: Чек-лист оценки */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold mb-2 flex items-center justify-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Оценка развития ребенка
              </h3>
              <p className="text-muted-foreground">
                Оцените каждый параметр: Да - есть трудности, Нет - нет трудностей
              </p>
            </div>

            {!checklistBlocks.length && (
              <div className="text-center p-6 bg-muted/50 rounded-lg">
                <p className="text-muted-foreground">
                  Выберите возраст ребенка на первом шаге для загрузки соответствующего чек-листа
                </p>
              </div>
            )}

            {checklistBlocks.map((block, blockIndex) => (
              <div key={block.id}>
                {blockIndex > 0 && <div className="border-t my-6"></div>}
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-xl font-bold">{block.title}</CardTitle>
                      <Badge variant="outline" className="text-base px-3 py-1">
                        Баллов: {calculateBlockScore(block)} / {block.items.length}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {block.themes.map((theme) => (
                        <div key={theme.id} className="space-y-4">
                          <div className="border-l-4 border-primary pl-4">
                            <h4 className="text-lg font-semibold text-primary">{theme.title}</h4>
                          </div>
                          {theme.subtopics.map((subtopic) => (
                            <div key={subtopic.id} className="pl-6 space-y-3">
                              <h5 className="text-base font-medium text-foreground bg-muted/50 p-2 rounded">
                                {subtopic.title}
                              </h5>
                              <div className="pl-4 space-y-3">
                                {block.items
                                  .filter(item => item.topic === theme.title && item.subtopic === subtopic.title)
                                  .map((item) => (
                                  <div key={item.checklist_item_id} className="flex items-start justify-between p-4 border rounded-lg bg-background">
                                    <div className="flex-1 pr-4">
                                      <p className="text-sm leading-relaxed">{item.description}</p>
                                    </div>
                                    <RadioGroup
                                      value={item.score?.toString() || "0"}
                                      onValueChange={(value) => handleChecklistItemChange(item.checklist_item_id, parseInt(value) as 0 | 1)}
                                      className="flex flex-row space-x-6"
                                    >
                                      <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="0" id={`${item.checklist_item_id}-0`} />
                                        <Label htmlFor={`${item.checklist_item_id}-0`} className="text-sm font-medium cursor-pointer">Нет</Label>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="1" id={`${item.checklist_item_id}-1`} />
                                        <Label htmlFor={`${item.checklist_item_id}-1`} className="text-sm font-medium cursor-pointer">Да</Label>
                                      </div>
                                    </RadioGroup>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
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
          
          <div className="flex gap-2">
            {currentStep === 4 && (
              <Button 
                variant="outline" 
                onClick={() => saveProtocolData(true)}
              >
                <Save className="h-4 w-4 mr-2" />
                Сохранить черновик
              </Button>
            )}
            
            {currentStep < 4 ? (
              <Button onClick={nextStep}>
                Далее
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button 
                onClick={() => saveProtocolData(false)}
                disabled={calculateProgress() < 100}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Завершить протокол
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};