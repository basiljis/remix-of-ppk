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
import { Plus, Search, RotateCcw, Building2, MapPin, Filter, Download, Edit, Trash2, Database } from 'lucide-react';

import { MOSCOW_DISTRICTS } from '@/constants/moscowDistricts';
import { useToast } from '@/hooks/use-toast';
import { EducomOrganizationsList } from './EducomOrganizationsList';

export const OrganizationsManagement = () => {

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
          <EducomOrganizationsList />
        </CardContent>
      </Card>
    </div>
  );
};