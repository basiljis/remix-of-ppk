import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { useToast } from "@/hooks/use-toast";
import { Copy, QrCode, Shield, RefreshCw } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ChildCodeCardProps {
  childUniqueId: string;
  verificationCode: string;
  type: "specialist" | "parent";
  childId: string;
}

export function ChildCodeCard({ 
  childUniqueId, 
  verificationCode, 
  type,
  childId 
}: ChildCodeCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshCodeMutation = useMutation({
    mutationFn: async () => {
      setIsRefreshing(true);
      // Generate new verification code
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      let newCode = "";
      for (let i = 0; i < 6; i++) {
        newCode += chars[Math.floor(Math.random() * chars.length)];
      }
      
      const table = type === "specialist" ? "children" : "parent_children";
      const { error } = await supabase
        .from(table as any)
        .update({ verification_code: newCode })
        .eq("id", childId);
      
      if (error) throw error;
      return newCode;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["children"] });
      queryClient.invalidateQueries({ queryKey: ["parent-children"] });
      toast({
        title: "Код обновлён",
        description: "Новый код подтверждения сгенерирован",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось обновить код",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsRefreshing(false);
    },
  });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Скопировано",
      description: `${label} скопирован в буфер обмена`,
    });
  };

  const copyBoth = () => {
    const text = `Код ребёнка: ${childUniqueId}\nКод подтверждения: ${verificationCode}`;
    navigator.clipboard.writeText(text);
    toast({
      title: "Скопировано",
      description: "Оба кода скопированы в буфер обмена",
    });
  };

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <QrCode className="h-4 w-4" />
          Коды для связывания
        </CardTitle>
        <CardDescription className="text-xs">
          {type === "specialist" 
            ? "Передайте родителю для привязки к его аккаунту"
            : "Передайте специалисту для связывания карточек"
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Child Unique ID */}
        <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-muted/50">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground mb-0.5">Код ребёнка</p>
            <code className="text-sm font-mono font-bold break-all">{childUniqueId}</code>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 flex-shrink-0"
            onClick={() => copyToClipboard(childUniqueId, "Код ребёнка")}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>

        {/* Verification Code */}
        <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1">
              <Shield className="h-3 w-3" />
              Код подтверждения
            </p>
            <code className="text-sm font-mono font-bold text-amber-700 dark:text-amber-300 tracking-widest">
              {verificationCode}
            </code>
          </div>
          <div className="flex gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => copyToClipboard(verificationCode, "Код подтверждения")}
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => refreshCodeMutation.mutate()}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        <Button 
          variant="outline" 
          size="sm" 
          className="w-full"
          onClick={copyBoth}
        >
          <Copy className="h-3 w-3 mr-2" />
          Скопировать оба кода
        </Button>

        <p className="text-[10px] text-muted-foreground text-center">
          Код подтверждения нужен для безопасности — его знает только владелец карточки
        </p>
      </CardContent>
    </Card>
  );
}