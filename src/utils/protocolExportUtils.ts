import * as XLSX from 'xlsx';

export interface ProtocolData {
  child_name: string;
  education_level: string;
  organization?: { name: string };
  status: string;
  consultation_type: string;
  consultation_reason: string;
  completion_percentage: number;
  created_at: string;
  protocol_data?: any;
  checklist_data?: any;
}

export const formatProtocolToText = (protocol: ProtocolData): string => {
  let text = `ПРОТОКОЛ ПСИХОЛОГО-ПЕДАГОГИЧЕСКОЙ КОНСУЛЬТАЦИИ\n`;
  text += `==============================================\n\n`;
  
  text += `ОБЩАЯ ИНФОРМАЦИЯ:\n`;
  text += `- ФИО ребенка: ${protocol.child_name}\n`;
  text += `- Организация: ${protocol.organization?.name || 'Не указана'}\n`;
  text += `- Уровень образования: ${protocol.education_level}\n`;
  text += `- Тип консультации: ${protocol.consultation_type}\n`;
  text += `- Причина консультации: ${protocol.consultation_reason}\n`;
  text += `- Статус: ${protocol.status}\n`;
  text += `- Готовность: ${protocol.completion_percentage}%\n`;
  text += `- Дата создания: ${new Date(protocol.created_at).toLocaleDateString()}\n\n`;

  if (protocol.checklist_data && Object.keys(protocol.checklist_data).length > 0) {
    text += `ДАННЫЕ ЧЕКЛ-ЛИСТОВ:\n`;
    text += `------------------\n`;
    
    Object.entries(protocol.checklist_data).forEach(([key, value]) => {
      text += `\n${key.toUpperCase()}:\n`;
      if (Array.isArray(value)) {
        value.forEach((item: any, index: number) => {
          if (typeof item === 'object' && item !== null) {
            text += `  ${index + 1}. ${item.text || item.name || JSON.stringify(item)}\n`;
            if (item.isCompleted !== undefined) {
              text += `     Статус: ${item.isCompleted ? 'Выполнено' : 'Не выполнено'}\n`;
            }
            if (item.isRequired !== undefined) {
              text += `     Обязательный: ${item.isRequired ? 'Да' : 'Нет'}\n`;
            }
          } else {
            text += `  ${index + 1}. ${item}\n`;
          }
        });
      } else if (typeof value === 'object' && value !== null) {
        Object.entries(value).forEach(([subKey, subValue]) => {
          text += `  ${subKey}: ${typeof subValue === 'object' ? JSON.stringify(subValue, null, 2) : subValue}\n`;
        });
      } else {
        text += `  ${value}\n`;
      }
    });
  }

  if (protocol.protocol_data && Object.keys(protocol.protocol_data).length > 0) {
    text += `\nДАННЫЕ ПРОТОКОЛА:\n`;
    text += `----------------\n`;
    
    Object.entries(protocol.protocol_data).forEach(([key, value]) => {
      text += `${key}: ${typeof value === 'object' ? JSON.stringify(value, null, 2) : value}\n`;
    });
  }

  return text;
};

export const exportProtocolToText = (protocol: ProtocolData) => {
  const textData = formatProtocolToText(protocol);
  const blob = new Blob([textData], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const fileName = `protocol_${protocol.child_name}_${new Date().toISOString().split('T')[0]}.txt`;
  
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', url);
  linkElement.setAttribute('download', fileName);
  linkElement.click();
  
  URL.revokeObjectURL(url);
  return fileName;
};

export const exportProtocolToXLS = (protocol: ProtocolData) => {
  // Основная информация о протоколе
  const mainData = [
    { 'Поле': 'ФИО ребенка', 'Значение': protocol.child_name },
    { 'Поле': 'Организация', 'Значение': protocol.organization?.name || 'Не указана' },
    { 'Поле': 'Уровень образования', 'Значение': protocol.education_level },
    { 'Поле': 'Тип консультации', 'Значение': protocol.consultation_type },
    { 'Поле': 'Причина консультации', 'Значение': protocol.consultation_reason },
    { 'Поле': 'Статус', 'Значение': protocol.status },
    { 'Поле': 'Готовность (%)', 'Значение': protocol.completion_percentage },
    { 'Поле': 'Дата создания', 'Значение': new Date(protocol.created_at).toLocaleDateString() }
  ];

  // Создаем книгу
  const wb = XLSX.utils.book_new();
  
  // Основная информация
  const wsMain = XLSX.utils.json_to_sheet(mainData);
  wsMain['!cols'] = [{ wch: 25 }, { wch: 50 }];
  XLSX.utils.book_append_sheet(wb, wsMain, 'Основная информация');

  // Данные чек-листов
  if (protocol.checklist_data && Object.keys(protocol.checklist_data).length > 0) {
    const checklistData: any[] = [];
    
    Object.entries(protocol.checklist_data).forEach(([category, items]) => {
      checklistData.push({
        'Категория': category,
        'Пункт': '',
        'Статус': '',
        'Обязательный': '',
        'Описание': ''
      });
      
      if (Array.isArray(items)) {
        items.forEach((item: any, index: number) => {
          checklistData.push({
            'Категория': '',
            'Пункт': `${index + 1}`,
            'Статус': item.isCompleted !== undefined ? (item.isCompleted ? 'Выполнено' : 'Не выполнено') : '',
            'Обязательный': item.isRequired !== undefined ? (item.isRequired ? 'Да' : 'Нет') : '',
            'Описание': item.text || item.name || JSON.stringify(item)
          });
        });
      }
    });
    
    if (checklistData.length > 0) {
      const wsChecklist = XLSX.utils.json_to_sheet(checklistData);
      wsChecklist['!cols'] = [{ wch: 20 }, { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 50 }];
      XLSX.utils.book_append_sheet(wb, wsChecklist, 'Чек-листы');
    }
  }

  // Данные протокола
  if (protocol.protocol_data && Object.keys(protocol.protocol_data).length > 0) {
    const protocolDataArray = Object.entries(protocol.protocol_data).map(([key, value]) => ({
      'Параметр': key,
      'Значение': typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)
    }));
    
    const wsProtocol = XLSX.utils.json_to_sheet(protocolDataArray);
    wsProtocol['!cols'] = [{ wch: 30 }, { wch: 50 }];
    XLSX.utils.book_append_sheet(wb, wsProtocol, 'Данные протокола');
  }

  // Генерируем имя файла и сохраняем
  const fileName = `protocol_${protocol.child_name}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
  
  return fileName;
};