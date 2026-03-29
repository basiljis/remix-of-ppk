import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Download, FileCheck, Shield, ClipboardCheck, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import jsPDF from "jspdf";
import { robotoRegularBase64 } from "@/assets/fonts/roboto-regular-base64";
import { robotoBoldBase64 } from "@/assets/fonts/roboto-bold-base64";

const checklistItems = [
  {
    category: "Документация ППк",
    items: [
      "Приказ о создании ППк с указанием актуального персонального состава членов",
      "Положение о ППк, утверждённое руководителем образовательной организации",
      "График плановых заседаний на текущий учебный год (не менее 3 в год)",
      "Журнал записи и учёта заседаний ППк (пронумерован, прошит, скреплён печатью)",
      "Протоколы всех заседаний: плановых и внеплановых (подписаны всеми членами)",
      "Коллегиальные заключения ППк по каждому обследованному ребёнку",
      "Согласия родителей (законных представителей) на обследование и сопровождение (ФЗ-152)",
      "Представления специалистов (психолога, логопеда, дефектолога, педагога) на каждого ребёнка",
      "Журнал направлений детей на ПМПК и учёт выданных рекомендаций",
    ],
  },
  {
    category: "Состав и квалификация членов ППк",
    items: [
      "Председатель ППк назначен приказом руководителя (заместитель директора по УВР)",
      "Секретарь ППк назначен, ведёт документацию, протоколирует заседания",
      "В составе обязательные специалисты: педагог-психолог, учитель-логопед, учитель-дефектолог",
      "Педагоги и воспитатели, работающие с ребёнком, привлекаются к заседаниям",
      "Квалификация всех членов подтверждена документально (дипломы, удостоверения о ПК)",
      "Члены ППк прошли повышение квалификации по профилю за последние 3 года",
      "Протоколы подписаны всеми присутствующими членами комиссии",
    ],
  },
  {
    category: "Работа с детьми и сопровождение",
    items: [
      "Карты развития (индивидуальные карты учёта) ведутся на каждого ребёнка",
      "Индивидуальные образовательные маршруты (ИОМ) разработаны и актуализированы",
      "Динамика развития фиксируется не реже 1 раза в полугодие (промежуточная диагностика)",
      "Рекомендации ПМПК/ЦПМПК учтены, реализуются и отражены в документах",
      "Результаты диагностики оформлены по установленному образцу (протокол обследования)",
      "Ведётся мониторинг эффективности коррекционно-развивающей работы",
      "Заключения ППк содержат конкретные рекомендации по каждой сфере развития",
      "Организован контроль выполнения рекомендаций педагогами и специалистами",
    ],
  },
  {
    category: "Взаимодействие с родителями (законными представителями)",
    items: [
      "Письменные согласия получены до проведения обследования ребёнка",
      "Родители уведомлены о дате и цели заседания ППк заблаговременно",
      "Родители ознакомлены с коллегиальным заключением ППк (под подпись)",
      "Проведены консультации по выполнению рекомендаций в домашних условиях",
      "Направления на ПМПК оформлены только с письменного согласия родителей",
      "Ведётся журнал консультаций родителей с фиксацией тематики и результатов",
    ],
  },
  {
    category: "Хранение и защита персональных данных",
    items: [
      "Документы ППк хранятся в защищённом месте (сейф, запираемый шкаф)",
      "Доступ к документам ограничен кругом членов ППк и руководителя ОО",
      "Электронные данные защищены паролем, доступ по персональным учётным записям",
      "Срок хранения документов ППк соблюдается — не менее 5 лет (Приказ № 666)",
      "Организация зарегистрирована в Роскомнадзоре как оператор ПДн",
      "Имеется утверждённая политика обработки персональных данных (ФЗ-152)",
      "Передача данных третьим лицам осуществляется только на законных основаниях",
    ],
  },
];

function generatePDF() {
  const doc = new jsPDF({ format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 25;

  // Register Cyrillic fonts
  doc.addFileToVFS("Roboto-Regular.ttf", robotoRegularBase64);
  doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
  doc.addFileToVFS("Roboto-Bold.ttf", robotoBoldBase64);
  doc.addFont("Roboto-Bold.ttf", "Roboto", "bold");

  // Title
  doc.setFontSize(18);
  doc.setFont("Roboto", "bold");
  doc.text("Чек-лист: Готовность ППк к проверке", margin, y);
  y += 10;

  doc.setFontSize(10);
  doc.setFont("Roboto", "normal");
  doc.setTextColor(120, 120, 120);
  doc.text("Составлено на основе Приказа ДОНМ Москвы № 666 и методических рекомендаций", margin, y);
  y += 5;
  doc.text("universum. — платформа автоматизации ППк | ppk.lovable.app", margin, y);
  doc.setTextColor(0, 0, 0);
  y += 12;

  checklistItems.forEach((section) => {
    // Check if we need a new page
    if (y > 260) {
      doc.addPage();
      y = 25;
    }

    // Category header
    doc.setFontSize(12);
    doc.setFont("Roboto", "bold");
    doc.setFillColor(240, 245, 250);
    doc.roundedRect(margin, y - 5, contentWidth, 9, 2, 2, "F");
    doc.text(section.category, margin + 4, y + 1);
    y += 10;

    // Items
    doc.setFontSize(10);
    doc.setFont("Roboto", "normal");
    section.items.forEach((item) => {
      if (y > 275) {
        doc.addPage();
        y = 25;
      }
      // Checkbox
      doc.setDrawColor(180, 180, 180);
      doc.rect(margin + 2, y - 3.5, 4, 4);
      doc.text(item, margin + 10, y);
      y += 7;
    });

    y += 5;
  });

  // Footer
  if (y > 260) {
    doc.addPage();
    y = 25;
  }
  y += 5;
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text("Автоматизируйте ведение ППк с платформой universum.", margin, y);
  y += 5;
  doc.text("Бесплатный пробный период — 7 дней. ppk.lovable.app", margin, y);

  doc.save("checklist-ppk-proverka.pdf");
}

export function PpkChecklistLeadMagnet() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Укажите email");
      return;
    }

    setLoading(true);
    try {
      await supabase.from("lead_magnet_downloads" as any).insert({
        email: email.trim(),
        full_name: name.trim() || null,
        magnet_slug: "ppk-checklist",
      } as any);

      generatePDF();
      setDownloaded(true);
      toast.success("Чек-лист скачан!");
    } catch {
      toast.error("Ошибка, попробуйте ещё раз");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card
        className="border-2 border-dashed border-primary/30 hover:border-primary/60 hover:shadow-lg transition-all cursor-pointer group bg-primary/5"
        onClick={() => setOpen(true)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileCheck className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-[10px]">
                  Бесплатно
                </Badge>
                <Badge className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  PDF
                </Badge>
              </div>
              <CardTitle className="text-lg mt-1">
                Чек-лист «Готовность ППк к проверке»
              </CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <CardDescription className="mb-3">
            28 пунктов по 5 направлениям: документация, состав, работа с детьми, родители, защита данных.
            На основе Приказа ДОНМ № 666.
          </CardDescription>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <ClipboardCheck className="h-3.5 w-3.5" />
              28 пунктов
            </span>
            <span className="flex items-center gap-1">
              <Shield className="h-3.5 w-3.5" />
              Приказ № 666
            </span>
            <span className="flex items-center gap-1">
              <Download className="h-3.5 w-3.5" />
              PDF
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-4 gap-2 group-hover:bg-primary group-hover:text-primary-foreground transition-all"
          >
            <Download className="h-4 w-4" />
            Скачать бесплатно
          </Button>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-primary" />
              Скачать чек-лист
            </DialogTitle>
            <DialogDescription>
              Введите email — мы отправим ссылку и полезные материалы по автоматизации ППк
            </DialogDescription>
          </DialogHeader>

          {!downloaded ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="lead-email">Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="lead-email"
                    type="email"
                    placeholder="your@email.ru"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lead-name">Имя (необязательно)</Label>
                <Input
                  id="lead-name"
                  type="text"
                  placeholder="Как к вам обращаться"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="bg-muted/50 rounded-lg p-3 space-y-1.5">
                <p className="text-xs font-medium">Что внутри чек-листа:</p>
                {checklistItems.map((s) => (
                  <p key={s.category} className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <CheckCircle className="h-3 w-3 text-primary flex-shrink-0" />
                    {s.category} ({s.items.length} пунктов)
                  </p>
                ))}
              </div>

              <Button type="submit" className="w-full gap-2" disabled={loading}>
                <Download className="h-4 w-4" />
                {loading ? "Подготовка..." : "Скачать PDF"}
              </Button>

              <p className="text-[10px] text-muted-foreground text-center">
                Нажимая кнопку, вы соглашаетесь с{" "}
                <a href="/privacy" className="underline">
                  политикой конфиденциальности
                </a>
              </p>
            </form>
          ) : (
            <div className="text-center py-6 space-y-4">
              <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="font-medium text-lg">Чек-лист скачан!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Проверьте папку загрузок
                </p>
              </div>
              <div className="border-t pt-4 space-y-2">
                <p className="text-sm font-medium">Хотите автоматизировать ведение ППк?</p>
                <Button
                  variant="default"
                  className="w-full"
                  onClick={() => {
                    setOpen(false);
                    window.location.href = "/auth";
                  }}
                >
                  Попробовать бесплатно — 7 дней
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
