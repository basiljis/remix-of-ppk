import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BlockTask, TaskBlock, TaskProgress } from "./types";

const INACTIVITY_THRESHOLD = 30000; // 30 seconds

interface UseChildTasksOptions {
  childId: string | null;
  selectedBlock: TaskBlock | null;
}

interface WrongAnswerTracking {
  taskId: string;
  attempts: number;
  scheduledRetry: number | null; // timestamp when to retry
}

export interface SuccessFeedback {
  message: string;
  points: number;
  isRetry: boolean;
}

export function useChildTasks({ childId, selectedBlock }: UseChildTasksOptions) {
  const queryClient = useQueryClient();
  
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [totalPoints, setTotalPoints] = useState(0);
  const [showWrongFeedback, setShowWrongFeedback] = useState(false);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [wrongAnswerQueue, setWrongAnswerQueue] = useState<WrongAnswerTracking[]>([]);
  const [successFeedback, setSuccessFeedback] = useState<SuccessFeedback | null>(null);
  const [showSimilarHint, setShowSimilarHint] = useState(false);
  
  // Interaction time tracking
  const taskStartTimeRef = useRef<number | null>(null);
  const interactionTimeRef = useRef<number>(0);
  const lastActivityRef = useRef<number>(Date.now());
  const isActiveRef = useRef<boolean>(true);

  // Track user activity
  const handleUserActivity = useCallback(() => {
    const now = Date.now();
    
    if (!isActiveRef.current) {
      isActiveRef.current = true;
      lastActivityRef.current = now;
    } else {
      const timeSinceLastActivity = now - lastActivityRef.current;
      if (timeSinceLastActivity < INACTIVITY_THRESHOLD) {
        interactionTimeRef.current += timeSinceLastActivity;
      }
      lastActivityRef.current = now;
    }
  }, []);

  // Calculate final interaction time
  const getInteractionTime = useCallback((): number => {
    if (isActiveRef.current && lastActivityRef.current) {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivityRef.current;
      if (timeSinceLastActivity < INACTIVITY_THRESHOLD) {
        return Math.round((interactionTimeRef.current + timeSinceLastActivity) / 1000);
      }
    }
    return Math.round(interactionTimeRef.current / 1000);
  }, []);

  // Fetch task blocks
  const { data: blocks = [] } = useQuery({
    queryKey: ["task-blocks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("development_task_blocks")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return (data || []) as unknown as TaskBlock[];
    },
  });

  // Fetch tasks for selected block
  const { data: tasks = [] } = useQuery({
    queryKey: ["block-tasks", selectedBlock?.id],
    queryFn: async () => {
      if (!selectedBlock?.id) return [];
      const { data, error } = await supabase
        .from("development_block_tasks")
        .select("*")
        .eq("block_id", selectedBlock.id)
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return (data || []) as unknown as BlockTask[];
    },
    enabled: !!selectedBlock?.id,
  });

  // Fetch progress
  const { data: progress = [] } = useQuery({
    queryKey: ["child-progress", childId],
    queryFn: async () => {
      if (!childId) return [];
      const { data, error } = await supabase
        .from("child_task_progress")
        .select("*")
        .eq("child_id", childId);
      if (error) throw error;
      return (data || []) as unknown as TaskProgress[];
    },
    enabled: !!childId,
  });

  // Save progress mutation
  const saveProgressMutation = useMutation({
    mutationFn: async ({ taskId, answer, score, interactionTimeSeconds }: { 
      taskId: string; 
      answer: any; 
      score: number;
      interactionTimeSeconds: number;
    }) => {
      if (!childId || !selectedBlock) return;
      
      const { error } = await supabase
        .from("child_task_progress")
        .upsert({
          child_id: childId,
          block_id: selectedBlock.id,
          task_id: taskId,
          status: "completed",
          answer: answer as any,
          score,
          interaction_time_seconds: interactionTimeSeconds,
          started_at: taskStartTimeRef.current ? new Date(taskStartTimeRef.current).toISOString() : null,
          completed_at: new Date().toISOString(),
        }, { onConflict: "child_id,task_id" });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["child-progress", childId] });
    },
    onError: (error) => {
      console.error("Failed to save progress:", error);
    },
  });

  // Sort tasks: new first (shuffled), then scheduled retries, then completed
  const sortedTasks = useMemo(() => {
    if (tasks.length === 0) return [];
    
    const completedTaskIds = new Set(
      progress
        .filter(p => p.block_id === selectedBlock?.id && p.status === "completed")
        .map(p => p.task_id)
    );
    
    // Check for tasks needing retry
    const now = Date.now();
    const retryTaskIds = new Set(
      wrongAnswerQueue
        .filter(w => w.scheduledRetry && w.scheduledRetry <= now)
        .map(w => w.taskId)
    );
    
    const newTasks = tasks.filter(t => !completedTaskIds.has(t.id) && !retryTaskIds.has(t.id));
    const retryTasks = tasks.filter(t => retryTaskIds.has(t.id));
    const completedTasks = tasks.filter(t => completedTaskIds.has(t.id) && !retryTaskIds.has(t.id));
    
    // Shuffle new tasks
    const shuffledNew = [...newTasks];
    for (let i = shuffledNew.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledNew[i], shuffledNew[j]] = [shuffledNew[j], shuffledNew[i]];
    }
    
    // Shuffle completed tasks too
    const shuffledCompleted = [...completedTasks];
    for (let i = shuffledCompleted.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledCompleted[i], shuffledCompleted[j]] = [shuffledCompleted[j], shuffledCompleted[i]];
    }
    
    // Insert retry tasks after first few new tasks for spaced repetition
    const result: BlockTask[] = [];
    let retryIndex = 0;
    
    shuffledNew.forEach((task, i) => {
      result.push(task);
      // Insert a retry task every 2-3 new tasks
      if (retryIndex < retryTasks.length && (i + 1) % 2 === 0) {
        result.push(retryTasks[retryIndex]);
        retryIndex++;
      }
    });
    
    // Add remaining retry tasks
    while (retryIndex < retryTasks.length) {
      result.push(retryTasks[retryIndex]);
      retryIndex++;
    }
    
    return [...result, ...shuffledCompleted];
  }, [tasks, progress, selectedBlock?.id, wrongAnswerQueue]);

  const currentTask = sortedTasks[currentTaskIndex];
  
  const isCurrentTaskRepeat = useMemo(() => {
    if (!currentTask) return false;
    return progress.some(p => p.task_id === currentTask.id && p.status === "completed");
  }, [currentTask, progress]);

  const isCurrentTaskRetry = useMemo(() => {
    if (!currentTask) return false;
    return wrongAnswerQueue.some(w => w.taskId === currentTask.id);
  }, [currentTask, wrongAnswerQueue]);

  // Find similar tasks for wrong answers
  const findSimilarTask = useCallback((task: BlockTask): BlockTask | null => {
    // Find a task with same type and sphere that hasn't been completed
    const completedTaskIds = new Set(
      progress
        .filter(p => p.status === "completed")
        .map(p => p.task_id)
    );
    
    const similar = tasks.find(t => 
      t.id !== task.id && 
      t.task_type === task.task_type &&
      !completedTaskIds.has(t.id)
    );
    
    return similar || null;
  }, [tasks, progress]);

  // Handle answer submission
  const handleSubmitAnswer = useCallback(async () => {
    if (!currentTask || !selectedAnswer) return;

    const content = currentTask.content as any;
    let isCorrect = true;
    let score = 0;
    
    if (currentTask.task_type === "question" && content?.correct !== undefined) {
      isCorrect = parseInt(selectedAnswer) === content.correct;
      score = isCorrect ? currentTask.points : 0;
    } else {
      score = currentTask.points; // Full points for exercises and games
    }

    // Handle wrong answer
    if (!isCorrect) {
      const newAttempts = wrongAttempts + 1;
      setWrongAttempts(newAttempts);
      setShowWrongFeedback(true);
      setSelectedAnswer("");

      // After 3 wrong attempts, move on but schedule retry
      if (newAttempts >= 3) {
        // Schedule retry in 2 minutes
        setWrongAnswerQueue(prev => [
          ...prev.filter(w => w.taskId !== currentTask.id),
          { 
            taskId: currentTask.id, 
            attempts: newAttempts, 
            scheduledRetry: Date.now() + 2 * 60 * 1000 
          }
        ]);

        // Also try to insert a similar task
        const similar = findSimilarTask(currentTask);
        if (similar) {
          setShowSimilarHint(true);
        }

        // Move to next task after short delay
        setTimeout(() => {
          setShowWrongFeedback(false);
          setWrongAttempts(0);
          setShowSimilarHint(false);
          if (currentTaskIndex < sortedTasks.length - 1) {
            setCurrentTaskIndex(prev => prev + 1);
          }
        }, 1500);
      }
      return;
    }

    // Correct answer - save progress
    const interactionTimeSeconds = getInteractionTime();

    try {
      await saveProgressMutation.mutateAsync({
        taskId: currentTask.id,
        answer: { selected: selectedAnswer },
        score,
        interactionTimeSeconds,
      });

      // Remove from retry queue if was a retry
      setWrongAnswerQueue(prev => prev.filter(w => w.taskId !== currentTask.id));

      setTotalPoints(prev => prev + score);
      
      // Show inline success feedback
      if (score > 0) {
        setSuccessFeedback({
          message: isCurrentTaskRetry ? "Молодец! Теперь правильно!" : "Отлично!",
          points: score,
          isRetry: isCurrentTaskRetry,
        });
      }

      setSelectedAnswer("");
      setShowWrongFeedback(false);
      setWrongAttempts(0);
      
      // Move to next task after showing feedback
      setTimeout(() => {
        setSuccessFeedback(null);
        if (currentTaskIndex < sortedTasks.length - 1) {
          setCurrentTaskIndex(prev => prev + 1);
        } else {
          return "block_complete";
        }
      }, 1200);
      
      if (currentTaskIndex >= sortedTasks.length - 1) {
        return "block_complete";
      }
    } catch (error) {
      console.error("Submit error:", error);
    }
  }, [
    currentTask, 
    selectedAnswer, 
    wrongAttempts, 
    currentTaskIndex, 
    sortedTasks.length, 
    totalPoints,
    findSimilarTask,
    getInteractionTime,
    saveProgressMutation,
    isCurrentTaskRetry,
  ]);

  // Reset timing when task changes
  useEffect(() => {
    if (!selectedBlock || !currentTask) return;
    
    taskStartTimeRef.current = Date.now();
    interactionTimeRef.current = 0;
    lastActivityRef.current = Date.now();
    isActiveRef.current = true;
    setShowWrongFeedback(false);
    setWrongAttempts(0);

    const events = ['click', 'keydown', 'mousemove', 'touchstart', 'scroll'];
    
    events.forEach(event => {
      window.addEventListener(event, handleUserActivity, { passive: true });
    });

    const inactivityCheck = setInterval(() => {
      const now = Date.now();
      if (now - lastActivityRef.current > INACTIVITY_THRESHOLD) {
        isActiveRef.current = false;
      }
    }, 5000);

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleUserActivity);
      });
      clearInterval(inactivityCheck);
    };
  }, [selectedBlock?.id, currentTaskIndex, currentTask?.id, handleUserActivity]);

  const resetBlock = useCallback(() => {
    setCurrentTaskIndex(0);
    setTotalPoints(0);
    setSelectedAnswer("");
    setShowWrongFeedback(false);
    setWrongAttempts(0);
  }, []);

  return {
    blocks,
    tasks,
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
    successFeedback,
    showSimilarHint,
    isPending: saveProgressMutation.isPending,
    setSelectedAnswer,
    handleSubmitAnswer,
    resetBlock,
  };
}
