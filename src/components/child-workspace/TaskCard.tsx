import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { 
  CheckCircle, ChevronRight, Trophy, Play, RotateCcw, AlertCircle, Lightbulb, PartyPopper, Shuffle
} from "lucide-react";
import { gameItemImages, sphereImages, taskImages, cat, dog, ball, apple } from "@/assets/game-items";
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

// Helper to get game type image (used for game type detection)
const getGameTypeImage = (content: any): string | null => {
  if (!content?.type) return null;
  
  switch (content.type) {
    case "puzzle": return taskImages.puzzle_game;
    case "memory": return taskImages.memory_game;
    case "sorting": return taskImages.sorting_game;
    default: return null;
  }
};
void getGameTypeImage; // Prevent unused warning - kept for future use

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

const puzzlePieces = [
  { id: 1, image: cat, label: "Кошка" },
  { id: 2, image: dog, label: "Собака" },
  { id: 3, image: ball, label: "Мяч" },
  { id: 4, image: apple, label: "Яблоко" },
];

type PuzzlePiece = { id: number; image: string; label: string; placed: boolean };

function PuzzleGame({ onComplete }: { onComplete: () => void }) {
  const [pieces, setPieces] = useState<PuzzlePiece[]>([]);
  const [slots, setSlots] = useState<(typeof puzzlePieces[0] | null)[]>([null, null, null, null]);
  const [selectedPiece, setSelectedPiece] = useState<PuzzlePiece | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  // Shuffle pieces on mount
  useEffect(() => {
    const shuffled = [...puzzlePieces].sort(() => Math.random() - 0.5).map(p => ({ ...p, placed: false }));
    setPieces(shuffled);
  }, []);

  const handlePieceClick = (piece: PuzzlePiece) => {
    if (piece.placed) return;
    setSelectedPiece(piece);
  };

  const handleSlotClick = (slotIndex: number) => {
    if (!selectedPiece) return;
    if (slots[slotIndex]) return; // Slot already filled

    const newSlots = [...slots];
    newSlots[slotIndex] = selectedPiece;
    setSlots(newSlots);

    setPieces(prev => prev.map(p => p.id === selectedPiece.id ? { ...p, placed: true } : p));
    setSelectedPiece(null);

    // Check if all slots are filled
    if (newSlots.filter(Boolean).length === 4) {
      setIsComplete(true);
    }
  };

  const handleReset = () => {
    const shuffled = [...puzzlePieces].sort(() => Math.random() - 0.5).map(p => ({ ...p, placed: false }));
    setPieces(shuffled);
    setSlots([null, null, null, null]);
    setSelectedPiece(null);
    setIsComplete(false);
  };

  const gameImage = taskImages.puzzle_game;

  return (
    <div className="text-center py-4">
      {gameImage && (
        <div className="flex justify-center mb-4">
          <img src={gameImage} alt="Пазл" className="w-28 h-28 object-contain rounded-xl bg-muted/30 p-2" />
        </div>
      )}
      
      {/* Available pieces */}
      <div className="bg-muted/30 rounded-xl p-4 mb-6">
        <p className="text-sm text-muted-foreground mb-3">Выбери картинку и нажми на место:</p>
        <div className="flex justify-center gap-3 flex-wrap">
          {pieces.map((piece) => (
            <div 
              key={piece.id}
              onClick={() => handlePieceClick(piece)}
              className={`w-20 h-20 rounded-xl flex items-center justify-center transition-all cursor-pointer
                ${piece.placed 
                  ? "bg-muted opacity-30 cursor-not-allowed" 
                  : selectedPiece?.id === piece.id 
                    ? "ring-4 ring-primary bg-white shadow-lg scale-110" 
                    : "bg-white hover:shadow-md hover:scale-105"
                }`}
            >
              <img src={piece.image} alt={piece.label} className="w-16 h-16 object-contain" />
            </div>
          ))}
        </div>
      </div>
      
      {/* Slots */}
      <p className="text-sm text-muted-foreground mb-3">Собери картинку:</p>
      <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto mb-6">
        {slots.map((slot, index) => (
          <div 
            key={index}
            onClick={() => handleSlotClick(index)}
            className={`aspect-square rounded-xl flex items-center justify-center transition-all
              ${slot 
                ? "bg-white shadow-md" 
                : selectedPiece 
                  ? "border-3 border-dashed border-primary bg-primary/10 cursor-pointer hover:bg-primary/20" 
                  : "border-2 border-dashed border-muted-foreground/30 bg-muted/20"
              }`}
          >
            {slot ? (
              <img src={slot.image} alt={slot.label} className="w-16 h-16 object-contain" />
            ) : (
              <span className="text-3xl font-bold text-muted-foreground/30">{index + 1}</span>
            )}
          </div>
        ))}
      </div>
      
      <div className="flex justify-center gap-3">
        <Button variant="outline" size="sm" onClick={handleReset}>
          <Shuffle className="mr-2 h-4 w-4" />
          Заново
        </Button>
        {isComplete && (
          <Button onClick={onComplete} className="animate-pulse">
            <CheckCircle className="mr-2 h-4 w-4" />
            Готово!
          </Button>
        )}
      </div>
    </div>
  );
}

// Memory game component
function MemoryGame({ onComplete }: { onComplete: () => void }) {
  const cardImages = [cat, dog, ball, apple];
  const [cards, setCards] = useState<Array<{ id: number; image: string; flipped: boolean; matched: boolean }>>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const gameCards = [...cardImages, ...cardImages].map((image, index) => ({
      id: index,
      image,
      flipped: false,
      matched: false,
    })).sort(() => Math.random() - 0.5);
    setCards(gameCards);
  }, []);

  const handleCardClick = (cardId: number) => {
    if (flippedCards.length >= 2) return;
    if (cards[cardId].flipped || cards[cardId].matched) return;

    const newCards = [...cards];
    newCards[cardId].flipped = true;
    setCards(newCards);

    const newFlipped = [...flippedCards, cardId];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      const [first, second] = newFlipped;
      if (cards[first].image === cards[second].image) {
        // Match!
        setTimeout(() => {
          const matchedCards = [...newCards];
          matchedCards[first].matched = true;
          matchedCards[second].matched = true;
          setCards(matchedCards);
          setFlippedCards([]);
          
          if (matchedCards.every(c => c.matched)) {
            setIsComplete(true);
          }
        }, 500);
      } else {
        // No match
        setTimeout(() => {
          const resetCards = [...newCards];
          resetCards[first].flipped = false;
          resetCards[second].flipped = false;
          setCards(resetCards);
          setFlippedCards([]);
        }, 1000);
      }
    }
  };

  const gameImage = taskImages.memory_game;

  return (
    <div className="text-center py-4">
      {gameImage && (
        <div className="flex justify-center mb-4">
          <img src={gameImage} alt="Память" className="w-28 h-28 object-contain rounded-xl bg-muted/30 p-2" />
        </div>
      )}
      
      <p className="text-sm text-muted-foreground mb-3">Найди одинаковые картинки:</p>
      <div className="grid grid-cols-4 gap-2 max-w-sm mx-auto mb-6">
        {cards.map((card) => (
          <div 
            key={card.id}
            onClick={() => handleCardClick(card.id)}
            className={`aspect-square rounded-lg flex items-center justify-center cursor-pointer transition-all
              ${card.matched 
                ? "bg-emerald-100 border-2 border-emerald-400" 
                : card.flipped 
                  ? "bg-white shadow-md" 
                  : "bg-gradient-to-br from-primary/30 to-accent/30 hover:scale-105"
              }`}
          >
            {card.flipped || card.matched ? (
              <img src={card.image} alt="" className="w-12 h-12 object-contain" />
            ) : (
              <span className="text-2xl">🎴</span>
            )}
          </div>
        ))}
      </div>
      
      {isComplete && (
        <Button onClick={onComplete} className="animate-pulse">
          <CheckCircle className="mr-2 h-4 w-4" />
          Ура, нашёл все!
        </Button>
      )}
    </div>
  );
}

// Sorting game component
function SortingGame({ onComplete }: { onComplete: () => void }) {
  const items = [
    { id: 1, image: apple, label: "Яблоко", category: "fruits" },
    { id: 2, image: ball, label: "Мяч", category: "toys" },
    { id: 3, image: cat, label: "Кошка", category: "animals" },
    { id: 4, image: dog, label: "Собака", category: "animals" },
  ];
  
  const [availableItems, setAvailableItems] = useState(items.sort(() => Math.random() - 0.5));
  const [baskets, setBaskets] = useState<{ animals: typeof items; others: typeof items }>({ animals: [], others: [] });
  const [selectedItem, setSelectedItem] = useState<typeof items[0] | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const handleItemClick = (item: typeof items[0]) => {
    setSelectedItem(item);
  };

  const handleBasketClick = (basket: "animals" | "others") => {
    if (!selectedItem) return;

    setBaskets(prev => ({
      ...prev,
      [basket]: [...prev[basket], selectedItem]
    }));
    setAvailableItems(prev => prev.filter(i => i.id !== selectedItem.id));
    setSelectedItem(null);

    if (availableItems.length === 1) {
      setIsComplete(true);
    }
  };

  const gameImage = taskImages.sorting_game;

  return (
    <div className="text-center py-4">
      {gameImage && (
        <div className="flex justify-center mb-4">
          <img src={gameImage} alt="Сортировка" className="w-28 h-28 object-contain rounded-xl bg-muted/30 p-2" />
        </div>
      )}
      
      {/* Available items */}
      {availableItems.length > 0 && (
        <div className="bg-muted/30 rounded-xl p-4 mb-4">
          <p className="text-sm text-muted-foreground mb-3">Выбери картинку:</p>
          <div className="flex justify-center gap-3 flex-wrap">
            {availableItems.map((item) => (
              <div 
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={`w-16 h-16 rounded-xl flex items-center justify-center transition-all cursor-pointer bg-white
                  ${selectedItem?.id === item.id ? "ring-4 ring-primary shadow-lg scale-110" : "hover:shadow-md hover:scale-105"}`}
              >
                <img src={item.image} alt={item.label} className="w-12 h-12 object-contain" />
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Baskets */}
      <p className="text-sm text-muted-foreground mb-3">Разложи по корзинкам:</p>
      <div className="flex justify-center gap-4 mb-6">
        <div 
          onClick={() => handleBasketClick("animals")}
          className={`w-32 p-3 border-2 border-dashed rounded-xl transition-all
            ${selectedItem ? "border-primary cursor-pointer hover:bg-primary/10" : "border-muted-foreground/30"}`}
        >
          <p className="text-sm font-medium mb-2">🐾 Животные</p>
          <div className="flex flex-wrap gap-1 justify-center min-h-[40px]">
            {baskets.animals.map(item => (
              <img key={item.id} src={item.image} alt={item.label} className="w-8 h-8 object-contain" />
            ))}
          </div>
        </div>
        <div 
          onClick={() => handleBasketClick("others")}
          className={`w-32 p-3 border-2 border-dashed rounded-xl transition-all
            ${selectedItem ? "border-primary cursor-pointer hover:bg-primary/10" : "border-muted-foreground/30"}`}
        >
          <p className="text-sm font-medium mb-2">📦 Остальное</p>
          <div className="flex flex-wrap gap-1 justify-center min-h-[40px]">
            {baskets.others.map(item => (
              <img key={item.id} src={item.image} alt={item.label} className="w-8 h-8 object-contain" />
            ))}
          </div>
        </div>
      </div>
      
      {isComplete && (
        <Button onClick={onComplete} className="animate-pulse">
          <CheckCircle className="mr-2 h-4 w-4" />
          Всё разложил!
        </Button>
      )}
    </div>
  );
}

function GameTask({ content, onAnswerChange }: Omit<GameTaskProps, "task" | "selectedAnswer">) {
  // Different game types with interactive components
  if (content?.type === "puzzle") {
    return <PuzzleGame onComplete={() => onAnswerChange("played")} />;
  }

  if (content?.type === "memory") {
    return <MemoryGame onComplete={() => onAnswerChange("played")} />;
  }

  if (content?.type === "sorting") {
    return <SortingGame onComplete={() => onAnswerChange("played")} />;
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
