import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts";
import { Users, School } from "lucide-react";

interface Protocol {
  id: string;
  child_birth_date: string;
  organization_id: string;
  checklist_data: any;
}

interface Props {
  childBirthDate: string;
  organizationId: string;
  currentProtocol: Protocol;
}

export function ChildProfileComparison({ childBirthDate, organizationId, currentProtocol }: Props) {
  const [ageGroupAverage, setAgeGroupAverage] = useState<{ [key: string]: number }>({});
  const [organizationAverage, setOrganizationAverage] = useState<{ [key: string]: number }>({});
  const [childScores, setChildScores] = useState<{ [key: string]: number }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadComparisons = async () => {
      if (!childBirthDate || !organizationId || !currentProtocol) {
        setLoading(false);
        return;
      }

      try {
        // Calculate age range (±1 year)
        const birthDate = new Date(childBirthDate);
        const minDate = new Date(birthDate);
        minDate.setFullYear(birthDate.getFullYear() - 1);
        const maxDate = new Date(birthDate);
        maxDate.setFullYear(birthDate.getFullYear() + 1);

        // Fetch protocols for age group
        const { data: ageGroupProtocols, error: ageError } = await supabase
          .from("protocols")
          .select("checklist_data")
          .eq("status", "completed")
          .gte("child_birth_date", minDate.toISOString().split('T')[0])
          .lte("child_birth_date", maxDate.toISOString().split('T')[0])
          .not("id", "eq", currentProtocol.id);

        // Fetch protocols for organization
        const { data: orgProtocols, error: orgError } = await supabase
          .from("protocols")
          .select("checklist_data")
          .eq("status", "completed")
          .eq("organization_id", organizationId)
          .not("id", "eq", currentProtocol.id);

        if (ageError) throw ageError;
        if (orgError) throw orgError;

        // Calculate current child's scores
        const childBlockScores = calculateBlockScores(currentProtocol);
        setChildScores(childBlockScores);

        // Calculate age group averages
        if (ageGroupProtocols && ageGroupProtocols.length > 0) {
          const ageAvg = calculateAverageScores(ageGroupProtocols);
          setAgeGroupAverage(ageAvg);
        }

        // Calculate organization averages
        if (orgProtocols && orgProtocols.length > 0) {
          const orgAvg = calculateAverageScores(orgProtocols);
          setOrganizationAverage(orgAvg);
        }
      } catch (error) {
        console.error("Error loading comparison data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadComparisons();
  }, [childBirthDate, organizationId, currentProtocol]);

  const calculateBlockScores = (protocol: Protocol) => {
    if (!protocol.checklist_data?.blocks) return {};

    const blockScores: { [key: string]: number } = {};
    
    protocol.checklist_data.blocks.forEach((block: any) => {
      if (block.items && Array.isArray(block.items)) {
        const scores = block.items.map((item: any) => item.score || 0);
        const average = scores.length > 0 
          ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length 
          : 0;
        blockScores[block.name] = Math.round(average * 100);
      }
    });

    return blockScores;
  };

  const calculateAverageScores = (protocols: any[]) => {
    const blockTotals: { [key: string]: { sum: number; count: number } } = {};

    protocols.forEach(protocol => {
      if (!protocol.checklist_data?.blocks) return;

      protocol.checklist_data.blocks.forEach((block: any) => {
        if (block.items && Array.isArray(block.items)) {
          const scores = block.items.map((item: any) => item.score || 0);
          const average = scores.length > 0 
            ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length 
            : 0;
          
          if (!blockTotals[block.name]) {
            blockTotals[block.name] = { sum: 0, count: 0 };
          }
          blockTotals[block.name].sum += average * 100;
          blockTotals[block.name].count += 1;
        }
      });
    });

    const averages: { [key: string]: number } = {};
    Object.keys(blockTotals).forEach(blockName => {
      averages[blockName] = Math.round(
        blockTotals[blockName].sum / blockTotals[blockName].count
      );
    });

    return averages;
  };

  // Prepare data for chart
  const chartData = Object.keys(childScores).map(blockName => ({
    block: blockName,
    child: childScores[blockName] || 0,
    ageGroup: ageGroupAverage[blockName] || 0,
    organization: organizationAverage[blockName] || 0,
  }));

  const chartConfig = {
    child: {
      label: "Ребёнок",
      color: "hsl(var(--primary))",
    },
    ageGroup: {
      label: "Средний по возрастной группе",
      color: "hsl(var(--success-foreground))",
    },
    organization: {
      label: "Средний по организации",
      color: "hsl(var(--accent-foreground))",
    },
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Сравнение с показателями</CardTitle>
          <CardDescription>Загрузка данных для сравнения...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Сравнение с показателями</CardTitle>
        <CardDescription>
          Сопоставление показателей ребёнка со средними значениями по возрастной группе и образовательной организации
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Statistics Summary */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="p-4 rounded-lg border bg-card">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-success/10">
                <Users className="h-5 w-5 text-success-foreground" />
              </div>
              <h3 className="font-semibold">Возрастная группа</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Среднее значение по детям той же возрастной группы (±1 год от даты рождения)
            </p>
          </div>
          <div className="p-4 rounded-lg border bg-card">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <School className="h-5 w-5 text-accent-foreground" />
              </div>
              <h3 className="font-semibold">Образовательная организация</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Среднее значение по всем детям данной образовательной организации
            </p>
          </div>
        </div>

        {/* Comparison Chart */}
        {chartData.length > 0 ? (
          <ChartContainer config={chartConfig} className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="block" 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  tick={{ fill: "hsl(var(--foreground))", fontSize: 11 }}
                />
                <YAxis 
                  domain={[0, 100]}
                  tick={{ fill: "hsl(var(--foreground))" }}
                  label={{ value: "Процент (%)", angle: -90, position: "insideLeft" }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend 
                  wrapperStyle={{ paddingTop: "20px" }}
                  iconType="circle"
                />
                <Bar 
                  dataKey="child" 
                  name="Ребёнок"
                  fill="hsl(var(--primary))" 
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="ageGroup" 
                  name="Средний по возрастной группе"
                  fill="hsl(var(--success-foreground))" 
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="organization" 
                  name="Средний по организации"
                  fill="hsl(var(--accent-foreground))" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Недостаточно данных для сравнения
          </div>
        )}

        {/* Detailed Comparison Table */}
        {chartData.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold">Блок</th>
                  <th className="text-center py-3 px-4 font-semibold">Ребёнок</th>
                  <th className="text-center py-3 px-4 font-semibold">Возрастная группа</th>
                  <th className="text-center py-3 px-4 font-semibold">Организация</th>
                  <th className="text-center py-3 px-4 font-semibold">Отклонение от группы</th>
                </tr>
              </thead>
              <tbody>
                {chartData.map((row, index) => {
                  const deviation = row.child - row.ageGroup;
                  const deviationColor = deviation > 0 
                    ? "text-success-foreground" 
                    : deviation < 0 
                    ? "text-destructive" 
                    : "text-muted-foreground";
                  
                  return (
                    <tr key={index} className="border-b hover:bg-accent/5">
                      <td className="py-3 px-4">{row.block}</td>
                      <td className="text-center py-3 px-4 font-medium">{row.child}%</td>
                      <td className="text-center py-3 px-4">{row.ageGroup}%</td>
                      <td className="text-center py-3 px-4">{row.organization}%</td>
                      <td className={`text-center py-3 px-4 font-medium ${deviationColor}`}>
                        {deviation > 0 ? '+' : ''}{deviation}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
