import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { History, GitBranch, AlertCircle, Info, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { useLegalUpdates, type LegalUpdate } from "@/hooks/useLegalUpdates";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export function LegalUpdatesHistory() {
  const { data: updates, isLoading } = useLegalUpdates();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (!updates || updates.length === 0) return null;

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <History className="h-5 w-5 text-primary" />
        <h2 className="text-2xl font-semibold">Журнал обновлений базы</h2>
      </div>

      <div className="relative border-l-2 border-primary/20 ml-3 pl-6 space-y-8">
        {updates.map((update) => (
          <div key={update.id} className="relative">
            <div className="absolute -left-[33px] top-0 h-4 w-4 rounded-full bg-background border-2 border-primary" />
            
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-muted-foreground">
                    {format(new Date(update.created_at), "d MMMM yyyy", { locale: ru })}
                  </span>
                  {update.is_major && (
                    <Badge variant="default" className="text-[10px] px-1.5 py-0 uppercase">
                      Важное
                    </Badge>
                  )}
                </div>
                <h3 className="text-lg font-bold leading-tight">{update.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{update.description}</p>
              </div>
              <Badge variant="outline" className="font-mono text-xs">
                v{update.version_label}
              </Badge>
            </div>

            <button
              onClick={() => setExpandedId(expandedId === update.id ? null : update.id)}
              className="flex items-center gap-1.5 text-xs text-primary hover:underline mt-2"
            >
              {expandedId === update.id ? (
                <>
                  Скрыть детали <ChevronUp className="h-3 w-3" />
                </>
              ) : (
                <>
                  Показать изменения ({update.changes.length}) <ChevronDown className="h-3 w-3" />
                </>
              )}
            </button>

            {expandedId === update.id && (
              <Card className="mt-3 bg-muted/50 border-border/40 shadow-none">
                <CardContent className="p-4 space-y-3">
                  {update.changes.map((change, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      {change.type === "add" ? (
                        <GitBranch className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      ) : change.type === "update" ? (
                        <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                      )}
                      <div>
                        <span className="text-xs font-semibold text-foreground mr-2">
                          {change.doc}:
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {change.text}
                        </span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
