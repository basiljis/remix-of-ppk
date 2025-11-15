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
      <div className="absolute top-[20%] text-center">
        <h1 
          className="text-[clamp(1.5rem,4vw,2.5rem)] font-light tracking-[0.3em] text-white/90 animate-fade-in"
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
      <div className="relative flex flex-col items-center gap-8 animate-scale-in">
        {/* Progress bar container */}
        <div className="relative w-[2px] h-[280px] bg-white/10 rounded-full overflow-hidden">
          {/* Filled progress */}
          <div 
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white/90 to-white/80 rounded-full transition-all duration-300 ease-out"
            style={{ 
              height: `${displayProgress}%`,
              boxShadow: '0 -4px 20px rgba(255, 255, 255, 0.3)'
            }}
          >
            {/* Glow effect at top */}
            <div 
              className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-8 bg-white/40 rounded-full blur-lg"
              style={{
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
              }}
            />
          </div>
        </div>

        {/* Percentage display */}
        <div className="text-center">
          <div 
            className="text-[clamp(2rem,5vw,3.5rem)] font-light text-white/90 tabular-nums"
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
      <div className="absolute bottom-[15%] text-center">
        <p 
          className="text-xs font-light tracking-[0.2em] text-white/40 uppercase animate-fade-in"
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
