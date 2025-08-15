import * as XLSX from 'xlsx';

export const exportChecklistToXLS = (checklistData: any[], level: string) => {
  // Prepare data for export
  const exportData = checklistData.map((item, index) => ({
    '№': index + 1,
    'Пункт проверки': item.text,
    'Обязательный': item.isRequired ? 'Да' : 'Нет',
    'Выполнен': item.isCompleted ? 'Да' : 'Нет',
    'Статус': item.isCompleted ? 'Выполнено' : 'Не выполнено'
  }));

  // Calculate statistics
  const totalItems = checklistData.length;
  const completedItems = checklistData.filter(item => item.isCompleted).length;
  const requiredItems = checklistData.filter(item => item.isRequired).length;
  const completedRequired = checklistData.filter(item => item.isRequired && item.isCompleted).length;
  
  // Add summary row
  exportData.push({
    '№': '',
    'Пункт проверки': 'ИТОГО:',
    'Обязательный': `${requiredItems} из ${totalItems}`,
    'Выполнен': `${completedItems} из ${totalItems}`,
    'Статус': `${Math.round((completedItems / totalItems) * 100)}% завершено`
  } as any);

  exportData.push({
    '№': '',
    'Пункт проверки': 'Обязательные пункты:',
    'Обязательный': '',
    'Выполнен': `${completedRequired} из ${requiredItems}`,
    'Статус': completedRequired === requiredItems ? 'Все выполнены' : 'Не все выполнены'
  } as any);

  // Create workbook
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(exportData);

  // Set column widths
  ws['!cols'] = [
    { wch: 5 },   // №
    { wch: 50 },  // Пункт проверки
    { wch: 15 },  // Обязательный
    { wch: 15 },  // Выполнен
    { wch: 20 }   // Статус
  ];

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Чек-лист для самопроверки');

  // Generate filename
  const fileName = `checklist_${level}_${new Date().toISOString().split('T')[0]}.xlsx`;

  // Save file
  XLSX.writeFile(wb, fileName);

  return fileName;
};