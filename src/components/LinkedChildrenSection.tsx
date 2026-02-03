import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Link2, Phone, TrendingUp, Loader2, ChevronRight } from "lucide-react";
import { differenceInYears, differenceInMonths } from "date-fns";

interface LinkedChild {
  id: string;
  parent_child_id: string;
  linked_at: string;
  notes: string | null;
  parent_children: {
    id: string;
    child_unique_id: string;
    full_name: string;
    birth_date: string | null;
    gender: string | null;
    education_level: string | null;
    parent_profiles: {
      full_name: string;
      phone: string;
      email: string;
    } | null;
  };
  test_count?: number;
  latest_risk_level?: string | null;
}

interface LinkedChildrenSectionProps {
  onViewChild?: (childId: string, childName: string) => void;
}

const educationLevelLabels: Record<string, string> = {
  DO: "ДО",
  NOO: "НОО",
  OOO: "ООО",
  SOO: "СОО",
};

const riskLevelLabels: Record<string, { label: string; color: string }> = {
  normal: { label: "Норма", color: "bg-success/20 text-success" },
  moderate: { label: "Внимание", color: "bg-warning/20 text-warning" },
  high: { label: "Риск", color: "bg-destructive/20 text-destructive" },
};

export function LinkedChildrenSection({ onViewChild }: LinkedChildrenSectionProps) {
  const { profile } = useAuth();
  const organizationId = profile?.organization_id;

  const { data: linkedChildren, isLoading } = useQuery({
    queryKey: ["linked-parent-children", organizationId],
    queryFn: async () => {
      if (!organizationId) return [];

      // Fetch linked children with parent info
      const { data: links, error } = await supabase
        .from("linked_parent_children")
        .select(`
          id,
          parent_child_id,
          linked_at,
          notes,
          parent_children (
            id,
            child_unique_id,
            full_name,
            birth_date,
            gender,
            education_level,
            parent_profiles:parent_user_id (
              full_name,
              phone,
              email
            )
          )
        `)
        .eq("organization_id", organizationId)
        .order("linked_at", { ascending: false });

      if (error) throw error;
      if (!links) return [];

      // Fetch test counts for each child
      const childIds = links.map((l: any) => l.parent_child_id).filter(Boolean);
      
      const { data: testCounts } = await supabase
        .from("development_test_results")
        .select("child_id, overall_risk_level")
        .in("child_id", childIds)
        .eq("is_completed", true)
        .order("completed_at", { ascending: false });

      // Group test counts and get latest risk level
      const testDataByChild = new Map<string, { count: number; latestRisk: string | null }>();
      testCounts?.forEach((t: any) => {
        const existing = testDataByChild.get(t.child_id);
        if (!existing) {
          testDataByChild.set(t.child_id, { count: 1, latestRisk: t.overall_risk_level });
        } else {
          existing.count++;
        }
      });

      return links.map((link: any) => ({
        ...link,
        test_count: testDataByChild.get(link.parent_child_id)?.count || 0,
        latest_risk_level: testDataByChild.get(link.parent_child_id)?.latestRisk || null,
      })) as LinkedChild[];
    },
    enabled: !!organizationId,
  });

  const calculateAge = (birthDate: string) => {
    const birth = new Date(birthDate);
    const years = differenceInYears(new Date(), birth);
    const months = differenceInMonths(new Date(), birth) % 12;
    
    if (years === 0) return `${months} мес.`;
    return months > 0 ? `${years} л. ${months} м.` : `${years} л.`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!linkedChildren || linkedChildren.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Link2 className="h-5 w-5 text-primary" />
            Дети из кабинета родителя
          </CardTitle>
          <Badge variant="secondary">{linkedChildren.length}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Код</TableHead>
                <TableHead>ФИО ребёнка</TableHead>
                <TableHead>Возраст</TableHead>
                <TableHead>Уровень</TableHead>
                <TableHead>Родитель</TableHead>
                <TableHead>Тесты</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {linkedChildren.map((link) => {
                const child = link.parent_children;
                if (!child) return null;
                
                const parent = child.parent_profiles;
                const riskConfig = link.latest_risk_level 
                  ? riskLevelLabels[link.latest_risk_level] 
                  : null;

                return (
                  <TableRow key={link.id}>
                    <TableCell className="font-mono text-xs text-primary">
                      {child.child_unique_id}
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {child.full_name}
                        <Badge 
                          variant="outline" 
                          className="text-xs bg-primary/10 text-primary border-primary/20"
                        >
                          от родителя
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {child.birth_date ? calculateAge(child.birth_date) : "—"}
                    </TableCell>
                    <TableCell>
                      {child.education_level ? (
                        <Badge variant="secondary" className="text-xs">
                          {educationLevelLabels[child.education_level] || child.education_level}
                        </Badge>
                      ) : "—"}
                    </TableCell>
                    <TableCell>
                      {parent ? (
                        <div className="space-y-0.5">
                          <div className="text-sm">{parent.full_name}</div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {parent.phone}
                          </div>
                        </div>
                      ) : "—"}
                    </TableCell>
                    <TableCell>
                      {link.test_count > 0 ? (
                        <Tooltip>
                          <TooltipTrigger>
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant="outline" 
                                className="gap-1 cursor-help"
                              >
                                <TrendingUp className="h-3 w-3" />
                                {link.test_count}
                              </Badge>
                              {riskConfig && (
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${riskConfig.color} border-0`}
                                >
                                  {riskConfig.label}
                                </Badge>
                              )}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Пройдено тестов развития: {link.test_count}</p>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {onViewChild && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onViewChild(child.id, child.full_name)}
                          className="h-8 w-8"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
