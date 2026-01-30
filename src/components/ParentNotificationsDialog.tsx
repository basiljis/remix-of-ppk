import { Bell, Calendar, Clock, MapPin } from "lucide-react";
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
import { useParentNotifications } from "@/hooks/useParentNotifications";

interface ParentNotificationsDialogProps {
  onNavigate?: (tab: string) => void;
}

export function ParentNotificationsDialog({ onNavigate }: ParentNotificationsDialogProps) {
  const { notifications, count, urgentCount } = useParentNotifications();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "upcoming_session":
        return <Calendar className="h-4 w-4" />;
      case "consultation_booked":
        return <Clock className="h-4 w-4" />;
      case "session_cancelled":
        return <Bell className="h-4 w-4 text-destructive" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getNotificationBadgeVariant = (type: string, date: string) => {
    const notifDate = new Date(date);
    const today = new Date();
    const isToday = notifDate.toDateString() === today.toDateString();
    
    if (isToday) return "destructive" as const;
    
    switch (type) {
      case "upcoming_session":
        return "default" as const;
      case "session_cancelled":
        return "destructive" as const;
      default:
        return "secondary" as const;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return "Сегодня";
    }
    if (date.toDateString() === tomorrow.toDateString()) {
      return "Завтра";
    }
    return date.toLocaleDateString("ru-RU", { 
      day: "numeric", 
      month: "long",
      weekday: "short"
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative" 
          aria-label={`Уведомления${count > 0 ? `, ${count} предстоящих занятий` : ''}`}
        >
          <Bell className={`h-5 w-5 ${urgentCount > 0 ? 'animate-pulse text-pink-500' : ''}`} />
          {count > 0 && (
            <Badge 
              variant={urgentCount > 0 ? "destructive" : "secondary"}
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs font-bold shadow-lg"
            >
              {count > 9 ? '9+' : count}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-pink-500" />
            Предстоящие занятия
          </DialogTitle>
          <DialogDescription>
            {count === 0
              ? "Нет запланированных занятий"
              : `${count} ${count === 1 ? "занятие" : count < 5 ? "занятия" : "занятий"} запланировано`}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[400px] w-full pr-4">
          {notifications.length > 0 ? (
            <div className="space-y-3">
              {notifications.map((notification) => {
                const isToday = new Date(notification.date).toDateString() === new Date().toDateString();
                
                return (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-lg border-2 bg-card transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md ${
                      isToday 
                        ? 'border-pink-400 bg-pink-50/50 dark:bg-pink-950/20 hover:bg-pink-100/50' 
                        : 'hover:bg-accent/70 hover:border-primary'
                    }`}
                    onClick={() => {
                      if (notification.link && onNavigate) {
                        onNavigate(notification.link);
                      }
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <Badge
                        variant={getNotificationBadgeVariant(notification.type, notification.date)}
                        className={`mt-0.5 p-2 ${isToday ? 'bg-pink-500' : ''}`}
                      >
                        {getNotificationIcon(notification.type)}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className={`text-sm font-bold ${isToday ? 'text-pink-600 dark:text-pink-400' : 'text-foreground'}`}>
                            {notification.title}
                          </h4>
                          {isToday && (
                            <Badge variant="destructive" className="text-[10px] py-0 px-1.5 bg-pink-500">
                              Скоро
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-foreground/80 mt-1">
                          {notification.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(notification.date)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-12">
              <div className="w-16 h-16 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center mb-4">
                <Calendar className="h-8 w-8 text-pink-500" />
              </div>
              <p className="text-muted-foreground text-center">
                Нет запланированных занятий
              </p>
              <p className="text-sm text-muted-foreground/70 text-center mt-1">
                Запишитесь на консультацию, чтобы начать
              </p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
