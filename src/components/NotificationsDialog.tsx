import { Bell, FileText, UserPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useNotifications } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

interface NotificationsDialogProps {
  onNavigate?: (tab: string) => void;
}

export function NotificationsDialog({ onNavigate }: NotificationsDialogProps) {
  const { notifications, count } = useNotifications();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "draft_protocol":
        return <FileText className="h-4 w-4" />;
      case "pending_request":
        return <UserPlus className="h-4 w-4" />;
      case "expiring_subscription":
        return <Bell className="h-4 w-4 text-orange-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getNotificationBadgeVariant = (type: string) => {
    switch (type) {
      case "draft_protocol":
        return "secondary" as const;
      case "pending_request":
        return "default" as const;
      case "expiring_subscription":
        return "destructive" as const;
      default:
        return "outline" as const;
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className={`h-5 w-5 ${count > 0 ? 'animate-pulse text-primary' : ''}`} />
          {count > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-6 w-6 flex items-center justify-center p-0 text-xs font-bold animate-bounce shadow-lg"
            >
              {count > 9 ? '9+' : count}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Уведомления</DialogTitle>
          <DialogDescription>
            {count === 0
              ? "Нет новых уведомлений"
              : `У вас ${count} ${count === 1 ? "новое уведомление" : "новых уведомлений"}`}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[400px] w-full pr-4">
          {notifications.length > 0 ? (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="p-4 rounded-lg border-2 bg-card hover:bg-accent/70 hover:border-primary transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md"
                  onClick={() => {
                    if (notification.link && onNavigate) {
                      onNavigate(notification.link);
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    <Badge
                      variant={getNotificationBadgeVariant(notification.type)}
                      className="mt-0.5 p-2"
                    >
                      {getNotificationIcon(notification.type)}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-foreground">{notification.title}</h4>
                      <p className="text-sm text-foreground/80 mt-1">{notification.description}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                          locale: ru,
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Нет новых уведомлений</p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
