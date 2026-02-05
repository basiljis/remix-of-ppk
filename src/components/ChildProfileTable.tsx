import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Minus, ExternalLink, TableIcon, ClipboardList } from "lucide-react";

interface Protocol {
  id: string;
  created_at: string;
  ppk_number: string;
  checklist_data: any;
}

interface Props {
  protocols: Protocol[];
  onShowDetails?: () => void;
}

export function ChildProfileTable({ protocols, onShowDetails }: Props) {
  // Calculate block scores for each protocol
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

  // Get all unique block names
  const allBlocks = new Set<string>();
  protocols.forEach(protocol => {
    const scores = calculateBlockScores(protocol);
    Object.keys(scores).forEach(block => allBlocks.add(block));
  });

  const blockNames = Array.from(allBlocks);

  const hasData = blockNames.length > 0 && protocols.length > 0;

  // Calculate trends for each block
  const calculateTrend = (blockName: string, currentIndex: number) => {
    if (currentIndex === 0) return null;
    
    const currentScore = calculateBlockScores(protocols[currentIndex])[blockName] || 0;
    const previousScore = calculateBlockScores(protocols[currentIndex - 1])[blockName] || 0;
    
    if (currentScore > previousScore) return "up";
    if (currentScore < previousScore) return "down";
    return "same";
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Таблица динамики по ППк</CardTitle>
          <CardDescription>
            Процентные показатели по всем блокам с индикацией изменений
          </CardDescription>
        </div>
        {onShowDetails && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={onShowDetails}
            className="gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            Подробнее
          </Button>
        )}
      </CardHeader>
      <CardContent className="overflow-auto">
        {hasData ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[180px]">Блок</TableHead>
                {protocols.map((protocol) => (
                  <TableHead key={protocol.id} className="text-center min-w-[120px]">
                    <div className="flex flex-col">
                      <span className="font-medium">№{protocol.ppk_number || "—"}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(protocol.created_at).toLocaleDateString("ru-RU")}
                      </span>
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {blockNames.map((blockName) => (
                <TableRow key={blockName}>
                  <TableCell className="font-medium">{blockName}</TableCell>
                  {protocols.map((protocol, index) => {
                    const scores = calculateBlockScores(protocol);
                    const score = scores[blockName];
                    const trend = calculateTrend(blockName, index);

                    return (
                      <TableCell key={protocol.id} className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className="font-medium">{score !== undefined ? `${score}%` : "—"}</span>
                          {trend === "up" && (
                            <TrendingUp className="h-4 w-4 text-success-foreground" />
                          )}
                          {trend === "down" && (
                            <TrendingDown className="h-4 w-4 text-destructive" />
                          )}
                          {trend === "same" && (
                            <Minus className="h-4 w-4 text-warning-foreground" />
                          )}
                        </div>
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-8 border border-dashed border-border rounded-lg bg-muted/20">
            <TableIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <h4 className="text-lg font-medium text-foreground mb-2">
              Таблица динамики пуста
            </h4>
            <p className="text-sm text-muted-foreground max-w-sm mb-4">
              Здесь будут отображаться процентные показатели по всем блокам развития из протоколов ППк.
            </p>
            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
              <ClipboardList className="h-4 w-4 mt-0.5 shrink-0" />
              <span className="text-left">
                <strong>Как заполнить таблицу:</strong> Создайте и завершите протокол ППк с заполненными чек-листами. Данные появятся автоматически.
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
