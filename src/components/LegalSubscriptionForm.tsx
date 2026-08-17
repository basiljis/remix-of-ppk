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
    <Card className="border-primary/20 bg-primary/5 shadow-none border rounded-xl overflow-hidden">
      <CardContent className="p-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <Bell className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold whitespace-nowrap">Уведомления об обновлениях</span>
          </div>
          
          <form onSubmit={handleSubmit} className="flex-1 flex gap-2 w-full">
            <Input
              type="email"
              placeholder="E-mail"
              className="h-8 text-xs bg-background/80"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Button type="submit" disabled={subscribe.isPending} size="sm" className="h-8 text-xs px-3 shrink-0">
              {subscribe.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Подписаться"}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
