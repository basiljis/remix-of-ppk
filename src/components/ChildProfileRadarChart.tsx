import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts";
import { FileBarChart, ClipboardList } from "lucide-react";

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
      const blockName = block.name || block.title;
      if (!blockName) return;
      
      // Collect all items from nested structure: topics -> subtopics -> items
      const allItems: any[] = [];
      
      // Direct items on block
      if (block.items && Array.isArray(block.items)) {
        allItems.push(...block.items);
      }
      
      // Items in topics -> subtopics structure
      if (block.topics && Array.isArray(block.topics)) {
        block.topics.forEach((topic: any) => {
          if (topic.subtopics && Array.isArray(topic.subtopics)) {
            topic.subtopics.forEach((subtopic: any) => {
              if (subtopic.items && Array.isArray(subtopic.items)) {
                allItems.push(...subtopic.items);
              }
            });
          }
          // Direct items on topic
          if (topic.items && Array.isArray(topic.items)) {
            allItems.push(...topic.items);
          }
        });
      }
      
      if (allItems.length > 0) {
        const scores = allItems.map((item: any) => item.score || 0);
        const average = scores.reduce((a: number, b: number) => a + b, 0) / scores.length;
        blockScores[blockName] = Math.round(average * 100);
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

  // Check if we have enough data
  const hasData = radarData.length > 0 && recentProtocols.length > 0;

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
          {hasData 
            ? `Сравнение последних ${recentProtocols.length} протоколов по всем сферам развития`
            : "Визуализация данных протоколов ППк"
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hasData ? (
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
        ) : (
          <div className="h-[400px] flex flex-col items-center justify-center text-center p-6 border border-dashed border-border rounded-lg bg-muted/20">
            <FileBarChart className="h-12 w-12 text-muted-foreground mb-4" />
            <h4 className="text-lg font-medium text-foreground mb-2">
              Нет данных для отображения
            </h4>
            <p className="text-sm text-muted-foreground max-w-sm mb-4">
              Радар динамики появится после создания хотя бы одного завершённого протокола ППк с заполненными чек-листами.
            </p>
            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
              <ClipboardList className="h-4 w-4 mt-0.5 shrink-0" />
              <span className="text-left">
                <strong>Как добавить данные:</strong> Перейдите в раздел «ППк» → «Создать протокол» → заполните чек-листы по блокам развития → завершите протокол.
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
