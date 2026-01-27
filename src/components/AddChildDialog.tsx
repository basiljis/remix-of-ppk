import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const educationLevels = [
  { value: "do", label: "Дошкольное образование" },
  { value: "noo", label: "Начальное общее образование" },
  { value: "oo", label: "Основное общее образование" },
  { value: "soo", label: "Среднее общее образование" },
];

const genderOptions = [
  { value: "male", label: "Мужской" },
  { value: "female", label: "Женский" },
];

interface AddChildDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AddChildDialog({ open, onOpenChange, onSuccess }: AddChildDialogProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    full_name: "",
    birth_date: "",
    gender: "",
    education_level: "",
    parent_name: "",
    parent_phone: "",
    parent_email: "",
    notes: "",
    is_active: true,
  });

  const organizationId = profile?.organization_id;

  const resetForm = () => {
    setFormData({
      full_name: "",
      birth_date: "",
      gender: "",
      education_level: "",
      parent_name: "",
      parent_phone: "",
      parent_email: "",
      notes: "",
      is_active: true,
    });
  };

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("children").insert({
        full_name: data.full_name,
        birth_date: data.birth_date || null,
        gender: data.gender || null,
        education_level: data.education_level || null,
        parent_name: data.parent_name || null,
        parent_phone: data.parent_phone || null,
        parent_email: data.parent_email || null,
        notes: data.notes || null,
        is_active: data.is_active,
        organization_id: organizationId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["children"] });
      queryClient.invalidateQueries({ queryKey: ["children-from-protocols"] });
      queryClient.invalidateQueries({ queryKey: ["child-card-children"] });
      queryClient.invalidateQueries({ queryKey: ["child-card-protocol-children"] });
      onOpenChange(false);
      resetForm();
      toast({
        title: "Успешно",
        description: "Ребёнок добавлен в базу данных",
      });
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!formData.full_name.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите ФИО ребёнка",
        variant: "destructive",
      });
      return;
    }
    saveMutation.mutate(formData);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Добавить ребёнка</DialogTitle>
          <DialogDescription>
            Заполните информацию о ребёнке для добавления в базу данных
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="full_name">ФИО ребёнка *</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) =>
                setFormData({ ...formData, full_name: e.target.value })
              }
              placeholder="Иванов Иван Иванович"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="birth_date">Дата рождения</Label>
              <Input
                id="birth_date"
                type="date"
                value={formData.birth_date}
                onChange={(e) =>
                  setFormData({ ...formData, birth_date: e.target.value })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="gender">Пол</Label>
              <Select
                value={formData.gender}
                onValueChange={(value) =>
                  setFormData({ ...formData, gender: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите пол" />
                </SelectTrigger>
                <SelectContent>
                  {genderOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="education_level">Уровень образования</Label>
            <Select
              value={formData.education_level}
              onValueChange={(value) =>
                setFormData({ ...formData, education_level: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите уровень образования" />
              </SelectTrigger>
              <SelectContent>
                {educationLevels.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="border-t pt-4 mt-2">
            <h4 className="font-medium mb-3">Информация о родителе / представителе</h4>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="parent_name">ФИО родителя / представителя</Label>
                <Input
                  id="parent_name"
                  value={formData.parent_name}
                  onChange={(e) =>
                    setFormData({ ...formData, parent_name: e.target.value })
                  }
                  placeholder="Иванова Мария Петровна"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="parent_phone">Телефон</Label>
                  <Input
                    id="parent_phone"
                    value={formData.parent_phone}
                    onChange={(e) =>
                      setFormData({ ...formData, parent_phone: e.target.value })
                    }
                    placeholder="+7 (999) 123-45-67"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="parent_email">Email</Label>
                  <Input
                    id="parent_email"
                    type="email"
                    value={formData.parent_email}
                    onChange={(e) =>
                      setFormData({ ...formData, parent_email: e.target.value })
                    }
                    placeholder="email@example.com"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Примечания</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Дополнительная информация о ребёнке..."
              rows={3}
            />
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, is_active: checked })
              }
            />
            <Label htmlFor="is_active">Активен</Label>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
          >
            Отмена
          </Button>
          <Button
            onClick={handleSave}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Добавить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
