/**
 * Official Russian public holidays (recurring annually)
 * Based on Article 112 of the Labor Code of Russian Federation
 */
export interface RussianHoliday {
  name: string;
  month: number; // 1-12
  day: number;
  description?: string;
}

export const RUSSIAN_HOLIDAYS: RussianHoliday[] = [
  { name: "Новогодние каникулы", month: 1, day: 1, description: "Новогодние каникулы" },
  { name: "Новогодние каникулы", month: 1, day: 2, description: "Новогодние каникулы" },
  { name: "Новогодние каникулы", month: 1, day: 3, description: "Новогодние каникулы" },
  { name: "Новогодние каникулы", month: 1, day: 4, description: "Новогодние каникулы" },
  { name: "Новогодние каникулы", month: 1, day: 5, description: "Новогодние каникулы" },
  { name: "Новогодние каникулы", month: 1, day: 6, description: "Новогодние каникулы" },
  { name: "Рождество Христово", month: 1, day: 7, description: "Рождество Христово" },
  { name: "Новогодние каникулы", month: 1, day: 8, description: "Новогодние каникулы" },
  { name: "День защитника Отечества", month: 2, day: 23, description: "День защитника Отечества" },
  { name: "Международный женский день", month: 3, day: 8, description: "Международный женский день" },
  { name: "Праздник Весны и Труда", month: 5, day: 1, description: "Праздник Весны и Труда" },
  { name: "День Победы", month: 5, day: 9, description: "День Победы" },
  { name: "День России", month: 6, day: 12, description: "День России" },
  { name: "День народного единства", month: 11, day: 4, description: "День народного единства" },
];

/**
 * Get holidays for a specific year in date format
 */
export function getRussianHolidaysForYear(year: number): Array<{
  date: string;
  name: string;
  description: string;
}> {
  return RUSSIAN_HOLIDAYS.map((holiday) => ({
    date: `${year}-${String(holiday.month).padStart(2, "0")}-${String(holiday.day).padStart(2, "0")}`,
    name: holiday.name,
    description: holiday.description || holiday.name,
  }));
}
