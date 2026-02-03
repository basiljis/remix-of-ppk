import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Link2, CheckCircle2, AlertCircle, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface LinkChildByCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // For parent: link specialist's child to parent's account
  // For specialist: link parent's child to organization
  mode: "parent" | "specialist";
  organizationId?: string;
}

interface FoundChild {
  id: string;
  full_name: string;
  birth_date: string | null;
  gender: string | null;
  education_level: string | null;
  child_unique_id: string;
}

export function LinkChildByCodeDialog({ 
  open, 
  onOpenChange,
  mode,
  organizationId,
}: LinkChildByCodeDialogProps) {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [childCode, setChildCode] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [foundChild, setFoundChild] = useState<FoundChild | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"search" | "verify">("search");

  const resetState = () => {
    setChildCode("");
    setVerificationCode("");
    setFoundChild(null);
    setError(null);
    setStep("search");
    setIsSearching(false);
  };

  const handleSearch = async () => {
    if (!childCode.trim()) return;
    
    setIsSearching(true);
    setError(null);
    setFoundChild(null);
    
    try {
      const normalizedCode = childCode.trim().toUpperCase();
      
      if (mode === "parent") {
        // Parent searching for specialist's child (SC-YYYY-XXXXXX)
        const { data, error: searchError } = await supabase
          .from("children")
          .select("id, full_name, birth_date, gender, education_level, child_unique_id")
          .eq("child_unique_id", normalizedCode)
          .maybeSingle();
        
        if (searchError) throw searchError;
        
        if (!data) {
          setError("Ребёнок с таким кодом не найден. Проверьте правильность кода.");
          return;
        }
        
        setFoundChild(data as FoundChild);
        setStep("verify");
      } else {
        // Specialist searching for parent's child (PC-YYYY-XXXXXX)
        const { data, error: searchError } = await supabase
          .from("parent_children")
          .select("id, full_name, birth_date, gender, education_level, child_unique_id")
          .eq("child_unique_id", normalizedCode)
          .maybeSingle();
        
        if (searchError) throw searchError;
        
        if (!data) {
          setError("Ребёнок с таким кодом не найден. Проверьте правильность кода.");
          return;
        }
        
        setFoundChild(data as FoundChild);
        setStep("verify");
      }
    } catch (err: any) {
      setError(err.message || "Ошибка поиска");
    } finally {
      setIsSearching(false);
    }
  };

  const linkMutation = useMutation({
    mutationFn: async () => {
      if (!foundChild || !verificationCode.trim()) {
        throw new Error("Не все данные заполнены");
      }
      
      const normalizedVerification = verificationCode.trim().toUpperCase();
      
      if (mode === "parent") {
        // Verify the code first
        const { data: child, error: verifyError } = await supabase
          .from("children")
          .select("id, verification_code, linked_parent_child_id")
          .eq("id", foundChild.id)
          .single();
        
        if (verifyError) throw verifyError;
        
        if (child.verification_code !== normalizedVerification) {
          throw new Error("Неверный код подтверждения");
        }
        
        if (child.linked_parent_child_id) {
          throw new Error("Этот ребёнок уже связан с другим аккаунтом");
        }
        
        // Create a new parent_child record linked to the specialist's child
        const { data: newParentChild, error: createError } = await (supabase
          .from("parent_children") as any)
          .insert({
            parent_user_id: user?.id,
            full_name: foundChild.full_name,
            birth_date: foundChild.birth_date,
            gender: foundChild.gender,
            education_level: foundChild.education_level,
            notes: `Связан с карточкой специалиста: ${foundChild.child_unique_id}`,
          })
          .select("id")
          .single();
        
        if (createError) throw createError;
        
        // Update the specialist's child to link back
        const { error: linkError } = await supabase
          .from("children")
          .update({ linked_parent_child_id: newParentChild.id })
          .eq("id", foundChild.id);
        
        if (linkError) throw linkError;
        
      } else {
        // Specialist linking parent's child
        const { data: parentChild, error: verifyError } = await supabase
          .from("parent_children")
          .select("id, verification_code")
          .eq("id", foundChild.id)
          .single();
        
        if (verifyError) throw verifyError;
        
        if (parentChild.verification_code !== normalizedVerification) {
          throw new Error("Неверный код подтверждения");
        }
        
        // Check if already linked
        const { data: existingLink } = await supabase
          .from("linked_parent_children")
          .select("id")
          .eq("parent_child_id", foundChild.id)
          .eq("organization_id", organizationId)
          .maybeSingle();
        
        if (existingLink) {
          throw new Error("Этот ребёнок уже связан с вашей организацией");
        }
        
        // Create link
        const { error: linkError } = await supabase
          .from("linked_parent_children")
          .insert({
            parent_child_id: foundChild.id,
            organization_id: organizationId,
            linked_by: profile?.id,
          });
        
        if (linkError) throw linkError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parent-children"] });
      queryClient.invalidateQueries({ queryKey: ["children"] });
      queryClient.invalidateQueries({ queryKey: ["linked-parent-children"] });
      toast({
        title: "Ребёнок успешно связан",
        description: mode === "parent" 
          ? "Карточка ребёнка от специалиста добавлена в ваш аккаунт"
          : "Карточка ребёнка из родительского портала связана с организацией",
      });
      onOpenChange(false);
      resetState();
    },
    onError: (error: any) => {
      setError(error.message || "Ошибка при связывании");
    },
  });

  const formatAge = (birthDate: string | null) => {
    if (!birthDate) return "—";
    const birth = new Date(birthDate);
    const now = new Date();
    const years = Math.floor((now.getTime() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    return `${years} лет`;
  };

  const getGenderLabel = (gender: string | null) => {
    if (gender === "male") return "Мальчик";
    if (gender === "female") return "Девочка";
    return "—";
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) resetState();
    }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            {mode === "parent" 
              ? "Привязать ребёнка от специалиста"
              : "Привязать ребёнка из портала родителей"
            }
          </DialogTitle>
          <DialogDescription>
            {mode === "parent"
              ? "Введите код ребёнка, который вам выдал специалист (начинается с SC-)"
              : "Введите код ребёнка, который вам выдал родитель (начинается с PC-)"
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {step === "search" && (
            <>
              <div className="space-y-2">
                <Label>Код ребёнка</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder={mode === "parent" ? "SC-2026-000001" : "PC-2026-000001"}
                    value={childCode}
                    onChange={(e) => setChildCode(e.target.value.toUpperCase())}
                    className="font-mono"
                  />
                  <Button 
                    onClick={handleSearch}
                    disabled={!childCode.trim() || isSearching}
                  >
                    {isSearching ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Найти"
                    )}
                  </Button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {error}
                </div>
              )}
            </>
          )}

          {step === "verify" && foundChild && (
            <>
              <Card className="bg-muted/50">
                <CardContent className="pt-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="font-medium">Ребёнок найден</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">ФИО:</span>
                      <p className="font-medium">{foundChild.full_name}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Возраст:</span>
                      <p className="font-medium">{formatAge(foundChild.birth_date)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Пол:</span>
                      <p className="font-medium">{getGenderLabel(foundChild.gender)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Код:</span>
                      <p className="font-mono text-xs">{foundChild.child_unique_id}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-amber-600" />
                  Код подтверждения
                </Label>
                <Input
                  placeholder="XXXXXX"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="font-mono text-center text-lg tracking-widest"
                />
                <p className="text-xs text-muted-foreground">
                  {mode === "parent"
                    ? "Запросите код подтверждения у специалиста"
                    : "Запросите код подтверждения у родителя"
                  }
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setStep("search");
                    setVerificationCode("");
                    setError(null);
                  }}
                >
                  Назад
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => linkMutation.mutate()}
                  disabled={verificationCode.length !== 6 || linkMutation.isPending}
                >
                  {linkMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Link2 className="h-4 w-4 mr-2" />
                  )}
                  Связать
                </Button>
              </div>
            </>
          )}
        </div>

        {step === "search" && (
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}