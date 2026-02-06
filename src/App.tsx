import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OfflineProvider } from "@/contexts/OfflineContext";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
// Preloader MUST be imported synchronously to avoid infinite loading state
import Preloader from "@/components/Preloader";

// Lazy load route components for better FCP
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const ParentAuth = lazy(() => import("./pages/ParentAuth"));
const ParentDashboard = lazy(() => import("./pages/ParentDashboard"));
const ParentMaterials = lazy(() => import("./pages/ParentMaterials"));
const ChildPlayground = lazy(() => import("./pages/ChildPlayground"));
const ChildWorkspace = lazy(() => import("./pages/ChildWorkspace"));
const ChildLogin = lazy(() => import("./pages/ChildLogin"));
const Profile = lazy(() => import("./pages/Profile"));
const ChildProfile = lazy(() => import("./pages/ChildProfile"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Install = lazy(() => import("./pages/Install"));
const Landing = lazy(() => import("./pages/Landing"));
const ForOrganizations = lazy(() => import("./pages/ForOrganizations"));
const ForSpecialists = lazy(() => import("./pages/ForSpecialists"));
const ForParents = lazy(() => import("./pages/ForParents"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const PartnershipOffer = lazy(() => import("./pages/PartnershipOffer"));
const AccessRequestStatus = lazy(() => import("@/components/AccessRequestStatus").then(m => ({ default: m.AccessRequestStatus })));
const RootGate = lazy(() => import("./pages/RootGate").then(m => ({ default: m.default })));
const OfflineIndicator = lazy(() => import("@/components/OfflineIndicator"));
const PublicSpecialists = lazy(() => import("./pages/PublicSpecialists"));
const PublicOrganizations = lazy(() => import("./pages/PublicOrganizations"));
const SpecialistDetail = lazy(() => import("./pages/SpecialistDetail"));

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary componentName="App">
    <QueryClientProvider client={queryClient}>
      <OfflineProvider>
        <Suspense fallback={<Preloader />}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <OfflineIndicator />
              <BrowserRouter>
                <a 
                  href="#main-content" 
                  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  Перейти к основному контенту
                </a>
                <main id="main-content" className="flex-1">
                  <Suspense fallback={<Preloader />}>
                    <Routes>
                      <Route path="/" element={<RootGate />} />
                      <Route path="/landing" element={<Landing />} />
                      <Route path="/for-organizations" element={<ForOrganizations />} />
                      <Route path="/for-specialists" element={<ForSpecialists />} />
                      <Route path="/for-parents" element={<ForParents />} />
                      <Route path="/specialists" element={<PublicSpecialists />} />
                      <Route path="/organizations" element={<PublicOrganizations />} />
                      <Route path="/s/:slug" element={<SpecialistDetail />} />
                      <Route path="/o/:slug" element={<PublicOrganizations />} />
                      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                      <Route path="/partnership-offer" element={<PartnershipOffer />} />
                      <Route path="/app" element={<Index />} />
                      <Route path="/auth" element={<Auth />} />
                      <Route path="/parent-auth" element={<ParentAuth />} />
                      <Route path="/parent" element={<ParentDashboard />} />
                      <Route path="/parent/materials" element={<ParentMaterials />} />
                      <Route path="/child-playground" element={<ChildPlayground />} />
                      <Route path="/child-workspace" element={<ChildWorkspace />} />
                      <Route path="/child-login" element={<ChildLogin />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="/child-profile" element={<ChildProfile />} />
                      <Route path="/reset-password" element={<ResetPassword />} />
                      <Route path="/install" element={<Install />} />
                      <Route path="/access-status" element={<AccessRequestStatus />} />
                      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </main>
              </BrowserRouter>
            </TooltipProvider>
          </ThemeProvider>
        </Suspense>
      </OfflineProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
