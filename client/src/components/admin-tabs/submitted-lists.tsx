import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Checklist, Category } from "@shared/schema";
import { STORES } from "@/lib/types";

export default function SubmittedLists() {
  const [storeFilter, setStoreFilter] = useState<string>("alle");
  const [dateFilter, setDateFilter] = useState<string>("heute");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: checklists, isLoading } = useQuery<Checklist[]>({
    queryKey: ["/api/checklists", storeFilter, dateFilter],
    queryFn: async () => {
      let url = "/api/checklists";
      const params = new URLSearchParams();
      
      if (storeFilter !== "alle") {
        params.append("store", storeFilter);
      }
      
      if (dateFilter !== "alle") {
        const now = new Date();
        if (dateFilter === "heute") {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          params.append("startDate", today.toISOString());
          params.append("endDate", new Date().toISOString());
        } else if (dateFilter === "woche") {
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - 7);
          params.append("startDate", weekStart.toISOString());
          params.append("endDate", now.toISOString());
        }
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await fetch(url);
      return response.json();
    },
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['/api/categories']
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/checklists/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/checklists"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Erfolgreich gelöscht",
        description: "Die Checkliste wurde erfolgreich gelöscht.",
      });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Die Checkliste konnte nicht gelöscht werden.",
        variant: "destructive",
      });
    },
  });

  const deleteChecklist = (id: string) => {
    if (confirm("Sind Sie sicher, dass Sie diese Checkliste löschen möchten?")) {
      deleteMutation.mutate(id);
    }
  };

  const getShiftBadgeVariant = (shift: string) => {
    return shift === "schichtanfang" ? "default" : "destructive";
  };

  const getShiftLabel = (shift: string) => {
    return shift === "schichtanfang" ? "Schichtanfang" : "Schichtende";
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium">Eingereichte Checklisten</h3>
        <div className="flex space-x-3">
          <Select value={storeFilter} onValueChange={setStoreFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="alle">Alle Filialen</SelectItem>
              {STORES.map(store => (
                <SelectItem key={store} value={store}>{store}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="heute">Heute</SelectItem>
              <SelectItem value="woche">Diese Woche</SelectItem>
              <SelectItem value="alle">Alle Zeit</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-sm text-gray-600">
          {checklists?.length || 0} Checklisten gefunden
        </p>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mitarbeiter</TableHead>
              <TableHead>Filiale</TableHead>
              <TableHead>Bereich</TableHead>
              <TableHead>Schicht</TableHead>
              <TableHead>Aufgaben</TableHead>
              <TableHead>Datum</TableHead>
              <TableHead>Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {checklists?.map((checklist) => (
              <TableRow key={checklist.id}>
                <TableCell>
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-medium mr-3">
                      {checklist.employeeName.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium">{checklist.employeeName}</span>
                  </div>
                </TableCell>
                <TableCell>{checklist.store}</TableCell>
                <TableCell>
                  {categories?.find(c => c.id === checklist.categoryId)?.name || 'Unbekannt'}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {checklist.shiftType}
                  </Badge>
                </TableCell>
                <TableCell>
                  {Array.isArray(checklist.completedTasks) ? checklist.completedTasks.length : 0}
                </TableCell>
                <TableCell>
                  {format(new Date(checklist.submittedAt!), "dd.MM.yyyy HH:mm", { locale: de })}
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="sm">
                      <Eye size={16} className="text-primary" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteChecklist(checklist.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 size={16} className="text-red-600" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {!checklists?.length && (
          <div className="text-center py-8 text-gray-500">
            Keine Checklisten gefunden.
          </div>
        )}
      </div>
    </div>
  );
}