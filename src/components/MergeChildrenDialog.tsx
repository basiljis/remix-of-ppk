import { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Search,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Link2,
  User,
  Calendar,
  GraduationCap,
  Phone,
  FileText,
} from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface Child {
  id: string;
  full_name: string;
  birth_date: string | null;
  gender: string | null;
  education_level: string | null;
  parent_name: string | null;
  parent_phone: string | null;
  parent_email: string | null;
  notes: string | null;
  is_active: boolean;
  organization_id: string | null;
  created_at: string;
  _fromProtocol?: boolean;
  protocol_count?: number;
}

interface MergeChildrenDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceChild: Child;
  allChildren: Child[];
  organizationId: string;
}

export function MergeChildrenDialog({
  open,
  onOpenChange,
  sourceChild,
  allChildren,
  organizationId,
}: MergeChildrenDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [mergeDirection, setMergeDirection] = useState<"source_to_target" | "target_to_source">("source_to_target");

  // Filter children for merge candidates (exclude source and protocol-only records)
  const mergeableCandidates = useMemo(() => {
    return allChildren.filter((child) => {
      // Exclude the source child
      if (child.id === sourceChild.id) return false;
      // Exclude protocol-only children (they need to be added to DB first)
      if (child.id.startsWith("protocol-")) return false;
      // Apply search filter
      if (searchQuery) {
        return child.full_name.toLowerCase().includes(searchQuery.toLowerCase());
      }
      return true;
    });
  }, [allChildren, sourceChild.id, searchQuery]);

  const selectedTarget = mergeableCandidates.find((c) => c.id === selectedTargetId);

  // Determine which child will be the primary (kept) and which will be merged (deleted)
  const primaryChild = mergeDirection === "source_to_target" ? selectedTarget : sourceChild;
  const secondaryChild = mergeDirection === "source_to_target" ? sourceChild : selectedTarget;

  const mergeMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTarget || !primaryChild || !secondaryChild) {
        throw new Error("Выберите карточку для объединения");
      }

      // 1. Merge data into primary child (fill in missing fields)
      const mergedData: Partial<Child> = {
        full_name: primaryChild.full_name || secondaryChild.full_name,
        birth_date: primaryChild.birth_date || secondaryChild.birth_date,
        gender: primaryChild.gender || secondaryChild.gender,
        education_level: primaryChild.education_level || secondaryChild.education_level,
        parent_name: primaryChild.parent_name || secondaryChild.parent_name,
        parent_phone: primaryChild.parent_phone || secondaryChild.parent_phone,
        parent_email: primaryChild.parent_email || secondaryChild.parent_email,
        notes: [primaryChild.notes, secondaryChild.notes]
          .filter(Boolean)
          .join("\n---\n") || null,
      };

      // Update primary child with merged data
      const { error: updateError } = await supabase
        .from("children")
        .update(mergedData)
        .eq("id", primaryChild.id);

      if (updateError) throw updateError;

      // 2. Update protocols to point to primary child's name
      const { error: protocolError } = await supabase
        .from("protocols")
        .update({ child_name: primaryChild.full_name })
        .eq("organization_id", organizationId)
        .eq("child_name", secondaryChild.full_name);

      if (protocolError) {
        console.error("Error updating protocols:", protocolError);
        // Don't throw - child merge was successful
      }

      // 3. Update sessions to point to primary child
      const { error: sessionsError } = await supabase
        .from("sessions")
        .update({ child_id: primaryChild.id })
        .eq("child_id", secondaryChild.id);

      if (sessionsError) {
        console.error("Error updating sessions:", sessionsError);
      }

      // 4. Delete secondary child record
      const { error: deleteError } = await supabase
        .from("children")
        .delete()
        .eq("id", secondaryChild.id);

      if (deleteError) throw deleteError;

      return { primaryChild, secondaryChild };
    },
    onSuccess: ({ primaryChild, secondaryChild }) => {
      queryClient.invalidateQueries({ queryKey: ["children"] });
      queryClient.invalidateQueries({ queryKey: ["children-from-protocols"] });
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      onOpenChange(false);
      toast({
        title: "Карточки объединены",
        description: `«${secondaryChild.full_name}» объединена с «${primaryChild.full_name}»`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка объединения",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleMerge = () => {
    if (!selectedTargetId) {
      toast({
        title: "Выберите карточку",
        description: "Укажите карточку для объединения",
        variant: "destructive",
      });
      return;
    }
    mergeMutation.mutate();
  };

  const renderChildInfo = (child: Child | undefined, label: string) => {
    if (!child) return null;
    return (
      <div className="p-3 border rounded-lg space-y-2">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm">{child.full_name}</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          {child.birth_date && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {format(new Date(child.birth_date), "dd.MM.yyyy")}
            </div>
          )}
          {child.education_level && (
            <div className="flex items-center gap-1">
              <GraduationCap className="h-3 w-3" />
              {child.education_level}
            </div>
          )}
          {child.parent_phone && (
            <div className="flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {child.parent_phone}
            </div>
          )}
          {child.protocol_count && child.protocol_count > 0 && (
            <div className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              {child.protocol_count} протокол(ов)
            </div>
          )}
        </div>
        <Badge variant="outline" className="text-xs">
          {label}
        </Badge>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Объединение карточек ребёнка
          </DialogTitle>
          <DialogDescription>
            Объедините дублирующиеся карточки. Данные будут объединены, протоколы перенесены на основную карточку.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden space-y-4">
          {/* Source child info */}
          <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <p className="text-xs text-muted-foreground mb-2">Исходная карточка:</p>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              <span className="font-medium">{sourceChild.full_name}</span>
              {sourceChild._fromProtocol && (
                <Badge variant="secondary" className="text-xs">Только в протоколах</Badge>
              )}
            </div>
          </div>

          {/* Search for target child */}
          <div className="space-y-2">
            <Label>Найти карточку для объединения</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Поиск по ФИО..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* List of mergeable children */}
          <ScrollArea className="h-[200px] border rounded-lg p-2">
            {mergeableCandidates.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                {searchQuery ? "Карточки не найдены" : "Нет доступных карточек для объединения"}
              </div>
            ) : (
              <div className="space-y-2">
                {mergeableCandidates.map((child) => (
                  <div
                    key={child.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedTargetId === child.id
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted/50"
                    }`}
                    onClick={() => setSelectedTargetId(child.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            selectedTargetId === child.id
                              ? "border-primary bg-primary"
                              : "border-muted-foreground"
                          }`}
                        >
                          {selectedTargetId === child.id && (
                            <CheckCircle2 className="h-3 w-3 text-primary-foreground" />
                          )}
                        </div>
                        <span className="font-medium text-sm">{child.full_name}</span>
                      </div>
                      {child.protocol_count && child.protocol_count > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {child.protocol_count} ППк
                        </Badge>
                      )}
                    </div>
                    <div className="ml-6 mt-1 text-xs text-muted-foreground">
                      {child.birth_date && format(new Date(child.birth_date), "dd.MM.yyyy", { locale: ru })}
                      {child.birth_date && child.education_level && " • "}
                      {child.education_level}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Merge direction */}
          {selectedTarget && (
            <>
              <Separator />
              <div className="space-y-3">
                <Label>Направление объединения</Label>
                <RadioGroup
                  value={mergeDirection}
                  onValueChange={(v) => setMergeDirection(v as typeof mergeDirection)}
                  className="space-y-2"
                >
                  <div className="flex items-center space-x-2 p-2 border rounded-lg">
                    <RadioGroupItem value="source_to_target" id="source_to_target" />
                    <Label htmlFor="source_to_target" className="flex-1 cursor-pointer text-sm">
                      Объединить в «{selectedTarget.full_name}» (удалить «{sourceChild.full_name}»)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-2 border rounded-lg">
                    <RadioGroupItem value="target_to_source" id="target_to_source" />
                    <Label htmlFor="target_to_source" className="flex-1 cursor-pointer text-sm">
                      Объединить в «{sourceChild.full_name}» (удалить «{selectedTarget.full_name}»)
                    </Label>
                  </div>
                </RadioGroup>

                {/* Preview */}
                <div className="p-3 bg-warning/10 border border-warning/30 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium">После объединения:</p>
                      <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                        <li>• Карточка «{secondaryChild?.full_name}» будет удалена</li>
                        <li>• Все протоколы будут перенесены на «{primaryChild?.full_name}»</li>
                        <li>• Занятия будут привязаны к основной карточке</li>
                        <li>• Данные будут объединены (приоритет у основной карточки)</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Result preview */}
                <div className="grid grid-cols-3 gap-2 items-center">
                  {renderChildInfo(secondaryChild, "Будет удалена")}
                  <div className="flex justify-center">
                    <ArrowRight className="h-6 w-6 text-muted-foreground" />
                  </div>
                  {renderChildInfo(primaryChild, "Основная")}
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button
            onClick={handleMerge}
            disabled={!selectedTargetId || mergeMutation.isPending}
            variant="default"
          >
            {mergeMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Объединить карточки
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
