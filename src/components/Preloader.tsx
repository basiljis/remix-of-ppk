import { useState, useEffect } from 'react';

interface PreloaderProps {
  progress?: number;
  stage?: string;
}

const Preloader = ({ progress: externalProgress, stage }: PreloaderProps) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (externalProgress !== undefined) {
      setProgress(externalProgress);
      return;
    }

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + Math.random() * 5;
      });
    }, 150);
    return () => clearInterval(interval);
  }, [externalProgress]);

  const displayProgress = Math.min(Math.round(progress), 100);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background overflow-hidden">
      {/* Background elements */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at center, hsl(var(--primary) / 0.08) 0%, transparent 70%)',
        }}
      />
      
      <div className="relative flex flex-col items-center gap-12 animate-in fade-in duration-700">
        {/* Modern Circular Loader */}
        <div className="relative w-32 h-32 flex items-center justify-center">
          {/* Static background ring */}
          <svg className="absolute w-full h-full -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="60"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-foreground/5"
            />
            {/* Animated progress ring */}
            <circle
              cx="64"
              cy="64"
              r="60"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="2.5"
              strokeDasharray="377"
              strokeDashoffset={377 - (377 * displayProgress) / 100}
              strokeLinecap="round"
              className="transition-all duration-300 ease-out"
              style={{
                filter: 'drop-shadow(0 0 8px hsl(var(--primary) / 0.4))'
              }}
            />
          </svg>

          {/* Center content */}
          <div className="flex flex-col items-center">
            <span className="text-2xl font-extralight tracking-tighter text-foreground tabular-nums">
              {displayProgress}
            </span>
            <span className="text-[7px] uppercase tracking-[0.2em] text-muted-foreground/60 -mt-1">
              percent
            </span>
          </div>
        </div>

        {/* Brand section */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex flex-col items-center gap-1">
            <h1
              className="text-lg font-light text-foreground tracking-[0.5em] uppercase text-center"
              style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
            >
              universum.
            </h1>
            <p className="text-[9px] font-light text-muted-foreground tracking-[0.3em] uppercase opacity-70">
              {stage || 'educational platform'}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="h-px w-8 bg-gradient-to-r from-transparent via-foreground/20 to-transparent" />
            <span className="text-[10px] font-medium text-foreground/40 tracking-widest uppercase animate-pulse">
              Loading
            </span>
            <div className="h-px w-8 bg-gradient-to-r from-transparent via-foreground/20 to-transparent" />
          </div>
        </div>
      </div>

      {/* Footer hint */}
      <div className="absolute bottom-12 left-0 right-0 flex flex-col items-center gap-2 opacity-40">
        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-ping duration-1000" />
        <span className="text-[9px] uppercase tracking-[0.4em] font-light text-muted-foreground">
          unvrsm.ru
        </span>
      </div>
    </div>
  );
};

export default Preloader;
