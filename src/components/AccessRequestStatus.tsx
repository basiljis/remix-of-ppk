import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface AccessRequest {
  status: "pending" | "approved" | "rejected";
  requested_at: string;
  reviewed_at: string | null;
  admin_notes: string | null;
}

export const AccessRequestStatus = () => {
  const [request, setRequest] = useState<AccessRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRequestStatus();
  }, []);

  const fetchRequestStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("access_requests")
        .select("status, requested_at, reviewed_at, admin_notes")
        .eq("user_id", user.id)
        .order("requested_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Error fetching access request:", error);
        return;
      }

      setRequest(data as AccessRequest);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!request) {
    return null;
  }

  const getStatusContent = () => {
    switch (request.status) {
      case "pending":
        return {
          icon: <Clock className="w-12 h-12 text-yellow-500" />,
          badge: (
            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
              <Clock className="w-4 h-4 mr-1" />
              На рассмотрении
            </Badge>
          ),
          title: "Ваша заявка на рассмотрении",
          description: "Администратор рассмотрит вашу заявку в ближайшее время. Вы получите уведомление на email после принятия решения.",
        };
      case "approved":
        return {
          icon: <CheckCircle className="w-12 h-12 text-green-500" />,
          badge: (
            <Badge className="bg-green-100 text-green-800 border-green-200">
              <CheckCircle className="w-4 h-4 mr-1" />
              Одобрена
            </Badge>
          ),
          title: "Заявка одобрена",
          description: "Ваша заявка была одобрена. Обновите страницу для входа в систему.",
        };
      case "rejected":
        return {
          icon: <XCircle className="w-12 h-12 text-red-500" />,
          badge: (
            <Badge className="bg-red-100 text-red-800 border-red-200">
              <XCircle className="w-4 h-4 mr-1" />
              Отклонена
            </Badge>
          ),
          title: "Заявка отклонена",
          description: request.admin_notes || "К сожалению, ваша заявка была отклонена. Свяжитесь с администратором для получения дополнительной информации.",
        };
      default:
        return null;
    }
  };

  const statusContent = getStatusContent();
  if (!statusContent) return null;

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            {statusContent.icon}
          </div>
          <div className="flex justify-center">
            {statusContent.badge}
          </div>
          <CardTitle className="text-2xl">{statusContent.title}</CardTitle>
          <CardDescription className="text-base">
            {statusContent.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Дата подачи заявки:</span>
              <span className="font-medium">
                {new Date(request.requested_at).toLocaleDateString("ru-RU", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
            {request.reviewed_at && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Дата рассмотрения:</span>
                <span className="font-medium">
                  {new Date(request.reviewed_at).toLocaleDateString("ru-RU", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
            )}
            {request.admin_notes && request.status !== "rejected" && (
              <div className="pt-2 border-t mt-2">
                <p className="text-sm text-muted-foreground mb-1">Комментарий администратора:</p>
                <p className="text-sm">{request.admin_notes}</p>
              </div>
            )}
          </div>

          <div className="flex justify-center gap-3">
            {request.status === "approved" && (
              <Button onClick={() => window.location.reload()} size="lg">
                Войти в систему
              </Button>
            )}
            <Button onClick={handleLogout} variant="outline" size="lg">
              Выйти
            </Button>
          </div>

          {request.status === "pending" && (
            <div className="flex items-start gap-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800">
                Обычно рассмотрение заявки занимает от нескольких часов до 1 рабочего дня. 
                После одобрения вы получите уведомление на указанный email.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
};
