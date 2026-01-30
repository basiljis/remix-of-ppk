import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Link2, User, Calendar, Search, CheckCircle2 } from "lucide-react";
import { format, differenceInYears, differenceInMonths } from "date-fns";
import { ru } from "date-fns/locale";
import { Badge } from "./ui/badge";

interface LinkParentChildDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ParentChild {
  id: string;
  child_unique_id: string;
  full_name: string;
  gender: string | null;
  birth_date: string | null;
  education_level: string | null;
  parent_user_id: string;
  parent_profiles?: {
    full_name: string;
    phone: string;
    email: string;
  } | null;
}

const educationLevelLabels: Record<string, string> = {
  DO: "ДО",
  NOO: "НОО",
  OOO: "ООО",
  SOO: "СОО",
};

export function LinkParentChildDialog({ open, onOpenChange }: LinkParentChildDialogProps) {
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchCode, setSearchCode] = useState("");
  const [foundChild, setFoundChild] = useState<ParentChild | null>(null);
  const [searching, setSearching] = useState(false);
  const [notes, setNotes] = useState("");

  const organizationId = profile?.organization_id;

  // Check if child is already linked
  const { data: existingLink } = useQuery({
    queryKey: ["linked-child-check", foundChild?.id, organizationId],
    queryFn: async () => {
      if (!foundChild || !organizationId) return null;
      const { data } = await supabase
        .from("linked_parent_children" as any)
        .select("id")
        .eq("parent_child_id", foundChild.id)
        .eq("organization_id", organizationId)
        .maybeSingle();
      return data;
    },
    enabled: !!foundChild && !!organizationId,
  });

  const searchMutation = useMutation({
    mutationFn: async (code: string) => {
      const normalizedCode = code.trim().toUpperCase();
      
      // First find the child
      const { data: childData, error: childError } = await supabase
        .from("parent_children" as any)
        .select("*")
        .eq("child_unique_id", normalizedCode)
        .maybeSingle();

      if (childError) throw childError;
      if (!childData) return null;

      // Then fetch parent profile separately
      const { data: parentData } = await supabase
        .from("parent_profiles" as any)
        .select("full_name, phone, email")
        .eq("id", (childData as any).parent_user_id)
        .maybeSingle();

      return {
        ...(childData as any),
        parent_profiles: parentData || null,
      } as ParentChild;
    },
    onSuccess: (data) => {
      setFoundChild(data);
      if (!data) {
        toast({
          title: "Ребёнок не найден",
          description: "Проверьте правильность введённого кода",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка поиска",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const linkMutation = useMutation({
    mutationFn: async () => {
      if (!foundChild || !organizationId) throw new Error("Данные не найдены");

      const { error } = await supabase.from("linked_parent_children" as any).insert({
        parent_child_id: foundChild.id,
        organization_id: organizationId,
        linked_by: user?.id,
        notes: notes.trim() || null,
      } as any);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["linked-parent-children"] });
      toast({
        title: "Ребёнок привязан",
        description: `${foundChild?.full_name} успешно добавлен в вашу организацию`,
      });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSearch = () => {
    if (!searchCode.trim()) {
      toast({
        title: "Введите код",
        description: "Укажите уникальный идентификатор ребёнка",
        variant: "destructive",
      });
      return;
    }
    setSearching(true);
    searchMutation.mutate(searchCode, {
      onSettled: () => setSearching(false),
    });
  };

  const handleClose = () => {
    setSearchCode("");
    setFoundChild(null);
    setNotes("");
    onOpenChange(false);
  };

  const calculateAge = (birthDate: string) => {
    const birth = new Date(birthDate);
    const years = differenceInYears(new Date(), birth);
    const months = differenceInMonths(new Date(), birth) % 12;
    
    if (years === 0) return `${months} мес.`;
    return months > 0 ? `${years} л. ${months} м.` : `${years} л.`;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Добавить ребёнка по коду
          </DialogTitle>
          <DialogDescription>
            Введите уникальный код ребёнка, который родитель получил при регистрации
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="child-code" className="sr-only">Код ребёнка</Label>
              <Input
                id="child-code"
                placeholder="PC-2024-000001"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                className="font-mono"
              />
            </div>
            <Button 
              onClick={handleSearch} 
              disabled={searching || !searchCode.trim()}
            >
              {searching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>

          {foundChild && (
            <div className="space-y-4">
              <Alert className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  <div className="space-y-2">
                    <div className="font-medium text-green-800 dark:text-green-200">
                      {foundChild.full_name}
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {foundChild.gender && (
                        <Badge variant="secondary">
                          {foundChild.gender === "male" ? "М" : "Ж"}
                        </Badge>
                      )}
                      {foundChild.birth_date && (
                        <Badge variant="outline">
                          {calculateAge(foundChild.birth_date)}
                        </Badge>
                      )}
                      {foundChild.education_level && (
                        <Badge variant="outline">
                          {educationLevelLabels[foundChild.education_level] || foundChild.education_level}
                        </Badge>
                      )}
                    </div>
                    {foundChild.parent_profiles && (
                      <div className="text-xs text-muted-foreground mt-2">
                        <p>Родитель: {(foundChild.parent_profiles as any).full_name}</p>
                        <p>Тел: {(foundChild.parent_profiles as any).phone}</p>
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>

              {existingLink ? (
                <Alert variant="destructive">
                  <AlertDescription>
                    Этот ребёнок уже привязан к вашей организации
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="link-notes">Примечания (необязательно)</Label>
                  <Textarea
                    id="link-notes"
                    placeholder="Дополнительная информация..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Отмена
          </Button>
          <Button 
            onClick={() => linkMutation.mutate()}
            disabled={!foundChild || !!existingLink || linkMutation.isPending}
          >
            {linkMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Привязать
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
