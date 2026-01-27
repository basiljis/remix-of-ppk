import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, X, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already shown in this session or dismissed permanently
    const dismissed = localStorage.getItem("pwa-install-dismissed");
    const lastShown = sessionStorage.getItem("pwa-install-shown");
    
    if (dismissed || lastShown) {
      return;
    }

    // Check if running in standalone mode (already installed)
    if (window.matchMedia("(display-mode: standalone)").matches) {
      return;
    }

    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // Show prompt after a short delay for better UX
    const timer = setTimeout(() => {
      if (isIOSDevice) {
        setShowPrompt(true);
        sessionStorage.setItem("pwa-install-shown", "true");
      }
    }, 3000);

    // Listen for beforeinstallprompt event (Chrome, Edge, etc.)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => {
        setShowPrompt(true);
        sessionStorage.setItem("pwa-install-shown", "true");
      }, 3000);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === "accepted") {
        setShowPrompt(false);
        localStorage.setItem("pwa-install-dismissed", "true");
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem("pwa-install-shown", "true");
  };

  const handleDismissPermanently = () => {
    setShowPrompt(false);
    localStorage.setItem("pwa-install-dismissed", "true");
  };

  if (!showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-fade-in">
      <Card className="shadow-lg border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Smartphone className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-medium text-sm">Установите приложение</h3>
                <button 
                  onClick={handleDismiss}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Закрыть"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {isIOS 
                  ? "Нажмите «Поделиться» → «На экран Домой» для быстрого доступа"
                  : "Добавьте universum на главный экран для быстрого доступа"
                }
              </p>
              <div className="flex items-center gap-2 mt-3">
                {!isIOS && deferredPrompt && (
                  <Button size="sm" onClick={handleInstall} className="gap-1.5">
                    <Download className="h-3.5 w-3.5" />
                    Установить
                  </Button>
                )}
                {isIOS && (
                  <Button size="sm" variant="outline" asChild>
                    <a href="/install">Подробнее</a>
                  </Button>
                )}
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={handleDismissPermanently}
                  className="text-xs"
                >
                  Больше не показывать
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InstallPrompt;
