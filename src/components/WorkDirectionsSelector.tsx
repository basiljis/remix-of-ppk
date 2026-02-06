import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { WORK_DIRECTIONS } from "@/constants/workDirections";
import {
  MessageCircle, Brain, Heart, Users, ShieldAlert,
  Smile, Hand, Puzzle, Home,
} from "lucide-react";

const iconMap: Record<string, React.ReactNode> = {
  MessageCircle: <MessageCircle className="h-4 w-4" />,
  Brain: <Brain className="h-4 w-4" />,
  Heart: <Heart className="h-4 w-4" />,
  Users: <Users className="h-4 w-4" />,
  ShieldAlert: <ShieldAlert className="h-4 w-4" />,
  Smile: <Smile className="h-4 w-4" />,
  Hand: <Hand className="h-4 w-4" />,
  Puzzle: <Puzzle className="h-4 w-4" />,
  Home: <Home className="h-4 w-4" />,
};

interface WorkDirectionsSelectorProps {
  selected: string[];
  onChange: (directions: string[]) => void;
  compact?: boolean;
}

export function WorkDirectionsSelector({ selected, onChange, compact = false }: WorkDirectionsSelectorProps) {
  const toggleDirection = (slug: string) => {
    if (selected.includes(slug)) {
      onChange(selected.filter((s) => s !== slug));
    } else {
      onChange([...selected, slug]);
    }
  };

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {WORK_DIRECTIONS.map((dir) => {
          const isSelected = selected.includes(dir.slug);
          return (
            <Badge
              key={dir.slug}
              variant={isSelected ? "default" : "outline"}
              className="cursor-pointer gap-1.5 transition-colors"
              onClick={() => toggleDirection(dir.slug)}
            >
              {iconMap[dir.icon]}
              {dir.shortLabel}
            </Badge>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {WORK_DIRECTIONS.map((dir) => (
        <div
          key={dir.slug}
          className="flex items-start gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
          onClick={() => toggleDirection(dir.slug)}
        >
          <Checkbox
            checked={selected.includes(dir.slug)}
            onCheckedChange={() => toggleDirection(dir.slug)}
            className="mt-0.5"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-primary">{iconMap[dir.icon]}</span>
              <Label className="font-medium cursor-pointer">{dir.label}</Label>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{dir.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
