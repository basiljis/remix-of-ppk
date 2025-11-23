import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { FileText } from 'lucide-react';

const formSchema = z.object({
  organizationName: z.string().trim().min(3, 'Минимум 3 символа').max(200, 'Максимум 200 символов'),
  inn: z.string().trim().regex(/^\d{10}$|^\d{12}$/, 'ИНН должен содержать 10 или 12 цифр'),
  contactPerson: z.string().trim().min(2, 'Минимум 2 символа').max(100, 'Максимум 100 символов'),
  email: z.string().trim().email('Некорректный email').max(255, 'Максимум 255 символов'),
  phone: z.string().trim().regex(/^\+?[0-9\s\-()]{10,20}$/, 'Некорректный формат телефона'),
  comment: z.string().trim().max(1000, 'Максимум 1000 символов').optional(),
});

type FormValues = z.infer<typeof formSchema>;

export const CommercialOfferRequestForm = () => {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      organizationName: '',
      inn: '',
      contactPerson: '',
      email: '',
      phone: '',
      comment: '',
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      // Сохраняем запрос в базу данных
      const { error: dbError } = await supabase
        .from('commercial_offer_requests')
        .insert([{
          organization_name: data.organizationName,
          inn: data.inn,
          contact_person: data.contactPerson,
          email: data.email,
          phone: data.phone,
          comment: data.comment || null,
          status: 'pending'
        }]);

      if (dbError) throw dbError;

      // Отправляем email уведомление
      const { error: emailError } = await supabase.functions.invoke('send-commercial-offer-request', {
        body: data
      });

      if (emailError) {
        console.error('Email notification error:', emailError);
      }

      toast({
        title: 'Запрос отправлен',
        description: 'Мы свяжемся с вами в ближайшее время',
      });

      form.reset();
      setOpen(false);
    } catch (error) {
      console.error('Error sending request:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось отправить запрос. Попробуйте позже.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <FileText className="mr-2 h-4 w-4" />
          Запросить коммерческое предложение
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Запрос коммерческого предложения</DialogTitle>
          <DialogDescription>
            Заполните форму, и мы отправим вам коммерческое предложение с условиями подключения для вашей организации
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="organizationName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Название организации *</FormLabel>
                  <FormControl>
                    <Input placeholder="ГБОУ Школа №..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="inn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ИНН *</FormLabel>
                  <FormControl>
                    <Input placeholder="1234567890" {...field} />
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
                  <FormLabel>Контактное лицо *</FormLabel>
                  <FormControl>
                    <Input placeholder="Иванов Иван Иванович" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="school@example.ru" {...field} />
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
                  <FormLabel>Телефон *</FormLabel>
                  <FormControl>
                    <Input placeholder="+7 (999) 123-45-67" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Комментарий</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Укажите желаемое количество пользователей, особые требования или вопросы..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
                Отмена
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Отправка...' : 'Отправить запрос'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
