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
    <Card className="border-primary/20 bg-background shadow-none border rounded-xl overflow-hidden">
      <CardHeader className="p-4 pb-0">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" />
          <CardTitle className="text-lg">Уведомления</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-3">
        <CardDescription className="text-sm mb-3">
          Подпишитесь на изменения в законодательстве ППк/ПМПК
        </CardDescription>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            type="email"
            placeholder="E-mail"
            className="h-9 text-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Button type="submit" disabled={subscribe.isPending} size="sm" className="h-9">
            {subscribe.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Подписаться"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
