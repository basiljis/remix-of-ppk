/**
 * Утилиты для работы с учебным годом
 */

export interface SchoolYear {
  label: string;
  value: string;
  startDate: Date;
  endDate: Date;
}

/**
 * Получить учебный год для заданной даты
 * Учебный год: с 1 сентября по 31 августа
 */
export const getSchoolYearForDate = (date: Date): SchoolYear => {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-11
  
  // Если месяц сентябрь-декабрь (8-11), то это начало учебного года
  // Если месяц январь-август (0-7), то это конец учебного года
  const startYear = month >= 8 ? year : year - 1;
  const endYear = startYear + 1;
  
  return {
    label: `${startYear}/${endYear}`,
    value: `${startYear}-${endYear}`,
    startDate: new Date(startYear, 8, 1), // 1 сентября
    endDate: new Date(endYear, 7, 31)     // 31 августа
  };
};

/**
 * Получить текущий учебный год
 */
export const getCurrentSchoolYear = (): SchoolYear => {
  return getSchoolYearForDate(new Date());
};

/**
 * Получить список доступных учебных годов
 * @param yearsBack Количество лет назад (по умолчанию 5)
 * @param yearsForward Количество лет вперед (по умолчанию 1)
 */
export const getAvailableSchoolYears = (
  yearsBack: number = 5,
  yearsForward: number = 1
): SchoolYear[] => {
  const currentYear = getSchoolYearForDate(new Date());
  const currentStartYear = parseInt(currentYear.value.split('-')[0]);
  
  const years: SchoolYear[] = [];
  
  for (let i = yearsBack; i >= -yearsForward; i--) {
    const startYear = currentStartYear - i;
    const endYear = startYear + 1;
    
    years.push({
      label: `${startYear}/${endYear}`,
      value: `${startYear}-${endYear}`,
      startDate: new Date(startYear, 8, 1),
      endDate: new Date(endYear, 7, 31)
    });
  }
  
  return years;
};

/**
 * Проверить, попадает ли дата в учебный год
 */
export const isDateInSchoolYear = (date: Date, schoolYear: SchoolYear): boolean => {
  return date >= schoolYear.startDate && date <= schoolYear.endDate;
};
