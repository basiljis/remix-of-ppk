import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export type EducationLevel = "preschool" | "elementary" | "middle" | "high";

interface EducationLevelSelectorProps {
  selectedLevel: EducationLevel;
  onLevelChange: (level: EducationLevel) => void;
}

const levels: { value: EducationLevel; label: string; description: string }[] = [
  {
    value: "preschool",
    label: "Дошкольное образование",
    description: "3-7 лет"
  },
  {
    value: "elementary",
    label: "Начальное образование",
    description: "1-4 классы"
  },
  {
    value: "middle",
    label: "Основное образование",
    description: "5-9 классы"
  },
  {
    value: "high",
    label: "Среднее образование",
    description: "10-11 классы"
  }
];

export const EducationLevelSelector = ({ selectedLevel, onLevelChange }: EducationLevelSelectorProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {levels.map((level) => (
        <Button
          key={level.value}
          variant={selectedLevel === level.value ? "default" : "outline"}
          className={`h-auto p-4 flex flex-col items-center space-y-2 transition-all duration-200 ${
            selectedLevel === level.value
              ? "bg-primary text-primary-foreground shadow-lg scale-105"
              : "hover:bg-secondary/50"
          }`}
          onClick={() => onLevelChange(level.value)}
        >
          <span className="font-semibold text-sm text-center">{level.label}</span>
          <Badge variant="secondary" className="text-xs">
            {level.description}
          </Badge>
        </Button>
      ))}
    </div>
  );
};