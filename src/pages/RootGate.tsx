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
    
    supabase.auth.getUser().then(({ data, error }) => {
      if (!mounted) return;
      
      if (error) {
        console.error("[RootGate] Ошибка при получении пользователя:", error);
      }
      
      const isAuthenticated = !!data.user;
      console.log("[RootGate] Пользователь", isAuthenticated ? "авторизован" : "не авторизован");
      
      setIsAuthed(isAuthenticated);
      setChecked(true);
    }).catch(error => {
      console.error("[RootGate] Критическая ошибка при проверке авторизации:", error);
      if (mounted) {
        setIsAuthed(false);
        setChecked(true);
      }
    });
    
    return () => {
      mounted = false;
    };
  }, []);

  if (!checked) {
    console.log("[RootGate] Показываем прелоадер...");
    return <Preloader />;
  }

  const redirectPath = isAuthed ? "/app" : "/auth";
  console.log("[RootGate] Редирект на:", redirectPath);
  return <Navigate to={redirectPath} replace />;
};

export default RootGate;
