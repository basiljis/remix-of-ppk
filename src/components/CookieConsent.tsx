import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { Link } from "react-router-dom";

const COOKIE_CONSENT_KEY = "cookie-consent-accepted";

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Небольшая задержка для плавного появления
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "true");
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "false");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom-4 duration-300">
      <div className="container mx-auto max-w-4xl">
        <div className="relative bg-background border rounded-lg shadow-lg p-4 md:p-6">
          <button
            onClick={handleDecline}
            className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Закрыть"
          >
            <X className="h-4 w-4" />
          </button>
          
          <div className="flex flex-col md:flex-row md:items-center gap-4 pr-6">
            <div className="flex-1 space-y-2">
              <p className="text-sm font-medium">
                🍪 Мы используем файлы cookie
              </p>
              <p className="text-sm text-muted-foreground">
                Продолжая использовать сайт, вы соглашаетесь на сбор и обработку cookies и других данных 
                в соответствии с{" "}
                <Link 
                  to="/privacy-policy" 
                  className="text-primary hover:underline"
                >
                  Политикой конфиденциальности
                </Link>
                . Это помогает нам улучшать работу сайта.
              </p>
            </div>
            
            <div className="flex gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDecline}
              >
                Отклонить
              </Button>
              <Button
                size="sm"
                onClick={handleAccept}
              >
                Принять
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
