import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, FileText, Loader2, Search, Receipt } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export const PaymentHistory = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: user } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: subscriptions, isLoading } = useQuery({
    queryKey: ["user-subscriptions", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching subscriptions:", error);
        throw error;
      }
      
      console.log("Fetched subscriptions:", data);
      return data || [];
    },
    enabled: !!user?.id,
  });

  const filteredSubscriptions = subscriptions?.filter((sub) => {
    const matchesSearch = 
      sub.payment_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.subscription_type?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || sub.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-success">Активна</Badge>;
      case "expired":
        return <Badge variant="destructive">Истекла</Badge>;
      case "pending":
        return <Badge variant="secondary">Ожидает</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleDownloadReceipt = async (subscriptionId: string, documentType: "receipt" | "act") => {
    setIsGenerating(subscriptionId);
    try {
      const subscription = subscriptions?.find(s => s.id === subscriptionId);
      if (!subscription) return;

      const { data, error } = await supabase.functions.invoke("generate-payment-document", {
        body: {
          subscriptionId,
          documentType,
          subscription: {
            payment_id: subscription.payment_id,
            amount: subscription.amount,
            subscription_type: subscription.subscription_type,
            created_at: subscription.created_at,
            legal_entity_data: subscription.legal_entity_data,
            payment_type: subscription.payment_type,
          },
        },
      });

      if (error) throw error;

      // Download PDF
      const blob = await fetch(data.pdfUrl).then(r => r.blob());
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${documentType}_${subscription.payment_id || subscription.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Документ сформирован",
        description: `${documentType === "receipt" ? "Чек" : "Акт"} успешно скачан`,
      });
    } catch (error: any) {
      console.error("Error generating document:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось сформировать документ",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            История платежей
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Поиск по ID платежа или типу подписки..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Статус" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все статусы</SelectItem>
                  <SelectItem value="active">Активные</SelectItem>
                  <SelectItem value="expired">Истекшие</SelectItem>
                  <SelectItem value="pending">Ожидающие</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Дата</TableHead>
                    <TableHead>ID платежа</TableHead>
                    <TableHead>Тип подписки</TableHead>
                    <TableHead>Сумма</TableHead>
                    <TableHead>Период</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubscriptions?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        Платежи не найдены
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSubscriptions?.map((subscription) => (
                      <TableRow key={subscription.id}>
                        <TableCell>
                          {format(new Date(subscription.created_at!), "dd.MM.yyyy")}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {subscription.payment_id || "—"}
                        </TableCell>
                        <TableCell>
                          {subscription.subscription_type === "monthly" ? "Месячная" : "Годовая"}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {Number(subscription.amount).toLocaleString()} ₽
                        </TableCell>
                        <TableCell>
                          {subscription.start_date && subscription.end_date ? (
                            <div className="text-sm">
                              <div>{format(new Date(subscription.start_date), "dd.MM.yyyy")}</div>
                              <div className="text-muted-foreground">
                                до {format(new Date(subscription.end_date), "dd.MM.yyyy")}
                              </div>
                            </div>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(subscription.status)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadReceipt(subscription.id, "receipt")}
                              disabled={isGenerating === subscription.id || subscription.status === "pending"}
                              className="gap-2"
                            >
                              {isGenerating === subscription.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Download className="h-4 w-4" />
                              )}
                              Чек
                            </Button>
                            {subscription.payment_type === "legal_entity" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownloadReceipt(subscription.id, "act")}
                                disabled={isGenerating === subscription.id || subscription.status === "pending"}
                                className="gap-2"
                              >
                                {isGenerating === subscription.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <FileText className="h-4 w-4" />
                                )}
                                Акт
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
