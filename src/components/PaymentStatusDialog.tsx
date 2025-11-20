import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

export const PaymentStatusDialog = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"success" | "error" | null>(null);

  useEffect(() => {
    const paymentStatus = searchParams.get("payment");
    if (paymentStatus === "success") {
      setStatus("success");
      setOpen(true);
    } else if (paymentStatus === "error") {
      setStatus("error");
      setOpen(true);
    }
  }, [searchParams]);

  const handleClose = () => {
    setOpen(false);
    // Удаляем параметр из URL
    searchParams.delete("payment");
    navigate({ search: searchParams.toString() }, { replace: true });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            {status === "success" ? (
              <div className="bg-green-100 dark:bg-green-900/20 p-3 rounded-full">
                <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
              </div>
            ) : status === "error" ? (
              <div className="bg-red-100 dark:bg-red-900/20 p-3 rounded-full">
                <XCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
              </div>
            ) : (
              <div className="bg-blue-100 dark:bg-blue-900/20 p-3 rounded-full">
                <Loader2 className="h-12 w-12 text-blue-600 dark:text-blue-400 animate-spin" />
              </div>
            )}
          </div>
          <DialogTitle className="text-center text-xl">
            {status === "success" ? "Платеж обрабатывается" : "Ошибка платежа"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {status === "success" ? (
              <>
                Мы получили ваш платеж и активируем подписку в течение нескольких минут. 
                Вы получите email-подтверждение после активации.
              </>
            ) : (
              <>
                К сожалению, платеж не был завершен. Попробуйте еще раз или 
                свяжитесь с технической поддержкой.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {status === "success" && (
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                <strong>Что дальше?</strong>
                <br />
                • Подписка будет активирована автоматически
                <br />
                • Вы получите подтверждение на email
                <br />
                • Можете начать пользоваться всеми функциями системы
              </p>
            </div>
          )}

          {status === "error" && (
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm text-red-900 dark:text-red-100">
                <strong>Возможные причины:</strong>
                <br />
                • Недостаточно средств на карте
                <br />
                • Отклонено банком
                <br />
                • Технический сбой при оплате
              </p>
            </div>
          )}
        </div>

        <Button onClick={handleClose} className="w-full">
          Понятно
        </Button>
      </DialogContent>
    </Dialog>
  );
};
