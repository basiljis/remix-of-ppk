// Переводы для поля "Кто привел ребенка" (whobrought)
export const whobroughtTranslations: Record<string, string> = {
  mother: "Мать",
  father: "Отец",
  guardian: "Опекун/попечитель",
  grandmother: "Бабушка",
  grandfather: "Дедушка",
  relative: "Другой родственник",
  representative: "Законный представитель"
};

/**
 * Переводит значение whobrought на русский язык
 * @param value - значение whobrought (например, "mother", "father")
 * @returns русский перевод или исходное значение, если перевод не найден
 */
export const translateWhobrought = (value: string | undefined | null): string => {
  if (!value) return "Не указан";
  return whobroughtTranslations[value] || value;
};
