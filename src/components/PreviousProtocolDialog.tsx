import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface PreviousProtocolDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  protocol: {
    id: string;
    ppk_number?: string;
    created_at: string;
    protocol_data?: any;
    checklist_data?: any;
    education_level?: string;
    consultation_type?: string;
    consultation_reason?: string;
  } | null;
}

export const PreviousProtocolDialog = ({ open, onOpenChange, protocol }: PreviousProtocolDialogProps) => {
  if (!protocol) return null;

  const protocolData = protocol.protocol_data;
  const childData = protocolData?.childData;
  const documents = protocolData?.documents || [];
  const conclusionText = protocolData?.conclusionText || "Заключение отсутствует";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            Протокол №{protocol.ppk_number || "Не указан"} от{" "}
            {new Date(protocol.created_at).toLocaleDateString("ru-RU")}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6">
            {/* Общая информация */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Общая информация</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Уровень образования</p>
                    <p className="font-medium">{protocol.education_level || "Не указан"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Тип консультации</p>
                    <Badge variant="outline">{protocol.consultation_type || "Не указан"}</Badge>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Причина обращения</p>
                    <p className="font-medium">{protocol.consultation_reason || "Не указана"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Данные ребенка */}
            {childData && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Данные обучающегося</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">ФИО</p>
                      <p className="font-medium">{childData.fullName || "Не указано"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Дата рождения</p>
                      <p className="font-medium">
                        {childData.birthDate
                          ? new Date(childData.birthDate).toLocaleDateString("ru-RU")
                          : "Не указана"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Возраст</p>
                      <p className="font-medium">{childData.age || "Не указан"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Класс</p>
                      <p className="font-medium">
                        {childData.classNumber && childData.classLetter
                          ? `${childData.classNumber}${childData.classLetter}`
                          : "Не указан"}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">Адрес проживания</p>
                      <p className="font-medium">{childData.address || "Не указан"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">ФИО родителя</p>
                      <p className="font-medium">{childData.parentName || "Не указано"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Телефон</p>
                      <p className="font-medium">{childData.parentPhone || "Не указан"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Документы */}
            {documents.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Документы</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {documents.map((doc: any, index: number) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm">{doc.name}</span>
                        <Badge variant={doc.present ? "default" : "secondary"}>
                          {doc.present ? "Представлен" : "Не представлен"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Заключение */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Заключение</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-wrap text-foreground">{conclusionText}</p>
                </div>
              </CardContent>
            </Card>

            {/* Данные чек-листа */}
            {protocol.checklist_data && Object.keys(protocol.checklist_data).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Результаты оценки</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(protocol.checklist_data).map(([blockKey, blockData]: [string, any]) => (
                      <div key={blockKey} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{blockData.name || blockKey}</h4>
                          <Badge>
                            Балл: {blockData.score !== undefined ? blockData.score.toFixed(2) : "Не оценено"}
                          </Badge>
                        </div>
                        <Separator />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
