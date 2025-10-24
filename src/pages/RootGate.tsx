import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

// Lightweight auth gate to avoid loading heavy routes until needed
const RootGate = () => {
  const [checked, setChecked] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setIsAuthed(!!data.user);
      setChecked(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  if (!checked) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return <Navigate to={isAuthed ? "/app" : "/auth"} replace />;
};

export default RootGate;
