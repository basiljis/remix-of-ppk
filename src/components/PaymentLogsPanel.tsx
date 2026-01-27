import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Eye, Loader2 } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export const PaymentLogsPanel = () => {
  const [selectedLog, setSelectedLog] = useState<any>(null);

  const { data: logs, isLoading } = useQuery({
    queryKey: ["payment-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      
      // Получаем данные о пользователях для каждого лога
      if (data && data.length > 0) {
        const subscriptionIds = data
          .map(log => log.subscription_id)
          .filter(Boolean);
        
        if (subscriptionIds.length > 0) {
          const { data: subscriptions } = await supabase
            .from("subscriptions")
            .select(`
              id,
              user_id,
              subscription_type
            `)
            .in("id", subscriptionIds);
          
          if (subscriptions) {
            const userIds = subscriptions.map(s => s.user_id).filter(Boolean);
            
            if (userIds.length > 0) {
              const { data: profiles } = await supabase
                .from("profiles")
                .select("id, full_name, email")
                .in("id", userIds);
              
              // Обогащаем логи данными о пользователях
              return data.map(log => {
                const subscription = subscriptions.find(s => s.id === log.subscription_id);
                const profile = profiles?.find(p => p.id === subscription?.user_id);
                return {
                  ...log,
                  subscription: subscription,
                  profile: profile
                };
              });
            }
          }
        }
      }
      
      return data || [];
    },
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      succeeded: { label: "Успешно", variant: "default" },
      pending: { label: "В процессе", variant: "secondary" },
      canceled: { label: "Отменен", variant: "destructive" },
      waiting_for_capture: { label: "Ожидает", variant: "outline" },
    };
    const config = variants[status] || { label: status, variant: "outline" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getEventTypeBadge = (eventType: string) => {
    const variants: Record<string, any> = {
      "payment.succeeded": { label: "Платеж успешен", variant: "default" },
      "payment.canceled": { label: "Платеж отменен", variant: "destructive" },
      "payment.pending": { label: "Платеж в процессе", variant: "secondary" },
      "refund.succeeded": { label: "Возврат", variant: "outline" },
    };
    const config = variants[eventType] || { label: eventType, variant: "outline" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Логи платежей</CardTitle>
        <CardDescription>
          История всех событий от платежной системы ЮКасса
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!logs || logs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Нет логов платежей</p>
            <p className="text-sm text-muted-foreground mt-2">
              Логи появятся после первых платежей через ЮКассу
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Дата</TableHead>
                  <TableHead>Пользователь</TableHead>
                  <TableHead>Событие</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Сумма</TableHead>
                  <TableHead>Обработано</TableHead>
                  <TableHead>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log: any) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap">
                    {format(new Date(log.created_at), "dd MMM yyyy, HH:mm", { locale: ru })}
                  </TableCell>
                  <TableCell>
                    {log.profile ? (
                      <div>
                        <p className="font-medium">{log.profile.full_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {log.profile.email}
                        </p>
                      </div>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>{getEventTypeBadge(log.event_type)}</TableCell>
                  <TableCell>{getStatusBadge(log.status)}</TableCell>
                  <TableCell className="font-medium">
                    {log.amount ? `${log.amount.toLocaleString()} ₽` : "—"}
                  </TableCell>
                  <TableCell>
                    {log.processed ? (
                      <Badge variant="default">Да</Badge>
                    ) : (
                      <Badge variant="secondary">Нет</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedLog(log)}
                          aria-label="Просмотреть детали платежа"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh]">
                        <DialogHeader>
                          <DialogTitle>Детали платежа</DialogTitle>
                          <DialogDescription>
                            ID платежа: {log.payment_id}
                          </DialogDescription>
                        </DialogHeader>
                        <ScrollArea className="h-[60vh]">
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-semibold mb-2">Информация</h4>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Событие:</span>
                                  <p className="font-medium">{log.event_type}</p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Статус:</span>
                                  <p className="font-medium">{log.status}</p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Сумма:</span>
                                  <p className="font-medium">
                                    {log.amount ? `${log.amount.toLocaleString()} ₽` : "—"}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Обработано:</span>
                                  <p className="font-medium">{log.processed ? "Да" : "Нет"}</p>
                                </div>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-semibold mb-2">Подписка</h4>
                              {log.subscription ? (
                                <div className="text-sm space-y-1">
                                  <p>
                                    <span className="text-muted-foreground">Тип: </span>
                                    {log.subscription.subscription_type === "monthly"
                                      ? "Месячная"
                                      : "Годовая"}
                                  </p>
                                  {log.profile && (
                                    <>
                                      <p>
                                        <span className="text-muted-foreground">Пользователь: </span>
                                        {log.profile.full_name}
                                      </p>
                                      <p>
                                        <span className="text-muted-foreground">Email: </span>
                                        {log.profile.email}
                                      </p>
                                    </>
                                  )}
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground">Нет данных</p>
                              )}
                            </div>
                            <div>
                              <h4 className="font-semibold mb-2">Полные данные (JSON)</h4>
                              <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto">
                                {JSON.stringify(log.raw_data, null, 2)}
                              </pre>
                            </div>
                          </div>
                        </ScrollArea>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
