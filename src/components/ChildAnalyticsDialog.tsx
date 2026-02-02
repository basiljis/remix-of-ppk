import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Loader2, TrendingUp, TrendingDown, Minus, Brain, MessageCircle, 
  Heart, Hand, Users, Calendar, Lightbulb, LineChart, BarChart3, Activity
} from "lucide-react";
import { format, differenceInMonths } from "date-fns";
import { ru } from "date-fns/locale";
import { 
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, 
  PolarRadiusAxis, Radar, Legend, LineChart as RechartsLineChart, 
  Line, XAxis, YAxis, CartesianGrid, Tooltip
} from "recharts";

interface DevelopmentTestResult {
  id: string;
  completed_at: string;
  overall_risk_level: string;
  sphere_scores: Record<string, number>;
  recommendations: any;
  child_age_months: number;
}

interface ParentTestResult {
  id: string;
  completed_at: string;
  result_type: string;
  result_label: string;
  risk_level: string;
  scores: { warmth: number; control: number; involvement: number };
  recommendations: string[];
}

interface ChildAnalyticsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  childId: string;
  childName: string;
  birthDate?: string | null;
}

const sphereConfig: Record<string, { name: string; icon: React.ReactNode; color: string }> = {
  motor: { name: "Моторика", icon: <Hand className="h-4 w-4" />, color: "#3B82F6" },
  speech: { name: "Речь", icon: <MessageCircle className="h-4 w-4" />, color: "#10B981" },
  cognitive: { name: "Познание", icon: <Brain className="h-4 w-4" />, color: "#8B5CF6" },
  social: { name: "Социальное", icon: <Users className="h-4 w-4" />, color: "#F59E0B" },
  emotional: { name: "Эмоции", icon: <Heart className="h-4 w-4" />, color: "#EC4899" },
};

export function ChildAnalyticsDialog({
  open,
  onOpenChange,
  childId,
  childName,
  birthDate,
}: ChildAnalyticsDialogProps) {
  // Fetch development test results
  const { data: developmentResults, isLoading: devLoading } = useQuery({
    queryKey: ["child-development-analytics", childId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("development_test_results" as any)
        .select("*")
        .eq("child_id", childId)
        .eq("is_completed", true)
        .order("completed_at", { ascending: true }) as { data: DevelopmentTestResult[] | null; error: any };
      
      if (error) throw error;
      return data || [];
    },
    enabled: open,
  });

  // Fetch parenting test results
  const { data: parentingResults, isLoading: parentLoading } = useQuery({
    queryKey: ["child-parenting-analytics", childId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parent_test_results" as any)
        .select("*")
        .eq("child_id", childId)
        .eq("is_completed", true)
        .order("completed_at", { ascending: true }) as { data: ParentTestResult[] | null; error: any };
      
      if (error) throw error;
      return data || [];
    },
    enabled: open,
  });

  const isLoading = devLoading || parentLoading;
  const latestDevResult = developmentResults?.[developmentResults.length - 1];
  const latestParentResult = parentingResults?.[parentingResults.length - 1];

  // Prepare radar chart data
  const radarData = latestDevResult?.sphere_scores
    ? Object.entries(latestDevResult.sphere_scores).map(([key, value]) => ({
        sphere: sphereConfig[key]?.name || key,
        value,
        fullMark: 100,
      }))
    : [];

  // Prepare line chart data for dynamics
  const dynamicsData = developmentResults?.map((result) => ({
    date: format(new Date(result.completed_at), "MMM yy", { locale: ru }),
    ...Object.fromEntries(
      Object.entries(result.sphere_scores || {}).map(([k, v]) => [
        sphereConfig[k]?.name || k,
        v,
      ])
    ),
  })) || [];

  // Calculate trends
  const calculateTrend = (key: string) => {
    if (!developmentResults || developmentResults.length < 2) return null;
    const prev = developmentResults[developmentResults.length - 2]?.sphere_scores?.[key];
    const curr = developmentResults[developmentResults.length - 1]?.sphere_scores?.[key];
    if (prev === undefined || curr === undefined) return null;
    return curr - prev;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-pink-600" />
            Аналитика: {childName}
          </DialogTitle>
          <DialogDescription>
            Динамика развития и результаты всех тестов
            {birthDate && (
              <span className="ml-2">
                • Возраст: {differenceInMonths(new Date(), new Date(birthDate))} мес.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Обзор</TabsTrigger>
                <TabsTrigger value="dynamics">Динамика</TabsTrigger>
                <TabsTrigger value="recommendations">Рекомендации</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4 mt-4">
                {/* Development Radar */}
                {latestDevResult && radarData.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-emerald-600" />
                        Профиль развития
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart data={radarData}>
                            <PolarGrid />
                            <PolarAngleAxis dataKey="sphere" className="text-xs" />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} />
                            <Radar
                              name="Развитие"
                              dataKey="value"
                              stroke="#10B981"
                              fill="#10B981"
                              fillOpacity={0.3}
                            />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Sphere details with trends */}
                      <div className="grid gap-2 mt-4">
                        {Object.entries(latestDevResult.sphere_scores || {}).map(([key, value]) => {
                          const config = sphereConfig[key];
                          const trend = calculateTrend(key);
                          
                          return (
                            <div key={key} className="flex items-center gap-3">
                              <div 
                                className="p-1.5 rounded"
                                style={{ backgroundColor: `${config?.color}20` }}
                              >
                                {config?.icon}
                              </div>
                              <span className="flex-1 text-sm">{config?.name || key}</span>
                              <div className="flex items-center gap-2">
                                <Progress value={value} className="w-24 h-2" />
                                <span className="text-sm font-semibold w-10">{value}%</span>
                                {trend !== null && (
                                  <span className={`flex items-center text-xs ${
                                    trend > 0 ? "text-green-600" : trend < 0 ? "text-red-600" : "text-muted-foreground"
                                  }`}>
                                    {trend > 0 ? <TrendingUp className="h-3 w-3" /> : 
                                     trend < 0 ? <TrendingDown className="h-3 w-3" /> : 
                                     <Minus className="h-3 w-3" />}
                                    {trend > 0 ? "+" : ""}{trend}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Parenting Test Results */}
                {latestParentResult && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Heart className="h-4 w-4 text-pink-600" />
                        Стиль воспитания
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 mb-4">
                        <Badge variant="secondary">{latestParentResult.result_label}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(latestParentResult.completed_at), "d MMM yyyy", { locale: ru })}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-3 bg-pink-50 dark:bg-pink-950/30 rounded-lg">
                          <p className="text-2xl font-bold text-pink-600">
                            {latestParentResult.scores?.warmth}/5
                          </p>
                          <p className="text-xs text-muted-foreground">Теплота</p>
                        </div>
                        <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                          <p className="text-2xl font-bold text-blue-600">
                            {latestParentResult.scores?.control}/5
                          </p>
                          <p className="text-xs text-muted-foreground">Границы</p>
                        </div>
                        <div className="text-center p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                          <p className="text-2xl font-bold text-purple-600">
                            {latestParentResult.scores?.involvement}/5
                          </p>
                          <p className="text-xs text-muted-foreground">Вовлечённость</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {!latestDevResult && !latestParentResult && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Нет данных для анализа</p>
                    <p className="text-sm">Пройдите тесты в разделе "Тесты"</p>
                  </div>
                )}
              </TabsContent>

              {/* Dynamics Tab */}
              <TabsContent value="dynamics" className="space-y-4 mt-4">
                {dynamicsData.length > 1 ? (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <LineChart className="h-4 w-4 text-emerald-600" />
                        Динамика развития
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsLineChart data={dynamicsData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis domain={[0, 100]} />
                            <Tooltip />
                            <Legend />
                            {Object.entries(sphereConfig).map(([key, config]) => (
                              <Line
                                key={key}
                                type="monotone"
                                dataKey={config.name}
                                stroke={config.color}
                                strokeWidth={2}
                                dot={{ r: 4 }}
                              />
                            ))}
                          </RechartsLineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <LineChart className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Недостаточно данных для отображения динамики</p>
                    <p className="text-sm">Пройдите тест повторно через 3 месяца</p>
                  </div>
                )}

                {/* Test history */}
                {developmentResults && developmentResults.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        История тестов
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {developmentResults.slice().reverse().map((result, idx) => (
                          <div 
                            key={result.id}
                            className="flex items-center justify-between p-2 border rounded-lg"
                          >
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{idx + 1}</Badge>
                              <span className="text-sm">
                                {format(new Date(result.completed_at), "d MMM yyyy", { locale: ru })}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                ({result.child_age_months} мес.)
                              </span>
                            </div>
                            <Badge 
                              className={
                                result.overall_risk_level === "normal" ? "bg-green-500 text-white" :
                                result.overall_risk_level === "attention" ? "bg-yellow-500 text-white" :
                                "bg-red-500 text-white"
                              }
                            >
                              {result.overall_risk_level === "normal" ? "Норма" :
                               result.overall_risk_level === "attention" ? "Внимание" : "Помощь"}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Recommendations Tab */}
              <TabsContent value="recommendations" className="space-y-4 mt-4">
                {latestDevResult?.recommendations && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-yellow-600" />
                        Рекомендации по развитию
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {Array.isArray(latestDevResult.recommendations) ? (
                          latestDevResult.recommendations.map((rec: any, idx: number) => (
                            <div key={idx} className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                              <p className="font-medium text-sm mb-1">{rec.sphere}</p>
                              {rec.activities && (
                                <ul className="text-sm text-muted-foreground space-y-1">
                                  {rec.activities.map((act: string, i: number) => (
                                    <li key={i}>• {act}</li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            {JSON.stringify(latestDevResult.recommendations)}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {latestParentResult?.recommendations && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Heart className="h-4 w-4 text-pink-600" />
                        Рекомендации по воспитанию
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {(latestParentResult.recommendations as string[]).map((rec, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <span className="text-pink-600">•</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {!latestDevResult?.recommendations && !latestParentResult?.recommendations && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Lightbulb className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Нет рекомендаций</p>
                    <p className="text-sm">Пройдите тесты для получения персональных рекомендаций</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
