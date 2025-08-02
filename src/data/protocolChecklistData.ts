export interface ChecklistItem {
  checklist_item_id: string;
  block: string;
  block_order: number;
  education_level_DO: 0 | 1;
  education_level_NOO: 0 | 1;
  education_level_OO: 0 | 1;
  education_level_SOO: 0 | 1;
  topic: string;
  topic_order: number;
  subtopic: string;
  subtopic_order: number;
  description: string;
  score_0_label: string;
  score_1_label: string;
  score?: 0 | 1;
  weight: number;
}

export interface ChecklistSubtopic {
  id: string;
  title: string;
  subtopic_order: number;
  items: ChecklistItem[];
}

export interface ChecklistTheme {
  id: string;
  title: string;
  topic_order: number;
  subtopics: ChecklistSubtopic[];
}

export interface ChecklistBlock {
  id: string;
  title: string;
  block_order: number;
  themes: ChecklistTheme[];
  items: ChecklistItem[];
  blockScore: number;
}

// Полный набор данных чек-листа согласно предоставленной структуре
const checklistData: ChecklistItem[] = [
  {
    checklist_item_id: "001",
    block: "I РЕЧЕВОЙ БЛОК",
    block_order: 1,
    education_level_DO: 1,
    education_level_NOO: 1,
    education_level_OO: 1,
    education_level_SOO: 0,
    topic: "Ошибки в произносительной стороне речи",
    topic_order: 1,
    subtopic: "Звуковая сторона речи",
    subtopic_order: 1,
    description: "испытывает трудности при произнесении звуков: пропускает, искажает, заменяет, смешивает; испытывает трудности, когда произносит слова, состоящие из 2-х и более слогов; пропускает звуки/слоги; произносит лишние звуки/слоги; меняет звуки/слоги местами; недоговаривает окончания",
    score_0_label: "Звуковая сторона речи согласно возрастной норме",
    score_1_label: "испытывает трудности при произнесении звуков: пропускает, искажает, заменяет, смешивает",
    score: 0,
    weight: 1.0
  },
  {
    checklist_item_id: "002",
    block: "I РЕЧЕВОЙ БЛОК",
    block_order: 1,
    education_level_DO: 1,
    education_level_NOO: 1,
    education_level_OO: 1,
    education_level_SOO: 0,
    topic: "Ошибки в произносительной стороне речи",
    topic_order: 1,
    subtopic: "Общая «смазанность» речи",
    subtopic_order: 2,
    description: "может произносить звуки по отдельности правильно, а в слове или предложении пропускает, искажает, заменяет, смешивает",
    score_0_label: "Произношение четкое, внятное",
    score_1_label: "может произносить звуки по отдельности правильно, а в слове или предложении пропускает, искажает, заменяет, смешивает",
    score: 0,
    weight: 1.0
  },
  {
    checklist_item_id: "003",
    block: "II ПОЗНАВАТЕЛЬНЫЙ БЛОК",
    block_order: 2,
    education_level_DO: 1,
    education_level_NOO: 1,
    education_level_OO: 1,
    education_level_SOO: 1,
    topic: "Внимание",
    topic_order: 1,
    subtopic: "Концентрация внимания",
    subtopic_order: 1,
    description: "не может сосредоточиться на задании; легко отвлекается на внешние стимулы; не доводит начатое дело до конца",
    score_0_label: "Внимание соответствует возрастной норме",
    score_1_label: "не может сосредоточиться на задании; легко отвлекается на внешние стимулы; не доводит начатое дело до конца",
    score: 0,
    weight: 1.0
  },
  {
    checklist_item_id: "004",
    block: "II ПОЗНАВАТЕЛЬНЫЙ БЛОК",
    block_order: 2,
    education_level_DO: 1,
    education_level_NOO: 1,
    education_level_OO: 1,
    education_level_SOO: 1,
    topic: "Внимание",
    topic_order: 1,
    subtopic: "Переключение внимания",
    subtopic_order: 2,
    description: "испытывает трудности при переключении с одного вида деятельности на другой; застревает на выполнении одного задания",
    score_0_label: "Переключается легко и быстро",
    score_1_label: "испытывает трудности при переключении с одного вида деятельности на другой; застревает на выполнении одного задания",
    score: 0,
    weight: 1.0
  },
  {
    checklist_item_id: "005",
    block: "II ПОЗНАВАТЕЛЬНЫЙ БЛОК",
    block_order: 2,
    education_level_DO: 1,
    education_level_NOO: 1,
    education_level_OO: 1,
    education_level_SOO: 1,
    topic: "Память",
    topic_order: 2,
    subtopic: "Зрительная память",
    subtopic_order: 1,
    description: "не запоминает зрительно предъявленную информацию; путает детали изображений; не может воспроизвести последовательность зрительных стимулов",
    score_0_label: "Зрительная память соответствует возрасту",
    score_1_label: "не запоминает зрительно предъявленную информацию; путает детали изображений; не может воспроизвести последовательность зрительных стимулов",
    score: 0,
    weight: 1.0
  },
  {
    checklist_item_id: "006",
    block: "II ПОЗНАВАТЕЛЬНЫЙ БЛОК",
    block_order: 2,
    education_level_DO: 1,
    education_level_NOO: 1,
    education_level_OO: 1,
    education_level_SOO: 1,
    topic: "Память",
    topic_order: 2,
    subtopic: "Слуховая память",
    subtopic_order: 2,
    description: "не запоминает на слух информацию; не может повторить ряд слов; забывает устные инструкции",
    score_0_label: "Слуховая память в норме",
    score_1_label: "не запоминает на слух информацию; не может повторить ряд слов; забывает устные инструкции",
    score: 0,
    weight: 1.0
  },
  {
    checklist_item_id: "007",
    block: "III ЭМОЦИОНАЛЬНО-ВОЛЕВОЙ БЛОК",
    block_order: 3,
    education_level_DO: 1,
    education_level_NOO: 1,
    education_level_OO: 1,
    education_level_SOO: 1,
    topic: "Эмоциональная сфера",
    topic_order: 1,
    subtopic: "Выражение эмоций",
    subtopic_order: 1,
    description: "не умеет адекватно выражать эмоции; проявляет неадекватные эмоциональные реакции; эмоции не соответствуют ситуации",
    score_0_label: "Адекватно выражает эмоции",
    score_1_label: "не умеет адекватно выражать эмоции; проявляет неадекватные эмоциональные реакции; эмоции не соответствуют ситуации",
    score: 0,
    weight: 1.0
  },
  {
    checklist_item_id: "008",
    block: "III ЭМОЦИОНАЛЬНО-ВОЛЕВОЙ БЛОК",
    block_order: 3,
    education_level_DO: 1,
    education_level_NOO: 1,
    education_level_OO: 1,
    education_level_SOO: 1,
    topic: "Поведенческие особенности",
    topic_order: 2,
    subtopic: "Самоконтроль",
    subtopic_order: 1,
    description: "не может контролировать свое поведение; импульсивен; действует необдуманно; не соблюдает правила",
    score_0_label: "Самоконтроль соответствует возрасту",
    score_1_label: "не может контролировать свое поведение; импульсивен; действует необдуманно; не соблюдает правила",
    score: 0,
    weight: 1.0
  },
  {
    checklist_item_id: "009",
    block: "IV СОЦИАЛЬНОЕ РАЗВИТИЕ",
    block_order: 4,
    education_level_DO: 1,
    education_level_NOO: 1,
    education_level_OO: 1,
    education_level_SOO: 1,
    topic: "Коммуникативные навыки",
    topic_order: 1,
    subtopic: "Вербальная коммуникация",
    subtopic_order: 1,
    description: "не инициирует общение; избегает общения; не отвечает на вопросы; речь неразборчива или неадекватна ситуации",
    score_0_label: "Коммуникация соответствует возрасту",
    score_1_label: "не инициирует общение; избегает общения; не отвечает на вопросы; речь неразборчива или неадекватна ситуации",
    score: 0,
    weight: 1.0
  },
  {
    checklist_item_id: "010",
    block: "IV СОЦИАЛЬНОЕ РАЗВИТИЕ",
    block_order: 4,
    education_level_DO: 1,
    education_level_NOO: 1,
    education_level_OO: 1,
    education_level_SOO: 1,
    topic: "Взаимодействие",
    topic_order: 2,
    subtopic: "Взаимодействие со сверстниками",
    subtopic_order: 1,
    description: "избегает контакта со сверстниками; конфликтует с другими детьми; не умеет играть совместно; не делится; не может договориться",
    score_0_label: "Взаимодействует адекватно возрасту",
    score_1_label: "избегает контакта со сверстниками; конфликтует с другими детьми; не умеет играть совместно; не делится; не может договориться",
    score: 0,
    weight: 1.0
  }
];

export const getProtocolChecklistData = (level: "preschool" | "elementary" | "middle" | "high"): ChecklistBlock[] => {
  // Определяем какие уровни образования применимы
  const levelMap = {
    preschool: "education_level_DO",
    elementary: "education_level_NOO", 
    middle: "education_level_OO",
    high: "education_level_SOO"
  };

  const currentLevelKey = levelMap[level] as keyof ChecklistItem;
  
  // Фильтруем элементы по уровню образования
  const filteredItems = checklistData.filter(item => item[currentLevelKey] === 1);

  // Группируем по блокам
  const blocksMap = new Map<string, ChecklistBlock>();

  filteredItems.forEach(item => {
    if (!blocksMap.has(item.block)) {
      blocksMap.set(item.block, {
        id: item.block.toLowerCase().replace(/\s+/g, '_'),
        title: item.block,
        block_order: item.block_order,
        themes: [],
        items: [],
        blockScore: 0
      });
    }

    const block = blocksMap.get(item.block)!;
    
    // Ищем или создаем тему
    let theme = block.themes.find(t => t.title === item.topic);
    if (!theme) {
      theme = {
        id: item.topic.toLowerCase().replace(/\s+/g, '_'),
        title: item.topic,
        topic_order: item.topic_order,
        subtopics: []
      };
      block.themes.push(theme);
    }

    // Ищем или создаем подтему
    let subtopic = theme.subtopics.find(s => s.title === item.subtopic);
    if (!subtopic) {
      subtopic = {
        id: item.subtopic.toLowerCase().replace(/\s+/g, '_'),
        title: item.subtopic,
        subtopic_order: item.subtopic_order,
        items: []
      };
      theme.subtopics.push(subtopic);
    }

    // Добавляем элемент в подтему
    subtopic.items.push(item);
    
    // Добавляем элемент в блок для общего списка
    block.items.push(item);
  });

  // Преобразуем Map в массив и сортируем
  const blocks = Array.from(blocksMap.values()).sort((a, b) => a.block_order - b.block_order);

  // Сортируем темы и подтемы
  blocks.forEach(block => {
    block.themes.sort((a, b) => a.topic_order - b.topic_order);
    block.themes.forEach(theme => {
      theme.subtopics.sort((a, b) => a.subtopic_order - b.subtopic_order);
    });
  });

  return blocks;
};

// Функция для подсчета баллов по блоку
export const calculateBlockScore = (block: ChecklistBlock): number => {
  return block.items.reduce((sum, item) => sum + (item.score || 0), 0);
};

// Функция для обновления оценки элемента
export const updateItemScore = (blocks: ChecklistBlock[], itemId: string, score: 0 | 1): ChecklistBlock[] => {
  return blocks.map(block => ({
    ...block,
    items: block.items.map(item => 
      item.checklist_item_id === itemId ? { ...item, score } : item
    ),
    themes: block.themes.map(theme => ({
      ...theme,
      subtopics: theme.subtopics.map(subtopic => ({
        ...subtopic,
        items: subtopic.items.map(item =>
          item.checklist_item_id === itemId ? { ...item, score } : item
        )
      }))
    }))
  }));
};