import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Scale, Users, FileText, AlertTriangle, CheckCircle, Download } from "lucide-react";
import { useInstructions } from "@/hooks/useInstructions";
import { Button } from "@/components/ui/button";

export const InstructionsSection = () => {
  const { instructions: customInstructions, loading: customLoading, error: customError } = useInstructions('custom');
  const { instructions: workInstructions, loading: workLoading, error: workError } = useInstructions('work');
  const { instructions: legalInstructions, loading: legalLoading, error: legalError } = useInstructions('legal');
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="instructions" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Инструкции по работе
          </TabsTrigger>
          <TabsTrigger value="custom" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Пользовательские инструкции
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
                      Заполнение протокола ППк
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3">
                    <p>Начните работу с заполнения протокола психолого-педагогического консилиума:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li><strong>Образовательная организация</strong> - выберите из списка ЕКИС</li>
                      <li><strong>Данные обучающегося</strong> - заполните ФИО, дату рождения, класс</li>
                      <li><strong>Специалисты</strong> - укажите состав консилиума</li>
                      <li><strong>Цели консилиума</strong> - опишите задачи обследования</li>
                    </ul>
                    <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                      <p className="text-sm text-red-800"><AlertTriangle className="h-4 w-4 inline mr-1" />
                        Поля, отмеченные красным, являются обязательными для заполнения.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="step-2">
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Шаг 2</Badge>
                      Работа с чеклистами
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3">
                    <p>Используйте чеклисты из базы данных для систематизации работы:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Выберите уровень образования в разделе "Чеклисты"</li>
                      <li>Проверьте все пункты диагностических процедур</li>
                      <li>Отметьте выполненные задачи</li>
                      <li>Используйте статистику для контроля прогресса</li>
                    </ul>
                    <div className="bg-accent/50 p-3 rounded-lg">
                      <p className="text-sm"><CheckCircle className="h-4 w-4 inline mr-1" />
                        Чеклисты загружаются из базы данных Supabase и адаптируются под выбранный уровень.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="step-3">
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Шаг 3</Badge>
                      Работа с организациями ЕКИС
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3">
                    <p>Используйте данные из системы ЕКИС для выбора образовательных организаций:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>В протоколе система автоматически подгружает организации из ЕКИС</li>
                      <li>Фильтруйте организации по округу и типу</li>
                      <li>Используйте поиск для быстрого нахождения нужной организации</li>
                      <li>Просматривайте актуальную информацию об организациях</li>
                    </ul>
                    <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                      <p className="text-sm text-blue-800"><CheckCircle className="h-4 w-4 inline mr-1" />
                        При недоступности API используются резервные данные для продолжения работы.
                      </p>
                    </div>
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

          {/* Dynamic Work Instructions */}
          {workInstructions.map((instruction) => (
            <Card key={instruction.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {instruction.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {instruction.content.map((section, sectionIndex) => (
                    <AccordionItem key={section.id} value={`work-section-${sectionIndex}`}>
                      <AccordionTrigger className="text-left">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Раздел {sectionIndex + 1}</Badge>
                          {section.title}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-3">
                        {section.content && (
                          <div className="whitespace-pre-wrap text-sm">
                            {section.content}
                          </div>
                        )}
                        
                        {section.documents && section.documents.length > 0 && (
                          <div className="space-y-2">
                            <h5 className="text-sm font-medium">Документы:</h5>
                            {section.documents.map((doc) => (
                              <div key={doc.id} className="flex items-center justify-between bg-muted p-2 rounded">
                                <div className="flex items-center">
                                  <FileText className="w-4 h-4 mr-2" />
                                  <span className="text-sm">{doc.name}</span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => window.open(doc.url, '_blank')}
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}

                        {section.subsections && section.subsections.length > 0 && (
                          <div className="space-y-3 ml-4">
                            {section.subsections.map((subsection, subIndex) => (
                              <div key={subsection.id} className="border-l-2 border-l-secondary pl-4">
                                <h5 className="font-medium text-sm flex items-center gap-2">
                                  <Badge variant="secondary" className="text-xs">
                                    Подраздел {subIndex + 1}
                                  </Badge>
                                  {subsection.title}
                                </h5>
                                
                                {subsection.content && (
                                  <div className="whitespace-pre-wrap text-sm text-muted-foreground mt-2">
                                    {subsection.content}
                                  </div>
                                )}
                                
                                {subsection.documents && subsection.documents.length > 0 && (
                                  <div className="space-y-2 mt-2">
                                    <h6 className="text-xs font-medium">Документы подраздела:</h6>
                                    {subsection.documents.map((doc) => (
                                      <div key={doc.id} className="flex items-center justify-between bg-muted p-2 rounded">
                                        <div className="flex items-center">
                                          <FileText className="w-4 h-4 mr-2" />
                                          <span className="text-sm">{doc.name}</span>
                                        </div>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => window.open(doc.url, '_blank')}
                                        >
                                          <Download className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="custom" className="space-y-6">
          {customLoading ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p>Загрузка пользовательских инструкций...</p>
              </CardContent>
            </Card>
          ) : customError ? (
            <Card>
              <CardContent className="p-6 text-center">
                <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
                <p className="text-destructive">Ошибка загрузки: {customError}</p>
              </CardContent>
            </Card>
          ) : customInstructions.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">
                  Пользовательские инструкции не найдены.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Обратитесь к администратору для добавления инструкций.
                </p>
              </CardContent>
            </Card>
          ) : (
            customInstructions.map((instruction) => (
              <Card key={instruction.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {instruction.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {instruction.content.map((section, sectionIndex) => (
                      <AccordionItem key={section.id} value={`section-${sectionIndex}`}>
                        <AccordionTrigger className="text-left">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">Раздел {sectionIndex + 1}</Badge>
                            {section.title}
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-3">
                          {section.content && (
                            <div className="whitespace-pre-wrap text-sm">
                              {section.content}
                            </div>
                          )}
                          
                          {section.documents && section.documents.length > 0 && (
                            <div className="space-y-2">
                              <h5 className="text-sm font-medium">Документы:</h5>
                              {section.documents.map((doc) => (
                                <div key={doc.id} className="flex items-center justify-between bg-muted p-2 rounded">
                                  <div className="flex items-center">
                                    <FileText className="w-4 h-4 mr-2" />
                                    <span className="text-sm">{doc.name}</span>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => window.open(doc.url, '_blank')}
                                  >
                                    <Download className="w-4 h-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}

                          {section.subsections && section.subsections.length > 0 && (
                            <div className="space-y-3 ml-4">
                              {section.subsections.map((subsection, subIndex) => (
                                <div key={subsection.id} className="border-l-2 border-l-secondary pl-4">
                                  <h5 className="font-medium text-sm flex items-center gap-2">
                                    <Badge variant="secondary" className="text-xs">
                                      Подраздел {subIndex + 1}
                                    </Badge>
                                    {subsection.title}
                                  </h5>
                                  
                                  {subsection.content && (
                                    <div className="whitespace-pre-wrap text-sm text-muted-foreground mt-2">
                                      {subsection.content}
                                    </div>
                                  )}
                                  
                                  {subsection.documents && subsection.documents.length > 0 && (
                                    <div className="space-y-2 mt-2">
                                      <h6 className="text-xs font-medium">Документы подраздела:</h6>
                                      {subsection.documents.map((doc) => (
                                        <div key={doc.id} className="flex items-center justify-between bg-muted p-2 rounded">
                                          <div className="flex items-center">
                                            <FileText className="w-4 h-4 mr-2" />
                                            <span className="text-sm">{doc.name}</span>
                                          </div>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => window.open(doc.url, '_blank')}
                                          >
                                            <Download className="w-4 h-4" />
                                          </Button>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="legal" className="space-y-6">
          {/* Dynamic Legal Instructions */}
          {legalInstructions.map((instruction) => (
            <Card key={instruction.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="h-5 w-5" />
                  {instruction.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {instruction.content.map((section, sectionIndex) => (
                    <AccordionItem key={section.id} value={`legal-section-${sectionIndex}`}>
                      <AccordionTrigger className="text-left">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Раздел {sectionIndex + 1}</Badge>
                          {section.title}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-3">
                        {section.content && (
                          <div className="whitespace-pre-wrap text-sm">
                            {section.content}
                          </div>
                        )}
                        
                        {section.documents && section.documents.length > 0 && (
                          <div className="space-y-2">
                            <h5 className="text-sm font-medium">Документы:</h5>
                            {section.documents.map((doc) => (
                              <div key={doc.id} className="flex items-center justify-between bg-muted p-2 rounded">
                                <div className="flex items-center">
                                  <FileText className="w-4 h-4 mr-2" />
                                  <span className="text-sm">{doc.name}</span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => window.open(doc.url, '_blank')}
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}

                        {section.subsections && section.subsections.length > 0 && (
                          <div className="space-y-3 ml-4">
                            {section.subsections.map((subsection, subIndex) => (
                              <div key={subsection.id} className="border-l-2 border-l-secondary pl-4">
                                <h5 className="font-medium text-sm flex items-center gap-2">
                                  <Badge variant="secondary" className="text-xs">
                                    Подраздел {subIndex + 1}
                                  </Badge>
                                  {subsection.title}
                                </h5>
                                
                                {subsection.content && (
                                  <div className="whitespace-pre-wrap text-sm text-muted-foreground mt-2">
                                    {subsection.content}
                                  </div>
                                )}
                                
                                {subsection.documents && subsection.documents.length > 0 && (
                                  <div className="space-y-2 mt-2">
                                    <h6 className="text-xs font-medium">Документы подраздела:</h6>
                                    {subsection.documents.map((doc) => (
                                      <div key={doc.id} className="flex items-center justify-between bg-muted p-2 rounded">
                                        <div className="flex items-center">
                                          <FileText className="w-4 h-4 mr-2" />
                                          <span className="text-sm">{doc.name}</span>
                                        </div>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => window.open(doc.url, '_blank')}
                                        >
                                          <Download className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          ))}

          {/* Static Legal Content */}
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
                        <p className="text-sm mb-2">
                          Определяет правовые основы организации образовательного процесса и психолого-педагогического сопровождения обучающихся.
                        </p>
                        <a href="http://www.consultant.ru/document/cons_doc_LAW_140174/" target="_blank" rel="noopener noreferrer" className="text-primary underline text-sm">
                          Официальный текст на КонсультантПлюс
                        </a>
                      </div>
                      
                      <div className="border rounded-lg p-4">
                        <h4 className="font-semibold mb-2">Федеральный закон "О социальной защите инвалидов в РФ"</h4>
                        <p className="text-sm text-muted-foreground mb-2">№ 181-ФЗ от 24.11.1995</p>
                        <p className="text-sm mb-2">
                          Регулирует вопросы образования и реабилитации детей с ограниченными возможностями здоровья.
                        </p>
                        <a href="http://www.consultant.ru/document/cons_doc_LAW_8559/" target="_blank" rel="noopener noreferrer" className="text-primary underline text-sm">
                          Официальный текст на КонсультантПлюс
                        </a>
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
                        <p className="text-sm mb-2">
                          Устанавливает порядок создания и деятельности психолого-педагогических консилиумов в образовательных организациях.
                        </p>
                        <a href="https://docs.edu.gov.ru/document/6f205375c5b33320e8416ddb5a5704e3/" target="_blank" rel="noopener noreferrer" className="text-primary underline text-sm">
                          Официальный документ Минобразования
                        </a>
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