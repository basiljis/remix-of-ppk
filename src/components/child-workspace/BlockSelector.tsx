import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Clock } from "lucide-react";
import { sphereImages } from "@/assets/game-items";
import { TaskBlock, TaskProgress, sphereConfig } from "./types";
import { Hand, Mic, Brain, MessageCircle, Heart } from "lucide-react";

const icons = { Hand, Mic, Brain, MessageCircle, Heart };

interface BlockSelectorProps {
  blocks: TaskBlock[];
  progress: TaskProgress[];
  onSelectBlock: (block: TaskBlock) => void;
}

export function BlockSelector({ blocks, progress, onSelectBlock }: BlockSelectorProps) {
  const getBlockCompletionPercent = (blockId: string) => {
    const completed = progress.filter(p => p.block_id === blockId && p.status === "completed");
    // Simplified: assume 5 tasks per block if we don't have task count
    return Math.min(100, completed.length * 20);
  };

  const getIcon = (sphereSlug: string) => {
    const iconMap: Record<string, any> = {
      motor: icons.Hand,
      speech: icons.Mic,
      cognitive: icons.Brain,
      social: icons.MessageCircle,
      emotional: icons.Heart,
    };
    return iconMap[sphereSlug] || icons.Brain;
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {blocks.map((block) => {
        const config = sphereConfig[block.sphere_slug] || sphereConfig.cognitive;
        const Icon = getIcon(block.sphere_slug);
        const completionPercent = getBlockCompletionPercent(block.id);

        return (
          <Card 
            key={block.id}
            className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1"
            onClick={() => onSelectBlock(block)}
          >
            <CardHeader className={`${config.bgColor} rounded-t-lg`}>
              <div className="flex items-center gap-3">
                {sphereImages[block.sphere_slug] ? (
                  <img 
                    src={sphereImages[block.sphere_slug]} 
                    alt={config.name} 
                    className="w-14 h-14 object-contain rounded-full bg-white/80 p-1"
                  />
                ) : (
                  <div className={`p-3 rounded-full bg-white/80 ${config.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                )}
                <div>
                  <CardTitle className={`text-base ${config.textColor}`}>{block.title}</CardTitle>
                  <p className={`text-sm ${config.textColor} opacity-80`}>{config.name}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {block.description && (
                <p className="text-sm text-muted-foreground mb-3">{block.description}</p>
              )}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{block.estimated_duration_minutes} мин</span>
                </div>
                {completionPercent > 0 && (
                  <Badge variant={completionPercent === 100 ? "default" : "secondary"}>
                    {completionPercent}%
                  </Badge>
                )}
              </div>
              {completionPercent > 0 && (
                <Progress value={completionPercent} className="mt-3 h-1.5" />
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
