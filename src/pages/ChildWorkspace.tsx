import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Star, RotateCcw } from "lucide-react";

import { Hand, Mic, Brain, MessageCircle, Heart } from "lucide-react";
import { TaskBlock, sphereConfig } from "@/components/child-workspace/types";
import { TaskCard } from "@/components/child-workspace/TaskCard";
import { BlockSelector } from "@/components/child-workspace/BlockSelector";
import { useChildTasks } from "@/components/child-workspace/useChildTasks";

const icons: Record<string, any> = { 
  motor: Hand, 
  speech: Mic, 
  cognitive: Brain, 
  social: MessageCircle, 
  emotional: Heart 
};

export default function ChildWorkspace() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const childId = searchParams.get("childId");
  
  const [selectedBlock, setSelectedBlock] = useState<TaskBlock | null>(null);

  const {
    blocks,
    sortedTasks,
    progress,
    currentTask,
    currentTaskIndex,
    selectedAnswer,
    totalPoints,
    isCurrentTaskRepeat,
    isCurrentTaskRetry,
    showWrongFeedback,
    wrongAttempts,
    isPending,
    setSelectedAnswer,
    handleSubmitAnswer,
    resetBlock,
  } = useChildTasks({ childId, selectedBlock });

  const handleBlockSelect = (block: TaskBlock) => {
    setSelectedBlock(block);
    resetBlock();
  };

  const handleExitBlock = () => {
    setSelectedBlock(null);
    resetBlock();
  };

  const onSubmit = async () => {
    const result = await handleSubmitAnswer();
    if (result === "block_complete") {
      setSelectedBlock(null);
      resetBlock();
    }
  };

  if (!childId) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50 dark:from-background dark:to-muted flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">Выберите ребёнка для прохождения заданий</p>
            <Button onClick={() => navigate("/parent")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Вернуться в кабинет
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Task completion screen
  if (selectedBlock && currentTask) {
    const config = sphereConfig[selectedBlock.sphere_slug] || sphereConfig.cognitive;
    const configWithIcon = { 
      ...config, 
      icon: icons[selectedBlock.sphere_slug] || Brain 
    };

    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50 dark:from-background dark:to-muted">
        {/* Header */}
        <header className="bg-card border-b p-4">
          <div className="container mx-auto flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={handleExitBlock}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад
            </Button>
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <span className="font-bold">{totalPoints}</span>
            </div>
          </div>
        </header>

        {/* Progress */}
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm text-muted-foreground">
              Задание {currentTaskIndex + 1} из {sortedTasks.length}
            </span>
            {isCurrentTaskRepeat && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground text-xs">
                <RotateCcw className="h-3 w-3" />
                Повторение
              </span>
            )}
            {isCurrentTaskRetry && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs">
                <RotateCcw className="h-3 w-3" />
                Ещё раз
              </span>
            )}
          </div>
          <Progress value={((currentTaskIndex + 1) / sortedTasks.length) * 100} className="h-2" />
        </div>

        {/* Task Card */}
        <div className="container mx-auto px-4 py-6">
          <TaskCard
            task={currentTask}
            blockTitle={selectedBlock.title}
            config={configWithIcon}
            sphereSlug={selectedBlock.sphere_slug}
            isRepeat={isCurrentTaskRepeat}
            selectedAnswer={selectedAnswer}
            onAnswerChange={setSelectedAnswer}
            onSubmit={onSubmit}
            isSubmitting={isPending}
            isLastTask={currentTaskIndex >= sortedTasks.length - 1}
            showWrongFeedback={showWrongFeedback}
            wrongAttempts={wrongAttempts}
          />
        </div>
      </div>
    );
  }

  // Block selection screen
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50 dark:from-background dark:to-muted">
      <header className="bg-card border-b p-4">
        <div className="container mx-auto flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/parent")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Задания для развития</h1>
            <p className="text-sm text-muted-foreground">Выбери блок и начни выполнять задания!</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            <span className="font-bold">{progress.reduce((sum, p) => sum + (p.score || 0), 0)}</span>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <BlockSelector
          blocks={blocks}
          progress={progress}
          onSelectBlock={handleBlockSelect}
        />

        {blocks.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            Загрузка заданий...
          </div>
        )}
      </div>
    </div>
  );
}
