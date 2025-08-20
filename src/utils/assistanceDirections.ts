import { ProtocolChecklistBlock } from "@/hooks/useProtocolChecklistData";

export interface AssistanceGroup {
  group: 1 | 2 | 3;
  status: 'no_difficulties' | 'has_difficulties' | 'needs_cpmpk';
  description: string;
  color: 'success' | 'warning' | 'destructive';
}

export interface BlockAssessment {
  blockTitle: string;
  percentage: number;
  hasEssentialCriteria: boolean;
  group: AssistanceGroup | null;
}

export interface AssistanceRecommendation {
  overallGroup: AssistanceGroup;
  blockAssessments: BlockAssessment[];
  recommendations: string[];
}

// Функция для определения цвета по проценту
export const getPercentageColor = (percentage: number): 'success' | 'warning' | 'destructive' => {
  if (percentage <= 25) return 'success';
  if (percentage <= 60) return 'warning';
  return 'destructive';
};

// Функция для определения группы по блоку
export const determineBlockGroup = (
  blockTitle: string, 
  percentage: number, 
  hasEssentialCriteria: boolean
): AssistanceGroup | null => {
  // Если процент равен 0, группа не присваивается
  if (percentage === 0) {
    return null;
  }
  
  const normalizedTitle = blockTitle.toLowerCase();
  
  // Речевой блок
  if (normalizedTitle.includes('речев') || normalizedTitle.includes('речь')) {
    if (!hasEssentialCriteria && percentage <= 25) {
      return {
        group: 1,
        status: 'no_difficulties',
        description: 'Обучающемуся не присваивается статус "испытывающий трудности"',
        color: 'success'
      };
    }
    if ((!hasEssentialCriteria && percentage > 25) || (hasEssentialCriteria && percentage <= 60)) {
      return {
        group: 2,
        status: 'has_difficulties',
        description: 'Обучающемуся присваивается статус "испытывающий трудности"',
        color: 'warning'
      };
    }
    if (hasEssentialCriteria && percentage > 60) {
      return {
        group: 3,
        status: 'needs_cpmpk',
        description: 'Обучающемуся рекомендовано прохождение ЦПМПК',
        color: 'destructive'
      };
    }
  }
  
  // Регулятивный блок
  if (normalizedTitle.includes('регулятив') || normalizedTitle.includes('самоконтрол')) {
    if (!hasEssentialCriteria && percentage <= 45) {
      return {
        group: 1,
        status: 'no_difficulties',
        description: 'Обучающемуся не присваивается статус "испытывающий трудности"',
        color: 'success'
      };
    }
    // Группа 2 для всех остальных случаев
    return {
      group: 2,
      status: 'has_difficulties',
      description: 'Обучающемуся присваивается статус "испытывающий трудности"',
      color: 'warning'
    };
  }
  
  // Когнитивный блок
  if (normalizedTitle.includes('когнитив') || normalizedTitle.includes('познават') || normalizedTitle.includes('мышлен')) {
    if (!hasEssentialCriteria && percentage <= 25) {
      return {
        group: 1,
        status: 'no_difficulties',
        description: 'Обучающемуся не присваивается статус "испытывающий трудности"',
        color: 'success'
      };
    }
    if ((!hasEssentialCriteria && percentage > 25) || (hasEssentialCriteria && percentage <= 60)) {
      return {
        group: 2,
        status: 'has_difficulties',
        description: 'Обучающемуся присваивается статус "испытывающий трудности"',
        color: 'warning'
      };
    }
    if (hasEssentialCriteria && percentage > 60) {
      return {
        group: 3,
        status: 'needs_cpmpk',
        description: 'Обучающемуся рекомендовано прохождение ЦПМПК',
        color: 'destructive'
      };
    }
  }
  
  // Коммуникативный блок
  if (normalizedTitle.includes('коммуникат') || normalizedTitle.includes('общени')) {
    if (percentage <= 50) {
      return {
        group: 1,
        status: 'no_difficulties',
        description: 'Обучающемуся не присваивается статус "испытывающий трудности"',
        color: 'success'
      };
    }
    return {
      group: 2,
      status: 'has_difficulties',
      description: 'Обучающемуся присваивается статус "испытывающий трудности"',
      color: 'warning'
    };
  }
  
  // Поведенческий блок
  if (normalizedTitle.includes('поведенч') || normalizedTitle.includes('поведени')) {
    if (hasEssentialCriteria && percentage > 0) {
      return {
        group: 2,
        status: 'has_difficulties',
        description: 'Обучающемуся присваивается статус "испытывающий трудности"',
        color: 'warning'
      };
    }
    return {
      group: 1,
      status: 'no_difficulties',
      description: 'Обучающемуся не присваивается статус "испытывающий трудности"',
      color: 'success'
    };
  }
  
  // Для неопознанных блоков - используем общую логику по процентам
  if (percentage <= 25) {
    return {
      group: 1,
      status: 'no_difficulties',
      description: 'Обучающемуся не присваивается статус "испытывающий трудности"',
      color: 'success'
    };
  }
  if (percentage <= 60) {
    return {
      group: 2,
      status: 'has_difficulties',
      description: 'Обучающемуся присваивается статус "испытывающий трудности"',
      color: 'warning'
    };
  }
  return {
    group: 3,
    status: 'needs_cpmpk',
    description: 'Обучающемуся рекомендовано прохождение ЦПМПК',
    color: 'destructive'
  };
};

// Функция для определения общей группы
export const determineOverallGroup = (blockAssessments: BlockAssessment[]): AssistanceGroup => {
  // Фильтруем только блоки с присвоенными группами (не null)
  const assessmentsWithGroups = blockAssessments.filter(assessment => assessment.group !== null);
  
  // Если нет блоков с группами - общая группа 1
  if (assessmentsWithGroups.length === 0) {
    return {
      group: 1,
      status: 'no_difficulties',
      description: 'Обучающемуся не присваивается статус "испытывающий трудности"',
      color: 'success'
    };
  }
  
  // Если есть хотя бы одна группа 3 - общая группа 3
  const hasGroup3 = assessmentsWithGroups.some(assessment => assessment.group!.group === 3);
  if (hasGroup3) {
    return {
      group: 3,
      status: 'needs_cpmpk',
      description: 'Обучающемуся рекомендовано прохождение ЦПМПК',
      color: 'destructive'
    };
  }
  
  // Если есть хотя бы одна группа 2 - общая группа 2
  const hasGroup2 = assessmentsWithGroups.some(assessment => assessment.group!.group === 2);
  if (hasGroup2) {
    return {
      group: 2,
      status: 'has_difficulties',
      description: 'Обучающемуся присваивается статус "испытывающий трудности"',
      color: 'warning'
    };
  }
  
  // Если все группы 1 - общая группа 1
  return {
    group: 1,
    status: 'no_difficulties',
    description: 'Обучающемуся не присваивается статус "испытывающий трудности"',
    color: 'success'
  };
};

// Функция для генерации рекомендаций
export const generateRecommendations = (
  overallGroup: AssistanceGroup,
  blockAssessments: BlockAssessment[]
): string[] => {
  const recommendations: string[] = [];
  
  if (overallGroup.group === 1) {
    recommendations.push('Обучающийся успешно справляется с образовательной программой');
    recommendations.push('Рекомендуется продолжить обучение по основной образовательной программе');
    recommendations.push('Возможно предложение дополнительных развивающих активностей');
  }
  
  if (overallGroup.group === 2) {
    recommendations.push('Требуется организация коррекционно-развивающей работы');
    
    blockAssessments.forEach(assessment => {
      if (assessment.group && assessment.group.group >= 2) {
        const blockName = assessment.blockTitle.toLowerCase();
        
        if (blockName.includes('речев')) {
          recommendations.push('- Логопедическая помощь и развитие речевых навыков');
        }
        if (blockName.includes('регулятив')) {
          recommendations.push('- Развитие навыков самоконтроля и саморегуляции');
        }
        if (blockName.includes('когнитив')) {
          recommendations.push('- Развитие познавательных процессов и мышления');
        }
        if (blockName.includes('коммуникат')) {
          recommendations.push('- Развитие коммуникативных навыков и социализации');
        }
        if (blockName.includes('поведенч')) {
          recommendations.push('- Коррекция поведенческих особенностей');
        }
      }
    });
    
    recommendations.push('Мониторинг динамики развития');
    recommendations.push('Взаимодействие с родителями (законными представителями)');
  }
  
  if (overallGroup.group === 3) {
    recommendations.push('ОБЯЗАТЕЛЬНО: Направление на ЦПМПК для углубленной диагностики');
    recommendations.push('Разработка индивидуального образовательного маршрута');
    recommendations.push('Комплексное психолого-педагогическое сопровождение');
    recommendations.push('Возможна необходимость адаптированной образовательной программы');
  }
  
  return recommendations;
};

// Основная функция для анализа результатов
export const analyzeProtocolResults = (
  blocks: ProtocolChecklistBlock[],
  calculateBlockScore: (block: ProtocolChecklistBlock, educationLevel?: string) => {
    score: number;
    maxScore: number;
    percentage: number;
    yesCount: number;
    sumWeight1Criteria: number;
    formulaPercentage: number;
    weightPerCriteria: number;
  },
  educationLevel: string
): AssistanceRecommendation => {
  const blockAssessments: BlockAssessment[] = blocks.map(block => {
    const blockStats = calculateBlockScore(block, educationLevel);
    
    // Определяем наличие существенных критериев (с весом 1)
    const hasEssentialCriteria = block.topics.some(topic =>
      topic.subtopics.some(subtopic =>
        subtopic.items.some(item => item.weight === 1 && item.score === 1)
      )
    );
    
    const group = determineBlockGroup(block.title, blockStats.formulaPercentage, hasEssentialCriteria);
    
    return {
      blockTitle: block.title,
      percentage: blockStats.formulaPercentage,
      hasEssentialCriteria,
      group
    };
  });
  
  const overallGroup = determineOverallGroup(blockAssessments);
  const recommendations = generateRecommendations(overallGroup, blockAssessments);
  
  return {
    overallGroup,
    blockAssessments,
    recommendations
  };
};