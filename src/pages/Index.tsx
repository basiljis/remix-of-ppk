import { useState } from "react";
import { ChecklistCard } from "@/components/ChecklistCard";
import { EducationLevelSelector, EducationLevel } from "@/components/EducationLevelSelector";
import { StatisticsPanel } from "@/components/StatisticsPanel";
import { ConsentForm } from "@/components/ConsentForm";
import { InstructionsSection } from "@/components/InstructionsSection";
import { ProtocolForm } from "@/components/ProtocolForm";
import { PPKList } from "@/components/PPKList";
import { Dashboard } from "@/components/Dashboard";
import { OrganizationsManagement } from "@/components/OrganizationsManagement";
import { MobileMenu } from "@/components/MobileMenu";
import { Footer } from "@/components/Footer";
import { useChecklistData } from "@/hooks/useChecklistData";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Users, Calendar, BookOpen, Download, ClipboardList, Database, AlertTriangle, BarChart3, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Administration } from "@/components/Administration";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const Index = () => {
  const [selectedLevel, setSelectedLevel] = useState<EducationLevel>("elementary");
  const [activeTab, setActiveTab] = useState("protocol");
  const [checklistStates, setChecklistStates] = useState<Record<string, boolean>>({});
  const [editingProtocol, setEditingProtocol] = useState<any>(null);
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
    const stateKey = `${checklistId}-${itemId}`;
    setChecklistStates(prev => ({
      ...prev,
      [stateKey]: !prev[stateKey]
    }));
    
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
      <div className="w-full px-4 py-8">{/* Убираем container mx-auto для полной ширины */}
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1"></div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Система автоматизации ППк
            </h1>
            <div className="flex-1 flex justify-end gap-2">
              <ThemeToggle />
              <MobileMenu activeTab={activeTab} onTabChange={setActiveTab} />
            </div>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Автоматизированная система чеклистов для проведения психолого-педагогического консилиума
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="hidden md:grid w-full grid-cols-5 mb-8">
            <TabsTrigger value="protocol" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Протокол ППк
            </TabsTrigger>
            {/* HIDDEN: Раздел чек-листов временно скрыт - для восстановления раскомментируйте следующие строки */}
            {/* 
            <TabsTrigger value="checklists" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Чеклисты
            </TabsTrigger> 
            */}
            <TabsTrigger value="list" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Список ППк
            </TabsTrigger>
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Дашборд
          </TabsTrigger>
            <TabsTrigger value="instructions" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Инструкции
            </TabsTrigger>
            <TabsTrigger value="administration" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Администрирование
            </TabsTrigger>
          </TabsList>

          <TabsContent value="protocol" className="space-y-6 w-full">
            <div className="w-full max-w-none"> {/* Убираем ограничения ширины */}
              <ProtocolForm 
                onProtocolSave={handleProtocolSave} 
                editingProtocol={editingProtocol}
              />
            </div>
          </TabsContent>

          {/* HIDDEN: Контент чек-листов временно скрыт - для восстановления раскомментируйте следующий блок */}
          {/* 
          <TabsContent value="checklists" className="space-y-6">
            {/* Level Selector */}
            {/* 
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
                {/* 
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
                {/* 
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
                        items={checklist.items.map(item => {
                          const stateKey = `${checklist.id}-${item.id}`;
                          return {
                            id: item.id,
                            text: item.text,
                            completed: checklistStates[stateKey] || item.isCompleted,
                            required: item.isRequired
                          };
                        })}
                        onItemToggle={(itemId) => handleItemToggle(checklist.id, itemId)}
                        variant="primary"
                        level={selectedLevel}
                      />
                    ))
                  )}
                </div>
              </div>
            )}
          </TabsContent>
          */}


          <TabsContent value="list" className="space-y-6">
                <PPKList 
                  onNewProtocol={() => {
                    setEditingProtocol(null);
                    setActiveTab("protocol");
                  }} 
                  onEditProtocol={(protocol) => {
                    setEditingProtocol(protocol);
                    setActiveTab("protocol");
                  }}
                />
          </TabsContent>

          <TabsContent value="dashboard" className="space-y-6">
            <Dashboard />
          </TabsContent>

          <TabsContent value="instructions" className="space-y-6">
            <InstructionsSection />
          </TabsContent>

          <TabsContent value="administration" className="space-y-6">
            <Administration />
          </TabsContent>
        </Tabs>
      </div>
      
      <Footer activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;
