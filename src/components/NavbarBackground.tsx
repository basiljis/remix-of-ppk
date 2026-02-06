export function NavbarBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Animated gradient */}
          <linearGradient id="nav-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.06">
              <animate attributeName="stopOpacity" values="0.06;0.12;0.06" dur="6s" repeatCount="indefinite" />
            </stop>
            <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.03">
              <animate attributeName="stopOpacity" values="0.03;0.08;0.03" dur="8s" repeatCount="indefinite" />
            </stop>
            <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0.05">
              <animate attributeName="stopOpacity" values="0.05;0.1;0.05" dur="7s" repeatCount="indefinite" />
            </stop>
          </linearGradient>
          
          <linearGradient id="nav-grad-2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--secondary))" stopOpacity="0.08">
              <animate attributeName="stopOpacity" values="0.08;0.15;0.08" dur="9s" repeatCount="indefinite" />
            </stop>
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.04">
              <animate attributeName="stopOpacity" values="0.04;0.09;0.04" dur="5s" repeatCount="indefinite" />
            </stop>
          </linearGradient>
        </defs>

        {/* Flowing wave 1 */}
        <path fill="url(#nav-grad-1)">
          <animate
            attributeName="d"
            dur="12s"
            repeatCount="indefinite"
            values="
              M0,40 C200,20 400,80 600,50 C800,20 1000,70 1200,40 C1300,30 1400,60 1440,45 L1440,120 L0,120 Z;
              M0,60 C200,80 400,30 600,60 C800,80 1000,30 1200,55 C1300,65 1400,35 1440,50 L1440,120 L0,120 Z;
              M0,40 C200,20 400,80 600,50 C800,20 1000,70 1200,40 C1300,30 1400,60 1440,45 L1440,120 L0,120 Z
            "
          />
        </path>

        {/* Flowing wave 2 */}
        <path fill="url(#nav-grad-2)">
          <animate
            attributeName="d"
            dur="10s"
            repeatCount="indefinite"
            values="
              M0,70 C150,50 350,90 550,65 C750,40 950,85 1150,60 C1300,45 1400,75 1440,55 L1440,120 L0,120 Z;
              M0,50 C150,75 350,40 550,70 C750,90 950,45 1150,70 C1300,80 1400,50 1440,65 L1440,120 L0,120 Z;
              M0,70 C150,50 350,90 550,65 C750,40 950,85 1150,60 C1300,45 1400,75 1440,55 L1440,120 L0,120 Z
            "
          />
        </path>

        {/* Floating circles */}
        <circle r="80" fill="hsl(var(--primary))" opacity="0.03">
          <animate attributeName="cx" values="-80;200;-80" dur="20s" repeatCount="indefinite" />
          <animate attributeName="cy" values="60;30;60" dur="15s" repeatCount="indefinite" />
          <animate attributeName="r" values="80;120;80" dur="18s" repeatCount="indefinite" />
        </circle>
        
        <circle r="60" fill="hsl(var(--accent))" opacity="0.04">
          <animate attributeName="cx" values="1520;1200;1520" dur="18s" repeatCount="indefinite" />
          <animate attributeName="cy" values="20;80;20" dur="14s" repeatCount="indefinite" />
          <animate attributeName="r" values="60;100;60" dur="16s" repeatCount="indefinite" />
        </circle>
        
        <circle r="40" fill="hsl(var(--secondary))" opacity="0.05">
          <animate attributeName="cx" values="700;900;700" dur="22s" repeatCount="indefinite" />
          <animate attributeName="cy" values="10;70;10" dur="13s" repeatCount="indefinite" />
        </circle>

        {/* Abstract geometric shapes */}
        <polygon fill="hsl(var(--primary))" opacity="0.02">
          <animate
            attributeName="points"
            dur="16s"
            repeatCount="indefinite"
            values="
              300,10 380,60 320,90 240,50;
              320,20 400,50 340,100 260,60;
              300,10 380,60 320,90 240,50
            "
          />
        </polygon>
        
        <polygon fill="hsl(var(--accent))" opacity="0.03">
          <animate
            attributeName="points"
            dur="14s"
            repeatCount="indefinite"
            values="
              1000,5 1060,40 1020,80 960,30;
              1020,15 1080,50 1040,90 980,40;
              1000,5 1060,40 1020,80 960,30
            "
          />
        </polygon>
      </svg>
    </div>
  );
}
