import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Info, Users, TrendingUp, BookOpen, Shield, HeartHandshake } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";

export const ParentSystemInfoDialog = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Info className="mr-2 h-4 w-4" />
          О платформе для родителей
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-xl">universum.</DialogTitle>
          <DialogDescription className="text-sm">
            Развитие. Для каждого
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-4 text-sm">
            <section>
              <h3 className="font-semibold text-base mb-2">Для чего нужна платформа</h3>
              <p className="text-muted-foreground mb-3">
                universum. — платформа комплексной поддержки развития детей, объединяющая родителей и специалистов 
                образовательных организаций для эффективного взаимодействия.
              </p>
              <div className="space-y-2 text-muted-foreground">
                <div className="border-l-2 border-primary pl-3">
                  <strong className="text-foreground">Единое пространство</strong>
                  <p className="mt-1">Удобный доступ к информации о развитии вашего ребёнка и взаимодействие со специалистами.</p>
                </div>
                <div className="border-l-2 border-primary pl-3">
                  <strong className="text-foreground">Рекомендации специалистов</strong>
                  <p className="mt-1">Получайте персонализированные рекомендации от педагогов-психологов, логопедов и дефектологов.</p>
                </div>
              </div>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">Возможности для родителей</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Card className="bg-muted/50 border-muted">
                  <CardContent className="p-3 flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <Users className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-foreground">Профиль ребёнка</h4>
                      <p className="text-xs text-muted-foreground">Регистрация детей с присвоением уникального идентификатора для взаимодействия со специалистами</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-muted/50 border-muted">
                  <CardContent className="p-3 flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-green-500/10 text-green-500">
                      <TrendingUp className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-foreground">Отслеживание прогресса</h4>
                      <p className="text-xs text-muted-foreground">Наблюдайте за динамикой развития ребёнка</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-muted/50 border-muted">
                  <CardContent className="p-3 flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                      <BookOpen className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-foreground">Материалы по возрасту</h4>
                      <p className="text-xs text-muted-foreground">Доступ к рекомендациям и материалам, подобранным для возраста вашего ребёнка</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-muted/50 border-muted">
                  <CardContent className="p-3 flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
                      <HeartHandshake className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-foreground">Связь со специалистами</h4>
                      <p className="text-xs text-muted-foreground">Упрощённое взаимодействие с педагогами-психологами и другими специалистами</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">Как начать работу</h3>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                <li>Зарегистрируйтесь на платформе, указав ваши контактные данные</li>
                <li>Добавьте информацию о ребёнке в личном кабинете</li>
                <li>Получите уникальный идентификатор ребёнка для взаимодействия со специалистами</li>
                <li>При обращении к специалисту сообщите идентификатор для быстрого доступа к профилю</li>
              </ol>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">Уникальный идентификатор ребёнка</h3>
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  При добавлении ребёнка в систему ему автоматически присваивается уникальный идентификатор 
                  (например, <span className="font-mono font-semibold">PC-2024-000001</span>). 
                  Этот номер может понадобиться при обращении к специалисту образовательной организации 
                  для быстрой идентификации профиля ребёнка.
                </p>
              </div>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">Безопасность данных</h3>
              <div className="flex items-start gap-3 text-muted-foreground">
                <div className="p-2 rounded-lg bg-green-500/10 text-green-500 mt-0.5">
                  <Shield className="h-4 w-4" />
                </div>
                <div>
                  <p>
                    Все персональные данные надёжно защищены в соответствии с требованиями 
                    Федерального закона № 152-ФЗ «О персональных данных». Доступ к информации о вашем ребёнке 
                    предоставляется только авторизованным специалистам образовательных организаций.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">Техническая поддержка</h3>
              <p className="text-muted-foreground">
                При возникновении вопросов или технических проблем обращайтесь в службу поддержки 
                через форму обратной связи в личном кабинете.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">Информация о разработчике</h3>
              <div className="space-y-1 text-muted-foreground bg-muted/50 p-4 rounded-lg">
                <div><strong className="text-foreground">ИП Загладин В.С.</strong></div>
                <div>ИНН: 770702169499</div>
                <div>ОГРНИП: 323774600132891</div>
              </div>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
