import { CalendarPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { academicYearStart, buildSptEvents, downloadSptIcs } from "@/lib/spt-calendar";

/**
 * Блок экспорта календарного таймлайна СПТ в формат ICS
 * для импорта в календарь ответственных специалистов.
 */
export default function SptCalendarExport() {
  const year = academicYearStart();
  const events = buildSptEvents(year);

  const handleExport = () => {
    try {
      downloadSptIcs(year);
      toast.success("Календарь СПТ скачан", {
        description: "Откройте файл .ics, чтобы добавить этапы и напоминания в свой календарь.",
      });
    } catch {
      toast.error("Не удалось сформировать файл календаря");
    }
  };

  return (
    <Card className="my-10 border-primary/20 bg-primary/5">
      <CardContent className="p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold">
              Календарь СПТ {year}/{year + 1} для вашего расписания
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Все этапы тестирования с напоминаниями ответственным специалистам. Файл ICS
              импортируется в Яндекс.Календарь, Google Календарь и Outlook.
            </p>
          </div>
          <Button onClick={handleExport} className="shrink-0 gap-2">
            <CalendarPlus className="h-4 w-4" />
            Экспорт в календарь (.ics)
          </Button>
        </div>

        <ul className="mt-5 grid gap-2 sm:grid-cols-2">
          {events.map((ev) => (
            <li
              key={ev.uid}
              className="rounded-lg border border-primary/15 bg-background px-3 py-2 text-sm"
            >
              <span className="font-medium">{ev.summary}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                Напоминание за {ev.alarmDaysBefore} дн. до начала
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
