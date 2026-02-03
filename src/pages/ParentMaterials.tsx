import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ArrowLeft, Search, BookOpen, Dumbbell, Video, FileText, Clock, 
  Brain, MessageCircle, Heart, Hand, Mic, Star, Library, Sparkles
} from "lucide-react";
import { sphereImages } from "@/assets/game-items";
import { useDevelopmentTestResults } from "@/hooks/useDevelopmentTest";

interface DevelopmentMaterial {
  id: string;
  sphere_slug: string;
  material_type: string;
  title: string;
  description: string | null;
  content: string | null;
  duration_minutes: number | null;
  specialist_type: string | null;
  video_url: string | null;
  pdf_url: string | null;
}

const sphereConfig: Record<string, { name: string; icon: any; color: string }> = {
  motor: { name: "Моторная сфера", icon: Hand, color: "bg-blue-100 text-blue-700" },
  speech: { name: "Речевая сфера", icon: Mic, color: "bg-green-100 text-green-700" },
  cognitive: { name: "Познавательная сфера", icon: Brain, color: "bg-purple-100 text-purple-700" },
  social: { name: "Социально-коммуникативная сфера", icon: MessageCircle, color: "bg-orange-100 text-orange-700" },
  emotional: { name: "Эмоционально-волевая сфера", icon: Heart, color: "bg-pink-100 text-pink-700" },
};

const materialTypeConfig: Record<string, { name: string; icon: any }> = {
  article: { name: "Статья", icon: BookOpen },
  exercise: { name: "Упражнение", icon: Dumbbell },
  video: { name: "Видео", icon: Video },
  pdf: { name: "PDF", icon: FileText },
};

export default function ParentMaterials() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSphere, setSelectedSphere] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [expandedMaterial, setExpandedMaterial] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"recommended" | "library">("recommended");

  // Get current user
  const { data: user } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  // Get test results for recommendations
  const { data: testResults = [] } = useDevelopmentTestResults(user?.id || "");

  // Get all materials
  const { data: materials = [], isLoading } = useQuery({
    queryKey: ["development-materials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("development_materials")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return (data || []) as unknown as DevelopmentMaterial[];
    },
  });

  // Extract recommended spheres from test results
  const recommendedSpheres = testResults.flatMap((result) => {
    const scores = result.sphere_scores as Record<string, number>;
    // Get spheres with scores below 70% (need improvement)
    return Object.entries(scores)
      .filter(([_, score]) => score < 70)
      .map(([slug]) => slug);
  });

  // Get unique recommended spheres
  const uniqueRecommendedSpheres = [...new Set(recommendedSpheres)];

  // Filter materials based on recommendations
  const recommendedMaterials = materials.filter((m) => 
    uniqueRecommendedSpheres.includes(m.sphere_slug)
  );

  // Filter based on view mode
  const baseMaterials = viewMode === "recommended" ? recommendedMaterials : materials;

  const filteredMaterials = baseMaterials.filter((m) => {
    const matchesSearch = !searchQuery || 
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSphere = selectedSphere === "all" || m.sphere_slug === selectedSphere;
    const matchesType = selectedType === "all" || m.material_type === selectedType;
    return matchesSearch && matchesSphere && matchesType;
  });

  const groupedMaterials = Object.keys(sphereConfig).reduce((acc, sphere) => {
    acc[sphere] = filteredMaterials.filter((m) => m.sphere_slug === sphere);
    return acc;
  }, {} as Record<string, DevelopmentMaterial[]>);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/parent")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold">Материалы для родителей</h1>
              <p className="text-sm text-muted-foreground">Статьи, упражнения и видео для развития ребёнка</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* View Mode Toggle */}
        <div className="flex gap-2">
          <Button
            variant={viewMode === "recommended" ? "default" : "outline"}
            onClick={() => setViewMode("recommended")}
            className="flex items-center gap-2"
          >
            <Sparkles className="h-4 w-4" />
            Рекомендованные
            {uniqueRecommendedSpheres.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {recommendedMaterials.length}
              </Badge>
            )}
          </Button>
          <Button
            variant={viewMode === "library" ? "default" : "outline"}
            onClick={() => setViewMode("library")}
            className="flex items-center gap-2"
          >
            <Library className="h-4 w-4" />
            Все материалы
            <Badge variant="secondary" className="ml-1">
              {materials.length}
            </Badge>
          </Button>
        </div>

        {/* Recommendation info */}
        {viewMode === "recommended" && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <Star className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Персональные рекомендации</p>
                  {uniqueRecommendedSpheres.length > 0 ? (
                    <p className="text-sm text-muted-foreground">
                      На основе результатов тестирования подобраны материалы для развития: {" "}
                      {uniqueRecommendedSpheres.map(s => sphereConfig[s]?.name || s).join(", ")}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Пройдите тест развития ребёнка, чтобы получить персональные рекомендации по материалам
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Поиск материалов..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedSphere} onValueChange={setSelectedSphere}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Сфера развития" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все сферы</SelectItem>
                  {Object.entries(sphereConfig).map(([key, { name }]) => (
                    <SelectItem key={key} value={key}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Тип материала" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все типы</SelectItem>
                  {Object.entries(materialTypeConfig).map(([key, { name }]) => (
                    <SelectItem key={key} value={key}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Загрузка материалов...</div>
        ) : (
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="all">Все материалы</TabsTrigger>
              {Object.entries(sphereConfig).map(([key, { name }]) => (
                <TabsTrigger key={key} value={key} className="whitespace-nowrap">
                  {name.split(" ")[0]}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="all" className="space-y-6">
              {Object.entries(groupedMaterials).map(([sphere, items]) => {
                if (items.length === 0) return null;
                const config = sphereConfig[sphere];
                const Icon = config.icon;
                return (
                  <div key={sphere} className="space-y-4">
                    <div className="flex items-center gap-3">
                      {sphereImages[sphere] ? (
                        <img 
                          src={sphereImages[sphere]} 
                          alt={config.name} 
                          className="w-12 h-12 object-contain rounded-lg"
                        />
                      ) : (
                        <div className={`p-2 rounded-lg ${config.color}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                      )}
                      <h2 className="text-lg font-semibold">{config.name}</h2>
                      <Badge variant="secondary">{items.length}</Badge>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {items.map((material) => (
                        <MaterialCard 
                          key={material.id} 
                          material={material} 
                          expanded={expandedMaterial === material.id}
                          onToggle={() => setExpandedMaterial(
                            expandedMaterial === material.id ? null : material.id
                          )}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
              {filteredMaterials.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  Материалы не найдены
                </div>
              )}
            </TabsContent>

            {Object.entries(sphereConfig).map(([sphere, config]) => (
              <TabsContent key={sphere} value={sphere} className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  {sphereImages[sphere] ? (
                    <img 
                      src={sphereImages[sphere]} 
                      alt={config.name} 
                      className="w-12 h-12 object-contain rounded-lg"
                    />
                  ) : (
                    <div className={`p-2 rounded-lg ${config.color}`}>
                      <config.icon className="h-5 w-5" />
                    </div>
                  )}
                  <h2 className="text-lg font-semibold">{config.name}</h2>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {groupedMaterials[sphere]?.map((material) => (
                    <MaterialCard 
                      key={material.id} 
                      material={material}
                      expanded={expandedMaterial === material.id}
                      onToggle={() => setExpandedMaterial(
                        expandedMaterial === material.id ? null : material.id
                      )}
                    />
                  ))}
                </div>
                {(!groupedMaterials[sphere] || groupedMaterials[sphere].length === 0) && (
                  <div className="text-center py-12 text-muted-foreground">
                    Материалы в этой категории не найдены
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </div>
  );
}

function MaterialCard({ 
  material, 
  expanded, 
  onToggle 
}: { 
  material: DevelopmentMaterial; 
  expanded: boolean;
  onToggle: () => void;
}) {
  const typeConfig = materialTypeConfig[material.material_type] || materialTypeConfig.article;
  const TypeIcon = typeConfig.icon;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              <TypeIcon className="h-3 w-3 mr-1" />
              {typeConfig.name}
            </Badge>
            {material.duration_minutes && (
              <Badge variant="secondary" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                {material.duration_minutes} мин
              </Badge>
            )}
          </div>
        </div>
        <CardTitle className="text-base mt-2">{material.title}</CardTitle>
        {material.description && (
          <CardDescription className="line-clamp-2">{material.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="pt-2">
        {material.specialist_type && (
          <p className="text-xs text-muted-foreground mb-3">
            Специалист: <span className="text-primary">{material.specialist_type}</span>
          </p>
        )}
        
        {expanded && material.content && (
          <ScrollArea className="h-[300px] mb-4 p-3 border rounded-lg bg-muted/30">
            <div 
              className="prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: material.content }}
            />
          </ScrollArea>
        )}

        {material.video_url && (
          <div className="mb-3">
            <a 
              href={material.video_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              <Video className="h-4 w-4" />
              Смотреть видео
            </a>
          </div>
        )}

        {material.pdf_url && (
          <div className="mb-3">
            <a 
              href={material.pdf_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              <FileText className="h-4 w-4" />
              Скачать PDF
            </a>
          </div>
        )}

        <Button 
          variant="outline" 
          size="sm" 
          className="w-full"
          onClick={onToggle}
        >
          {expanded ? "Свернуть" : "Читать подробнее"}
        </Button>
      </CardContent>
    </Card>
  );
}
