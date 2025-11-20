import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CommercialOfferRequestForm } from "@/components/CommercialOfferRequestForm";

export const SystemInfoDialog = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Info className="mr-2 h-4 w-4" />
          Подробнее о системе
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>О системе управления протоколами ППК</DialogTitle>
          <DialogDescription>
            Цифровое решение для психолого-педагогических консилиумов
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-4 text-sm">
            <section>
              <h3 className="font-semibold text-base mb-2">Назначение системы</h3>
              <p className="text-muted-foreground">
                Система управления протоколами ППК предназначена для автоматизации работы психолого-педагогических консилиумов 
                образовательных организаций города Москвы. Она обеспечивает структурированный подход к ведению протоколов, 
                оценке развития обучающихся и формированию рекомендаций.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">Основные возможности</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Создание и ведение электронных протоколов ППК</li>
                <li>Структурированная оценка развития обучающихся по чек-листам</li>
                <li>Автоматическое формирование заключений и рекомендаций</li>
                <li>Контроль за наличием необходимых документов</li>
                <li>Статистика и аналитика по протоколам</li>
                <li>Экспорт протоколов в PDF и Excel</li>
                <li>Управление доступом для разных уровней пользователей</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">Роли пользователей</h3>
              <div className="space-y-2 text-muted-foreground">
                <div>
                  <strong>Специалист ППК:</strong> Создание и редактирование протоколов своей организации, 
                  просмотр статистики
                </div>
                <div>
                  <strong>Региональный оператор:</strong> Просмотр протоколов всех организаций региона, 
                  аналитика по региону
                </div>
                <div>
                  <strong>Администратор:</strong> Полный доступ ко всем функциям системы, управление пользователями 
                  и организациями
                </div>
              </div>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">Процесс работы</h3>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Регистрация в системе и получение доступа после одобрения администратором</li>
                <li>Создание нового протокола с указанием данных обучающегося</li>
                <li>Проверка наличия необходимых документов</li>
                <li>Заполнение структурированного чек-листа оценки развития</li>
                <li>Автоматическое формирование заключения на основе оценок</li>
                <li>Сохранение протокола и формирование отчетности</li>
              </ol>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">Техническая поддержка</h3>
              <p className="text-muted-foreground">
                При возникновении вопросов или технических проблем обращайтесь к администратору вашей организации 
                или в службу технической поддержки системы.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">Безопасность данных</h3>
              <p className="text-muted-foreground">
                Все персональные данные обучающихся и их родителей надежно защищены. Доступ к протоколам 
                предоставляется только авторизованным специалистам в соответствии с их ролью. 
                Система соответствует требованиям законодательства о персональных данных.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">Тарифы</h3>
              <div className="space-y-3 mb-4">
                <div className="border rounded-lg p-4 bg-muted/50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold text-foreground">Месячная подписка</h4>
                      <p className="text-sm text-muted-foreground">Идеально для тестирования</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-foreground">2 500 ₽</div>
                      <div className="text-sm text-muted-foreground">в месяц</div>
                    </div>
                  </div>
                </div>
                
                <div className="border rounded-lg p-4 bg-primary/5 border-primary">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold text-foreground">Годовая подписка</h4>
                      <p className="text-sm text-muted-foreground">Экономия 15%</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-foreground">25 500 ₽</div>
                      <div className="text-sm text-muted-foreground">в год</div>
                      <div className="text-xs text-primary font-medium">вместо 30 000 ₽</div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    <strong>Тестовый режим:</strong> Сейчас система работает в тестовом режиме без ограничений по количеству протоколов. 
                    Используйте все возможности системы бесплатно!
                  </p>
                </div>
              </div>

              <h3 className="font-semibold text-base mb-2 mt-6">Виды подписок</h3>
              <div className="space-y-3 text-muted-foreground">
                <div className="border-l-2 border-primary pl-3">
                  <strong className="text-foreground">1. Оплата картой</strong>
                  <p className="mt-1">Принимаем карты МИР, платежи через СБП и другие способы онлайн-оплаты. 
                  Быстрое подключение и мгновенная активация подписки.</p>
                </div>
                <div className="border-l-2 border-primary pl-3">
                  <strong className="text-foreground">2. Выставление счета на юридическое лицо</strong>
                  <p className="mt-1">Для образовательных организаций доступна оплата по безналичному расчету. 
                  Предоставляем все необходимые документы для бухгалтерии.</p>
                </div>
                <div className="border-l-2 border-primary pl-3">
                  <strong className="text-foreground">3. Приобретение через портал поставщиков</strong>
                  <p className="mt-1">Система доступна для закупки через официальные порталы поставщиков 
                  в соответствии с требованиями 44-ФЗ и 223-ФЗ.</p>
                </div>
              </div>

              <div className="mt-4">
                <CommercialOfferRequestForm />
              </div>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
