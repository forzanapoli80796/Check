import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Eye, Trash2, X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Checklist, Category, Task, InventoryItem } from "@shared/schema";
import { STORES } from "@/lib/types";

export default function SubmittedLists() {
  const [storeFilter, setStoreFilter] = useState<string>("alle");
  const [dateFilter, setDateFilter] = useState<string>("heute");
  const [selectedChecklist, setSelectedChecklist] = useState<Checklist | null>(null);
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

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ['/api/tasks']
  });

  const { data: inventoryItems = [] } = useQuery<InventoryItem[]>({
    queryKey: ['/api/inventory-items/checklist', selectedChecklist?.id],
    queryFn: async () => {
      if (!selectedChecklist?.id) return [];
      const response = await fetch(`/api/inventory-items/checklist/${selectedChecklist.id}`);
      return response.json();
    },
    enabled: !!selectedChecklist?.id
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

  const openChecklistDetails = (checklist: Checklist) => {
    setSelectedChecklist(checklist);
  };

  const closeChecklistDetails = () => {
    setSelectedChecklist(null);
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
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => openChecklistDetails(checklist)}
                    >
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

      {/* Checklist Details Dialog */}
      <Dialog open={!!selectedChecklist} onOpenChange={closeChecklistDetails}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Checklisten-Details</span>
              <Button variant="ghost" size="sm" onClick={closeChecklistDetails}>
                <X size={16} />
              </Button>
            </DialogTitle>
          </DialogHeader>

          {selectedChecklist && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm text-gray-600 mb-1">Mitarbeiter</h4>
                  <p className="font-medium">{selectedChecklist.employeeName}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-gray-600 mb-1">Filiale</h4>
                  <p>{selectedChecklist.store}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-gray-600 mb-1">Bereich</h4>
                  <p>{categories?.find(c => c.id === selectedChecklist.categoryId)?.name || 'Unbekannt'}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-gray-600 mb-1">Schicht</h4>
                  <Badge variant="secondary">{selectedChecklist.shiftType}</Badge>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-gray-600 mb-1">Eingereicht am</h4>
                  <p>{format(new Date(selectedChecklist.submittedAt!), "dd.MM.yyyy HH:mm", { locale: de })}</p>
                </div>
              </div>

              {/* Completed Tasks */}
              <div>
                <h4 className="font-medium mb-3">Erledigte Aufgaben</h4>
                <div className="space-y-2">
                  {Array.isArray(selectedChecklist.completedTasks) && selectedChecklist.completedTasks.length > 0 ? (
                    selectedChecklist.completedTasks.map((taskId) => {
                      const task = tasks.find(t => t.id === taskId);
                      return (
                        <div key={taskId} className="flex items-center space-x-2 p-2 bg-green-50 rounded-lg">
                          <CheckCircle2 size={16} className="text-green-600" />
                          <span className="text-sm">{task?.title || `Aufgabe ${taskId}`}</span>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-gray-500 text-sm">Keine Aufgaben erledigt</p>
                  )}
                </div>
              </div>

              {/* Inventory Items (if applicable) */}
              {inventoryItems && inventoryItems.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Inventur-Artikel</h4>
                  <div className="space-y-2">
                    {inventoryItems.map((item) => {
                      const task = tasks.find(t => t.id === item.taskId);
                      return (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                          <span className="text-sm font-medium">{task?.title || 'Unbekannter Artikel'}</span>
                          <div className="flex items-center space-x-1">
                            <span className="font-bold">{item.quantity}</span>
                            <span className="text-sm text-gray-600">{item.unit}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Uploaded Images (if applicable) */}
              {selectedChecklist.images && Array.isArray(selectedChecklist.images) && selectedChecklist.images.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Hochgeladene Bilder</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {selectedChecklist.images.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image}
                          alt={`Bild ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => window.open(image, '_blank')}
                        />
                        <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                          Bild {index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Klicken Sie auf ein Bild, um es in voller Größe zu öffnen.
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}