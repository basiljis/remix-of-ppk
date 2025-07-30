import { EducationLevel } from "@/components/EducationLevelSelector";

export interface DifficultiesItem {
  id: string;
  text: string;
  status: "yes" | "no" | "partial" | "not_assessed";
  weight: number;
  block: string;
}

export interface DifficultiesBlock {
  id: string;
  title: string;
  items: DifficultiesItem[];
}

export const getDifficultiesData = (level: EducationLevel): DifficultiesBlock[] => {
  const commonBlocks: DifficultiesBlock[] = [
    {
      id: "cognitive",
      title: "Познавательная сфера",
      items: [
        {
          id: "cog-1",
          text: "Трудности концентрации внимания на учебных заданиях",
          status: "not_assessed",
          weight: 3,
          block: "cognitive"
        },
        {
          id: "cog-2", 
          text: "Проблемы с запоминанием и воспроизведением информации",
          status: "not_assessed",
          weight: 3,
          block: "cognitive"
        },
        {
          id: "cog-3",
          text: "Трудности в понимании инструкций педагога",
          status: "not_assessed", 
          weight: 2,
          block: "cognitive"
        },
        {
          id: "cog-4",
          text: "Низкий темп выполнения учебных заданий",
          status: "not_assessed",
          weight: 2,
          block: "cognitive"
        },
        {
          id: "cog-5",
          text: "Трудности в установлении причинно-следственных связей",
          status: "not_assessed",
          weight: 3,
          block: "cognitive"
        }
      ]
    },
    {
      id: "emotional",
      title: "Эмоционально-личностная сфера",
      items: [
        {
          id: "emo-1",
          text: "Повышенная тревожность в учебных ситуациях",
          status: "not_assessed",
          weight: 2,
          block: "emotional"
        },
        {
          id: "emo-2",
          text: "Резкие перепады настроения во время занятий",
          status: "not_assessed",
          weight: 2,
          block: "emotional"
        },
        {
          id: "emo-3",
          text: "Низкая самооценка и неуверенность в своих силах",
          status: "not_assessed",
          weight: 3,
          block: "emotional"
        },
        {
          id: "emo-4",
          text: "Проявления агрессивности или замкнутости",
          status: "not_assessed",
          weight: 3,
          block: "emotional"
        },
        {
          id: "emo-5",
          text: "Трудности в выражении собственных эмоций",
          status: "not_assessed",
          weight: 2,
          block: "emotional"
        }
      ]
    },
    {
      id: "social",
      title: "Социальная адаптация",
      items: [
        {
          id: "soc-1",
          text: "Трудности в общении со сверстниками",
          status: "not_assessed",
          weight: 2,
          block: "social"
        },
        {
          id: "soc-2",
          text: "Проблемы во взаимодействии с педагогами",
          status: "not_assessed",
          weight: 2,
          block: "social"
        },
        {
          id: "soc-3",
          text: "Нарушение правил поведения в классе/группе",
          status: "not_assessed",
          weight: 2,
          block: "social"
        },
        {
          id: "soc-4",
          text: "Избегание групповых видов деятельности",
          status: "not_assessed",
          weight: 2,
          block: "social"
        },
        {
          id: "soc-5",
          text: "Конфликтное поведение с окружающими",
          status: "not_assessed",
          weight: 3,
          block: "social"
        }
      ]
    }
  ];

  // Специфичные блоки для разных уровней образования
  const levelSpecificBlocks = getLevelSpecificBlocks(level);
  
  return [...commonBlocks, ...levelSpecificBlocks];
};

const getLevelSpecificBlocks = (level: EducationLevel): DifficultiesBlock[] => {
  switch (level) {
    case "preschool":
      return [
        {
          id: "preschool-motor",
          title: "Моторное развитие (дошкольники)",
          items: [
            {
              id: "pre-mot-1",
              text: "Трудности в развитии крупной моторики",
              status: "not_assessed",
              weight: 2,
              block: "preschool-motor"
            },
            {
              id: "pre-mot-2",
              text: "Проблемы с мелкой моторикой и координацией",
              status: "not_assessed",
              weight: 3,
              block: "preschool-motor"
            },
            {
              id: "pre-mot-3",
              text: "Трудности в самообслуживании",
              status: "not_assessed",
              weight: 2,
              block: "preschool-motor"
            }
          ]
        },
        {
          id: "preschool-speech",
          title: "Речевое развитие (дошкольники)",
          items: [
            {
              id: "pre-speech-1",
              text: "Задержка речевого развития",
              status: "not_assessed",
              weight: 3,
              block: "preschool-speech"
            },
            {
              id: "pre-speech-2",
              text: "Нарушения звукопроизношения",
              status: "not_assessed",
              weight: 2,
              block: "preschool-speech"
            },
            {
              id: "pre-speech-3",
              text: "Трудности в понимании речи взрослых",
              status: "not_assessed",
              weight: 3,
              block: "preschool-speech"
            }
          ]
        }
      ];

    case "elementary":
      return [
        {
          id: "elementary-academic",
          title: "Академические навыки (начальная школа)",
          items: [
            {
              id: "elem-ac-1",
              text: "Трудности в овладении навыками чтения",
              status: "not_assessed",
              weight: 3,
              block: "elementary-academic"
            },
            {
              id: "elem-ac-2",
              text: "Проблемы с письмом и каллиграфией",
              status: "not_assessed",
              weight: 3,
              block: "elementary-academic"
            },
            {
              id: "elem-ac-3",
              text: "Трудности в освоении математических понятий",
              status: "not_assessed",
              weight: 3,
              block: "elementary-academic"
            },
            {
              id: "elem-ac-4",
              text: "Медленный темп выполнения письменных работ",
              status: "not_assessed",
              weight: 2,
              block: "elementary-academic"
            }
          ]
        }
      ];

    case "middle":
      return [
        {
          id: "middle-academic",
          title: "Академическая успеваемость (основная школа)",
          items: [
            {
              id: "mid-ac-1",
              text: "Снижение успеваемости по основным предметам",
              status: "not_assessed",
              weight: 3,
              block: "middle-academic"
            },
            {
              id: "mid-ac-2",
              text: "Трудности в изучении иностранных языков",
              status: "not_assessed",
              weight: 2,
              block: "middle-academic"
            },
            {
              id: "mid-ac-3",
              text: "Проблемы с выполнением домашних заданий",
              status: "not_assessed",
              weight: 2,
              block: "middle-academic"
            }
          ]
        },
        {
          id: "middle-behavioral",
          title: "Поведенческие особенности (подростки)",
          items: [
            {
              id: "mid-beh-1",
              text: "Проявления девиантного поведения",
              status: "not_assessed",
              weight: 3,
              block: "middle-behavioral"
            },
            {
              id: "mid-beh-2",
              text: "Снижение учебной мотивации",
              status: "not_assessed",
              weight: 3,
              block: "middle-behavioral"
            },
            {
              id: "mid-beh-3",
              text: "Конфликты с педагогами",
              status: "not_assessed",
              weight: 2,
              block: "middle-behavioral"
            }
          ]
        }
      ];

    case "high":
      return [
        {
          id: "high-professional",
          title: "Профессиональное самоопределение",
          items: [
            {
              id: "high-prof-1",
              text: "Неопределенность в выборе профессии",
              status: "not_assessed",
              weight: 2,
              block: "high-professional"
            },
            {
              id: "high-prof-2",
              text: "Тревожность по поводу будущего",
              status: "not_assessed",
              weight: 2,
              block: "high-professional"
            },
            {
              id: "high-prof-3",
              text: "Несоответствие интересов и способностей",
              status: "not_assessed",
              weight: 3,
              block: "high-professional"
            }
          ]
        },
        {
          id: "high-exam",
          title: "Подготовка к экзаменам",
          items: [
            {
              id: "high-exam-1",
              text: "Экзаменационная тревожность",
              status: "not_assessed",
              weight: 2,
              block: "high-exam"
            },
            {
              id: "high-exam-2",
              text: "Трудности в организации самостоятельной подготовки",
              status: "not_assessed",
              weight: 2,
              block: "high-exam"
            },
            {
              id: "high-exam-3",
              text: "Проблемы с концентрацией во время экзаменов",
              status: "not_assessed",
              weight: 3,
              block: "high-exam"
            }
          ]
        }
      ];

    default:
      return [];
  }
};

export const calculateDifficultiesScore = (blocks: DifficultiesBlock[]) => {
  const allItems = blocks.flatMap(block => block.items);
  
  let totalScore = 0;
  let maxScore = 0;
  
  allItems.forEach(item => {
    maxScore += item.weight;
    switch (item.status) {
      case "yes":
        totalScore += item.weight;
        break;
      case "partial":
        totalScore += item.weight * 0.5;
        break;
      default:
        break;
    }
  });
  
  const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
  
  let recommendation = "";
  if (percentage >= 70) {
    recommendation = "Высокий уровень трудностей. Необходимо комплексное психолого-педагогическое сопровождение, возможно направление на ПМПК для определения особых образовательных потребностей.";
  } else if (percentage >= 40) {
    recommendation = "Средний уровень трудностей. Рекомендуется индивидуальное психолого-педагогическое сопровождение, консультации специалистов.";
  } else if (percentage >= 20) {
    recommendation = "Низкий уровень трудностей. Рекомендуется профилактическая работа, наблюдение в динамике.";
  } else {
    recommendation = "Трудности не выявлены или минимальны. Продолжить обычный образовательный процесс с периодическим мониторингом.";
  }
  
  return {
    totalScore,
    maxScore,
    percentage,
    recommendation
  };
};