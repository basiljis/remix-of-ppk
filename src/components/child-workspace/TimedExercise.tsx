import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Play, Pause, RotateCcw, Timer } from "lucide-react";

interface TimedExerciseProps {
  steps: string[];
  onComplete: () => void;
}

// Parse step for timing info (e.g., "считай до 4" -> 4 seconds)
const parseStepDuration = (step: string): number | null => {
  const match = step.match(/счита[йи]\s+до\s+(\d+)/i);
  if (match) return parseInt(match[1], 10);
  
  // Check for repeat instructions
  const repeatMatch = step.match(/повтори\s+(\d+)\s+раз/i);
  if (repeatMatch) return null; // No timer for repeat instructions
  
  return null;
};

// Check if exercise has timing instructions
export const hasTimingInstructions = (steps: string[]): boolean => {
  return steps.some(step => parseStepDuration(step) !== null);
};

export function TimedExercise({ steps, onComplete }: TimedExerciseProps) {
  const [isStarted, setIsStarted] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [stepTimer, setStepTimer] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const currentStepDuration = parseStepDuration(steps[currentStep]);
  const hasTimer = currentStepDuration !== null;

  // Timer logic
  useEffect(() => {
    if (!isRunning || !hasTimer || !currentStepDuration) return;

    const interval = setInterval(() => {
      setStepTimer(prev => {
        if (prev >= currentStepDuration) {
          // Move to next step
          if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
            return 0;
          } else {
            setIsRunning(false);
            setIsComplete(true);
            return prev;
          }
        }
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, hasTimer, currentStepDuration, currentStep, steps.length]);

  const handleStart = useCallback(() => {
    setIsStarted(true);
    setIsRunning(true);
    setCurrentStep(0);
    setStepTimer(0);
    setIsComplete(false);
  }, []);

  const handlePause = useCallback(() => {
    setIsRunning(prev => !prev);
  }, []);

  const handleRestart = useCallback(() => {
    setCurrentStep(0);
    setStepTimer(0);
    setIsRunning(true);
    setIsComplete(false);
  }, []);

  const handleNextStep = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
      setStepTimer(0);
    } else {
      setIsComplete(true);
      setIsRunning(false);
    }
  }, [currentStep, steps.length]);

  // Not started - show start screen
  if (!isStarted) {
    return (
      <div className="space-y-4">
        {/* Preview steps */}
        <div className="space-y-3 opacity-75">
          {steps.map((step, index) => (
            <div 
              key={index}
              className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
            >
              <div className="w-6 h-6 rounded-full bg-primary/60 text-primary-foreground flex items-center justify-center text-sm font-bold">
                {index + 1}
              </div>
              <span className="text-muted-foreground">{step}</span>
            </div>
          ))}
        </div>

        {/* Start button */}
        <div className="pt-4">
          <Button 
            onClick={handleStart}
            className="w-full py-6 text-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
          >
            <Play className="mr-2 h-5 w-5" />
            Начать упражнение
          </Button>
          <p className="text-center text-sm text-muted-foreground mt-2 flex items-center justify-center gap-1">
            <Timer className="h-4 w-4" />
            Будет таймер для каждого шага
          </p>
        </div>
      </div>
    );
  }

  // Completed
  if (isComplete) {
    return (
      <div className="space-y-4">
        <div className="text-center py-6">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 flex items-center justify-center animate-bounce">
            <CheckCircle className="h-10 w-10 text-white" />
          </div>
          <p className="text-lg font-medium text-emerald-700">Отлично! Упражнение выполнено! 🎉</p>
        </div>

        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={handleRestart}
            className="flex-1"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Повторить
          </Button>
          <Button 
            onClick={onComplete}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Готово!
          </Button>
        </div>
      </div>
    );
  }

  // In progress
  return (
    <div className="space-y-4">
      {/* Current step highlight */}
      <div className="space-y-3">
        {steps.map((step, index) => {
          const isCurrentStep = index === currentStep;
          const isPastStep = index < currentStep;
          const stepDuration = parseStepDuration(step);
          
          return (
            <div 
              key={index}
              className={`flex items-start gap-3 p-4 rounded-lg transition-all duration-300 ${
                isCurrentStep 
                  ? "bg-primary/10 border-2 border-primary scale-105 shadow-md" 
                  : isPastStep 
                    ? "bg-emerald-50 border border-emerald-200" 
                    : "bg-muted/30 opacity-50"
              }`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                isPastStep 
                  ? "bg-emerald-500 text-white" 
                  : isCurrentStep 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted-foreground/30 text-muted-foreground"
              }`}>
                {isPastStep ? <CheckCircle className="h-4 w-4" /> : index + 1}
              </div>
              <div className="flex-1">
                <span className={isCurrentStep ? "font-medium" : ""}>{step}</span>
                
                {/* Timer for current step */}
                {isCurrentStep && stepDuration && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-primary font-medium">
                        {stepTimer} / {stepDuration}
                      </span>
                      <span className="text-muted-foreground">секунд</span>
                    </div>
                    <Progress 
                      value={(stepTimer / stepDuration) * 100} 
                      className="h-3"
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Controls */}
      <div className="flex gap-3 pt-4">
        <Button 
          variant="outline" 
          onClick={handlePause}
          className="flex-1"
        >
          {isRunning ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
          {isRunning ? "Пауза" : "Продолжить"}
        </Button>
        
        {!hasTimer && (
          <Button 
            onClick={handleNextStep}
            className="flex-1"
          >
            {currentStep < steps.length - 1 ? "Дальше" : "Готово"}
          </Button>
        )}
      </div>

      {/* Step indicator */}
      <p className="text-center text-sm text-muted-foreground">
        Шаг {currentStep + 1} из {steps.length}
      </p>
    </div>
  );
}
