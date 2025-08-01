export interface ChecklistItem {
  id: string;
  description: string;
  score: 0 | 1;
  themeId: string;
  subtopicId: string;
}

export interface ChecklistSubtopic {
  id: string;
  title: string;
}

export interface ChecklistTheme {
  id: string;
  title: string;
  subtopics: ChecklistSubtopic[];
}

export interface ChecklistBlock {
  id: string;
  title: string;
  description?: string;
  themes: ChecklistTheme[];
  items: ChecklistItem[];
}

export const getProtocolChecklistData = (level: "preschool" | "elementary" | "middle" | "high"): ChecklistBlock[] => {
  const baseBlocks: ChecklistBlock[] = [
    {
      id: "speech",
      title: "РЕЧЕВОЙ БЛОК",
      description: "Оценка речевого развития ребенка",
      themes: [
        {
          id: "pronunciation-errors",
          title: "Ошибки в произносительной стороне речи (ДО, НОО ООО)",
          subtopics: [
            { id: "sound-side", title: "Звуковая сторона речи согласно возрастной норме" },
            { id: "general-blur", title: "Общая «смазанность» речи" }
          ]
        }
      ],
      items: []
    },
    {
      id: "cognitive",
      title: "ПОЗНАВАТЕЛЬНЫЙ БЛОК",
      description: "Оценка когнитивных способностей и познавательных процессов",
      themes: [
        {
          id: "attention",
          title: "Внимание",
          subtopics: [
            { id: "concentration", title: "Концентрация внимания" },
            { id: "switching", title: "Переключение внимания" },
            { id: "sustainability", title: "Устойчивость внимания" }
          ]
        },
        {
          id: "memory",
          title: "Память",
          subtopics: [
            { id: "visual", title: "Зрительная память" },
            { id: "auditory", title: "Слуховая память" },
            { id: "motor", title: "Двигательная память" }
          ]
        },
        {
          id: "thinking",
          title: "Мышление",
          subtopics: [
            { id: "logical", title: "Логическое мышление" },
            { id: "abstract", title: "Абстрактное мышление" },
            { id: "creative", title: "Творческое мышление" }
          ]
        }
      ],
      items: []
    },
    {
      id: "emotional",
      title: "Эмоционально-волевое развитие",
      description: "Оценка эмоциональной сферы и волевых качеств",
      themes: [
        {
          id: "emotions",
          title: "Эмоциональная сфера",
          subtopics: [
            { id: "expression", title: "Выражение эмоций" },
            { id: "recognition", title: "Распознавание эмоций" },
            { id: "regulation", title: "Регуляция эмоций" }
          ]
        },
        {
          id: "behavior",
          title: "Поведенческие особенности",
          subtopics: [
            { id: "selfcontrol", title: "Самоконтроль" },
            { id: "adaptation", title: "Адаптивность" },
            { id: "initiative", title: "Инициативность" }
          ]
        }
      ],
      items: []
    },
    {
      id: "social",
      title: "Социальное развитие",
      description: "Оценка социальных навыков и коммуникации",
      themes: [
        {
          id: "communication",
          title: "Коммуникативные навыки",
          subtopics: [
            { id: "verbal", title: "Вербальная коммуникация" },
            { id: "nonverbal", title: "Невербальная коммуникация" },
            { id: "social_rules", title: "Понимание социальных правил" }
          ]
        },
        {
          id: "interaction",
          title: "Взаимодействие",
          subtopics: [
            { id: "peers", title: "Взаимодействие со сверстниками" },
            { id: "adults", title: "Взаимодействие со взрослыми" },
            { id: "cooperation", title: "Способность к сотрудничеству" }
          ]
        }
      ],
      items: []
    }
  ];

  // Добавляем специфичные для уровня элементы
  switch (level) {
    case "preschool":
      return addPreschoolItems(baseBlocks);
    case "elementary":
      return addElementaryItems(baseBlocks);
    case "middle":
      return addMiddleItems(baseBlocks);
    case "high":
      return addHighItems(baseBlocks);
    default:
      return baseBlocks;
  }
};

const addPreschoolItems = (blocks: ChecklistBlock[]): ChecklistBlock[] => {
  return blocks.map(block => {
    switch (block.id) {
      case "cognitive":
        return {
          ...block,
          items: [
            { id: "att_1", description: "Может сосредоточиться на задании 10-15 минут", score: 0, themeId: "attention", subtopicId: "concentration" },
            { id: "att_2", description: "Переключается между видами деятельности по просьбе взрослого", score: 0, themeId: "attention", subtopicId: "switching" },
            { id: "att_3", description: "Доводит начатое дело до конца", score: 0, themeId: "attention", subtopicId: "sustainability" },
            { id: "mem_1", description: "Запоминает и воспроизводит 4-5 картинок", score: 0, themeId: "memory", subtopicId: "visual" },
            { id: "mem_2", description: "Повторяет ряд из 4-5 слов", score: 0, themeId: "memory", subtopicId: "auditory" },
            { id: "mem_3", description: "Воспроизводит последовательность движений", score: 0, themeId: "memory", subtopicId: "motor" },
            { id: "th_1", description: "Выделяет существенные признаки предметов", score: 0, themeId: "thinking", subtopicId: "logical" },
            { id: "th_2", description: "Классифицирует предметы по основным признакам", score: 0, themeId: "thinking", subtopicId: "abstract" },
            { id: "th_3", description: "Проявляет творческий подход в играх", score: 0, themeId: "thinking", subtopicId: "creative" }
          ]
        };
      case "speech":
        return {
          ...block,
          items: [
            { id: "speech_1", description: "испытывает трудности при произнесении звуков: пропускает, искажает, заменяет, смешивает", score: 0, themeId: "pronunciation-errors", subtopicId: "sound-side" },
            { id: "speech_2", description: "испытывает трудности, когда произносит слова, состоящие из 2-х и более слогов", score: 0, themeId: "pronunciation-errors", subtopicId: "sound-side" },
            { id: "speech_3", description: "пропускает звуки/слоги", score: 0, themeId: "pronunciation-errors", subtopicId: "sound-side" },
            { id: "speech_4", description: "произносит лишние звуки/слоги", score: 0, themeId: "pronunciation-errors", subtopicId: "sound-side" },
            { id: "speech_5", description: "меняет звуки/слоги местами", score: 0, themeId: "pronunciation-errors", subtopicId: "sound-side" },
            { id: "speech_6", description: "недоговаривает окончания", score: 0, themeId: "pronunciation-errors", subtopicId: "sound-side" },
            { id: "speech_7", description: "может произносить звуки по отдельности правильно, а в слове или предложении пропускает, искажает, заменяет, смешивает", score: 0, themeId: "pronunciation-errors", subtopicId: "general-blur" }
          ]
        };
      case "emotional":
        return {
          ...block,
          items: [
            { id: "em_1", description: "Адекватно выражает основные эмоции", score: 0, themeId: "emotions", subtopicId: "expression" },
            { id: "em_2", description: "Распознает эмоции других людей", score: 0, themeId: "emotions", subtopicId: "recognition" },
            { id: "em_3", description: "Может успокоиться с помощью взрослого", score: 0, themeId: "emotions", subtopicId: "regulation" },
            { id: "beh_1", description: "Контролирует свое поведение в привычных ситуациях", score: 0, themeId: "behavior", subtopicId: "selfcontrol" },
            { id: "beh_2", description: "Адаптируется к новым условиям", score: 0, themeId: "behavior", subtopicId: "adaptation" },
            { id: "beh_3", description: "Проявляет инициативу в деятельности", score: 0, themeId: "behavior", subtopicId: "initiative" }
          ]
        };
      case "social":
        return {
          ...block,
          items: [
            { id: "com_1", description: "Участвует в диалоге со взрослыми и детьми", score: 0, themeId: "communication", subtopicId: "verbal" },
            { id: "com_2", description: "Использует жесты и мимику для общения", score: 0, themeId: "communication", subtopicId: "nonverbal" },
            { id: "com_3", description: "Соблюдает элементарные правила поведения", score: 0, themeId: "communication", subtopicId: "social_rules" },
            { id: "int_1", description: "Играет совместно с другими детьми", score: 0, themeId: "interaction", subtopicId: "peers" },
            { id: "int_2", description: "Обращается за помощью к взрослому", score: 0, themeId: "interaction", subtopicId: "adults" },
            { id: "int_3", description: "Участвует в коллективной деятельности", score: 0, themeId: "interaction", subtopicId: "cooperation" }
          ]
        };
      default:
        return block;
    }
  });
};

const addElementaryItems = (blocks: ChecklistBlock[]): ChecklistBlock[] => {
  return blocks.map(block => {
    switch (block.id) {
      case "cognitive":
        return {
          ...block,
          items: [
            { id: "att_1", description: "Сосредотачивается на учебном задании 20-30 минут", score: 0, themeId: "attention", subtopicId: "concentration" },
            { id: "att_2", description: "Быстро переключается между разными предметами", score: 0, themeId: "attention", subtopicId: "switching" },
            { id: "att_3", description: "Доводит учебные задания до конца", score: 0, themeId: "attention", subtopicId: "sustainability" },
            { id: "mem_1", description: "Запоминает учебный материал с помощью зрительных опор", score: 0, themeId: "memory", subtopicId: "visual" },
            { id: "mem_2", description: "Воспроизводит устные инструкции учителя", score: 0, themeId: "memory", subtopicId: "auditory" },
            { id: "mem_3", description: "Запоминает последовательность учебных действий", score: 0, themeId: "memory", subtopicId: "motor" },
            { id: "th_1", description: "Анализирует и сравнивает учебный материал", score: 0, themeId: "thinking", subtopicId: "logical" },
            { id: "th_2", description: "Обобщает и делает простые выводы", score: 0, themeId: "thinking", subtopicId: "abstract" },
            { id: "th_3", description: "Находит нестандартные решения задач", score: 0, themeId: "thinking", subtopicId: "creative" }
          ]
        };
      case "speech":
        return {
          ...block,
          items: [
            { id: "speech_1", description: "испытывает трудности при произнесении звуков: пропускает, искажает, заменяет, смешивает", score: 0, themeId: "pronunciation-errors", subtopicId: "sound-side" },
            { id: "speech_2", description: "испытывает трудности, когда произносит слова, состоящие из 2-х и более слогов", score: 0, themeId: "pronunciation-errors", subtopicId: "sound-side" },
            { id: "speech_3", description: "пропускает звуки/слоги", score: 0, themeId: "pronunciation-errors", subtopicId: "sound-side" },
            { id: "speech_4", description: "произносит лишние звуки/слоги", score: 0, themeId: "pronunciation-errors", subtopicId: "sound-side" },
            { id: "speech_5", description: "меняет звуки/слоги местами", score: 0, themeId: "pronunciation-errors", subtopicId: "sound-side" },
            { id: "speech_6", description: "недоговаривает окончания", score: 0, themeId: "pronunciation-errors", subtopicId: "sound-side" },
            { id: "speech_7", description: "может произносить звуки по отдельности правильно, а в слове или предложении пропускает, искажает, заменяет, смешивает", score: 0, themeId: "pronunciation-errors", subtopicId: "general-blur" }
          ]
        };
      case "emotional":
        return {
          ...block,
          items: [
            { id: "em_1", description: "Адекватно выражает эмоции в школьной среде", score: 0, themeId: "emotions", subtopicId: "expression" },
            { id: "em_2", description: "Понимает эмоциональное состояние одноклассников", score: 0, themeId: "emotions", subtopicId: "recognition" },
            { id: "em_3", description: "Самостоятельно справляется с негативными эмоциями", score: 0, themeId: "emotions", subtopicId: "regulation" },
            { id: "beh_1", description: "Контролирует поведение на уроках", score: 0, themeId: "behavior", subtopicId: "selfcontrol" },
            { id: "beh_2", description: "Адаптируется к школьному режиму", score: 0, themeId: "behavior", subtopicId: "adaptation" },
            { id: "beh_3", description: "Проявляет инициативу в учебной деятельности", score: 0, themeId: "behavior", subtopicId: "initiative" }
          ]
        };
      case "social":
        return {
          ...block,
          items: [
            { id: "com_1", description: "Участвует в учебных дискуссиях", score: 0, themeId: "communication", subtopicId: "verbal" },
            { id: "com_2", description: "Использует невербальные средства общения", score: 0, themeId: "communication", subtopicId: "nonverbal" },
            { id: "com_3", description: "Соблюдает школьные правила поведения", score: 0, themeId: "communication", subtopicId: "social_rules" },
            { id: "int_1", description: "Работает в парах и группах", score: 0, themeId: "interaction", subtopicId: "peers" },
            { id: "int_2", description: "Обращается к учителю за помощью", score: 0, themeId: "interaction", subtopicId: "adults" },
            { id: "int_3", description: "Участвует в коллективных проектах", score: 0, themeId: "interaction", subtopicId: "cooperation" }
          ]
        };
      default:
        return block;
    }
  });
};

const addMiddleItems = (blocks: ChecklistBlock[]): ChecklistBlock[] => {
  return blocks.map(block => {
    switch (block.id) {
      case "cognitive":
        return {
          ...block,
          items: [
            { id: "att_1", description: "Концентрируется на сложных учебных заданиях 40-45 минут", score: 0, themeId: "attention", subtopicId: "concentration" },
            { id: "att_2", description: "Эффективно переключается между учебными предметами", score: 0, themeId: "attention", subtopicId: "switching" },
            { id: "att_3", description: "Поддерживает внимание при выполнении длительных проектов", score: 0, themeId: "attention", subtopicId: "sustainability" },
            { id: "mem_1", description: "Использует визуальные стратегии запоминания", score: 0, themeId: "memory", subtopicId: "visual" },
            { id: "mem_2", description: "Запоминает и воспроизводит устную информацию", score: 0, themeId: "memory", subtopicId: "auditory" },
            { id: "mem_3", description: "Автоматизирует учебные навыки", score: 0, themeId: "memory", subtopicId: "motor" },
            { id: "th_1", description: "Применяет логические операции в учебе", score: 0, themeId: "thinking", subtopicId: "logical" },
            { id: "th_2", description: "Работает с абстрактными понятиями", score: 0, themeId: "thinking", subtopicId: "abstract" },
            { id: "th_3", description: "Генерирует творческие идеи в проектах", score: 0, themeId: "thinking", subtopicId: "creative" }
          ]
        };
      case "speech":
        return {
          ...block,
          items: [
            { id: "speech_1", description: "испытывает трудности при произнесении звуков: пропускает, искажает, заменяет, смешивает", score: 0, themeId: "pronunciation-errors", subtopicId: "sound-side" },
            { id: "speech_2", description: "испытывает трудности, когда произносит слова, состоящие из 2-х и более слогов", score: 0, themeId: "pronunciation-errors", subtopicId: "sound-side" },
            { id: "speech_3", description: "пропускает звуки/слоги", score: 0, themeId: "pronunciation-errors", subtopicId: "sound-side" },
            { id: "speech_4", description: "произносит лишние звуки/слоги", score: 0, themeId: "pronunciation-errors", subtopicId: "sound-side" },
            { id: "speech_5", description: "меняет звуки/слоги местами", score: 0, themeId: "pronunciation-errors", subtopicId: "sound-side" },
            { id: "speech_6", description: "недоговаривает окончания", score: 0, themeId: "pronunciation-errors", subtopicId: "sound-side" },
            { id: "speech_7", description: "может произносить звуки по отдельности правильно, а в слове или предложении пропускает, искажает, заменяет, смешивает", score: 0, themeId: "pronunciation-errors", subtopicId: "general-blur" }
          ]
        };
      case "emotional":
        return {
          ...block,
          items: [
            { id: "em_1", description: "Управляет эмоциями в стрессовых ситуациях", score: 0, themeId: "emotions", subtopicId: "expression" },
            { id: "em_2", description: "Анализирует эмоциональные состояния", score: 0, themeId: "emotions", subtopicId: "recognition" },
            { id: "em_3", description: "Использует стратегии эмоциональной регуляции", score: 0, themeId: "emotions", subtopicId: "regulation" },
            { id: "beh_1", description: "Демонстрирует самоконтроль в учебной деятельности", score: 0, themeId: "behavior", subtopicId: "selfcontrol" },
            { id: "beh_2", description: "Адаптируется к новым учебным требованиям", score: 0, themeId: "behavior", subtopicId: "adaptation" },
            { id: "beh_3", description: "Проявляет лидерские качества", score: 0, themeId: "behavior", subtopicId: "initiative" }
          ]
        };
      case "social":
        return {
          ...block,
          items: [
            { id: "com_1", description: "Ведет дискуссии и дебаты", score: 0, themeId: "communication", subtopicId: "verbal" },
            { id: "com_2", description: "Интерпретирует невербальные сигналы", score: 0, themeId: "communication", subtopicId: "nonverbal" },
            { id: "com_3", description: "Понимает социальные нормы подросткового сообщества", score: 0, themeId: "communication", subtopicId: "social_rules" },
            { id: "int_1", description: "Строит дружеские отношения со сверстниками", score: 0, themeId: "interaction", subtopicId: "peers" },
            { id: "int_2", description: "Взаимодействует с разными взрослыми", score: 0, themeId: "interaction", subtopicId: "adults" },
            { id: "int_3", description: "Организует групповую работу", score: 0, themeId: "interaction", subtopicId: "cooperation" }
          ]
        };
      default:
        return block;
    }
  });
};

const addHighItems = (blocks: ChecklistBlock[]): ChecklistBlock[] => {
  return blocks.map(block => {
    switch (block.id) {
      case "cognitive":
        return {
          ...block,
          items: [
            { id: "att_1", description: "Поддерживает концентрацию в течение всего учебного дня", score: 0, themeId: "attention", subtopicId: "concentration" },
            { id: "att_2", description: "Эффективно распределяет внимание между задачами", score: 0, themeId: "attention", subtopicId: "switching" },
            { id: "att_3", description: "Концентрируется на долгосрочных учебных целях", score: 0, themeId: "attention", subtopicId: "sustainability" },
            { id: "mem_1", description: "Применяет сложные стратегии запоминания", score: 0, themeId: "memory", subtopicId: "visual" },
            { id: "mem_2", description: "Обрабатывает большие объемы аудиоинформации", score: 0, themeId: "memory", subtopicId: "auditory" },
            { id: "mem_3", description: "Автоматизирует сложные учебные процедуры", score: 0, themeId: "memory", subtopicId: "motor" },
            { id: "th_1", description: "Использует формальную логику в рассуждениях", score: 0, themeId: "thinking", subtopicId: "logical" },
            { id: "th_2", description: "Оперирует сложными абстракциями", score: 0, themeId: "thinking", subtopicId: "abstract" },
            { id: "th_3", description: "Разрабатывает инновационные подходы к решению задач", score: 0, themeId: "thinking", subtopicId: "creative" }
          ]
        };
      case "speech":
        return {
          ...block,
          items: [
            { id: "speech_1", description: "испытывает трудности при произнесении звуков: пропускает, искажает, заменяет, смешивает", score: 0, themeId: "pronunciation-errors", subtopicId: "sound-side" },
            { id: "speech_2", description: "испытывает трудности, когда произносит слова, состоящие из 2-х и более слогов", score: 0, themeId: "pronunciation-errors", subtopicId: "sound-side" },
            { id: "speech_3", description: "пропускает звуки/слоги", score: 0, themeId: "pronunciation-errors", subtopicId: "sound-side" },
            { id: "speech_4", description: "произносит лишние звуки/слоги", score: 0, themeId: "pronunciation-errors", subtopicId: "sound-side" },
            { id: "speech_5", description: "меняет звуки/слоги местами", score: 0, themeId: "pronunciation-errors", subtopicId: "sound-side" },
            { id: "speech_6", description: "недоговаривает окончания", score: 0, themeId: "pronunciation-errors", subtopicId: "sound-side" },
            { id: "speech_7", description: "может произносить звуки по отдельности правильно, а в слове или предложении пропускает, искажает, заменяет, смешивает", score: 0, themeId: "pronunciation-errors", subtopicId: "general-blur" }
          ]
        };
      case "emotional":
        return {
          ...block,
          items: [
            { id: "em_1", description: "Демонстрирует эмоциональную зрелость", score: 0, themeId: "emotions", subtopicId: "expression" },
            { id: "em_2", description: "Проявляет эмпатию и эмоциональный интеллект", score: 0, themeId: "emotions", subtopicId: "recognition" },
            { id: "em_3", description: "Самостоятельно регулирует эмоциональные состояния", score: 0, themeId: "emotions", subtopicId: "regulation" },
            { id: "beh_1", description: "Демонстрирует высокий уровень самоконтроля", score: 0, themeId: "behavior", subtopicId: "selfcontrol" },
            { id: "beh_2", description: "Быстро адаптируется к изменениям", score: 0, themeId: "behavior", subtopicId: "adaptation" },
            { id: "beh_3", description: "Проявляет лидерство и инициативу", score: 0, themeId: "behavior", subtopicId: "initiative" }
          ]
        };
      case "social":
        return {
          ...block,
          items: [
            { id: "com_1", description: "Ведет профессиональную коммуникацию", score: 0, themeId: "communication", subtopicId: "verbal" },
            { id: "com_2", description: "Эффективно использует невербальные средства", score: 0, themeId: "communication", subtopicId: "nonverbal" },
            { id: "com_3", description: "Понимает сложные социальные контексты", score: 0, themeId: "communication", subtopicId: "social_rules" },
            { id: "int_1", description: "Строит зрелые отношения со сверстниками", score: 0, themeId: "interaction", subtopicId: "peers" },
            { id: "int_2", description: "Взаимодействует на равных со взрослыми", score: 0, themeId: "interaction", subtopicId: "adults" },
            { id: "int_3", description: "Руководит командной работой", score: 0, themeId: "interaction", subtopicId: "cooperation" }
          ]
        };
      default:
        return block;
    }
  });
};