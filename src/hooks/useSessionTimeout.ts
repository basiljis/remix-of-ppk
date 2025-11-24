import { useEffect, useRef } from 'react';
import { useToast } from './use-toast';
import { supabase } from '@/integrations/supabase/client';

const TIMEOUT_DURATION = 15 * 60 * 1000; // 15 минут в миллисекундах

export const useSessionTimeout = () => {
  const { toast } = useToast();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningShownRef = useRef(false);

  const resetTimer = () => {
    // Очистка предыдущего таймера
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    warningShownRef.current = false;

    // Установка нового таймера
    timeoutRef.current = setTimeout(async () => {
      // Показать предупреждение за 1 минуту до выхода
      if (!warningShownRef.current) {
        warningShownRef.current = true;
        toast({
          title: "Сессия скоро завершится",
          description: "Через 1 минуту вы будете автоматически выведены из системы. Несохраненные черновики будут сохранены.",
          duration: 60000,
        });

        // Установить таймер на оставшуюся минуту
        timeoutRef.current = setTimeout(async () => {
          toast({
            title: "Сессия завершена",
            description: "Вы были автоматически выведены из системы по истечении времени сессии.",
            variant: "destructive",
          });

          // Автосохранение черновиков выполняется в ProtocolForm через localStorage
          // Выход из системы
          await supabase.auth.signOut();
          
          // Перезагрузка страницы для очистки состояния
          window.location.href = '/';
        }, 60000); // Еще 1 минута
      }
    }, TIMEOUT_DURATION - 60000); // 14 минут
  };

  useEffect(() => {
    // События активности пользователя
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    
    const handleUserActivity = () => {
      resetTimer();
    };

    // Добавление слушателей событий
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity);
    });

    // Начальная установка таймера
    resetTimer();

    // Очистка при размонтировании
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity);
      });
    };
  }, []);

  return { resetTimer };
};
