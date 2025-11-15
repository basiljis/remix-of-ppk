import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Shield, LogIn, LogOut, UserPlus, AlertCircle } from "lucide-react";

interface AuthLog {
  id: string;
  created_at: string;
  event_type: string;
  user_id: string;
  user_email: string;
  ip_address?: string;
  user_agent?: string;
  success: boolean;
}

export const AuthLogsPanel = () => {
  const [logs, setLogs] = useState<AuthLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAuthLogs();
  }, []);

  const loadAuthLogs = async () => {
    try {
      setLoading(true);
      
      // Получаем логи через edge function
      const { data, error } = await supabase.functions.invoke('get-auth-logs');
      
      if (error) {
        console.error('Error fetching auth logs:', error);
        setLogs([]);
        return;
      }
      
      if (data && Array.isArray(data)) {
        setLogs(data);
      } else {
        setLogs([]);
      }
    } catch (error) {
      console.error('Error loading auth logs:', error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'user.signin':
        return <LogIn className="h-4 w-4 text-green-600" />;
      case 'user.signout':
        return <LogOut className="h-4 w-4 text-orange-600" />;
      case 'user.created':
        return <UserPlus className="h-4 w-4 text-blue-600" />;
      default:
        return <Shield className="h-4 w-4 text-gray-600" />;
    }
  };

  const getEventLabel = (eventType: string) => {
    switch (eventType) {
      case 'user.signin':
        return 'Вход в систему';
      case 'user.signout':
        return 'Выход из системы';
      case 'user.created':
        return 'Регистрация';
      default:
        return eventType;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Логи авторизации
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Логи авторизации
        </CardTitle>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Логи авторизации отсутствуют</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Дата и время</TableHead>
                  <TableHead>Событие</TableHead>
                  <TableHead>Email пользователя</TableHead>
                  <TableHead>Статус</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(log.created_at), 'dd.MM.yyyy HH:mm:ss')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getEventIcon(log.event_type)}
                        <span>{getEventLabel(log.event_type)}</span>
                      </div>
                    </TableCell>
                    <TableCell>{log.user_email}</TableCell>
                    <TableCell>
                      <Badge variant={log.success ? "default" : "destructive"}>
                        {log.success ? 'Успешно' : 'Ошибка'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
