/**
 * Генерация ICS-файла с этапами социально-психологического тестирования (СПТ).
 * Файл можно импортировать в Яндекс.Календарь, Google Calendar, Outlook.
 */

export type SptEvent = {
  uid: string;
  /** Дата начала (все события — на весь день) */
  start: Date;
  /** Длительность в днях */
  days: number;
  summary: string;
  description: string;
  /** За сколько дней до начала напомнить */
  alarmDaysBefore: number;
};

/** Учебный год: с августа считаем текущий год, иначе предыдущий. */
export function academicYearStart(now = new Date()): number {
  return now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
}

export function buildSptEvents(year = academicYearStart()): SptEvent[] {
  return [
    {
      uid: `spt-info-${year}`,
      start: new Date(year, 8, 1),
      days: 21,
      summary: "СПТ · Этап 1: информирование и сбор согласий",
      description: [
        "Ответственные: педагог-психолог, классные руководители.",
        "— Провести родительские собрания и классные часы о целях СПТ.",
        "— Собрать 100% бланков: информированное согласие или отказ.",
        "— Сформировать поимённые списки участников по параллелям.",
      ].join("\n"),
      alarmDaysBefore: 3,
    },
    {
      uid: `spt-testing-${year}`,
      start: new Date(year, 9, 1),
      days: 21,
      summary: "СПТ · Этап 2: проведение тестирования",
      description: [
        "Ответственные: комиссия по проведению СПТ, ИТ-специалист.",
        "— Проверить доступ к региональной платформе и стабильность канала.",
        "— Обеспечить условия: один обучающийся — одно рабочее место.",
        "— Составить акт передачи результатов оператору.",
      ].join("\n"),
      alarmDaysBefore: 7,
    },
    {
      uid: `spt-processing-${year}`,
      start: new Date(year, 10, 1),
      days: 30,
      summary: "СПТ · Этап 3: обработка результатов",
      description: [
        "Ответственные: педагог-психолог.",
        "— Ожидание итогов централизованной обработки.",
        "— Предварительное планирование тренингов и индивидуальной работы.",
      ].join("\n"),
      alarmDaysBefore: 3,
    },
    {
      uid: `spt-results-${year}`,
      start: new Date(year, 11, 1),
      days: 25,
      summary: "СПТ · Этап 4: расшифровки и консультации",
      description: [
        "Ответственные: администрация, педагог-психолог.",
        "— Приём и регистрация письменных заявлений родителей на расшифровку.",
        "— Выдача результатов в доступной форме (не позднее декабря).",
        "— Формирование плана адресной профилактики на 2-е полугодие.",
      ].join("\n"),
      alarmDaysBefore: 5,
    },
  ];
}

const pad = (n: number) => String(n).padStart(2, "0");
const dateOnly = (d: Date) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
const stamp = (d: Date) =>
  `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(
    d.getUTCMinutes()
  )}${pad(d.getUTCSeconds())}Z`;

const escapeIcs = (s: string) =>
  s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

/** Складывание строк по RFC 5545 (не длиннее 75 октетов). */
function fold(line: string): string {
  if (line.length <= 74) return line;
  const parts: string[] = [];
  let rest = line;
  parts.push(rest.slice(0, 74));
  rest = rest.slice(74);
  while (rest.length > 0) {
    parts.push(" " + rest.slice(0, 73));
    rest = rest.slice(73);
  }
  return parts.join("\r\n");
}

export function buildSptIcs(year = academicYearStart()): string {
  const now = new Date();
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//universum.//SPT Timeline//RU",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeIcs(`СПТ ${year}/${year + 1} — план службы сопровождения`)}`,
    "X-WR-TIMEZONE:Europe/Moscow",
  ];

  for (const ev of buildSptEvents(year)) {
    const end = new Date(ev.start);
    end.setDate(end.getDate() + ev.days);
    lines.push(
      "BEGIN:VEVENT",
      `UID:${ev.uid}@unvrsm.ru`,
      `DTSTAMP:${stamp(now)}`,
      `DTSTART;VALUE=DATE:${dateOnly(ev.start)}`,
      `DTEND;VALUE=DATE:${dateOnly(end)}`,
      `SUMMARY:${escapeIcs(ev.summary)}`,
      `DESCRIPTION:${escapeIcs(ev.description)}`,
      "CATEGORIES:СПТ,Служба сопровождения",
      "TRANSP:TRANSPARENT",
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      `TRIGGER:-P${ev.alarmDaysBefore}D`,
      `DESCRIPTION:${escapeIcs(`Напоминание: ${ev.summary}`)}`,
      "END:VALARM",
      "END:VEVENT"
    );
  }

  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n");
}

export function downloadSptIcs(year = academicYearStart()): void {
  const blob = new Blob([buildSptIcs(year)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `spt-timeline-${year}-${year + 1}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
