import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { MOSCOW_DISTRICTS } from '@/constants/moscowDistricts';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

interface BulkEditOrganizationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedOrganizations: any[];
  onSave: (updates: Partial<any>) => Promise<void>;
  regions: Array<{ id: string; name: string }>;
}

export const BulkEditOrganizationsDialog: React.FC<BulkEditOrganizationsDialogProps> = ({
  open,
  onOpenChange,
  selectedOrganizations,
  onSave,
  regions
}) => {
  const [updates, setUpdates] = useState<Partial<any>>({});
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(updates);
      setUpdates({});
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const handleClear = () => {
    setUpdates({});
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Массовое редактирование ({selectedOrganizations.length} организаций)
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 mb-4">
            {selectedOrganizations.slice(0, 5).map(org => (
              <Badge key={org.id} variant="secondary">
                {org.name.length > 30 ? `${org.name.substring(0, 30)}...` : org.name}
              </Badge>
            ))}
            {selectedOrganizations.length > 5 && (
              <Badge variant="outline">
                +{selectedOrganizations.length - 5} ещё
              </Badge>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <Label>Регион</Label>
              <div className="flex gap-2">
                <Select 
                  value={updates.region_id || 'none'} 
                  onValueChange={(value) => setUpdates(prev => ({ ...prev, region_id: value === 'none' ? undefined : value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Не изменять" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Не изменять</SelectItem>
                    {regions.map((region) => (
                      <SelectItem key={region.id} value={region.id}>
                        {region.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {updates.region_id && (
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setUpdates(prev => ({ ...prev, region_id: undefined }))}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div>
              <Label>Округ</Label>
              <div className="flex gap-2">
                <Select 
                  value={updates.district || 'none'} 
                  onValueChange={(value) => setUpdates(prev => ({ ...prev, district: value === 'none' ? undefined : value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Не изменять" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Не изменять</SelectItem>
                    {MOSCOW_DISTRICTS.map((district) => (
                      <SelectItem key={district} value={district}>
                        {district}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {updates.district && (
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setUpdates(prev => ({ ...prev, district: undefined }))}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div>
              <Label>Тип организации</Label>
              <div className="flex gap-2">
                <Select 
                  value={updates.type || 'none'} 
                  onValueChange={(value) => setUpdates(prev => ({ ...prev, type: value === 'none' ? undefined : value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Не изменять" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Не изменять</SelectItem>
                    <SelectItem value="Школа">Школа</SelectItem>
                    <SelectItem value="Гимназия">Гимназия</SelectItem>
                    <SelectItem value="Лицей">Лицей</SelectItem>
                    <SelectItem value="Детский сад">Детский сад</SelectItem>
                    <SelectItem value="Образовательный комплекс">Образовательный комплекс</SelectItem>
                    <SelectItem value="Колледж">Колледж</SelectItem>
                    <SelectItem value="Техникум">Техникум</SelectItem>
                  </SelectContent>
                </Select>
                {updates.type && (
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setUpdates(prev => ({ ...prev, type: undefined }))}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div>
              <Label>№МРСД</Label>
              <div className="flex gap-2">
                <Input
                  value={updates.mrsd || ''}
                  onChange={(e) => setUpdates(prev => ({ ...prev, mrsd: e.target.value || undefined }))}
                  placeholder="Не изменять"
                />
                {updates.mrsd && (
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setUpdates(prev => ({ ...prev, mrsd: undefined }))}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {Object.keys(updates).length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Выберите поля для изменения
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClear} disabled={Object.keys(updates).length === 0}>
            Очистить
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={saving || Object.keys(updates).length === 0}
          >
            {saving ? 'Сохранение...' : `Применить к ${selectedOrganizations.length} орг.`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
