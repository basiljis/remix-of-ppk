/**
 * Work directions for specialists.
 * Each direction maps to PPK checklist blocks and development test spheres.
 * Used for matching specialists to children's identified problem areas.
 */

export interface WorkDirection {
  slug: string;
  label: string;
  shortLabel: string;
  description: string;
  icon: string; // lucide icon name
  /** Keywords to match against PPK block titles (lowercase) */
  ppkBlockKeywords: string[];
  /** Keywords to match against development test sphere slugs */
  sphereSlugs: string[];
}

export const WORK_DIRECTIONS: WorkDirection[] = [
  {
    slug: "speech",
    label: "Речевое развитие",
    shortLabel: "Речь",
    description: "Логопедия, развитие речи, артикуляция, коррекция звукопроизношения",
    icon: "MessageCircle",
    ppkBlockKeywords: ["речев", "речь"],
    sphereSlugs: ["speech"],
  },
  {
    slug: "cognitive",
    label: "Познавательное развитие",
    shortLabel: "Познание",
    description: "Мышление, память, внимание, восприятие, интеллектуальное развитие",
    icon: "Brain",
    ppkBlockKeywords: ["когнитив", "познават", "мышлен"],
    sphereSlugs: ["cognitive"],
  },
  {
    slug: "regulatory",
    label: "Саморегуляция и поведение",
    shortLabel: "Регуляция",
    description: "Самоконтроль, произвольность, волевые процессы, управление эмоциями",
    icon: "Heart",
    ppkBlockKeywords: ["регулятив", "самоконтрол"],
    sphereSlugs: ["regulatory"],
  },
  {
    slug: "communicative",
    label: "Коммуникация и социализация",
    shortLabel: "Общение",
    description: "Общение со сверстниками, социальные навыки, адаптация в коллективе",
    icon: "Users",
    ppkBlockKeywords: ["коммуникат", "общени"],
    sphereSlugs: ["social"],
  },
  {
    slug: "behavioral",
    label: "Поведенческие трудности",
    shortLabel: "Поведение",
    description: "Коррекция поведения, СДВГ, агрессия, тревожность, страхи",
    icon: "ShieldAlert",
    ppkBlockKeywords: ["поведенч", "поведени"],
    sphereSlugs: ["behavioral"],
  },
  {
    slug: "emotional",
    label: "Эмоциональное развитие",
    shortLabel: "Эмоции",
    description: "Эмоциональный интеллект, психологическая поддержка, работа с тревожностью",
    icon: "Smile",
    ppkBlockKeywords: ["эмоцион"],
    sphereSlugs: ["emotional"],
  },
  {
    slug: "motor",
    label: "Моторное развитие",
    shortLabel: "Моторика",
    description: "Мелкая и крупная моторика, координация, сенсорная интеграция",
    icon: "Hand",
    ppkBlockKeywords: ["моторн", "двигатель"],
    sphereSlugs: ["motor"],
  },
  {
    slug: "defectology",
    label: "Дефектологическая помощь",
    shortLabel: "Дефектология",
    description: "Комплексная коррекция при задержке развития, работа с ОВЗ",
    icon: "Puzzle",
    ppkBlockKeywords: [],
    sphereSlugs: [],
  },
  {
    slug: "family",
    label: "Семейное консультирование",
    shortLabel: "Семья",
    description: "Работа с семьёй, детско-родительские отношения, адаптация",
    icon: "Home",
    ppkBlockKeywords: [],
    sphereSlugs: [],
  },
];

/**
 * Given PPK block titles with problem groups, return matching work direction slugs.
 */
export function matchDirectionsToProblems(
  problemBlocks: Array<{ blockTitle: string; group: number }>
): string[] {
  const matched = new Set<string>();

  for (const block of problemBlocks) {
    if (block.group < 2) continue; // Only groups 2 and 3 are problems
    const lowerTitle = block.blockTitle.toLowerCase();

    for (const dir of WORK_DIRECTIONS) {
      if (dir.ppkBlockKeywords.some((kw) => lowerTitle.includes(kw))) {
        matched.add(dir.slug);
      }
    }
  }

  return Array.from(matched);
}

/**
 * Get direction object by slug
 */
export function getDirectionBySlug(slug: string): WorkDirection | undefined {
  return WORK_DIRECTIONS.find((d) => d.slug === slug);
}

/**
 * Get direction labels for an array of slugs
 */
export function getDirectionLabels(slugs: string[]): string[] {
  return slugs
    .map((s) => WORK_DIRECTIONS.find((d) => d.slug === s)?.label)
    .filter(Boolean) as string[];
}
