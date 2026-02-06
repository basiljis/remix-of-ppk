import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Loader2,
  FileText,
  Building2,
  Calendar,
  Users,
  MessageCircle,
  Brain,
  Heart,
  GraduationCap,
  ChevronRight,
  BookOpen,
  Gamepad2,
  Lightbulb,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { matchDirectionsToProblems } from "@/constants/workDirections";
import { RecommendedSpecialists } from "@/components/RecommendedSpecialists";

interface ChildPPKResultsCardProps {
  childId: string;
  childName: string;
  regionId?: string | null;
  onBookSpecialist?: (specialistId: string) => void;
}

interface Protocol {
  id: string;
  child_name: string;
  education_level: string | null;
  status: string;
  created_at: string;
  checklist_data: any;
  protocol_data: any;
  organization_id: string;
  organization?: {
    name: string;
  };
}

interface BlockScore {
  name: string;
  score: number;
  maxScore: number;
  percentage: number;
  group: 1 | 2 | 3 | null;
}

const blockIcons: Record<string, React.ReactNode> = {
  "речев": <MessageCircle className="h-4 w-4" />,
  "когнитив": <Brain className="h-4 w-4" />,
  "регулятив": <Heart className="h-4 w-4" />,
  "коммуникат": <Users className="h-4 w-4" />,
  "познават": <Brain className="h-4 w-4" />,
};

const getBlockIcon = (blockName: string) => {
  const lowerName = blockName.toLowerCase();
  for (const [key, icon] of Object.entries(blockIcons)) {
    if (lowerName.includes(key)) return icon;
  }
  return <FileText className="h-4 w-4" />;
};

const getGroupConfig = (group: 1 | 2 | 3 | null) => {
  switch (group) {
    case 1:
      return { 
        label: "Норма", 
        color: "bg-success/20 text-success",
        icon: <CheckCircle2 className="h-4 w-4" />,
        description: "Развитие соответствует возрастной норме"
      };
    case 2:
      return { 
        label: "Требует внимания", 
        color: "bg-warning/20 text-warning",
        icon: <AlertCircle className="h-4 w-4" />,
        description: "Рекомендованы дополнительные занятия"
      };
    case 3:
      return { 
        label: "Необходима помощь", 
        color: "bg-destructive/20 text-destructive",
        icon: <AlertTriangle className="h-4 w-4" />,
        description: "Рекомендована консультация специалиста"
      };
    default:
      return { 
        label: "Не оценено", 
        color: "bg-muted text-muted-foreground",
        icon: null,
        description: ""
      };
  }
};

// Calculate block scores from checklist data
const calculateBlockScores = (checklistData: any): BlockScore[] => {
  if (!checklistData?.blocks) return [];
  
  return checklistData.blocks.map((block: any) => {
    let totalScore = 0;
    let totalWeight = 0;
    
    block.topics?.forEach((topic: any) => {
      topic.subtopics?.forEach((subtopic: any) => {
        subtopic.items?.forEach((item: any) => {
          const score = item.score || 0;
          const weight = item.weight || 1;
          totalScore += score * weight;
          totalWeight += weight;
        });
      });
    });
    
    const percentage = totalWeight > 0 ? Math.round((totalScore / totalWeight) * 100) : 0;
    
    // Determine group based on percentage
    let group: 1 | 2 | 3 | null = null;
    if (percentage >= 0) {
      if (percentage <= 30) group = 1;
      else if (percentage <= 60) group = 2;
      else group = 3;
    }
    
    return {
      name: block.title,
      score: totalScore,
      maxScore: totalWeight,
      percentage,
      group,
    };
  });
};

// Generate recommendations based on block scores
const generateRecommendations = (blockScores: BlockScore[]): { text: string; sphere: string; priority: "high" | "medium" | "low" }[] => {
  const recommendations: { text: string; sphere: string; priority: "high" | "medium" | "low" }[] = [];
  
  blockScores.forEach((block) => {
    const blockLower = block.name.toLowerCase();
    
    if (block.group === 3) {
      if (blockLower.includes("речев")) {
        recommendations.push({
          text: "Рекомендуются занятия с логопедом и артикуляционная гимнастика дома",
          sphere: "speech",
          priority: "high"
        });
        recommendations.push({
          text: "Читайте книги вслух, обсуждайте картинки и истории",
          sphere: "speech",
          priority: "high"
        });
      }
      if (blockLower.includes("когнитив") || blockLower.includes("познават")) {
        recommendations.push({
          text: "Развивающие игры на внимание, память и логику",
          sphere: "cognitive",
          priority: "high"
        });
        recommendations.push({
          text: "Занятия с педагогом-психологом по развитию познавательных функций",
          sphere: "cognitive",
          priority: "high"
        });
      }
      if (blockLower.includes("регулятив")) {
        recommendations.push({
          text: "Упражнения на самоконтроль и саморегуляцию",
          sphere: "emotional",
          priority: "high"
        });
      }
      if (blockLower.includes("коммуникат")) {
        recommendations.push({
          text: "Групповые занятия для развития социальных навыков",
          sphere: "social",
          priority: "high"
        });
      }
    } else if (block.group === 2) {
      if (blockLower.includes("речев")) {
        recommendations.push({
          text: "Игры на развитие речи: описание картинок, пересказ историй",
          sphere: "speech",
          priority: "medium"
        });
      }
      if (blockLower.includes("когнитив") || blockLower.includes("познават")) {
        recommendations.push({
          text: "Настольные игры и головоломки для тренировки мышления",
          sphere: "cognitive",
          priority: "medium"
        });
      }
    }
  });
  
  // Add general recommendations
  if (recommendations.length > 0) {
    recommendations.push({
      text: "Регулярные занятия по 15-20 минут в день эффективнее длинных редких занятий",
      sphere: "general",
      priority: "low"
    });
  }
  
  return recommendations;
};

export function ChildPPKResultsCard({ childId, childName, regionId, onBookSpecialist }: ChildPPKResultsCardProps) {
  const navigate = useNavigate();

  // First check if child is linked to any organization
  const { data: linkedOrgs, isLoading: linksLoading } = useQuery({
    queryKey: ["parent-child-links", childId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("linked_parent_children")
        .select(`
          id,
          organization_id,
          organizations:organization_id (
            id,
            name
          )
        `)
        .eq("parent_child_id", childId);

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch protocols for linked organizations matching child name
  const { data: protocols, isLoading: protocolsLoading } = useQuery({
    queryKey: ["parent-child-protocols", childId, childName, linkedOrgs?.map(l => l.organization_id)],
    queryFn: async () => {
      if (!linkedOrgs || linkedOrgs.length === 0) return [];

      const orgIds = linkedOrgs.map(l => l.organization_id);
      
      // Search for protocols by child name in linked organizations
      const { data, error } = await supabase
        .from("protocols")
        .select(`
          id,
          child_name,
          education_level,
          status,
          created_at,
          checklist_data,
          protocol_data,
          organization_id,
          organizations:organization_id (name)
        `)
        .in("organization_id", orgIds)
        .eq("status", "completed")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Filter by child name similarity
      const normalizedChildName = childName.toLowerCase().trim();
      const matchedProtocols = (data || []).filter((p: any) => {
        const protocolChildName = p.child_name?.toLowerCase().trim() || "";
        // Check if names match (accounting for minor differences)
        return protocolChildName === normalizedChildName || 
               protocolChildName.includes(normalizedChildName) ||
               normalizedChildName.includes(protocolChildName);
      });
      
      return matchedProtocols as Protocol[];
    },
    enabled: !!linkedOrgs && linkedOrgs.length > 0,
  });

  if (linksLoading || protocolsLoading) {
    return (
      <Card className="border-primary/20">
        <CardContent className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // Not linked to any organization yet
  if (!linkedOrgs || linkedOrgs.length === 0) {
    return null;
  }

  // Linked but no protocols yet
  if (!protocols || protocols.length === 0) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-5 w-5 text-primary" />
            Заключения ППк
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 p-3 bg-background rounded-lg">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm font-medium">Ребёнок привязан к организации</p>
              <p className="text-xs text-muted-foreground">
                {(linkedOrgs[0] as any).organizations?.name}
              </p>
            </div>
            <Badge variant="secondary">Ожидание ППк</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Когда специалист проведёт заседание ППк, результаты появятся здесь
          </p>
        </CardContent>
      </Card>
    );
  }

  // Has protocols - show results
  const latestProtocol = protocols[0];
  const blockScores = calculateBlockScores(latestProtocol.checklist_data);
  const recommendations = generateRecommendations(blockScores);
  
  // Get problem directions for specialist matching
  const problemBlocks = blockScores
    .filter((b) => b.group && b.group >= 2)
    .map((b) => ({ blockTitle: b.name, group: b.group! }));
  const problemDirections = matchDirectionsToProblems(problemBlocks);
  
  // Get overall status
  const maxGroup = blockScores.reduce((max, block) => 
    block.group && block.group > (max || 0) ? block.group : max, null as 1 | 2 | 3 | null
  );
  const overallConfig = getGroupConfig(maxGroup);

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-5 w-5 text-primary" />
            Результаты ППк
          </CardTitle>
          {maxGroup && (
            <Badge className={overallConfig.color}>
              {overallConfig.icon}
              <span className="ml-1">{overallConfig.label}</span>
            </Badge>
          )}
        </div>
        <CardDescription className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1">
            <Building2 className="h-3 w-3" />
            {(latestProtocol as any).organizations?.name}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {format(new Date(latestProtocol.created_at), "d MMM yyyy", { locale: ru })}
          </span>
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Block scores */}
        <div className="space-y-3">
          {blockScores.slice(0, 4).map((block, idx) => {
            const groupConfig = getGroupConfig(block.group);
            return (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded bg-primary/10 text-primary">
                      {getBlockIcon(block.name)}
                    </span>
                    <span className="truncate max-w-[150px]">{block.name.replace(/^[IVX]+\s*/, "")}</span>
                  </div>
                  <Badge variant="outline" className={`text-xs ${groupConfig.color} border-0`}>
                    {groupConfig.label}
                  </Badge>
                </div>
                <Progress 
                  value={100 - block.percentage} 
                  className="h-2"
                />
              </div>
            );
          })}
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <>
            <Separator />
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="recommendations" className="border-0">
                <AccordionTrigger className="py-2 hover:no-underline">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Lightbulb className="h-4 w-4 text-warning" />
                    Рекомендации для занятий дома
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 pt-1">
                    {recommendations.slice(0, 5).map((rec, idx) => (
                      <div 
                        key={idx} 
                        className={`flex items-start gap-2 p-2 rounded-lg text-sm ${
                          rec.priority === "high" 
                            ? "bg-destructive/10" 
                            : rec.priority === "medium" 
                              ? "bg-warning/10" 
                              : "bg-muted/50"
                        }`}
                      >
                        <span className={`mt-0.5 ${
                          rec.priority === "high" 
                            ? "text-destructive" 
                            : rec.priority === "medium" 
                              ? "text-warning" 
                              : "text-muted-foreground"
                        }`}>
                          •
                        </span>
                        <span>{rec.text}</span>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </>
        )}

        {/* Recommended specialists based on PPK results */}
        {problemDirections.length > 0 && regionId && (
          <>
            <Separator />
            <RecommendedSpecialists
              problemDirections={problemDirections}
              regionId={regionId}
              onBookSpecialist={onBookSpecialist}
              maxVisible={2}
              compact
            />
          </>
        )}

        <Separator />

        {/* Links to materials */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/parent/materials")}
            className="gap-2 flex-1 min-w-[140px]"
          >
            <BookOpen className="h-4 w-4" />
            Материалы
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/child-workspace?childId=${childId}`)}
            className="gap-2 flex-1 min-w-[140px]"
          >
            <Gamepad2 className="h-4 w-4" />
            Игровая
          </Button>
        </div>

        {/* History */}
        {protocols.length > 1 && (
          <p className="text-xs text-muted-foreground text-center">
            Всего заседаний ППк: {protocols.length}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
