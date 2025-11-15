// Единый источник перевода уровней образования на русский язык

export type EducationLevel = 'preschool' | 'elementary' | 'middle' | 'high';

// Полные названия уровней образования
export const educationLevelTranslations: Record<string, string> = {
  'preschool': 'Дошкольное образование',
  'elementary': 'Начальное общее образование',
  'middle': 'Основное общее образование',
  'high': 'Среднее общее образование',
};

// Короткие названия уровней образования
export const educationLevelShortTranslations: Record<string, string> = {
  'preschool': 'ДО',
  'elementary': 'НОО',
  'middle': 'ОО',
  'high': 'СОО',
};

/**
 * Переводит уровень образования на русский язык
 * @param level - уровень образования на английском
 * @param short - если true, возвращает короткое название
 * @returns переведенное название уровня образования
 */
export const translateEducationLevel = (level: string, short: boolean = false): string => {
  const translations = short ? educationLevelShortTranslations : educationLevelTranslations;
  return translations[level] || level;
};
