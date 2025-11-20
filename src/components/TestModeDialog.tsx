import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Gift } from "lucide-react";
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <Gift className="h-8 w-8 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center text-xl">
            Добро пожаловать в тестовый режим!
          </DialogTitle>
          <DialogDescription className="text-center">
            Все возможности системы доступны бесплатно
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Безлимитное создание протоколов</p>
                <p className="text-xs text-muted-foreground">Без ограничений по количеству</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Структурированная оценка развития</p>
                <p className="text-xs text-muted-foreground">По чек-листам ППК</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Автоматические заключения</p>
                <p className="text-xs text-muted-foreground">На основе заполненных данных</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Экспорт в PDF и Excel</p>
                <p className="text-xs text-muted-foreground">Удобные отчеты для документооборота</p>
              </div>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Тестовый режим действует без ограничений по времени
            </p>
            <p className="text-xs text-muted-foreground">
              При необходимости можете оформить платную подписку для получения дополнительных возможностей
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>
            Продолжить
          </Button>
          <Button className="flex-1" onClick={handleSubscribe}>
            Оформить подписку
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
