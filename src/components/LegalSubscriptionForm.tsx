import { useState } from "react";
import { Bell, Mail, Smartphone, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLegalSubscription } from "@/hooks/useLegalUpdates";

export function LegalSubscriptionForm() {
  const [email, setEmail] = useState("");
  const { subscribe } = useLegalSubscription();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) return;
    subscribe.mutate(email);
  };

  const handlePushNotification = () => {
    // В будущем здесь будет логика запроса разрешений на push
    if (!("Notification" in window)) {
      alert("Ваш браузер не поддерживает уведомления");
      return;
    }
    
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        alert("Push-уведомления включены! (Демо-режим)");
      }
    });
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2 mb-1">
          <Bell className="h-5 w-5 text-primary" />
          <CardTitle className="text-xl">Следите за изменениями</CardTitle>
        </div>
        <CardDescription>
          Подпишитесь, чтобы первыми узнавать об изменениях в законодательстве и регламентах ППк/ПМПК
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="email"
              placeholder="Ваш e-mail"
              className="pl-9"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <Button type="submit" disabled={subscribe.isPending} className="gap-2">
            {subscribe.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Mail className="h-4 w-4" />
            )}
            Подписаться по почте
          </Button>
        </form>
        
        <div className="flex items-center justify-between py-2 border-t border-primary/10 mt-2">
          <span className="text-sm text-muted-foreground">Также доступны мгновенные уведомления в браузере</span>
          <Button variant="outline" size="sm" onClick={handlePushNotification} className="gap-2">
            <Smartphone className="h-4 w-4" />
            Включить Push
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
