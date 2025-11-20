import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CreditCard, Building2, Calendar } from "lucide-react";

const legalEntitySchema = z.object({
  organizationName: z.string().min(3, "Введите название организации"),
  inn: z.string().regex(/^\d{10}$|^\d{12}$/, "ИНН должен содержать 10 или 12 цифр"),
  kpp: z.string().regex(/^\d{9}$/, "КПП должен содержать 9 цифр").optional().or(z.literal("")),
  legalAddress: z.string().min(10, "Введите юридический адрес"),
  contactPerson: z.string().min(3, "Введите ФИО контактного лица"),
  email: z.string().email("Некорректный email"),
  phone: z.string().regex(/^\+?[0-9]{10,12}$/, "Некорректный номер телефона"),
});

export const SubscriptionForm = () => {
  const [subscriptionType, setSubscriptionType] = useState<"monthly" | "yearly">("yearly");
  const [paymentType, setPaymentType] = useState<"individual" | "legal">("individual");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(legalEntitySchema),
    defaultValues: {
      organizationName: "",
      inn: "",
      kpp: "",
      legalAddress: "",
      contactPerson: "",
      email: "",
      phone: "",
    },
  });

  const amount = subscriptionType === "monthly" ? 2500 : 25500;

  const handleIndividualPayment = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Пользователь не авторизован");

      // Создаем запись подписки
      const { data: subscription, error: subError } = await supabase
        .from("subscriptions")
        .insert({
          user_id: user.id,
          subscription_type: subscriptionType,
          payment_type: "individual",
          amount,
          status: "pending",
        })
        .select()
        .single();

      if (subError) throw subError;

      // Вызываем edge function для создания платежа в ЮКасса
      const { data, error } = await supabase.functions.invoke("create-yukassa-payment", {
        body: {
          subscriptionId: subscription.id,
          amount,
          description: subscriptionType === "monthly" 
            ? "Подписка на 1 месяц" 
            : "Подписка на 1 год (скидка 15%)",
        },
      });

      if (error) throw error;

      // Перенаправляем на страницу оплаты ЮКассы
      if (data?.confirmationUrl) {
        window.location.href = data.confirmationUrl;
      }
    } catch (error: any) {
      console.error("Error creating payment:", error);
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось создать платеж",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLegalEntityRequest = async (values: z.infer<typeof legalEntitySchema>) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Пользователь не авторизован");

      const { error } = await supabase
        .from("subscription_requests")
        .insert({
          user_id: user.id,
          organization_name: values.organizationName,
          inn: values.inn,
          kpp: values.kpp || null,
          legal_address: values.legalAddress,
          contact_person: values.contactPerson,
          email: values.email,
          phone: values.phone,
          subscription_type: subscriptionType,
          amount,
          status: "pending",
        });

      if (error) throw error;

      // Отправляем email администратору
      await supabase.functions.invoke("send-subscription-request-email", {
        body: {
          organizationName: values.organizationName,
          inn: values.inn,
          contactPerson: values.contactPerson,
          email: values.email,
          phone: values.phone,
          subscriptionType: subscriptionType === "monthly" ? "Месячная" : "Годовая",
          amount,
        },
      });

      toast({
        title: "Запрос отправлен",
        description: "Администратор рассмотрит вашу заявку и свяжется с вами для выставления счета",
      });

      form.reset();
    } catch (error: any) {
      console.error("Error submitting request:", error);
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось отправить запрос",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Оформление подписки</CardTitle>
        <CardDescription>
          Выберите тарифный план и способ оплаты
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Выбор тарифа */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Выберите тарифный план</label>
          <RadioGroup value={subscriptionType} onValueChange={(value: any) => setSubscriptionType(value)}>
            <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-muted/50">
              <RadioGroupItem value="monthly" id="monthly" />
              <label htmlFor="monthly" className="flex-1 cursor-pointer">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <div>
                      <p className="font-medium">Месячная подписка</p>
                      <p className="text-xs text-muted-foreground">Оплата каждый месяц</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">2 500 ₽</p>
                    <p className="text-xs text-muted-foreground">в месяц</p>
                  </div>
                </div>
              </label>
            </div>
            <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-muted/50 border-primary bg-primary/5">
              <RadioGroupItem value="yearly" id="yearly" />
              <label htmlFor="yearly" className="flex-1 cursor-pointer">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <div>
                      <p className="font-medium">Годовая подписка</p>
                      <p className="text-xs text-primary font-medium">Экономия 15%</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">25 500 ₽</p>
                    <p className="text-xs text-muted-foreground line-through">30 000 ₽</p>
                  </div>
                </div>
              </label>
            </div>
          </RadioGroup>
        </div>

        {/* Выбор способа оплаты */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Способ оплаты</label>
          <RadioGroup value={paymentType} onValueChange={(value: any) => setPaymentType(value)}>
            <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-muted/50">
              <RadioGroupItem value="individual" id="individual" />
              <label htmlFor="individual" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  <div>
                    <p className="font-medium">Оплата картой</p>
                    <p className="text-xs text-muted-foreground">МИР, СБП, другие карты</p>
                  </div>
                </div>
              </label>
            </div>
            <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-muted/50">
              <RadioGroupItem value="legal" id="legal" />
              <label htmlFor="legal" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  <div>
                    <p className="font-medium">Юридическое лицо</p>
                    <p className="text-xs text-muted-foreground">Оплата по счету</p>
                  </div>
                </div>
              </label>
            </div>
          </RadioGroup>
        </div>

        {/* Форма для юридических лиц */}
        {paymentType === "legal" && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleLegalEntityRequest)} className="space-y-4">
              <FormField
                control={form.control}
                name="organizationName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Название организации</FormLabel>
                    <FormControl>
                      <Input placeholder="ООО «Название»" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="inn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ИНН</FormLabel>
                      <FormControl>
                        <Input placeholder="1234567890" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="kpp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>КПП (если есть)</FormLabel>
                      <FormControl>
                        <Input placeholder="123456789" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="legalAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Юридический адрес</FormLabel>
                    <FormControl>
                      <Textarea placeholder="г. Москва, ул. ..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contactPerson"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Контактное лицо (ФИО)</FormLabel>
                    <FormControl>
                      <Input placeholder="Иванов Иван Иванович" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="email@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Телефон</FormLabel>
                      <FormControl>
                        <Input placeholder="+7 (999) 123-45-67" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Отправка..." : "Запросить счет на оплату"}
              </Button>
            </form>
          </Form>
        )}

        {/* Кнопка оплаты для физ лиц */}
        {paymentType === "individual" && (
          <Button 
            onClick={handleIndividualPayment} 
            className="w-full" 
            size="lg"
            disabled={loading}
          >
            {loading ? "Создание платежа..." : `Оплатить ${amount.toLocaleString()} ₽`}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
