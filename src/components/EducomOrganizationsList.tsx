import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RefreshCw, Search, Building2, MapPin, Phone, Mail, Globe, History } from 'lucide-react';
import { useEducomApi, type EducomOrganization, type OrganizationFilters } from '@/hooks/useEducomApi';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';

export const EducomOrganizationsList: React.FC = () => {
  const { loading, organizations, syncOrganizations, fetchOrganizations, getStatusLabel, getStatusColor } = useEducomApi();
  const [filters, setFilters] = useState<OrganizationFilters>({});
  const [expandedOrgs, setExpandedOrgs] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const handleSync = async () => {
    await syncOrganizations();
    await fetchOrganizations(filters);
  };

  const handleFilterChange = (key: keyof OrganizationFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    fetchOrganizations(newFilters);
  };

  const clearFilters = () => {
    setFilters({});
    fetchOrganizations();
  };

  const toggleExpanded = (orgId: string) => {
    const newExpanded = new Set(expandedOrgs);
    if (newExpanded.has(orgId)) {
      newExpanded.delete(orgId);
    } else {
      newExpanded.add(orgId);
    }
    setExpandedOrgs(newExpanded);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Не указано';
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  return (
    <div className="space-y-6">
      {/* Управление и фильтры */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Образовательные организации ЕКИС
              </CardTitle>
              <CardDescription>
                Данные из системы ЕКИС с детальной информацией и историей изменений
              </CardDescription>
            </div>
            <Button onClick={handleSync} disabled={loading} className="w-full sm:w-auto">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Синхронизировать с ЕКИС
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Фильтры */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по названию, ЕКИС ID..."
                className="pl-10"
                value={filters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
            
            <Select value={filters.status_id?.toString() || ''} onValueChange={(value) => 
              handleFilterChange('status_id', value ? parseInt(value) : undefined)
            }>
              <SelectTrigger>
                <SelectValue placeholder="Статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Все статусы</SelectItem>
                <SelectItem value="1">Действует</SelectItem>
                <SelectItem value="2">В стадии открытия</SelectItem>
                <SelectItem value="3">В стадии закрытия</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.is_archived?.toString() || ''} onValueChange={(value) => 
              handleFilterChange('is_archived', value === 'true' ? true : value === 'false' ? false : undefined)
            }>
              <SelectTrigger>
                <SelectValue placeholder="Архивность" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Все</SelectItem>
                <SelectItem value="false">Активные</SelectItem>
                <SelectItem value="true">Архивные</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.has_education_activity?.toString() || ''} onValueChange={(value) => 
              handleFilterChange('has_education_activity', value === 'true' ? true : value === 'false' ? false : undefined)
            }>
              <SelectTrigger>
                <SelectValue placeholder="Образовательная деятельность" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Все</SelectItem>
                <SelectItem value="true">Есть</SelectItem>
                <SelectItem value="false">Нет</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Найдено: {organizations.length} организаций
            </span>
            <Button variant="outline" onClick={clearFilters} size="sm">
              Сбросить фильтры
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Список организаций */}
      <div className="space-y-4">
        {loading && organizations.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              Загрузка данных...
            </CardContent>
          </Card>
        ) : organizations.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <div className="text-center">
                <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Организации не найдены</p>
                <Button variant="outline" onClick={handleSync} className="mt-4">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Синхронизировать с ЕКИС
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          organizations.map((org) => (
            <Card key={org.id} className="overflow-hidden">
              <Collapsible
                open={expandedOrgs.has(org.id)}
                onOpenChange={() => toggleExpanded(org.id)}
              >
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-base line-clamp-2">
                            {org.full_name || org.name}
                          </CardTitle>
                          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${
                            expandedOrgs.has(org.id) ? 'rotate-180' : ''
                          }`} />
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mb-2">
                          <Badge variant={getStatusColor(org.status_id, org.is_archived)}>
                            {org.is_archived ? 'АРХИВ' : getStatusLabel(org.status_id)}
                          </Badge>
                          {org.ekis_id && (
                            <Badge variant="outline">ЕКИС: {org.ekis_id}</Badge>
                          )}
                          {!org.has_education_activity && (
                            <Badge variant="secondary">Без образ. деятельности</Badge>
                          )}
                          {org.is_manual && (
                            <Badge variant="outline">Ручной ввод</Badge>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          {org.district && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {org.district}
                            </span>
                          )}
                          {org.type && (
                            <span className="flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {org.type}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <Separator className="mb-4" />
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Основная информация */}
                      <div className="space-y-4">
                        <h4 className="font-medium text-sm">Основная информация</h4>
                        
                        {org.short_name && org.short_name !== org.name && (
                          <div>
                            <span className="text-xs text-muted-foreground">Краткое название:</span>
                            <p className="text-sm">{org.short_name}</p>
                          </div>
                        )}

                        {org.parent_organization && (
                          <div>
                            <span className="text-xs text-muted-foreground">Подчинение:</span>
                            <p className="text-sm">{org.parent_organization}</p>
                          </div>
                        )}

                        {/* Контакты */}
                        <div className="space-y-2">
                          {org.phone && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-3 w-3" />
                              <a href={`tel:${org.phone}`} className="hover:underline">
                                {org.phone}
                              </a>
                            </div>
                          )}
                          {org.email && (
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="h-3 w-3" />
                              <a href={`mailto:${org.email}`} className="hover:underline">
                                {org.email}
                              </a>
                            </div>
                          )}
                          {org.website && (
                            <div className="flex items-center gap-2 text-sm">
                              <Globe className="h-3 w-3" />
                              <a href={org.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                {org.website}
                              </a>
                            </div>
                          )}
                        </div>

                        <div className="text-xs text-muted-foreground">
                          Последняя синхронизация: {formatDate(org.last_sync_at)}
                        </div>
                      </div>

                      {/* Адреса и история */}
                      <div className="space-y-4">
                        {/* Адреса */}
                        {org.organization_addresses.length > 0 && (
                          <div>
                            <h4 className="font-medium text-sm mb-2">Адреса</h4>
                            <div className="space-y-2">
                              {org.organization_addresses.map((address) => (
                                <div key={address.id} className="p-2 bg-muted/50 rounded text-sm">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <p className="font-medium">{address.full_address}</p>
                                      {address.metro_station && (
                                        <p className="text-xs text-muted-foreground">
                                          М. {address.metro_station}
                                        </p>
                                      )}
                                    </div>
                                    {address.is_main_building && (
                                      <Badge variant="secondary" className="text-xs">
                                        Главное здание
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* История реорганизаций */}
                        {org.organization_reorganizations.length > 0 && (
                          <div>
                            <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
                              <History className="h-3 w-3" />
                              История реорганизаций
                            </h4>
                            <div className="space-y-2">
                              {org.organization_reorganizations.map((reorg) => (
                                <div key={reorg.id} className="p-2 bg-muted/50 rounded text-sm">
                                  <p className="font-medium">{reorg.event_type_name}</p>
                                  {reorg.event_comments && (
                                    <p className="text-xs text-muted-foreground">{reorg.event_comments}</p>
                                  )}
                                  {(reorg.ekis_in || reorg.ekis_out) && (
                                    <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                                      {reorg.ekis_in && <span>Входящий: {reorg.ekis_in}</span>}
                                      {reorg.ekis_out && <span>Исходящий: {reorg.ekis_out}</span>}
                                    </div>
                                  )}
                                  {reorg.event_date && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Дата: {formatDate(reorg.event_date)}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};