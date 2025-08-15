import { useState } from "react";
import { ChecklistCard } from "@/components/ChecklistCard";
import { EducationLevelSelector, EducationLevel } from "@/components/EducationLevelSelector";
import { StatisticsPanel } from "@/components/StatisticsPanel";
import { ConsentForm } from "@/components/ConsentForm";
import { InstructionsSection } from "@/components/InstructionsSection";
import { ProtocolForm } from "@/components/ProtocolForm";
import { PPKList } from "@/components/PPKList";
import { Dashboard } from "@/components/Dashboard";
import { OrganizationsList } from "@/components/OrganizationsList";
import { useChecklistData } from "@/hooks/useChecklistData";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Users, Calendar, BookOpen, Download, ClipboardList, Database, AlertTriangle, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [selectedLevel, setSelectedLevel] = useState<EducationLevel>("elementary");
  const [activeTab, setActiveTab] = useState("protocol");
  const { toast } = useToast();
  const { checklists, loading, error } = useChecklistData();

  const handleLevelChange = (level: EducationLevel) => {
    setSelectedLevel(level);
    toast({
      title: "Уровень образования изменен",
      description: `Выбран уровень: ${getLevelName(level)}`,
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

  // Get current checklists for selected level
  const currentChecklists = checklists.filter(checklist => checklist.level === selectedLevel);

  const handleItemToggle = (checklistId: string, itemId: string) => {
    toast({
      title: "Элемент обновлен",
      description: "Состояние элемента чеклиста изменено",
    });
  };


  const handleProtocolSave = (protocolData: any) => {
    console.log("Saved protocol:", protocolData);
    // Здесь можно добавить логику сохранения в базу данных
  };

  const generateReport = () => {
    const totalRequired = currentChecklists.reduce(
      (acc, checklist) => acc + checklist.items.filter(item => item.isRequired).length,
      0
    );

    toast({
      title: "Система готова",
      description: `Найдено ${totalRequired} обязательных элементов для проверки`,
    });
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-8">
            <TabsTrigger value="protocol" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Протокол ППк
            </TabsTrigger>
            <TabsTrigger value="checklists" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Чеклисты
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Список ППк
            </TabsTrigger>
            <TabsTrigger value="organizations" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Организации
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Дашборд
            </TabsTrigger>
            <TabsTrigger value="instructions" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Инструкции
            </TabsTrigger>
          </TabsList>

          <TabsContent value="protocol" className="space-y-6">
            <ProtocolForm onProtocolSave={handleProtocolSave} />
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

            {loading && (
              <Card>
                <CardContent className="p-6 text-center">
                  <p>Загрузка чеклистов...</p>
                </CardContent>
              </Card>
            )}
            
            {error && (
              <Card>
                <CardContent className="p-6 text-center">
                  <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
                  <p className="text-destructive">Ошибка загрузки: {error}</p>
                </CardContent>
              </Card>
            )}

            {!loading && !error && (
              <div className="grid lg:grid-cols-4 gap-6">
                {/* Statistics Panel */}
                <div className="lg:col-span-1">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Статистика
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="text-sm">Всего чеклистов: {currentChecklists.length}</p>
                        <p className="text-sm">Текущий уровень: {getLevelName(selectedLevel)}</p>
                      </div>
                    </CardContent>
                  </Card>
                  
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
                  {currentChecklists.length === 0 ? (
                    <Card>
                      <CardContent className="p-6 text-center">
                        <p>Чеклисты для уровня "{getLevelName(selectedLevel)}" не найдены</p>
                      </CardContent>
                    </Card>
                  ) : (
                    currentChecklists.map((checklist) => (
                      <ChecklistCard
                        key={checklist.id}
                        title={checklist.name}
                        items={checklist.items.map(item => ({
                          id: item.id,
                          text: item.text,
                          completed: item.isCompleted,
                          required: item.isRequired
                        }))}
                        onItemToggle={(itemId) => handleItemToggle(checklist.id, itemId)}
                        variant="primary"
                      />
                    ))
                  )}
                </div>
              </div>
            )}
          </TabsContent>


          <TabsContent value="list" className="space-y-6">
            <PPKList onNewProtocol={() => setActiveTab("protocol")} />
          </TabsContent>

          <TabsContent value="organizations" className="space-y-6">
            <OrganizationsList />
          </TabsContent>

          <TabsContent value="dashboard" className="space-y-6">
            <Dashboard />
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
