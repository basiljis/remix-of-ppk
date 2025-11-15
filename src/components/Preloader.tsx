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
      <div className="absolute top-[25%] text-center">
        <h1 
          className="text-[clamp(0.875rem,2.5vw,1.25rem)] font-light tracking-[0.3em] text-white/90 animate-fade-in"
          style={{
            fontFamily: 'system-ui, -apple-system, sans-serif',
            textTransform: 'uppercase',
            letterSpacing: '0.3em'
          }}
        >
          СИСТЕМА ППК
        </h1>
      </div>

      {/* Vertical progress bar */}
      <div className="relative flex flex-col items-center gap-4 animate-scale-in">
        {/* Progress bar container */}
        <div className="relative w-[1.5px] h-[140px] bg-white/10 rounded-full overflow-hidden">
          {/* Filled progress */}
          <div 
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white/90 to-white/80 rounded-full transition-all duration-300 ease-out"
            style={{ 
              height: `${displayProgress}%`,
              boxShadow: '0 -2px 10px rgba(255, 255, 255, 0.3)'
            }}
          >
            {/* Glow effect at top */}
            <div 
              className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-white/40 rounded-full blur-md"
              style={{
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
              }}
            />
          </div>
        </div>

        {/* Percentage display */}
        <div className="text-center">
          <div 
            className="text-[clamp(1.25rem,3vw,1.75rem)] font-light text-white/90 tabular-nums"
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
      <div className="absolute bottom-[20%] text-center">
        <p 
          className="text-[10px] font-light tracking-[0.2em] text-white/40 uppercase animate-fade-in"
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
