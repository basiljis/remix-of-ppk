import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Users, Baby } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, differenceInYears, differenceInMonths } from "date-fns";
import { ru } from "date-fns/locale";

interface ParentProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  is_blocked: boolean;
  created_at: string;
}

interface ParentChild {
  id: string;
  child_unique_id: string;
  full_name: string;
  gender: string | null;
  birth_date: string | null;
  education_level: string | null;
  class_or_group: string | null;
  school_name: string | null;
  created_at: string;
  parent_user_id: string;
  parent?: ParentProfile;
}

const educationLevelLabels: Record<string, string> = {
  DO: "ДО",
  NOO: "НОО",
  OOO: "ООО",
  SOO: "СОО",
};

export function ParentChildrenManagement() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: parents, isLoading: parentsLoading } = useQuery({
    queryKey: ["admin-parents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parent_profiles" as any)
        .select("*")
        .order("created_at", { ascending: false }) as { data: ParentProfile[] | null; error: any };

      if (error) throw error;
      return data || [];
    },
  });

  const { data: children, isLoading: childrenLoading } = useQuery({
    queryKey: ["admin-parent-children"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parent_children" as any)
        .select("*")
        .order("created_at", { ascending: false }) as { data: ParentChild[] | null; error: any };

      if (error) throw error;
      return data || [];
    },
  });

  const calculateAge = (birthDate: string) => {
    const birth = new Date(birthDate);
    const years = differenceInYears(new Date(), birth);
    const months = differenceInMonths(new Date(), birth) % 12;
    
    if (years === 0) return `${months} мес.`;
    return months > 0 ? `${years} л. ${months} м.` : `${years} л.`;
  };

  const getParentName = (parentId: string) => {
    const parent = parents?.find(p => p.id === parentId);
    return parent?.full_name || "—";
  };

  const filteredParents = parents?.filter(p =>
    p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.email.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const filteredChildren = children?.filter(c =>
    c.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.child_unique_id.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (parentsLoading || childrenLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Родители и дети</h2>
          <p className="text-muted-foreground">Пользователи, зарегистрированные через кабинет родителя</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="gap-1">
            <Users className="h-3 w-3" />
            {parents?.length || 0} родителей
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Baby className="h-3 w-3" />
            {children?.length || 0} детей
          </Badge>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Поиск по имени, email или ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <Tabs defaultValue="children" className="w-full">
        <TabsList>
          <TabsTrigger value="children">Дети ({filteredChildren.length})</TabsTrigger>
          <TabsTrigger value="parents">Родители ({filteredParents.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="children" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>ФИО ребёнка</TableHead>
                    <TableHead>Возраст</TableHead>
                    <TableHead>Уровень</TableHead>
                    <TableHead>Класс/Группа</TableHead>
                    <TableHead>Добавил (родитель)</TableHead>
                    <TableHead>Дата добавления</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredChildren.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Нет данных
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredChildren.map((child) => (
                      <TableRow key={child.id}>
                        <TableCell className="font-mono text-xs text-pink-600">
                          {child.child_unique_id}
                        </TableCell>
                        <TableCell className="font-medium">{child.full_name}</TableCell>
                        <TableCell>
                          {child.birth_date ? calculateAge(child.birth_date) : "—"}
                        </TableCell>
                        <TableCell>
                          {child.education_level ? (
                            <Badge variant="secondary">
                              {educationLevelLabels[child.education_level] || child.education_level}
                            </Badge>
                          ) : "—"}
                        </TableCell>
                        <TableCell>{child.class_or_group || "—"}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {getParentName(child.parent_user_id)}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {format(new Date(child.created_at), "dd.MM.yyyy", { locale: ru })}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="parents" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ФИО</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Телефон</TableHead>
                    <TableHead>Детей</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Дата регистрации</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredParents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Нет данных
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredParents.map((parent) => (
                      <TableRow key={parent.id}>
                        <TableCell className="font-medium">{parent.full_name}</TableCell>
                        <TableCell>{parent.email}</TableCell>
                        <TableCell>{parent.phone}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {children?.filter(c => c.parent_user_id === parent.id).length || 0}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {parent.is_blocked ? (
                            <Badge variant="destructive">Заблокирован</Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-green-100 text-green-800">Активен</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {format(new Date(parent.created_at), "dd.MM.yyyy", { locale: ru })}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
