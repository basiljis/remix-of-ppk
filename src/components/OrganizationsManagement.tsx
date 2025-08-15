import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Plus, Search, RotateCcw, Building2, MapPin, Filter, Download, Edit, Trash2 } from 'lucide-react';
import { useOrganizations } from '@/hooks/useOrganizations';
import { MOSCOW_DISTRICTS } from '@/constants/moscowDistricts';
import { useToast } from '@/hooks/use-toast';

export const OrganizationsManagement = () => {
  const { 
    organizations, 
    loading, 
    addOrganization, 
    updateOrganization,
    deleteOrganization,
    searchOrganizations, 
    syncEkisOrganizations 
  } = useOrganizations();
  const { toast } = useToast();
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgDistrict, setNewOrgDistrict] = useState('');
  const [newOrgType, setNewOrgType] = useState('');
  const [newOrgMrsd, setNewOrgMrsd] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Edit dialog state
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingOrg, setEditingOrg] = useState<any>(null);
  const [editOrgName, setEditOrgName] = useState('');
  const [editOrgDistrict, setEditOrgDistrict] = useState('');
  const [editOrgType, setEditOrgType] = useState('');
  const [editOrgMrsd, setEditOrgMrsd] = useState('');

  const handleAddOrganization = async () => {
    if (!newOrgName.trim()) return;

    try {
      await addOrganization({
        name: newOrgName,
        district: newOrgDistrict,
        type: newOrgType,
        mrsd: newOrgMrsd
      });
      
      setShowAddDialog(false);
      setNewOrgName('');
      setNewOrgDistrict('');
      setNewOrgType('');
      setNewOrgMrsd('');
    } catch (error) {
      console.error('Error adding organization:', error);
    }
  };

  const handleSyncEkis = async () => {
    setIsSyncing(true);
    try {
      await syncEkisOrganizations();
      toast({
        title: "Синхронизация завершена",
        description: "Данные из ЕКИС успешно загружены и сохранены в базу данных"
      });
    } catch (error) {
      toast({
        title: "Ошибка синхронизации", 
        description: "Не удалось загрузить данные из ЕКИС. Проверьте подключение к интернету.",
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleEditOrganization = (org: any) => {
    setEditingOrg(org);
    setEditOrgName(org.name);
    setEditOrgDistrict(org.district || '');
    setEditOrgType(org.type || '');
    setEditOrgMrsd(org.mrsd || '');
    setShowEditDialog(true);
  };

  const handleUpdateOrganization = async () => {
    if (!editOrgName.trim() || !editingOrg) return;

    try {
      await updateOrganization(editingOrg.id, {
        name: editOrgName,
        district: editOrgDistrict,
        type: editOrgType,
        mrsd: editOrgMrsd
      });
      
      setShowEditDialog(false);
      setEditingOrg(null);
      setEditOrgName('');
      setEditOrgDistrict('');
      setEditOrgType('');
      setEditOrgMrsd('');
    } catch (error) {
      console.error('Error updating organization:', error);
    }
  };

  const handleDeleteOrganization = async (orgId: string, orgName: string) => {
    if (window.confirm(`Вы уверены, что хотите удалить организацию "${orgName}"?`)) {
      try {
        await deleteOrganization(orgId);
      } catch (error) {
        console.error('Error deleting organization:', error);
      }
    }
  };

  // Apply all filters
  let filteredOrganizations = searchOrganizations(searchQuery);
  
  if (filterDistrict && filterDistrict !== 'all') {
    filteredOrganizations = filteredOrganizations.filter(org => 
      org.district === filterDistrict
    );
  }
  
  if (filterType && filterType !== 'all') {
    filteredOrganizations = filteredOrganizations.filter(org => 
      org.type === filterType
    );
  }

  const uniqueTypes = [...new Set(organizations.map(org => org.type).filter(Boolean))];
  const uniqueDistricts = [...new Set(organizations.map(org => org.district).filter(Boolean))];
  
  const manualOrganizations = organizations.filter(org => org.is_manual);
  const ekisOrganizations = organizations.filter(org => !org.is_manual);

  const clearFilters = () => {
    setSearchQuery('');
    setFilterDistrict('all');
    setFilterType('all');
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Управление организациями
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Добавить организацию
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Добавить новую организацию</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="new-org-name">Название организации *</Label>
                    <Input
                      id="new-org-name"
                      value={newOrgName}
                      onChange={(e) => setNewOrgName(e.target.value)}
                      placeholder="Введите название организации"
                    />
                  </div>
                  <div>
                    <Label htmlFor="new-org-district">Округ</Label>
                    <Select value={newOrgDistrict} onValueChange={setNewOrgDistrict}>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите округ" />
                      </SelectTrigger>
                      <SelectContent>
                        {MOSCOW_DISTRICTS.map((district) => (
                          <SelectItem key={district} value={district}>
                            {district}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="new-org-type">Тип организации</Label>
                    <Select value={newOrgType} onValueChange={setNewOrgType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите тип" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Школа">Школа</SelectItem>
                        <SelectItem value="Гимназия">Гимназия</SelectItem>
                        <SelectItem value="Лицей">Лицей</SelectItem>
                        <SelectItem value="Детский сад">Детский сад</SelectItem>
                        <SelectItem value="Образовательный комплекс">Образовательный комплекс</SelectItem>
                        <SelectItem value="Колледж">Колледж</SelectItem>
                        <SelectItem value="Техникум">Техникум</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="new-org-mrsd">№МРСД</Label>
                    <Input
                      id="new-org-mrsd"
                      value={newOrgMrsd}
                      onChange={(e) => setNewOrgMrsd(e.target.value)}
                      placeholder="Введите номер МРСД"
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                      Отмена
                    </Button>
                    <Button onClick={handleAddOrganization} disabled={!newOrgName.trim()}>
                      Добавить
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            <Button 
              variant="outline" 
              onClick={handleSyncEkis}
              disabled={isSyncing}
              className="flex items-center gap-2"
            >
              <RotateCcw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Синхронизация...' : 'Синхронизировать с ЕКИС'}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Обновить список
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Статистика
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="text-2xl font-bold">{organizations.length}</div>
              <div className="text-sm text-muted-foreground">Всего организаций</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-green-600">{ekisOrganizations.length}</div>
              <div className="text-sm text-muted-foreground">Из ЕКИС</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-blue-600">{manualOrganizations.length}</div>
              <div className="text-sm text-muted-foreground">Добавлено вручную</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-purple-600">{uniqueDistricts.length}</div>
              <div className="text-sm text-muted-foreground">Округов Москвы</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Фильтры и поиск
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по названию, ID, МРСД..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            
            <Select value={filterDistrict} onValueChange={setFilterDistrict}>
              <SelectTrigger>
                <SelectValue placeholder="Все округа" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все округа</SelectItem>
                {uniqueDistricts.filter(district => district && district.trim() !== '').map((district) => (
                  <SelectItem key={district} value={district}>
                    {district}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue placeholder="Все типы" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все типы</SelectItem>
                {uniqueTypes.filter(type => type && type.trim() !== '').map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button variant="outline" onClick={clearFilters}>
              Очистить фильтры
            </Button>
          </div>
          
          <div className="mt-4 text-sm text-muted-foreground">
            Показано: {filteredOrganizations.length} из {organizations.length} организаций
          </div>
        </CardContent>
      </Card>

      {/* Organizations List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Список организаций
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Загрузка организаций...</p>
            </div>
          ) : filteredOrganizations.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchQuery || filterDistrict || filterType
                  ? "Организации не найдены по заданным критериям"
                  : "Нет организаций в базе данных"
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOrganizations.map((org) => (
                <div 
                  key={org.id} 
                  className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium">{org.name}</h3>
                        <Badge variant={org.is_manual ? "default" : "secondary"}>
                          {org.is_manual ? "Ручное" : "ЕКИС"}
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-muted-foreground space-y-1">
                        {org.external_id && (
                          <div>ID: {org.external_id}</div>
                        )}
                        {org.mrsd && (
                          <div>№МРСД: {org.mrsd}</div>
                        )}
                        {org.district && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {org.district}
                          </div>
                        )}
                        {org.type && (
                          <div>Тип: {org.type}</div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditOrganization(org)}
                        className="flex items-center gap-1"
                      >
                        <Edit className="h-3 w-3" />
                        Редактировать
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteOrganization(org.id, org.name)}
                        className="flex items-center gap-1 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                        Удалить
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Organization Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать организацию</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-org-name">Название организации *</Label>
              <Input
                id="edit-org-name"
                value={editOrgName}
                onChange={(e) => setEditOrgName(e.target.value)}
                placeholder="Введите название организации"
              />
            </div>
            <div>
              <Label htmlFor="edit-org-district">Округ</Label>
              <Select value={editOrgDistrict} onValueChange={setEditOrgDistrict}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите округ" />
                </SelectTrigger>
                <SelectContent>
                  {MOSCOW_DISTRICTS.map((district) => (
                    <SelectItem key={district} value={district}>
                      {district}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-org-type">Тип организации</Label>
              <Select value={editOrgType} onValueChange={setEditOrgType}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите тип" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Школа">Школа</SelectItem>
                  <SelectItem value="Гимназия">Гимназия</SelectItem>
                  <SelectItem value="Лицей">Лицей</SelectItem>
                  <SelectItem value="Детский сад">Детский сад</SelectItem>
                  <SelectItem value="Образовательный комплекс">Образовательный комплекс</SelectItem>
                  <SelectItem value="Колледж">Колледж</SelectItem>
                  <SelectItem value="Техникум">Техникум</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-org-mrsd">№МРСД</Label>
              <Input
                id="edit-org-mrsd"
                value={editOrgMrsd}
                onChange={(e) => setEditOrgMrsd(e.target.value)}
                placeholder="Введите номер МРСД"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Отмена
              </Button>
              <Button onClick={handleUpdateOrganization} disabled={!editOrgName.trim()}>
                Сохранить
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};