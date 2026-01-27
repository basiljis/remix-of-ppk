import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Smartphone, Share, MoreVertical, Plus, Check, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const Install = () => {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Detect platform
    const userAgent = navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));
    setIsAndroid(/android/.test(userAgent));

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Назад
        </Button>

        <div className="text-center space-y-2">
          <Smartphone className="w-16 h-16 mx-auto text-primary" />
          <h1 className="text-3xl font-bold">Установите приложение</h1>
          <p className="text-muted-foreground">
            Добавьте universum на домашний экран для быстрого доступа
          </p>
        </div>

        {isInstalled ? (
          <Card className="border-success bg-success/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 text-success-foreground">
                <Check className="w-6 h-6" />
                <span className="font-medium">Приложение уже установлено!</span>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Native install button for supported browsers */}
            {deferredPrompt && (
              <Card className="border-primary">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="w-5 h-5" />
                    Быстрая установка
                  </CardTitle>
                  <CardDescription>
                    Нажмите кнопку ниже для моментальной установки
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={handleInstallClick} className="w-full" size="lg">
                    <Download className="w-4 h-4 mr-2" />
                    Установить приложение
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* iOS instructions */}
            {isIOS && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Share className="w-5 h-5" />
                    Инструкция для iPhone/iPad
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                      1
                    </div>
                    <div>
                      <p className="font-medium">Откройте Safari</p>
                      <p className="text-sm text-muted-foreground">
                        Эта функция работает только в браузере Safari
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                      2
                    </div>
                    <div>
                      <p className="font-medium">Нажмите кнопку «Поделиться»</p>
                      <p className="text-sm text-muted-foreground">
                        Иконка <Share className="w-4 h-4 inline" /> внизу экрана
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                      3
                    </div>
                    <div>
                      <p className="font-medium">Выберите «На экран Домой»</p>
                      <p className="text-sm text-muted-foreground">
                        Прокрутите меню вниз и найдите пункт <Plus className="w-4 h-4 inline" /> «На экран Домой»
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                      4
                    </div>
                    <div>
                      <p className="font-medium">Подтвердите установку</p>
                      <p className="text-sm text-muted-foreground">
                        Нажмите «Добавить» в правом верхнем углу
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Android instructions */}
            {isAndroid && !deferredPrompt && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MoreVertical className="w-5 h-5" />
                    Инструкция для Android
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                      1
                    </div>
                    <div>
                      <p className="font-medium">Откройте меню браузера</p>
                      <p className="text-sm text-muted-foreground">
                        Нажмите <MoreVertical className="w-4 h-4 inline" /> в правом верхнем углу Chrome
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                      2
                    </div>
                    <div>
                      <p className="font-medium">Выберите «Установить приложение»</p>
                      <p className="text-sm text-muted-foreground">
                        Или «Добавить на главный экран»
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                      3
                    </div>
                    <div>
                      <p className="font-medium">Подтвердите установку</p>
                      <p className="text-sm text-muted-foreground">
                        Нажмите «Установить» в появившемся окне
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Desktop instructions */}
            {!isIOS && !isAndroid && !deferredPrompt && (
              <Card>
                <CardHeader>
                  <CardTitle>Инструкция для компьютера</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                      1
                    </div>
                    <div>
                      <p className="font-medium">Найдите иконку установки</p>
                      <p className="text-sm text-muted-foreground">
                        В адресной строке браузера справа появится иконка <Download className="w-4 h-4 inline" />
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                      2
                    </div>
                    <div>
                      <p className="font-medium">Нажмите «Установить»</p>
                      <p className="text-sm text-muted-foreground">
                        Подтвердите установку в появившемся окне
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Benefits */}
        <Card>
          <CardHeader>
            <CardTitle>Преимущества установки</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-primary" />
                <span>Быстрый доступ с домашнего экрана</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-primary" />
                <span>Работа без интернета (офлайн-режим)</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-primary" />
                <span>Полноэкранный режим без адресной строки</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-primary" />
                <span>Автоматические обновления</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Install;
