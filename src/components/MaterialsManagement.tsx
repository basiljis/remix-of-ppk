import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Video, FileText, BookOpen, Dumbbell } from "lucide-react";

interface Material {
  id: string;
  sphere_slug: string;
  material_type: string;
  title: string;
  description: string | null;
  content: string | null;
  video_url: string | null;
  pdf_url: string | null;
  duration_minutes: number | null;
  specialist_type: string | null;
  is_active: boolean;
  sort_order: number;
}

const sphereOptions = [
  { value: "motor", label: "Моторная сфера" },
  { value: "speech", label: "Речевая сфера" },
  { value: "cognitive", label: "Познавательная сфера" },
  { value: "social", label: "Социально-коммуникативная сфера" },
  { value: "emotional", label: "Эмоционально-волевая сфера" },
];

const typeOptions = [
  { value: "article", label: "Статья", icon: BookOpen },
  { value: "exercise", label: "Упражнение", icon: Dumbbell },
  { value: "video", label: "Видео", icon: Video },
  { value: "pdf", label: "PDF", icon: FileText },
];

export function MaterialsManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [filterSphere, setFilterSphere] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");

  const [formData, setFormData] = useState({
    sphere_slug: "motor",
    material_type: "article",
    title: "",
    description: "",
    content: "",
    video_url: "",
    pdf_url: "",
    duration_minutes: "",
    specialist_type: "",
    is_active: true,
    sort_order: 0,
  });

  const { data: materials = [], isLoading } = useQuery({
    queryKey: ["admin-materials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("development_materials")
        .select("*")
        .order("sphere_slug")
        .order("sort_order");
      if (error) throw error;
      return (data || []) as unknown as Material[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData & { id?: string }) => {
      const payload = {
        ...data,
        duration_minutes: data.duration_minutes ? parseInt(data.duration_minutes) : null,
      };

      if (data.id) {
        const { error } = await supabase
          .from("development_materials" as any)
          .update(payload as any)
          .eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("development_materials" as any)
          .insert(payload as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-materials"] });
      toast({ title: "Материал сохранён" });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("development_materials" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-materials"] });
      toast({ title: "Материал удалён" });
    },
  });

  const resetForm = () => {
    setFormData({
      sphere_slug: "motor",
      material_type: "article",
      title: "",
      description: "",
      content: "",
      video_url: "",
      pdf_url: "",
      duration_minutes: "",
      specialist_type: "",
      is_active: true,
      sort_order: 0,
    });
    setEditingMaterial(null);
  };

  const openEditDialog = (material: Material) => {
    setEditingMaterial(material);
    setFormData({
      sphere_slug: material.sphere_slug,
      material_type: material.material_type,
      title: material.title,
      description: material.description || "",
      content: material.content || "",
      video_url: material.video_url || "",
      pdf_url: material.pdf_url || "",
      duration_minutes: material.duration_minutes?.toString() || "",
      specialist_type: material.specialist_type || "",
      is_active: material.is_active,
      sort_order: material.sort_order,
    });
    setIsDialogOpen(true);
  };

  const filteredMaterials = materials.filter((m) => {
    const matchesSphere = filterSphere === "all" || m.sphere_slug === filterSphere;
    const matchesType = filterType === "all" || m.material_type === filterType;
    return matchesSphere && matchesType;
  });

  const getTypeIcon = (type: string) => {
    const option = typeOptions.find((t) => t.value === type);
    return option?.icon || BookOpen;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Управление материалами</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Добавить материал
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingMaterial ? "Редактировать материал" : "Новый материал"}
                </DialogTitle>
              </DialogHeader>
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  saveMutation.mutate(editingMaterial ? { ...formData, id: editingMaterial.id } : formData);
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Сфера развития</Label>
                    <Select 
                      value={formData.sphere_slug} 
                      onValueChange={(v) => setFormData({ ...formData, sphere_slug: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {sphereOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Тип материала</Label>
                    <Select 
                      value={formData.material_type} 
                      onValueChange={(v) => setFormData({ ...formData, material_type: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {typeOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Заголовок *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Описание</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Содержание (HTML)</Label>
                  <Textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={6}
                    placeholder="<h2>Заголовок</h2><p>Текст...</p>"
                  />
                </div>

                {formData.material_type === "video" && (
                  <div className="space-y-2">
                    <Label>Ссылка на видео (YouTube, VK Video и др.)</Label>
                    <Input
                      value={formData.video_url}
                      onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                )}

                {formData.material_type === "pdf" && (
                  <div className="space-y-2">
                    <Label>Ссылка на PDF-файл</Label>
                    <Input
                      value={formData.pdf_url}
                      onChange={(e) => setFormData({ ...formData, pdf_url: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Длительность (мин)</Label>
                    <Input
                      type="number"
                      value={formData.duration_minutes}
                      onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Специалист</Label>
                    <Input
                      value={formData.specialist_type}
                      onChange={(e) => setFormData({ ...formData, specialist_type: e.target.value })}
                      placeholder="логопед, психолог..."
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
                  />
                  <Label>Активен</Label>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Отмена
                  </Button>
                  <Button type="submit" disabled={saveMutation.isPending}>
                    {saveMutation.isPending ? "Сохранение..." : "Сохранить"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-4">
          <Select value={filterSphere} onValueChange={setFilterSphere}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Все сферы" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все сферы</SelectItem>
              {sphereOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Все типы" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все типы</SelectItem>
              {typeOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Загрузка...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Тип</TableHead>
                <TableHead>Заголовок</TableHead>
                <TableHead>Сфера</TableHead>
                <TableHead>Специалист</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMaterials.map((material) => {
                const TypeIcon = getTypeIcon(material.material_type);
                return (
                  <TableRow key={material.id}>
                    <TableCell>
                      <TypeIcon className="h-4 w-4 text-muted-foreground" />
                    </TableCell>
                    <TableCell className="font-medium max-w-[200px] truncate">
                      {material.title}
                    </TableCell>
                    <TableCell>
                      {sphereOptions.find((s) => s.value === material.sphere_slug)?.label || material.sphere_slug}
                    </TableCell>
                    <TableCell>{material.specialist_type || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={material.is_active ? "default" : "secondary"}>
                        {material.is_active ? "Активен" : "Скрыт"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(material)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm("Удалить материал?")) {
                            deleteMutation.mutate(material.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        {filteredMaterials.length === 0 && !isLoading && (
          <div className="text-center py-8 text-muted-foreground">
            Материалы не найдены
          </div>
        )}
      </CardContent>
    </Card>
  );
}
