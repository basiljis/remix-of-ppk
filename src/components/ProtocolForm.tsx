import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
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
import { ChevronRight, ChevronLeft, User, FileText, CheckCircle, ClipboardList, Save, Download, AlertCircle, CheckCircle2 } from "lucide-react";
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
import { differenceInYears, differenceInMonths, parseISO, differenceInDays, addDays } from "date-fns";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { PreviousProtocolDialog } from "@/components/PreviousProtocolDialog";
import { Eye } from "lucide-react";
import { analyzeProtocolResults } from "@/utils/assistanceDirections";
import { generateProtocolConclusion } from "@/utils/protocolRecommendations";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";

// Интерфейсы для данных протокола и документов
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
  parentConsent?: boolean;
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

export const ProtocolForm = ({
  onProtocolSave,
  editingProtocol
}: {
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
  
  // Таймаут сессии 15 минут
  useSessionTimeout();

  const { saveProtocol, updateProtocol } = useProtocols();
  const { toast } = useToast();
  const navigate = useNavigate();
  const subscriptionStatus = useSubscriptionStatus();
  const { getChecklistByLevelAndType, loading: checklistLoading } = useChecklistData();
  const {
    getBlocksForEducationLevel,
    updateItemScore,
    calculateBlockScore,
    loading: protocolChecklistLoading
  } = useProtocolChecklistData();
  const { profile, isAdmin, isRegionalOperator, user } = useAuth();

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
    consultationDate: new Date().toISOString().split('T')[0],
    reason: "",
    previousConsultations: "",
    ppkNumber: "",
    sessionTopic: "",
    meetingType: "scheduled",
    conclusionText: "",
    parentConsent: false
  });

  // Инициализация данных при редактировании
  useEffect(() => {
    if (editingProtocol) {
      console.log('Loading editing protocol:', editingProtocol);
      
      if (editingProtocol.protocol_data) {
        setFormData(editingProtocol.protocol_data);
      }
      
      if (editingProtocol.education_level) {
        setSelectedLevel(editingProtocol.education_level);
      }
    }
  }, [editingProtocol, selectedLevel]);

  useEffect(() => {
    initialFormDataRef.current = JSON.stringify(formData);
  }, [editingProtocol]);

  useEffect(() => {
    const currentFormDataString = JSON.stringify(formData);
    setHasUnsavedChanges(currentFormDataString !== initialFormDataRef.current);
  }, [formData]);

  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      if (hasUnsavedChanges && canSaveProtocol()) {
        saveProtocolData(true);
        toast({
          title: "Автосохранение",
          description: "Черновик автоматически сохранен"
        });
      }
    }, 120000);

    return () => clearInterval(autoSaveInterval);
  }, [hasUnsavedChanges, formData]);

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

  useEffect(() => {
    if (profile && !isAdmin && !isRegionalOperator && profile.organization_id && !editingProtocol) {
      updateChildData("educationalOrganization", profile.organization_id);
    }
  }, [profile, isAdmin, isRegionalOperator, editingProtocol]);

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
    
    const requiredDocs = formData.documents.filter(doc => doc.required);
    const allRequiredDocsPresent = requiredDocs.every(doc => doc.present);
    
    const protocolFieldsFilled = !isRequiredFieldEmpty(formData.reason) && 
                                 !isRequiredFieldEmpty(formData.consultationDate) &&
                                 !isRequiredFieldEmpty(formData.sessionTopic || '');
    
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
    if (currentStep < 5) {
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
    // Проверка доступа для новых протоколов (не применяется к админам и региональным операторам)
    if (!editingProtocol && !isAdmin && !isRegionalOperator && !subscriptionStatus.canCreateProtocols) {
      toast({
        title: "Доступ ограничен",
        description: "Пробный период истек. Оформите подписку для создания новых протоколов.",
        variant: "destructive"
      });
      return;
    }

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

    let conclusionData = null;
    if (checklistBlocks.length > 0) {
      const analysis = analyzeProtocolResults(checklistBlocks, calculateBlockScore, selectedLevel);
      const conclusion = generateProtocolConclusion(analysis, formData.childData.fullName, selectedLevel);
      conclusionData = {
        finalGroup: conclusion.finalGroup,
        finalStatus: conclusion.finalStatus,
        specialistAssignments: conclusion.specialistAssignments,
        cpmkRecommendation: conclusion.cpmkRecommendation
      };
    }

    const updatedFormData = {
      ...formData,
      conclusion: conclusionData
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
      protocol_data: updatedFormData,
      checklist_data: checklistData,
      completion_percentage: completionPercentage,
      status: isDraft ? 'draft' : 'completed',
      is_ready: !isDraft
    };

    try {
      if (editingProtocol) {
        await updateProtocol(editingProtocol.id, protocolData);
        toast({
          title: isDraft ? "Черновик сохранен" : "Протокол обновлен",
          description: isDraft ? "Изменения сохранены" : "Протокол успешно обновлен"
        });
      } else {
        await saveProtocol(protocolData);
        toast({
          title: isDraft ? "Черновик сохранен" : "Протокол сохранен",
          description: isDraft ? "Изменения сохранены" : "Протокол успешно создан"
        });
      }

      initialFormDataRef.current = JSON.stringify(formData);
      setHasUnsavedChanges(false);

      if (!isDraft) {
        onProtocolSave(formData);
      }
    } catch (error) {
      console.error('Error saving protocol:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить протокол",
        variant: "destructive"
      });
    }
  };

  const calculateProgress = () => {
    let completedFields = 0;
    let totalFields = 0;

    Object.values(formData.childData).forEach(value => {
      totalFields++;
      if (value && value !== false) completedFields++;
    });

    formData.documents.forEach(doc => {
      totalFields++;
      if (doc.present) completedFields++;
    });

    const protocolFields = [formData.reason, formData.consultationDate, formData.sessionTopic];
    protocolFields.forEach(field => {
      totalFields++;
      if (field) completedFields++;
    });

    checklistBlocks.forEach(block => {
      block.topics.forEach((topic: any) => {
        topic.subtopics.forEach((subtopic: any) => {
          subtopic.items.forEach((item: any) => {
            totalFields++;
            if (item.score !== undefined) completedFields++;
          });
        });
      });
    });

    return Math.round((completedFields / totalFields) * 100);
  };

  // Если доступ истек и это не редактирование существующего протокола
  // Админы и региональные операторы имеют полный доступ
  if (!editingProtocol && !isAdmin && !isRegionalOperator && !subscriptionStatus.canCreateProtocols && !subscriptionStatus.loading) {
    return (
      <Card className="max-w-2xl mx-auto mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Доступ ограничен
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Пробный период завершен. Для создания новых протоколов необходимо оформить подписку.
            </AlertDescription>
          </Alert>
          <div className="flex gap-4">
            <Button onClick={() => navigate('/profile')} className="flex-1">
              Оформить подписку
            </Button>
            <Button variant="outline" onClick={() => navigate('/')} className="flex-1">
              На главную
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const steps = [
    { 
      number: 1, 
      title: "Данные об обучающемся", 
      icon: User,
      isComplete: () => !!formData.childData.fullName && !!selectedLevel && !!formData.childData.parentName
    },
    { 
      number: 2, 
      title: "Данные протокола", 
      icon: FileText,
      isComplete: () => !!formData.consultationType && !!formData.consultationDate
    },
    { 
      number: 3, 
      title: "Документы обучающегося", 
      icon: FileText,
      isComplete: () => formData.documents.filter(d => d.required).every(d => d.present)
    },
    { 
      number: 4, 
      title: "Чек-лист обследования", 
      icon: ClipboardList,
      isComplete: () => checklistBlocks.length > 0
    },
    { 
      number: 5, 
      title: "Результаты и заключение", 
      icon: CheckCircle,
      isComplete: () => !!formData.parentConsent
    },
  ];

  // Блокировка создания нового протокола при отсутствии доступа
  const canCreateNew = editingProtocol || subscriptionStatus.canCreateProtocols;

  return (
    <div className="space-y-6">
      {!canCreateNew && !subscriptionStatus.loading && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {subscriptionStatus.trialEndDate ? (
              <>
                Пробный период завершился {subscriptionStatus.trialEndDate.toLocaleDateString('ru-RU')}. 
                Создание новых протоколов доступно только при активной подписке. 
                Созданные ранее протоколы доступны для просмотра в течение 3 лет.
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate('/profile')}
                  className="ml-4"
                >
                  Оформить подписку
                </Button>
              </>
            ) : (
              <>
                Для создания протоколов необходима активная подписка. 
                Созданные ранее протоколы доступны для просмотра в течение 3 лет.
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate('/profile')}
                  className="ml-4"
                >
                  Оформить подписку
                </Button>
              </>
            )}
          </AlertDescription>
        </Alert>
      )}
      
      <AlertDialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Сохранить изменения?</AlertDialogTitle>
            <AlertDialogDescription>
              У вас есть несохраненные изменения. Хотите сохранить их перед переходом?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleContinueWithoutSaving}>
              Не сохранять
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveAndContinue}>
              Сохранить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="w-full mb-6">
        <div className="flex items-center justify-between w-full px-4 gap-2">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.number;
            const isCompleted = step.isComplete();
            
            return (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <button
                    onClick={() => handleStepChange(step.number)}
                    className={`
                      flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all
                      ${isActive ? 'border-primary bg-primary text-primary-foreground' : ''}
                      ${isCompleted && !isActive ? 'border-primary bg-primary/10 text-primary' : ''}
                      ${!isActive && !isCompleted ? 'border-muted-foreground/30 text-muted-foreground' : ''}
                      hover:scale-105
                    `}
                  >
                    {isCompleted && !isActive ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </button>
                  <span className={`text-xs mt-1 text-center max-w-[120px] ${isActive ? 'font-semibold' : ''}`}>
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`
                    h-0.5 flex-1 mx-2
                    ${isCompleted ? 'bg-primary' : 'bg-muted-foreground/30'}
                  `} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <Progress value={calculateProgress()} className="h-2" />

      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Данные об обучающемся</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Уведомления о подписке - только для пользователей без активной подписки */}
            {!editingProtocol && !isAdmin && !isRegionalOperator && !subscriptionStatus.hasActiveSubscription && (
              <>
                {!subscriptionStatus.canCreateProtocols && !subscriptionStatus.loading && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="flex items-center justify-between">
                      <span>Пробный период истек. Оформите подписку для создания новых протоколов.</span>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate('/profile')}
                      >
                        Оформить подписку
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}
                {subscriptionStatus.isTrialActive && subscriptionStatus.trialEndDate && (
                  (() => {
                    const daysLeft = Math.ceil((subscriptionStatus.trialEndDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                    return daysLeft <= 3 ? (
                      <Alert className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="flex items-center justify-between">
                          <span>Пробный период истекает через {daysLeft} {daysLeft === 1 ? 'день' : daysLeft < 5 ? 'дня' : 'дней'}. Оформите подписку.</span>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => navigate('/profile')}
                          >
                            Оформить подписку
                          </Button>
                        </AlertDescription>
                      </Alert>
                    ) : null;
                  })()
                )}
              </>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="fullName">ФИО обучающегося *</Label>
                <Input
                  id="fullName"
                  value={formData.childData.fullName}
                  onChange={(e) => updateChildData("fullName", e.target.value)}
                  className={getRequiredFieldClass(formData.childData.fullName)}
                  placeholder="Иванов Иван Иванович"
                />
              </div>

              <div>
                <Label htmlFor="birthDate">Дата рождения *</Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={formData.childData.birthDate}
                  onChange={(e) => {
                    updateChildData("birthDate", e.target.value);
                    if (e.target.value) {
                      const birthDate = parseISO(e.target.value);
                      const today = new Date();
                      const years = differenceInYears(today, birthDate);
                      const months = differenceInMonths(today, birthDate) % 12;
                      updateChildData("age", `${years} лет ${months} мес.`);
                    }
                  }}
                  className={getRequiredFieldClass(formData.childData.birthDate)}
                />
              </div>

              <div>
                <Label htmlFor="age">Возраст *</Label>
                <Input
                  id="age"
                  value={formData.childData.age}
                  onChange={(e) => updateChildData("age", e.target.value)}
                  className={getRequiredFieldClass(formData.childData.age)}
                  placeholder="7 лет 6 мес."
                />
              </div>

              <div className="col-span-2 py-4">
                <Label className="mb-3 block">Уровень образования *</Label>
                <EducationLevelSelector
                  selectedLevel={selectedLevel}
                  onLevelChange={setSelectedLevel}
                />
              </div>

              <div>
                <Label htmlFor="classNumber">Класс/Группа</Label>
                <Select
                  value={formData.childData.classNumber}
                  onValueChange={(value) => updateChildData('classNumber', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      selectedLevel === 'preschool' 
                        ? 'Выберите группу' 
                        : 'Выберите класс'
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedLevel === 'preschool' ? (
                      <>
                        <SelectItem value="Младшая группа">Младшая группа</SelectItem>
                        <SelectItem value="Средняя группа">Средняя группа</SelectItem>
                        <SelectItem value="Старшая группа">Старшая группа</SelectItem>
                        <SelectItem value="Подготовительная группа">Подготовительная группа</SelectItem>
                      </>
                    ) : (
                      <>
                        {Array.from({ length: 11 }, (_, i) => (
                          <SelectItem key={i + 1} value={(i + 1).toString()}>
                            {i + 1} класс
                          </SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="classLetter">Литера класса/Номер группы</Label>
                <Input
                  id="classLetter"
                  value={formData.childData.classLetter}
                  onChange={(e) => updateChildData("classLetter", e.target.value)}
                  placeholder={selectedLevel === 'preschool' ? 'Номер группы' : 'А, Б, В...'}
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="educationalOrganization">Образовательная организация *</Label>
                <OrganizationSelector
                  value={formData.childData.educationalOrganization}
                  onChange={(value) => updateChildData("educationalOrganization", value)}
                  disabled={!isAdmin && !isRegionalOperator && !!profile?.organization_id}
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="address">Адрес проживания</Label>
                <Textarea
                  id="address"
                  value={formData.childData.address}
                  onChange={(e) => updateChildData("address", e.target.value)}
                  placeholder="г. Москва, ул. Примерная, д. 1, кв. 1"
                  rows={2}
                />
              </div>

              <div className="col-span-2 flex items-center space-x-2">
                <Checkbox
                  id="sameAsAddress"
                  checked={formData.childData.sameAsAddress || false}
                  onCheckedChange={(checked) => {
                    updateChildData("sameAsAddress", checked === true ? "true" : "false");
                    if (checked) {
                      updateChildData("registrationAddress", formData.childData.address);
                    }
                  }}
                />
                <Label htmlFor="sameAsAddress" className="font-normal cursor-pointer">
                  Адрес регистрации совпадает с адресом проживания
                </Label>
              </div>

              {!formData.childData.sameAsAddress && (
                <div className="col-span-2">
                  <Label htmlFor="registrationAddress">Адрес регистрации</Label>
                  <Textarea
                    id="registrationAddress"
                    value={formData.childData.registrationAddress}
                    onChange={(e) => updateChildData("registrationAddress", e.target.value)}
                    placeholder="г. Москва, ул. Примерная, д. 1, кв. 1"
                    rows={2}
                  />
                </div>
              )}

              <div className="col-span-2">
                <Label htmlFor="parentName">ФИО родителя (законного представителя) *</Label>
                <Input
                  id="parentName"
                  value={formData.childData.parentName}
                  onChange={(e) => updateChildData("parentName", e.target.value)}
                  className={getRequiredFieldClass(formData.childData.parentName)}
                  placeholder="Иванов Иван Иванович"
                />
              </div>

              <div>
                <Label htmlFor="parentPhone">Телефон родителя *</Label>
                <Input
                  id="parentPhone"
                  type="tel"
                  value={formData.childData.parentPhone}
                  onChange={(e) => updateChildData("parentPhone", e.target.value)}
                  className={getRequiredFieldClass(formData.childData.parentPhone)}
                  placeholder="+7 (999) 123-45-67"
                />
              </div>

              <div>
                <Label htmlFor="whobrought">Кто привел на консультацию *</Label>
                <Select
                  value={formData.childData.whobrought}
                  onValueChange={(value) => updateChildData("whobrought", value)}
                >
                  <SelectTrigger className={getRequiredFieldClass(formData.childData.whobrought)}>
                    <SelectValue placeholder="Выберите" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mother">Мать</SelectItem>
                    <SelectItem value="father">Отец</SelectItem>
                    <SelectItem value="guardian">Опекун</SelectItem>
                    <SelectItem value="representative">Законный представитель</SelectItem>
                    <SelectItem value="other">Другое</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.childData.whobrought === "other" && (
                <div className="col-span-2">
                  <Label htmlFor="relationship">Укажите кто привел</Label>
                  <Input
                    id="relationship"
                    value={formData.childData.relationship}
                    onChange={(e) => updateChildData("relationship", e.target.value)}
                    placeholder="Например: бабушка, дедушка, тетя"
                  />
                </div>
              )}
            </div>

          </CardContent>
        </Card>
      )}

      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Данные протокола</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="consultationType">Тип консультации *</Label>
              <RadioGroup
                value={formData.consultationType}
                onValueChange={(value: "primary" | "secondary") =>
                  setFormData(prev => ({ ...prev, consultationType: value }))
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="primary" id="primary" />
                  <Label htmlFor="primary">Первичная</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="secondary" id="secondary" />
                  <Label htmlFor="secondary">Вторичная</Label>
                </div>
              </RadioGroup>
            </div>

            {formData.consultationType === "secondary" && previousProtocols.length > 0 && (
              <div>
                <Label>Предыдущие протоколы</Label>
                <div className="space-y-2 mt-2">
                  {previousProtocols.map((protocol) => (
                    <div key={protocol.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="font-medium">Протокол №{protocol.ppk_number || "б/н"}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(protocol.created_at).toLocaleDateString("ru-RU")}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
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
                <PreviousProtocolDialog
                  protocol={selectedProtocol}
                  open={showProtocolDialog}
                  onOpenChange={setShowProtocolDialog}
                />
              </div>
            )}

            {formData.consultationType === "secondary" && (
              <div>
                <Label htmlFor="previousConsultations">История предыдущих консультаций</Label>
                <Textarea
                  id="previousConsultations"
                  value={formData.previousConsultations}
                  onChange={(e) => setFormData(prev => ({ ...prev, previousConsultations: e.target.value }))}
                  rows={6}
                  placeholder="История предыдущих консультаций..."
                />
              </div>
            )}

            <div>
              <Label htmlFor="consultationDate">Дата консультации *</Label>
              <Input
                id="consultationDate"
                type="date"
                value={formData.consultationDate}
                onChange={(e) => setFormData(prev => ({ ...prev, consultationDate: e.target.value }))}
                className={getRequiredFieldClass(formData.consultationDate)}
              />
            </div>

            <div>
              <Label htmlFor="reason">Причина направления на ППк *</Label>
              <Textarea
                id="reason"
                value={formData.reason}
                onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                className={getRequiredFieldClass(formData.reason)}
                placeholder="Опишите причину направления..."
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="sessionTopic">Тема заседания</Label>
              <Select
                value={formData.sessionTopic}
                onValueChange={(value) => setFormData({ ...formData, sessionTopic: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите тему заседания" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Определение необходимости психолого-педагогической помощи">
                    Определение необходимости психолого-педагогической помощи
                  </SelectItem>
                  <SelectItem value="Определение направления психолого-педагогической помощи">
                    Определение направления психолого-педагогической помощи
                  </SelectItem>
                  <SelectItem value="Оценка эффективности психолого-педагогической помощи">
                    Оценка эффективности психолого-педагогической помощи
                  </SelectItem>
                  <SelectItem value="Психолого-педагогическое сопровождение обучающихся с ОВЗ">
                    Психолого-педагогическое сопровождение обучающихся с ОВЗ
                  </SelectItem>
                  <SelectItem value="Подготовка рекомендаций по АООП">
                    Подготовка рекомендаций по АООП
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="meetingType">Тип заседания</Label>
              <Select
                value={formData.meetingType || "scheduled"}
                onValueChange={(value: "scheduled" | "unscheduled") =>
                  setFormData(prev => ({ ...prev, meetingType: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Плановое</SelectItem>
                  <SelectItem value="unscheduled">Внеплановое</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {editingProtocol && (
              <div>
                <Label htmlFor="ppkNumber">Номер протокола ППк</Label>
                <Input
                  id="ppkNumber"
                  value={formData.ppkNumber || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, ppkNumber: e.target.value }))}
                  placeholder="Автоматически при сохранении"
                  disabled
                />
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox
                id="parentConsent"
                checked={formData.parentConsent || false}
                onCheckedChange={(checked) =>
                  setFormData(prev => ({ ...prev, parentConsent: Boolean(checked) }))
                }
              />
              <Label htmlFor="parentConsent" className="font-normal">
                Получено согласие родителя (законного представителя) на обработку персональных данных
              </Label>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Документы обучающегося</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {formData.documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id={doc.id}
                      checked={doc.present}
                      onCheckedChange={(checked) => updateDocument(doc.id, Boolean(checked))}
                    />
                    <Label htmlFor={doc.id} className="font-normal cursor-pointer">
                      {doc.name}
                      {doc.required && <span className="text-destructive ml-1">*</span>}
                    </Label>
                  </div>
                  <Badge variant={doc.present ? "default" : "secondary"}>
                    {doc.present ? "Есть" : "Нет"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 4 && (
        <ProtocolChecklistPaginated
          educationLevel={selectedLevel}
          childName={formData.childData.fullName}
          blocks={checklistBlocks}
          onItemChange={updateItemScore}
          calculateBlockScore={calculateBlockScore}
        />
      )}

      {currentStep === 5 && (
        <ProtocolResultsPanel
          blocks={checklistBlocks}
          educationLevel={selectedLevel}
          calculateBlockScore={calculateBlockScore}
        />
      )}

      <div className="flex justify-between pt-4">
        <Button
          onClick={prevStep}
          disabled={currentStep === 1}
          variant="outline"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Назад
        </Button>

        <div className="flex gap-2">
          <Button
            onClick={() => saveProtocolData(true)}
            variant="outline"
            disabled={!canSaveProtocol()}
          >
            <Save className="mr-2 h-4 w-4" />
            Сохранить черновик
          </Button>

          {currentStep < 5 ? (
            <Button onClick={nextStep}>
              Далее
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={() => saveProtocolData(false)}
              disabled={!canFinalizeProtocol()}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Завершить протокол
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
