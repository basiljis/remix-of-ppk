import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { 
  CheckCircle, ChevronRight, Trophy, Play, RotateCcw, AlertCircle, Lightbulb, PartyPopper
} from "lucide-react";
import { gameItemImages, sphereImages, taskImages } from "@/assets/game-items";
import { BlockTask, SphereConfig } from "./types";
import { SuccessFeedback } from "./useChildTasks";
import { TimedExercise, hasTimingInstructions } from "./TimedExercise";
// Helper to find task image based on task title or content
const getTaskImage = (task: BlockTask): string | null => {
  const title = task.title.toLowerCase();
  const instruction = task.instruction.toLowerCase();
  
  // Emotions
  if (title.includes("покажи эмоцию") || instruction.includes("покажи лицом")) return taskImages.show_emotions;
  if (title.includes("эмоци") || instruction.includes("эмоци")) return taskImages.happy;
  if (title.includes("грусть") || instruction.includes("грустит")) return taskImages.sad;
  if (title.includes("помоги друг") || instruction.includes("друг грустит")) return taskImages.help_friend;
  
  // Memory & cognitive
  if (title.includes("что пропало") || instruction.includes("исчезла")) return taskImages.what_disappeared;
  if (title.includes("порядок") || instruction.includes("порядке")) return taskImages.picture_order;
  if (title.includes("повтори слова") || instruction.includes("повтори")) return taskImages.repeat_words;
  if (title.includes("память") || instruction.includes("запомни")) return taskImages.color_memory;
  if (title.includes("фрукт") || instruction.includes("фрукт")) return taskImages.count_fruits;
  
  // Breathing & relaxation
  if (title.includes("дыши") || instruction.includes("дыхани") || instruction.includes("вдохни")) return taskImages.breathing_calm;
  
  // Motor
  if (title.includes("бабочка") || instruction.includes("бабочк")) return taskImages.butterfly;
  
  // Speech
  if (title.includes("язык") || instruction.includes("язык") || instruction.includes("язычок")) return taskImages.tongue;
  
  // Social
  if (title.includes("здоров") || instruction.includes("здоров") || instruction.includes("привет")) return taskImages.hello;
  if (title.includes("делим") || instruction.includes("игрушк")) return taskImages.sharing;
  if (title.includes("волшебн") || instruction.includes("спасибо") || instruction.includes("помогли")) return taskImages.thank_you;
  if (title.includes("комплимент") || instruction.includes("комплимент") || instruction.includes("приятное")) return taskImages.compliment;
  if (title.includes("радуемся") || instruction.includes("подарок") || instruction.includes("радость")) return taskImages.receiving_gift;
  if (title.includes("магазин") || instruction.includes("магазин")) return taskImages.shop;
  
  return null;
};

// Helper to get game type image
const getGameTypeImage = (content: any): string | null => {
  if (!content?.type) return null;
  
  switch (content.type) {
    case "puzzle": return taskImages.puzzle_game;
    case "memory": return taskImages.memory_game;
    case "sorting": return taskImages.sorting_game;
    default: return null;
  }
};

interface TaskCardProps {
  task: BlockTask;
  blockTitle: string;
  config: SphereConfig;
  sphereSlug: string;
  isRepeat: boolean;
  selectedAnswer: string;
  onAnswerChange: (answer: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  isLastTask: boolean;
  showWrongFeedback: boolean;
  wrongAttempts: number;
  successFeedback: SuccessFeedback | null;
  showSimilarHint: boolean;
}

export function TaskCard({
  task,
  blockTitle,
  config,
  sphereSlug,
  isRepeat,
  selectedAnswer,
  onAnswerChange,
  onSubmit,
  isSubmitting,
  isLastTask,
  showWrongFeedback,
  wrongAttempts,
  successFeedback,
  showSimilarHint,
}: TaskCardProps) {
  const content = task.content as any;
  const Icon = config.icon;

  return (
    <Card className="max-w-2xl mx-auto shadow-lg">
      <CardHeader className={`${config.bgColor} rounded-t-lg`}>
        <div className="flex items-center gap-3">
          {sphereImages[sphereSlug] ? (
            <img 
              src={sphereImages[sphereSlug]} 
              alt={config.name} 
              className="w-14 h-14 object-contain rounded-full bg-white/80 p-1"
            />
          ) : Icon ? (
            <div className={`p-3 rounded-full bg-white/80 ${config.color}`}>
              <Icon className="h-6 w-6" />
            </div>
          ) : null}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className={`text-lg ${config.textColor}`}>{task.title}</CardTitle>
              {isRepeat && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <RotateCcw className="h-3 w-3" />
                  Повторение
                </Badge>
              )}
            </div>
            <CardDescription className={`${config.textColor} opacity-80`}>
              {blockTitle}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6 pb-8">
        {/* Success feedback - inline at top, not blocking content */}
        {successFeedback && (
          <div className="mb-4 p-4 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="p-2 rounded-full bg-emerald-100">
              <PartyPopper className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-emerald-800">{successFeedback.message} 🎉</p>
              <p className="text-sm text-emerald-700">+{successFeedback.points} очков!</p>
            </div>
          </div>
        )}

        {/* Similar task hint */}
        {showSimilarHint && (
          <div className="mb-4 p-4 rounded-lg bg-blue-50 border border-blue-200 flex items-center gap-3 animate-in fade-in duration-300">
            <Lightbulb className="h-5 w-5 text-blue-600" />
            <p className="text-blue-800">Давай попробуем похожее задание! А к этому вернёмся позже 🎯</p>
          </div>
        )}

        {/* Wrong answer feedback */}
        {showWrongFeedback && !successFeedback && (
          <div className="mb-4 p-4 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">
                {wrongAttempts === 1 ? "Попробуй ещё раз!" : wrongAttempts >= 3 ? "Ничего страшного!" : "Подумай внимательнее!"}
              </p>
              <p className="text-sm text-amber-700 mt-1">
                {wrongAttempts >= 2 && wrongAttempts < 3 && (
                  <span className="flex items-center gap-1">
                    <Lightbulb className="h-4 w-4" />
                    Подсказка: внимательно посмотри на все варианты
                  </span>
                )}
                {wrongAttempts >= 3 && "Перейдём к следующему заданию"}
              </p>
            </div>
          </div>
        )}

        {/* Task illustration */}
        {getTaskImage(task) && (
          <div className="flex justify-center mb-6">
            <img 
              src={getTaskImage(task)!} 
              alt="Иллюстрация к заданию" 
              className="w-40 h-40 object-contain rounded-xl bg-white/50 p-2 shadow-sm"
            />
          </div>
        )}
        
        <p className="text-lg mb-6">{task.instruction}</p>

        {/* Question type */}
        {task.task_type === "question" && content?.options && (
          <RadioGroup value={selectedAnswer} onValueChange={onAnswerChange} className="space-y-3">
            {(content.options as string[]).map((option, index) => {
              const optionLower = option.toLowerCase().trim();
              const imageUrl = gameItemImages[optionLower];
              
              return (
                <div 
                  key={index}
                  className={`flex items-center space-x-4 p-4 rounded-xl border-2 transition-all cursor-pointer
                    ${selectedAnswer === String(index) 
                      ? "border-primary bg-primary/5" 
                      : "border-muted hover:border-primary/50"
                    }`}
                  onClick={() => onAnswerChange(String(index))}
                >
                  <RadioGroupItem value={String(index)} id={`option-${index}`} />
                  {imageUrl && (
                    <img 
                      src={imageUrl} 
                      alt={option} 
                      className="w-20 h-20 object-contain rounded-lg bg-white/80 p-1"
                    />
                  )}
                  <Label htmlFor={`option-${index}`} className="text-lg cursor-pointer flex-1 font-medium">
                    {option}
                  </Label>
                </div>
              );
            })}
          </RadioGroup>
        )}

        {/* Exercise type - with optional timer for timed exercises */}
        {task.task_type === "exercise" && content?.steps && (
          hasTimingInstructions(content.steps as string[]) ? (
            <TimedExercise 
              steps={content.steps as string[]} 
              onComplete={() => onAnswerChange("done")}
            />
          ) : (
            <div className="space-y-3">
              {(content.steps as string[]).map((step, index) => (
                <div 
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                >
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  <span>{step}</span>
                </div>
              ))}
              <div className="pt-4">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => onAnswerChange("done")}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Я выполнил задание!
                </Button>
              </div>
            </div>
          )
        )}

        {/* Game type with interactive elements */}
        {task.task_type === "game" && (
          <GameTask 
            content={content} 
            onAnswerChange={onAnswerChange}
          />
        )}

        <div className="mt-8">
          <Button 
            className="w-full text-lg py-6"
            disabled={!selectedAnswer || isSubmitting}
            onClick={onSubmit}
          >
            {isLastTask ? (
              <>
                Завершить
                <Trophy className="ml-2 h-5 w-5" />
              </>
            ) : (
              <>
                Дальше
                <ChevronRight className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface GameTaskProps {
  task: BlockTask;
  content: any;
  selectedAnswer: string;
  onAnswerChange: (answer: string) => void;
}

function GameTask({ content, onAnswerChange }: Omit<GameTaskProps, "task" | "selectedAnswer">) {
  const gameImage = getGameTypeImage(content);
  
  // Different game types
  if (content?.type === "puzzle") {
    return (
      <div className="text-center py-6">
        {gameImage && (
          <div className="flex justify-center mb-4">
            <img src={gameImage} alt="Пазл" className="w-32 h-32 object-contain rounded-xl bg-muted/30 p-2" />
          </div>
        )}
        <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto mb-6">
          {[1, 2, 3, 4].map((piece) => (
            <div 
              key={piece}
              className="aspect-square bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg flex items-center justify-center text-2xl font-bold text-primary cursor-pointer hover:scale-105 transition-transform"
              onClick={() => onAnswerChange(`piece-${piece}`)}
            >
              {piece}
            </div>
          ))}
        </div>
        <Button 
          variant="outline" 
          onClick={() => onAnswerChange("played")}
          className="mt-4"
        >
          <Play className="mr-2 h-4 w-4" />
          Я собрал пазл!
        </Button>
      </div>
    );
  }

  if (content?.type === "memory") {
    return (
      <div className="text-center py-6">
        {gameImage && (
          <div className="flex justify-center mb-4">
            <img src={gameImage} alt="Память" className="w-32 h-32 object-contain rounded-xl bg-muted/30 p-2" />
          </div>
        )}
        <div className="grid grid-cols-4 gap-2 max-w-sm mx-auto mb-6">
          {[...Array(8)].map((_, i) => (
            <div 
              key={i}
              className="aspect-square bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
            >
              <span className="text-xl">🎴</span>
            </div>
          ))}
        </div>
        <Button 
          variant="outline" 
          onClick={() => onAnswerChange("played")}
          className="mt-4"
        >
          <CheckCircle className="mr-2 h-4 w-4" />
          Я нашёл все пары!
        </Button>
      </div>
    );
  }

  if (content?.type === "sorting") {
    return (
      <div className="text-center py-6">
        {gameImage && (
          <div className="flex justify-center mb-4">
            <img src={gameImage} alt="Сортировка" className="w-32 h-32 object-contain rounded-xl bg-muted/30 p-2" />
          </div>
        )}
        <p className="text-muted-foreground mb-4">Перетащи предметы в нужные корзины</p>
        <div className="flex justify-center gap-4 mb-6">
          <div className="w-24 h-24 border-2 border-dashed border-primary/50 rounded-xl flex items-center justify-center">
            🍎
          </div>
          <div className="w-24 h-24 border-2 border-dashed border-primary/50 rounded-xl flex items-center justify-center">
            🚗
          </div>
        </div>
        <Button 
          variant="outline" 
          onClick={() => onAnswerChange("played")}
        >
          <CheckCircle className="mr-2 h-4 w-4" />
          Готово!
        </Button>
      </div>
    );
  }

  // Default game placeholder
  return (
    <div className="text-center py-8">
      <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center">
        <Play className="h-10 w-10 text-primary-foreground" />
      </div>
      <p className="text-muted-foreground mb-4">Игровое задание</p>
      <Button onClick={() => onAnswerChange("played")}>
        Я поиграл!
      </Button>
    </div>
  );
}
