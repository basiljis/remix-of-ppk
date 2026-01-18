import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Plus, Pencil, Search, UserCircle, Phone, Mail } from "lucide-react";
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
}

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

export function ChildrenManagement() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);
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

  // Fetch children from children table
  const { data: childrenFromTable = [], isLoading: isLoadingChildren } = useQuery({
    queryKey: ["children", organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase
        .from("children")
        .select("*")
        .eq("organization_id", organizationId)
        .order("full_name");
      if (error) throw error;
      return data as Child[];
    },
    enabled: !!organizationId,
  });

  // Fetch children from protocols (PPK list) for the organization
  const { data: childrenFromProtocols = [], isLoading: isLoadingProtocols } = useQuery({
    queryKey: ["children-from-protocols", organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase
        .from("protocols")
        .select("child_name, child_birth_date")
        .eq("organization_id", organizationId)
        .order("child_name");
      if (error) throw error;
      
      // Get unique children names from protocols
      const uniqueChildren = new Map<string, { name: string; birthDate: string | null }>();
      data?.forEach(p => {
        if (p.child_name && !uniqueChildren.has(p.child_name.toLowerCase())) {
          uniqueChildren.set(p.child_name.toLowerCase(), {
            name: p.child_name,
            birthDate: p.child_birth_date,
          });
        }
      });
      return Array.from(uniqueChildren.values());
    },
    enabled: !!organizationId,
  });

  // Combine and deduplicate children
  const children = useMemo(() => {
    const allChildren = [...childrenFromTable];
    const existingNames = new Set(childrenFromTable.map(c => c.full_name.toLowerCase()));
    
    // Add children from protocols that aren't already in the children table
    childrenFromProtocols.forEach(pc => {
      if (!existingNames.has(pc.name.toLowerCase())) {
        allChildren.push({
          id: `protocol-${pc.name}`, // Temporary ID for display
          full_name: pc.name,
          birth_date: pc.birthDate,
          gender: null,
          education_level: null,
          parent_name: null,
          parent_phone: null,
          parent_email: null,
          notes: null,
          is_active: true,
          organization_id: organizationId,
          created_at: new Date().toISOString(),
          _fromProtocol: true, // Mark as from protocol
        } as Child & { _fromProtocol?: boolean });
      }
    });
    
    return allChildren.sort((a, b) => a.full_name.localeCompare(b.full_name));
  }, [childrenFromTable, childrenFromProtocols, organizationId]);

  const isLoading = isLoadingChildren || isLoadingProtocols;

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData & { id?: string }) => {
      if (data.id) {
        const { error } = await supabase
          .from("children")
          .update({
            full_name: data.full_name,
            birth_date: data.birth_date || null,
            gender: data.gender || null,
            education_level: data.education_level || null,
            parent_name: data.parent_name || null,
            parent_phone: data.parent_phone || null,
            parent_email: data.parent_email || null,
            notes: data.notes || null,
            is_active: data.is_active,
          })
          .eq("id", data.id);
        if (error) throw error;
      } else {
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
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["children"] });
      setShowDialog(false);
      resetForm();
      toast({
        title: "Успешно",
        description: editingChild ? "Ребёнок обновлён" : "Ребёнок добавлен",
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

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
    setEditingChild(null);
  };

  const handleEdit = (child: Child) => {
    setEditingChild(child);
    setFormData({
      full_name: child.full_name,
      birth_date: child.birth_date || "",
      gender: child.gender || "",
      education_level: child.education_level || "",
      parent_name: child.parent_name || "",
      parent_phone: child.parent_phone || "",
      parent_email: child.parent_email || "",
      notes: child.notes || "",
      is_active: child.is_active,
    });
    setShowDialog(true);
  };

  const handleSave = () => {
    if (!formData.full_name.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите ФИО ребёнка",
        variant: "destructive",
      });
      return;
    }
    saveMutation.mutate({ ...formData, id: editingChild?.id });
  };

  const filteredChildren = children.filter((child) =>
    child.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const calculateAge = (birthDate: string | null) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <UserCircle className="h-5 w-5" />
            Управление детьми
          </CardTitle>
          <Button
            onClick={() => {
              resetForm();
              setShowDialog(true);
            }}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Добавить ребёнка
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Поиск по ФИО..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ФИО ребёнка</TableHead>
                <TableHead>Возраст</TableHead>
                <TableHead>Уровень образования</TableHead>
                <TableHead>Родитель</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead className="w-[100px]">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Загрузка...
                  </TableCell>
                </TableRow>
              ) : filteredChildren.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {searchQuery ? "Ничего не найдено" : "Нет добавленных детей"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredChildren.map((child) => {
                  const age = calculateAge(child.birth_date);
                  const level = educationLevels.find((l) => l.value === child.education_level);
                  const isFromProtocol = (child as Child & { _fromProtocol?: boolean })._fromProtocol;
                  return (
                    <TableRow key={child.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {child.full_name}
                          {isFromProtocol && (
                            <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                              из ППК
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {age !== null ? (
                          <span>{age} лет</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {level ? (
                          <Badge variant="secondary">{level.label}</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {child.parent_name ? (
                          <div className="space-y-1">
                            <div className="text-sm">{child.parent_name}</div>
                            {child.parent_phone && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                {child.parent_phone}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={child.is_active ? "default" : "secondary"}>
                          {child.is_active ? "Активен" : "Неактивен"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {!isFromProtocol ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(child)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setFormData({
                                full_name: child.full_name,
                                birth_date: child.birth_date || "",
                                gender: "",
                                education_level: "",
                                parent_name: "",
                                parent_phone: "",
                                parent_email: "",
                                notes: "",
                                is_active: true,
                              });
                              setEditingChild(null);
                              setShowDialog(true);
                            }}
                            className="text-xs"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Добавить
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingChild ? "Редактирование ребёнка" : "Добавление ребёнка"}
            </DialogTitle>
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

            <div className="grid grid-cols-2 gap-4">
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
                <Label>Пол</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(v) => setFormData({ ...formData, gender: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите пол" />
                  </SelectTrigger>
                  <SelectContent>
                    {genderOptions.map((g) => (
                      <SelectItem key={g.value} value={g.value}>
                        {g.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Уровень образования</Label>
              <Select
                value={formData.education_level}
                onValueChange={(v) =>
                  setFormData({ ...formData, education_level: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите уровень" />
                </SelectTrigger>
                <SelectContent>
                  {educationLevels.map((l) => (
                    <SelectItem key={l.value} value={l.value}>
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Данные родителя (законного представителя)</h4>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="parent_name">ФИО родителя</Label>
                  <Input
                    id="parent_name"
                    value={formData.parent_name}
                    onChange={(e) =>
                      setFormData({ ...formData, parent_name: e.target.value })
                    }
                    placeholder="Иванова Мария Петровна"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
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
                      placeholder="parent@example.com"
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
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Дополнительная информация..."
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="is_active">Активен</Label>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_active: checked })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Отмена
            </Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Сохранение..." : "Сохранить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}