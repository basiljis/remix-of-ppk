import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useOrganizations, Organization } from '@/hooks/useOrganizations';
interface OrganizationSelectorProps {
  value?: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  regionFilter?: string;
  disabled?: boolean;
}
export const OrganizationSelector: React.FC<OrganizationSelectorProps> = ({
  value,
  onChange,
  label = "Образовательная организация",
  placeholder = "Выберите организацию",
  regionFilter,
  disabled = false
}) => {
  const {
    organizations,
    loading,
    searchOrganizations
  } = useOrganizations();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter organizations by region if regionFilter is provided
  let filteredOrganizations = searchOrganizations(searchQuery);
  if (regionFilter) {
    filteredOrganizations = filteredOrganizations.filter(org => org.region_id === regionFilter);
  }
  const selectedOrg = organizations.find(org => org.id === value);
  return <div className="space-y-2">
      <Label>{label}</Label>
      <div className="w-full">
        <Select value={value} onValueChange={onChange} disabled={loading || disabled}>
          <SelectTrigger>
            <SelectValue placeholder={loading ? "Загрузка..." : placeholder}>
              {selectedOrg ? <div className="flex flex-col text-left">
                  <span className="font-medium">{selectedOrg.name}</span>
                  {selectedOrg.district && <span className="text-sm text-muted-foreground">
                      {selectedOrg.district} • {selectedOrg.type}
                      {selectedOrg.is_manual && " (добавлено вручную)"}
                    </span>}
                </div> : null}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-background border border-border">
            <div className="p-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Поиск по названию, округу или номеру..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-8" />
              </div>
            </div>
            
            {filteredOrganizations.filter(org => org.id && org.id.trim() !== '' && org.name && org.name.trim() !== '').map(org => <SelectItem key={org.id} value={org.id}>
                  <div className="flex flex-col w-full">
                    <span className="font-medium">{org.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {org.external_id && `№${org.external_id} • `}
                      {org.district} • {org.type}
                      {org.is_manual && " (добавлено вручную)"}
                    </span>
                  </div>
                </SelectItem>)}
            
            {filteredOrganizations.length === 0 && searchQuery && <div className="p-2 text-center text-muted-foreground">
                Организации не найдены. Добавьте новую организацию в разделе "Организации"
              </div>}
            
            {organizations.length === 0 && !loading && <div className="p-2 text-center text-muted-foreground">
                Нет доступных организаций. Перейдите в раздел "Организации" для добавления
              </div>}
          </SelectContent>
        </Select>
      </div>
      
      {!selectedOrg && organizations.length > 0 && <p className="text-xs text-muted-foreground">Не нашли нужную организацию? Обратитесь к администратору или выберите Иное</p>}
    </div>;
};