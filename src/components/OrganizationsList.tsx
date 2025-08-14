import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { apiService } from "@/services/apiService";
import { useToast } from "@/hooks/use-toast";
import { Building, MapPin, Search, RefreshCw } from "lucide-react";

interface Organization {
  id: string;
  name: string;
  district: string;
  type: string;
}

export const OrganizationsList = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [filteredOrganizations, setFilteredOrganizations] = useState<Organization[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    name: "",
    district: "",
    type: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    loadOrganizations();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [organizations, filters]);

  const loadOrganizations = async () => {
    setLoading(true);
    try {
      const response = await apiService.getActualEduorgs();
      const orgs = response.data.eduorgs;
      setOrganizations(orgs);
      
      // Извлекаем уникальные округа и типы
      const uniqueDistricts = [...new Set(orgs.map(org => org.district))].filter(Boolean);
      const uniqueTypes = [...new Set(orgs.map(org => org.type))].filter(Boolean);
      
      setDistricts(uniqueDistricts);
      setTypes(uniqueTypes);
      
      toast({
        title: "Данные загружены",
        description: `Загружено ${orgs.length} организаций`
      });
    } catch (error) {
      console.error('Ошибка загрузки организаций:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить данные организаций",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = organizations;

    if (filters.name) {
      filtered = filtered.filter(org => 
        org.name.toLowerCase().includes(filters.name.toLowerCase())
      );
    }

    if (filters.district) {
      filtered = filtered.filter(org => org.district === filters.district);
    }

    if (filters.type) {
      filtered = filtered.filter(org => org.type === filters.type);
    }

    setFilteredOrganizations(filtered);
  };

  const clearFilters = () => {
    setFilters({ name: "", district: "", type: "" });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            База данных образовательных организаций
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Фильтры */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="nameFilter">Поиск по названию</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="nameFilter"
                  placeholder="Введите название..."
                  value={filters.name}
                  onChange={(e) => setFilters(prev => ({ ...prev, name: e.target.value }))}
                  className="pl-8"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="districtFilter">Округ</Label>
              <Select 
                value={filters.district} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, district: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Все округа" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Все округа</SelectItem>
                  {districts.map(district => (
                    <SelectItem key={district} value={district}>{district}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="typeFilter">Тип организации</Label>
              <Select 
                value={filters.type} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Все типы" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Все типы</SelectItem>
                  {types.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end gap-2">
              <Button onClick={clearFilters} variant="outline" className="flex-1">
                Сбросить
              </Button>
              <Button onClick={loadOrganizations} disabled={loading} size="icon">
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {/* Статистика */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Всего организаций: {organizations.length}</span>
            <span>Отфильтровано: {filteredOrganizations.length}</span>
          </div>
        </CardContent>
      </Card>

      {/* Список организаций */}
      <div className="grid gap-4">
        {filteredOrganizations.map((org) => (
          <Card key={org.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">{org.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {org.district}
                    </div>
                    <Badge variant="secondary">{org.type}</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredOrganizations.length === 0 && !loading && (
        <Card>
          <CardContent className="p-8 text-center">
            <Building className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              {organizations.length === 0 
                ? "Нет загруженных организаций" 
                : "Нет организаций, соответствующих критериям поиска"
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};