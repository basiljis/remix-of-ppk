import { useState, useEffect } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, Link2, CheckCircle2, XCircle } from "lucide-react";
import { differenceInYears, differenceInMonths } from "date-fns";

const educationLevels = [
  { value: "preschool", label: "Дошкольное образование" },
  { value: "elementary", label: "Начальное общее образование (1-4)" },
  { value: "middle", label: "Основное общее образование (5-9)" },
  { value: "high", label: "Среднее общее образование (10-11)" },
];

// Динамические опции для класса в зависимости от уровня образования
const getClassOptions = (educationLevel: string) => {
  switch (educationLevel) {
    case "preschool":
      return [
        { value: "Младшая группа", label: "Младшая группа" },
        { value: "Средняя группа", label: "Средняя группа" },
        { value: "Старшая группа", label: "Старшая группа" },
        { value: "Подготовительная группа", label: "Подготовительная группа" },
      ];
    case "elementary":
      return [1, 2, 3, 4].map((n) => ({ value: n.toString(), label: `${n} класс` }));
    case "middle":
      return [5, 6, 7, 8, 9].map((n) => ({ value: n.toString(), label: `${n} класс` }));
    case "high":
      return [10, 11].map((n) => ({ value: n.toString(), label: `${n} класс` }));
    default:
      return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((n) => ({ value: n.toString(), label: `${n} класс` }));
  }
};

const classLetterOptions = ["А", "Б", "В", "Г", "Д", "Е", "Ж", "З", "И", "К", "Л", "М"];

const genderOptions = [
  { value: "male", label: "Мужской" },
  { value: "female", label: "Женский" },
];

const whobroughtOptions = [
  { value: "mother", label: "Мать" },
  { value: "father", label: "Отец" },
  { value: "grandmother", label: "Бабушка" },
  { value: "grandfather", label: "Дедушка" },
  { value: "guardian", label: "Опекун" },
  { value: "other", label: "Другое" },
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
  
  // State for child code lookup
  const [childCode, setChildCode] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [linkedParentChild, setLinkedParentChild] = useState<{
    id: string;
    full_name: string;
    child_unique_id: string;
  } | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    full_name: "",
    birth_date: "",
    age: "",
    gender: "",
    class_number: "",
    class_letter: "",
    education_level: "",
    address: "",
    registration_address: "",
    same_as_address: false,
    parent_name: "",
    parent_phone: "",
    parent_email: "",
    whobrought: "",
    relationship: "",
    notes: "",
    is_active: true,
  });

  const organizationId = profile?.organization_id;

  // Calculate age automatically when birth date changes
  useEffect(() => {
    if (formData.birth_date) {
      const birthDate = new Date(formData.birth_date);
      const years = differenceInYears(new Date(), birthDate);
      const months = differenceInMonths(new Date(), birthDate) % 12;
      const ageString = months > 0 ? `${years} лет ${months} мес.` : `${years} лет`;
      setFormData(prev => ({ ...prev, age: ageString }));
    }
  }, [formData.birth_date]);

  // Sync registration address when same_as_address is checked
  useEffect(() => {
    if (formData.same_as_address) {
      setFormData(prev => ({ ...prev, registration_address: prev.address }));
    }
  }, [formData.same_as_address, formData.address]);

  const resetForm = () => {
    setFormData({
      full_name: "",
      birth_date: "",
      age: "",
      gender: "",
      class_number: "",
      class_letter: "",
      education_level: "",
      address: "",
      registration_address: "",
      same_as_address: false,
      parent_name: "",
      parent_phone: "",
      parent_email: "",
      whobrought: "",
      relationship: "",
      notes: "",
      is_active: true,
    });
    setChildCode("");
    setLinkedParentChild(null);
    setSearchError(null);
  };

  // Search for child by unique code
  const handleSearchByCode = async () => {
    if (!childCode.trim()) {
      setSearchError("Введите код ребёнка");
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      // Search in parent_children table by child_unique_id
      const { data: parentChild, error } = await supabase
        .from("parent_children")
        .select(`
          id,
          full_name,
          child_unique_id,
          birth_date,
          gender,
          education_level,
          class_or_group,
          school_name,
          notes
        `)
        .eq("child_unique_id", childCode.trim().toUpperCase())
        .maybeSingle();

      if (error) throw error;

      if (!parentChild) {
        setSearchError("Ребёнок с таким кодом не найден");
        setLinkedParentChild(null);
        return;
      }

      // Check if already linked to this organization
      const { data: existingLink } = await supabase
        .from("linked_parent_children")
        .select("id")
        .eq("parent_child_id", parentChild.id)
        .eq("organization_id", organizationId)
        .maybeSingle();

      if (existingLink) {
        setSearchError("Этот ребёнок уже привязан к вашей организации");
        setLinkedParentChild(null);
        return;
      }

      // Set linked parent child info
      setLinkedParentChild({
        id: parentChild.id,
        full_name: parentChild.full_name,
        child_unique_id: parentChild.child_unique_id,
      });

      // Pre-fill form data from parent's child record
      setFormData(prev => ({
        ...prev,
        full_name: parentChild.full_name || prev.full_name,
        birth_date: parentChild.birth_date || prev.birth_date,
        gender: parentChild.gender || prev.gender,
        education_level: parentChild.education_level || prev.education_level,
        class_number: parentChild.class_or_group || prev.class_number,
        notes: parentChild.notes 
          ? `${parentChild.notes}${prev.notes ? '\n' + prev.notes : ''}`
          : prev.notes,
      }));

      toast({
        title: "Ребёнок найден",
        description: `Данные ${parentChild.full_name} загружены из родительского кабинета`,
      });
    } catch (error: any) {
      console.error("Error searching for child:", error);
      setSearchError("Ошибка при поиске: " + error.message);
    } finally {
      setIsSearching(false);
    }
  };

  // Clear linked child
  const handleClearLinkedChild = () => {
    setLinkedParentChild(null);
    setChildCode("");
    setSearchError(null);
  };

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // Build notes with additional data
      const notesArray = [];
      if (data.class_number || data.class_letter) {
        notesArray.push(`Класс: ${data.class_number || ""}${data.class_letter || ""}`);
      }
      if (data.address) {
        notesArray.push(`Адрес проживания: ${data.address}`);
      }
      if (data.registration_address && data.registration_address !== data.address) {
        notesArray.push(`Адрес регистрации: ${data.registration_address}`);
      }
      if (data.whobrought) {
        const whobroughtLabel = whobroughtOptions.find(o => o.value === data.whobrought)?.label || data.whobrought;
        notesArray.push(`Кто привёл: ${whobroughtLabel}`);
      }
      if (data.relationship) {
        notesArray.push(`Отношение к ребёнку: ${data.relationship}`);
      }
      if (data.notes) {
        notesArray.push(data.notes);
      }

      // Insert into children table
      const { data: newChild, error } = await supabase.from("children").insert({
        full_name: data.full_name,
        birth_date: data.birth_date || null,
        gender: data.gender || null,
        education_level: data.education_level || null,
        parent_name: data.parent_name || null,
        parent_phone: data.parent_phone || null,
        parent_email: data.parent_email || null,
        notes: notesArray.length > 0 ? notesArray.join("\n") : null,
        is_active: data.is_active,
        organization_id: organizationId,
      }).select("id").single();
      
      if (error) throw error;

      // If linked to parent child, create the link
      if (linkedParentChild && organizationId) {
        const { error: linkError } = await supabase.from("linked_parent_children").insert({
          parent_child_id: linkedParentChild.id,
          organization_id: organizationId,
          linked_by: profile?.id,
          notes: `Привязан при создании карточки ребёнка`,
        });
        
        if (linkError) {
          console.error("Error creating link:", linkError);
          // Don't throw - child was created successfully
        }
      }

      return newChild;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["children"] });
      queryClient.invalidateQueries({ queryKey: ["children-from-protocols"] });
      queryClient.invalidateQueries({ queryKey: ["child-card-children"] });
      queryClient.invalidateQueries({ queryKey: ["child-card-protocol-children"] });
      queryClient.invalidateQueries({ queryKey: ["linked-parent-children"] });
      onOpenChange(false);
      resetForm();
      toast({
        title: "Успешно",
        description: linkedParentChild 
          ? "Ребёнок добавлен и связан с родительским кабинетом"
          : "Ребёнок добавлен в базу данных",
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
            Заполните данные об обучающемся для добавления в базу данных
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Синхронизация с родительским кабинетом */}
          <div className="space-y-3 p-4 bg-secondary/30 rounded-lg border border-primary/20">
            <div className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-primary" />
              <h4 className="font-medium text-sm">Синхронизация с родительским кабинетом</h4>
            </div>
            
            <p className="text-xs text-muted-foreground">
              Введите индивидуальный код ребёнка из личного кабинета родителя для автоматического заполнения данных
            </p>

            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  value={childCode}
                  onChange={(e) => {
                    setChildCode(e.target.value.toUpperCase());
                    setSearchError(null);
                  }}
                  placeholder="PC-2024-000001"
                  className="font-mono"
                  disabled={!!linkedParentChild}
                />
              </div>
              {linkedParentChild ? (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleClearLinkedChild}
                  title="Отменить привязку"
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSearchByCode}
                  disabled={isSearching || !childCode.trim()}
                >
                  {isSearching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>

            {searchError && (
              <p className="text-xs text-destructive">{searchError}</p>
            )}

            {linkedParentChild && (
              <div className="flex items-center gap-2 p-2 bg-success/10 rounded border border-success/30">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{linkedParentChild.full_name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{linkedParentChild.child_unique_id}</p>
                </div>
                <Badge variant="secondary" className="text-xs">Синхронизирован</Badge>
              </div>
            )}
          </div>

          {/* Основные данные */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Основные данные
            </h4>
            
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <Label htmlFor="age">Возраст</Label>
                <Input
                  id="age"
                  value={formData.age}
                  readOnly
                  placeholder="Рассчитывается автоматически"
                  className="bg-muted"
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="education_level">Уровень образования</Label>
                <Select
                  value={formData.education_level}
                  onValueChange={(value) =>
                    setFormData({ ...formData, education_level: value, class_number: "", class_letter: "" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите уровень" />
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

              <div className="grid gap-2">
                <Label htmlFor="class_number">
                  {formData.education_level === "preschool" ? "Группа" : "Класс"}
                </Label>
                <Select
                  value={formData.class_number}
                  onValueChange={(value) =>
                    setFormData({ ...formData, class_number: value })
                  }
                  disabled={!formData.education_level}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      !formData.education_level 
                        ? "Сначала выберите уровень" 
                        : formData.education_level === "preschool" 
                          ? "Выберите группу" 
                          : "Выберите класс"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {getClassOptions(formData.education_level).map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="class_letter">
                  {formData.education_level === "preschool" ? "Номер группы" : "Литера класса"}
                </Label>
                {formData.education_level === "preschool" ? (
                  <Input
                    id="class_letter"
                    value={formData.class_letter}
                    onChange={(e) =>
                      setFormData({ ...formData, class_letter: e.target.value })
                    }
                    placeholder="1, 2, 3..."
                    disabled={!formData.education_level}
                  />
                ) : (
                  <Select
                    value={formData.class_letter}
                    onValueChange={(value) =>
                      setFormData({ ...formData, class_letter: value })
                    }
                    disabled={!formData.education_level}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        !formData.education_level ? "Сначала выберите уровень" : "Выберите литеру"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {classLetterOptions.map((letter) => (
                        <SelectItem key={letter} value={letter}>
                          {letter}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          </div>

          {/* Адресные данные */}
          <div className="border-t pt-4 space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Адресные данные
            </h4>

            <div className="grid gap-2">
              <Label htmlFor="address">Адрес проживания</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                placeholder="г. Москва, ул. Примерная, д. 1, кв. 1"
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="same_as_address"
                checked={formData.same_as_address}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, same_as_address: checked === true })
                }
              />
              <Label htmlFor="same_as_address" className="text-sm font-normal">
                Адрес регистрации совпадает с адресом проживания
              </Label>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="registration_address">Адрес регистрации</Label>
              <Input
                id="registration_address"
                value={formData.registration_address}
                onChange={(e) =>
                  setFormData({ ...formData, registration_address: e.target.value })
                }
                placeholder="г. Москва, ул. Примерная, д. 1, кв. 1"
                disabled={formData.same_as_address}
                className={formData.same_as_address ? "bg-muted" : ""}
              />
            </div>
          </div>

          {/* Данные родителя/представителя */}
          <div className="border-t pt-4 space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Информация о родителе / представителе
            </h4>

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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="whobrought">Кто привёл на обследование</Label>
                <Select
                  value={formData.whobrought}
                  onValueChange={(value) =>
                    setFormData({ ...formData, whobrought: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите" />
                  </SelectTrigger>
                  <SelectContent>
                    {whobroughtOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="relationship">Степень родства</Label>
                <Input
                  id="relationship"
                  value={formData.relationship}
                  onChange={(e) =>
                    setFormData({ ...formData, relationship: e.target.value })
                  }
                  placeholder="Мать, отец, опекун..."
                />
              </div>
            </div>
          </div>

          {/* Примечания */}
          <div className="border-t pt-4 space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="notes">Дополнительные примечания</Label>
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
