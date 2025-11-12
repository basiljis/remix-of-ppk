import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts";

interface Protocol {
  id: string;
  created_at: string;
  ppk_number: string;
  checklist_data: any;
}

interface Props {
  protocols: Protocol[];
}

export function ChildProfileRadarChart({ protocols }: Props) {
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

  // Get the last 3 protocols for comparison
  const recentProtocols = protocols.slice(-3);
  
  // Get all unique block names
  const allBlocks = new Set<string>();
  recentProtocols.forEach(protocol => {
    const scores = calculateBlockScores(protocol);
    if (scores) {
      Object.keys(scores).forEach(block => allBlocks.add(block));
    }
  });

  // Prepare data for radar chart
  const radarData = Array.from(allBlocks).map(blockName => {
    const dataPoint: any = { block: blockName };
    
    recentProtocols.forEach((protocol, index) => {
      const scores = calculateBlockScores(protocol);
      const date = new Date(protocol.created_at).toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
      });
      dataPoint[`protocol_${index}`] = scores?.[blockName] || 0;
      dataPoint[`label_${index}`] = `${date} (№${protocol.ppk_number || index + 1})`;
    });

    return dataPoint;
  });

  const chartConfig = {
    protocol_0: {
      label: recentProtocols[0] ? `${new Date(recentProtocols[0].created_at).toLocaleDateString("ru-RU")}` : "Протокол 1",
      color: "hsl(var(--primary))",
    },
    protocol_1: {
      label: recentProtocols[1] ? `${new Date(recentProtocols[1].created_at).toLocaleDateString("ru-RU")}` : "Протокол 2",
      color: "hsl(var(--success-foreground))",
    },
    protocol_2: {
      label: recentProtocols[2] ? `${new Date(recentProtocols[2].created_at).toLocaleDateString("ru-RU")}` : "Протокол 3",
      color: "hsl(var(--accent-foreground))",
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Радар динамики по блокам</CardTitle>
        <CardDescription>
          Сравнение последних {recentProtocols.length} протоколов по всем сферам развития
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[400px] w-full">
          <RadarChart data={radarData}>
            <PolarGrid strokeDasharray="3 3" />
            <PolarAngleAxis 
              dataKey="block" 
              tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
            />
            {recentProtocols.map((_, index) => (
              <Radar
                key={index}
                name={chartConfig[`protocol_${index}` as keyof typeof chartConfig].label}
                dataKey={`protocol_${index}`}
                stroke={chartConfig[`protocol_${index}` as keyof typeof chartConfig].color}
                fill={chartConfig[`protocol_${index}` as keyof typeof chartConfig].color}
                fillOpacity={0.3}
              />
            ))}
            <ChartTooltip content={<ChartTooltipContent />} />
          </RadarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
