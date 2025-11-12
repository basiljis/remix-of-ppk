import { useState, useEffect, useMemo, useRef } from "react";
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
import { ChevronRight, ChevronLeft, User, FileText, CheckCircle, ClipboardList, Save, Download } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { getProtocolChecklistData } from "@/data/protocolChecklistData";
import { useProtocols } from "@/hooks/useProtocols";
import { OrganizationSelector } from "@/components/OrganizationSelector";
import { generateConsentPDF } from "@/components/ConsentPDF";
import { useChecklistData } from "@/hooks/useChecklistData";
import { useProtocolChecklistData } from '@/hooks/useProtocolChecklistData';
import { ProtocolResultsPanel } from '@/components/ProtocolResultsPanel';
import { ProtocolChecklistPaginated } from '@/components/ProtocolChecklistPaginated';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { EducationLevelSelector, type EducationLevel } from "@/components/EducationLevelSelector";
import { differenceInYears, differenceInMonths, parseISO } from "date-fns";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { PreviousProtocolDialog } from "@/components/PreviousProtocolDialog";
import { Eye } from "lucide-react";

interface ChildData {
  fullName: string;
  birthDate: string;
  age: string;
  classNumber: string;
  classLetter: string;
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
  ppkNumber?: string;
  sessionTopic?: string;
  meetingType?: "scheduled" | "unscheduled";
  conclusionText?: string;
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
  { id: "cpmpk", name: "Заключение ЦПМПК г. Москвы (при наличии)", required: false, present: false },
  { id: "ipr", name: "Индивидуальная программа реабилитации и абилитации для ребёнка-инвалида (при наличии)", required: false, present: false },
];

export const ProtocolForm = ({ onProtocolSave, editingProtocol }: { 
  onProtocolSave: (data: ProtocolData) => void;
  editingProtocol?: any;
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedLevel, setSelectedLevel] = useState<"preschool" | "elementary" | "middle" | "high">("elementary");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [pendingStep, setPendingStep] = useState<number | null>(null);
  const initialFormDataRef = useRef<string>("");
  const [previousProtocols, setPreviousProtocols] = useState<any[]>([]);
  const [selectedProtocol, setSelectedProtocol] = useState<any | null>(null);
  const [showProtocolDialog, setShowProtocolDialog] = useState(false);
  
  // Remove state for checklistBlocks as it's now computed via useMemo
  const { saveProtocol, updateProtocol } = useProtocols();
  const { toast } = useToast();
  const { getChecklistByLevelAndType, loading: checklistLoading } = useChecklistData();
  const { 
    getBlocksForEducationLevel, 
    updateItemScore, 
    calculateBlockScore,
    loading: protocolChecklistLoading 
  } = useProtocolChecklistData();
  const { profile, isAdmin, isRegionalOperator } = useAuth();

  const [formData, setFormData] = useState<ProtocolData>({
    childData: {
      fullName: "",
      birthDate: "",
      age: "",
      classNumber: "",
      classLetter: "",
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
    consultationDate: new Date().toISOString().split('T')[0], // Автоматически заполняем текущей датой
    reason: "",
    previousConsultations: "",
    ppkNumber: "",
    sessionTopic: "",
    meetingType: "scheduled",
    conclusionText: ""
  });

  // Инициализация данных при редактировании
  useEffect(() => {
    if (editingProtocol) {
      console.log('Loading editing protocol:', editingProtocol);
      
      // Загружаем данные из редактируемого протокола
      if (editingProtocol.protocol_data) {
        setFormData(editingProtocol.protocol_data);
      }
      
      // Устанавливаем уровень образования
      if (editingProtocol.education_level) {
        setSelectedLevel(editingProtocol.education_level);
      }
      
      // Данные чек-листа будут загружены автоматически через hook
    }
  }, [editingProtocol, selectedLevel]);

  // Инициализация начального состояния формы
  useEffect(() => {
    initialFormDataRef.current = JSON.stringify(formData);
  }, [editingProtocol]);

  // Отслеживание изменений в форме
  useEffect(() => {
    const currentFormDataString = JSON.stringify(formData);
    setHasUnsavedChanges(currentFormDataString !== initialFormDataRef.current);
  }, [formData]);

  // Автосохранение черновика каждые 2 минуты
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      if (hasUnsavedChanges && canSaveProtocol()) {
        saveProtocolData(true);
        toast({
          title: "Автосохранение",
          description: "Черновик автоматически сохранен"
        });
      }
    }, 120000); // 2 минуты = 120000 мс

    return () => clearInterval(autoSaveInterval);
  }, [hasUnsavedChanges, formData]);

  // Загрузка предыдущих протоколов при выборе вторичной консультации
  useEffect(() => {
    const loadPreviousProtocols = async () => {
      if (formData.consultationType === "secondary" && formData.childData.fullName && formData.childData.educationalOrganization) {
        try {
          const { data: protocols, error } = await supabase
            .from("protocols")
            .select("*")
            .eq("child_name", formData.childData.fullName)
            .eq("organization_id", formData.childData.educationalOrganization)
            .eq("status", "completed")
            .order("created_at", { ascending: false })
            .limit(5);

          if (error) {
            console.error("Error loading previous protocols:", error);
            return;
          }

          if (protocols && protocols.length > 0) {
            setPreviousProtocols(protocols);
            const historyText = protocols
              .map((p: any, index: number) => {
                const date = new Date(p.created_at).toLocaleDateString("ru-RU");
                const conclusion = p.protocol_data?.conclusionText || "Заключение не сохранено";
                const ppkNumber = p.ppk_number || "Номер не указан";
                return `${index + 1}. Протокол №${ppkNumber} от ${date}:\n${conclusion}`;
              })
              .join("\n\n---\n\n");

            setFormData(prev => ({
              ...prev,
              previousConsultations: historyText
            }));
          } else {
            setPreviousProtocols([]);
            setFormData(prev => ({
              ...prev,
              previousConsultations: "Предыдущие протоколы для данного обучающегося не найдены"
            }));
          }
        } catch (error) {
          console.error("Error loading previous protocols:", error);
        }
      } else if (formData.consultationType === "primary") {
        setPreviousProtocols([]);
        setFormData(prev => ({
          ...prev,
          previousConsultations: ""
        }));
      }
    };

    loadPreviousProtocols();
  }, [formData.consultationType, formData.childData.fullName, formData.childData.educationalOrganization]);

  // Автоматически устанавливаем организацию для обычного пользователя
  useEffect(() => {
    if (profile && !isAdmin && !isRegionalOperator && profile.organization_id && !editingProtocol) {
      updateChildData("educationalOrganization", profile.organization_id);
    }
  }, [profile, isAdmin, isRegionalOperator, editingProtocol]);

  // Compute checklist blocks from the new hook
  const checklistBlocks = useMemo(() => {
    if (!selectedLevel) return [];
    console.log('Getting blocks for level:', selectedLevel);
    return getBlocksForEducationLevel(selectedLevel);
  }, [selectedLevel, getBlocksForEducationLevel]);

  const updateChildData = (field: keyof ChildData, value: string) => {
    setFormData(prev => ({
      ...prev,
      childData: { ...prev.childData, [field]: value }
    }));
  };

  const isRequiredFieldEmpty = (value: string) => {
    return !value || value.trim() === "";
  };

  const getRequiredFieldClass = (value: string) => {
    return isRequiredFieldEmpty(value) ? "border-destructive focus:border-destructive" : "";
  };

  const canSaveProtocol = () => {
    const requiredFields = [
      formData.childData.fullName,
      formData.childData.birthDate,
      formData.childData.age,
      formData.childData.classNumber,
      formData.childData.parentName,
      formData.childData.parentPhone,
      formData.childData.whobrought
    ];
    return requiredFields.every(field => !isRequiredFieldEmpty(field));
  };

  const canFinalizeProtocol = () => {
    if (!canSaveProtocol()) return false;
    
    // Check required documents
    const requiredDocs = formData.documents.filter(doc => doc.required);
    const allRequiredDocsPresent = requiredDocs.every(doc => doc.present);
    
    // Check required protocol fields
    const protocolFieldsFilled = !isRequiredFieldEmpty(formData.reason) && 
                                 !isRequiredFieldEmpty(formData.consultationDate) &&
                                 !isRequiredFieldEmpty(formData.sessionTopic || '');
    
    // Check checklist items from Supabase if available
    const supabaseChecklist = getChecklistByLevelAndType(selectedLevel, 'protocol');
    if (supabaseChecklist) {
      const requiredChecklistItems = supabaseChecklist.items.filter(item => item.isRequired);
      const completedRequiredItems = checklistBlocks.reduce((sum, block) => {
        return sum + block.topics.reduce((topicSum: number, topic: any) => {
          return topicSum + topic.subtopics.reduce((subtopicSum: number, subtopic: any) => {
            return subtopicSum + subtopic.items.filter((item: any) => 
              requiredChecklistItems.some(req => req.id === item.checklist_item_id) && 
              item.score !== undefined
            ).length;
          }, 0);
        }, 0);
      }, 0);
      
      return allRequiredDocsPresent && protocolFieldsFilled && 
             (requiredChecklistItems.length === 0 || completedRequiredItems === requiredChecklistItems.length);
    }
    
    return allRequiredDocsPresent && protocolFieldsFilled;
  };

  const generateConsent = () => {
    if (!canSaveProtocol()) {
      toast({
        title: "Ошибка",
        description: "Заполните все обязательные поля для генерации согласия",
        variant: "destructive"
      });
      return;
    }

    generateConsentPDF(formData.childData);
    toast({
      title: "Согласие сгенерировано",
      description: "PDF документ готов к скачиванию"
    });
  };

  const updateDocument = (id: string, present: boolean) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.map(doc => 
        doc.id === id ? { ...doc, present } : doc
      )
    }));
  };


  const handleStepChange = (newStep: number) => {
    if (hasUnsavedChanges && canSaveProtocol()) {
      setPendingStep(newStep);
      setShowSaveDialog(true);
    } else {
      setCurrentStep(newStep);
    }
  };

  const nextStep = () => {
    if (currentStep < 4) {
      handleStepChange(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      handleStepChange(currentStep - 1);
    }
  };

  const handleSaveAndContinue = async () => {
    await saveProtocolData(true);
    setHasUnsavedChanges(false);
    initialFormDataRef.current = JSON.stringify(formData);
    if (pendingStep !== null) {
      setCurrentStep(pendingStep);
      setPendingStep(null);
    }
    setShowSaveDialog(false);
  };

  const handleContinueWithoutSaving = () => {
    if (pendingStep !== null) {
      setCurrentStep(pendingStep);
      setPendingStep(null);
    }
    setShowSaveDialog(false);
  };

  const saveProtocolData = async (isDraft: boolean = false) => {
    if (!canSaveProtocol() && !isDraft) {
      toast({
        title: "Ошибка",
        description: "Заполните все обязательные поля данных об обучающемся",
        variant: "destructive"
      });
      return;
    }

    if (!isDraft && !canFinalizeProtocol()) {
      toast({
        title: "Протокол не готов к завершению",
        description: "Заполните все обязательные поля: данные обучающегося, документы, причина направления и обязательные пункты чек-листа",
        variant: "destructive"
      });
      return;
    }

    const completionPercentage = calculateProgress();

    const checklistData = {
      level: selectedLevel,
      blocks: checklistBlocks
    };

    const protocolData = {
      child_name: formData.childData.fullName,
      child_birth_date: formData.childData.birthDate || undefined,
      organization_id: formData.childData.educationalOrganization,
      education_level: selectedLevel,
      consultation_type: formData.consultationType,
      consultation_reason: formData.reason,
      ppk_number: editingProtocol ? (formData.ppkNumber || editingProtocol.ppk_number) : (formData.ppkNumber || undefined),
      session_topic: formData.sessionTopic || undefined,
      meeting_type: formData.meetingType || 'scheduled',
      protocol_data: formData,
      checklist_data: checklistData,
      completion_percentage: completionPercentage,
      status: isDraft ? 'draft' : 'completed',
      is_ready: !isDraft
    };

    try {
      if (editingProtocol) {
        await updateProtocol(editingProtocol.id, protocolData);
        toast({
          title: "Протокол обновлен",
          description: `Данные успешно обновлены (${completionPercentage}% готовности)`
        });
      } else {
        const savedProtocol = await saveProtocol(protocolData);
        toast({
          title: isDraft ? "Черновик сохранен" : "Протокол завершен",
          description: isDraft 
            ? `Данные сохранены как черновик (${completionPercentage}% готовности)`
            : `Протокол успешно завершен и сохранен. Номер: ${savedProtocol?.ppk_number || 'Будет присвоен автоматически'}`
        });
      }
      
      // Обновляем начальное состояние после успешного сохранения
      setHasUnsavedChanges(false);
      initialFormDataRef.current = JSON.stringify(formData);
    } catch (error) {
      console.error('Error saving protocol:', error);
      return;
    }

    onProtocolSave(formData);
  };

  const handleLevelChange = (level: "preschool" | "elementary" | "middle" | "high") => {
    setSelectedLevel(level);
    // Данные будут загружены автоматически через useMemo
  };

  const handleChecklistItemChange = (itemId: string, value: 0 | 1) => {
    console.log('Updating item score:', itemId, value);
    updateItemScore(itemId, value);
  };

  const handleConclusionChange = (conclusionText: string) => {
    setFormData(prev => ({
      ...prev,
      conclusionText
    }));
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
    let totalFields = 0;
    let filledFields = 0;
    
    // Шаг 1: проверка заполнения основных обязательных полей
    const step1RequiredFields = [
      formData.childData.fullName,
      formData.childData.birthDate,
      formData.childData.age,
      formData.childData.classNumber,
      formData.childData.parentName,
      formData.childData.parentPhone,
      formData.childData.whobrought,
      formData.childData.educationalOrganization
    ];
    totalFields += step1RequiredFields.length;
    filledFields += step1RequiredFields.filter(field => field && field.trim() !== "").length;
    
    // Шаг 2: проверка обязательных документов
    const requiredDocs = formData.documents.filter(doc => doc.required);
    totalFields += requiredDocs.length;
    filledFields += requiredDocs.filter(doc => doc.present).length;
    
    // Шаг 3: завершение протокола - все поля обязательные
    const step3RequiredFields = [
      formData.consultationDate,
      formData.reason,
      formData.sessionTopic || ''
    ];
    totalFields += step3RequiredFields.length;
    filledFields += step3RequiredFields.filter(field => field && field.trim() !== "").length;
    
    // Шаг 4: чек-лист - считаем только обязательные пункты
    const supabaseChecklist = getChecklistByLevelAndType(selectedLevel, 'protocol');
    if (supabaseChecklist) {
      const requiredChecklistItems = supabaseChecklist.items.filter(item => item.isRequired);
      const completedRequiredItems = checklistBlocks.reduce((sum, block) => {
        return sum + block.topics.reduce((topicSum: number, topic: any) => {
          return topicSum + topic.subtopics.reduce((subtopicSum: number, subtopic: any) => {
            return subtopicSum + subtopic.items.filter((item: any) => 
              requiredChecklistItems.some(req => req.id === item.checklist_item_id) && 
              item.score !== undefined
            ).length;
          }, 0);
        }, 0);
      }, 0);
      
      totalFields += requiredChecklistItems.length;
      filledFields += completedRequiredItems;
    }
    
    // Рассчитываем процент только от обязательных полей
    const progress = totalFields > 0 ? (filledFields / totalFields) * 100 : 0;
    return Math.round(progress);
  };

  return (
    <Card className="w-full mx-auto"> {/* Убираем max-w-4xl для полной ширины */}
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
                  <Label htmlFor="fullName" className={isRequiredFieldEmpty(formData.childData.fullName) ? "text-red-500" : ""}>
                    ФИО ребенка *
                  </Label>
                  <Input
                    id="fullName"
                    value={formData.childData.fullName}
                    onChange={(e) => updateChildData("fullName", e.target.value)}
                    placeholder="Иванов Иван Иванович"
                    className={getRequiredFieldClass(formData.childData.fullName)}
                  />
                </div>
                 <div>
                   <Label htmlFor="birthDate" className={isRequiredFieldEmpty(formData.childData.birthDate) ? "text-red-500" : ""}>
                     Дата рождения *
                   </Label>
                   <Input
                     id="birthDate"
                     type="date"
                     value={formData.childData.birthDate}
                     onChange={(e) => {
                       const birthDate = e.target.value;
                       updateChildData("birthDate", birthDate);
                       
                       // Автоматический расчет возраста
                       if (birthDate) {
                         const birthDateObj = parseISO(birthDate);
                         const years = differenceInYears(new Date(), birthDateObj);
                         const months = differenceInMonths(new Date(), birthDateObj) % 12;
                         const ageString = months > 0 ? `${years} лет ${months} мес.` : `${years} лет`;
                         updateChildData("age", ageString);
                       }
                     }}
                     className={getRequiredFieldClass(formData.childData.birthDate)}
                   />
                 </div>
                 <div>
                   <Label htmlFor="age" className={isRequiredFieldEmpty(formData.childData.age) ? "text-red-500" : ""}>
                     Возраст *
                   </Label>
                   <Input
                     id="age"
                     value={formData.childData.age}
                     readOnly
                     placeholder="Выберите дату рождения"
                     className={getRequiredFieldClass(formData.childData.age)}
                   />
                 </div>
                 <div>
                   <Label htmlFor="consultationDate" className={isRequiredFieldEmpty(formData.consultationDate) ? "text-red-500" : ""}>
                     Дата проведения ППк *
                   </Label>
                   <Input
                     id="consultationDate"
                     type="date"
                     value={formData.consultationDate}
                     onChange={(e) => setFormData(prev => ({ ...prev, consultationDate: e.target.value }))}
                     className={getRequiredFieldClass(formData.consultationDate)}
                   />
                 </div>
                 <div className="md:col-span-2">
                   <Label>Уровень образования *</Label>
                   <EducationLevelSelector 
                     selectedLevel={selectedLevel}
                     onLevelChange={handleLevelChange}
                   />
                 </div>
                <div>
                  <Label htmlFor="classNumber" className={isRequiredFieldEmpty(formData.childData.classNumber) ? "text-red-500" : ""}>
                    Номер класса/группы *
                  </Label>
                  <Select value={formData.childData.classNumber} onValueChange={(value) => updateChildData("classNumber", value)}>
                    <SelectTrigger className={getRequiredFieldClass(formData.childData.classNumber)}>
                      <SelectValue placeholder="Выберите номер" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedLevel === "preschool" ? (
                        <>
                          <SelectItem value="младшая">Младшая</SelectItem>
                          <SelectItem value="средняя">Средняя</SelectItem>
                          <SelectItem value="старшая">Старшая</SelectItem>
                          <SelectItem value="подготовительная">Подготовительная</SelectItem>
                        </>
                      ) : (
                        Array.from({ length: 11 }, (_, i) => i + 1).map(num => (
                          <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="classLetter">Литера класса</Label>
                  <Select value={formData.childData.classLetter} onValueChange={(value) => updateChildData("classLetter", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите литеру" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedLevel !== "preschool" ? 
                        ['А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ж', 'З', 'И', 'К'].map(letter => (
                          <SelectItem key={letter} value={letter}>{letter}</SelectItem>
                        )) :
                        ['1', '2', '3', '4', '5'].map(num => (
                          <SelectItem key={num} value={num}>Группа {num}</SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <OrganizationSelector
                    value={formData.childData.educationalOrganization}
                    onChange={(value) => updateChildData("educationalOrganization", value)}
                    regionFilter={isRegionalOperator ? profile?.region_id : undefined}
                    disabled={!isAdmin && !isRegionalOperator}
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
                  <Label htmlFor="parentName" className={isRequiredFieldEmpty(formData.childData.parentName) ? "text-red-500" : ""}>
                    ФИО родителя/законного представителя *
                  </Label>
                  <Input
                    id="parentName"
                    value={formData.childData.parentName}
                    onChange={(e) => updateChildData("parentName", e.target.value)}
                    placeholder="Иванова Мария Петровна"
                    className={getRequiredFieldClass(formData.childData.parentName)}
                  />
                </div>
                <div>
                  <Label htmlFor="parentPhone" className={isRequiredFieldEmpty(formData.childData.parentPhone) ? "text-red-500" : ""}>
                    Контактный телефон *
                  </Label>
                  <Input
                    id="parentPhone"
                    value={formData.childData.parentPhone}
                    onChange={(e) => updateChildData("parentPhone", e.target.value)}
                    placeholder="+7 (999) 123-45-67"
                    className={getRequiredFieldClass(formData.childData.parentPhone)}
                  />
                </div>
                <div>
                  <Label htmlFor="whobrought" className={isRequiredFieldEmpty(formData.childData.whobrought) ? "text-red-500" : ""}>
                    Кто привел ребенка *
                  </Label>
                  <Select value={formData.childData.whobrought} onValueChange={(value) => updateChildData("whobrought", value)}>
                    <SelectTrigger className={getRequiredFieldClass(formData.childData.whobrought)}>
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
                  <div key={doc.id} className={`flex items-center space-x-3 p-3 border rounded-lg ${doc.required && !doc.present ? "border-destructive bg-destructive/5" : ""}`}>
                    <Checkbox
                      id={doc.id}
                      checked={doc.present}
                      onCheckedChange={(checked) => updateDocument(doc.id, checked as boolean)}
                    />
                    <label htmlFor={doc.id} className={`flex-1 cursor-pointer ${doc.required && !doc.present ? "font-medium" : ""}`}>
                      {doc.name}
                      {doc.required && <span className="text-destructive ml-1">*</span>}
                    </label>
                    {doc.present && <CheckCircle className="h-4 w-4 text-success" />}
                  </div>
                ))}
              </div>
            </div>

            {/* Документы для загрузки */}
            <div className="space-y-4 border-t pt-6">
            </div>
          </div>
        )}

        {/* Шаг 3: Завершение протокола */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Данные протокола</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ppkNumber">Номер ППК</Label>
                <Input
                  id="ppkNumber"
                  value={formData.ppkNumber || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, ppkNumber: e.target.value }))}
                  placeholder="Введите номер ППК"
                />
              </div>
               <div>
                 <Label htmlFor="consultationType" className={isRequiredFieldEmpty(formData.consultationType) ? "text-red-500" : ""}>Тип консультации *</Label>
                 <Select value={formData.consultationType} onValueChange={(value: "primary" | "secondary") => setFormData(prev => ({ ...prev, consultationType: value }))}>
                   <SelectTrigger className={getRequiredFieldClass(formData.consultationType)}>
                     <SelectValue />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="primary">Первичная консультация</SelectItem>
                     <SelectItem value="secondary">Вторичная консультация</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
               <div>
                 <Label htmlFor="meetingType">Тип заседания</Label>
                 <Select value={formData.meetingType || 'scheduled'} onValueChange={(value: "scheduled" | "unscheduled") => setFormData(prev => ({ ...prev, meetingType: value }))}>
                   <SelectTrigger>
                     <SelectValue />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="scheduled">Плановое</SelectItem>
                     <SelectItem value="unscheduled">Внеплановое</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
              <div>
                <Label htmlFor="sessionTopic" className={isRequiredFieldEmpty(formData.sessionTopic) ? "text-red-500" : ""}>Тематика заседания *</Label>
                <Select value={formData.sessionTopic || ''} onValueChange={(value) => setFormData(prev => ({ ...prev, sessionTopic: value }))}>
                  <SelectTrigger className={getRequiredFieldClass(formData.sessionTopic || '')}>
                    <SelectValue placeholder="Выберите тематику заседания" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="утверждение плана работы ППк">утверждение плана работы ППк</SelectItem>
                    <SelectItem value="утверждение плана мероприятий по выявлению обучающихся с особыми образовательными потребностями">утверждение плана мероприятий по выявлению обучающихся с особыми образовательными потребностями</SelectItem>
                    <SelectItem value="проведение комплексного обследования обучающегося">проведение комплексного обследования обучающегося</SelectItem>
                    <SelectItem value="обсуждение результатов комплексного обследования">обсуждение результатов комплексного обследования</SelectItem>
                    <SelectItem value="обсуждение результатов образовательной, воспитательной и коррекционной работы с обучающимся">обсуждение результатов образовательной, воспитательной и коррекционной работы с обучающимся</SelectItem>
                    <SelectItem value="зачисление обучающихся на коррекционные занятия">зачисление обучающихся на коррекционные занятия</SelectItem>
                    <SelectItem value="направление обучающихся в ПМПК">направление обучающихся в ПМПК</SelectItem>
                    <SelectItem value="составление и утверждение индивидуальных образовательных маршрутов (по форме определяемой образовательной организацией)">составление и утверждение индивидуальных образовательных маршрутов (по форме определяемой образовательной организацией)</SelectItem>
                    <SelectItem value="экспертиза адаптированных основных образовательных программ ОО">экспертиза адаптированных основных образовательных программ ОО</SelectItem>
                    <SelectItem value="оценка эффективности и анализ результатов коррекционно-развивающей работы с обучающимися">оценка эффективности и анализ результатов коррекционно-развивающей работы с обучающимися</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="reason" className={isRequiredFieldEmpty(formData.reason) ? "text-red-500" : ""}>Причина направления на ППк *</Label>
              <Textarea
                id="reason"
                value={formData.reason}
                onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Опишите причины направления ребенка на консилиум..."
                className={`min-h-24 ${getRequiredFieldClass(formData.reason)}`}
              />
            </div>

            {formData.consultationType === "secondary" && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="previousConsultations">История предыдущих консультаций</Label>
                  {previousProtocols.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Найдено протоколов: {previousProtocols.length}
                    </p>
                  )}
                </div>
                
                {previousProtocols.length > 0 && (
                  <div className="mb-3 space-y-2">
                    {previousProtocols.map((protocol: any, index: number) => (
                      <div 
                        key={protocol.id} 
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            Протокол №{protocol.ppk_number || "Не указан"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(protocol.created_at).toLocaleDateString("ru-RU")}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedProtocol(protocol);
                            setShowProtocolDialog(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Просмотр
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                
                <Textarea
                  id="previousConsultations"
                  value={formData.previousConsultations}
                  onChange={(e) => setFormData(prev => ({ ...prev, previousConsultations: e.target.value }))}
                  placeholder="Загрузка предыдущих консультаций..."
                  className="min-h-24"
                  readOnly
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Автоматически загружается текст заключений из предыдущих протоколов этого обучающегося
                </p>
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
               {formData.childData.fullName && (
                 <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                   <h4 className="font-semibold text-blue-900 mb-2">Данные обучающегося:</h4>
                   <div className="text-sm text-blue-800 grid grid-cols-1 md:grid-cols-2 gap-2">
                     <p><strong>ФИО:</strong> {formData.childData.fullName}</p>
                     <p><strong>Возраст:</strong> {formData.childData.age} лет</p>
                     <p><strong>Класс:</strong> {formData.childData.classNumber}{formData.childData.classLetter}</p>
                     <p><strong>Дата рождения:</strong> {formData.childData.birthDate}</p>
                   </div>
                 </div>
               )}
             </div>

             {formData.childData.age && !checklistBlocks.length && !protocolChecklistLoading && (
               <div className="text-center p-6 bg-muted/50 rounded-lg">
                 <p className="text-muted-foreground">
                   Данные чек-листа для выбранного уровня образования не найдены
                 </p>
               </div>
             )}

             {protocolChecklistLoading && (
               <div className="text-center p-6 bg-muted/50 rounded-lg">
                 <p className="text-muted-foreground">
                   Загрузка данных чек-листа из базы данных...
                 </p>
               </div>
             )}

              {formData.childData.age && checklistBlocks.length > 0 && (
                <ProtocolChecklistPaginated
                  blocks={checklistBlocks}
                  educationLevel={selectedLevel}
                  childName={formData.childData.fullName || 'Не указано'}
                  onItemChange={handleChecklistItemChange}
                  calculateBlockScore={calculateBlockScore}
                  onConclusionChange={handleConclusionChange}
                  savedConclusion={formData.conclusionText}
                />
              )}
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
                disabled={!canFinalizeProtocol()}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Завершить протокол
              </Button>
            )}
          </div>
        </div>
      </CardContent>

      {/* Диалог сохранения черновика */}
      <AlertDialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Сохранить изменения?</AlertDialogTitle>
            <AlertDialogDescription>
              У вас есть несохраненные изменения в протоколе. Хотите сохранить их как черновик перед переходом?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleContinueWithoutSaving}>
              Продолжить без сохранения
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveAndContinue}>
              Сохранить черновик
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Диалог просмотра предыдущего протокола */}
      <PreviousProtocolDialog
        open={showProtocolDialog}
        onOpenChange={setShowProtocolDialog}
        protocol={selectedProtocol}
      />
    </Card>
  );
};