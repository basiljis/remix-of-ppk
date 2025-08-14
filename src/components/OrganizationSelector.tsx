import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiService } from "@/services/apiService";
import { useToast } from "@/hooks/use-toast";

interface Organization {
  id: string;
  name: string;
  district: string;
  type: string;
}

interface OrganizationSelectorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
}

export const OrganizationSelector = ({ 
  value, 
  onChange, 
  label = "Образовательная организация",
  placeholder = "Выберите организацию" 
}: OrganizationSelectorProps) => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    setLoading(true);
    try {
      const response = await apiService.getActualEduorgs();
      setOrganizations(response.data.eduorgs);
    } catch (error) {
      console.error('Ошибка загрузки организаций:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить список организаций",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Label htmlFor="organization">{label}</Label>
      <Select value={value} onValueChange={onChange} disabled={loading}>
        <SelectTrigger>
          <SelectValue placeholder={loading ? "Загрузка..." : placeholder} />
        </SelectTrigger>
        <SelectContent>
          {organizations.map((org) => (
            <SelectItem key={org.id} value={org.name}>
              <div className="flex flex-col">
                <span>{org.name}</span>
                <span className="text-xs text-muted-foreground">
                  {org.district} • {org.type}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};