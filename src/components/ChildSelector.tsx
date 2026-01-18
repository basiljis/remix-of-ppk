import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, UserPlus, Users } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface ChildData {
  id: string;
  full_name: string;
  birth_date: string | null;
  education_level: string | null;
  parent_name: string | null;
  parent_phone: string | null;
}

interface ChildSelectorProps {
  onSelect: (child: {
    fullName: string;
    birthDate: string;
    parentName: string;
    parentPhone: string;
  }) => void;
}

export function ChildSelector({ onSelect }: ChildSelectorProps) {
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const organizationId = profile?.organization_id;

  // Fetch children from children table
  const { data: childrenFromTable = [], isLoading: isLoadingChildren } =
    useQuery({
      queryKey: ["children-for-protocol", organizationId],
      queryFn: async () => {
        if (!organizationId) return [];
        const { data, error } = await supabase
          .from("children")
          .select("id, full_name, birth_date, education_level, parent_name, parent_phone")
          .eq("organization_id", organizationId)
          .eq("is_active", true)
          .order("full_name");
        if (error) throw error;
        return data as ChildData[];
      },
      enabled: !!organizationId && open,
    });

  // Fetch unique children from protocols
  const { data: childrenFromProtocols = [], isLoading: isLoadingProtocols } =
    useQuery({
      queryKey: ["children-from-protocols-for-select", organizationId],
      queryFn: async () => {
        if (!organizationId) return [];
        const { data, error } = await supabase
          .from("protocols")
          .select("child_name, child_birth_date, protocol_data")
          .eq("organization_id", organizationId)
          .order("created_at", { ascending: false });
        if (error) throw error;

        // Get unique children names from protocols
        const uniqueChildren = new Map<string, ChildData>();
        data?.forEach((p) => {
          const key = p.child_name?.toLowerCase();
          if (key && !uniqueChildren.has(key)) {
            const protocolData = p.protocol_data as {
              childData?: { parentName?: string; parentPhone?: string };
            } | null;
            uniqueChildren.set(key, {
              id: `protocol-${p.child_name}`,
              full_name: p.child_name,
              birth_date: p.child_birth_date,
              education_level: null,
              parent_name: protocolData?.childData?.parentName || null,
              parent_phone: protocolData?.childData?.parentPhone || null,
            });
          }
        });
        return Array.from(uniqueChildren.values());
      },
      enabled: !!organizationId && open,
    });

  // Combine and deduplicate
  const allChildren = useMemo(() => {
    const combined: ChildData[] = [...childrenFromTable];
    const existingNames = new Set(
      childrenFromTable.map((c) => c.full_name.toLowerCase())
    );

    childrenFromProtocols.forEach((pc) => {
      if (!existingNames.has(pc.full_name.toLowerCase())) {
        combined.push(pc);
      }
    });

    return combined.sort((a, b) => a.full_name.localeCompare(b.full_name));
  }, [childrenFromTable, childrenFromProtocols]);

  const filteredChildren = allChildren.filter((child) =>
    child.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isLoading = isLoadingChildren || isLoadingProtocols;

  const handleSelect = (child: ChildData) => {
    onSelect({
      fullName: child.full_name,
      birthDate: child.birth_date || "",
      parentName: child.parent_name || "",
      parentPhone: child.parent_phone || "",
    });
    setOpen(false);
    setSearchQuery("");
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-2"
      >
        <Users className="h-4 w-4" />
        Выбрать ребёнка
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Выбор ребёнка из базы
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Поиск по ФИО..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="rounded-md border max-h-[400px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ФИО ребёнка</TableHead>
                    <TableHead>Дата рождения</TableHead>
                    <TableHead>Родитель</TableHead>
                    <TableHead className="w-[100px]">Действие</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        Загрузка...
                      </TableCell>
                    </TableRow>
                  ) : filteredChildren.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center py-8 text-muted-foreground"
                      >
                        {searchQuery
                          ? "Ничего не найдено"
                          : "Нет детей в базе. Введите данные вручную."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredChildren.map((child) => (
                      <TableRow
                        key={child.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSelect(child)}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {child.full_name}
                            {child.id.startsWith("protocol-") && (
                              <Badge
                                variant="outline"
                                className="text-xs bg-amber-50 text-amber-700 border-amber-200"
                              >
                                из ППК
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {child.birth_date
                            ? format(new Date(child.birth_date), "dd.MM.yyyy", {
                                locale: ru,
                              })
                            : "—"}
                        </TableCell>
                        <TableCell>
                          {child.parent_name || "—"}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelect(child);
                            }}
                          >
                            Выбрать
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <p className="text-sm text-muted-foreground">
              Выберите ребёнка из списка или закройте окно для ввода данных вручную.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
