import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HelpCircle, Mail, Clock, MessageCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export const SupportDialog = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <HelpCircle className="mr-2 h-4 w-4" />
          Поддержка
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Поддержка</DialogTitle>
          <DialogDescription>
            Мы всегда готовы помочь вам
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6 text-sm">
            <section>
              <p className="text-muted-foreground mb-4">
                Если у вас возникли вопросы, наша команда готова помочь!<br />
                Напишите нам — мы ответим в течение 24 часов.
              </p>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <Mail className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-foreground">Email</div>
                    <a href="mailto:info@profilaktika.site" className="text-primary hover:underline">
                      info@profilaktika.site
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <Clock className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-foreground">Режим работы</div>
                    <div className="text-muted-foreground">Пн–Пт, с 10:00 до 18:00 по МСК</div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <MessageCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-foreground">Онлайн-чат</div>
                    <div className="text-muted-foreground">Вы также можете связаться с нами через чат, расположенный внизу страницы!</div>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-3">Мы помогаем с:</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Проблемами входа и авторизации</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Оплатой подписки</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Работой протоколов и отчётов</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Вопросами по конфиденциальности</span>
                </li>
              </ul>
            </section>

            <section className="pt-4 border-t">
              <p className="text-center text-muted-foreground italic">
                Благодарим, что используете universum.
              </p>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
