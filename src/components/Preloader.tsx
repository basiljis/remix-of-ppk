const Preloader = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative z-10">
        {/* Outer rotating ring */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-32 h-32 rounded-full border-[3px] border-primary/10 animate-ping"></div>
        </div>
        
        {/* Middle rotating gradient ring */}
        <div className="absolute inset-0 flex items-center justify-center animate-spin" style={{ animationDuration: '2s' }}>
          <div className="w-24 h-24 rounded-full border-[4px] border-transparent border-t-primary border-r-primary/60 shadow-lg shadow-primary/20"></div>
        </div>

        {/* Inner counter-rotating ring */}
        <div className="absolute inset-0 flex items-center justify-center animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}>
          <div className="w-20 h-20 rounded-full border-[3px] border-transparent border-b-accent border-l-accent/60"></div>
        </div>
        
        {/* Center logo with gradient */}
        <div className="relative w-16 h-16 flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary via-accent to-primary/80 animate-pulse shadow-2xl shadow-primary/40">
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/20 to-transparent"></div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-background/90 backdrop-blur-sm animate-[pulse_2s_ease-in-out_infinite] shadow-inner"></div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-primary animate-[ping_2s_ease-in-out_infinite]"></div>
          </div>
        </div>
        
        {/* Loading text with animated dots */}
        <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 whitespace-nowrap">
          <div className="flex items-center gap-2">
            <p className="text-base font-semibold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-pulse">
              Загрузка
            </p>
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.2s' }}></span>
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.4s' }}></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Preloader;
