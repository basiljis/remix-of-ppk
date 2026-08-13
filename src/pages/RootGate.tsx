import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Preloader from "@/components/Preloader";

// Lightweight auth gate. Uses getSession() (reads from localStorage, no network)
// instead of getUser() to avoid blocking on Supabase requests when the API is slow
// or unreachable. Falls back to landing after a short timeout in any case.
const RootGate = () => {
  const [checked, setChecked] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const [progress, setProgress] = useState(10);
  const [stage, setStage] = useState("Инициализация...");

  useEffect(() => {
    let mounted = true;

    // Fast initial bump
    const startTimeout = setTimeout(() => {
      if (mounted) {
        setProgress(30);
        setStage("Проверка сессии...");
      }
    }, 300);

    // Hard cap: never keep the preloader longer than 2.5s.
    const maxTimeout = setTimeout(() => {
      if (mounted) {
        setIsAuthed(false);
        setChecked(true);
      }
    }, 2500);

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!mounted) return;
        setStage("Загрузка данных...");
        setProgress(80);
        
        // Brief delay for visual feedback of success
        setTimeout(() => {
          if (!mounted) return;
          clearTimeout(maxTimeout);
          setIsAuthed(!!data?.session?.user);
          setProgress(100);
          setTimeout(() => setChecked(true), 200);
        }, 400);
      })
      .catch(() => {
        if (!mounted) return;
        clearTimeout(maxTimeout);
        setIsAuthed(false);
        setChecked(true);
      });

    return () => {
      mounted = false;
      clearTimeout(startTimeout);
      clearTimeout(maxTimeout);
    };
  }, []);

  if (!checked) return <Preloader progress={progress} stage={stage} />;

  if (isAuthed) return <Navigate to="/app" replace />;
  return <Navigate to="/home" replace />;
};

export default RootGate;

