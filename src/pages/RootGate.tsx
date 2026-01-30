import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Preloader from "@/components/Preloader";

// Lightweight auth gate to avoid loading heavy routes until needed
const RootGate = () => {
  const [checked, setChecked] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    console.log("[RootGate] Проверка авторизации...");
    let mounted = true;
    
    // Таймаут на случай если getUser зависнет
    const timeout = setTimeout(() => {
      if (mounted && !checked) {
        console.warn("[RootGate] Таймаут проверки авторизации, редирект на auth");
        setIsAuthed(false);
        setChecked(true);
      }
    }, 5000);
    
    supabase.auth.getUser().then(({ data, error }) => {
      if (!mounted) return;
      clearTimeout(timeout);
      
      if (error) {
        // AuthSessionMissingError is expected for unauthenticated users - don't log as error
        if (error.name === 'AuthSessionMissingError') {
          console.log("[RootGate] Сессия отсутствует - пользователь не авторизован");
        } else {
          console.warn("[RootGate] Ошибка при получении пользователя:", error);
        }
      }
      
      const isAuthenticated = !!data?.user;
      console.log("[RootGate] Пользователь", isAuthenticated ? "авторизован" : "не авторизован");
      
      setIsAuthed(isAuthenticated);
      setChecked(true);
    }).catch(error => {
      console.error("[RootGate] Критическая ошибка при проверке авторизации:", error);
      clearTimeout(timeout);
      if (mounted) {
        setIsAuthed(false);
        setChecked(true);
      }
    });
    
    return () => {
      mounted = false;
      clearTimeout(timeout);
    };
  }, []);

  if (!checked) {
    console.log("[RootGate] Показываем прелоадер...");
    return <Preloader />;
  }

  // If authenticated, go to app; otherwise show landing page
  if (isAuthed) {
    console.log("[RootGate] Редирект на /app");
    return <Navigate to="/app" replace />;
  }
  
  console.log("[RootGate] Редирект на лендинг");
  return <Navigate to="/landing" replace />;
};

export default RootGate;
