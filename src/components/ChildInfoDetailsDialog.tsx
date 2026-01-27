import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Calendar, 
  School, 
  Phone, 
  Mail, 
  MapPin,
  FileText,
  Users,
  Baby
} from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface Protocol {
  id: string;
  child_name: string;
  child_birth_date: string;
  created_at: string;
  ppk_number: string;
  protocol_data: any;
  organizations?: {
    name: string;
  };
}

interface ChildData {
  id?: string;
  full_name?: string;
  birth_date?: string;
  gender?: string;
  education_level?: string;
  parent_name?: string;
  parent_phone?: string;
  parent_email?: string;
  notes?: string;
  organization?: {
    name?: string;
    address?: string;
  };
}

interface ChildInfoDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  protocols: Protocol[];
  childData?: ChildData | null;
  childInfo: {
    name: string;
    birthDate: string;
    organization: string;
  } | null;
}

export function ChildInfoDetailsDialog({ 
  open, 
  onOpenChange, 
  protocols,
  childData,
  childInfo
}: ChildInfoDetailsDialogProps) {
  // Собираем данные из последнего протокола
  const latestProtocol = protocols[protocols.length - 1];
  const protocolData = latestProtocol?.protocol_data || {};

  // Расчёт возраста
  const birthDate = childData?.birth_date || childInfo?.birthDate || latestProtocol?.child_birth_date;
  const calculateAge = (bd: string) => {
    const birth = new Date(bd);
    const today = new Date();
    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();
    
    if (months < 0 || (months === 0 && today.getDate() < birth.getDate())) {
      years--;
      months += 12;
    }
    if (today.getDate() < birth.getDate()) {
      months--;
    }
    
    return { years, months };
  };

  const age = birthDate ? calculateAge(birthDate) : null;

  // Переводы для полей
  const genderLabels: Record<string, string> = {
    male: "Мужской",
    female: "Женский",
    М: "Мужской",
    Ж: "Женский"
  };

  const educationLevelLabels: Record<string, string> = {
    do: "Дошкольное образование",
    noo: "Начальное общее образование",
    oo: "Основное общее образование", 
    soo: "Среднее общее образование"
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Подробная информация о ребёнке
          </DialogTitle>
          <DialogDescription>
            Данные из базы детей и протоколов ППк
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(85vh-120px)] pr-4">
          <div className="space-y-6">
            {/* Основные данные */}
            <section>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Основные данные
              </h3>
              <div className="grid gap-3">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <User className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">ФИО ребёнка</p>
                    <p className="font-medium">
                      {childData?.full_name || childInfo?.name || latestProtocol?.child_name || "—"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <Calendar className="h-5 w-5 text-primary mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Дата рождения</p>
                      <p className="font-medium">
                        {birthDate 
                          ? format(new Date(birthDate), "dd MMMM yyyy", { locale: ru })
                          : "—"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <Baby className="h-5 w-5 text-primary mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Возраст</p>
                      <p className="font-medium">
                        {age 
                          ? `${age.years} лет ${age.months} мес.`
                          : "—"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <Users className="h-5 w-5 text-primary mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Пол</p>
                      <p className="font-medium">
                        {childData?.gender 
                          ? (genderLabels[childData.gender] || childData.gender)
                          : protocolData?.gender 
                            ? (genderLabels[protocolData.gender] || protocolData.gender)
                            : "—"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <School className="h-5 w-5 text-primary mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Уровень образования</p>
                      <p className="font-medium">
                        {childData?.education_level 
                          ? (educationLevelLabels[childData.education_level] || childData.education_level)
                          : protocolData?.educationLevel
                            ? (educationLevelLabels[protocolData.educationLevel] || protocolData.educationLevel)
                            : "—"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <Separator />

            {/* Образовательная организация */}
            <section>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Образовательная организация
              </h3>
              <div className="grid gap-3">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <School className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Название</p>
                    <p className="font-medium">
                      {childData?.organization?.name || childInfo?.organization || "—"}
                    </p>
                  </div>
                </div>

                {childData?.organization?.address && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <MapPin className="h-5 w-5 text-primary mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Адрес</p>
                      <p className="font-medium">{childData.organization.address}</p>
                    </div>
                  </div>
                )}
              </div>
            </section>

            <Separator />

            {/* Контактные данные родителя */}
            <section>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Контактные данные родителя/представителя
              </h3>
              <div className="grid gap-3">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <Users className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">ФИО родителя</p>
                    <p className="font-medium">
                      {childData?.parent_name || protocolData?.parentName || "—"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <Phone className="h-5 w-5 text-primary mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Телефон</p>
                      <p className="font-medium">
                        {childData?.parent_phone || protocolData?.parentPhone || "—"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <Mail className="h-5 w-5 text-primary mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="font-medium">
                        {childData?.parent_email || protocolData?.parentEmail || "—"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <Separator />

            {/* Протоколы ППк */}
            <section>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                История протоколов ППк
              </h3>
              <div className="space-y-2">
                {protocols.map((protocol, index) => (
                  <div 
                    key={protocol.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-primary" />
                      <div>
                        <p className="font-medium">№ {protocol.ppk_number || `${index + 1}`}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(protocol.created_at), "dd.MM.yyyy", { locale: ru })}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">
                      Протокол {index + 1} из {protocols.length}
                    </Badge>
                  </div>
                ))}
              </div>
            </section>

            {/* Примечания */}
            {childData?.notes && (
              <>
                <Separator />
                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    Примечания
                  </h3>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-sm whitespace-pre-wrap">{childData.notes}</p>
                  </div>
                </section>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}