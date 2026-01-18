import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
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
import {
  Plus,
  Pencil,
  Search,
  UserCircle,
  Phone,
  Mail,
  FileText,
  Eye,
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
}

interface ProtocolChild {
  child_name: string;
  child_birth_date: string | null;
  education_level: string | null;
  protocol_count: number;
  latest_status: string | null;
  latest_ppk_number: string | null;
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
  const navigate = useNavigate();
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
  const { data: childrenFromTable = [], isLoading: isLoadingChildren } =
    useQuery({
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

  // Fetch children from protocols (PPK list) with full data
  const { data: childrenFromProtocols = [], isLoading: isLoadingProtocols } =
    useQuery({
      queryKey: ["children-from-protocols", organizationId],
      queryFn: async () => {
        if (!organizationId) return [];
        const { data, error } = await supabase
          .from("protocols")
          .select("child_name, child_birth_date, education_level, status, ppk_number, created_at")
          .eq("organization_id", organizationId)
          .order("created_at", { ascending: false });
        if (error) throw error;

        // Aggregate children data from protocols
        const childrenMap = new Map<string, ProtocolChild>();
        data?.forEach((p) => {
          const key = p.child_name?.toLowerCase();
          if (!key) return;

          if (childrenMap.has(key)) {
            const existing = childrenMap.get(key)!;
            existing.protocol_count += 1;
            // Keep the most recent data
          } else {
            childrenMap.set(key, {
              child_name: p.child_name,
              child_birth_date: p.child_birth_date,
              education_level: p.education_level,
              protocol_count: 1,
              latest_status: p.status,
              latest_ppk_number: p.ppk_number,
            });
          }
        });
        return Array.from(childrenMap.values());
      },
      enabled: !!organizationId,
    });

  // Combine and deduplicate children
  const children = useMemo(() => {
    const combinedChildren: (Child & {
      _fromProtocol?: boolean;
      protocol_count?: number;
      latest_ppk_number?: string | null;
    })[] = [];
    const processedNames = new Set<string>();

    // First, add children from the children table
    childrenFromTable.forEach((child) => {
      const key = child.full_name.toLowerCase();
      const protocolData = childrenFromProtocols.find(
        (pc) => pc.child_name.toLowerCase() === key
      );

      combinedChildren.push({
        ...child,
        _fromProtocol: false,
        protocol_count: protocolData?.protocol_count || 0,
        latest_ppk_number: protocolData?.latest_ppk_number || null,
        // If child in table doesn't have education_level, use from protocol
        education_level: child.education_level || protocolData?.education_level || null,
      });
      processedNames.add(key);
    });

    // Then, add children only from protocols that aren't in the children table
    childrenFromProtocols.forEach((pc) => {
      const key = pc.child_name.toLowerCase();
      if (!processedNames.has(key)) {
        combinedChildren.push({
          id: `protocol-${pc.child_name}`,
          full_name: pc.child_name,
          birth_date: pc.child_birth_date,
          gender: null,
          education_level: pc.education_level,
          parent_name: null,
          parent_phone: null,
          parent_email: null,
          notes: null,
          is_active: true,
          organization_id: organizationId || null,
          created_at: new Date().toISOString(),
          _fromProtocol: true,
          protocol_count: pc.protocol_count,
          latest_ppk_number: pc.latest_ppk_number,
        });
        processedNames.add(key);
      }
    });

    return combinedChildren.sort((a, b) =>
      a.full_name.localeCompare(b.full_name)
    );
  }, [childrenFromTable, childrenFromProtocols, organizationId]);

  const isLoading = isLoadingChildren || isLoadingProtocols;

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData & { id?: string }) => {
      if (data.id && !data.id.startsWith("protocol-")) {
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
      queryClient.invalidateQueries({ queryKey: ["children-from-protocols"] });
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
    saveMutation.mutate({
      ...formData,
      id: editingChild?.id.startsWith("protocol-") ? undefined : editingChild?.id,
    });
  };

  const handleViewProfile = (childName: string) => {
    if (!organizationId) return;
    const params = new URLSearchParams({
      name: childName,
      org: organizationId,
      returnUrl: "/app",
    });
    navigate(`/child-profile?${params.toString()}`);
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

  const getGenderLabel = (gender: string | null) => {
    if (!gender) return null;
    return genderOptions.find((g) => g.value === gender)?.label || gender;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <CardTitle className="flex items-center gap-2">
            <UserCircle className="h-5 w-5" />
            Дети организации
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-sm">
              Всего: {children.length}
            </Badge>
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

        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ФИО ребёнка</TableHead>
                <TableHead>Дата рождения</TableHead>
                <TableHead>Возраст</TableHead>
                <TableHead>Пол</TableHead>
                <TableHead>Уровень образования</TableHead>
                <TableHead>Родитель / Контакт</TableHead>
                <TableHead>Протоколов</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead className="w-[150px]">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    Загрузка...
                  </TableCell>
                </TableRow>
              ) : filteredChildren.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="text-center py-8 text-muted-foreground"
                  >
                    {searchQuery
                      ? "Ничего не найдено"
                      : "Нет добавленных детей. Добавьте ребёнка или создайте протокол ППК."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredChildren.map((child) => {
                  const age = calculateAge(child.birth_date);
                  const level = educationLevels.find(
                    (l) => l.value === child.education_level
                  );
                  const isFromProtocol = child._fromProtocol;
                  const protocolCount = child.protocol_count || 0;

                  return (
                    <TableRow key={child.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <span>{child.full_name}</span>
                          {isFromProtocol && (
                            <Badge
                              variant="outline"
                              className="text-xs bg-amber-50 text-amber-700 border-amber-200"
                            >
                              из ППК
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {child.birth_date ? (
                          <span>
                            {format(new Date(child.birth_date), "dd.MM.yyyy", {
                              locale: ru,
                            })}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {age !== null ? (
                          <span>{age} лет</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {child.gender ? (
                          <Badge
                            variant="outline"
                            className={
                              child.gender === "male"
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : "bg-pink-50 text-pink-700 border-pink-200"
                            }
                          >
                            {getGenderLabel(child.gender)}
                          </Badge>
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
                            <div className="text-sm font-medium">
                              {child.parent_name}
                            </div>
                            {child.parent_phone && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                {child.parent_phone}
                              </div>
                            )}
                            {child.parent_email && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Mail className="h-3 w-3" />
                                {child.parent_email}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {protocolCount > 0 ? (
                          <Badge
                            variant="outline"
                            className="bg-primary/10 text-primary border-primary/30"
                          >
                            <FileText className="h-3 w-3 mr-1" />
                            {protocolCount}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={child.is_active ? "default" : "secondary"}
                        >
                          {child.is_active ? "Активен" : "Неактивен"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {protocolCount > 0 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewProfile(child.full_name)}
                              title="Просмотр результатов"
                            >
                              <Eye className="h-4 w-4 text-primary" />
                            </Button>
                          )}
                          {!isFromProtocol ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(child)}
                              title="Редактировать"
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
                                  education_level: child.education_level || "",
                                  parent_name: "",
                                  parent_phone: "",
                                  parent_email: "",
                                  notes: "",
                                  is_active: true,
                                });
                                setEditingChild(null);
                                setShowDialog(true);
                              }}
                              className="text-xs h-8"
                              title="Добавить в базу"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              В базу
                            </Button>
                          )}
                        </div>
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
              {editingChild
                ? "Редактирование ребёнка"
                : "Добавление ребёнка"}
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
              <h4 className="font-medium mb-3">
                Данные родителя (законного представителя)
              </h4>
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
                        setFormData({
                          ...formData,
                          parent_phone: e.target.value,
                        })
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
                        setFormData({
                          ...formData,
                          parent_email: e.target.value,
                        })
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
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
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
