import { EducationLevel } from "@/components/EducationLevelSelector";

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  required: boolean;
}

export interface ChecklistSection {
  id: string;
  title: string;
  items: ChecklistItem[];
  variant: "primary" | "secondary" | "warning";
}

export const getChecklistData = (level: EducationLevel): ChecklistSection[] => {
  const basePreparation: ChecklistSection = {
    id: "preparation",
    title: "Подготовка к консилиуму",
    variant: "primary",
    items: [
      {
        id: "prep-1",
        text: "Уведомление родителей/законных представителей о проведении ППк",
        completed: false,
        required: true
      },
      {
        id: "prep-2",
        text: "Получение письменного согласия на обследование",
        completed: false,
        required: true
      },
      {
        id: "prep-3",
        text: "Формирование состава консилиума",
        completed: false,
        required: true
      },
      {
        id: "prep-4",
        text: "Назначение даты и времени проведения",
        completed: false,
        required: true
      },
      {
        id: "prep-5",
        text: "Подготовка помещения для проведения консилиума",
        completed: false,
        required: false
      }
    ]
  };

  const documentation: ChecklistSection = {
    id: "documentation",
    title: "Документооборот",
    variant: "secondary",
    items: [
      {
        id: "doc-1",
        text: "Представление педагога на обучающегося",
        completed: false,
        required: true
      },
      {
        id: "doc-2",
        text: "Психологическое заключение",
        completed: false,
        required: true
      },
      {
        id: "doc-3",
        text: "Медицинская справка или заключение врача",
        completed: false,
        required: false
      },
      {
        id: "doc-4",
        text: "Характеристика обучающегося",
        completed: false,
        required: true
      },
      {
        id: "doc-5",
        text: "Результаты психолого-педагогического обследования",
        completed: false,
        required: true
      }
    ]
  };

  const conduct: ChecklistSection = {
    id: "conduct",
    title: "Проведение консилиума",
    variant: "warning",
    items: [
      {
        id: "conduct-1",
        text: "Присутствие всех членов консилиума",
        completed: false,
        required: true
      },
      {
        id: "conduct-2",
        text: "Ведение протокола заседания",
        completed: false,
        required: true
      },
      {
        id: "conduct-3",
        text: "Анализ представленных материалов",
        completed: false,
        required: true
      },
      {
        id: "conduct-4",
        text: "Обсуждение рекомендаций специалистов",
        completed: false,
        required: true
      },
      {
        id: "conduct-5",
        text: "Принятие коллегиального решения",
        completed: false,
        required: true
      }
    ]
  };

  // Специфичные элементы для разных уровней образования
  const levelSpecificItems = getLevelSpecificItems(level);

  return [basePreparation, documentation, conduct, ...levelSpecificItems];
};

const getLevelSpecificItems = (level: EducationLevel): ChecklistSection[] => {
  switch (level) {
    case "preschool":
      return [
        {
          id: "preschool-specific",
          title: "Специфика дошкольного образования",
          variant: "primary",
          items: [
            {
              id: "pre-1",
              text: "Оценка готовности к школьному обучению",
              completed: false,
              required: true
            },
            {
              id: "pre-2",
              text: "Анализ социально-коммуникативного развития",
              completed: false,
              required: true
            },
            {
              id: "pre-3",
              text: "Оценка игровой деятельности",
              completed: false,
              required: false
            },
            {
              id: "pre-4",
              text: "Рекомендации по адаптации к ДОУ",
              completed: false,
              required: false
            }
          ]
        }
      ];

    case "elementary":
      return [
        {
          id: "elementary-specific",
          title: "Специфика начального образования",
          variant: "primary",
          items: [
            {
              id: "elem-1",
              text: "Анализ сформированности учебных навыков",
              completed: false,
              required: true
            },
            {
              id: "elem-2",
              text: "Оценка адаптации к школе",
              completed: false,
              required: true
            },
            {
              id: "elem-3",
              text: "Анализ мотивации к обучению",
              completed: false,
              required: false
            },
            {
              id: "elem-4",
              text: "Работа с трудностями письма и чтения",
              completed: false,
              required: false
            }
          ]
        }
      ];

    case "middle":
      return [
        {
          id: "middle-specific",
          title: "Специфика основного образования",
          variant: "primary",
          items: [
            {
              id: "mid-1",
              text: "Анализ учебной мотивации в подростковом возрасте",
              completed: false,
              required: true
            },
            {
              id: "mid-2",
              text: "Оценка социальной адаптации",
              completed: false,
              required: true
            },
            {
              id: "mid-3",
              text: "Профориентационная работа",
              completed: false,
              required: false
            },
            {
              id: "mid-4",
              text: "Работа с девиантным поведением",
              completed: false,
              required: false
            }
          ]
        }
      ];

    case "high":
      return [
        {
          id: "high-specific",
          title: "Специфика среднего образования",
          variant: "primary",
          items: [
            {
              id: "high-1",
              text: "Профессиональное самоопределение",
              completed: false,
              required: true
            },
            {
              id: "high-2",
              text: "Подготовка к ГИА и ЕГЭ",
              completed: false,
              required: false
            },
            {
              id: "high-3",
              text: "Анализ готовности к взрослой жизни",
              completed: false,
              required: true
            },
            {
              id: "high-4",
              text: "Рекомендации по дальнейшему образованию",
              completed: false,
              required: false
            }
          ]
        }
      ];

    default:
      return [];
  }
};