import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Key, RefreshCw, Copy, Eye, EyeOff, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ChildCredentialsCardProps {
  childId: string;
  childName: string;
}

interface ChildCredential {
  id: string;
  login: string;
  plain_password: string | null;
  is_active: boolean;
  last_login_at: string | null;
}

export function ChildCredentialsCard({ childId, childName }: ChildCredentialsCardProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);

  const { data: credentials, isLoading } = useQuery({
    queryKey: ["child-credentials", childId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("child_credentials")
        .select("*")
        .eq("parent_child_id", childId)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as ChildCredential | null;
    },
  });

  const generateCredentialsMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("generate_child_credentials", {
        p_parent_child_id: childId,
      } as any);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["child-credentials", childId] });
      toast({
        title: "Данные для входа созданы",
        description: "Теперь ребёнок может войти в свой аккаунт",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось создать данные для входа",
        variant: "destructive",
      });
    },
  });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Скопировано",
      description: `${label} скопирован в буфер обмена`,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">
          Загрузка...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Вход для ребёнка</CardTitle>
          </div>
          {credentials?.is_active && (
            <Badge variant="outline" className="text-green-600">Активен</Badge>
          )}
        </div>
        <CardDescription>
          Данные для самостоятельного входа ребёнка на платформу
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {credentials ? (
          <>
            <div className="space-y-3 p-4 rounded-lg bg-muted/50">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Логин:</span>
                <div className="flex items-center gap-2">
                  <code className="px-2 py-1 bg-background rounded text-sm font-mono">
                    {credentials.login}
                  </code>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => copyToClipboard(credentials.login, "Логин")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Пароль:</span>
                <div className="flex items-center gap-2">
                  <code className="px-2 py-1 bg-background rounded text-sm font-mono">
                    {showPassword ? credentials.plain_password : "••••••••"}
                  </code>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  {credentials.plain_password && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => copyToClipboard(credentials.plain_password!, "Пароль")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              {credentials.last_login_at && (
                <p className="text-xs text-muted-foreground pt-2 border-t">
                  Последний вход: {new Date(credentials.last_login_at).toLocaleDateString("ru-RU", {
                    day: "numeric",
                    month: "long",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={() => generateCredentialsMutation.mutate()}
                disabled={generateCredentialsMutation.isPending}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${generateCredentialsMutation.isPending ? "animate-spin" : ""}`} />
                Обновить пароль
              </Button>
              <Button 
                size="sm" 
                className="flex-1"
                onClick={() => navigate(`/child-workspace?childId=${childId}`)}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Открыть задания
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Создайте данные для входа, чтобы {childName} мог самостоятельно выполнять задания
            </p>
            <Button 
              onClick={() => generateCredentialsMutation.mutate()}
              disabled={generateCredentialsMutation.isPending}
            >
              <Key className="h-4 w-4 mr-2" />
              {generateCredentialsMutation.isPending ? "Создаём..." : "Создать аккаунт"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
