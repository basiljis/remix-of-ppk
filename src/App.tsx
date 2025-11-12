import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

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
const AccessRequestStatus = lazy(() => import("@/components/AccessRequestStatus").then(m => ({ default: m.AccessRequestStatus })));
const RootGate = lazy(() => import("./pages/RootGate").then(m => ({ default: m.default })));
const Preloader = lazy(() => import("@/components/Preloader"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <Suspense fallback={<Preloader />}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<Preloader />}>
              <Routes>
                <Route path="/" element={<RootGate />} />
                <Route path="/app" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/child-profile" element={<ChildProfile />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/access-status" element={<AccessRequestStatus />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </Suspense>
  </QueryClientProvider>
);

export default App;
