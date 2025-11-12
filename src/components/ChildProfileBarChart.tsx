import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

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

  if (!firstScores || !lastScores) {
    return null;
  }

  // Get all unique blocks
  const allBlocks = new Set([...Object.keys(firstScores), ...Object.keys(lastScores)]);

  // Prepare data for bar chart with growth
  const barData = Array.from(allBlocks).map(blockName => {
    const firstScore = firstScores[blockName] || 0;
    const lastScore = lastScores[blockName] || 0;
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

  const chartConfig = {
    first: {
      label: `Первый (${new Date(firstProtocol.created_at).toLocaleDateString("ru-RU")})`,
      color: "hsl(var(--muted-foreground))",
    },
    last: {
      label: `Последний (${new Date(lastProtocol.created_at).toLocaleDateString("ru-RU")})`,
      color: "hsl(var(--primary))",
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Динамика роста по сферам</CardTitle>
        <CardDescription>
          Сравнение показателей первого и последнего протокола
        </CardDescription>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  );
}
