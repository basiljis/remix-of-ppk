// Данные для локальных рекомендаций по сферам развития

export interface SphereRecommendation {
  priority: string;
  trainers: Array<{ name: string; duration: string }>;
  videos: Array<{ title: string; specialist: string }>;
  materials: Array<{ title: string; type: string }>;
  consultationAdvice: string;
}

export const sphereRecommendations: Record<string, SphereRecommendation> = {
  motor: {
    priority: "Моторная сфера",
    trainers: [
      { name: "Точность движений", duration: "5 мин/день" },
      { name: "Мелкая моторика: ножницы", duration: "7 мин/день" },
      { name: "Равновесие на одной ноге", duration: "3 мин/день" },
    ],
    videos: [
      { title: "Как развить моторику через игру", specialist: "логопед" },
      { title: "Пальчиковая гимнастика за 5 минут", specialist: "дефектолог" },
    ],
    materials: [
      { title: "Моторика и речь: связь", type: "Статья" },
      { title: "Чек-лист домашних упражнений", type: "PDF" },
    ],
    consultationAdvice: "Рекомендуется наблюдение 3 месяца",
  },
  speech: {
    priority: "Речевая сфера",
    trainers: [
      { name: "Артикуляционная гимнастика", duration: "10 мин/день" },
      { name: "Речевые игры", duration: "15 мин/день" },
      { name: "Чтение вслух", duration: "20 мин/день" },
    ],
    videos: [
      { title: "Развитие речи через сказки", specialist: "логопед" },
      { title: "Упражнения для языка", specialist: "логопед" },
    ],
    materials: [
      { title: "Этапы развития речи ребёнка", type: "Статья" },
      { title: "Игры на развитие речи", type: "PDF" },
    ],
    consultationAdvice: "Рекомендуется консультация логопеда",
  },
  cognitive: {
    priority: "Познавательная сфера",
    trainers: [
      { name: "Логические задачи", duration: "10 мин/день" },
      { name: "Развитие памяти", duration: "5 мин/день" },
      { name: "Внимание и концентрация", duration: "7 мин/день" },
    ],
    videos: [
      { title: "Развиваем логику играючи", specialist: "педагог-психолог" },
      { title: "Упражнения на память", specialist: "дефектолог" },
    ],
    materials: [
      { title: "Когнитивное развитие по возрастам", type: "Статья" },
      { title: "Развивающие игры дома", type: "PDF" },
    ],
    consultationAdvice: "Рекомендуется наблюдение дефектолога",
  },
  social: {
    priority: "Социально-коммуникативная сфера",
    trainers: [
      { name: "Ролевые игры", duration: "15 мин/день" },
      { name: "Командные задания", duration: "20 мин/день" },
      { name: "Правила общения", duration: "10 мин/день" },
    ],
    videos: [
      { title: "Учим ребёнка дружить", specialist: "педагог-психолог" },
      { title: "Развитие эмпатии", specialist: "психолог" },
    ],
    materials: [
      { title: "Социализация ребёнка", type: "Статья" },
      { title: "Игры на коммуникацию", type: "PDF" },
    ],
    consultationAdvice: "Рекомендуется консультация психолога",
  },
  emotional: {
    priority: "Эмоционально-волевая сфера",
    trainers: [
      { name: "Дыхательные упражнения", duration: "5 мин/день" },
      { name: "Эмоции в картинках", duration: "10 мин/день" },
      { name: "Саморегуляция", duration: "7 мин/день" },
    ],
    videos: [
      { title: "Управление эмоциями для детей", specialist: "психолог" },
      { title: "Учимся справляться со злостью", specialist: "педагог-психолог" },
    ],
    materials: [
      { title: "Эмоциональный интеллект ребёнка", type: "Статья" },
      { title: "Техники успокоения", type: "PDF" },
    ],
    consultationAdvice: "Рекомендуется консультация психолога",
  },
};

export const riskLevelInfo = {
  normal: {
    label: "Норма",
    description: "4–5 сфер в пределах возрастной нормы",
    color: "bg-green-500",
    action: "Автоматические рекомендации + напоминание через 3–6 мес",
  },
  attention: {
    label: "Требует внимания",
    description: "2–3 сферы частично соответствуют норме",
    color: "bg-yellow-500",
    action: "Персонализированный маршрут + рекомендация консультации",
  },
  help_needed: {
    label: "Требуется помощь",
    description: "3+ сферы не соответствуют норме ИЛИ критические задержки в одной сфере",
    color: "bg-red-500",
    action: "Рекомендуется консультация специалистов ППк",
  },
};
