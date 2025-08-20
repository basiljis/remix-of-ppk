import { AssistanceRecommendation, BlockAssessment } from "./assistanceDirections";

export interface SpecialistAssignment {
  teacher: boolean; // Педагог
  speechTherapist: boolean; // Учитель-логопед
  psychologist: boolean; // Педагог-психолог
  socialWorker: boolean; // Социальный педагог
  needsCPMPK: boolean; // Необходимость направления на ЦПМПК
}

export interface ProtocolConclusion {
  finalGroup: 1 | 2 | 3;
  finalStatus: string;
  specialistAssignments: SpecialistAssignment;
  workFormRecommendations: string[];
  timeframeRecommendations: string;
  cpmkRecommendation?: string;
  conclusionText: string;
}

// Определение необходимости специалистов
export const determineSpecialistAssignments = (
  blockAssessments: BlockAssessment[]
): SpecialistAssignment => {
  const maxGroup = Math.max(...blockAssessments.map(b => b.group.group)) as 1 | 2 | 3;
  
  // Педагог - всегда "ДА" для групп 1 и 2
  const teacher = maxGroup <= 2;
  
  // Учитель-логопед - только для речевого блока при группе 2 или 3
  const speechTherapist = blockAssessments.some(assessment => {
    const isLanguageBlock = assessment.blockTitle.toLowerCase().includes('речев') || 
                           assessment.blockTitle.toLowerCase().includes('речь');
    return isLanguageBlock && assessment.group.group >= 2;
  });
  
  // Педагог-психолог - для регулятивного и когнитивного блоков при группе 2 или 3
  const psychologist = blockAssessments.some(assessment => {
    const isRegulativeBlock = assessment.blockTitle.toLowerCase().includes('регулятив') ||
                              assessment.blockTitle.toLowerCase().includes('самоконтрол');
    const isCognitiveBlock = assessment.blockTitle.toLowerCase().includes('когнитив') ||
                            assessment.blockTitle.toLowerCase().includes('познават') ||
                            assessment.blockTitle.toLowerCase().includes('мышлен');
    return (isRegulativeBlock || isCognitiveBlock) && assessment.group.group >= 2;
  });
  
  // Социальный педагог - для поведенческого блока при группе 3
  const socialWorker = blockAssessments.some(assessment => {
    const isBehavioralBlock = assessment.blockTitle.toLowerCase().includes('поведенч') ||
                             assessment.blockTitle.toLowerCase().includes('поведени');
    return isBehavioralBlock && assessment.group.group === 3;
  });
  
  // Необходимость направления на ЦПМПК - только для группы 3
  const needsCPMPK = maxGroup === 3;
  
  return {
    teacher,
    speechTherapist,
    psychologist,
    socialWorker,
    needsCPMPK
  };
};

// Определение итогового статуса
export const determineFinalStatus = (maxGroup: 1 | 2 | 3): string => {
  switch (maxGroup) {
    case 1:
      return "Обучающийся не нуждается в присвоении статуса, помощь только педагога";
    case 2:
      return "Обучающемуся присваивается статус 'испытывающий трудности в освоении ООП'";
    case 3:
      return "Обучающемуся рекомендовано прохождение ЦПМПК";
    default:
      return "Статус не определен";
  }
};

// Рекомендации по форме работы
export const generateWorkFormRecommendations = (
  maxGroup: 1 | 2 | 3,
  blockAssessments: BlockAssessment[]
): string[] => {
  const recommendations: string[] = [];
  
  if (maxGroup === 1) {
    recommendations.push("Работа в классе с общими методами обучения");
    recommendations.push("Дополнительная поддержка при необходимости");
  } else if (maxGroup === 2) {
    recommendations.push("Индивидуальная работа с обучающимся");
    recommendations.push("Работа в малых подгруппах (2-3 человека)");
    recommendations.push("Дифференцированный подход в классе");
    
    // Специфические рекомендации по блокам
    blockAssessments.forEach(assessment => {
      if (assessment.group.group >= 2) {
        const blockName = assessment.blockTitle.toLowerCase();
        if (blockName.includes('речев')) {
          recommendations.push("Логопедические занятия 2-3 раза в неделю");
        }
        if (blockName.includes('регулятив')) {
          recommendations.push("Тренинги по развитию самоконтроля");
        }
        if (blockName.includes('когнитив')) {
          recommendations.push("Развивающие занятия по когнитивным функциям");
        }
        if (blockName.includes('коммуникат')) {
          recommendations.push("Групповые коммуникативные тренинги");
        }
      }
    });
  } else if (maxGroup === 3) {
    recommendations.push("Интенсивная индивидуальная работа");
    recommendations.push("Работа в паре с более успешным обучающимся");
    recommendations.push("Специализированная коррекционная программа");
    recommendations.push("Возможна необходимость адаптированной программы");
  }
  
  return recommendations;
};

// Сроки предоставления помощи
export const generateTimeframeRecommendations = (maxGroup: 1 | 2 | 3): string => {
  switch (maxGroup) {
    case 1:
      return "Мониторинг состояния через 3 месяца";
    case 2:
      return "Коррекционно-развивающая работа на ближайшие 3 месяца с промежуточной оценкой через 1.5 месяца";
    case 3:
      return "Интенсивная коррекционная работа на ближайшие 3 месяца с еженедельным мониторингом прогресса";
    default:
      return "Сроки не определены";
  }
};

// Рекомендации по ЦПМПК
export const generateCPMPKRecommendation = (
  needsCPMPK: boolean,
  blockAssessments: BlockAssessment[]
): string | undefined => {
  if (!needsCPMPK) return undefined;
  
  const problematicBlocks = blockAssessments
    .filter(assessment => assessment.group.group === 3)
    .map(assessment => assessment.blockTitle)
    .join(', ');
  
  return `Рекомендуется направление на ЦПМПК для углубленной диагностики в связи с выявленными значительными трудностями в следующих областях: ${problematicBlocks}. Необходимо определение специальных образовательных условий и возможной потребности в адаптированной образовательной программе.`;
};

// Формирование полного текста заключения
export const generateConclusionText = (
  childName: string,
  educationLevel: string,
  finalStatus: string,
  specialistAssignments: SpecialistAssignment,
  workFormRecommendations: string[],
  timeframeRecommendations: string,
  cpmkRecommendation?: string
): string => {
  const currentDate = new Date().toLocaleDateString('ru-RU');
  
  let conclusion = `ЗАКЛЮЧЕНИЕ ППК от ${currentDate}\n\n`;
  conclusion += `Обучающийся: ${childName}\n`;
  conclusion += `Уровень образования: ${educationLevel}\n\n`;
  
  conclusion += `ИТОГОВОЕ ЗАКЛЮЧЕНИЕ:\n${finalStatus}\n\n`;
  
  conclusion += `РЕКОМЕНДУЕМЫЕ НАПРАВЛЕНИЯ КОРРЕКЦИОННО-РАЗВИВАЮЩЕЙ ПОМОЩИ:\n`;
  
  if (specialistAssignments.teacher) {
    conclusion += `• Педагог: ДА\n`;
  }
  if (specialistAssignments.speechTherapist) {
    conclusion += `• Учитель-логопед: ДА\n`;
  }
  if (specialistAssignments.psychologist) {
    conclusion += `• Педагог-психолог: ДА\n`;
  }
  if (specialistAssignments.socialWorker) {
    conclusion += `• Социальный педагог: ДА\n`;
  }
  
  conclusion += `\nРЕКОМЕНДУЕМЫЕ ФОРМЫ РАБОТЫ:\n`;
  workFormRecommendations.forEach(recommendation => {
    conclusion += `• ${recommendation}\n`;
  });
  
  conclusion += `\nСРОКИ ПРЕДОСТАВЛЕНИЯ ПОМОЩИ:\n${timeframeRecommendations}\n`;
  
  if (cpmkRecommendation) {
    conclusion += `\nРЕКОМЕНДАЦИИ ПО ЦПМПК:\n${cpmkRecommendation}\n`;
  }
  
  conclusion += `\nДанное заключение действительно в течение календарного года с момента его подписания.`;
  
  return conclusion;
};

// Основная функция для формирования полного заключения протокола
export const generateProtocolConclusion = (
  analysis: AssistanceRecommendation,
  childName: string,
  educationLevel: string
): ProtocolConclusion => {
  const maxGroup = Math.max(...analysis.blockAssessments.map(b => b.group.group)) as 1 | 2 | 3;
  const finalStatus = determineFinalStatus(maxGroup);
  const specialistAssignments = determineSpecialistAssignments(analysis.blockAssessments);
  const workFormRecommendations = generateWorkFormRecommendations(maxGroup, analysis.blockAssessments);
  const timeframeRecommendations = generateTimeframeRecommendations(maxGroup);
  const cpmkRecommendation = generateCPMPKRecommendation(specialistAssignments.needsCPMPK, analysis.blockAssessments);
  
  const conclusionText = generateConclusionText(
    childName,
    educationLevel,
    finalStatus,
    specialistAssignments,
    workFormRecommendations,
    timeframeRecommendations,
    cpmkRecommendation
  );
  
  return {
    finalGroup: maxGroup,
    finalStatus,
    specialistAssignments,
    workFormRecommendations,
    timeframeRecommendations,
    cpmkRecommendation,
    conclusionText
  };
};