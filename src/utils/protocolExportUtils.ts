import * as XLSX from 'xlsx';

export interface ProtocolData {
  child_name: string;
  child_birth_date?: string;
  education_level: string;
  organization?: { name: string };
  status: string;
  consultation_type: string;
  consultation_reason: string;
  meeting_type?: string;
  ppk_number?: string;
  session_topic?: string;
  completion_percentage: number;
  is_ready?: boolean;
  created_at: string;
  updated_at?: string;
  protocol_data?: any;
  checklist_data?: any;
}

// Перевод уровней образования на кириллицу
const educationLevelTranslations: Record<string, string> = {
  'preschool': 'Дошкольное образование',
  'primary': 'Начальное общее образование',
  'secondary': 'Основное общее образование',
  'high': 'Среднее общее образование',
  'vocational': 'Среднее профессиональное образование',
  'higher': 'Высшее образование'
};

const translateEducationLevel = (level: string): string => {
  return educationLevelTranslations[level] || level;
};

// Форматирование результатов чек-листов
export const formatChecklistResults = (checklistData: any): string => {
  if (!checklistData || Object.keys(checklistData).length === 0) {
    return 'Данные отсутствуют';
  }

  let result = '';
  
  Object.entries(checklistData).forEach(([categoryKey, items], categoryIndex) => {
    if (categoryIndex > 0) result += '\n';
    
    // Форматируем название категории
    const categoryName = categoryKey.replace(/_/g, ' ').toUpperCase();
    result += `${categoryName}:\n`;
    
    if (Array.isArray(items)) {
      let completedCount = 0;
      let totalCount = items.length;
      
      items.forEach((item: any, index: number) => {
        if (typeof item === 'object' && item !== null) {
          const status = item.isCompleted ? '✓' : '✗';
          const text = item.text || item.name || `Пункт ${index + 1}`;
          result += `  ${status} ${text}\n`;
          
          if (item.isCompleted) completedCount++;
        } else {
          result += `  • ${item}\n`;
        }
      });
      
      if (totalCount > 0) {
        const percentage = Math.round((completedCount / totalCount) * 100);
        result += `  Выполнено: ${completedCount}/${totalCount} (${percentage}%)\n`;
      }
    } else if (typeof items === 'object' && items !== null) {
      Object.entries(items).forEach(([key, value]) => {
        result += `  ${key}: ${value}\n`;
      });
    } else {
      result += `  ${items}\n`;
    }
  });

  return result;
};

export const formatProtocolToText = (protocol: ProtocolData): string => {
  let text = `ПРОТОКОЛ ПСИХОЛОГО-ПЕДАГОГИЧЕСКОЙ КОНСУЛЬТАЦИИ\n`;
  text += `==============================================\n\n`;
  
  text += `ОБЩАЯ ИНФОРМАЦИЯ:\n`;
  text += `- ФИО ребенка: ${protocol.child_name}\n`;
  if (protocol.child_birth_date) {
    text += `- Дата рождения: ${new Date(protocol.child_birth_date).toLocaleDateString()}\n`;
  }
  text += `- Организация: ${protocol.organization?.name || 'Не указана'}\n`;
  text += `- Уровень образования: ${translateEducationLevel(protocol.education_level)}\n`;
  text += `- Тип консультации: ${protocol.consultation_type}\n`;
  text += `- Причина консультации: ${protocol.consultation_reason}\n`;
  if (protocol.meeting_type) {
    text += `- Тип заседания: ${protocol.meeting_type === 'scheduled' ? 'Плановое' : protocol.meeting_type === 'unscheduled' ? 'Внеплановое' : protocol.meeting_type}\n`;
  }
  if (protocol.ppk_number) {
    text += `- Номер ППК: ${protocol.ppk_number}\n`;
  }
  if (protocol.session_topic) {
    text += `- Тема заседания: ${protocol.session_topic}\n`;
  }
  text += `- Статус: ${protocol.status}\n`;
  text += `- Готовность: ${protocol.completion_percentage}%\n`;
  if (protocol.is_ready !== undefined) {
    text += `- Готов к завершению: ${protocol.is_ready ? 'Да' : 'Нет'}\n`;
  }
  text += `- Дата создания: ${new Date(protocol.created_at).toLocaleDateString()}\n`;
  if (protocol.updated_at) {
    text += `- Дата обновления: ${new Date(protocol.updated_at).toLocaleDateString()}\n`;
  }
  text += `\n`;

  if (protocol.checklist_data && Object.keys(protocol.checklist_data).length > 0) {
    text += `РЕЗУЛЬТАТЫ ЧЕКЛ-ЛИСТОВ:\n`;
    text += `----------------------\n`;
    text += formatChecklistResults(protocol.checklist_data);
    text += `\n`;
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
    { 'Поле': 'ФИО обучающегося', 'Значение': protocol.child_name },
    { 'Поле': 'Класс/группа', 'Значение': `${protocol.protocol_data?.childData?.classNumber || ''}${protocol.protocol_data?.childData?.classLetter || ''}` },
    ...(protocol.child_birth_date ? [{ 'Поле': 'Дата рождения', 'Значение': new Date(protocol.child_birth_date).toLocaleDateString() }] : []),
    { 'Поле': 'Инициатор обращения', 'Значение': protocol.protocol_data?.childData?.whobrought || 'Не указан' },
    { 'Поле': 'Повод обращения в ППк', 'Значение': protocol.consultation_reason || 'Не указан' },
    { 'Поле': 'Коллегиальное заключение', 'Значение': protocol.protocol_data?.collegialConclusion || 'Не указано' },
    { 'Поле': 'Результат обращения', 'Значение': protocol.protocol_data?.appealResult || 'Не указан' },
    { 'Поле': 'Цель направления', 'Значение': protocol.protocol_data?.purposeOfReferral || 'Не указана' },
    { 'Поле': 'Перечень документов представленных на ППк', 'Значение': protocol.protocol_data?.documents?.map((doc: any) => doc.present ? doc.name : null).filter(Boolean).join(', ') || 'Не указаны' },
    { 'Поле': 'Организация', 'Значение': protocol.organization?.name || 'Не указана' },
    { 'Поле': 'Уровень образования', 'Значение': translateEducationLevel(protocol.education_level) },
    { 'Поле': 'Тип консультации', 'Значение': protocol.consultation_type === 'primary' ? 'Первичная' : 'Повторная' },
    ...(protocol.meeting_type ? [{ 'Поле': 'Тип заседания', 'Значение': protocol.meeting_type === 'scheduled' ? 'Плановое' : protocol.meeting_type === 'unscheduled' ? 'Внеплановое' : protocol.meeting_type }] : []),
    ...(protocol.ppk_number ? [{ 'Поле': 'Номер ППК', 'Значение': protocol.ppk_number }] : []),
    ...(protocol.session_topic ? [{ 'Поле': 'Тема заседания', 'Значение': protocol.session_topic }] : []),
    { 'Поле': 'Статус', 'Значение': protocol.status === 'completed' ? 'Завершен' : 'Черновик' },
    { 'Поле': 'Готовность (%)', 'Значение': protocol.completion_percentage },
    ...(protocol.is_ready !== undefined ? [{ 'Поле': 'Готов к завершению', 'Значение': protocol.is_ready ? 'Да' : 'Нет' }] : []),
    { 'Поле': 'Дата создания', 'Значение': new Date(protocol.created_at).toLocaleDateString() },
    ...(protocol.updated_at ? [{ 'Поле': 'Дата обновления', 'Значение': new Date(protocol.updated_at).toLocaleDateString() }] : [])
  ];

  // Создаем книгу
  const wb = XLSX.utils.book_new();
  
  // Основная информация
  const wsMain = XLSX.utils.json_to_sheet(mainData);
  wsMain['!cols'] = [{ wch: 25 }, { wch: 50 }];
  XLSX.utils.book_append_sheet(wb, wsMain, 'Основная информация');

  // Данные чек-листов с группировкой по топикам
  if (protocol.checklist_data && Object.keys(protocol.checklist_data).length > 0) {
    const checklistData: any[] = [];
    let currentTopic = '';
    
    Object.entries(protocol.checklist_data).forEach(([category, items]) => {
      if (Array.isArray(items)) {
        items.forEach((item: any, index: number) => {
          // Если есть топик и он отличается от текущего, добавляем строку-заголовок
          if (item.topic && item.topic !== currentTopic) {
            currentTopic = item.topic;
            checklistData.push({
              'Блок': item.block || '',
              'Топик': currentTopic,
              'Подтопик': '',
              'Пункт': '',
              'Описание': '',
              'Статус': '',
              'Обязательный': ''
            });
          }
          
          checklistData.push({
            'Блок': item.block || '',
            'Топик': '',
            'Подтопик': item.subtopic || '',
            'Пункт': `${index + 1}`,
            'Описание': item.description || item.text || item.name || '',
            'Статус': item.isCompleted !== undefined ? (item.isCompleted ? 'Выполнено' : 'Не выполнено') : '',
            'Обязательный': item.isRequired !== undefined ? (item.isRequired ? 'Да' : 'Нет') : ''
          });
        });
      }
    });
    
    if (checklistData.length > 0) {
      const wsChecklist = XLSX.utils.json_to_sheet(checklistData);
      wsChecklist['!cols'] = [{ wch: 15 }, { wch: 25 }, { wch: 25 }, { wch: 8 }, { wch: 40 }, { wch: 15 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(wb, wsChecklist, 'Чек-листы');
    }
  }

  // Данные протокола
  if (protocol.protocol_data && Object.keys(protocol.protocol_data).length > 0) {
    const formatValue = (value: any): string => {
      if (value === null || value === undefined) return '';
      if (typeof value === 'boolean') return value ? 'Да' : 'Нет';
      if (Array.isArray(value)) return value.join(', ');
      if (typeof value === 'object') return JSON.stringify(value, null, 2);
      return String(value);
    };

    const protocolDataArray = Object.entries(protocol.protocol_data).map(([key, value]) => ({
      'Параметр': key,
      'Значение': formatValue(value)
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