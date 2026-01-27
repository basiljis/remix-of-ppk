import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OfflineProvider } from "@/contexts/OfflineContext";

// Lazy load UI components to reduce initial bundle
const Toaster = lazy(() => import("@/components/ui/toaster").then(m => ({ default: m.Toaster })));
const Sonner = lazy(() => import("@/components/ui/sonner").then(m => ({ default: m.Toaster })));
const TooltipProvider = lazy(() => import("@/components/ui/tooltip").then(m => ({ default: m.TooltipProvider })));
const ThemeProvider = lazy(() => import("@/components/ui/theme-provider").then(m => ({ default: m.ThemeProvider })));

// Lazy load route components for better FCP
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Profile = lazy(() => import("./pages/Profile"));
const ChildProfile = lazy(() => import("./pages/ChildProfile"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Install = lazy(() => import("./pages/Install"));
const AccessRequestStatus = lazy(() => import("@/components/AccessRequestStatus").then(m => ({ default: m.AccessRequestStatus })));
const RootGate = lazy(() => import("./pages/RootGate").then(m => ({ default: m.default })));
const Preloader = lazy(() => import("@/components/Preloader"));
const OfflineIndicator = lazy(() => import("@/components/OfflineIndicator"));

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
                      <Route path="/app" element={<Index />} />
                      <Route path="/auth" element={<Auth />} />
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
