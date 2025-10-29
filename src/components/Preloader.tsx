const Preloader = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background">
      <div className="relative">
        {/* Animated circles */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-24 h-24 rounded-full border-4 border-primary/20 animate-ping"></div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-20 h-20 rounded-full border-4 border-t-primary border-r-primary/60 border-b-primary/30 border-l-transparent animate-spin"></div>
        </div>
        
        {/* Center logo or icon */}
        <div className="relative w-16 h-16 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary via-primary/80 to-primary/60 animate-pulse shadow-lg shadow-primary/50"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-6 h-6 rounded-full bg-background animate-[pulse_1.5s_ease-in-out_infinite]"></div>
          </div>
        </div>
        
        {/* Loading text */}
        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 whitespace-nowrap">
          <p className="text-sm font-medium text-muted-foreground animate-pulse">
            Загрузка...
          </p>
        </div>
      </div>
    </div>
  );
};

export default Preloader;
