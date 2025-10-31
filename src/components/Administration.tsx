import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building, Settings, Download, Upload, FileSpreadsheet, FileText, Users, BarChart3 } from "lucide-react";
import { AdminPanel } from "@/components/AdminPanel";
import { InstructionsEditor } from "@/components/InstructionsEditor";
import { OrganizationsManagement } from "@/components/OrganizationsManagement";
import { UserManagementEnhanced } from "@/components/UserManagementEnhanced";
import { AccessRequestsManagement } from "@/components/AccessRequestsManagement";
import { AdminStatisticsPanel } from "@/components/AdminStatisticsPanel";
import { SchoolYearsManagement } from "@/components/SchoolYearsManagement";
import { useToast } from "@/hooks/use-toast";
import { useState, useRef } from "react";
import {
  exportOrganizationsTemplate,
  exportOrganizationsData,
  importOrganizationsFromXLS,
  exportProtocolChecklistTemplate,
  exportProtocolChecklistData,
  importProtocolChecklistFromXLS
} from "@/utils/xlsUtils";

interface AdministrationProps {
  activeSubTab?: string;
}

export const Administration = ({ activeSubTab = "access-requests" }: AdministrationProps) => {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const orgFileInputRef = useRef<HTMLInputElement>(null);
  const checklistFileInputRef = useRef<HTMLInputElement>(null);

  const handleExportOrgTemplate = () => {
    try {
      exportOrganizationsTemplate();
      toast({
        title: "Шаблон экспортирован",
        description: "Шаблон для организаций успешно скачан"
      });
    } catch (error) {
      toast({
        title: "Ошибка экспорта",
        description: "Не удалось экспортировать шаблон",
        variant: "destructive"
      });
    }
  };

  const handleExportOrgData = async () => {
    setIsExporting(true);
    try {
      await exportOrganizationsData();
      toast({
        title: "Данные экспортированы",
        description: "Все данные организаций успешно экспортированы"
      });
    } catch (error) {
      toast({
        title: "Ошибка экспорта",
        description: "Не удалось экспортировать данные",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportOrgData = async (file: File) => {
    setIsImporting(true);
    try {
      const count = await importOrganizationsFromXLS(file);
      toast({
        title: "Данные импортированы",
        description: `Успешно импортировано ${count} организаций`
      });
    } catch (error) {
      toast({
        title: "Ошибка импорта",
        description: "Не удалось импортировать данные. Проверьте формат файла.",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleExportChecklistTemplate = () => {
    try {
      exportProtocolChecklistTemplate();
      toast({
        title: "Шаблон экспортирован",
        description: "Шаблон для чеклиста протокола успешно скачан"
      });
    } catch (error) {
      toast({
        title: "Ошибка экспорта",
        description: "Не удалось экспортировать шаблон",
        variant: "destructive"
      });
    }
  };

  const handleExportChecklistData = async () => {
    setIsExporting(true);
    try {
      await exportProtocolChecklistData();
      toast({
        title: "Данные экспортированы",
        description: "Все данные чеклиста протокола успешно экспортированы"
      });
    } catch (error) {
      toast({
        title: "Ошибка экспорта",
        description: "Не удалось экспортировать данные",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportChecklistData = async (file: File) => {
    setIsImporting(true);
    try {
      const count = await importProtocolChecklistFromXLS(file);
      toast({
        title: "Данные импортированы",
        description: `Успешно импортировано ${count} элементов чеклиста`
      });
    } catch (error) {
      toast({
        title: "Ошибка импорта",
        description: "Не удалось импортировать данные. Проверьте формат файла.",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-4">
          Администрирование системы
        </h2>
        <p className="text-muted-foreground">
          Управление организациями, настройка чеклистов протокола ППк и редактирование инструкций
        </p>
      </div>

      {activeSubTab === "access-requests" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Заявки на доступ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Рассмотрение и одобрение заявок пользователей на получение доступа к системе
              </p>
            </CardContent>
          </Card>
          <AccessRequestsManagement />
        </div>
      )}

      {activeSubTab === "users" && (
        <div className="space-y-6">
          <UserManagementEnhanced />
        </div>
      )}

      {activeSubTab === "organizations" && (
        <div className="space-y-6">
          <Card>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Просмотр, добавление и редактирование образовательных организаций в системе
              </p>
              
              {/* Export/Import buttons for Organizations */}
              <div className="flex flex-wrap gap-3 border-t pt-4">
                <Button
                  variant="outline"
                  onClick={handleExportOrgTemplate}
                  className="flex items-center gap-2"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Скачать шаблон XLS
                </Button>
                
                <Button
                  variant="outline"
                  onClick={handleExportOrgData}
                  disabled={isExporting}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  {isExporting ? 'Экспорт...' : 'Экспортировать все данные'}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => orgFileInputRef.current?.click()}
                  disabled={isImporting}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  {isImporting ? 'Импорт...' : 'Импортировать из XLS'}
                </Button>
                
                <input
                  ref={orgFileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleImportOrgData(file);
                      e.target.value = '';
                    }
                  }}
                />
              </div>
            </CardContent>
          </Card>
          <OrganizationsManagement />
        </div>
      )}

      {activeSubTab === "checklist" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Управление чеклистом протокола
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Настройка элементов чеклиста для различных уровней образования
              </p>
              
              {/* Export/Import buttons for Protocol Checklist */}
              <div className="flex flex-wrap gap-3 border-t pt-4">
                <Button
                  variant="outline"
                  onClick={handleExportChecklistTemplate}
                  className="flex items-center gap-2"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Скачать шаблон XLS
                </Button>
                
                <Button
                  variant="outline"
                  onClick={handleExportChecklistData}
                  disabled={isExporting}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  {isExporting ? 'Экспорт...' : 'Экспортировать все данные'}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => checklistFileInputRef.current?.click()}
                  disabled={isImporting}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  {isImporting ? 'Импорт...' : 'Импортировать из XLS'}
                </Button>
                
                <input
                  ref={checklistFileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleImportChecklistData(file);
                      e.target.value = '';
                    }
                  }}
                />
              </div>
            </CardContent>
          </Card>
          <AdminPanel />
        </div>
      )}

      {activeSubTab === "instructions" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Управление инструкциями
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Создание, редактирование и управление пользовательскими инструкциями для отображения в разделе "Инструкции"
              </p>
            </CardContent>
          </Card>
          <InstructionsEditor />
        </div>
      )}

      {activeSubTab === "statistics" && (
        <div className="space-y-6">
          <AdminStatisticsPanel />
        </div>
      )}

      {activeSubTab === "school-years" && (
        <div className="space-y-6">
          <SchoolYearsManagement />
        </div>
      )}
    </div>
  );
};