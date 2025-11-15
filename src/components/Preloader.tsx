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
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#0a0a0a] overflow-hidden">
      {/* Subtle grid background */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }}
      />

      {/* Top text */}
      <div className="absolute top-[30%] text-center">
        <h1 
          className="text-[clamp(0.625rem,1.5vw,0.875rem)] font-light tracking-[0.25em] text-white/80 animate-fade-in"
          style={{
            fontFamily: 'system-ui, -apple-system, sans-serif',
            textTransform: 'uppercase',
            letterSpacing: '0.25em'
          }}
        >
          СИСТЕМА ППК
        </h1>
      </div>

      {/* Vertical progress bar */}
      <div className="relative flex flex-col items-center gap-3 animate-scale-in">
        {/* Progress bar container */}
        <div className="relative w-[1px] h-[80px] bg-white/10 rounded-full overflow-hidden">
          {/* Filled progress */}
          <div 
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white/90 to-white/80 rounded-full transition-all duration-300 ease-out"
            style={{ 
              height: `${displayProgress}%`,
              boxShadow: '0 -1px 8px rgba(255, 255, 255, 0.25)'
            }}
          >
            {/* Glow effect at top */}
            <div 
              className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-white/30 rounded-full blur-sm"
              style={{
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
              }}
            />
          </div>
        </div>

        {/* Percentage display */}
        <div className="text-center">
          <div 
            className="text-[clamp(1rem,2.5vw,1.25rem)] font-light text-white/90 tabular-nums"
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
          className="text-[8px] font-light tracking-[0.15em] text-white/30 uppercase animate-fade-in"
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
