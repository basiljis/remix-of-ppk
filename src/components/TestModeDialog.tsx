import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Sparkles, Calendar, CreditCard } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export const TestModeDialog = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Проверяем, показывали ли уже это окно в текущей сессии
    const hasSeenDialog = sessionStorage.getItem('hasSeenTestModeDialog');
    if (!hasSeenDialog) {
      setOpen(true);
      sessionStorage.setItem('hasSeenTestModeDialog', 'true');
    }
  }, []);

  const handleSubscribe = () => {
    setOpen(false);
    navigate('/profile');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="bg-primary p-4 rounded-full">
              <Sparkles className="h-10 w-10 text-primary-foreground" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl font-bold">
            Добро пожаловать в АИС ППК!
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            Вы получили доступ к пробному периоду
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="bg-muted/50 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Пробный период до:</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('ru-RU')}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-primary">7</p>
              <p className="text-xs text-muted-foreground">дней</p>
            </div>
          </div>

          <div>
            <p className="font-semibold mb-3">Что вы можете делать:</p>
            <div className="space-y-2.5">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                <p className="text-sm">Создавать неограниченное количество протоколов</p>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                <p className="text-sm">Использовать структурированные чек-листы оценки</p>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                <p className="text-sm">Получать автоматические заключения и рекомендации</p>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                <p className="text-sm">Использовать все функции платформы</p>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="h-4 w-4 text-primary" />
              <p className="font-semibold">Стоимость подписки после пробного периода:</p>
            </div>
            
            <div className="space-y-3">
              <div className="bg-muted/50 rounded-lg p-4 border border-border">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">Месячная подписка</p>
                    <p className="text-xs text-muted-foreground">Ежемесячная оплата</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">2 500 ₽</p>
                  </div>
                </div>
              </div>

              <div className="bg-primary/10 rounded-lg p-4 border-2 border-primary">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">Годовая подписка</p>
                    <p className="text-xs text-muted-foreground">Экономия 15%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">25 500 ₽</p>
                    <p className="text-xs text-muted-foreground line-through">30 000 ₽</p>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-xs text-center text-muted-foreground mt-3">
              Вы сможете оформить подписку в любое время в разделе &quot;Подписка&quot;
            </p>
          </div>
        </div>

        <Button className="w-full" size="lg" onClick={() => setOpen(false)}>
          Начать работу
        </Button>
      </DialogContent>
    </Dialog>
  );
};
