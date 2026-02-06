import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, X, GraduationCap } from "lucide-react";

export interface EducationEntry {
  institution: string;
  degree: string;
  speciality: string;
  year: string;
}

interface EducationEntriesEditorProps {
  entries: EducationEntry[];
  onChange: (entries: EducationEntry[]) => void;
}

const emptyEntry: EducationEntry = {
  institution: "",
  degree: "",
  speciality: "",
  year: "",
};

export function EducationEntriesEditor({ entries, onChange }: EducationEntriesEditorProps) {
  const handleAdd = () => {
    onChange([...entries, { ...emptyEntry }]);
  };

  const handleRemove = (index: number) => {
    onChange(entries.filter((_, i) => i !== index));
  };

  const handleUpdate = (index: number, field: keyof EducationEntry, value: string) => {
    const updated = [...entries];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4" />
          Образование
        </Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAdd}
          className="gap-1"
        >
          <Plus className="h-3 w-3" />
          Добавить
        </Button>
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">
          Добавьте информацию о вашем образовании
        </p>
      ) : (
        <div className="space-y-3">
          {entries.map((entry, index) => (
            <Card key={index} className="relative">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:text-destructive"
                onClick={() => handleRemove(index)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
              <CardContent className="pt-4 pb-3 space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Учебное заведение</Label>
                  <Input
                    value={entry.institution}
                    onChange={(e) => handleUpdate(index, "institution", e.target.value)}
                    placeholder="Например: МГППУ"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Степень / Квалификация</Label>
                    <Input
                      value={entry.degree}
                      onChange={(e) => handleUpdate(index, "degree", e.target.value)}
                      placeholder="Магистр, бакалавр..."
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Год окончания</Label>
                    <Input
                      value={entry.year}
                      onChange={(e) => handleUpdate(index, "year", e.target.value)}
                      placeholder="2020"
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Специальность</Label>
                  <Input
                    value={entry.speciality}
                    onChange={(e) => handleUpdate(index, "speciality", e.target.value)}
                    placeholder="Клиническая психология"
                    className="h-8 text-sm"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
