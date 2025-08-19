import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  content: any;
  type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function InstructionsEditor() {
  const [instructions, setInstructions] = useState<Instruction[]>([]);
  const [editingInstruction, setEditingInstruction] = useState<Instruction | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('legal');

  useEffect(() => {
    fetchInstructions();
  }, []);

  const fetchInstructions = async () => {
    try {
      const { data, error } = await supabase
        .from('instructions')
        .select(`
          *,
          instruction_files (
            id,
            section_id,
            subsection_id,
            filename,
            original_name,
            file_type,
            file_size,
            created_at
          )
        `)
        .eq('is_active', true)
        .order('type')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setInstructions((data || []).map(item => {
        const content = (() => {
          try {
            const parsed = typeof item.content === 'string' ? JSON.parse(item.content) : item.content;
            const sectionsArray = Array.isArray(parsed) ? parsed : [];
            
            // Добавляем файлы к соответствующим разделам/подразделам
            if (item.instruction_files) {
              sectionsArray.forEach(section => {
                // Файлы для раздела
                section.documents = item.instruction_files
                  .filter(file => file.section_id === section.id && !file.subsection_id)
                  .map(file => ({
                    id: file.id,
                    name: file.original_name,
                    url: `/api/files/${file.id}`, // URL для скачивания
                    type: file.file_type
                  }));

                // Файлы для подразделов
                section.subsections?.forEach(subsection => {
                  subsection.documents = item.instruction_files
                    .filter(file => file.section_id === section.id && file.subsection_id === subsection.id)
                    .map(file => ({
                      id: file.id,
                      name: file.original_name,
                      url: `/api/files/${file.id}`,
                      type: file.file_type
                    }));
                });
              });
            }
            
            return sectionsArray;
          } catch {
            return [];
          }
        })();
        
        return {
          ...item,
          content
        };
      }));
    } catch (error) {
      console.error('Error fetching instructions:', error);
      toast.error('Ошибка при загрузке инструкций');
    }
  };

  const generateId = () => crypto.randomUUID();

  const createNewInstruction = (type: string): Instruction => ({
    id: '',
    title: '',
    type: type,
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
        type: editingInstruction.type,
        is_active: true
      };

      let instructionId: string;

      if (editingInstruction.id) {
        const { error } = await supabase
          .from('instructions')
          .update(instructionData)
          .eq('id', editingInstruction.id);
        if (error) throw error;
        instructionId = editingInstruction.id;
      } else {
        const { data, error } = await supabase
          .from('instructions')
          .insert(instructionData)
          .select('id')
          .single();
        if (error) throw error;
        instructionId = data.id;
      }

      // Сохраняем файлы в БД
      const pendingFiles = JSON.parse(localStorage.getItem('pendingFiles') || '[]');
      if (pendingFiles.length > 0) {
        for (const fileData of pendingFiles) {
          const { error: fileError } = await supabase
            .from('instruction_files')
            .insert({
              instruction_id: instructionId,
              section_id: fileData.sectionId,
              subsection_id: fileData.subsectionId || null,
              filename: fileData.filename,
              original_name: fileData.originalName,
              file_data: fileData.fileData, // Сохраняем как base64 строку
              file_type: fileData.fileType,
              file_size: fileData.fileSize
            });

          if (fileError) {
            console.error('Error saving file to DB:', fileError);
            toast.error(`Ошибка при сохранении файла ${fileData.originalName}`);
          }
        }
        
        // Очищаем временные файлы
        localStorage.removeItem('pendingFiles');
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

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error('Размер файла не должен превышать 10MB');
      return;
    }

    try {
      // Читаем файл как ArrayBuffer для сохранения в БД
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const base64String = btoa(String.fromCharCode(...uint8Array));
      
      const newDocument: Document = {
        id: generateId(),
        name: file.name,
        url: '', // URL пока пустой, будет заполнен после сохранения в БД
        type: file.type
      };

      // Временно добавляем документ в UI
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

      // Сохраняем файл в БД (временно сохраняем данные в localStorage для последующего сохранения)
      const fileData = {
        id: newDocument.id,
        sectionId,
        subsectionId,
        filename: `${Date.now()}_${file.name}`,
        originalName: file.name,
        fileData: base64String, // Сохраняем как base64 строку
        fileType: file.type,
        fileSize: file.size
      };

      // Сохраняем файлы временно в состоянии компонента
      const currentFiles = JSON.parse(localStorage.getItem('pendingFiles') || '[]');
      currentFiles.push(fileData);
      localStorage.setItem('pendingFiles', JSON.stringify(currentFiles));

      toast.success('Файл подготовлен к загрузке');
    } catch (error) {
      console.error('Error preparing file:', error);
      toast.error('Ошибка при подготовке файла');
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

    // Удаляем файл из БД если инструкция уже сохранена
    if (editingInstruction.id) {
      supabase
        .from('instruction_files')
        .delete()
        .eq('id', documentId)
        .then(({ error }) => {
          if (error) {
            console.error('Error deleting file from DB:', error);
            toast.error('Ошибка при удалении файла из БД');
          }
        });
    }
  };

  // Функция для скачивания файла
  const downloadFile = async (fileId: string, fileName: string) => {
    try {
      const { data, error } = await supabase
        .from('instruction_files')
        .select('file_data, file_type, original_name')
        .eq('id', fileId)
        .single();

      if (error) throw error;

      // Создаем Blob из данных файла (конвертируем base64 обратно в Uint8Array)
      const binaryString = atob(data.file_data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: data.file_type });
      
      // Создаем URL для скачивания
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = data.original_name;
      
      // Автоматически скачиваем файл
      document.body.appendChild(link);
      link.click();
      
      // Очищаем ресурсы
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Файл скачан');
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Ошибка при скачивании файла');
    }
  };

  const getInstructionsByType = (type: string) => 
    instructions.filter(instruction => instruction.type === type);

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'work':
        return 'Инструкции для редактирования';
      case 'legal':
        return 'Нормативно-правовая база';
      case 'custom':
        return 'Пользовательские инструкции';
      default:
        return 'Инструкции';
    }
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 gap-1 h-auto p-1">
          <TabsTrigger 
            value="legal" 
            className="text-xs sm:text-sm py-2 px-2 sm:px-3 whitespace-nowrap overflow-hidden text-ellipsis"
          >
            <span className="hidden sm:inline">Нормативно-правовая база</span>
            <span className="sm:hidden">НПБ</span>
          </TabsTrigger>
          <TabsTrigger 
            value="custom" 
            className="text-xs sm:text-sm py-2 px-2 sm:px-3 whitespace-nowrap overflow-hidden text-ellipsis"
          >
            <span className="hidden sm:inline">Пользовательские инструкции</span>
            <span className="sm:hidden">Польз.</span>
          </TabsTrigger>
          <TabsTrigger 
            value="work" 
            className="text-xs sm:text-sm py-2 px-2 sm:px-3 whitespace-nowrap overflow-hidden text-ellipsis"
          >
            <span className="hidden sm:inline">Инструкции для редактирования</span>
            <span className="sm:hidden">Редакт.</span>
          </TabsTrigger>
        </TabsList>

        {['legal', 'custom', 'work'].map((type) => (
          <TabsContent key={type} value={type} className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">{getTypeLabel(type)}</h3>
              <Dialog open={isDialogOpen && editingInstruction?.type === type} onOpenChange={(open) => {
                if (!open) {
                  setIsDialogOpen(false);
                  setEditingInstruction(null);
                }
              }}>
                <DialogTrigger asChild>
                  <Button onClick={() => {
                    setEditingInstruction(createNewInstruction(type));
                    setIsDialogOpen(true);
                  }}>
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
                                    onClick={() => downloadFile(doc.id, doc.name)}
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
                                    onClick={() => downloadFile(doc.id, doc.name)}
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
        {getInstructionsByType(type).map((instruction) => (
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
        
        {getInstructionsByType(type).length === 0 && (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">
                Нет инструкций типа "{getTypeLabel(type)}"
              </p>
            </CardContent>
          </Card>
        )}
      </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}