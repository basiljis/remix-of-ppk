import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { TrendingUp, TrendingDown, Minus, BarChart3, ClipboardList } from "lucide-react";

interface Protocol {
  id: string;
  created_at: string;
  ppk_number: string;
  checklist_data: any;
}

interface Props {
  protocols: Protocol[];
}

export function ChildProfileBarChart({ protocols }: Props) {
  // Calculate block scores for each protocol
  const calculateBlockScores = (protocol: Protocol) => {
    if (!protocol.checklist_data?.blocks) return null;

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

  // Compare first and last protocol
  const firstProtocol = protocols[0];
  const lastProtocol = protocols[protocols.length - 1];

  const firstScores = calculateBlockScores(firstProtocol);
  const lastScores = calculateBlockScores(lastProtocol);

  const hasData = firstScores && lastScores && protocols.length >= 2;
  const hasSingleProtocol = protocols.length === 1 && firstScores;

  // Get all unique blocks
  const allBlocks = hasData 
    ? new Set([...Object.keys(firstScores!), ...Object.keys(lastScores!)])
    : new Set<string>();

  // Prepare data for bar chart with growth
  const barData = Array.from(allBlocks).map(blockName => {
    const firstScore = firstScores?.[blockName] || 0;
    const lastScore = lastScores?.[blockName] || 0;
    const growth = lastScore - firstScore;
    
    return {
      block: blockName.length > 20 ? blockName.substring(0, 20) + "..." : blockName,
      fullBlock: blockName,
      first: firstScore,
      last: lastScore,
      growth,
      growthPercent: firstScore > 0 ? Math.round((growth / firstScore) * 100) : 0,
    };
  });

  const chartConfig = hasData ? {
    first: {
      label: `Первый (${new Date(firstProtocol!.created_at).toLocaleDateString("ru-RU")})`,
      color: "hsl(var(--muted-foreground))",
    },
    last: {
      label: `Последний (${new Date(lastProtocol!.created_at).toLocaleDateString("ru-RU")})`,
      color: "hsl(var(--primary))",
    },
  } : {};

  return (
    <Card>
      <CardHeader>
        <CardTitle>Динамика роста по сферам</CardTitle>
        <CardDescription>
          {hasData 
            ? "Сравнение показателей первого и последнего протокола"
            : "Отслеживание прогресса развития ребёнка"
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <>
            <ChartContainer config={chartConfig} className="h-[400px] w-full">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="block" 
                  tick={{ fill: "hsl(var(--foreground))", fontSize: 10 }}
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis tick={{ fill: "hsl(var(--foreground))" }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="first" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="last" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
            
            {/* Growth indicators */}
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium">Изменения:</p>
              <div className="grid gap-2">
                {barData.map((item) => (
                  <div key={item.fullBlock} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{item.fullBlock}</span>
                    <div className="flex items-center gap-2">
                      {item.growth > 0 && (
                        <span className="flex items-center text-success-foreground bg-success px-2 py-1 rounded">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          +{item.growth}%
                        </span>
                      )}
                      {item.growth === 0 && (
                        <span className="flex items-center text-warning-foreground bg-warning px-2 py-1 rounded">
                          <Minus className="h-3 w-3 mr-1" />
                          {item.growth}%
                        </span>
                      )}
                      {item.growth < 0 && (
                        <span className="flex items-center text-destructive-foreground bg-destructive/20 px-2 py-1 rounded">
                          <TrendingDown className="h-3 w-3 mr-1" />
                          {item.growth}%
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="h-[400px] flex flex-col items-center justify-center text-center p-6 border border-dashed border-border rounded-lg bg-muted/20">
            <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
            <h4 className="text-lg font-medium text-foreground mb-2">
              {hasSingleProtocol 
                ? "Недостаточно данных для сравнения" 
                : "Нет данных для отображения"
              }
            </h4>
            <p className="text-sm text-muted-foreground max-w-sm mb-4">
              {hasSingleProtocol 
                ? "Для отображения динамики роста необходимо минимум 2 завершённых протокола ППк. Сейчас доступен только 1 протокол."
                : "График динамики появится после создания минимум двух завершённых протоколов ППк для сравнения прогресса."
              }
            </p>
            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
              <ClipboardList className="h-4 w-4 mt-0.5 shrink-0" />
              <span className="text-left">
                {hasSingleProtocol 
                  ? <><strong>Следующий шаг:</strong> Создайте ещё один протокол ППк через некоторое время, чтобы отследить изменения в развитии ребёнка.</>
                  : <><strong>Как добавить данные:</strong> Перейдите в раздел «ППк» → «Создать протокол» → заполните чек-листы → завершите протокол.</>
                }
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
