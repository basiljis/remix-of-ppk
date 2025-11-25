import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ProtocolChecklistBlock } from "@/hooks/useProtocolChecklistData";
import { analyzeProtocolResults } from "@/utils/assistanceDirections";
import { generateProtocolConclusion, ProtocolConclusion } from "@/utils/protocolRecommendations";
import { FileText, Download, CheckCircle, XCircle, Users, Clock, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface ProtocolConclusionPanelProps {
  blocks: ProtocolChecklistBlock[];
  educationLevel: string;
  childName: string;
  calculateBlockScore: (block: ProtocolChecklistBlock, educationLevel?: string) => {
    score: number;
    maxScore: number;
    percentage: number;
    yesCount: number;
    sumWeight1Criteria: number;
    formulaPercentage: number;
    weightPerCriteria: number;
  };
  onConclusionChange?: (conclusionText: string) => void;
  savedConclusion?: string;
  parentConsent?: boolean;
  onParentConsentChange?: (consent: boolean) => void;
}

export const ProtocolConclusionPanel = ({ 
  blocks, 
  educationLevel, 
  childName, 
  calculateBlockScore,
  onConclusionChange,
  savedConclusion,
  parentConsent = false,
  onParentConsentChange
}: ProtocolConclusionPanelProps) => {
  const [editableConclusion, setEditableConclusion] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  const analysis = analyzeProtocolResults(blocks, calculateBlockScore, educationLevel);
  const conclusion: ProtocolConclusion = generateProtocolConclusion(analysis, childName, educationLevel);

  // Инициализируем редактируемое заключение из сохраненного или сгенерированного
  useState(() => {
    if (savedConclusion) {
      setEditableConclusion(savedConclusion);
    }
  });

  const handleEditConclusion = () => {
    setEditableConclusion(conclusion.conclusionText);
    setIsEditing(true);
  };

  const handleSaveConclusion = () => {
    setIsEditing(false);
    // Передаем отредактированный текст заключения в родительский компонент
    if (onConclusionChange) {
      onConclusionChange(editableConclusion);
    }
    toast({
      title: "Заключение сохранено",
      description: "Изменения в заключении протокола сохранены",
    });
  };

  const handleDownloadConclusion = () => {
    const textToDownload = isEditing ? editableConclusion : conclusion.conclusionText;
    const blob = new Blob([textToDownload], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Заключение_ППК_${childName}_${new Date().toLocaleDateString('ru-RU').replace(/\./g, '-')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Заключение скачано",
      description: "Файл с заключением протокола успешно скачан",
    });
  };

  const getGroupColor = (group: number) => {
    switch (group) {
      case 1: return 'bg-green-100 text-green-800 border-green-200';
      case 2: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 3: return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Итоговый статус */}
      <Card className="bg-gradient-to-br from-primary/5 to-secondary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Заключение протокола ППК
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className={`border-l-4 ${
            conclusion.finalGroup === 1 ? 'border-l-green-500 bg-green-50' :
            conclusion.finalGroup === 2 ? 'border-l-yellow-500 bg-yellow-50' :
            'border-l-red-500 bg-red-50'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {conclusion.finalGroup === 1 ? <CheckCircle className="h-4 w-4" /> :
               conclusion.finalGroup === 2 ? <AlertTriangle className="h-4 w-4" /> :
               <XCircle className="h-4 w-4" />}
              <Badge className={getGroupColor(conclusion.finalGroup)}>
                Итоговая группа {conclusion.finalGroup}
              </Badge>
            </div>
            <AlertDescription className="font-medium">
              {conclusion.finalStatus}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Направления помощи */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Рекомендуемые специалисты
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 border rounded-lg">
              <div className="flex items-center justify-center mb-2">
                {conclusion.specialistAssignments.teacher ? 
                  <CheckCircle className="h-5 w-5 text-green-600" /> :
                  <XCircle className="h-5 w-5 text-red-600" />
                }
              </div>
              <div className="text-sm font-medium">Педагог</div>
              <Badge variant={conclusion.specialistAssignments.teacher ? "default" : "secondary"}>
                {conclusion.specialistAssignments.teacher ? "ДА" : "НЕТ"}
              </Badge>
            </div>
            
            <div className="text-center p-3 border rounded-lg">
              <div className="flex items-center justify-center mb-2">
                {conclusion.specialistAssignments.speechTherapist ? 
                  <CheckCircle className="h-5 w-5 text-green-600" /> :
                  <XCircle className="h-5 w-5 text-red-600" />
                }
              </div>
              <div className="text-sm font-medium">Учитель-логопед</div>
              <Badge variant={conclusion.specialistAssignments.speechTherapist ? "default" : "secondary"}>
                {conclusion.specialistAssignments.speechTherapist ? "ДА" : "НЕТ"}
              </Badge>
            </div>
            
            <div className="text-center p-3 border rounded-lg">
              <div className="flex items-center justify-center mb-2">
                {conclusion.specialistAssignments.psychologist ? 
                  <CheckCircle className="h-5 w-5 text-green-600" /> :
                  <XCircle className="h-5 w-5 text-red-600" />
                }
              </div>
              <div className="text-sm font-medium">Педагог-психолог</div>
              <Badge variant={conclusion.specialistAssignments.psychologist ? "default" : "secondary"}>
                {conclusion.specialistAssignments.psychologist ? "ДА" : "НЕТ"}
              </Badge>
            </div>
            
            <div className="text-center p-3 border rounded-lg">
              <div className="flex items-center justify-center mb-2">
                {conclusion.specialistAssignments.socialWorker ? 
                  <CheckCircle className="h-5 w-5 text-green-600" /> :
                  <XCircle className="h-5 w-5 text-red-600" />
                }
              </div>
              <div className="text-sm font-medium">Социальный педагог</div>
              <Badge variant={conclusion.specialistAssignments.socialWorker ? "default" : "secondary"}>
                {conclusion.specialistAssignments.socialWorker ? "ДА" : "НЕТ"}
              </Badge>
            </div>
          </div>

          {conclusion.specialistAssignments.needsCPMPK && (
            <Alert className="mt-4 border-l-4 border-l-red-500 bg-red-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="font-medium">
                НЕОБХОДИМО направление на ЦПМПК для углубленной диагностики
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Рекомендации по формам работы */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Рекомендуемые формы работы
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {conclusion.workFormRecommendations.map((recommendation, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-muted-foreground mt-1">•</span>
                <span className="text-sm">{recommendation}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Сроки */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Сроки предоставления помощи
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">{conclusion.timeframeRecommendations}</p>
        </CardContent>
      </Card>

      {/* ЦПМПК рекомендации */}
      {conclusion.cpmkRecommendation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Рекомендации по ЦПМПК
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{conclusion.cpmkRecommendation}</p>
          </CardContent>
        </Card>
      )}

      {/* Полное заключение */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Текст заключения
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleEditConclusion}
                disabled={isEditing}
              >
                Редактировать
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDownloadConclusion}
              >
                <Download className="h-4 w-4 mr-1" />
                Скачать
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <div className="space-y-3">
              <Textarea
                value={editableConclusion}
                onChange={(e) => setEditableConclusion(e.target.value)}
                className="min-h-[400px] font-mono text-sm"
                placeholder="Введите текст заключения..."
              />
              <div className="flex gap-2">
                <Button onClick={handleSaveConclusion}>
                  Сохранить изменения
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditing(false)}
                >
                  Отменить
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-muted p-4 rounded-lg">
              <pre className="text-sm whitespace-pre-wrap font-mono">
                {savedConclusion || editableConclusion || conclusion.conclusionText}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Согласие родителя */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="parent-consent" 
              checked={parentConsent || false}
              onCheckedChange={(checked) => {
                console.log("Parent consent checkbox changed:", checked);
                if (onParentConsentChange) {
                  onParentConsentChange(checked === true);
                }
              }}
            />
            <Label 
              htmlFor="parent-consent" 
              className="text-sm font-medium leading-none cursor-pointer select-none"
            >
              Родитель/законный представитель ознакомлен(а) с заключением и согласен(а) с ним
            </Label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};