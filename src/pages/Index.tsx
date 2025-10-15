import { useState } from "react";
import { ChecklistCard } from "@/components/ChecklistCard";
import { EducationLevelSelector, EducationLevel } from "@/components/EducationLevelSelector";
import { InstructionsSection } from "@/components/InstructionsSection";
import { ProtocolForm } from "@/components/ProtocolForm";
import { PPKList } from "@/components/PPKList";
import { Dashboard } from "@/components/Dashboard";
import { MobileMenu } from "@/components/MobileMenu";
import { Footer } from "@/components/Footer";
import { useChecklistData } from "@/hooks/useChecklistData";
import { useToast } from "@/hooks/use-toast";
import { Administration } from "@/components/Administration";
import { UserProfile } from "@/components/UserProfile";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

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

  const renderTabContent = () => {
    switch (activeTab) {
      case "protocol":
        return (
          <ProtocolForm 
            onProtocolSave={handleProtocolSave} 
            editingProtocol={editingProtocol}
          />
        );
      case "list":
        return (
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
        );
      case "dashboard":
        return <Dashboard />;
      case "instructions":
        return <InstructionsSection />;
      case "profile":
        return <UserProfile />;
      case "administration":
        return <Administration />;
      case "checklists":
        return (
          <div className="space-y-6">
            {currentChecklists.map((checklist) => (
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
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex justify-between items-center h-16 px-6">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <div className="md:hidden">
                  <MobileMenu activeTab={activeTab} onTabChange={setActiveTab} />
                </div>
                <h1 className="text-xl font-semibold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  Система автоматизации ППк
                </h1>
              </div>
              <div className="flex items-center gap-4">
                <ThemeToggle />
              </div>
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1 p-6 bg-gradient-to-br from-background via-secondary/20 to-background">
            <div className="max-w-7xl mx-auto w-full">
              {renderTabContent()}
            </div>
          </main>

          <Footer activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Index;
