import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { 
  CreditCard, Save, Loader2, CheckCircle2, AlertTriangle, 
  Eye, EyeOff, Copy, Check, ShieldCheck, Info, ExternalLink,
  Wallet, Banknote
} from "lucide-react";

export function SpecialistPaymentSettingsPanel() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [onlinePaymentEnabled, setOnlinePaymentEnabled] = useState(false);
  const [paymentMode, setPaymentMode] = useState<"prepay" | "postpay">("prepay");
  const [shopId, setShopId] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["specialist-payment-settings", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("specialist_payment_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (settings) {
      setOnlinePaymentEnabled(settings.online_payment_enabled);
      setPaymentMode(settings.payment_mode as "prepay" | "postpay");
      setShopId(settings.yukassa_shop_id || "");
      setSecretKey(settings.yukassa_secret_key || "");
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("No user");

      const isConfigured = !!(shopId && secretKey);

      const payload = {
        user_id: user.id,
        online_payment_enabled: onlinePaymentEnabled,
        payment_mode: paymentMode,
        yukassa_shop_id: shopId || null,
        yukassa_secret_key: secretKey || null,
        is_configured: isConfigured,
      };

      const { error } = await supabase
        .from("specialist_payment_settings")
        .upsert(payload, { onConflict: "user_id" });

      if (error) throw error;

      // Also update profile fields
      await supabase
        .from("profiles")
        .update({
          online_payment_enabled: onlinePaymentEnabled,
          payment_mode: paymentMode,
        })
        .eq("id", user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["specialist-payment-settings"] });
      queryClient.invalidateQueries({ queryKey: ["specialist-public-profile"] });
      toast({ title: "Сохранено", description: "Настройки оплаты обновлены" });
    },
    onError: (error: Error) => {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    },
  });

  const webhookUrl = `https://oxyjmeslnmhewlpgzlmf.supabase.co/functions/v1/specialist-payment-webhook`;

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Скопировано" });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Настройки онлайн-оплаты
          </CardTitle>
          <CardDescription>
            Подключите собственную кассу ЮKassa для приёма оплат от клиентов
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable online payments */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                {onlinePaymentEnabled ? (
                  <Wallet className="h-4 w-4 text-green-600" />
                ) : (
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                )}
                <Label htmlFor="online-payment" className="font-medium">
                  Онлайн-оплата
                </Label>
              </div>
              <p className="text-sm text-muted-foreground">
                {onlinePaymentEnabled
                  ? "Клиенты могут оплачивать занятия онлайн"
                  : "Онлайн-оплата отключена"
                }
              </p>
            </div>
            <Switch
              id="online-payment"
              checked={onlinePaymentEnabled}
              onCheckedChange={setOnlinePaymentEnabled}
            />
          </div>

          {/* Payment mode */}
          <div className="space-y-3 p-4 border rounded-lg">
            <Label className="flex items-center gap-2 font-medium">
              <Banknote className="h-4 w-4" />
              Тип оплаты
            </Label>
            <RadioGroup 
              value={paymentMode} 
              onValueChange={(v) => setPaymentMode(v as "prepay" | "postpay")}
              className="space-y-2"
            >
              <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                <RadioGroupItem value="prepay" id="mode-prepay" className="mt-0.5" />
                <div>
                  <Label htmlFor="mode-prepay" className="cursor-pointer font-medium">
                    Предоплата
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Клиент оплачивает занятие заранее при записи. Рекомендуется для снижения отмен.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                <RadioGroupItem value="postpay" id="mode-postpay" className="mt-0.5" />
                <div>
                  <Label htmlFor="mode-postpay" className="cursor-pointer font-medium">
                    Постоплата
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Клиент оплачивает после проведения занятия. Счёт формируется автоматически.
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* YuKassa credentials */}
          {onlinePaymentEnabled && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <Label className="font-medium text-base">Данные ЮKassa</Label>
                {settings?.is_configured && (
                  <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50 dark:bg-green-950/30">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Подключено
                  </Badge>
                )}
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Как получить ключи?</AlertTitle>
                <AlertDescription className="space-y-2">
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Зарегистрируйтесь в <a href="https://yookassa.ru" target="_blank" rel="noopener noreferrer" className="text-primary underline inline-flex items-center gap-1">ЮKassa <ExternalLink className="h-3 w-3" /></a></li>
                    <li>Перейдите в раздел «Настройки» → «Ключи API»</li>
                    <li>Скопируйте Shop ID и Секретный ключ</li>
                    <li>Вставьте данные ниже и сохраните</li>
                  </ol>
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="shop-id">Shop ID (Идентификатор магазина)</Label>
                  <Input
                    id="shop-id"
                    value={shopId}
                    onChange={(e) => setShopId(e.target.value)}
                    placeholder="123456"
                    className="font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secret-key">Секретный ключ</Label>
                  <div className="relative">
                    <Input
                      id="secret-key"
                      type={showSecretKey ? "text" : "password"}
                      value={secretKey}
                      onChange={(e) => setSecretKey(e.target.value)}
                      placeholder="live_..."
                      className="font-mono pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full"
                      onClick={() => setShowSecretKey(!showSecretKey)}
                    >
                      {showSecretKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Ключ хранится в зашифрованном виде и используется только на сервере
                  </p>
                </div>
              </div>

              {/* Webhook URL */}
              <div className="space-y-2 pt-2 border-t">
                <Label>Webhook URL (для настройки в ЮKassa)</Label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-background p-2 rounded border truncate">
                    {webhookUrl}
                  </code>
                  <Button variant="ghost" size="icon" onClick={handleCopyWebhook}>
                    {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Укажите этот URL в настройках уведомлений в личном кабинете ЮKassa
                </p>
              </div>
            </div>
          )}

          {/* Warning if no price set */}
          {onlinePaymentEnabled && (
            <Alert variant="default">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Важно</AlertTitle>
              <AlertDescription>
                Убедитесь, что вы указали стоимость консультации в разделе «Стоимость услуг» вашего публичного профиля.
                Именно эта сумма будет выставлена клиенту при оплате.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Instructions accordion */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Инструкции по подключению ЮKassa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="step-1">
              <AccordionTrigger>1. Регистрация в ЮKassa</AccordionTrigger>
              <AccordionContent className="space-y-2 text-sm">
                <p>Для приёма онлайн-платежей необходимо зарегистрироваться в платёжной системе ЮKassa (ранее — Яндекс.Касса).</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Перейдите на <a href="https://yookassa.ru" target="_blank" rel="noopener noreferrer" className="text-primary underline">yookassa.ru</a></li>
                  <li>Нажмите «Подключить»</li>
                  <li>Выберите тип: самозанятый, ИП или ООО</li>
                  <li>Заполните анкету и загрузите документы</li>
                  <li>Дождитесь проверки (1–3 рабочих дня)</li>
                </ol>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="step-2">
              <AccordionTrigger>2. Получение ключей API</AccordionTrigger>
              <AccordionContent className="space-y-2 text-sm">
                <p>После одобрения заявки:</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Войдите в <a href="https://yookassa.ru/my" target="_blank" rel="noopener noreferrer" className="text-primary underline">личный кабинет ЮKassa</a></li>
                  <li>Перейдите в «Настройки» → «Ключи API»</li>
                  <li>Скопируйте <strong>shopId</strong> (идентификатор магазина)</li>
                  <li>Сгенерируйте <strong>Секретный ключ</strong></li>
                  <li>Вставьте оба значения в форму выше</li>
                </ol>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="step-3">
              <AccordionTrigger>3. Настройка Webhook</AccordionTrigger>
              <AccordionContent className="space-y-2 text-sm">
                <p>Для автоматического подтверждения оплаты настройте webhook:</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>В личном кабинете ЮKassa → «Настройки» → «Уведомления»</li>
                  <li>Нажмите «Добавить URL»</li>
                  <li>Вставьте Webhook URL из формы выше</li>
                  <li>Выберите событие: <strong>payment.succeeded</strong></li>
                  <li>Сохраните настройки</li>
                </ol>
                <Alert className="mt-2">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Без настройки webhook статус оплаты не обновится автоматически.
                  </AlertDescription>
                </Alert>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="step-4">
              <AccordionTrigger>4. Требования к самозанятым и ИП</AccordionTrigger>
              <AccordionContent className="space-y-2 text-sm">
                <p><strong>Самозанятый (НПД):</strong></p>
                <ul className="list-disc list-inside ml-2 space-y-1">
                  <li>Годовой доход до 2,4 млн ₽</li>
                  <li>Налог 4% (от физ. лиц) или 6% (от юр. лиц)</li>
                  <li>Регистрация через приложение «Мой налог»</li>
                  <li>Чек формируется в «Мой налог» после получения оплаты</li>
                </ul>
                <p className="mt-2"><strong>ИП:</strong></p>
                <ul className="list-disc list-inside ml-2 space-y-1">
                  <li>Требуется онлайн-касса (54-ФЗ) — ЮKassa отправляет чек автоматически</li>
                  <li>УСН 6% или 15% на выбор</li>
                  <li>Ежеквартальная отчётность</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Save button */}
      <div className="flex justify-end">
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="gap-2"
        >
          {saveMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Сохранить настройки оплаты
        </Button>
      </div>
    </div>
  );
}
