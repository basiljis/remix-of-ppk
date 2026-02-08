import { useState } from "react";
import { 
  FileText, ClipboardList, Calendar, BarChart3, 
  Building2, GraduationCap, Baby, Users,
  Gamepad2, BookOpen, Target, Bell, UserCheck
} from "lucide-react";

interface FeatureNode {
  id: string;
  label: string;
  icon: React.ElementType;
  audience: ("org" | "specialist" | "parent")[];
  description: string;
}

const features: FeatureNode[] = [
  { id: "ppk", label: "Протоколы ППк", icon: ClipboardList, audience: ["org", "specialist"], description: "Автоматизация консилиумов" },
  { id: "schedule", label: "Журнал занятий", icon: Calendar, audience: ["org", "specialist"], description: "Учёт посещаемости" },
  { id: "analytics", label: "Аналитика", icon: BarChart3, audience: ["org"], description: "Статистика и KPI" },
  { id: "games", label: "Игровая", icon: Gamepad2, audience: ["parent"], description: "Развивающие упражнения" },
  { id: "materials", label: "Материалы", icon: BookOpen, audience: ["parent"], description: "Рекомендации по развитию" },
  { id: "matching", label: "Подбор специалиста", icon: UserCheck, audience: ["parent"], description: "На основе результатов" },
  { id: "directions", label: "Направления работы", icon: Target, audience: ["specialist"], description: "Специализации педагога" },
  { id: "notifications", label: "Уведомления", icon: Bell, audience: ["org", "specialist", "parent"], description: "Напоминания о занятиях" },
];

const audienceColors: Record<string, { bg: string; border: string; text: string }> = {
  org: { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-600 dark:text-blue-400" },
  specialist: { bg: "bg-orange-500/10", border: "border-orange-500/30", text: "text-orange-600 dark:text-orange-400" },
  parent: { bg: "bg-pink-500/10", border: "border-pink-500/30", text: "text-pink-600 dark:text-pink-400" },
};

const audienceLabels: Record<string, { label: string; icon: React.ElementType }> = {
  org: { label: "Организации", icon: Building2 },
  specialist: { label: "Педагоги", icon: GraduationCap },
  parent: { label: "Родители", icon: Baby },
};

export function ChildCardDiagram() {
  const [activeAudience, setActiveAudience] = useState<string | null>(null);
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null);

  const filteredFeatures = activeAudience 
    ? features.filter(f => f.audience.includes(activeAudience as any))
    : features;

  // Calculate positions for orbital layout
  const getPosition = (index: number, total: number) => {
    const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
    const radius = 140; // Distance from center
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    };
  };

  return (
    <section className="py-20 px-4 bg-muted/30 overflow-hidden">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4">Карточка ребёнка — ядро системы</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Единый профиль ребёнка объединяет данные из всех модулей для разных типов пользователей
          </p>
        </div>

        {/* Audience filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          <button
            onClick={() => setActiveAudience(null)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all
              ${!activeAudience 
                ? "bg-primary text-primary-foreground shadow-md" 
                : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground"
              }`}
          >
            <Users className="h-4 w-4" />
            Все
          </button>
          {Object.entries(audienceLabels).map(([key, { label, icon: Icon }]) => (
            <button
              key={key}
              onClick={() => setActiveAudience(activeAudience === key ? null : key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all
                ${activeAudience === key 
                  ? "bg-primary text-primary-foreground shadow-md" 
                  : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground"
                }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Diagram */}
        <div className="relative flex items-center justify-center min-h-[400px] md:min-h-[450px]">
          {/* Connection lines (SVG) */}
          <svg 
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ zIndex: 0 }}
          >
            <defs>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.1" />
              </linearGradient>
            </defs>
            {filteredFeatures.map((feature, index) => {
              const pos = getPosition(index, filteredFeatures.length);
              const centerX = "50%";
              const centerY = "50%";
              const isActive = hoveredFeature === feature.id || !hoveredFeature;
              return (
                <line
                  key={feature.id}
                  x1={centerX}
                  y1={centerY}
                  x2={`calc(50% + ${pos.x}px)`}
                  y2={`calc(50% + ${pos.y}px)`}
                  stroke="url(#lineGradient)"
                  strokeWidth={isActive ? 2 : 1}
                  strokeDasharray={hoveredFeature === feature.id ? "0" : "4 4"}
                  className="transition-all duration-300"
                  opacity={isActive ? 1 : 0.3}
                />
              );
            })}
          </svg>

          {/* Center node - Child Card */}
          <div 
            className="absolute z-20 flex flex-col items-center justify-center w-28 h-28 md:w-36 md:h-36 
                       rounded-full bg-gradient-to-br from-primary/20 to-primary/5 
                       border-2 border-primary/40 shadow-lg backdrop-blur-sm
                       transition-transform duration-300 hover:scale-105"
          >
            <FileText className="h-8 w-8 md:h-10 md:w-10 text-primary mb-1" />
            <span className="text-xs md:text-sm font-semibold text-center px-2">Карточка ребёнка</span>
          </div>

          {/* Orbital feature nodes */}
          {filteredFeatures.map((feature, index) => {
            const pos = getPosition(index, filteredFeatures.length);
            const primaryAudience = feature.audience[0];
            const colors = audienceColors[primaryAudience];
            const isHovered = hoveredFeature === feature.id;
            
            return (
              <div
                key={feature.id}
                className={`absolute z-10 flex flex-col items-center justify-center 
                           w-20 h-20 md:w-24 md:h-24 rounded-full 
                           ${colors.bg} border ${colors.border}
                           shadow-md backdrop-blur-sm cursor-pointer
                           transition-all duration-300 
                           ${isHovered ? "scale-110 shadow-lg" : "hover:scale-105"}
                           ${hoveredFeature && !isHovered ? "opacity-40" : "opacity-100"}`}
                style={{
                  transform: `translate(${pos.x}px, ${pos.y}px)`,
                }}
                onMouseEnter={() => setHoveredFeature(feature.id)}
                onMouseLeave={() => setHoveredFeature(null)}
              >
                <feature.icon className={`h-5 w-5 md:h-6 md:w-6 ${colors.text} mb-1`} />
                <span className="text-[10px] md:text-xs font-medium text-center px-1 leading-tight">
                  {feature.label}
                </span>
                
                {/* Tooltip on hover */}
                {isHovered && (
                  <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 
                                  bg-popover text-popover-foreground text-xs 
                                  px-3 py-1.5 rounded-md shadow-lg whitespace-nowrap z-30
                                  animate-in fade-in-0 zoom-in-95 duration-200">
                    {feature.description}
                  </div>
                )}
              </div>
            );
          })}

          {/* Audience labels around the diagram */}
          <div className="absolute -left-4 md:left-0 top-1/2 -translate-y-1/2 hidden lg:block">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium
                            ${activeAudience === "org" ? "bg-blue-500/20 text-blue-600" : "bg-muted text-muted-foreground"}`}>
              <Building2 className="h-3.5 w-3.5" />
              Организации
            </div>
          </div>
          <div className="absolute -right-4 md:right-0 top-1/2 -translate-y-1/2 hidden lg:block">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium
                            ${activeAudience === "parent" ? "bg-pink-500/20 text-pink-600" : "bg-muted text-muted-foreground"}`}>
              <Baby className="h-3.5 w-3.5" />
              Родители
            </div>
          </div>
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-4 md:bottom-0 hidden lg:block">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium
                            ${activeAudience === "specialist" ? "bg-orange-500/20 text-orange-600" : "bg-muted text-muted-foreground"}`}>
              <GraduationCap className="h-3.5 w-3.5" />
              Педагоги
            </div>
          </div>
        </div>

        {/* Legend for mobile */}
        <div className="flex flex-wrap justify-center gap-4 mt-8 lg:hidden">
          {Object.entries(audienceLabels).map(([key, { label, icon: Icon }]) => {
            const colors = audienceColors[key];
            return (
              <div key={key} className={`flex items-center gap-1.5 text-xs ${colors.text}`}>
                <Icon className="h-3.5 w-3.5" />
                {label}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
