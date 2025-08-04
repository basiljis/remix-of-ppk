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

// Функция для разбиения описания на подэлементы
const splitDescriptionIntoItems = (baseItem: ChecklistItem): ChecklistItem[] => {
  const descriptions = baseItem.description.split(';').map(desc => desc.trim()).filter(desc => desc.length > 0);
  
  if (descriptions.length <= 1) {
    return [baseItem];
  }
  
  return descriptions.map((desc, index) => ({
    ...baseItem,
    checklist_item_id: `${baseItem.checklist_item_id}_${index + 1}`,
    description: desc,
    score_0_label: "нет",
    score_1_label: "да"
  }));
};

// Базовые данные чек-листа
const baseChecklistData: ChecklistItem[] = [
  {
    checklist_item_id: "1",
    block: "I РЕЧЕВОЙ БЛОК",
    block_order: 1,
    education_level_DO: 1,
    education_level_NOO: 1,
    education_level_OO: 1,
    education_level_SOO: 0,
    topic: "Ошибки в произносительной стороне речи",
    topic_order: 1,
    subtopic: "Звуковая сторона речи согласно возрастной норме:",
    subtopic_order: 1,
    description: "— испытывает трудности при произнесении звуков: пропускает, искажает, заменяет, смешивает",
    score_0_label: "Звуковая сторона речи согласно возрастной норме",
    score_1_label: "испытывает трудности при произнесении звуков: пропускает, искажает, заменяет, смешивает",
    score: 0,
    weight: 1.0
  },
  {
    checklist_item_id: "2",
    block: "I РЕЧЕВОЙ БЛОК",
    block_order: 1,
    education_level_DO: 1,
    education_level_NOO: 1,
    education_level_OO: 1,
    education_level_SOO: 0,
    topic: "Ошибки в произносительной стороне речи",
    topic_order: 1,
    subtopic: "Звуковая сторона речи",
    subtopic_order: 2,
    description: "— испытывает трудности, когда произносит слова, состоящие из 2-х и более слогов",
    score_0_label: "Звуковая сторона речи согласно возрастной норме",
    score_1_label: "испытывает трудности, когда произносит слова, состоящие из 2-х и более слогов",
    score: 0,
    weight: 1.0
  },
  {
    checklist_item_id: "3",
    block: "I РЕЧЕВОЙ БЛОК",
    block_order: 1,
    education_level_DO: 1,
    education_level_NOO: 1,
    education_level_OO: 1,
    education_level_SOO: 0,
    topic: "Ошибки в произносительной стороне речи",
    topic_order: 1,
    subtopic: "Звуковая сторона речи",
    subtopic_order: 3,
    description: "— пропускает звуки/слоги",
    score_0_label: "Звуковая сторона речи согласно возрастной норме",
    score_1_label: "пропускает звуки/слоги",
    score: 0,
    weight: 1.0
  },
  {
    checklist_item_id: "4",
    block: "I РЕЧЕВОЙ БЛОК",
    block_order: 1,
    education_level_DO: 1,
    education_level_NOO: 1,
    education_level_OO: 1,
    education_level_SOO: 0,
    topic: "Ошибки в произносительной стороне речи",
    topic_order: 1,
    subtopic: "Звуковая сторона речи",
    subtopic_order: 4,
    description: "— произносит лишние звуки/слоги",
    score_0_label: "Звуковая сторона речи согласно возрастной норме",
    score_1_label: "произносит лишние звуки/слоги",
    score: 0,
    weight: 1.0
  },
  {
    checklist_item_id: "5",
    block: "I РЕЧЕВОЙ БЛОК",
    block_order: 1,
    education_level_DO: 1,
    education_level_NOO: 1,
    education_level_OO: 1,
    education_level_SOO: 0,
    topic: "Ошибки в произносительной стороне речи",
    topic_order: 1,
    subtopic: "Звуковая сторона речи",
    subtopic_order: 5,
    description: "— меняет звуки/слоги местами",
    score_0_label: "Звуковая сторона речи согласно возрастной норме",
    score_1_label: "меняет звуки/слоги местами",
    score: 0,
    weight: 1.0
  },
  {
    checklist_item_id: "6",
    block: "I РЕЧЕВОЙ БЛОК",
    block_order: 1,
    education_level_DO: 1,
    education_level_NOO: 1,
    education_level_OO: 1,
    education_level_SOO: 0,
    topic: "Ошибки в произносительной стороне речи",
    topic_order: 1,
    subtopic: "Звуковая сторона речи",
    subtopic_order: 6,
    description: "— недоговаривает окончания",
    score_0_label: "Звуковая сторона речи согласно возрастной норме",
    score_1_label: "недоговаривает окончания",
    score: 0,
    weight: 1.0
  },
  {
    checklist_item_id: "7",
    block: "I РЕЧЕВОЙ БЛОК",
    block_order: 1,
    education_level_DO: 1,
    education_level_NOO: 1,
    education_level_OO: 1,
    education_level_SOO: 0,
    topic: "Общая «смазанность» речи:",
    topic_order: 1,
    subtopic: "Общая «смазанность» речи",
    subtopic_order: 7,
    description: "– может произносить звуки по отдельности правильно, а в слове или предложении пропускает, искажает, заменяет, смешивает",
    score_0_label: "",
    score_1_label: "может произносить звуки по отдельности правильно, а в слове или предложении пропускает, искажает, заменяет, смешивает",
    score: 0,
    weight: 1.0
  },
  {
    checklist_item_id: "8",
    block: "I РЕЧЕВОЙ БЛОК",
    block_order: 1,
    education_level_DO: 1,
    education_level_NOO: 1,
    education_level_OO: 1,
    education_level_SOO: 0,
    topic: "Ошибки в грамматическом строе речи",
    topic_order: 2,
    subtopic: "Ошибки в словообразовании и словоизменении согласно возрасту:",
    subtopic_order: 8,
    description: "— с ошибками изменяет/преобразовывает слово, используя приставки, суффиксы и окончания",
    score_0_label: "",
    score_1_label: "с ошибками изменяет/преобразовывает слово, используя приставки, суффиксы и окончания",
    score: 0,
    weight: 1.0
  },
  {
    checklist_item_id: "9",
    block: "I РЕЧЕВОЙ БЛОК",
    block_order: 1,
    education_level_DO: 1,
    education_level_NOO: 1,
    education_level_OO: 1,
    education_level_SOO: 0,
    topic: "Ошибки в грамматическом строе речи",
    topic_order: 2,
    subtopic: "Ошибки в словообразовании и словоизменении согласно возрасту:",
    subtopic_order: 9,
    description: "— с ошибками согласовывает слова в предложении по родам, падежам, числам",
    score_0_label: "",
    score_1_label: "с ошибками согласовывает слова в предложении по родам, падежам, числам",
    score: 0,
    weight: 1.0
  },
  {
    checklist_item_id: "10",
    block: "I РЕЧЕВОЙ БЛОК",
    block_order: 1,
    education_level_DO: 1,
    education_level_NOO: 1,
    education_level_OO: 1,
    education_level_SOO: 0,
    topic: "Ошибки в грамматическом строе речи",
    topic_order: 2,
    subtopic: "Ошибки в построении и использовании словосочетаний и предложений согласно возрасту:",
    subtopic_order: 10,
    description: "— затрудняется использовать в речи распространенные предложения (сложносочиненные и сложноподчиненные)",
    score_0_label: "",
    score_1_label: "затрудняется использовать в речи распространенные предложения (сложносочиненные и сложноподчиненные)",
    score: 0,
    weight: 1.0
  },
  {
    checklist_item_id: "11",
    block: "I РЕЧЕВОЙ БЛОК",
    block_order: 1,
    education_level_DO: 1,
    education_level_NOO: 1,
    education_level_OO: 1,
    education_level_SOO: 0,
    topic: "Ошибки в грамматическом строе речи",
    topic_order: 2,
    subtopic: "Ошибки в построении и использовании словосочетаний и предложений согласно возрасту:",
    subtopic_order: 11,
    description: "— испытывает трудности, когда надо отвечать на вопросы «полным ответом» (молчит, отвечает односложно, обрывочными фразами)",
    score_0_label: "",
    score_1_label: "испытывает трудности, когда надо отвечать на вопросы «полным ответом» (молчит, отвечает односложно, обрывочными фразами)",
    score: 0,
    weight: 1.0
  },
  {
    checklist_item_id: "12",
    block: "I РЕЧЕВОЙ БЛОК",
    block_order: 1,
    education_level_DO: 1,
    education_level_NOO: 1,
    education_level_OO: 1,
    education_level_SOO: 0,
    topic: "Ошибки в грамматическом строе речи",
    topic_order: 2,
    subtopic: "Ошибки в построении и использовании словосочетаний и предложений согласно возрасту:",
    subtopic_order: 12,
    description: "— испытывает трудности, когда нужно выстроить/объяснить свой ответ в логической последовательности событий (что делал сначала, что потом)",
    score_0_label: "",
    score_1_label: "испытывает трудности, когда нужно выстроить/объяснить свой ответ в логической последовательности событий (что делал сначала, что потом)",
    score: 0,
    weight: 1.0
  },
  {
    checklist_item_id: "13",
    block: "I РЕЧЕВОЙ БЛОК",
    block_order: 1,
    education_level_DO: 1,
    education_level_NOO: 1,
    education_level_OO: 1,
    education_level_SOO: 0,
    topic: "Ошибки в грамматическом строе речи",
    topic_order: 2,
    subtopic: "Ошибки в построении и использовании словосочетаний и предложений согласно возрасту:",
    subtopic_order: 13,
    description: "— испытывает трудности, когда надо строить предложение/рассказ по схеме/образцу",
    score_0_label: "",
    score_1_label: "испытывает трудности, когда надо строить предложение/рассказ по схеме/образцу",
    score: 0,
    weight: 1.0
  },
  {
    checklist_item_id: "14",
    block: "I РЕЧЕВОЙ БЛОК",
    block_order: 1,
    education_level_DO: 1,
    education_level_NOO: 1,
    education_level_OO: 1,
    education_level_SOO: 0,
    topic: "Ошибки в грамматическом строе речи",
    topic_order: 2,
    subtopic: "Ошибки в построении и использовании словосочетаний и предложений согласно возрасту:",
    subtopic_order: 14,
    description: "— испытывает трудности при составлении рассказа по предметной картинке/по сюжетной картинке/по серии картинок",
    score_0_label: "",
    score_1_label: "испытывает трудности при составлении рассказа по предметной картинке/по сюжетной картинке/по серии картинок",
    score: 0,
    weight: 1.0
  },
  {
    checklist_item_id: "15",
    block: "I РЕЧЕВОЙ БЛОК",
    block_order: 1,
    education_level_DO: 1,
    education_level_NOO: 1,
    education_level_OO: 1,
    education_level_SOO: 0,
    topic: "Ошибки в грамматическом строе речи",
    topic_order: 2,
    subtopic: "Ошибки в построении и использовании словосочетаний и предложений согласно возрасту:",
    subtopic_order: 15,
    description: "— испытывает трудности, когда надо рассказать сказку/рассказ/стихотворение",
    score_0_label: "",
    score_1_label: "испытывает трудности, когда надо рассказать сказку/рассказ/стихотворение",
    score: 0,
    weight: 1.0
  },
  {
    checklist_item_id: "16",
    block: "I РЕЧЕВОЙ БЛОК",
    block_order: 1,
    education_level_DO: 1,
    education_level_NOO: 1,
    education_level_OO: 1,
    education_level_SOO: 0,
    topic: "Ошибки в грамматическом строе речи",
    topic_order: 2,
    subtopic: "Ошибки в построении и использовании словосочетаний и предложений согласно возрасту:",
    subtopic_order: 16,
    description: "— испытывает трудности, когда надо построить диалог",
    score_0_label: "",
    score_1_label: "испытывает трудности, когда надо построить диалог",
    score: 0,
    weight: 1.0
  },
  {
    checklist_item_id: "17",
    block: "I РЕЧЕВОЙ БЛОК",
    block_order: 1,
    education_level_DO: 1,
    education_level_NOO: 1,
    education_level_OO: 1,
    education_level_SOO: 0,
    topic: "Ошибки в грамматическом строе речи",
    topic_order: 2,
    subtopic: "Ошибки в построении и использовании словосочетаний и предложений согласно возрасту:",
    subtopic_order: 17,
    description: "— с ошибками использует предлоги при обозначении пространственных отношений за, перед, между , из-за, из-под и т.д.",
    score_0_label: "",
    score_1_label: "с ошибками использует предлоги при обозначении пространственных отношений за, перед, между , из-за, из-под и т.д.",
    score: 0,
    weight: 1.0
  },
  {
    checklist_item_id: "18",
    block: "I РЕЧЕВОЙ БЛОК",
    block_order: 1,
    education_level_DO: 1,
    education_level_NOO: 1,
    education_level_OO: 1,
    education_level_SOO: 0,
    topic: "Ошибки в грамматическом строе речи",
    topic_order: 2,
    subtopic: "Словарный запас не соответствует возрастной норме:",
    subtopic_order: 18,
    description: "— ограничен обиходно-бытовым уровнем",
    score_0_label: "",
    score_1_label: "ограничен обиходно-бытовым уровнем",
    score: 0,
    weight: 1.0
  },
  {
    checklist_item_id: "19",
    block: "I РЕЧЕВОЙ БЛОК",
    block_order: 1,
    education_level_DO: 1,
    education_level_NOO: 1,
    education_level_OO: 1,
    education_level_SOO: 0,
    topic: "Ошибки в грамматическом строе речи",
    topic_order: 2,
    subtopic: "Словарный запас не соответствует возрастной норме:",
    subtopic_order: 19,
    description: "— не использует части речи, соответствующие возрастной норме (глаголы, прилагательные, местоимения, союзы и т.д.)",
    score_0_label: "",
    score_1_label: "не использует части речи, соответствующие возрастной норме (глаголы, прилагательные, местоимения, союзы и т.д.)",
    score: 0,
    weight: 1.0
  },
  {
    checklist_item_id: "20",
    block: "I РЕЧЕВОЙ БЛОК",
    block_order: 1,
    education_level_DO: 1,
    education_level_NOO: 1,
    education_level_OO: 1,
    education_level_SOO: 0,
    topic: "Ошибки в грамматическом строе речи",
    topic_order: 2,
    subtopic: "Словарный запас не соответствует возрастной норме:",
    subtopic_order: 20,
    description: "—трудности подбора синонимов и антонимов",
    score_0_label: "",
    score_1_label: "трудности подбора синонимов и антонимов",
    score: 0,
    weight: 1.0
  },
  {
    checklist_item_id: "21",
    block: "I РЕЧЕВОЙ БЛОК",
    block_order: 1,
    education_level_DO: 1,
    education_level_NOO: 1,
    education_level_OO: 1,
    education_level_SOO: 0,
    topic: "Когнитивные проблемы речевого характера",
    topic_order: 3,
    subtopic: "Не понимает обращенную к нему речь согласно возрасту:",
    subtopic_order: 21,
    description: "— в бытовых ситуациях",
    score_0_label: "",
    score_1_label: "не понимает обращенную к нему речь в бытовых ситуациях",
    score: 0,
    weight: 1.0
  },
  {
    checklist_item_id: "22",
    block: "I РЕЧЕВОЙ БЛОК",
    block_order: 1,
    education_level_DO: 1,
    education_level_NOO: 1,
    education_level_OO: 1,
    education_level_SOO: 0,
    topic: "Когнитивные проблемы речевого характера",
    topic_order: 3,
    subtopic: "Не понимает обращенную к нему речь согласно возрасту:",
    subtopic_order: 22,
    description: "— в ситуациях коммуникативного взаимодействия/игры",
    score_0_label: "",
    score_1_label: "не понимает обращенную к нему речь в ситуациях коммуникативного взаимодействия/игры",
    score: 0,
    weight: 1.0
  },
  {
    checklist_item_id: "23",
    block: "I РЕЧЕВОЙ БЛОК",
    block_order: 1,
    education_level_DO: 1,
    education_level_NOO: 1,
    education_level_OO: 1,
    education_level_SOO: 0,
    topic: "Когнитивные проблемы речевого характера",
    topic_order: 3,
    subtopic: "Не понимает обращенную к нему речь согласно возрасту:",
    subtopic_order: 23,
    description: "— в ситуации выполнения инструкций к познавательным/учебным заданиям (в т.ч. содержания обращенного вопроса)",
    score_0_label: "",
    score_1_label: "не понимает обращенную к нему речь в ситуации выполнения инструкций к познавательным/учебным заданиям",
    score: 0,
    weight: 1.0
  },
  {
    checklist_item_id: "24",
    block: "I РЕЧЕВОЙ БЛОК",
    block_order: 1,
    education_level_DO: 1,
    education_level_NOO: 1,
    education_level_OO: 1,
    education_level_SOO: 0,
    topic: "Когнитивные проблемы речевого характера",
    topic_order: 3,
    subtopic: "Не понимает обращенную к нему речь согласно возрасту:",
    subtopic_order: 24,
    description: "— испытывает трудности при понимании смысла поговорок, пословиц и метафор, не может их объяснить",
    score_0_label: "",
    score_1_label: "испытывает трудности при понимании смысла поговорок, пословиц и метафор, не может их объяснить",
    score: 0,
    weight: 1.0
  },
  {
    checklist_item_id: "25",
    block: "I РЕЧЕВОЙ БЛОК",
    block_order: 1,
    education_level_DO: 1,
    education_level_NOO: 1,
    education_level_OO: 1,
    education_level_SOO: 0,
    topic: "Когнитивные проблемы речевого характера",
    topic_order: 3,
    subtopic: "С трудом понимает согласно возрасту значения предлогов, обозначающих пространственные отношения",
    subtopic_order: 25,
    description: "– за, перед, между , из-за, из-под и т.д.",
    score_0_label: "",
    score_1_label: "с трудом понимает согласно возрасту значения предлогов, обозначающих пространственные отношения",
    score: 0,
    weight: 1.0
  },
  {
    checklist_item_id: "26",
    block: "I РЕЧЕВОЙ БЛОК",
    block_order: 1,
    education_level_DO: 1,
    education_level_NOO: 0,
    education_level_OO: 1,
    education_level_SOO: 1,
    topic: "Ошибки при чтении",
    topic_order: 4,
    subtopic: "Проблемы восприятия - при чтении регулярно:",
    subtopic_order: 26,
    description: "— путает схожие по звучанию звуки",
    score_0_label: "",
    score_1_label: "путает схожие по звучанию звуки",
    score: 0,
    weight: 1.0
  },
  {
    checklist_item_id: "27",
    block: "I РЕЧЕВОЙ БЛОК",
    block_order: 1,
    education_level_DO: 1,
    education_level_NOO: 0,
    education_level_OO: 1,
    education_level_SOO: 1,
    topic: "Ошибки при чтении",
    topic_order: 4,
    subtopic: "Проблемы восприятия - при чтении регулярно:",
    subtopic_order: 27,
    description: "— пропускает некоторые звуки/слоги [слова]",
    score_0_label: "",
    score_1_label: "пропускает некоторые звуки/слоги",
    score: 0,
    weight: 1.0
  },
  {
    checklist_item_id: "28",
    block: "I РЕЧЕВОЙ БЛОК",
    block_order: 1,
    education_level_DO: 1,
    education_level_NOO: 0,
    education_level_OO: 1,
    education_level_SOO: 1,
    topic: "Ошибки при чтении",
    topic_order: 4,
    subtopic: "Проблемы восприятия - при чтении регулярно:",
    subtopic_order: 28,
    description: "— переставляет звуки/слоги/слова местами",
    score_0_label: "",
    score_1_label: "переставляет звуки/слоги/слова местами",
    score: 0,
    weight: 1.0
  },
  {
    checklist_item_id: "29",
    block: "I РЕЧЕВОЙ БЛОК",
    block_order: 1,
    education_level_DO: 1,
    education_level_NOO: 0,
    education_level_OO: 1,
    education_level_SOO: 1,
    topic: "Ошибки при чтении",
    topic_order: 4,
    subtopic: "Проблемы восприятия - при чтении регулярно:",
    subtopic_order: 29,
    description: "— произносит лишние звуки/слоги",
    score_0_label: "",
    score_1_label: "произносит лишние звуки/слоги",
    score: 0,
    weight: 1.0
  },
  {
    checklist_item_id: "30",
    block: "I РЕЧЕВОЙ БЛОК",
    block_order: 1,
    education_level_DO: 1,
    education_level_NOO: 0,
    education_level_OO: 1,
    education_level_SOO: 1,
    topic: "Ошибки при чтении",
    topic_order: 4,
    subtopic: "Проблемы восприятия - при чтении регулярно:",
    subtopic_order: 30,
    description: "— не дочитывает окончания слов/словосочетаний/предложений",
    score_0_label: "",
    score_1_label: "не дочитывает окончания слов/словосочетаний/предложений",
    score: 0,
    weight: 1.0
  }
];

// Обрабатываем базовые данные и разбиваем descriptions
const checklistData: ChecklistItem[] = baseChecklistData.flatMap(item => splitDescriptionIntoItems(item));

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