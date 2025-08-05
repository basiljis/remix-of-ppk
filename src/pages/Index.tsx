import { useState } from "react";
import { ChecklistCard } from "@/components/ChecklistCard";
import { EducationLevelSelector, EducationLevel } from "@/components/EducationLevelSelector";
import { StatisticsPanel } from "@/components/StatisticsPanel";
import { ConsentForm } from "@/components/ConsentForm";
import { InstructionsSection } from "@/components/InstructionsSection";
import { ProtocolForm } from "@/components/ProtocolForm";
import { PPKList } from "@/components/PPKList";
import { useProtocolStorage } from "@/hooks/useProtocolStorage";
import { DifficultiesChecklist } from "@/components/DifficultiesChecklist";
import { getChecklistData, ChecklistSection } from "@/data/checklistData";
import { getDifficultiesData, calculateDifficultiesScore, DifficultiesBlock, DifficultiesItem } from "@/data/difficultiesData";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Users, Calendar, BookOpen, Download, ClipboardList, Database, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [selectedLevel, setSelectedLevel] = useState<EducationLevel>("elementary");
  const [checklistSections, setChecklistSections] = useState<ChecklistSection[]>(
    getChecklistData("elementary")
  );
  const [difficultiesBlocks, setDifficultiesBlocks] = useState<DifficultiesBlock[]>(
    getDifficultiesData("elementary")
  );
  const [calculationResult, setCalculationResult] = useState<any>(null);
  const { toast } = useToast();

  const handleLevelChange = (level: EducationLevel) => {
    setSelectedLevel(level);
    setChecklistSections(getChecklistData(level));
    setDifficultiesBlocks(getDifficultiesData(level));
    setCalculationResult(null);
    toast({
      title: "Уровень образования изменен",
      description: `Загружены чеклисты для ${getLevelName(level)}`,
    });
  };

  const getLevelName = (level: EducationLevel) => {
    const names = {
      preschool: "дошкольного образования",
      elementary: "начального образования", 
      middle: "основного образования",
      high: "среднего образования"
    };
    return names[level];
  };

  const handleItemToggle = (sectionId: string, itemId: string) => {
    setChecklistSections(sections =>
      sections.map(section =>
        section.id === sectionId
          ? {
              ...section,
              items: section.items.map(item =>
                item.id === itemId ? { ...item, completed: !item.completed } : item
              )
            }
          : section
      )
    );
  };

  const handleDifficultyChange = (itemId: string, status: DifficultiesItem["status"]) => {
    setDifficultiesBlocks(blocks =>
      blocks.map(block => ({
        ...block,
        items: block.items.map(item =>
          item.id === itemId ? { ...item, status } : item
        )
      }))
    );
    // Сбрасываем результат расчета при изменении данных
    setCalculationResult(null);
  };

  const handleCalculate = () => {
    const result = calculateDifficultiesScore(difficultiesBlocks);
    setCalculationResult(result);
    toast({
      title: "Расчет завершен",
      description: `Уровень трудностей: ${result.percentage.toFixed(1)}%`,
    });
  };

  const handleProtocolSave = (protocolData: any) => {
    console.log("Saved protocol:", protocolData);
    // Здесь можно добавить логику сохранения в базу данных
  };

  const generateReport = () => {
    const totalRequired = checklistSections.reduce(
      (acc, section) => acc + section.items.filter(item => item.required).length,
      0
    );
    const completedRequired = checklistSections.reduce(
      (acc, section) => acc + section.items.filter(item => item.required && item.completed).length,
      0
    );

    if (completedRequired === totalRequired) {
      toast({
        title: "Отчет готов",
        description: "Все обязательные задачи выполнены. Консилиум может быть проведен.",
      });
    } else {
      toast({
        title: "Требуется дополнительная подготовка",
        description: `Не завершены ${totalRequired - completedRequired} обязательных задач.`,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-4">
            Система автоматизации ППк
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Автоматизированная система чеклистов для проведения психолого-педагогического консилиума
          </p>
        </div>

        <Tabs defaultValue="protocol" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-8">
            <TabsTrigger value="protocol" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Протокол ППк
            </TabsTrigger>
            <TabsTrigger value="checklists" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Чеклисты
            </TabsTrigger>
            <TabsTrigger value="difficulties" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Трудности
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Список ППк
            </TabsTrigger>
            <TabsTrigger value="instructions" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Инструкции
            </TabsTrigger>
          </TabsList>

            <TabsContent value="protocol" className="space-y-6">
              <ProtocolForm 
                onProtocolSave={handleProtocolSave}
                editingProtocol={editingProtocol ? getProtocol(editingProtocol) : undefined}
                onSaveDraft={handleSaveDraft}
              />
            </TabsContent>

          <TabsContent value="checklists" className="space-y-6">
            {/* Level Selector */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Выберите уровень образования
                </CardTitle>
              </CardHeader>
              <CardContent>
                <EducationLevelSelector
                  selectedLevel={selectedLevel}
                  onLevelChange={handleLevelChange}
                />
              </CardContent>
            </Card>

            <div className="grid lg:grid-cols-4 gap-6">
              {/* Statistics Panel */}
              <div className="lg:col-span-1">
                <StatisticsPanel sections={checklistSections} />
                
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Действия
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button onClick={generateReport} className="w-full">
                      <Calendar className="h-4 w-4 mr-2" />
                      Проверить готовность
                    </Button>
                    <Button variant="outline" className="w-full">
                      <FileText className="h-4 w-4 mr-2" />
                      Экспорт отчета
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Checklists */}
              <div className="lg:col-span-3 space-y-6">
                {checklistSections.map((section) => (
                  <ChecklistCard
                    key={section.id}
                    title={section.title}
                    items={section.items}
                    onItemToggle={(itemId) => handleItemToggle(section.id, itemId)}
                    variant={section.variant}
                  />
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="difficulties" className="space-y-6">
            <DifficultiesChecklist
              level={selectedLevel}
              onItemChange={handleDifficultyChange}
              blocks={difficultiesBlocks}
              onCalculate={handleCalculate}
              calculationResult={calculationResult}
            />
          </TabsContent>

          <TabsContent value="list" className="space-y-6">
            <PPKList />
          </TabsContent>

          <TabsContent value="instructions" className="space-y-6">
            <InstructionsSection />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
