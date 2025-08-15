import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Trash2, Plus, Upload, FileText, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Section {
  id: string;
  title: string;
  content: string;
  subsections: Subsection[];
  documents: Document[];
}

interface Subsection {
  id: string;
  title: string;
  content: string;
  documents: Document[];
}

interface Document {
  id: string;
  name: string;
  url: string;
  type: string;
}

interface Instruction {
  id: string;
  title: string;
  content: any; // Using any for JSONB compatibility
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function InstructionsEditor() {
  const [instructions, setInstructions] = useState<Instruction[]>([]);
  const [editingInstruction, setEditingInstruction] = useState<Instruction | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchInstructions();
  }, []);

  const fetchInstructions = async () => {
    try {
      const { data, error } = await supabase
        .from('instructions')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInstructions((data || []).map(item => ({
        ...item,
        content: Array.isArray(item.content) ? item.content : []
      })));
    } catch (error) {
      console.error('Error fetching instructions:', error);
      toast.error('Ошибка при загрузке инструкций');
    }
  };

  const generateId = () => crypto.randomUUID();

  const createNewInstruction = (): Instruction => ({
    id: '',
    title: '',
    content: [{
      id: generateId(),
      title: 'Новый раздел',
      content: '',
      subsections: [],
      documents: []
    }],
    is_active: true,
    created_at: '',
    updated_at: ''
  });

  const handleSave = async () => {
    if (!editingInstruction?.title.trim()) {
      toast.error('Укажите название инструкции');
      return;
    }

    setIsLoading(true);
    try {
      const instructionData = {
        title: editingInstruction.title,
        content: JSON.stringify(editingInstruction.content),
        is_active: true
      };

      if (editingInstruction.id) {
        const { error } = await supabase
          .from('instructions')
          .update(instructionData)
          .eq('id', editingInstruction.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('instructions')
          .insert(instructionData);
        if (error) throw error;
      }

      toast.success('Инструкция сохранена');
      setIsDialogOpen(false);
      setEditingInstruction(null);
      fetchInstructions();
    } catch (error) {
      console.error('Error saving instruction:', error);
      toast.error('Ошибка при сохранении');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить инструкцию?')) return;

    try {
      const { error } = await supabase
        .from('instructions')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      toast.success('Инструкция удалена');
      fetchInstructions();
    } catch (error) {
      console.error('Error deleting instruction:', error);
      toast.error('Ошибка при удалении');
    }
  };

  const addSection = () => {
    if (!editingInstruction) return;
    
    const newSection: Section = {
      id: generateId(),
      title: 'Новый раздел',
      content: '',
      subsections: [],
      documents: []
    };

    setEditingInstruction({
      ...editingInstruction,
      content: [...editingInstruction.content, newSection]
    });
  };

  const updateSection = (sectionId: string, field: keyof Section, value: any) => {
    if (!editingInstruction) return;

    setEditingInstruction({
      ...editingInstruction,
      content: editingInstruction.content.map(section =>
        section.id === sectionId ? { ...section, [field]: value } : section
      )
    });
  };

  const deleteSection = (sectionId: string) => {
    if (!editingInstruction) return;

    setEditingInstruction({
      ...editingInstruction,
      content: editingInstruction.content.filter(section => section.id !== sectionId)
    });
  };

  const addSubsection = (sectionId: string) => {
    if (!editingInstruction) return;

    const newSubsection: Subsection = {
      id: generateId(),
      title: 'Новый подраздел',
      content: '',
      documents: []
    };

    setEditingInstruction({
      ...editingInstruction,
      content: editingInstruction.content.map(section =>
        section.id === sectionId
          ? { ...section, subsections: [...section.subsections, newSubsection] }
          : section
      )
    });
  };

  const updateSubsection = (sectionId: string, subsectionId: string, field: keyof Subsection, value: any) => {
    if (!editingInstruction) return;

    setEditingInstruction({
      ...editingInstruction,
      content: editingInstruction.content.map(section =>
        section.id === sectionId
          ? {
              ...section,
              subsections: section.subsections.map(subsection =>
                subsection.id === subsectionId ? { ...subsection, [field]: value } : subsection
              )
            }
          : section
      )
    });
  };

  const deleteSubsection = (sectionId: string, subsectionId: string) => {
    if (!editingInstruction) return;

    setEditingInstruction({
      ...editingInstruction,
      content: editingInstruction.content.map(section =>
        section.id === sectionId
          ? {
              ...section,
              subsections: section.subsections.filter(subsection => subsection.id !== subsectionId)
            }
          : section
      )
    });
  };

  const handleFileUpload = async (file: File, sectionId?: string, subsectionId?: string) => {
    if (!editingInstruction) return;

    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Поддерживаются только файлы PDF, DOC, DOCX');
      return;
    }

    try {
      const fileName = `${Date.now()}_${file.name}`;
      const { data, error } = await supabase.storage
        .from('instruction-documents')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('instruction-documents')
        .getPublicUrl(fileName);

      const newDocument: Document = {
        id: generateId(),
        name: file.name,
        url: publicUrl,
        type: file.type
      };

      if (subsectionId) {
        updateSubsection(sectionId!, subsectionId, 'documents', [
          ...editingInstruction.content.find(s => s.id === sectionId)?.subsections.find(ss => ss.id === subsectionId)?.documents || [],
          newDocument
        ]);
      } else if (sectionId) {
        updateSection(sectionId, 'documents', [
          ...editingInstruction.content.find(s => s.id === sectionId)?.documents || [],
          newDocument
        ]);
      }

      toast.success('Документ загружен');
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Ошибка при загрузке файла');
    }
  };

  const removeDocument = (sectionId: string, documentId: string, subsectionId?: string) => {
    if (!editingInstruction) return;

    if (subsectionId) {
      const section = editingInstruction.content.find(s => s.id === sectionId);
      const subsection = section?.subsections.find(ss => ss.id === subsectionId);
      if (subsection) {
        updateSubsection(sectionId, subsectionId, 'documents', 
          subsection.documents.filter(doc => doc.id !== documentId)
        );
      }
    } else {
      const section = editingInstruction.content.find(s => s.id === sectionId);
      if (section) {
        updateSection(sectionId, 'documents', 
          section.documents.filter(doc => doc.id !== documentId)
        );
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Управление инструкциями</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingInstruction(createNewInstruction())}>
              <Plus className="w-4 h-4 mr-2" />
              Новая инструкция
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingInstruction?.id ? 'Редактировать инструкцию' : 'Новая инструкция'}
              </DialogTitle>
            </DialogHeader>
            
            {editingInstruction && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Название инструкции</Label>
                  <Input
                    id="title"
                    value={editingInstruction.title}
                    onChange={(e) => setEditingInstruction({...editingInstruction, title: e.target.value})}
                    placeholder="Введите название инструкции"
                  />
                </div>

                <div className="space-y-4">
                  {editingInstruction.content.map((section, sectionIndex) => (
                    <Card key={section.id} className="border-l-4 border-l-primary">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <Input
                            value={section.title}
                            onChange={(e) => updateSection(section.id, 'title', e.target.value)}
                            className="font-medium"
                            placeholder="Название раздела"
                          />
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteSection(section.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <Textarea
                          value={section.content}
                          onChange={(e) => updateSection(section.id, 'content', e.target.value)}
                          placeholder="Содержание раздела"
                          rows={3}
                        />

                        <div className="flex gap-2">
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload(file, section.id);
                            }}
                            className="hidden"
                            id={`file-${section.id}`}
                          />
                          <Label htmlFor={`file-${section.id}`} className="cursor-pointer">
                            <Button variant="outline" size="sm" asChild>
                              <span>
                                <Upload className="w-4 h-4 mr-2" />
                                Загрузить документ
                              </span>
                            </Button>
                          </Label>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addSubsection(section.id)}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Добавить подраздел
                          </Button>
                        </div>

                        {section.documents.length > 0 && (
                          <div className="space-y-2">
                            <Label>Документы раздела:</Label>
                            {section.documents.map((doc) => (
                              <div key={doc.id} className="flex items-center justify-between bg-muted p-2 rounded">
                                <div className="flex items-center">
                                  <FileText className="w-4 h-4 mr-2" />
                                  <span className="text-sm">{doc.name}</span>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => window.open(doc.url, '_blank')}
                                  >
                                    <Download className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeDocument(section.id, doc.id)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {section.subsections.map((subsection) => (
                          <Card key={subsection.id} className="ml-4 border-l-2 border-l-secondary">
                            <CardHeader className="pb-2">
                              <div className="flex items-center justify-between">
                                <Input
                                  value={subsection.title}
                                  onChange={(e) => updateSubsection(section.id, subsection.id, 'title', e.target.value)}
                                  placeholder="Название подраздела"
                                  className="text-sm"
                                />
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => deleteSubsection(section.id, subsection.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-2">
                              <Textarea
                                value={subsection.content}
                                onChange={(e) => updateSubsection(section.id, subsection.id, 'content', e.target.value)}
                                placeholder="Содержание подраздела"
                                rows={2}
                              />

                              <div>
                                <input
                                  type="file"
                                  accept=".pdf,.doc,.docx"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleFileUpload(file, section.id, subsection.id);
                                  }}
                                  className="hidden"
                                  id={`file-${section.id}-${subsection.id}`}
                                />
                                <Label htmlFor={`file-${section.id}-${subsection.id}`} className="cursor-pointer">
                                  <Button variant="outline" size="sm" asChild>
                                    <span>
                                      <Upload className="w-4 h-4 mr-2" />
                                      Загрузить документ
                                    </span>
                                  </Button>
                                </Label>
                              </div>

                              {subsection.documents.length > 0 && (
                                <div className="space-y-2">
                                  <Label>Документы подраздела:</Label>
                                  {subsection.documents.map((doc) => (
                                    <div key={doc.id} className="flex items-center justify-between bg-muted p-2 rounded">
                                      <div className="flex items-center">
                                        <FileText className="w-4 h-4 mr-2" />
                                        <span className="text-sm">{doc.name}</span>
                                      </div>
                                      <div className="flex gap-2">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => window.open(doc.url, '_blank')}
                                        >
                                          <Download className="w-4 h-4" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => removeDocument(section.id, doc.id, subsection.id)}
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Button variant="outline" onClick={addSection} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Добавить раздел
                </Button>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Отмена
                  </Button>
                  <Button onClick={handleSave} disabled={isLoading}>
                    {isLoading ? 'Сохранение...' : 'Сохранить'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {instructions.map((instruction) => (
          <Card key={instruction.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg">{instruction.title}</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingInstruction(instruction);
                    setIsDialogOpen(true);
                  }}
                >
                  Редактировать
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(instruction.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Разделов: {instruction.content.length}
              </p>
              <p className="text-xs text-muted-foreground">
                Обновлено: {new Date(instruction.updated_at).toLocaleDateString('ru-RU')}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}