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
      id: "cognitive",
      title: "Познавательное развитие",
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
      id: "speech",
      title: "Речевое развитие",
      description: "Оценка развития речи и коммуникативных навыков",
      themes: [
        {
          id: "phonetics",
          title: "Фонетическая сторона речи",
          subtopics: [
            { id: "pronunciation", title: "Произношение звуков" },
            { id: "phonemic", title: "Фонематический слух" },
            { id: "rhythm", title: "Ритмико-интонационная сторона" }
          ]
        },
        {
          id: "vocabulary",
          title: "Лексическая сторона речи",
          subtopics: [
            { id: "active", title: "Активный словарь" },
            { id: "passive", title: "Пассивный словарь" },
            { id: "understanding", title: "Понимание значений слов" }
          ]
        },
        {
          id: "grammar",
          title: "Грамматическая сторона речи",
          subtopics: [
            { id: "morphology", title: "Морфологический строй" },
            { id: "syntax", title: "Синтаксический строй" },
            { id: "wordformation", title: "Словообразование" }
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
            { id: "ph_1", description: "Произносит все звуки родного языка", score: 0, themeId: "phonetics", subtopicId: "pronunciation" },
            { id: "ph_2", description: "Различает звуки в словах", score: 0, themeId: "phonetics", subtopicId: "phonemic" },
            { id: "ph_3", description: "Использует интонацию при общении", score: 0, themeId: "phonetics", subtopicId: "rhythm" },
            { id: "voc_1", description: "Активно использует словарь 3000-4000 слов", score: 0, themeId: "vocabulary", subtopicId: "active" },
            { id: "voc_2", description: "Понимает значение большинства слов", score: 0, themeId: "vocabulary", subtopicId: "passive" },
            { id: "voc_3", description: "Объясняет значение знакомых слов", score: 0, themeId: "vocabulary", subtopicId: "understanding" },
            { id: "gr_1", description: "Правильно изменяет слова по родам, числам", score: 0, themeId: "grammar", subtopicId: "morphology" },
            { id: "gr_2", description: "Строит простые и сложные предложения", score: 0, themeId: "grammar", subtopicId: "syntax" },
            { id: "gr_3", description: "Образует новые слова", score: 0, themeId: "grammar", subtopicId: "wordformation" }
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
            { id: "ph_1", description: "Четко произносит все звуки в речи", score: 0, themeId: "phonetics", subtopicId: "pronunciation" },
            { id: "ph_2", description: "Различает звуки при письме и чтении", score: 0, themeId: "phonetics", subtopicId: "phonemic" },
            { id: "ph_3", description: "Использует выразительность речи при чтении", score: 0, themeId: "phonetics", subtopicId: "rhythm" },
            { id: "voc_1", description: "Активно использует школьную лексику", score: 0, themeId: "vocabulary", subtopicId: "active" },
            { id: "voc_2", description: "Понимает значение учебных терминов", score: 0, themeId: "vocabulary", subtopicId: "passive" },
            { id: "voc_3", description: "Объясняет значение слов из учебников", score: 0, themeId: "vocabulary", subtopicId: "understanding" },
            { id: "gr_1", description: "Правильно склоняет и спрягает слова", score: 0, themeId: "grammar", subtopicId: "morphology" },
            { id: "gr_2", description: "Строит распространенные предложения", score: 0, themeId: "grammar", subtopicId: "syntax" },
            { id: "gr_3", description: "Образует слова с помощью приставок и суффиксов", score: 0, themeId: "grammar", subtopicId: "wordformation" }
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
            { id: "ph_1", description: "Владеет орфоэпическими нормами языка", score: 0, themeId: "phonetics", subtopicId: "pronunciation" },
            { id: "ph_2", description: "Различает фонетические особенности слов", score: 0, themeId: "phonetics", subtopicId: "phonemic" },
            { id: "ph_3", description: "Использует интонацию для выражения смысла", score: 0, themeId: "phonetics", subtopicId: "rhythm" },
            { id: "voc_1", description: "Активно использует предметную лексику", score: 0, themeId: "vocabulary", subtopicId: "active" },
            { id: "voc_2", description: "Понимает научную терминологию", score: 0, themeId: "vocabulary", subtopicId: "passive" },
            { id: "voc_3", description: "Работает со словарями и справочниками", score: 0, themeId: "vocabulary", subtopicId: "understanding" },
            { id: "gr_1", description: "Применяет сложные грамматические конструкции", score: 0, themeId: "grammar", subtopicId: "morphology" },
            { id: "gr_2", description: "Строит сложные синтаксические конструкции", score: 0, themeId: "grammar", subtopicId: "syntax" },
            { id: "gr_3", description: "Анализирует словообразовательные модели", score: 0, themeId: "grammar", subtopicId: "wordformation" }
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
            { id: "ph_1", description: "Владеет нормами литературного произношения", score: 0, themeId: "phonetics", subtopicId: "pronunciation" },
            { id: "ph_2", description: "Анализирует фонетические процессы в языке", score: 0, themeId: "phonetics", subtopicId: "phonemic" },
            { id: "ph_3", description: "Использует просодические средства выразительности", score: 0, themeId: "phonetics", subtopicId: "rhythm" },
            { id: "voc_1", description: "Владеет профессиональной лексикой", score: 0, themeId: "vocabulary", subtopicId: "active" },
            { id: "voc_2", description: "Понимает специализированные тексты", score: 0, themeId: "vocabulary", subtopicId: "passive" },
            { id: "voc_3", description: "Анализирует семантические отношения", score: 0, themeId: "vocabulary", subtopicId: "understanding" },
            { id: "gr_1", description: "Владеет сложными морфологическими формами", score: 0, themeId: "grammar", subtopicId: "morphology" },
            { id: "gr_2", description: "Создает сложные синтаксические структуры", score: 0, themeId: "grammar", subtopicId: "syntax" },
            { id: "gr_3", description: "Анализирует деривационные процессы", score: 0, themeId: "grammar", subtopicId: "wordformation" }
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