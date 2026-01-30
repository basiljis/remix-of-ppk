import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, Camera, X, Baby } from "lucide-react";

interface ParentChild {
  id: string;
  child_unique_id: string;
  full_name: string;
  gender: string | null;
  birth_date: string | null;
  school_name: string | null;
  class_or_group: string | null;
  education_level: string | null;
  notes: string | null;
}

interface EditChildDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  child: ParentChild;
  organizations: Array<{ id: string; name: string }>;
  onSuccess: () => void;
}

const educationLevels = [
  { value: "DO", label: "Дошкольное образование" },
  { value: "NOO", label: "Начальное общее (1-4 класс)" },
  { value: "OOO", label: "Основное общее (5-9 класс)" },
  { value: "SOO", label: "Среднее общее (10-11 класс)" },
];

const getClassOptions = (educationLevel: string) => {
  switch (educationLevel) {
    case "DO":
      return [
        { value: "Младшая группа", label: "Младшая группа" },
        { value: "Средняя группа", label: "Средняя группа" },
        { value: "Старшая группа", label: "Старшая группа" },
        { value: "Подготовительная группа", label: "Подготовительная группа" },
      ];
    case "NOO":
      return [1, 2, 3, 4].map((n) => ({ value: n.toString(), label: `${n} класс` }));
    case "OOO":
      return [5, 6, 7, 8, 9].map((n) => ({ value: n.toString(), label: `${n} класс` }));
    case "SOO":
      return [10, 11].map((n) => ({ value: n.toString(), label: `${n} класс` }));
    default:
      return [];
  }
};

const classLetterOptions = ["А", "Б", "В", "Г", "Д", "Е", "Ж", "З", "И", "К", "Л", "М"];

export function EditChildDialog({ 
  open, 
  onOpenChange, 
  child, 
  organizations,
  onSuccess 
}: EditChildDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [fullName, setFullName] = useState(child.full_name);
  const [gender, setGender] = useState(child.gender || "");
  const [birthDate, setBirthDate] = useState(child.birth_date || "");
  const [educationLevel, setEducationLevel] = useState(child.education_level || "");
  const [classNumber, setClassNumber] = useState("");
  const [classLetter, setClassLetter] = useState("");
  const [schoolName, setSchoolName] = useState(child.school_name || "");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Parse class_or_group into number and letter
  useState(() => {
    if (child.class_or_group) {
      if (child.education_level === "DO") {
        setClassNumber(child.class_or_group);
      } else {
        const match = child.class_or_group.match(/^(\d+)([А-Я])?$/);
        if (match) {
          setClassNumber(match[1]);
          setClassLetter(match[2] || "");
        }
      }
    }
  });

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Файл слишком большой",
          description: "Максимальный размер фото — 5 МБ",
          variant: "destructive",
        });
        return;
      }
      
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearPhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setPhotoUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const updateMutation = useMutation({
    mutationFn: async () => {
      // Build class_or_group
      let classOrGroup = "";
      if (educationLevel === "DO") {
        classOrGroup = classNumber;
      } else if (classNumber) {
        classOrGroup = classNumber + (classLetter || "");
      }

      const updateData: any = {
        full_name: fullName.trim(),
        gender: gender || null,
        birth_date: birthDate || null,
        education_level: educationLevel || null,
        class_or_group: classOrGroup || null,
        school_name: schoolName || null,
      };

      // Note: Photo upload would go to Supabase Storage
      // For now, we'll store the URL if we implemented storage

      const { error } = await supabase
        .from("parent_children" as any)
        .update(updateData)
        .eq("id", child.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Профиль обновлён" });
      queryClient.invalidateQueries({ queryKey: ["parent-children"] });
      onSuccess();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!fullName.trim()) {
      toast({
        title: "Ошибка",
        description: "Укажите ФИО ребёнка",
        variant: "destructive",
      });
      return;
    }
    updateMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Baby className="h-5 w-5 text-pink-600" />
            Редактировать профиль
          </DialogTitle>
          <DialogDescription>
            Измените информацию о ребёнке
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Photo upload */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <Avatar className="h-24 w-24 border-2 border-pink-200">
                {photoPreview || photoUrl ? (
                  <AvatarImage src={photoPreview || photoUrl || undefined} alt={fullName} />
                ) : (
                  <AvatarFallback className="text-pink-600 text-2xl font-bold bg-pink-100 dark:bg-pink-950">
                    {fullName.charAt(0)}
                  </AvatarFallback>
                )}
              </Avatar>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="absolute bottom-0 right-0 rounded-full h-8 w-8 bg-background border-pink-200"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="h-4 w-4 text-pink-600" />
              </Button>
              {(photoPreview || photoUrl) && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-0 right-0 rounded-full h-6 w-6"
                  onClick={clearPhoto}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoSelect}
            />
            <p className="text-xs text-muted-foreground">Нажмите на камеру, чтобы загрузить фото</p>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="edit-name">ФИО ребёнка *</Label>
            <Input
              id="edit-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Иванов Иван Иванович"
            />
          </div>

          {/* Gender and birth date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Пол</Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Мужской</SelectItem>
                  <SelectItem value="female">Женский</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Дата рождения</Label>
              <Input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
              />
            </div>
          </div>

          {/* Education level */}
          <div className="space-y-2">
            <Label>Уровень образования</Label>
            <Select
              value={educationLevel}
              onValueChange={(value) => {
                setEducationLevel(value);
                setClassNumber("");
                setClassLetter("");
              }}
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

          {/* Class/Group */}
          {educationLevel && (
            <div className="space-y-2">
              <Label>{educationLevel === "DO" ? "Группа" : "Класс"}</Label>
              {educationLevel === "DO" ? (
                <Select value={classNumber} onValueChange={setClassNumber}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите группу" />
                  </SelectTrigger>
                  <SelectContent>
                    {getClassOptions("DO").map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Select value={classNumber} onValueChange={setClassNumber}>
                    <SelectTrigger>
                      <SelectValue placeholder="Номер" />
                    </SelectTrigger>
                    <SelectContent>
                      {getClassOptions(educationLevel).map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={classLetter} onValueChange={setClassLetter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Литера" />
                    </SelectTrigger>
                    <SelectContent>
                      {classLetterOptions.map((letter) => (
                        <SelectItem key={letter} value={letter}>
                          {letter}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          {/* School name */}
          <div className="space-y-2">
            <Label>Образовательная организация</Label>
            <Select value={schoolName} onValueChange={setSchoolName}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите организацию" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {organizations.length === 0 ? (
                  <SelectItem value="none" disabled>
                    Нет организаций в вашем регионе
                  </SelectItem>
                ) : (
                  organizations.map((org) => (
                    <SelectItem key={org.id} value={org.name}>
                      {org.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={updateMutation.isPending}
            className="bg-pink-600 hover:bg-pink-700"
          >
            {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Сохранить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
