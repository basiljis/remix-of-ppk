import { useState, useEffect } from 'react';

const Preloader = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 150);

    return () => clearInterval(interval);
  }, []);

  const displayProgress = Math.min(Math.round(progress), 100);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-background overflow-hidden">
      {/* Subtle grid background */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(hsl(var(--foreground) / 0.1) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground) / 0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }}
      />

      {/* Centered content container */}
      <div className="flex flex-col items-center justify-center gap-8 animate-fade-in">
        {/* Title text - centered above spinner */}
        <h1 
          className="text-[clamp(0.625rem,1.5vw,0.875rem)] font-light tracking-[0.25em] text-foreground/80"
          style={{
            fontFamily: 'system-ui, -apple-system, sans-serif',
            textTransform: 'uppercase',
            letterSpacing: '0.25em'
          }}
        >
          universum.
        </h1>

        {/* Circular progress ring */}
        <div className="relative flex items-center justify-center animate-scale-in">
          <svg 
            className="w-16 h-16 -rotate-90" 
            viewBox="0 0 64 64"
          >
            {/* Background circle */}
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke="hsl(var(--foreground) / 0.1)"
              strokeWidth="3"
            />
            {/* Progress circle */}
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${displayProgress * 1.76} 176`}
              className="transition-all duration-300 ease-out"
              style={{
                filter: 'drop-shadow(0 0 4px hsl(var(--primary) / 0.3))'
              }}
            />
          </svg>
          {/* Percentage in center */}
          <div 
            className="absolute inset-0 flex items-center justify-center text-sm font-light text-foreground/90 tabular-nums"
            style={{
              fontFamily: 'system-ui, -apple-system, sans-serif',
              letterSpacing: '0.05em'
            }}
          >
            {displayProgress}%
          </div>
        </div>
      </div>

      {/* Bottom subtle text */}
      <div className="absolute bottom-[25%] text-center">
        <p 
          className="text-[8px] font-light tracking-[0.15em] text-muted-foreground uppercase animate-fade-in"
          style={{
            fontFamily: 'system-ui, -apple-system, sans-serif',
            animationDelay: '0.3s',
            animationFillMode: 'backwards'
          }}
        >
          Загрузка данных
        </p>
      </div>
    </div>
  );
};

export default Preloader;
