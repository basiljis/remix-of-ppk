import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InstructionsEditor } from "./InstructionsEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Plus, Edit, Trash2, Save, X } from "lucide-react";
import { useProtocolChecklistData } from "@/hooks/useProtocolChecklistData";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ProtocolChecklistFormData {
  id?: string;
  checklist_item_id: string;
  block: string;
  block_order: number;
  education_level_do: boolean;
  education_level_noo: boolean;
  education_level_oo: boolean;
  education_level_soo: boolean;
  topic: string;
  topic_order: number;
  subtopic: string;
  subtopic_order: number;
  description: string;
  score_0_label: string;
  score_1_label: string;
  weight: number;
}

export const AdminPanel = () => {
  const { items, loading, error, refetch } = useProtocolChecklistData();
  const { toast } = useToast();
  const [editingItem, setEditingItem] = useState<ProtocolChecklistFormData | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const initialFormData: ProtocolChecklistFormData = {
    checklist_item_id: '',
    block: '',
    block_order: 1,
    education_level_do: false,
    education_level_noo: false,
    education_level_oo: false,
    education_level_soo: false,
    topic: '',
    topic_order: 1,
    subtopic: '',
    subtopic_order: 1,
    description: '',
    score_0_label: '',
    score_1_label: '',
    weight: 1
  };

  const [formData, setFormData] = useState<ProtocolChecklistFormData>(initialFormData);

  const handleCreate = () => {
    setIsCreating(true);
    setEditingItem(null);
    setFormData(initialFormData);
  };

  const handleEdit = (item: any) => {
    setIsCreating(false);
    setEditingItem(item);
    setFormData({
      id: item.id,
      checklist_item_id: item.checklist_item_id,
      block: item.block,
      block_order: item.block_order,
      education_level_do: item.education_level_do,
      education_level_noo: item.education_level_noo,
      education_level_oo: item.education_level_oo,
      education_level_soo: item.education_level_soo,
      topic: item.topic,
      topic_order: item.topic_order,
      subtopic: item.subtopic,
      subtopic_order: item.subtopic_order,
      description: item.description,
      score_0_label: item.score_0_label || '',
      score_1_label: item.score_1_label || '',
      weight: item.weight
    });
  };

  const handleSave = async () => {
    try {
      if (isCreating) {
        const { error } = await supabase
          .from('protocol_checklist_items')
          .insert([{
            checklist_item_id: formData.checklist_item_id,
            block: formData.block,
            block_order: formData.block_order,
            education_level_do: formData.education_level_do,
            education_level_noo: formData.education_level_noo,
            education_level_oo: formData.education_level_oo,
            education_level_soo: formData.education_level_soo,
            topic: formData.topic,
            topic_order: formData.topic_order,
            subtopic: formData.subtopic,
            subtopic_order: formData.subtopic_order,
            description: formData.description,
            score_0_label: formData.score_0_label || null,
            score_1_label: formData.score_1_label || null,
            weight: formData.weight
          }]);

        if (error) throw error;
        toast({ title: "Успешно", description: "Элемент чеклиста создан" });
      } else if (editingItem) {
        const { error } = await supabase
          .from('protocol_checklist_items')
          .update({
            checklist_item_id: formData.checklist_item_id,
            block: formData.block,
            block_order: formData.block_order,
            education_level_do: formData.education_level_do,
            education_level_noo: formData.education_level_noo,
            education_level_oo: formData.education_level_oo,
            education_level_soo: formData.education_level_soo,
            topic: formData.topic,
            topic_order: formData.topic_order,
            subtopic: formData.subtopic,
            subtopic_order: formData.subtopic_order,
            description: formData.description,
            score_0_label: formData.score_0_label || null,
            score_1_label: formData.score_1_label || null,
            weight: formData.weight
          })
          .eq('id', editingItem.id);

        if (error) throw error;
        toast({ title: "Успешно", description: "Элемент чеклиста обновлён" });
      }

      setIsCreating(false);
      setEditingItem(null);
      setFormData(initialFormData);
      refetch();
    } catch (error) {
      console.error('Error saving item:', error);
      toast({ 
        title: "Ошибка", 
        description: error instanceof Error ? error.message : "Неизвестная ошибка",
        variant: "destructive"
      });
    }
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingItem(null);
    setFormData(initialFormData);
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот элемент?')) return;

    try {
      const { error } = await supabase
        .from('protocol_checklist_items')
        .update({ is_disabled: true })
        .eq('id', itemId);

      if (error) throw error;
      
      toast({ title: "Успешно", description: "Элемент чеклиста удалён" });
      refetch();
    } catch (error) {
      console.error('Error deleting item:', error);
      toast({ 
        title: "Ошибка", 
        description: error instanceof Error ? error.message : "Неизвестная ошибка",
        variant: "destructive"
      });
    }
  };

  const updateFormField = (field: keyof ProtocolChecklistFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p>Загрузка данных чеклиста...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
          <p className="text-destructive">Ошибка загрузки: {error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="checklist" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="checklist">Управление чеклистом</TabsTrigger>
          <TabsTrigger value="instructions">Управление инструкциями</TabsTrigger>
        </TabsList>
        
        <TabsContent value="checklist" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Управление чеклистом протокола</CardTitle>
                <Button onClick={handleCreate} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Добавить элемент
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground mb-4">
                Всего элементов в базе: {items.length}
              </div>
            </CardContent>
          </Card>

      {(isCreating || editingItem) && (
        <Card>
          <CardHeader>
            <CardTitle>
              {isCreating ? 'Создание нового элемента' : 'Редактирование элемента'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="checklist_item_id">ID элемента чеклиста</Label>
                <Input
                  id="checklist_item_id"
                  value={formData.checklist_item_id}
                  onChange={(e) => updateFormField('checklist_item_id', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="weight">Вес</Label>
                <Input
                  id="weight"
                  type="number"
                  value={formData.weight}
                  onChange={(e) => updateFormField('weight', parseFloat(e.target.value) || 1)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="block">Блок</Label>
                <Input
                  id="block"
                  value={formData.block}
                  onChange={(e) => updateFormField('block', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="block_order">Порядок блока</Label>
                <Input
                  id="block_order"
                  type="number"
                  value={formData.block_order}
                  onChange={(e) => updateFormField('block_order', parseInt(e.target.value) || 1)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="topic">Тема</Label>
                <Input
                  id="topic"
                  value={formData.topic}
                  onChange={(e) => updateFormField('topic', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="topic_order">Порядок темы</Label>
                <Input
                  id="topic_order"
                  type="number"
                  value={formData.topic_order}
                  onChange={(e) => updateFormField('topic_order', parseInt(e.target.value) || 1)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="subtopic">Подтема</Label>
                <Input
                  id="subtopic"
                  value={formData.subtopic}
                  onChange={(e) => updateFormField('subtopic', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="subtopic_order">Порядок подтемы</Label>
                <Input
                  id="subtopic_order"
                  type="number"
                  value={formData.subtopic_order}
                  onChange={(e) => updateFormField('subtopic_order', parseInt(e.target.value) || 1)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Описание</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateFormField('description', e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="score_0_label">Метка для оценки 0</Label>
                <Input
                  id="score_0_label"
                  value={formData.score_0_label}
                  onChange={(e) => updateFormField('score_0_label', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="score_1_label">Метка для оценки 1</Label>
                <Input
                  id="score_1_label"
                  value={formData.score_1_label}
                  onChange={(e) => updateFormField('score_1_label', e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label>Уровни образования</Label>
              <div className="flex gap-4 mt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="education_level_do"
                    checked={formData.education_level_do}
                    onCheckedChange={(checked) => updateFormField('education_level_do', checked)}
                  />
                  <Label htmlFor="education_level_do">ДО (дошкольное)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="education_level_noo"
                    checked={formData.education_level_noo}
                    onCheckedChange={(checked) => updateFormField('education_level_noo', checked)}
                  />
                  <Label htmlFor="education_level_noo">НОО (начальное)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="education_level_oo"
                    checked={formData.education_level_oo}
                    onCheckedChange={(checked) => updateFormField('education_level_oo', checked)}
                  />
                  <Label htmlFor="education_level_oo">ОО (основное)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="education_level_soo"
                    checked={formData.education_level_soo}
                    onCheckedChange={(checked) => updateFormField('education_level_soo', checked)}
                  />
                  <Label htmlFor="education_level_soo">СОО (среднее)</Label>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave} className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Сохранить
              </Button>
              <Button variant="outline" onClick={handleCancel} className="flex items-center gap-2">
                <X className="h-4 w-4" />
                Отмена
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Список элементов чеклиста</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">{item.block}</Badge>
                      <Badge variant="secondary">{item.topic}</Badge>
                      <Badge variant="outline">{item.subtopic}</Badge>
                    </div>
                    <h4 className="font-semibold mb-2">{item.description}</h4>
                    <div className="text-sm text-muted-foreground">
                      <p>ID: {item.checklist_item_id}</p>
                      <p>Вес: {item.weight}</p>
                      <div className="flex gap-2 mt-1">
                        {item.education_level_do && <Badge>ДО</Badge>}
                        {item.education_level_noo && <Badge>НОО</Badge>}
                        {item.education_level_oo && <Badge>ОО</Badge>}
                        {item.education_level_soo && <Badge>СОО</Badge>}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleEdit(item)}
                      className="flex items-center gap-1"
                    >
                      <Edit className="h-3 w-3" />
                      Редактировать
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => handleDelete(item.id)}
                      className="flex items-center gap-1"
                    >
                      <Trash2 className="h-3 w-3" />
                      Удалить
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
        </TabsContent>
        
        <TabsContent value="instructions">
          <InstructionsEditor />
        </TabsContent>
      </Tabs>
    </div>
  );
};