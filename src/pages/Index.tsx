import { useState, useEffect, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { ChecklistCard } from "@/components/ChecklistCard";
import { EducationLevelSelector, EducationLevel } from "@/components/EducationLevelSelector";
import { MobileMenu } from "@/components/MobileMenu";
import { Footer } from "@/components/Footer";
import { useChecklistData } from "@/hooks/useChecklistData";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

// Lazy load heavy components for better FCP
const InstructionsSection = lazy(() => import("@/components/InstructionsSection").then(m => ({ default: m.InstructionsSection })));
const ProtocolForm = lazy(() => import("@/components/ProtocolForm").then(m => ({ default: m.ProtocolForm })));
const PPKList = lazy(() => import("@/components/PPKList").then(m => ({ default: m.PPKList })));
const Dashboard = lazy(() => import("@/components/Dashboard").then(m => ({ default: m.Dashboard })));
const Administration = lazy(() => import("@/components/Administration").then(m => ({ default: m.Administration })));

const Index = () => {
  const navigate = useNavigate();
  const [selectedLevel, setSelectedLevel] = useState<EducationLevel>("elementary");
  const [activeTab, setActiveTab] = useState("protocol");
  const [checklistStates, setChecklistStates] = useState<Record<string, boolean>>({});
  const [editingProtocol, setEditingProtocol] = useState<any>(null);
  const { toast } = useToast();
  const { user, loading, isAdmin, signOut, profile, hasAccessRequest } = useAuth();
  const { checklists, loading: checklistLoading, error } = useChecklistData();

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  // If user has pending access request, route to status page
  useEffect(() => {
    if (!loading && user && hasAccessRequest && !profile) {
      navigate("/access-status");
    }
  }, [loading, user, hasAccessRequest, profile, navigate]);

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

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/auth");
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        title: "Ошибка выхода",
        description: "Не удалось выйти из системы",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p>Загрузка...</p>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  const renderTabContent = () => {
    const loadingFallback = <div className="flex items-center justify-center p-8">Загрузка...</div>;
    
    switch (activeTab) {
      case "protocol":
        return (
          <Suspense fallback={loadingFallback}>
            <ProtocolForm 
              onProtocolSave={handleProtocolSave} 
              editingProtocol={editingProtocol}
            />
          </Suspense>
        );
      case "list":
        return (
          <Suspense fallback={loadingFallback}>
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
          </Suspense>
        );
      case "dashboard":
        return (
          <Suspense fallback={loadingFallback}>
            <Dashboard />
          </Suspense>
        );
      case "instructions":
        return (
          <Suspense fallback={loadingFallback}>
            <InstructionsSection />
          </Suspense>
        );
      case "administration":
        return isAdmin ? (
          <Suspense fallback={loadingFallback}>
            <Administration />
          </Suspense>
        ) : (
          <div className="text-center p-8">
            <p className="text-muted-foreground">У вас нет доступа к этому разделу</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-gradient-to-br from-background via-background to-accent/5">
        <AppSidebar 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
          isAdmin={isAdmin}
          onNavigateToProfile={() => navigate("/profile")}
        />
        
        <main className="flex-1 w-full">
          <div className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto">
              <div className="flex h-16 items-center justify-between px-4">
                <div className="flex items-center gap-4">
                  <SidebarTrigger />
                  <div className="hidden md:block">
                    <h1 className="text-lg font-semibold">Система Протоколов ППК</h1>
                    <p className="text-sm text-muted-foreground">
                      {profile?.full_name} - {profile?.positions?.name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MobileMenu activeTab={activeTab} onTabChange={setActiveTab} isAdmin={isAdmin} />
                  <ThemeToggle />
                  <Button variant="outline" size="sm" onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Выход</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
            {renderTabContent()}
          </div>

          <Footer activeTab={activeTab} onTabChange={setActiveTab} />
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Index;