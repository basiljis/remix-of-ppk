import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Info, Users, FileText, Calendar, BarChart3, ClipboardCheck, TrendingUp, Target, UserCheck, Gamepad2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CommercialOfferRequestForm } from "@/components/CommercialOfferRequestForm";
import { Card, CardContent } from "@/components/ui/card";

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
          <DialogTitle className="text-xl">universum.</DialogTitle>
          <DialogDescription className="text-sm">
            Развитие. Для каждого
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-4 text-sm">
            <section>
              <h3 className="font-semibold text-base mb-2">Назначение системы</h3>
              <p className="text-muted-foreground mb-3">
                universum. — платформа комплексной поддержки развития детей.
              </p>
              <div className="space-y-2 text-muted-foreground">
                <div className="border-l-2 border-orange-500 pl-3">
                  <strong className="text-foreground">Карточка ребёнка — ядро системы</strong>
                  <p className="mt-1">Централизованный профиль, объединяющий все данные о развитии ребёнка: результаты протоколов, динамику показателей, историю занятий и персонализированные рекомендации.</p>
                </div>
                <div className="border-l-2 border-primary pl-3">
                  <strong className="text-foreground">Протоколы ППК</strong>
                  <p className="mt-1">Автоматизация работы психолого-педагогических консилиумов: структурированная оценка по чек-листам, формирование заключений и рекомендаций.</p>
                </div>
                <div className="border-l-2 border-primary pl-3">
                  <strong className="text-foreground">Журнал рабочего времени</strong>
                  <p className="mt-1">Планирование и учёт индивидуальных и групповых занятий, контроль посещаемости, статистика нагрузки специалистов.</p>
                </div>
              </div>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">Основные возможности</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Создание и ведение электронных протоколов ППК</li>
                <li>Структурированная оценка развития обучающихся по чек-листам</li>
                <li>Автоматическое формирование заключений и рекомендаций</li>
                <li>Направления работы специалистов — система подбирает педагогов под проблематику ребёнка</li>
                <li>Публичные профили специалистов с описанием, образованием и стоимостью услуг</li>
                <li>Рекомендации педагогов родителям на основе результатов ППк и тестов</li>
                <li>Управление видимостью стоимости услуг (администратор / специалист)</li>
                <li>Контроль за наличием необходимых документов</li>
                <li>Статистика и аналитика по протоколам, KPI специалистов</li>
                <li>Экспорт протоколов в PDF и Excel</li>
                <li>Управление доступом для разных уровней пользователей</li>
                <li>Ведение карточек детей с историей протоколов и динамикой развития</li>
                <li>Планирование и учёт занятий в расписании</li>
                <li>Интерактивные бизнес-процессы и инструкции для всех ролей</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">Карточка ребёнка</h3>
              <p className="text-muted-foreground mb-3">
                Централизованный профиль ребёнка объединяет всю информацию о его развитии, занятиях и прогрессе.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Card className="bg-muted/50 border-muted">
                  <CardContent className="p-3 flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <Users className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-foreground">Персональные данные</h4>
                      <p className="text-xs text-muted-foreground">ФИО, дата рождения, пол, контакты родителей, уровень образования</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-muted/50 border-muted">
                  <CardContent className="p-3 flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-foreground">История протоколов</h4>
                      <p className="text-xs text-muted-foreground">Все протоколы ППК с заключениями и рекомендациями</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-muted/50 border-muted">
                  <CardContent className="p-3 flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-green-500/10 text-green-500">
                      <TrendingUp className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-foreground">Динамика развития</h4>
                      <p className="text-xs text-muted-foreground">Графики и сравнение показателей по протоколам</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-muted/50 border-muted">
                  <CardContent className="p-3 flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
                      <Target className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-foreground">Подбор специалистов</h4>
                      <p className="text-xs text-muted-foreground">Рекомендации педагогов на основе выявленных проблем и направлений работы</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-muted/50 border-muted">
                  <CardContent className="p-3 flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                      <ClipboardCheck className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-foreground">Учёт посещаемости</h4>
                      <p className="text-xs text-muted-foreground">Статистика присутствия на занятиях</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-muted/50 border-muted">
                  <CardContent className="p-3 flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-rose-500/10 text-rose-500">
                      <BarChart3 className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-foreground">Рекомендации</h4>
                      <p className="text-xs text-muted-foreground">Персонализированные рекомендации и запись к педагогам по направлениям</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">Роли пользователей</h3>
              <div className="space-y-2 text-muted-foreground">
                <div>
                  <strong>Специалист ППК:</strong> Создание протоколов, ведение расписания, публичный профиль с направлениями работы, 
                  управление стоимостью услуг
                </div>
                <div>
                  <strong>Администратор организации:</strong> Управление сотрудниками, настройка видимости стоимости услуг, 
                  KPI и аналитика по организации
                </div>
                <div>
                  <strong>Региональный оператор:</strong> Просмотр протоколов всех организаций региона, 
                  аналитика по региону
                </div>
                <div>
                  <strong>Администратор системы:</strong> Полный доступ ко всем функциям, управление пользователями 
                  и организациями, бизнес-процессы
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
              <h3 className="font-semibold text-base mb-2">Информация о разработчике</h3>
              <div className="space-y-1 text-muted-foreground bg-muted/50 p-4 rounded-lg">
                <div><strong className="text-foreground">ИП Загладин В.С.</strong></div>
                <div>ИНН: 770702169499</div>
                <div>ОГРНИП: 323774600132891</div>
              </div>
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
                    <strong>Пробный период:</strong> При одобрении заявки, предоставляется пробный период на 7 дней без ограничений по количеству протоколов
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
