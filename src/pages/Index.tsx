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
import { LogOut, User } from "lucide-react";
import { AdminViewSwitcher, ViewMode } from "@/components/AdminViewSwitcher";
import { AdminTestDataBanner } from "@/components/AdminTestDataBanner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NotificationsDialog } from "@/components/NotificationsDialog";
import { TestModeDialog } from "@/components/TestModeDialog";
import { TrialPeriodIndicator } from "@/components/TrialPeriodIndicator";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";
import { useSubscriptionAccess } from "@/hooks/useSubscriptionAccess";
import { useOrganizationSubscription } from "@/hooks/useOrganizationSubscription";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Building2 } from "lucide-react";
// Lazy load heavy components for better FCP
const InstructionsSection = lazy(() => import("@/components/InstructionsSection").then(m => ({ default: m.InstructionsSection })));
const ProtocolForm = lazy(() => import("@/components/ProtocolForm").then(m => ({ default: m.ProtocolForm })));
const PPKList = lazy(() => import("@/components/PPKList").then(m => ({ default: m.PPKList })));
const Dashboard = lazy(() => import("@/components/Dashboard").then(m => ({ default: m.Dashboard })));
const Administration = lazy(() => import("@/components/Administration").then(m => ({ default: m.Administration })));
const ScheduleModule = lazy(() => import("@/components/ScheduleModule").then(m => ({ default: m.ScheduleModule })));
const OrganizationModule = lazy(() => import("@/components/OrganizationModule").then(m => ({ default: m.OrganizationModule })));
const ChildCardSection = lazy(() => import("@/components/ChildCardSection").then(m => ({ default: m.ChildCardSection })));
const SpecialistPublicProfilePanel = lazy(() => import("@/components/SpecialistPublicProfilePanel").then(m => ({ default: m.SpecialistPublicProfilePanel })));
const SpecialistPaymentSettingsPanel = lazy(() => import("@/components/SpecialistPaymentSettingsPanel").then(m => ({ default: m.SpecialistPaymentSettingsPanel })));
const SpecialistFinancePanel = lazy(() => import("@/components/SpecialistFinancePanel").then(m => ({ default: m.SpecialistFinancePanel })));
const AdminFinanceStatisticsPanel = lazy(() => import("@/components/AdminFinanceStatisticsPanel").then(m => ({ default: m.AdminFinanceStatisticsPanel })));
const InstallPrompt = lazy(() => import("@/components/InstallPrompt"));

const Index = () => {
  const navigate = useNavigate();
  const [selectedLevel, setSelectedLevel] = useState<EducationLevel>("elementary");
  const [activeTab, setActiveTab] = useState("protocol");
  const [checklistStates, setChecklistStates] = useState<Record<string, boolean>>({});
  const [editingProtocol, setEditingProtocol] = useState<any>(null);
  const [adminViewMode, setAdminViewMode] = useState<ViewMode>("specialist");
  const { toast } = useToast();
  const { user, loading, isAdmin, signOut, profile, hasAccessRequest, roles } = useAuth();
  const isDirector = roles.some(r => r.role === "director");
  const isOrgAdmin = roles.some(r => r.role === "organization_admin");
  const isPrivateSpecialist = roles.some(r => r.role === "private_specialist");
  const { checklists, loading: checklistLoading, error } = useChecklistData();
  const subscriptionAccess = useSubscriptionAccess();
  const { hasOrganizationSubscription } = useOrganizationSubscription();
  
  // Check if user has org_view permission
  const { data: employeePermissions } = useQuery({
    queryKey: ["my-org-permissions", user?.id, profile?.organization_id],
    queryFn: async () => {
      if (!user || !profile?.organization_id) return null;
      
      const { data, error } = await supabase
        .from("employee_permissions")
        .select("org_view")
        .eq("user_id", user.id)
        .eq("organization_id", profile.organization_id)
        .maybeSingle();
      
      if (error) return null;
      return data;
    },
    enabled: !!user && !!profile?.organization_id,
  });
  
  // Check organization publishing settings for publication access
  const { data: organizationSettings } = useQuery({
    queryKey: ["index-org-publishing", profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return null;
      
      const { data, error } = await supabase
        .from("organizations")
        .select("is_published, allow_employee_publishing")
        .eq("id", profile.organization_id)
        .single();

      if (error) return null;
      return data;
    },
    enabled: !!profile?.organization_id,
  });

  const hasOrganizationAccess = hasOrganizationSubscription || employeePermissions?.org_view || false;
  
  // Check if user can access publication section
  // Private specialists and users without organization can always access
  // Organization employees need allow_employee_publishing permission
  const canAccessPublication = isPrivateSpecialist || 
    !profile?.organization_id || 
    organizationSettings?.allow_employee_publishing === true;
  
  // Автоматический таймаут сессии 15 минут
  useSessionTimeout();

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

  const handleNewProtocol = () => {
    if (!isAdmin && !subscriptionAccess.canCreateProtocols) {
      toast({
        title: "Доступ ограничен",
        description: subscriptionAccess.isTrialActive 
          ? "Пробный период активен, но истекает. Оформите подписку."
          : "Пробный период истек. Оформите подписку для создания протоколов.",
        variant: "destructive"
      });
      navigate("/profile");
      return;
    }
    setEditingProtocol(null);
    setActiveTab("protocol");
  };

  const renderTabContent = () => {
    const loadingFallback = <div className="flex items-center justify-center p-8">Загрузка...</div>;
    
    switch (activeTab) {
      case "protocol":
      case "list":
        // Private specialists cannot access PPK module
        if (isPrivateSpecialist) {
          return (
            <div className="text-center p-8">
              <p className="text-muted-foreground">Раздел ППК недоступен для частной практики.</p>
              <p className="text-sm text-muted-foreground mt-2">Данный модуль предназначен для работы в составе организации.</p>
            </div>
          );
        }
        return activeTab === "protocol" ? (
          <Suspense fallback={loadingFallback}>
            <ProtocolForm 
              onProtocolSave={handleProtocolSave} 
              editingProtocol={editingProtocol}
            />
          </Suspense>
        ) : (
          <Suspense fallback={loadingFallback}>
            <PPKList 
              onNewProtocol={handleNewProtocol}
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
      case "child-card":
        return (
          <Suspense fallback={loadingFallback}>
            <ChildCardSection />
          </Suspense>
        );
      case "instructions-ppk":
      case "instructions-schedule":
      case "instructions-organization":
      case "instructions-legal":
      case "instructions-business-processes":
      case "instructions-private-practice":
        return (
          <Suspense fallback={loadingFallback}>
            <InstructionsSection activeSubTab={activeTab.replace("instructions-", "")} />
          </Suspense>
        );
      case "administration-access-requests":
      case "administration-users":
      case "administration-organizations":
      case "administration-checklist":
      case "administration-instructions":
      case "administration-statistics":
      case "administration-school-years":
      case "administration-email-logs":
      case "administration-auth-logs":
      case "administration-error-logs":
      case "administration-change-history":
      case "administration-subscriptions":
      case "administration-payment-logs":
      case "administration-commercial-offers":
      case "administration-analytics":
      case "administration-site-analytics":
      case "administration-system-health":
      case "administration-positions-roles":
      case "administration-schedule":
      case "administration-workload-report":
      case "administration-session-notifications":
      case "administration-org-admins":
      case "administration-parent-tests":
      case "administration-parent-children":
        return isAdmin ? (
          <Suspense fallback={loadingFallback}>
            <Administration activeSubTab={activeTab.replace("administration-", "")} />
          </Suspense>
        ) : (
          <div className="text-center p-8">
            <p className="text-muted-foreground">У вас нет доступа к этому разделу</p>
          </div>
        );
      case "administration-finance-stats":
        return isAdmin ? (
          <Suspense fallback={loadingFallback}>
            <AdminFinanceStatisticsPanel />
          </Suspense>
        ) : (
          <div className="text-center p-8">
            <p className="text-muted-foreground">У вас нет доступа к этому разделу</p>
          </div>
        );
      case "schedule-module":
      case "schedule-calendar":
      case "schedule-children":
      case "schedule-statistics":
      case "schedule-finance":
        return (
          <Suspense fallback={loadingFallback}>
            {activeTab === "schedule-finance" ? (
              <SpecialistFinancePanel />
            ) : (
              <ScheduleModule activeSubTab={activeTab.startsWith("schedule-") ? activeTab.replace("schedule-", "") : "calendar"} />
            )}
          </Suspense>
        );
      case "organization-module":
      case "organization-data":
      case "organization-employees":
      case "organization-access-requests":
      case "organization-schedule":
      case "organization-rates":
      case "organization-statistics":
      case "organization-kpi":
      case "organization-holidays":
      case "organization-holiday-requests":
      case "organization-settings":
        // Private specialists cannot access Organization module
        if (isPrivateSpecialist) {
          return (
            <div className="text-center p-8">
              <p className="text-muted-foreground">Раздел «Организация» недоступен для частной практики.</p>
              <p className="text-sm text-muted-foreground mt-2">Данный модуль предназначен для работы в составе организации.</p>
            </div>
          );
        }
        return (isOrgAdmin || isDirector || isAdmin || hasOrganizationAccess) ? (
          <Suspense fallback={loadingFallback}>
            <OrganizationModule activeSubTab={activeTab.startsWith("organization-") ? activeTab.replace("organization-", "") : "employees"} />
          </Suspense>
        ) : (
          <div className="text-center p-8">
            <p className="text-muted-foreground">У вас нет доступа к этому разделу</p>
          </div>
        );
      case "public-profile":
        return (
          <Suspense fallback={loadingFallback}>
            <SpecialistPublicProfilePanel />
          </Suspense>
        );
      case "payment-settings":
        return (
          <Suspense fallback={loadingFallback}>
            <SpecialistPaymentSettingsPanel />
          </Suspense>
        );
      default:
        return null;
    }
  };

  return (
    <SidebarProvider>
      <TestModeDialog />
      <div className="flex min-h-screen w-full bg-gradient-to-br from-background via-background to-accent/5">
        {/* Header - fixed at top */}
        <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-16 items-center justify-between px-4 md:px-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <div className="hidden md:block">
                <h1 className="text-xl font-bold">universum.</h1>
                <TooltipProvider>
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="max-w-[200px] truncate cursor-help">
                          {profile?.full_name}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p>{profile?.full_name}</p>
                        <p className="text-xs text-muted-foreground">{profile?.positions?.name}</p>
                      </TooltipContent>
                    </Tooltip>
                    
                    {profile?.organizations?.name && (
                      <>
                        <span className="text-muted-foreground/50">•</span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded bg-accent/50 cursor-help max-w-[180px] truncate">
                              <Building2 className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{profile.organizations.name}</span>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="max-w-xs">
                            <p className="font-medium">{profile.organizations.name}</p>
                          </TooltipContent>
                        </Tooltip>
                      </>
                    )}
                    
                    {roles.length > 0 && (
                      <>
                        <span className="text-muted-foreground/50">•</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded whitespace-nowrap ${
                          isAdmin ? "bg-destructive/10 text-destructive" :
                          isDirector ? "bg-orange-500/10 text-orange-600 dark:text-orange-400" :
                          isOrgAdmin ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" :
                          "bg-muted text-muted-foreground"
                        }`}>
                          {isAdmin ? "Админ" :
                           isDirector ? "Рук-ль" :
                           isOrgAdmin ? "Орг-админ" :
                           roles.some(r => r.role === "regional_operator") ? "Рег. оп." :
                           "Спец."}
                        </span>
                      </>
                    )}
                  </div>
                </TooltipProvider>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <TrialPeriodIndicator />
              
              {/* Admin view mode switcher */}
              {isAdmin && (
                <AdminViewSwitcher 
                  currentView={adminViewMode} 
                  onViewChange={setAdminViewMode}
                />
              )}
              
              <div className="h-8 w-px bg-border hidden lg:block" />
              <div className="flex items-center gap-2">
                <MobileMenu activeTab={activeTab} onTabChange={setActiveTab} isAdmin={isAdmin} canAccessPublication={canAccessPublication} />
                <NotificationsDialog onNavigate={setActiveTab} />
                <button
                  onClick={() => navigate("/profile")}
                  className="flex items-center gap-2 p-2 hover:bg-accent rounded-md transition-colors"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.avatar_url || ""} />
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                </button>
                <ThemeToggle />
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Выход</span>
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Sidebar - positioned below header with top padding - hidden on mobile */}
        <div className="hidden md:block">
          <AppSidebar 
            activeTab={activeTab} 
            onTabChange={setActiveTab} 
            isAdmin={isAdmin}
            isOrgAdmin={isOrgAdmin}
            isDirector={isDirector}
            hasOrganizationAccess={hasOrganizationAccess}
            isPrivateSpecialist={isPrivateSpecialist}
          />
        </div>
        
        {/* Main content */}
        <main className="flex-1 w-full pt-16">
          <div className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
            {renderTabContent()}
          </div>

          <Footer activeTab={activeTab} onTabChange={setActiveTab} />
        </main>
        
        {/* PWA Install Prompt */}
        <Suspense fallback={null}>
          <InstallPrompt />
        </Suspense>
        
        {/* Admin test mode banner */}
        {isAdmin && (
          <AdminTestDataBanner 
            viewMode={adminViewMode} 
            onReset={() => setAdminViewMode("specialist")} 
          />
        )}
      </div>
    </SidebarProvider>
  );
};

export default Index;