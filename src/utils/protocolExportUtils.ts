import * as XLSX from 'xlsx';
import { translateEducationLevel } from './educationLevelTranslations';
import { translateWhobrought } from './whobroughtTranslations';
import { 
  analyzeProtocolResults, 
  BlockAssessment, 
  AssistanceRecommendation,
  determineBlockGroup
} from './assistanceDirections';
import { 
  generateProtocolConclusion, 
  ProtocolConclusion,
  determineSpecialistAssignments,
  determineFinalStatus,
  generateWorkFormRecommendations,
  generateTimeframeRecommendations,
  generateCPMPKRecommendation
} from './protocolRecommendations';

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

// Вычисление статистики по блокам из checklist_data
const calculateBlockStats = (checklistData: any): { blockTitle: string; percentage: number; yesCount: number; totalCount: number; hasEssentialCriteria: boolean }[] => {
  if (!checklistData || typeof checklistData !== 'object') return [];
  
  const blockStats: { [key: string]: { yesCount: number; totalCount: number; hasEssentialCriteria: boolean; sumWeight1: number } } = {};
  
  Object.entries(checklistData).forEach(([category, items]) => {
    if (Array.isArray(items)) {
      items.forEach((item: any) => {
        const blockTitle = item.block || category;
        
        if (!blockStats[blockTitle]) {
          blockStats[blockTitle] = { yesCount: 0, totalCount: 0, hasEssentialCriteria: false, sumWeight1: 0 };
        }
        
        blockStats[blockTitle].totalCount++;
        
        const score = item.score ?? (item.isCompleted ? 1 : 0);
        const weight = item.weight ?? 1;
        
        if (score === 1) {
          blockStats[blockTitle].yesCount++;
          if (weight === 1) {
            blockStats[blockTitle].sumWeight1++;
            blockStats[blockTitle].hasEssentialCriteria = true;
          }
        }
      });
    }
  });
  
  return Object.entries(blockStats).map(([blockTitle, stats]) => {
    // Формула: Yкрит / (сумма Вес1 × Yкрит × 100) или упрощенная версия
    const percentage = stats.totalCount > 0 
      ? Math.round((stats.yesCount / stats.totalCount) * 100) 
      : 0;
    
    return {
      blockTitle,
      percentage,
      yesCount: stats.yesCount,
      totalCount: stats.totalCount,
      hasEssentialCriteria: stats.hasEssentialCriteria
    };
  });
};

// Генерация анализа направлений помощи из checklist_data
const generateAssistanceAnalysis = (checklistData: any, educationLevel: string): { blockAssessments: BlockAssessment[]; overallGroup: number; recommendations: string[] } => {
  const blockStats = calculateBlockStats(checklistData);
  
  const blockAssessments: BlockAssessment[] = blockStats.map(stats => {
    const group = determineBlockGroup(stats.blockTitle, stats.percentage, stats.hasEssentialCriteria);
    return {
      blockTitle: stats.blockTitle,
      percentage: stats.percentage,
      hasEssentialCriteria: stats.hasEssentialCriteria,
      group
    };
  });
  
  // Определяем максимальную группу
  const assessmentsWithGroups = blockAssessments.filter(a => a.group !== null);
  const overallGroup = assessmentsWithGroups.length > 0 
    ? Math.max(...assessmentsWithGroups.map(a => a.group!.group)) 
    : 1;
  
  // Генерируем рекомендации
  const recommendations: string[] = [];
  if (overallGroup === 1) {
    recommendations.push('Обучающийся успешно справляется с образовательной программой');
    recommendations.push('Рекомендуется продолжить обучение по основной образовательной программе');
  } else if (overallGroup === 2) {
    recommendations.push('Требуется организация коррекционно-развивающей работы');
    blockAssessments.forEach(assessment => {
      if (assessment.group && assessment.group.group >= 2) {
        const blockName = assessment.blockTitle.toLowerCase();
        if (blockName.includes('речев')) recommendations.push('- Логопедическая помощь');
        if (blockName.includes('регулятив')) recommendations.push('- Развитие навыков самоконтроля');
        if (blockName.includes('когнитив')) recommendations.push('- Развитие познавательных процессов');
        if (blockName.includes('коммуникат')) recommendations.push('- Развитие коммуникативных навыков');
        if (blockName.includes('поведенч')) recommendations.push('- Коррекция поведения');
      }
    });
  } else if (overallGroup === 3) {
    recommendations.push('ОБЯЗАТЕЛЬНО: Направление на ЦПМПК');
    recommendations.push('Разработка индивидуального образовательного маршрута');
  }
  
  return { blockAssessments, overallGroup, recommendations };
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
  if (protocol.protocol_data?.parentConsent !== undefined) {
    text += `- Согласие родителя: ${protocol.protocol_data.parentConsent ? 'Да' : 'Нет'}\n`;
  }
  text += `- Дата создания: ${new Date(protocol.created_at).toLocaleDateString()}\n`;
  if (protocol.updated_at) {
    text += `- Дата обновления: ${new Date(protocol.updated_at).toLocaleDateString()}\n`;
  }
  text += `\n`;

  // Добавляем результаты по блокам
  if (protocol.checklist_data) {
    const analysis = generateAssistanceAnalysis(protocol.checklist_data, protocol.education_level);
    
    text += `РЕЗУЛЬТАТЫ ПО БЛОКАМ:\n`;
    text += `---------------------\n`;
    analysis.blockAssessments.forEach(assessment => {
      const groupText = assessment.group 
        ? `Группа ${assessment.group.group} - ${assessment.group.description}`
        : 'Группа не определена';
      text += `${assessment.blockTitle}: ${assessment.percentage}% (${groupText})\n`;
    });
    text += `\nОБЩАЯ ГРУППА: ${analysis.overallGroup}\n`;
    text += `\n`;
    
    text += `РЕКОМЕНДАЦИИ:\n`;
    text += `-------------\n`;
    analysis.recommendations.forEach(rec => {
      text += `${rec}\n`;
    });
    text += `\n`;
  }

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
  // Создаем книгу
  const wb = XLSX.utils.book_new();

  // ========== ЛИСТ 1: Основная информация ==========
  const mainData = [
    { 'Поле': 'ФИО обучающегося', 'Значение': protocol.child_name },
    { 'Поле': 'Класс/группа', 'Значение': `${protocol.protocol_data?.childData?.classNumber || ''}${protocol.protocol_data?.childData?.classLetter || ''}` },
    ...(protocol.child_birth_date ? [{ 'Поле': 'Дата рождения', 'Значение': new Date(protocol.child_birth_date).toLocaleDateString() }] : []),
    { 'Поле': 'Инициатор обращения', 'Значение': translateWhobrought(protocol.protocol_data?.childData?.whobrought) },
    { 'Поле': 'ФИО родителя/представителя', 'Значение': protocol.protocol_data?.childData?.parentName || 'Не указано' },
    { 'Поле': 'Телефон родителя', 'Значение': protocol.protocol_data?.childData?.parentPhone || 'Не указан' },
    { 'Поле': 'Повод обращения в ППк', 'Значение': protocol.consultation_reason || 'Не указан' },
    { 'Поле': 'Коллегиальное заключение', 'Значение': protocol.protocol_data?.collegialConclusion || 'Не указано' },
    { 'Поле': 'Результат обращения', 'Значение': protocol.protocol_data?.appealResult || 'Не указан' },
    { 'Поле': 'Цель направления', 'Значение': protocol.protocol_data?.purposeOfReferral || 'Не указана' },
    { 'Поле': 'Перечень документов', 'Значение': protocol.protocol_data?.documents?.filter((doc: any) => doc.present).map((doc: any) => doc.name).join(', ') || 'Не указаны' },
    { 'Поле': 'Организация', 'Значение': protocol.organization?.name || 'Не указана' },
    { 'Поле': 'Уровень образования', 'Значение': translateEducationLevel(protocol.education_level) },
    { 'Поле': 'Тип консультации', 'Значение': protocol.consultation_type === 'primary' ? 'Первичная' : 'Повторная' },
    ...(protocol.meeting_type ? [{ 'Поле': 'Тип заседания', 'Значение': protocol.meeting_type === 'scheduled' ? 'Плановое' : 'Внеплановое' }] : []),
    ...(protocol.ppk_number ? [{ 'Поле': 'Номер ППК', 'Значение': protocol.ppk_number }] : []),
    ...(protocol.session_topic ? [{ 'Поле': 'Тема заседания', 'Значение': protocol.session_topic }] : []),
    { 'Поле': 'Статус', 'Значение': protocol.status === 'completed' ? 'Завершен' : 'Черновик' },
    { 'Поле': 'Готовность (%)', 'Значение': `${protocol.completion_percentage}%` },
    ...(protocol.protocol_data?.parentConsent !== undefined ? [{ 'Поле': 'Согласие родителя', 'Значение': protocol.protocol_data.parentConsent ? 'Да' : 'Нет' }] : []),
    ...(protocol.protocol_data?.parentConsentAcknowledged !== undefined ? [{ 'Поле': 'Ознакомление с заключением', 'Значение': protocol.protocol_data.parentConsentAcknowledged ? 'Да' : 'Нет' }] : []),
    { 'Поле': 'Дата создания', 'Значение': new Date(protocol.created_at).toLocaleDateString() },
    ...(protocol.updated_at ? [{ 'Поле': 'Дата обновления', 'Значение': new Date(protocol.updated_at).toLocaleDateString() }] : [])
  ];

  const wsMain = XLSX.utils.json_to_sheet(mainData);
  wsMain['!cols'] = [{ wch: 30 }, { wch: 60 }];
  XLSX.utils.book_append_sheet(wb, wsMain, 'Основная информация');

  // ========== ЛИСТ 2: Результаты по блокам ==========
  if (protocol.checklist_data) {
    const analysis = generateAssistanceAnalysis(protocol.checklist_data, protocol.education_level);
    
    const blockResultsData = analysis.blockAssessments.map(assessment => ({
      'Блок': assessment.blockTitle,
      'Процент трудностей': `${assessment.percentage}%`,
      'Группа': assessment.group ? assessment.group.group : '-',
      'Статус': assessment.group ? (
        assessment.group.status === 'no_difficulties' ? 'Трудности не выявлены' :
        assessment.group.status === 'has_difficulties' ? 'Испытывает трудности' :
        'Рекомендовано ЦПМПК'
      ) : 'Не определен',
      'Описание': assessment.group?.description || '',
      'Существенные критерии': assessment.hasEssentialCriteria ? 'Да' : 'Нет'
    }));
    
    // Добавляем итоговую строку
    blockResultsData.push({
      'Блок': 'ИТОГО',
      'Процент трудностей': '',
      'Группа': analysis.overallGroup as any,
      'Статус': analysis.overallGroup === 1 ? 'Помощь не требуется' :
               analysis.overallGroup === 2 ? 'Требуется помощь специалистов' :
               'Требуется направление на ЦПМПК',
      'Описание': '',
      'Существенные критерии': ''
    });
    
    const wsBlocks = XLSX.utils.json_to_sheet(blockResultsData);
    wsBlocks['!cols'] = [{ wch: 25 }, { wch: 18 }, { wch: 10 }, { wch: 25 }, { wch: 50 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, wsBlocks, 'Результаты по блокам');
  }

  // ========== ЛИСТ 3: Направления помощи и рекомендации ==========
  if (protocol.checklist_data) {
    const analysis = generateAssistanceAnalysis(protocol.checklist_data, protocol.education_level);
    const specialistAssignments = determineSpecialistAssignments(analysis.blockAssessments);
    const maxGroup = analysis.overallGroup as 1 | 2 | 3;
    const workFormRecommendations = generateWorkFormRecommendations(maxGroup, analysis.blockAssessments);
    const timeframeRecommendations = generateTimeframeRecommendations(maxGroup);
    const cpmkRecommendation = generateCPMPKRecommendation(specialistAssignments.needsCPMPK, analysis.blockAssessments);
    
    const recommendationsData = [
      { 'Раздел': 'ИТОГОВЫЙ СТАТУС', 'Значение': determineFinalStatus(maxGroup) },
      { 'Раздел': '', 'Значение': '' },
      { 'Раздел': 'НАПРАВЛЕНИЯ ПОМОЩИ', 'Значение': '' },
      { 'Раздел': 'Педагог', 'Значение': specialistAssignments.teacher ? 'Да' : 'Нет' },
      { 'Раздел': 'Учитель-логопед', 'Значение': specialistAssignments.speechTherapist ? 'Да' : 'Нет' },
      { 'Раздел': 'Педагог-психолог', 'Значение': specialistAssignments.psychologist ? 'Да' : 'Нет' },
      { 'Раздел': 'Социальный педагог', 'Значение': specialistAssignments.socialWorker ? 'Да' : 'Нет' },
      { 'Раздел': 'Необходимость ЦПМПК', 'Значение': specialistAssignments.needsCPMPK ? 'Да' : 'Нет' },
      { 'Раздел': '', 'Значение': '' },
      { 'Раздел': 'ФОРМЫ РАБОТЫ', 'Значение': '' },
      ...workFormRecommendations.map(rec => ({ 'Раздел': '•', 'Значение': rec })),
      { 'Раздел': '', 'Значение': '' },
      { 'Раздел': 'СРОКИ ПОМОЩИ', 'Значение': timeframeRecommendations },
      { 'Раздел': '', 'Значение': '' },
      { 'Раздел': 'РЕКОМЕНДАЦИИ', 'Значение': '' },
      ...analysis.recommendations.map(rec => ({ 'Раздел': '•', 'Значение': rec }))
    ];
    
    if (cpmkRecommendation) {
      recommendationsData.push({ 'Раздел': '', 'Значение': '' });
      recommendationsData.push({ 'Раздел': 'РЕКОМЕНДАЦИИ ПО ЦПМПК', 'Значение': cpmkRecommendation });
    }
    
    const wsRecommendations = XLSX.utils.json_to_sheet(recommendationsData);
    wsRecommendations['!cols'] = [{ wch: 25 }, { wch: 80 }];
    XLSX.utils.book_append_sheet(wb, wsRecommendations, 'Рекомендации');
  }

  // ========== ЛИСТ 4: Чек-листы детально ==========
  if (protocol.checklist_data && Object.keys(protocol.checklist_data).length > 0) {
    const checklistData: any[] = [];
    let currentBlock = '';
    let currentTopic = '';
    
    Object.entries(protocol.checklist_data).forEach(([category, items]) => {
      if (Array.isArray(items)) {
        items.forEach((item: any, index: number) => {
          // Добавляем строку-заголовок блока
          if (item.block && item.block !== currentBlock) {
            currentBlock = item.block;
            checklistData.push({
              'Блок': `=== ${currentBlock.toUpperCase()} ===`,
              'Топик': '',
              'Подтопик': '',
              'Описание': '',
              'Оценка': '',
              'Вес': '',
              'Балл 0': '',
              'Балл 1': ''
            });
          }
          
          // Добавляем строку-заголовок топика
          if (item.topic && item.topic !== currentTopic) {
            currentTopic = item.topic;
            checklistData.push({
              'Блок': '',
              'Топик': currentTopic,
              'Подтопик': '',
              'Описание': '',
              'Оценка': '',
              'Вес': '',
              'Балл 0': '',
              'Балл 1': ''
            });
          }
          
          const score = item.score ?? (item.isCompleted ? 1 : 0);
          
          checklistData.push({
            'Блок': '',
            'Топик': '',
            'Подтопик': item.subtopic || '',
            'Описание': item.description || item.text || item.name || '',
            'Оценка': score === 1 ? 'Да (трудность)' : score === 0 ? 'Нет' : 'Не оценено',
            'Вес': item.weight ?? 1,
            'Балл 0': item.score_0_label || 'Норма',
            'Балл 1': item.score_1_label || 'Трудность'
          });
        });
      }
    });
    
    if (checklistData.length > 0) {
      const wsChecklist = XLSX.utils.json_to_sheet(checklistData);
      wsChecklist['!cols'] = [
        { wch: 25 }, // Блок
        { wch: 30 }, // Топик
        { wch: 25 }, // Подтопик
        { wch: 50 }, // Описание
        { wch: 15 }, // Оценка
        { wch: 8 },  // Вес
        { wch: 20 }, // Балл 0
        { wch: 20 }  // Балл 1
      ];
      XLSX.utils.book_append_sheet(wb, wsChecklist, 'Чек-листы детально');
    }
  }

  // ========== ЛИСТ 5: Документы ==========
  if (protocol.protocol_data?.documents && Array.isArray(protocol.protocol_data.documents)) {
    const documentsData = protocol.protocol_data.documents.map((doc: any) => ({
      'Документ': doc.name || 'Без названия',
      'Предоставлен': doc.present ? 'Да' : 'Нет'
    }));
    
    const wsDocuments = XLSX.utils.json_to_sheet(documentsData);
    wsDocuments['!cols'] = [{ wch: 50 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, wsDocuments, 'Документы');
  }

  // ========== ЛИСТ 6: Заключение (текст) ==========
  if (protocol.checklist_data) {
    const analysis = generateAssistanceAnalysis(protocol.checklist_data, protocol.education_level);
    const specialistAssignments = determineSpecialistAssignments(analysis.blockAssessments);
    const maxGroup = analysis.overallGroup as 1 | 2 | 3;
    const finalStatus = determineFinalStatus(maxGroup);
    const workFormRecommendations = generateWorkFormRecommendations(maxGroup, analysis.blockAssessments);
    const timeframeRecommendations = generateTimeframeRecommendations(maxGroup);
    const cpmkRecommendation = generateCPMPKRecommendation(specialistAssignments.needsCPMPK, analysis.blockAssessments);
    
    const currentDate = new Date().toLocaleDateString('ru-RU');
    
    const conclusionLines = [
      { 'Текст заключения': `ЗАКЛЮЧЕНИЕ ППК от ${currentDate}` },
      { 'Текст заключения': '' },
      { 'Текст заключения': `Обучающийся: ${protocol.child_name}` },
      { 'Текст заключения': `Уровень образования: ${translateEducationLevel(protocol.education_level)}` },
      { 'Текст заключения': `Организация: ${protocol.organization?.name || 'Не указана'}` },
      { 'Текст заключения': '' },
      { 'Текст заключения': `ИТОГОВОЕ ЗАКЛЮЧЕНИЕ:` },
      { 'Текст заключения': finalStatus },
      { 'Текст заключения': '' },
      { 'Текст заключения': `РЕЗУЛЬТАТЫ ДИАГНОСТИКИ ПО БЛОКАМ:` }
    ];
    
    analysis.blockAssessments.forEach(assessment => {
      const groupText = assessment.group 
        ? `Группа ${assessment.group.group}`
        : 'Группа не определена';
      conclusionLines.push({ 'Текст заключения': `• ${assessment.blockTitle}: ${assessment.percentage}% трудностей (${groupText})` });
    });
    
    conclusionLines.push({ 'Текст заключения': '' });
    conclusionLines.push({ 'Текст заключения': 'РЕКОМЕНДУЕМЫЕ НАПРАВЛЕНИЯ ПОМОЩИ:' });
    if (specialistAssignments.teacher) conclusionLines.push({ 'Текст заключения': '• Педагог: ДА' });
    if (specialistAssignments.speechTherapist) conclusionLines.push({ 'Текст заключения': '• Учитель-логопед: ДА' });
    if (specialistAssignments.psychologist) conclusionLines.push({ 'Текст заключения': '• Педагог-психолог: ДА' });
    if (specialistAssignments.socialWorker) conclusionLines.push({ 'Текст заключения': '• Социальный педагог: ДА' });
    
    conclusionLines.push({ 'Текст заключения': '' });
    conclusionLines.push({ 'Текст заключения': 'РЕКОМЕНДУЕМЫЕ ФОРМЫ РАБОТЫ:' });
    workFormRecommendations.forEach(rec => {
      conclusionLines.push({ 'Текст заключения': `• ${rec}` });
    });
    
    conclusionLines.push({ 'Текст заключения': '' });
    conclusionLines.push({ 'Текст заключения': `СРОКИ ПРЕДОСТАВЛЕНИЯ ПОМОЩИ: ${timeframeRecommendations}` });
    
    if (cpmkRecommendation) {
      conclusionLines.push({ 'Текст заключения': '' });
      conclusionLines.push({ 'Текст заключения': 'РЕКОМЕНДАЦИИ ПО ЦПМПК:' });
      conclusionLines.push({ 'Текст заключения': cpmkRecommendation });
    }
    
    conclusionLines.push({ 'Текст заключения': '' });
    conclusionLines.push({ 'Текст заключения': 'Данное заключение действительно в течение календарного года с момента его подписания.' });
    
    const wsConclusion = XLSX.utils.json_to_sheet(conclusionLines);
    wsConclusion['!cols'] = [{ wch: 100 }];
    XLSX.utils.book_append_sheet(wb, wsConclusion, 'Заключение');
  }

  // Генерируем имя файла и сохраняем
  const fileName = `protocol_${protocol.child_name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
  
  return fileName;
};
