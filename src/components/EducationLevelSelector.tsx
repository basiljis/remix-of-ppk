import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Baby, BookOpen, GraduationCap, Award, LucideIcon } from "lucide-react";

export type EducationLevel = "preschool" | "elementary" | "middle" | "high";

interface EducationLevelSelectorProps {
  selectedLevel: EducationLevel;
  onLevelChange: (level: EducationLevel) => void;
}

const levels: { 
  value: EducationLevel; 
  label: string; 
  description: string;
  icon: LucideIcon;
}[] = [
  {
    value: "preschool",
    label: "Дошкольное образование",
    description: "3-7 лет",
    icon: Baby
  },
  {
    value: "elementary",
    label: "Начальное образование",
    description: "1-4 классы",
    icon: BookOpen
  },
  {
    value: "middle",
    label: "Основное образование",
    description: "5-9 классы",
    icon: GraduationCap
  },
  {
    value: "high",
    label: "Среднее образование",
    description: "10-11 классы",
    icon: Award
  }
];

export const EducationLevelSelector = ({ selectedLevel, onLevelChange }: EducationLevelSelectorProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
      {levels.map((level) => {
        const IconComponent = level.icon;
        return (
          <Button
            key={level.value}
            variant={selectedLevel === level.value ? "default" : "outline"}
            className={`h-auto p-3 sm:p-4 flex flex-col items-center space-y-1.5 sm:space-y-2 transition-all duration-200 ${
              selectedLevel === level.value
                ? "bg-primary text-primary-foreground shadow-lg scale-105"
                : "hover:bg-secondary/50"
            }`}
            onClick={() => onLevelChange(level.value)}
          >
            <IconComponent className="w-5 h-5 sm:w-6 sm:h-6 mb-1" />
            <span className="font-semibold text-xs sm:text-sm text-center leading-tight">
              {level.label}
            </span>
            <Badge variant="secondary" className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5">
              {level.description}
            </Badge>
          </Button>
        );
      })}
    </div>
  );
};