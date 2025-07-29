import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Scale, Users, FileText, AlertTriangle, CheckCircle } from "lucide-react";

export const InstructionsSection = () => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-4">
          Инструкции по работе в системе
        </h2>
        <p className="text-muted-foreground">
          Полное руководство по организации и проведению психолого-педагогического консилиума
        </p>
      </div>

      <Tabs defaultValue="instructions" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="instructions" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Инструкции по работе
          </TabsTrigger>
          <TabsTrigger value="legal" className="flex items-center gap-2">
            <Scale className="h-4 w-4" />
            Нормативно-правовая база
          </TabsTrigger>
        </TabsList>

        <TabsContent value="instructions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Пошаговое руководство
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="step-1">
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Шаг 1</Badge>
                      Выбор уровня образования
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3">
                    <p>Начните работу с выбора соответствующего уровня образования:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li><strong>Дошкольное образование</strong> - для детей 3-7 лет</li>
                      <li><strong>Начальное образование</strong> - для учащихся 1-4 классов</li>
                      <li><strong>Основное образование</strong> - для учащихся 5-9 классов</li>
                      <li><strong>Среднее образование</strong> - для учащихся 10-11 классов</li>
                    </ul>
                    <div className="bg-accent/50 p-3 rounded-lg">
                      <p className="text-sm"><CheckCircle className="h-4 w-4 inline mr-1" />
                        Система автоматически адаптирует чеклисты под выбранный уровень образования.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="step-2">
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Шаг 2</Badge>
                      Подготовка к консилиуму
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3">
                    <p>Выполните все задачи из раздела "Подготовка к консилиуму":</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Уведомите родителей/законных представителей</li>
                      <li>Получите письменное согласие на обследование</li>
                      <li>Сформируйте состав консилиума</li>
                      <li>Назначьте дату и время проведения</li>
                    </ul>
                    <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg">
                      <p className="text-sm text-orange-800"><AlertTriangle className="h-4 w-4 inline mr-1" />
                        Обязательные задачи отмечены красным индикатором и должны быть выполнены.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="step-3">
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Шаг 3</Badge>
                      Документооборот
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3">
                    <p>Подготовьте необходимую документацию:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Представление педагога на обучающегося</li>
                      <li>Психологическое заключение</li>
                      <li>Характеристика обучающегося</li>
                      <li>Результаты психолого-педагогического обследования</li>
                      <li>Медицинская справка (при необходимости)</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="step-4">
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Шаг 4</Badge>
                      Проведение консилиума
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3">
                    <p>Организуйте и проведите заседание консилиума:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Обеспечьте присутствие всех членов консилиума</li>
                      <li>Ведите протокол заседания</li>
                      <li>Проанализируйте представленные материалы</li>
                      <li>Обсудите рекомендации специалистов</li>
                      <li>Примите коллегиальное решение</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="step-5">
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Шаг 5</Badge>
                      Генерация документов
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3">
                    <p>Используйте встроенные инструменты для создания документов:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Генерация согласий родителей в формате PDF</li>
                      <li>Экспорт отчетов о готовности</li>
                      <li>Создание протоколов заседаний</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Советы по эффективному использованию</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="border-l-4 border-primary pl-4">
                  <h4 className="font-semibold">Отслеживание прогресса</h4>
                  <p className="text-sm text-muted-foreground">
                    Используйте панель статистики для контроля выполнения задач и готовности к консилиуму.
                  </p>
                </div>
                <div className="border-l-4 border-secondary pl-4">
                  <h4 className="font-semibold">Адаптация под конкретные случаи</h4>
                  <p className="text-sm text-muted-foreground">
                    Дополнительные задачи можно отмечать как выполненные, но основные требования остаются неизменными.
                  </p>
                </div>
                <div className="border-l-4 border-accent pl-4">
                  <h4 className="font-semibold">Командная работа</h4>
                  <p className="text-sm text-muted-foreground">
                    Система позволяет отслеживать готовность всех участников консилиума к проведению заседания.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="legal" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5" />
                Нормативно-правовая база
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="federal-laws">
                  <AccordionTrigger>Федеральные законы</AccordionTrigger>
                  <AccordionContent className="space-y-3">
                    <div className="space-y-4">
                      <div className="border rounded-lg p-4">
                        <h4 className="font-semibold mb-2">Федеральный закон "Об образовании в Российской Федерации"</h4>
                        <p className="text-sm text-muted-foreground mb-2">№ 273-ФЗ от 29.12.2012</p>
                        <p className="text-sm">
                          Определяет правовые основы организации образовательного процесса и психолого-педагогического сопровождения обучающихся.
                        </p>
                      </div>
                      
                      <div className="border rounded-lg p-4">
                        <h4 className="font-semibold mb-2">Федеральный закон "О социальной защите инвалидов в РФ"</h4>
                        <p className="text-sm text-muted-foreground mb-2">№ 181-ФЗ от 24.11.1995</p>
                        <p className="text-sm">
                          Регулирует вопросы образования и реабилитации детей с ограниченными возможностями здоровья.
                        </p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="ministry-orders">
                  <AccordionTrigger>Приказы Министерства образования и науки РФ</AccordionTrigger>
                  <AccordionContent className="space-y-3">
                    <div className="space-y-4">
                      <div className="border rounded-lg p-4">
                        <h4 className="font-semibold mb-2">Приказ об утверждении Положения о ППк</h4>
                        <p className="text-sm text-muted-foreground mb-2">№ Р-93 от 09.09.2019</p>
                        <p className="text-sm">
                          Устанавливает порядок создания и деятельности психолого-педагогических консилиумов в образовательных организациях.
                        </p>
                      </div>

                      <div className="border rounded-lg p-4">
                        <h4 className="font-semibold mb-2">Приказ об утверждении ФГОС</h4>
                        <p className="text-sm text-muted-foreground mb-2">Различные номера для разных уровней образования</p>
                        <p className="text-sm">
                          Федеральные государственные образовательные стандарты определяют требования к психолого-педагогическому сопровождению.
                        </p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="sanpin">
                  <AccordionTrigger>СанПиН и гигиенические требования</AccordionTrigger>
                  <AccordionContent className="space-y-3">
                    <div className="space-y-4">
                      <div className="border rounded-lg p-4">
                        <h4 className="font-semibold mb-2">СанПиН 2.4.2.2821-10</h4>
                        <p className="text-sm text-muted-foreground mb-2">Санитарно-эпидемиологические требования к условиям и организации обучения</p>
                        <p className="text-sm">
                          Устанавливает требования к организации образовательного процесса для детей с особыми потребностями.
                        </p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="regional-docs">
                  <AccordionTrigger>Региональные документы</AccordionTrigger>
                  <AccordionContent className="space-y-3">
                    <div className="bg-accent/50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">Важно учитывать</h4>
                      <p className="text-sm">
                        Каждый субъект Российской Федерации может иметь дополнительные нормативные акты, 
                        регулирующие деятельность психолого-педагогических консилиумов. 
                        Обязательно ознакомьтесь с региональными требованиями.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="organization-docs">
                  <AccordionTrigger>Локальные акты образовательной организации</AccordionTrigger>
                  <AccordionContent className="space-y-3">
                    <div className="space-y-4">
                      <div className="border rounded-lg p-4">
                        <h4 className="font-semibold mb-2">Обязательные локальные акты:</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm ml-4">
                          <li>Положение о психолого-педагогическом консилиуме</li>
                          <li>Приказ о создании ППк и утверждении состава</li>
                          <li>Регламент работы ППк</li>
                          <li>Должностные инструкции членов консилиума</li>
                          <li>Формы документооборота</li>
                        </ul>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="key-principles">
                  <AccordionTrigger>Ключевые принципы работы ППк</AccordionTrigger>
                  <AccordionContent className="space-y-3">
                    <div className="grid gap-4">
                      <div className="border-l-4 border-primary pl-4">
                        <h4 className="font-semibold">Принцип конфиденциальности</h4>
                        <p className="text-sm text-muted-foreground">
                          Вся информация о ребенке и семье является конфиденциальной и не подлежит разглашению.
                        </p>
                      </div>
                      <div className="border-l-4 border-secondary pl-4">
                        <h4 className="font-semibold">Принцип добровольности</h4>
                        <p className="text-sm text-muted-foreground">
                          Участие в работе ППк возможно только с согласия родителей (законных представителей).
                        </p>
                      </div>
                      <div className="border-l-4 border-accent pl-4">
                        <h4 className="font-semibold">Принцип комплексности</h4>
                        <p className="text-sm text-muted-foreground">
                          Обследование проводится командой специалистов различного профиля.
                        </p>
                      </div>
                      <div className="border-l-4 border-warning pl-4">
                        <h4 className="font-semibold">Принцип индивидуализации</h4>
                        <p className="text-sm text-muted-foreground">
                          Рекомендации разрабатываются с учетом индивидуальных особенностей ребенка.
                        </p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};