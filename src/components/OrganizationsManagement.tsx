import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, RotateCcw, Building2, MapPin, Filter, Download, Edit, Trash2, Database, CheckSquare, Square } from 'lucide-react';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { useOrganizations } from '@/hooks/useOrganizations';
import { MOSCOW_DISTRICTS } from '@/constants/moscowDistricts';
import { useToast } from '@/hooks/use-toast';
import { EducomOrganizationsList } from './EducomOrganizationsList';
import { BulkEditOrganizationsDialog } from './BulkEditOrganizationsDialog';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import { Switch } from '@/components/ui/switch';

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
  const [newOrgRegion, setNewOrgRegion] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [isSyncing, setIsSyncing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Edit dialog state
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingOrg, setEditingOrg] = useState<any>(null);
  const [editOrgName, setEditOrgName] = useState('');
  const [editOrgDistrict, setEditOrgDistrict] = useState('');
  const [editOrgType, setEditOrgType] = useState('');
  const [editOrgMrsd, setEditOrgMrsd] = useState('');
  const [editOrgRegion, setEditOrgRegion] = useState('');
  const [editOrgExtId, setEditOrgExtId] = useState('');
  const [editOrgAddress, setEditOrgAddress] = useState('');
  const [editOrgPhone, setEditOrgPhone] = useState('');
  const [editOrgEmail, setEditOrgEmail] = useState('');
  const [editOrgWebsite, setEditOrgWebsite] = useState('');
  
  // Bulk edit state
  const [selectedOrgs, setSelectedOrgs] = useState<Set<string>>(new Set());
  const [showBulkEditDialog, setShowBulkEditDialog] = useState(false);
  
  // API toggle
  const [hideApiOrgs, setHideApiOrgs] = useState(false);
  
  // Regions data
  const [regions, setRegions] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    loadRegions();
  }, []);

  const loadRegions = async () => {
    const { data } = await supabase.from('regions').select('*').order('name');
    if (data) setRegions(data);
  };

  const handleAddOrganization = async () => {
    if (!newOrgName.trim()) return;

    try {
      await addOrganization({
        name: newOrgName,
        district: newOrgDistrict,
        type: newOrgType,
        mrsd: newOrgMrsd,
        region_id: newOrgRegion
      });
      
      setShowAddDialog(false);
      setNewOrgName('');
      setNewOrgDistrict('');
      setNewOrgType('');
      setNewOrgMrsd('');
      setNewOrgRegion('');
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
    setEditOrgRegion(org.region_id || '');
    setEditOrgExtId(org.external_id || '');
    setEditOrgAddress(org.address || '');
    setEditOrgPhone(org.phone || '');
    setEditOrgEmail(org.email || '');
    setEditOrgWebsite(org.website || '');
    setShowEditDialog(true);
  };

  const handleUpdateOrganization = async () => {
    if (!editOrgName.trim() || !editingOrg) return;

    try {
      await updateOrganization(editingOrg.id, {
        name: editOrgName,
        district: editOrgDistrict,
        type: editOrgType,
        mrsd: editOrgMrsd,
        region_id: editOrgRegion,
        external_id: editOrgExtId || null,
        address: editOrgAddress || null,
        phone: editOrgPhone || null,
        email: editOrgEmail || null,
        website: editOrgWebsite || null
      });
      
      setShowEditDialog(false);
      setEditingOrg(null);
      setEditOrgName('');
      setEditOrgDistrict('');
      setEditOrgType('');
      setEditOrgMrsd('');
      setEditOrgRegion('');
      setEditOrgExtId('');
      setEditOrgAddress('');
      setEditOrgPhone('');
      setEditOrgEmail('');
      setEditOrgWebsite('');
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
  
  // Filter out API organizations if toggle is on
  if (hideApiOrgs) {
    filteredOrganizations = filteredOrganizations.filter(org => org.is_manual);
  }
  
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
    setCurrentPage(1);
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredOrganizations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrganizations = filteredOrganizations.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const toggleSelectOrg = (orgId: string) => {
    const newSelected = new Set(selectedOrgs);
    if (newSelected.has(orgId)) {
      newSelected.delete(orgId);
    } else {
      newSelected.add(orgId);
    }
    setSelectedOrgs(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedOrgs.size === paginatedOrganizations.length) {
      setSelectedOrgs(new Set());
    } else {
      setSelectedOrgs(new Set(paginatedOrganizations.map(org => org.id)));
    }
  };

  const handleBulkEdit = async (updates: Partial<any>) => {
    try {
      const orgIds = Array.from(selectedOrgs);
      
      for (const orgId of orgIds) {
        await updateOrganization(orgId, updates);
      }
      
      toast({
        title: "Массовое обновление завершено",
        description: `Обновлено ${orgIds.length} организаций`
      });
      
      setSelectedOrgs(new Set());
    } catch (error) {
      console.error('Bulk edit error:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить все организации",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Управление организациями
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="ekis" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="ekis" className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                ЕКИС API
              </TabsTrigger>
              <TabsTrigger value="manual" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Ручное управление
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="ekis" className="mt-6">
              <EducomOrganizationsList />
            </TabsContent>
            
            <TabsContent value="manual" className="mt-6">
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
                        <SelectItem value="Психологический центр">Психологический центр</SelectItem>
                        <SelectItem value="Центр реабилитации">Центр реабилитации</SelectItem>
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
                  <div>
                    <Label htmlFor="new-org-region">Регион</Label>
                    <Select value={newOrgRegion} onValueChange={setNewOrgRegion}>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите регион" />
                      </SelectTrigger>
                      <SelectContent>
                        {regions.map((region) => (
                          <SelectItem key={region.id} value={region.id}>
                            {region.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
          
          <div className="flex items-center justify-between mt-4 gap-4">
            <div className="flex items-center gap-2">
              <Switch
                id="hide-api-orgs"
                checked={hideApiOrgs}
                onCheckedChange={setHideApiOrgs}
              />
              <Label htmlFor="hide-api-orgs" className="text-sm cursor-pointer">
                Скрыть организации из ЕКИС API
              </Label>
            </div>
            <span className="text-sm text-muted-foreground">
              Показано: {paginatedOrganizations.length} из {filteredOrganizations.length} организаций
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Organizations List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Список организаций
            </CardTitle>
            {selectedOrgs.size > 0 && (
              <Button onClick={() => setShowBulkEditDialog(true)}>
                Редактировать {selectedOrgs.size} организаций
              </Button>
            )}
          </div>
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
            <>
              {paginatedOrganizations.length > 0 && (
                <div className="mb-3 flex items-center gap-2 p-2 bg-muted/30 rounded">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleSelectAll}
                    className="flex items-center gap-2"
                  >
                    {selectedOrgs.size === paginatedOrganizations.length ? (
                      <CheckSquare className="h-4 w-4" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                    Выбрать все на странице
                  </Button>
                  {selectedOrgs.size > 0 && (
                    <span className="text-sm text-muted-foreground">
                      Выбрано: {selectedOrgs.size}
                    </span>
                  )}
                </div>
              )}
              
              <div className="space-y-3">
                {paginatedOrganizations.map((org, index) => (
                <div 
                  key={org.id} 
                  className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="mt-1 h-8 w-8"
                      onClick={() => toggleSelectOrg(org.id)}
                      aria-label={selectedOrgs.has(org.id) ? "Снять выделение организации" : "Выделить организацию"}
                    >
                      {selectedOrgs.has(org.id) ? (
                        <CheckSquare className="h-4 w-4" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </Button>
                    
                    <div className="flex-1">
                       <div className="flex items-center gap-2 mb-2">
                         <h3 className="font-medium">#{startIndex + index + 1}. {org.name}</h3>
                         <Badge variant={org.is_manual ? "default" : "secondary"}>
                           {org.is_manual ? "Ручное" : "ЕКИС"}
                         </Badge>
                       </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                        {org.external_id && <div>ID: {org.external_id}</div>}
                        {org.mrsd && <div>№МРСД: {org.mrsd}</div>}
                        {org.district && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {org.district}
                          </div>
                        )}
                        {org.type && <div>Тип: {org.type}</div>}
                        {org.address && <div className="col-span-2">Адрес: {org.address}</div>}
                        {org.phone && <div>Телефон: {org.phone}</div>}
                        {org.email && <div>Email: {org.email}</div>}
                        {org.website && (
                          <div className="col-span-2">
                            Сайт: <a href={org.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{org.website}</a>
                          </div>
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
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 flex justify-center">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                      
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        let pageNumber;
                        if (totalPages <= 5) {
                          pageNumber = i + 1;
                        } else if (currentPage <= 3) {
                          pageNumber = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNumber = totalPages - 4 + i;
                        } else {
                          pageNumber = currentPage - 2 + i;
                        }
                        
                        return (
                          <PaginationItem key={pageNumber}>
                            <PaginationLink
                              onClick={() => handlePageChange(pageNumber)}
                              isActive={currentPage === pageNumber}
                              className="cursor-pointer"
                            >
                              {pageNumber}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
                      
                      {totalPages > 5 && currentPage < totalPages - 2 && (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}
                      
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
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
              <Label htmlFor="edit-org-ext-id">Внешний ID</Label>
              <Input
                id="edit-org-ext-id"
                value={editOrgExtId}
                onChange={(e) => setEditOrgExtId(e.target.value)}
                placeholder="Внешний идентификатор"
              />
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
                  <SelectItem value="Психологический центр">Психологический центр</SelectItem>
                  <SelectItem value="Центр реабилитации">Центр реабилитации</SelectItem>
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
            <div>
              <Label htmlFor="edit-org-region">Регион</Label>
              <Select value={editOrgRegion} onValueChange={setEditOrgRegion}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите регион" />
                </SelectTrigger>
                <SelectContent>
                  {regions.map((region) => (
                    <SelectItem key={region.id} value={region.id}>
                      {region.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-org-address">Адрес</Label>
              <Input
                id="edit-org-address"
                value={editOrgAddress}
                onChange={(e) => setEditOrgAddress(e.target.value)}
                placeholder="Полный адрес организации"
              />
            </div>
            <div>
              <Label htmlFor="edit-org-phone">Телефон</Label>
              <Input
                id="edit-org-phone"
                value={editOrgPhone}
                onChange={(e) => setEditOrgPhone(e.target.value)}
                placeholder="+7 (XXX) XXX-XX-XX"
              />
            </div>
            <div>
              <Label htmlFor="edit-org-email">Email</Label>
              <Input
                id="edit-org-email"
                type="email"
                value={editOrgEmail}
                onChange={(e) => setEditOrgEmail(e.target.value)}
                placeholder="email@example.com"
              />
            </div>
            <div>
              <Label htmlFor="edit-org-website">Веб-сайт</Label>
              <Input
                id="edit-org-website"
                value={editOrgWebsite}
                onChange={(e) => setEditOrgWebsite(e.target.value)}
                placeholder="https://example.com"
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

      {/* Bulk Edit Dialog */}
      <BulkEditOrganizationsDialog
        open={showBulkEditDialog}
        onOpenChange={setShowBulkEditDialog}
        selectedOrganizations={Array.from(selectedOrgs).map(id => organizations.find(org => org.id === id)).filter(Boolean)}
        onSave={handleBulkEdit}
        regions={regions}
      />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};